-- =====================================================================
--  Brady's Gridiron Dino Quest: online duels (step 2)
--  Paste into Supabase > SQL Editor and Run. Safe to run again: it
--  replaces the functions and reloads the question bank.
--  Nothing here is readable directly by the game; it can only call the
--  dq_duel_* functions below, and only as a signed-in (anonymous) player.
-- =====================================================================

create table if not exists public.dq_questions(
  id int primary key, cat text not null, d int not null, q text not null,
  a text not null, w text[] not null, x text not null default '');
create table if not exists public.dq_duels(
  id uuid primary key default gen_random_uuid(),
  a uuid not null, b uuid not null, a_name text, b_name text, room text,
  level text not null, stake int not null default 0, qids int[] not null,
  status text not null default 'pending', winner uuid,
  created_at timestamptz not null default now(), started_at timestamptz);
create table if not exists public.dq_answers(
  duel uuid not null references public.dq_duels(id) on delete cascade,
  player uuid not null, idx int not null, choice text, ok boolean not null,
  at timestamptz not null default now(), primary key(duel,player,idx));
create index if not exists dq_duels_a on public.dq_duels(a,created_at desc);
create index if not exists dq_duels_b on public.dq_duels(b,created_at desc);

alter table public.dq_questions enable row level security;
alter table public.dq_duels enable row level security;
alter table public.dq_answers enable row level security;
revoke all on public.dq_questions, public.dq_duels, public.dq_answers from anon, authenticated;

-- 15-second shot clock per question (+3s for network), 10 questions
create or replace function public.dq_clock() returns interval language sql immutable as $$ select interval '18 seconds' $$;
create or replace function public.dq_deadline() returns interval language sql immutable as $$ select interval '210 seconds' $$;

-- challenger creates a duel: the server picks 10 questions (easiest first, spread across categories,
-- skipping questions either player saw in their last 5 duels)
create or replace function public.dq_duel_create(p_opp uuid, p_level text, p_stake int, p_room text, p_a_name text, p_b_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_id uuid; v_q int[] := '{}'; v_used text[] := '{}'; v_rec int[]; v_d int; v_pick record; v_recent int[];
begin
  if v_me is null then raise exception 'not signed in'; end if;
  if p_opp is null or p_opp = v_me then raise exception 'bad opponent'; end if;
  if p_level not in ('mixed','rookie','pro','allpro','superfan') then raise exception 'bad level'; end if;
  if p_stake < 0 or p_stake > 100000 then raise exception 'bad stake'; end if;
  update dq_duels set status = 'expired' where a = v_me and status = 'pending';
  v_rec := case p_level when 'mixed' then array[1,1,1,2,2,2,3,3,4,4] when 'rookie' then array_fill(1, array[10])
    when 'pro' then array_fill(2, array[10]) when 'allpro' then array_fill(3, array[10]) else array_fill(4, array[10]) end;
  select coalesce(array_agg(x), '{}') into v_recent from (
    select unnest(qids) x from (select qids from dq_duels where (a in (v_me, p_opp) or b in (v_me, p_opp)) and status <> 'expired'
      order by created_at desc limit 5) s) t;
  foreach v_d in array v_rec loop
    select id, cat into v_pick from dq_questions where d = v_d and not (id = any(v_q)) and not (id = any(v_recent))
      order by (cat = any(v_used)), random() limit 1;
    if v_pick.id is null then
      select id, cat into v_pick from dq_questions where d = v_d and not (id = any(v_q)) order by (cat = any(v_used)), random() limit 1;
    end if;
    v_q := v_q || v_pick.id; v_used := v_used || v_pick.cat; v_pick := null;
  end loop;
  insert into dq_duels(a, b, level, stake, qids, room, a_name, b_name)
    values (v_me, p_opp, p_level, p_stake, v_q, left(p_room, 32), left(p_a_name, 12), left(p_b_name, 12)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.dq_duel_accept(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update dq_duels set status = 'active', started_at = now()
    where id = p_id and b = auth.uid() and status = 'pending' and created_at > now() - interval '2 minutes';
  if not found then raise exception 'challenge not available'; end if;
end $$;

create or replace function public.dq_duel_decline(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update dq_duels set status = 'declined' where id = p_id and auth.uid() in (a, b) and status = 'pending';
end $$;

-- the questions, without answers; both players get the same options in the same order
create or replace function public.dq_duel_questions(p_id uuid)
returns table(idx int, cat text, d int, q text, opts text[]) language plpgsql security definer set search_path = public as $$
declare v dq_duels;
begin
  select * into v from dq_duels where id = p_id;
  if v.id is null or auth.uid() not in (v.a, v.b) or v.status not in ('active','done') then raise exception 'not your duel'; end if;
  return query select (u.i - 1)::int, qq.cat, qq.d, qq.q,
    (select array_agg(o order by md5(p_id::text || qq.id::text || o)) from unnest(array[qq.a] || qq.w) o)
    from unnest(v.qids) with ordinality u(qid, i) join dq_questions qq on qq.id = u.qid order by u.i;
end $$;

-- answer question p_idx (in order, no redo). Late answers count as wrong.
create or replace function public.dq_duel_answer(p_id uuid, p_idx int, p_choice text)
returns table(ok boolean, answer text, expl text) language plpgsql security definer set search_path = public as $$
declare v dq_duels; v_me uuid := auth.uid(); v_n int; v_prev timestamptz; v_q dq_questions; v_ok boolean;
begin
  select * into v from dq_duels where id = p_id;
  if v.id is null or v_me not in (v.a, v.b) or v.status <> 'active' then raise exception 'not your duel'; end if;
  if now() > v.started_at + dq_deadline() then raise exception 'duel over'; end if;
  select count(*), max(at) into v_n, v_prev from dq_answers where duel = p_id and player = v_me;
  if p_idx <> v_n or p_idx < 0 or p_idx > 9 then raise exception 'out of order'; end if;
  select * into v_q from dq_questions where id = v.qids[p_idx + 1];
  v_ok := p_choice = v_q.a and now() <= coalesce(v_prev, v.started_at) + dq_clock();
  insert into dq_answers(duel, player, idx, choice, ok) values (p_id, v_me, p_idx, left(p_choice, 200), v_ok);
  return query select v_ok, v_q.a, v_q.x;
end $$;

-- scores so far; settles the duel once both have answered all 10 or time is up.
-- Ties go to whoever finished first; an exact tie has no winner (stakes returned).
create or replace function public.dq_duel_result(p_id uuid)
returns table(status text, a uuid, b uuid, a_score int, b_score int, a_n int, b_n int, winner uuid, stake int, level text)
language plpgsql security definer set search_path = public as $$
declare v dq_duels; sa int; sb int; na int; nb int; la timestamptz; lb timestamptz; w uuid;
begin
  select * into v from dq_duels where id = p_id;
  if v.id is null or auth.uid() not in (v.a, v.b) then raise exception 'not your duel'; end if;
  select count(*) filter (where x.ok), count(*), max(x.at) into sa, na, la from dq_answers x where x.duel = p_id and x.player = v.a;
  select count(*) filter (where x.ok), count(*), max(x.at) into sb, nb, lb from dq_answers x where x.duel = p_id and x.player = v.b;
  if v.status = 'active' and ((na = 10 and nb = 10) or now() > v.started_at + dq_deadline()) then
    if na < 10 then la := 'infinity'; end if; if nb < 10 then lb := 'infinity'; end if;
    w := case when sa > sb then v.a when sb > sa then v.b when la < lb then v.a when lb < la then v.b else null end;
    update dq_duels set status = 'done', winner = w where id = p_id and dq_duels.status = 'active';
    select * into v from dq_duels where id = p_id;
  end if;
  return query select v.status, v.a, v.b, sa, sb, na, nb, v.winner, v.stake, v.level;
end $$;

revoke execute on function public.dq_duel_create(uuid,text,int,text,text,text), public.dq_duel_accept(uuid), public.dq_duel_decline(uuid),
  public.dq_duel_questions(uuid), public.dq_duel_answer(uuid,int,text), public.dq_duel_result(uuid) from public, anon;
grant execute on function public.dq_duel_create(uuid,text,int,text,text,text), public.dq_duel_accept(uuid), public.dq_duel_decline(uuid),
  public.dq_duel_questions(uuid), public.dq_duel_answer(uuid,int,text), public.dq_duel_result(uuid) to authenticated;

-- the question bank (328 questions), reloaded on every run
delete from public.dq_questions;
insert into public.dq_questions(id, cat, d, q, a, w, x) values
(0,'rules',1,'How many points is a touchdown worth?','6',array['3','7','2'],'A touchdown is worth 6 points. The team then tries for 1 or 2 more points.'),
(1,'rules',1,'How many points is a field goal worth?','3',array['2','1','6'],'A field goal (kicking the ball through the uprights during a play) is worth 3 points.'),
(2,'rules',1,'How many points does the defense get for a safety?','2',array['1','3','6'],'A safety happens when the ball carrier is tackled in his own end zone. The defense scores 2 points and also gets the ball back by a kick.'),
(3,'rules',1,'After a touchdown, a kick through the uprights is worth how many points?','1',array['2','3','6'],'The "extra point" (point after touchdown) kick is worth 1 point.'),
(4,'rules',1,'After a touchdown, running or passing into the end zone again is worth...','2 points',array['1 point','3 points','6 points'],'A two-point conversion is a single play from close range. Succeed and you get 2 points instead of 1.'),
(5,'rules',1,'How many downs (tries) does the offense get to gain 10 yards?','4',array['3','5','6'],'The offense gets 4 downs. Gain 10 yards and you earn a fresh set of downs, called a "first down."'),
(6,'rules',1,'How many yards does the offense need to earn a new first down?','10',array['5','15','20'],'Ten yards. The officials use the "chains" on the sideline to measure it.'),
(7,'rules',1,'How many players does each team have on the field at one time?','11',array['9','10','12'],'Each side plays with 11 players. Having 12 on the field is a penalty!'),
(8,'rules',1,'How long is the field from goal line to goal line?','100 yards',array['80 yards','120 yards','50 yards'],'The playing field is 100 yards long, plus a 10-yard end zone at each end (120 yards total).'),
(9,'rules',1,'How many quarters are in an NFL game?','4',array['2','3','5'],'An NFL game has four quarters, with halftime after the second quarter.'),
(10,'rules',1,'How long is each quarter in an NFL game?','15 minutes',array['10 minutes','12 minutes','20 minutes'],'NFL quarters are 15 minutes of game clock. (High school quarters are usually 12.)'),
(11,'rules',1,'How deep is each end zone?','10 yards',array['5 yards','15 yards','20 yards'],'Each end zone is 10 yards deep. Getting the ball into it scores a touchdown.'),
(12,'rules',1,'What color is the penalty flag officials throw?','Yellow',array['Red','White','Blue'],'Officials throw a yellow flag to signal a penalty. Coaches throw a red flag to challenge a call.'),
(13,'rules',1,'What color flag does a head coach throw to challenge a call?','Red',array['Yellow','Green','Black'],'Coaches toss a red challenge flag to ask the officials to review a play on replay.'),
(14,'rules',1,'When a defender catches a pass thrown by the quarterback, it is called...','An interception',array['A fumble','A safety','A touchback'],'An interception means the defense caught the pass, and now they get the ball.'),
(15,'rules',1,'When a ball carrier drops the ball before he is down, it is a...','Fumble',array['Interception','Punt','Sack'],'A fumble is a loose ball. Either team can recover it.'),
(16,'rules',1,'What is it called when the defense tackles the QB behind the line of scrimmage before he throws?','A sack',array['A blitz','A safety','A punt'],'Tackling the quarterback behind the line of scrimmage before he passes is a sack.'),
(17,'rules',1,'An interception returned for a touchdown is nicknamed a...','Pick-six',array['Hail Mary','Pick-two','Touchback'],'"Pick" means interception, and "six" is the 6 points for the touchdown.'),
(18,'rules',1,'What happens to the game clock after an incomplete pass?','It stops',array['It keeps running','It resets to 15:00','It adds 10 seconds'],'An incomplete pass stops the clock until the next snap.'),
(19,'rules',2,'How many feet must an NFL receiver get in bounds for a catch?','2',array['1','3','None, just a hand'],'NFL receivers need two feet (or another body part like a knee) down in bounds. In college, one foot is enough.'),
(20,'rules',2,'Offensive holding is usually a penalty of how many yards?','10',array['5','15','20'],'Offensive holding costs 10 yards. Linemen can block but cannot grab and hold defenders.'),
(21,'rules',2,'An offensive player moving before the snap is called a...','False start',array['Offside','Holding','Delay of game'],'A false start is a 5-yard penalty on the offense for moving before the ball is snapped.'),
(22,'rules',2,'A defender crossing the line of scrimmage before the snap is called...','Offside',array['False start','Clipping','Face mask'],'Offside is a 5-yard penalty on the defense.'),
(23,'rules',2,'Grabbing an opponent''s face mask is a penalty of how many yards?','15',array['5','10','20'],'Face mask penalties are 15 yards because they are dangerous.'),
(24,'rules',2,'Roughing the passer is a penalty of how many yards?','15',array['5','10','25'],'Hitting the QB late or too hard is roughing the passer: 15 yards and an automatic first down.'),
(25,'rules',2,'If the offense does not snap the ball before the play clock hits 0, it is...','Delay of game',array['False start','Intentional grounding','Encroachment'],'Delay of game is a 5-yard penalty on the offense.'),
(26,'rules',2,'How many timeouts does each team get per half?','3',array['2','4','5'],'Each team gets three timeouts in each half.'),
(27,'rules',2,'When does the two-minute warning happen?','2:00 left in the 2nd and 4th quarters',array['2:00 left in every quarter','At halftime','2:00 left in the game only'],'The game stops at the two-minute mark of the 2nd and 4th quarters.'),
(28,'rules',2,'What does a returner signal by waving his arm over his head on a punt?','A fair catch',array['A timeout','A touchback','He wants a penalty'],'A fair catch means he will catch the ball, nobody may hit him, and he will not run it back.'),
(29,'rules',2,'On an onside kick, how far must the ball travel before the kicking team can recover it?','10 yards',array['5 yards','15 yards','20 yards'],'The ball must go 10 yards (or be touched by the receiving team) before the kicking team can legally recover it.'),
(30,'rules',2,'What decides which team gets the ball first at the start of the game?','A coin toss',array['Home team always chooses','The last game''s winner','A rock-paper-scissors match'],'Team captains meet at midfield for the coin toss before kickoff.'),
(31,'rules',2,'What is the "line of scrimmage"?','The spot where the ball sits before each play',array['The 50-yard line','The goal line','The sideline'],'The line of scrimmage is an imaginary line through the ball. Neither team may cross it before the snap.'),
(32,'rules',2,'Pass interference on the DEFENSE in the NFL gives the offense...','The ball at the spot of the foul and a first down',array['5 yards only','A free touchdown','A replay of the down'],'Defensive pass interference is a "spot foul." The ball moves to where the foul happened, with a first down.'),
(33,'rules',3,'How wide is an NFL field?','53 1/3 yards',array['50 yards','60 yards','45 yards'],'An NFL field is 160 feet wide, which is 53 1/3 yards.'),
(34,'rules',3,'How long is the NFL play clock after a normal play ends?','40 seconds',array['25 seconds','30 seconds','60 seconds'],'After most plays the offense has 40 seconds to snap. After certain stoppages it is 25 seconds.'),
(35,'rules',3,'How many officials are on a standard NFL officiating crew?','7',array['5','6','9'],'An NFL crew has 7 officials, led by the referee in the white hat.'),
(36,'rules',3,'How long is a regular-season NFL overtime period?','10 minutes',array['15 minutes','5 minutes','Unlimited'],'Regular-season overtime is 10 minutes. Playoff overtime periods are 15 minutes.'),
(37,'rules',3,'A QB throwing the ball away to avoid a sack with no receiver nearby, while in the pocket, is called...','Intentional grounding',array['Delay of game','Illegal forward pass','Spiking'],'Intentional grounding costs a loss of down plus yards, and it is a safety if the QB was in his own end zone.'),
(38,'rules',3,'How far apart are the NFL goalpost uprights?','18 feet, 6 inches',array['10 feet','24 feet','30 feet'],'NFL uprights are 18 feet 6 inches apart, and the crossbar is 10 feet high.'),
(39,'rules',3,'How many challenges does a coach start each game with?','2',array['1','3','Unlimited'],'Coaches get 2 challenges, plus a third if both of the first two are successful.'),
(40,'rules',3,'Who wears the WHITE hat on an NFL officiating crew?','The referee (crew chief)',array['The umpire','The line judge','The back judge'],'The referee is the crew chief and wears a white hat. The others wear black hats.'),
(41,'strategy',1,'Which player usually throws passes for the offense?','Quarterback',array['Center','Linebacker','Punter'],'The quarterback (QB) leads the offense, calls plays in the huddle, and throws most passes.'),
(42,'strategy',1,'Which player snaps the ball to the quarterback?','Center',array['Guard','Tight end','Fullback'],'The center is in the middle of the offensive line and snaps the ball to start each play.'),
(43,'strategy',1,'Whose main job is to catch passes and run fast routes?','Wide receiver',array['Offensive tackle','Defensive end','Kicker'],'Wide receivers line up wide and run routes to get open for passes.'),
(44,'strategy',1,'Which position is mostly used to run the ball?','Running back',array['Center','Safety','Long snapper'],'The running back (or halfback) takes handoffs and runs the ball.'),
(45,'strategy',1,'What is the main job of the offensive line?','Block to protect the QB and open running lanes',array['Catch passes','Kick field goals','Intercept passes'],'The five offensive linemen (center, two guards, two tackles) block for the team.'),
(46,'strategy',1,'Which player usually kicks field goals and extra points?','Kicker',array['Punter','Quarterback','Holder'],'The kicker (or "placekicker") kicks field goals, extra points, and kickoffs.'),
(47,'strategy',1,'On 4th down far from the end zone, teams usually...','Punt',array['Kick an extra point','Take a safety','Spike the ball'],'Punting kicks the ball far away so the other team starts its drive deep in its own territory.'),
(48,'strategy',1,'Which defenders mainly cover wide receivers?','Cornerbacks',array['Defensive tackles','Centers','Fullbacks'],'Cornerbacks line up across from receivers to cover them and break up passes.'),
(49,'strategy',1,'What is the "red zone"?','Inside the opponent''s 20-yard line',array['Your own end zone','The area behind the bench','Midfield'],'The red zone is from the opponent''s 20-yard line to the goal line, where scoring chances are best.'),
(50,'strategy',1,'A long, desperate pass into the end zone at the end of a half is called a...','Hail Mary',array['Screen pass','Draw play','Quarterback sneak'],'A Hail Mary is a deep heave hoping someone catches it. The name became famous in 1975 with Cowboys QB Roger Staubach.'),
(51,'strategy',1,'What is a "turnover"?','When the offense loses the ball by fumble or interception',array['Switching sides at halftime','A punt','A coin toss'],'Turnovers (fumbles lost and interceptions) give the other team the ball and often decide games.'),
(52,'strategy',1,'Which defenders play in the middle of the defense and tackle runners or cover passes?','Linebackers',array['Guards','Kickers','Wide receivers'],'Linebackers line up behind the defensive line. They tackle, cover, and sometimes rush the QB.'),
(53,'strategy',2,'What is a "blitz"?','Sending extra defenders to rush the QB',array['A fake punt','A long pass','A type of penalty'],'A blitz sends linebackers or defensive backs after the QB, hoping for a sack.'),
(54,'strategy',2,'When the QB changes the play at the line of scrimmage, it is called an...','Audible',array['Huddle','Option','Encroachment'],'An audible is a play change called out loud at the line after the QB reads the defense.'),
(55,'strategy',2,'What is "play action"?','Faking a handoff, then passing',array['A trick kickoff','Running out of bounds','Spiking the ball'],'Play action fakes a run to fool the defense, then the QB throws.'),
(56,'strategy',2,'In the "shotgun" formation, the QB lines up...','Several yards behind the center',array['Directly under center','As a wide receiver','In the backfield next to the kicker'],'In the shotgun the QB stands about 5 to 7 yards back, giving him more time to see the field.'),
(57,'strategy',2,'What is the "pocket"?','The protected area the O-line forms around the QB',array['A trick play','The end zone','The kicker''s practice net'],'The pocket is the space the blockers create so the quarterback can throw.'),
(58,'strategy',2,'A tight end usually...','Blocks AND catches passes',array['Only kicks','Only plays defense','Only snaps the ball'],'Tight ends line up next to the offensive line. They are part blocker, part receiver.'),
(59,'strategy',2,'Which defenders are usually the deepest, protecting against long passes?','Safeties',array['Nose tackles','Defensive ends','Guards'],'Safeties line up deep in the secondary as the last line of defense.'),
(60,'strategy',2,'What is "special teams"?','The units on the field for kicks and punts',array['The best players only','The coaching staff','The team''s practice squad'],'Special teams cover kickoffs, punts, field goals, and extra points.'),
(61,'strategy',2,'Kneeling on the ball to run out the clock is called the...','Victory formation',array['Hail Mary','Wildcat','Prevent defense'],'When winning late, the QB takes a knee in the "victory formation" to safely run out the clock.'),
(62,'strategy',2,'Why do teams run a "two-minute drill"?','To move the ball quickly before time runs out',array['To rest players','To practice punting','To warm up at halftime'],'The two-minute drill uses quick plays, the sidelines, and timeouts to score with little time left.'),
(63,'strategy',2,'Who usually holds the ball for the kicker on a field goal?','The punter (holder)',array['The center','The quarterback''s backup only','A referee'],'On most NFL teams, the punter serves as the holder on field goals and extra points.'),
(64,'strategy',3,'A "nickel" defense uses how many defensive backs?','5',array['4','6','3'],'Nickel = 5 defensive backs (like a nickel is 5 cents). "Dime" defense uses 6.'),
(65,'strategy',3,'For a right-handed QB, which lineman protects his "blind side"?','Left tackle',array['Right guard','Center','Right tackle'],'A right-handed QB faces right when he throws, so the left tackle guards the side he cannot see.'),
(66,'strategy',3,'What is a "screen pass"?','A short pass to a player behind a wall of blockers',array['A pass thrown out of bounds','A deep pass down the sideline','A pass to the kicker'],'Linemen let rushers through, then the QB flips a short pass to a back with blockers out in front.'),
(67,'strategy',3,'Offenses that skip the huddle to go fast are running a...','No-huddle / hurry-up offense',array['Prevent defense','Wishbone','Victory formation'],'No-huddle offense keeps the defense from substituting and catching its breath.'),
(68,'strategy',3,'A "QB sneak" is when the quarterback...','Takes the snap and pushes straight ahead for a short gain',array['Throws a backward pass','Punts on 3rd down','Lines up as a receiver'],'The sneak is used on short-yardage downs. The Eagles'' "Tush Push" version became famous in the 2020s.'),
(69,'strategy',3,'What does a "long snapper" do?','Snaps the ball on punts and field goals',array['Throws long passes','Kicks kickoffs','Returns punts'],'Long snappers are specialists who snap accurately 7 to 15 yards back on kicking plays.'),
(70,'history',1,'Which team won the first Super Bowl in January 1967?','Green Bay Packers',array['Kansas City Chiefs','New York Jets','Dallas Cowboys'],'The Packers beat the Chiefs 35-10 in Super Bowl I.'),
(71,'history',1,'The Super Bowl trophy is named after which famous coach?','Vince Lombardi',array['George Halas','Don Shula','Bill Belichick'],'The Vince Lombardi Trophy honors the Packers coach who won the first two Super Bowls.'),
(72,'history',1,'Which QB has won the most Super Bowls (7)?','Tom Brady',array['Joe Montana','Peyton Manning','Terry Bradshaw'],'Tom Brady won 6 with the Patriots and 1 with the Buccaneers.'),
(73,'history',1,'The Pro Football Hall of Fame is located in which city?','Canton, Ohio',array['Green Bay, Wisconsin','Dallas, Texas','New York, New York'],'The Hall of Fame is in Canton, where the NFL was founded in 1920.'),
(74,'history',1,'Which two teams play at home on Thanksgiving Day every year?','Detroit Lions and Dallas Cowboys',array['Bears and Packers','Giants and Jets','Chiefs and Raiders'],'The Lions (since 1934) and Cowboys (since 1966) host Thanksgiving games every year.'),
(75,'history',1,'In what month is the Super Bowl played now?','February',array['January','December','March'],'The Super Bowl is now played on a Sunday in early February.'),
(76,'history',1,'Which team won Super Bowl LIX in February 2025?','Philadelphia Eagles',array['Kansas City Chiefs','Buffalo Bills','San Francisco 49ers'],'The Eagles beat the Chiefs 40-22 in New Orleans. Jalen Hurts was named MVP.'),
(77,'history',1,'Which team won Super Bowl LX in February 2026?','Seattle Seahawks',array['New England Patriots','Philadelphia Eagles','Kansas City Chiefs'],'Seattle beat New England 29-13 at Levi''s Stadium. RB Kenneth Walker III was MVP.'),
(78,'history',2,'Which team had the only perfect season (17-0) including the Super Bowl?','1972 Miami Dolphins',array['2007 New England Patriots','1985 Chicago Bears','1989 San Francisco 49ers'],'The 1972 Dolphins went 17-0. The 2007 Patriots went 16-0 but lost the Super Bowl.'),
(79,'history',2,'"The Immaculate Reception" (1972) was caught by which Steelers running back?','Franco Harris',array['Jerome Bettis','Rocky Bleier','Lynn Swann'],'Franco Harris scooped a deflected pass off his shoe tops and scored to beat the Raiders.'),
(80,'history',2,'"The Catch" in the 1981 season NFC title game was Joe Montana to...','Dwight Clark',array['Jerry Rice','Roger Craig','John Taylor'],'Dwight Clark''s leaping catch beat the Cowboys and sent the 49ers to their first Super Bowl.'),
(81,'history',2,'Which Jets QB "guaranteed" a win before Super Bowl III, then delivered?','Joe Namath',array['Joe Montana','Johnny Unitas','Ken Stabler'],'"Broadway Joe" Namath''s Jets upset the Baltimore Colts, proving the AFL could compete.'),
(82,'history',2,'Which two franchises are tied for the most Super Bowl wins with 6 each?','Patriots and Steelers',array['Cowboys and 49ers','Packers and Giants','Chiefs and Broncos'],'New England and Pittsburgh each have 6. The 49ers and Cowboys have 5.'),
(83,'history',2,'In Super Bowl LI, the Patriots came back from 28-3 down to beat which team?','Atlanta Falcons',array['Seattle Seahawks','Philadelphia Eagles','Los Angeles Rams'],'It was the biggest comeback in Super Bowl history and the first Super Bowl to go to overtime.'),
(84,'history',2,'The "Helmet Catch" by David Tyree helped which team stop the 18-0 Patriots?','New York Giants',array['New York Jets','Philadelphia Eagles','Baltimore Ravens'],'In Super Bowl XLII, Eli Manning escaped a sack and Tyree pinned the ball to his helmet.'),
(85,'history',2,'The "Philly Special" trick play, where QB Nick Foles caught a TD, happened in which Super Bowl?','Super Bowl LII',array['Super Bowl LIX','Super Bowl XXXIX','Super Bowl LVII'],'The Eagles beat the Patriots 41-33 for their first Super Bowl title.'),
(86,'history',2,'Which team lost four Super Bowls in a row in the early 1990s?','Buffalo Bills',array['Minnesota Vikings','Denver Broncos','Cincinnati Bengals'],'The Bills lost Super Bowls XXV through XXVIII.'),
(87,'history',2,'Who is the NFL''s all-time leader in career rushing yards?','Emmitt Smith',array['Walter Payton','Barry Sanders','Jim Brown'],'Emmitt Smith ran for 18,355 yards, mostly with the Cowboys.'),
(88,'history',2,'Who is the NFL''s all-time leader in career receiving yards?','Jerry Rice',array['Randy Moss','Larry Fitzgerald','Terrell Owens'],'Jerry Rice had 22,895 receiving yards, far ahead of everyone else.'),
(89,'history',2,'Which famous Packers coach led the team to wins in Super Bowls I and II?','Vince Lombardi',array['Mike McCarthy','Curly Lambeau','Bart Starr'],'Lombardi''s Packers won five NFL titles in the 1960s, including the first two Super Bowls.'),
(90,'history',2,'Which coach has the most wins in NFL history?','Don Shula',array['Bill Belichick','George Halas','Tom Landry'],'Don Shula won 347 games coaching the Baltimore Colts and Miami Dolphins.'),
(91,'history',2,'Which team won back-to-back Super Bowls LVII and LVIII?','Kansas City Chiefs',array['Philadelphia Eagles','San Francisco 49ers','Los Angeles Rams'],'The Chiefs beat the Eagles in LVII and the 49ers in overtime in LVIII.'),
(92,'history',2,'What color jacket do new Hall of Famers receive?','Gold',array['Green','Red','Silver'],'Hall of Fame inductees receive the famous gold jacket.'),
(93,'history',3,'In what year was the NFL founded (originally the APFA)?','1920',array['1869','1946','1966'],'The league was founded in Canton, Ohio, in 1920 and renamed the NFL in 1922.'),
(94,'history',3,'In what year did the AFL and NFL officially merge into one league?','1970',array['1960','1967','1982'],'The merger created the AFC and NFC conferences we know today.'),
(95,'history',3,'The 1967 "Ice Bowl" NFL Championship was played in Green Bay against which team?','Dallas Cowboys',array['Chicago Bears','Minnesota Vikings','Baltimore Colts'],'It was about -15°F at kickoff. Bart Starr''s QB sneak won it for the Packers.'),
(96,'history',3,'Who was the MVP of Super Bowl I?','Bart Starr',array['Joe Namath','Johnny Unitas','Len Dawson'],'Packers QB Bart Starr was MVP of both Super Bowls I and II.'),
(97,'history',3,'Which Chiefs owner came up with the name "Super Bowl"?','Lamar Hunt',array['Al Davis','Art Rooney','Jerry Jones'],'Lamar Hunt reportedly got the idea from his kids'' Super Ball toy.'),
(98,'history',3,'"Monday Night Football" first aired in what year?','1970',array['1955','1985','1999'],'MNF started on ABC in 1970 and is one of the longest-running shows in TV history.'),
(99,'history',3,'The "Minneapolis Miracle" (Jan 2018) was a walk-off TD catch by which Viking?','Stefon Diggs',array['Adam Thielen','Randy Moss','Cris Carter'],'Diggs caught the pass, stayed in bounds, and scored on the final play to beat the Saints.'),
(100,'history',3,'The "Music City Miracle" kickoff-return lateral beat which team in January 2000?','Buffalo Bills',array['Indianapolis Colts','Jacksonville Jaguars','Miami Dolphins'],'The Titans'' Frank Wycheck lateraled to Kevin Dyson, who ran it back for the win.'),
(101,'history',3,'Which team did Peyton Manning win his SECOND Super Bowl with?','Denver Broncos',array['Indianapolis Colts','New York Giants','Tennessee Titans'],'He won Super Bowl XLI with the Colts and Super Bowl 50 with the Broncos.'),
(102,'history',3,'Which RB set the single-season rushing record of 2,105 yards in 1984?','Eric Dickerson',array['Barry Sanders','Adrian Peterson','O.J. Simpson'],'Eric Dickerson set it with the Los Angeles Rams.'),
(103,'history',3,'Which QB threw a record 55 touchdown passes in the 2013 season?','Peyton Manning',array['Tom Brady','Patrick Mahomes','Drew Brees'],'Peyton Manning threw 55 TD passes for the Broncos in 2013.'),
(104,'players',1,'Patrick Mahomes has won Super Bowls as QB of which team?','Kansas City Chiefs',array['Buffalo Bills','Dallas Cowboys','Philadelphia Eagles'],'Mahomes has led the Chiefs to Super Bowl wins in LIV, LVII, and LVIII.'),
(105,'players',1,'Tom Brady won six of his Super Bowls with which team?','New England Patriots',array['Tampa Bay Buccaneers','New York Giants','Miami Dolphins'],'Brady won 6 with the Patriots, then won Super Bowl LV with the Buccaneers.'),
(106,'players',1,'Travis Kelce became a superstar at which position for the Chiefs?','Tight end',array['Quarterback','Kicker','Cornerback'],'Kelce is one of the greatest tight ends ever, known for his chemistry with Mahomes.'),
(107,'players',1,'Josh Allen won the 2024 MVP award as QB of which team?','Buffalo Bills',array['Miami Dolphins','New York Jets','Detroit Lions'],'Allen won NFL MVP for the 2024 season with the Bills.'),
(108,'players',1,'Lamar Jackson, a two-time MVP, plays quarterback for which team?','Baltimore Ravens',array['Pittsburgh Steelers','Cleveland Browns','Atlanta Falcons'],'Lamar Jackson won MVP in 2019 (unanimously) and 2023 with the Ravens.'),
(109,'players',1,'Jalen Hurts was Super Bowl LIX MVP for which team?','Philadelphia Eagles',array['Kansas City Chiefs','Washington Commanders','Dallas Cowboys'],'Hurts ran and threw for touchdowns as the Eagles won 40-22.'),
(110,'players',1,'Jerry Rice is famous as a receiver for which team?','San Francisco 49ers',array['Dallas Cowboys','Green Bay Packers','Chicago Bears'],'Rice won three Super Bowls with the 49ers and holds most major receiving records.'),
(111,'players',1,'Walter Payton, nicknamed "Sweetness," starred for which team?','Chicago Bears',array['Detroit Lions','Green Bay Packers','Dallas Cowboys'],'Payton was a Bears legend. The NFL''s Man of the Year award is named after him.'),
(112,'players',1,'What position did Peyton Manning play?','Quarterback',array['Running back','Linebacker','Wide receiver'],'Peyton Manning was a 5-time MVP quarterback for the Colts and Broncos.'),
(113,'players',2,'Which team drafted QB Joe Burrow #1 overall in 2020?','Cincinnati Bengals',array['Cleveland Browns','Detroit Lions','Miami Dolphins'],'Burrow won a national title at LSU, then led the Bengals to Super Bowl LVI.'),
(114,'players',2,'Which team drafted WR Justin Jefferson in 2020?','Minnesota Vikings',array['Green Bay Packers','LSU Tigers','New Orleans Saints'],'Jefferson became one of the NFL''s top receivers with the Vikings.'),
(115,'players',2,'Which team drafted QB C.J. Stroud in 2023?','Houston Texans',array['Carolina Panthers','Indianapolis Colts','Chicago Bears'],'Stroud won Offensive Rookie of the Year with the Texans in 2023.'),
(116,'players',2,'Saquon Barkley ran for over 2,000 yards in 2024 for which team?','Philadelphia Eagles',array['New York Giants','Dallas Cowboys','Detroit Lions'],'Barkley ran for 2,005 yards in his first Eagles season, then won the Super Bowl.'),
(117,'players',2,'Which 49ers QB was "Mr. Irrelevant," the final pick of the 2022 draft?','Brock Purdy',array['Trey Lance','Jimmy Garoppolo','Sam Darnold'],'Purdy went from the last pick to leading the 49ers to Super Bowl LVIII.'),
(118,'players',2,'Which Lions RB retired suddenly in 1999 while near the top of the rushing record list?','Barry Sanders',array['Emmitt Smith','Jamal Lewis','Curtis Martin'],'Barry Sanders, famous for his jukes, retired at age 30.'),
(119,'players',2,'Which Broncos QB led the famous comeback drive known as "The Drive"?','John Elway',array['Peyton Manning','Tim Tebow','Craig Morton'],'In the 1986 season AFC title game, Elway led a 98-yard drive to tie the Browns.'),
(120,'players',2,'Dan Marino set many passing records with which team?','Miami Dolphins',array['New York Jets','Buffalo Bills','San Diego Chargers'],'Marino played all 17 seasons with the Dolphins.'),
(121,'players',2,'Deion "Prime Time" Sanders also played which other pro sport?','Baseball',array['Basketball','Hockey','Soccer'],'Deion played in both the NFL and Major League Baseball. Bo Jackson did too.'),
(122,'players',2,'Ray Lewis was a legendary linebacker for which team?','Baltimore Ravens',array['Pittsburgh Steelers','New York Giants','Chicago Bears'],'Ray Lewis was MVP of Super Bowl XXXV and won another title in his final season.'),
(123,'players',2,'Lawrence Taylor ("LT") changed defense as a linebacker for which team?','New York Giants',array['Dallas Cowboys','Washington','Los Angeles Rams'],'LT was so dominant at rushing the QB that teams changed how they blocked.'),
(124,'players',2,'Who caught the 2007 record of 23 touchdown passes in one season?','Randy Moss',array['Jerry Rice','Calvin Johnson','Tyreek Hill'],'Moss caught 23 TDs from Tom Brady for the 16-0 Patriots.'),
(125,'players',2,'Which Lions receiver nicknamed "Megatron" set the single-season receiving record in 2012?','Calvin Johnson',array['Herman Moore','Amon-Ra St. Brown','Barry Sanders'],'Calvin Johnson had 1,964 receiving yards in 2012.'),
(126,'players',2,'Drew Brees led which team to win Super Bowl XLIV?','New Orleans Saints',array['San Diego Chargers','Indianapolis Colts','Atlanta Falcons'],'The Saints beat the Colts, and Brees was named MVP.'),
(127,'players',2,'Russell Wilson won Super Bowl XLVIII as QB of which team?','Seattle Seahawks',array['Denver Broncos','Pittsburgh Steelers','New York Giants'],'The Seahawks crushed the Broncos 43-8.'),
(128,'players',2,'J.J. Watt, a three-time Defensive Player of the Year, starred for which team?','Houston Texans',array['Pittsburgh Steelers','Arizona Cardinals','Wisconsin Badgers'],'J.J. Watt starred in Houston. His brother T.J. Watt plays for the Steelers.'),
(129,'players',2,'In what round was Tom Brady drafted in 2000?','6th round',array['1st round','3rd round','Undrafted'],'Brady was pick #199, proof that great players can come from anywhere.'),
(130,'players',3,'Which Giants defensive end set the single-season sack record (22.5) in 2001?','Michael Strahan',array['Reggie White','Bruce Smith','Lawrence Taylor'],'Strahan''s record was tied by T.J. Watt in 2021.'),
(131,'players',3,'Which team drafted Micah Parsons in 2021?','Dallas Cowboys',array['Philadelphia Eagles','Green Bay Packers','Penn State Nittany Lions'],'Parsons was the 2021 Defensive Rookie of the Year with the Cowboys.'),
(132,'players',3,'Derrick Henry ran for 2,027 yards in 2020 with which team?','Tennessee Titans',array['Baltimore Ravens','Alabama Crimson Tide','Houston Texans'],'Henry became just the 8th player with a 2,000-yard season.'),
(133,'players',3,'Tyreek Hill is famous for his speed. What is his nickname?','Cheetah',array['Megatron','Beast Mode','Prime Time'],'"Cheetah" Hill is one of the fastest players in NFL history.'),
(134,'players',3,'Which RB was nicknamed "Beast Mode"?','Marshawn Lynch',array['Derrick Henry','Adrian Peterson','Jerome Bettis'],'Lynch''s 2011 "Beast Quake" run for Seattle made fans shake the ground.'),
(135,'players',3,'Aaron Donald was a dominant defensive tackle for which team?','Los Angeles Rams',array['Pittsburgh Steelers','Philadelphia Eagles','Arizona Cardinals'],'Donald won 3 Defensive Player of the Year awards and Super Bowl LVI with the Rams.'),
(136,'players',3,'Which Patriots tight end was nicknamed "Gronk"?','Rob Gronkowski',array['Travis Kelce','Tony Gonzalez','Aaron Hernandez'],'Gronk won 4 Super Bowls, 3 with New England and 1 with Tampa Bay.'),
(137,'players',3,'Which RB was Super Bowl LX MVP for the Seahawks?','Kenneth Walker III',array['Zach Charbonnet','Marshawn Lynch','Saquon Barkley'],'Walker ran for 135 yards. He was the first RB to win Super Bowl MVP in nearly 30 years.'),
(138,'teams',1,'How many teams are in the NFL?','32',array['30','28','36'],'There are 32 NFL teams, split into the AFC and NFC.'),
(139,'teams',1,'What are the NFL''s two conferences?','AFC and NFC',array['East and West','NFL and AFL','National and American Leagues'],'AFC = American Football Conference, NFC = National Football Conference.'),
(140,'teams',1,'Which city do the Packers play in?','Green Bay',array['Milwaukee','Chicago','Minneapolis'],'Green Bay, Wisconsin, is the NFL''s smallest market, and the team is owned by its fans!'),
(141,'teams',1,'Which team plays in Kansas City?','Chiefs',array['Royals','Broncos','Rams'],'The Kansas City Chiefs play at Arrowhead Stadium in Missouri.'),
(142,'teams',1,'What is the name of Pittsburgh''s NFL team?','Steelers',array['Pirates','Penguins','Eagles'],'The Steelers are named after the city''s steel industry.'),
(143,'teams',1,'What is the name of Philadelphia''s NFL team?','Eagles',array['Phillies','Falcons','Ravens'],'The Philadelphia Eagles play at Lincoln Financial Field.'),
(144,'teams',1,'What is the name of Chicago''s NFL team?','Bears',array['Bulls','Cubs','Lions'],'The Chicago Bears are one of the NFL''s founding franchises.'),
(145,'teams',1,'What is the name of Dallas''s NFL team?','Cowboys',array['Texans','Mavericks','Rangers'],'The Cowboys are nicknamed "America''s Team."'),
(146,'teams',1,'The Bills play near which city?','Buffalo, New York',array['Boston','New York City','Cleveland'],'The Bills play in Orchard Park, just outside Buffalo.'),
(147,'teams',1,'Which team plays in Seattle?','Seahawks',array['Sounders','Ravens','Mariners'],'Seattle fans are called the "12th Man" because they are so loud.'),
(148,'teams',1,'Which team plays in Miami?','Dolphins',array['Marlins','Heat','Jaguars'],'The Dolphins have the NFL''s only perfect season (1972).'),
(149,'teams',1,'Which team plays in Detroit?','Lions',array['Tigers','Pistons','Bears'],'The Detroit Lions host a game every Thanksgiving.'),
(150,'teams',2,'The Patriots play in Foxborough, in which state?','Massachusetts',array['Connecticut','Rhode Island','New Hampshire'],'The New England Patriots play at Gillette Stadium in Foxborough, MA.'),
(151,'teams',2,'The New York Giants and Jets actually play their home games in which state?','New Jersey',array['New York','Connecticut','Pennsylvania'],'Both teams share MetLife Stadium in East Rutherford, New Jersey.'),
(152,'teams',2,'The Raiders moved to Las Vegas in 2020 from which city?','Oakland',array['Los Angeles','San Diego','Phoenix'],'The Raiders played in Oakland (twice) and Los Angeles before Las Vegas.'),
(153,'teams',2,'Which team plays in Charlotte, North Carolina?','Carolina Panthers',array['Atlanta Falcons','Jacksonville Jaguars','Tennessee Titans'],'The Panthers started play in 1995.'),
(154,'teams',2,'Which team plays in Nashville?','Tennessee Titans',array['Memphis Grizzlies','Atlanta Falcons','Houston Texans'],'The Titans used to be the Houston Oilers before moving to Tennessee.'),
(155,'teams',2,'Which team plays in Tampa?','Buccaneers',array['Dolphins','Jaguars','Rays'],'The Bucs won Super Bowls XXXVII and LV.'),
(156,'teams',2,'Which team plays in Minneapolis?','Minnesota Vikings',array['Green Bay Packers','Minnesota Twins','Chicago Bears'],'The Vikings play at U.S. Bank Stadium.'),
(157,'teams',2,'The Colts moved to Indianapolis in 1984 from which city?','Baltimore',array['Cleveland','St. Louis','Houston'],'The Colts famously moved overnight. Baltimore later got the Ravens.'),
(158,'teams',2,'The Baltimore Ravens are named after a poem by which author?','Edgar Allan Poe',array['Mark Twain','Robert Frost','Walt Whitman'],'Poe wrote "The Raven" and is buried in Baltimore.'),
(159,'teams',2,'The San Francisco 49ers are named after...','The 1849 Gold Rush',array['49 original players','Highway 49','The year they were founded'],'"Forty-niners" were miners who rushed to California in 1849.'),
(160,'teams',2,'Which division are the Dallas Cowboys in?','NFC East',array['NFC South','AFC East','NFC West'],'The NFC East has the Cowboys, Eagles, Giants, and Commanders.'),
(161,'teams',2,'Which division are the Kansas City Chiefs in?','AFC West',array['AFC North','NFC West','AFC South'],'The AFC West has the Chiefs, Broncos, Raiders, and Chargers.'),
(162,'teams',2,'Which division are the Green Bay Packers in?','NFC North',array['NFC East','AFC North','NFC Central'],'The NFC North has the Packers, Bears, Lions, and Vikings.'),
(163,'teams',2,'Which division are the Pittsburgh Steelers in?','AFC North',array['AFC East','NFC North','AFC Central'],'The AFC North has the Steelers, Ravens, Browns, and Bengals.'),
(164,'teams',2,'The Green Bay Packers are special because they are...','Owned by their fans (community-owned)',array['Owned by the city of Chicago','The oldest team in sports','Never moved to a new stadium'],'The Packers are the only major U.S. pro team owned by its community shareholders.'),
(165,'teams',3,'Which team is the oldest continuously run franchise, founded in Chicago in 1898?','Arizona Cardinals',array['Chicago Bears','Green Bay Packers','Detroit Lions'],'The Cardinals started in Chicago, moved to St. Louis, then to Arizona in 1988.'),
(166,'teams',3,'Before moving to Tennessee, the Titans were called the...','Houston Oilers',array['Memphis Showboats','Houston Texans','Nashville Kats'],'The Oilers moved in 1997 and became the Titans in 1999.'),
(167,'teams',3,'The Rams moved back to Los Angeles in 2016 from which city?','St. Louis',array['Anaheim','Oakland','San Diego'],'The Rams won Super Bowl XXXIV in St. Louis and Super Bowl LVI back in LA.'),
(168,'teams',3,'The Chargers moved to Los Angeles in 2017 from which city?','San Diego',array['Oakland','Phoenix','Sacramento'],'The Chargers now share SoFi Stadium with the Rams.'),
(169,'teams',3,'Which division are the Houston Texans in?','AFC South',array['AFC West','NFC South','AFC North'],'The AFC South has the Texans, Colts, Jaguars, and Titans.'),
(170,'teams',3,'Which team was formerly known as the "Washington Football Team"?','Washington Commanders',array['Baltimore Ravens','Philadelphia Eagles','New York Giants'],'The team became the Commanders in 2022.'),
(171,'teams',3,'How many divisions are in the NFL?','8',array['4','6','10'],'Each conference has 4 divisions (East, North, South, West) of 4 teams.'),
(172,'teams',3,'Which team''s famous 1970s defense was called the "Steel Curtain"?','Pittsburgh Steelers',array['Chicago Bears','Minnesota Vikings','Dallas Cowboys'],'The Steel Curtain helped Pittsburgh win four Super Bowls in six years.'),
(173,'teams',3,'Which team''s defense was called the "Legion of Boom" in the 2010s?','Seattle Seahawks',array['Denver Broncos','Baltimore Ravens','New England Patriots'],'Richard Sherman, Earl Thomas, and Kam Chancellor led the Legion of Boom.'),
(174,'stadiums',1,'Which team plays at Lambeau Field?','Green Bay Packers',array['Chicago Bears','Minnesota Vikings','Detroit Lions'],'Lambeau Field opened in 1957. Players celebrate TDs with the "Lambeau Leap" into the stands.'),
(175,'stadiums',1,'Which team plays at Soldier Field?','Chicago Bears',array['Detroit Lions','Chicago Cardinals','Buffalo Bills'],'Soldier Field sits on Lake Michigan and first opened in 1924.'),
(176,'stadiums',1,'Which team plays at Arrowhead Stadium?','Kansas City Chiefs',array['Atlanta Falcons','Washington Commanders','Denver Broncos'],'Arrowhead is famous for being one of the loudest stadiums in the world.'),
(177,'stadiums',1,'Which team plays at AT&T Stadium, nicknamed "Jerry World"?','Dallas Cowboys',array['Houston Texans','Arizona Cardinals','Atlanta Falcons'],'The Cowboys'' stadium in Arlington, Texas, has a gigantic video board.'),
(178,'stadiums',1,'Which team plays at Gillette Stadium?','New England Patriots',array['New York Jets','Buffalo Bills','Philadelphia Eagles'],'Gillette Stadium is in Foxborough, Massachusetts.'),
(179,'stadiums',1,'Which two teams share MetLife Stadium?','Giants and Jets',array['Rams and Chargers','Eagles and Steelers','Bills and Jets'],'MetLife Stadium in New Jersey is home to both New York teams.'),
(180,'stadiums',1,'Which two teams share SoFi Stadium?','Rams and Chargers',array['Raiders and 49ers','Giants and Jets','Cardinals and Rams'],'SoFi Stadium in Inglewood, California, opened in 2020.'),
(181,'stadiums',1,'Which team plays at Allegiant Stadium in Las Vegas?','Raiders',array['Chargers','Cardinals','49ers'],'The Raiders'' sleek black stadium also hosted Super Bowl LVIII.'),
(182,'stadiums',2,'Which team plays at Lincoln Financial Field ("The Linc")?','Philadelphia Eagles',array['Pittsburgh Steelers','Baltimore Ravens','New York Giants'],'The Linc opened in 2003 in South Philadelphia.'),
(183,'stadiums',2,'Which team plays at Lumen Field?','Seattle Seahawks',array['San Francisco 49ers','Denver Broncos','Minnesota Vikings'],'Lumen Field''s crowd has set records for stadium noise.'),
(184,'stadiums',2,'Which team plays at Levi''s Stadium?','San Francisco 49ers',array['Las Vegas Raiders','Los Angeles Rams','Seattle Seahawks'],'Levi''s Stadium is in Santa Clara, California, and hosted Super Bowls 50 and LX.'),
(185,'stadiums',2,'Which team plays in the Superdome?','New Orleans Saints',array['Houston Texans','Atlanta Falcons','Tampa Bay Buccaneers'],'The Caesars Superdome has hosted more Super Bowls than almost any stadium.'),
(186,'stadiums',2,'Which team plays at Mercedes-Benz Stadium?','Atlanta Falcons',array['Carolina Panthers','Tennessee Titans','Miami Dolphins'],'Its roof opens like a camera lens (a "pinwheel" design).'),
(187,'stadiums',2,'Which team plays at Ford Field?','Detroit Lions',array['Cleveland Browns','Indianapolis Colts','Cincinnati Bengals'],'Ford Field is an indoor dome in downtown Detroit.'),
(188,'stadiums',2,'Which team plays at U.S. Bank Stadium?','Minnesota Vikings',array['Green Bay Packers','Kansas City Chiefs','Chicago Bears'],'The Vikings'' stadium has a see-through roof to let in light during snowy winters.'),
(189,'stadiums',2,'Which team plays at Lucas Oil Stadium?','Indianapolis Colts',array['Houston Texans','Tennessee Titans','Jacksonville Jaguars'],'Lucas Oil Stadium has a retractable roof and hosted Super Bowl XLVI.'),
(190,'stadiums',2,'Which team plays at M&T Bank Stadium?','Baltimore Ravens',array['Buffalo Bills','Washington Commanders','Pittsburgh Steelers'],'M&T Bank Stadium is in downtown Baltimore near Camden Yards.'),
(191,'stadiums',2,'Which team plays at Raymond James Stadium, famous for its pirate ship?','Tampa Bay Buccaneers',array['Miami Dolphins','Jacksonville Jaguars','Carolina Panthers'],'The ship fires cannons whenever the Bucs score!'),
(192,'stadiums',2,'The Broncos'' stadium is named for Denver''s high elevation. It is called...','Empower Field at Mile High',array['Rocky Mountain Dome','Summit Field','Altitude Arena'],'Denver is about one mile above sea level, so the thin air can tire out visiting teams.'),
(193,'stadiums',2,'Which team plays at Hard Rock Stadium?','Miami Dolphins',array['Tampa Bay Buccaneers','Jacksonville Jaguars','Houston Texans'],'Hard Rock Stadium is in Miami Gardens, Florida.'),
(194,'stadiums',3,'The Steelers played at Heinz Field until 2022. What is it called now?','Acrisure Stadium',array['PNC Park','Three Rivers Stadium','Highmark Stadium'],'The name changed in 2022, but the stadium is the same one on Pittsburgh''s North Shore.'),
(195,'stadiums',3,'Which team plays at NRG Stadium?','Houston Texans',array['Dallas Cowboys','Tennessee Titans','New Orleans Saints'],'NRG Stadium in Houston was the first NFL stadium with a retractable roof.'),
(196,'stadiums',3,'Which stadium has been home to the same NFL team the longest?','Lambeau Field',array['Soldier Field','Arrowhead Stadium','Superdome'],'The Packers have played at Lambeau since 1957.'),
(197,'stadiums',3,'Where was Super Bowl LVIII (Chiefs vs. 49ers) played?','Allegiant Stadium, Las Vegas',array['SoFi Stadium, Los Angeles','Superdome, New Orleans','State Farm Stadium, Arizona'],'It was the first Super Bowl played in Las Vegas.'),
(198,'stadiums',3,'Where was Super Bowl LIX (Eagles vs. Chiefs) played?','Caesars Superdome, New Orleans',array['Allegiant Stadium, Las Vegas','Hard Rock Stadium, Miami','Lincoln Financial Field'],'New Orleans hosted its 11th Super Bowl.'),
(199,'stadiums',3,'Which stadium is scheduled to host Super Bowl LXI in February 2027?','SoFi Stadium',array['MetLife Stadium','Mercedes-Benz Stadium','Levi''s Stadium'],'SoFi Stadium in Inglewood, CA, also hosted Super Bowl LVI.'),
(200,'stadiums',3,'Which team plays at Highmark Stadium in Orchard Park?','Buffalo Bills',array['Pittsburgh Steelers','Cleveland Browns','New York Jets'],'Buffalo''s cold, snowy home games are legendary.'),
(201,'history',4,'"The Greatest Game Ever Played" (1958 NFL Championship) went to overtime. Who won?','Baltimore Colts',array['New York Giants','Cleveland Browns','Green Bay Packers'],'The Colts beat the Giants 23-17 at Yankee Stadium on Alan Ameche''s OT touchdown. It was the first sudden-death game in NFL title history.'),
(202,'history',4,'The 1968 "Heidi Game" got its name because NBC cut away to a movie. Which teams were playing?','Jets and Raiders',array['Packers and Cowboys','Colts and Giants','Chiefs and Raiders'],'Viewers missed the Raiders scoring two TDs in the final minute to win 43-32.'),
(203,'history',4,'The 1978 "Holy Roller" play, which led to a rule change on fumbles, helped which team win?','Oakland Raiders',array['San Diego Chargers','Pittsburgh Steelers','Denver Broncos'],'Ken Stabler fumbled the ball forward on purpose and the Raiders "rolled" it into the end zone vs. the Chargers.'),
(204,'history',4,'The 1974 playoff "Sea of Hands" catch by Clarence Davis eliminated which team?','Miami Dolphins',array['Pittsburgh Steelers','Minnesota Vikings','Baltimore Colts'],'The Raiders'' win ended the Dolphins'' run of two straight Super Bowl titles.'),
(205,'history',4,'The "Epic in Miami" (Jan. 1982) was a 41-38 overtime playoff classic won by which team?','San Diego Chargers',array['Miami Dolphins','Oakland Raiders','Cincinnati Bengals'],'An exhausted Kellen Winslow blocked a field goal and had to be helped off the field.'),
(206,'history',4,'The "Freezer Bowl" AFC Championship (Jan. 1982) had a wind chill of about -59°F. Which team hosted it?','Cincinnati Bengals',array['Green Bay Packers','Buffalo Bills','Chicago Bears'],'The Bengals beat the Chargers just one week after the Chargers won the "Epic in Miami."'),
(207,'history',4,'In "The Comeback" (Jan. 1993), the Bills rallied from 35-3 down. Which backup QB led them?','Frank Reich',array['Jim Kelly','Doug Flutie','Rob Johnson'],'Reich, filling in for Jim Kelly, led a 32-point comeback against the Houston Oilers.'),
(208,'history',4,'In Dec. 2022, which team made the largest comeback in NFL history, from 33-0 down?','Minnesota Vikings',array['Buffalo Bills','Indianapolis Colts','Kansas City Chiefs'],'The Vikings beat the Colts 39-36 in overtime.'),
(209,'history',4,'The "Miracle at the Meadowlands" (1978) led teams to start using which formation?','Victory formation (QB kneel)',array['Shotgun','Wildcat','I-formation'],'The Giants fumbled a handoff while trying to run out the clock, and the Eagles'' Herm Edwards scored.'),
(210,'history',4,'The 2002 "Tuck Rule" playoff game in the snow was between the Patriots and which team?','Oakland Raiders',array['Pittsburgh Steelers','Indianapolis Colts','New York Jets'],'Charles Woodson''s hit on Tom Brady was ruled an incomplete pass. The tuck rule was abolished in 2013.'),
(211,'history',4,'The "Fail Mary" (2012), decided by replacement referees, was a Seahawks win over which team?','Green Bay Packers',array['San Francisco 49ers','Dallas Cowboys','Chicago Bears'],'Golden Tate''s disputed catch helped end the 2012 referee lockout.'),
(212,'history',4,'"13 Seconds" refers to which team tying a playoff game late, then winning in OT, in Jan. 2022?','Kansas City Chiefs',array['Buffalo Bills','Cincinnati Bengals','Tennessee Titans'],'Mahomes moved the Chiefs into field goal range in 13 seconds, then beat the Bills in overtime.'),
(213,'history',4,'The "Double Doink" missed field goal (Jan. 2019) ended which team''s season?','Chicago Bears',array['Minnesota Vikings','Dallas Cowboys','Philadelphia Eagles'],'Cody Parkey''s kick hit the upright and the crossbar against the Eagles.'),
(214,'history',4,'The 1977 "Ghost to the Post" double-overtime playoff win belonged to which team?','Oakland Raiders',array['Baltimore Colts','Denver Broncos','Pittsburgh Steelers'],'Tight end Dave "The Ghost" Casper made the key catch against the Colts.'),
(215,'history',4,'"The Fumble" in the 1987 season AFC Championship was by which Browns running back?','Earnest Byner',array['Kevin Mack','Jim Brown','Leroy Kelly'],'Byner was stripped near the goal line, and Denver beat Cleveland again.'),
(216,'history',4,'The Jets'' "Monday Night Miracle" (Oct. 2000) came back from 30-7 down against which team?','Miami Dolphins',array['New England Patriots','Buffalo Bills','Indianapolis Colts'],'Vinny Testaverde led the Jets to a 40-37 overtime win.'),
(217,'history',4,'The 1940 NFL Championship had the most lopsided score in NFL history. What was it?','Bears 73, Washington 0',array['Packers 56, Giants 0','Browns 56, Lions 10','Lions 59, Browns 14'],'The Bears'' T-formation offense crushed Washington.'),
(218,'history',4,'The highest-scoring game in NFL history (113 points, 1966) was Washington vs. which team?','New York Giants',array['Dallas Cowboys','Philadelphia Eagles','Pittsburgh Steelers'],'Washington won 72-41.'),
(219,'history',4,'Who coached the Packers to victory in the 1967 "Ice Bowl"?','Vince Lombardi',array['Tom Landry','Don Shula','George Halas'],'Lombardi''s Packers beat Tom Landry''s Cowboys 21-17.'),
(220,'history',4,'Who is the only player from a LOSING team to be named Super Bowl MVP?','Chuck Howley',array['Joe Namath','Lynn Swann','Larry Csonka'],'Cowboys linebacker Chuck Howley won MVP in Super Bowl V despite losing to the Colts.'),
(221,'history',4,'Which Super Bowl was the highest-scoring ever, with 75 total points?','Super Bowl XXIX',array['Super Bowl LVII','Super Bowl LII','Super Bowl XXVII'],'The 49ers beat the Chargers 49-26. Steve Young threw a record 6 TD passes.'),
(222,'history',4,'Super Bowl LIII was the lowest-scoring Super Bowl. What was the final score?','Patriots 13, Rams 3',array['Dolphins 14, Washington 7','Ravens 34, Giants 7','Steelers 16, Vikings 6'],'Only one touchdown was scored the entire game.'),
(223,'history',4,'Who returned a kickoff 108 yards, the longest play in Super Bowl history?','Jacoby Jones',array['Desmond Howard','Devin Hester','Tim Dwight'],'Jones did it for the Ravens in Super Bowl XLVII against the 49ers.'),
(224,'history',4,'Who is the only special teams player ever named Super Bowl MVP?','Desmond Howard',array['Jacoby Jones','Adam Vinatieri','Devin Hester'],'Howard''s 99-yard kickoff return TD helped the Packers win Super Bowl XXXI.'),
(225,'history',4,'Which Steelers linebacker returned an interception 100 yards for a TD in Super Bowl XLIII?','James Harrison',array['Troy Polamalu','James Farrior','Joey Porter'],'Harrison''s return ended the first half against the Cardinals.'),
(226,'history',4,'"The Tackle" at the 1-yard line on the final play of Super Bowl XXXIV was made by which Ram?','Mike Jones',array['Aeneas Williams','London Fletcher','Kevin Carter'],'Jones stopped the Titans'' Kevin Dyson just short of the goal line.'),
(227,'history',4,'Which undrafted Patriots CB intercepted Russell Wilson at the goal line to win Super Bowl XLIX?','Malcolm Butler',array['Darrelle Revis','Brandon Browner','Devin McCourty'],'Butler''s pick sealed a 28-24 win over Seattle.'),
(228,'history',4,'Super Bowl XLVII was briefly stopped by what?','A stadium power outage',array['A thunderstorm','A fan on the field','An earthquake'],'About half the Superdome''s lights went out early in the third quarter of Ravens vs. 49ers.'),
(229,'history',4,'Which team was the FIRST to play a Super Bowl in its own home stadium?','Tampa Bay Buccaneers',array['Los Angeles Rams','Miami Dolphins','Minnesota Vikings'],'The Bucs beat the Chiefs 31-9 in Super Bowl LV at Raymond James Stadium.'),
(230,'history',4,'In Super Bowl XXII, Doug Williams threw 4 TD passes in a single quarter for which team?','Washington',array['Denver Broncos','San Francisco 49ers','Chicago Bears'],'Williams became the first Black QB to start and win a Super Bowl, and he was named MVP.'),
(231,'history',4,'Which Bears defensive tackle scored a rushing TD in Super Bowl XX?','William "The Refrigerator" Perry',array['Richard Dent','Dan Hampton','Steve McMichael'],'Perry plunged in from the 1 in a 46-10 rout of the Patriots.'),
(232,'history',4,'Which Super Bowl was the only one NOT labeled with Roman numerals?','Super Bowl 50',array['Super Bowl 40','Super Bowl 100','Super Bowl 1'],'The NFL used "50" because "L" alone did not look good on logos. The Broncos beat the Panthers.'),
(233,'history',4,'How many teams have won THREE Super Bowls in a row?','None',array['One','Two','Three'],'No team has done it. The Chiefs tried in Super Bowl LIX but lost to the Eagles.'),
(234,'history',4,'Which two franchises are both 0-4 in Super Bowls?','Vikings and Bills',array['Bengals and Falcons','Browns and Lions','Chargers and Titans'],'Minnesota lost IV, VIII, IX, and XI. Buffalo lost XXV through XXVIII.'),
(235,'history',4,'As of the 2025 season, which team has NEVER played in a Super Bowl?','Detroit Lions',array['New York Jets','Arizona Cardinals','New Orleans Saints'],'The Lions, Browns, Jaguars, and Texans have never reached the Super Bowl.'),
(236,'history',4,'In what year did the Detroit Lions win their last NFL Championship?','1957',array['1962','1935','1971'],'The Lions beat the Browns 59-14 in the 1957 title game.'),
(237,'history',4,'In what year did the Cleveland Browns win their last NFL Championship?','1964',array['1955','1972','1986'],'Jim Brown''s Browns beat the Colts 27-0. That was before the Super Bowl era.'),
(238,'history',4,'Which team was the first in NFL history to finish a season 0-16?','2008 Detroit Lions',array['2017 Cleveland Browns','1976 Tampa Bay Buccaneers','2009 St. Louis Rams'],'The 2017 Browns matched it. The 1976 Bucs went 0-14 in a shorter season.'),
(239,'history',4,'Where was Super Bowl I played?','Los Angeles Memorial Coliseum',array['Orange Bowl, Miami','Tulane Stadium','Rose Bowl'],'It was not even a sellout. Tickets cost as little as $6!'),
(240,'history',4,'Who was the first president of the APFA, the league that became the NFL?','Jim Thorpe',array['George Halas','Joe Carr','Curly Lambeau'],'Olympic legend Jim Thorpe was the league''s figurehead president in 1920.'),
(241,'history',4,'Who was the first player ever selected in the NFL Draft (1936)?','Jay Berwanger',array['Sammy Baugh','Red Grange','Bronko Nagurski'],'Berwanger, the first Heisman winner, never played a down in the NFL.'),
(242,'history',4,'The first "Monday Night Football" game (1970) matched the Jets against which team?','Cleveland Browns',array['Baltimore Colts','Oakland Raiders','Kansas City Chiefs'],'The Browns won 31-21.'),
(243,'history',4,'The AFL''s founding owners in 1960 called themselves what?','The Foolish Club',array['The Founders Circle','The Rebel Eight','The Maverick League'],'Lamar Hunt and the other original AFL owners embraced the nickname.'),
(244,'history',4,'Which head coach has the most Super Bowl appearances (9)?','Bill Belichick',array['Don Shula','Tom Landry','Andy Reid'],'Belichick went 6-3 in Super Bowls as head coach of the Patriots.'),
(245,'history',4,'Which coach won 4 Super Bowls with the 1970s Steelers?','Chuck Noll',array['Bill Cowher','Mike Tomlin','Bud Grant'],'Noll''s Steelers won Super Bowls IX, X, XIII, and XIV.'),
(246,'history',4,'Which coach won three Super Bowls with three DIFFERENT starting quarterbacks?','Joe Gibbs',array['Bill Walsh','Chuck Noll','Bill Parcells'],'Gibbs won with Joe Theismann, Doug Williams, and Mark Rypien in Washington.'),
(247,'history',4,'Who was the first Black head coach to win a Super Bowl?','Tony Dungy',array['Mike Tomlin','Art Shell','Lovie Smith'],'Dungy''s Colts beat Lovie Smith''s Bears in Super Bowl XLI.'),
(248,'history',4,'Who became the first Black head coach of the modern NFL era in 1989?','Art Shell',array['Tony Dungy','Dennis Green','Fritz Pollard'],'Shell, a Hall of Fame tackle, coached the Raiders. Fritz Pollard had coached back in the 1920s.'),
(249,'history',4,'Who became the youngest head coach to win a Super Bowl (age 36)?','Sean McVay',array['Jon Gruden','Mike Tomlin','Kyle Shanahan'],'McVay''s Rams won Super Bowl LVI.'),
(250,'history',4,'Which Hall of Fame coach founded the Cincinnati Bengals?','Paul Brown',array['Sid Gillman','Weeb Ewbank','Blanton Collier'],'The Browns are named after Paul Brown too. He founded the Bengals in 1968 after Cleveland fired him.'),
(251,'history',4,'Which coach was famously wired for sound in Super Bowl IV, telling his team to "matriculate" the ball down the field?','Hank Stram',array['Vince Lombardi','John Madden','Tom Landry'],'Stram''s Chiefs upset the Vikings 23-7.'),
(252,'history',4,'Which coach led the Cowboys for their first 29 seasons, wearing a trademark fedora?','Tom Landry',array['Jimmy Johnson','Bill Parcells','Barry Switzer'],'Landry coached Dallas from 1960 to 1988.'),
(253,'players',4,'Who holds the NFL record for career rushing touchdowns (164)?','Emmitt Smith',array['LaDainian Tomlinson','Marcus Allen','Walter Payton'],'Emmitt Smith holds both the career rushing yards and rushing TD records.'),
(254,'players',4,'Who holds the record for career receiving touchdowns (197)?','Jerry Rice',array['Randy Moss','Terrell Owens','Cris Carter'],'Rice also holds the records for career catches and receiving yards.'),
(255,'players',4,'Who holds the NFL record for career sacks (200, official since 1982)?','Bruce Smith',array['Reggie White','Michael Strahan','Kevin Greene'],'Bruce Smith played for the Bills and Washington. Reggie White is second with 198.'),
(256,'players',4,'Who holds the record for career interceptions (81)?','Paul Krause',array['Rod Woodson','Night Train Lane','Ed Reed'],'Krause played safety for Washington and the Vikings.'),
(257,'players',4,'Who holds the record for most career points scored?','Adam Vinatieri',array['Morten Andersen','Gary Anderson','Jason Hanson'],'Kicker Adam Vinatieri scored 2,673 points with the Patriots and Colts.'),
(258,'players',4,'Who set the single-season interception record (14) as a rookie in 1952?','Dick "Night Train" Lane',array['Paul Krause','Emlen Tunnell','Mel Blount'],'He did it in just 12 games for the Los Angeles Rams.'),
(259,'players',4,'Who set the record for receptions in a season, 149, in 2019?','Michael Thomas',array['Cooper Kupp','Marvin Harrison','Julio Jones'],'Thomas did it for the Saints.'),
(260,'players',4,'Who scored a record 31 total touchdowns (28 rushing) in 2006?','LaDainian Tomlinson',array['Shaun Alexander','Priest Holmes','Marshall Faulk'],'LT won MVP with the San Diego Chargers.'),
(261,'players',4,'Who set the single-season passing yards record (5,477) in 2013?','Peyton Manning',array['Drew Brees','Patrick Mahomes','Tom Brady'],'Manning threw for 5,477 yards and 55 TDs for the Broncos.'),
(262,'players',4,'Who holds the single-game passing record of 554 yards, set in 1951?','Norm Van Brocklin',array['Johnny Unitas','Dan Marino','Warren Moon'],'Van Brocklin''s Rams record has stood for more than 70 years.'),
(263,'players',4,'Who holds the single-game rushing record of 296 yards (2007)?','Adrian Peterson',array['Jamal Lewis','Walter Payton','Corey Dillon'],'Peterson did it as a rookie for the Vikings against the Chargers.'),
(264,'players',4,'Who scored a record 40 points in a single game in 1929?','Ernie Nevers',array['Jim Thorpe','Red Grange','Gale Sayers'],'Nevers scored 6 TDs and 4 extra points for the Chicago Cardinals against the Bears.'),
(265,'players',4,'Which rookie scored 6 touchdowns in one game in 1965?','Gale Sayers',array['Jim Brown','Paul Hornung','Lenny Moore'],'"The Kansas Comet" did it for the Bears against the 49ers.'),
(266,'players',4,'Which Saint tied the record with 6 rushing TDs on Christmas Day 2020?','Alvin Kamara',array['Mark Ingram','Latavius Murray','Taysom Hill'],'Kamara matched Ernie Nevers'' 1929 record against the Vikings.'),
(267,'players',4,'Who was the first player to rush for 2,000 yards in a season (1973)?','O.J. Simpson',array['Jim Brown','Earl Campbell','Walter Payton'],'He ran for 2,003 yards for the Bills in a 14-game season.'),
(268,'players',4,'Which Broncos RB ran for 2,008 yards and won NFL MVP in 1998?','Terrell Davis',array['Floyd Little','Clinton Portis','Mike Anderson'],'Davis had also been MVP of Super Bowl XXXII the season before.'),
(269,'players',4,'Which Raven ran for 2,066 yards in 2003?','Jamal Lewis',array['Ray Rice','Priest Holmes','Willis McGahee'],'Lewis also ran for 295 yards in a single game that season.'),
(270,'players',4,'Which Titan ran for 2,006 yards in 2009 and was nicknamed "CJ2K"?','Chris Johnson',array['Eddie George','Derrick Henry','LenDale White'],'Johnson was one of the fastest backs ever.'),
(271,'players',4,'Who broke Johnny Unitas''s record of 47 straight games with a TD pass?','Drew Brees',array['Peyton Manning','Tom Brady','Brett Favre'],'Brees extended the streak to 54 games with the Saints.'),
(272,'players',4,'Which QB threw 48 TD passes and became the first to pass for 5,000 yards, in 1984?','Dan Marino',array['Dan Fouts','Joe Montana','John Elway'],'Marino did it in only his second season.'),
(273,'players',4,'Who caught 22 TD passes in just 12 games during the 1987 strike season?','Jerry Rice',array['Steve Largent','Art Monk','Andre Reed'],'It stood as the record until Randy Moss caught 23 in 2007.'),
(274,'players',4,'Who was the first DEFENSIVE player to win NFL MVP (1971)?','Alan Page',array['Dick Butkus','Joe Greene','Deacon Jones'],'Page anchored the Vikings'' "Purple People Eaters."'),
(275,'players',4,'Who is the only KICKER to win NFL MVP (1982)?','Mark Moseley',array['Jan Stenerud','Morten Andersen','Adam Vinatieri'],'Moseley kicked for Washington in a strike-shortened season.'),
(276,'players',4,'Which QB won three straight MVP awards (1995-97)?','Brett Favre',array['Peyton Manning','Steve Young','Joe Montana'],'Favre shared the 1997 award with Barry Sanders.'),
(277,'players',4,'Which RB won both NFL MVP and Super Bowl MVP for the 1993 season?','Emmitt Smith',array['Thurman Thomas','Barry Sanders','Marcus Allen'],'Smith led the Cowboys to a win in Super Bowl XXVIII.'),
(278,'players',4,'Which Super Bowl MVP was stocking grocery shelves just a few years earlier?','Kurt Warner',array['Tom Brady','Doug Williams','Jim Plunkett'],'Warner went from Hy-Vee to the Arena League to Super Bowl XXXIV MVP with the Rams.'),
(279,'players',4,'Who has the most career Super Bowl touchdowns (8)?','Jerry Rice',array['Emmitt Smith','Rob Gronkowski','Franco Harris'],'Rice scored in four different Super Bowls.'),
(280,'players',4,'Who threw for a Super Bowl record 505 yards, but LOST?','Tom Brady',array['Kurt Warner','Patrick Mahomes','Peyton Manning'],'Brady did it in Super Bowl LII, when the Eagles won 41-33.'),
(281,'players',4,'Which QB won 5 Grey Cups in Canada before his Hall of Fame NFL career?','Warren Moon',array['Doug Flutie','Joe Theismann','Jeff Garcia'],'Moon starred for Edmonton, then the Houston Oilers.'),
(282,'players',4,'In 1943, which player led the NFL in passing, punting, AND interceptions?','Sammy Baugh',array['Sid Luckman','Don Hutson','Bronko Nagurski'],'"Slingin'' Sammy" played for Washington.'),
(283,'players',4,'Which QB played in his league''s championship game in all 10 of his pro seasons?','Otto Graham',array['Bart Starr','Johnny Unitas','Bobby Layne'],'Graham''s Browns won 7 of those 10 title games.'),
(284,'players',4,'Which Rams defensive end is credited with coining the term "sack"?','Deacon Jones',array['Merlin Olsen','Jack Youngblood','Reggie White'],'Jones starred in the Rams'' "Fearsome Foursome."'),
(285,'players',4,'Which 1920s Bears star was nicknamed "The Galloping Ghost"?','Red Grange',array['Bronko Nagurski','Jim Thorpe','Ernie Nevers'],'Grange helped make pro football popular.'),
(286,'players',4,'Who played in a World Series AND a Super Bowl?','Deion Sanders',array['Bo Jackson','Brian Jordan','Tom Brady'],'Deion played for the Braves in the 1992 World Series and won two Super Bowls.'),
(287,'players',4,'Which Packers receiver of the 1930s-40s scored 99 career TDs and invented many modern routes?','Don Hutson',array['Curly Lambeau','Elroy Hirsch','Max McGee'],'Hutson''s receiving TD record stood for more than 40 years.'),
(288,'rules',4,'In what year did the NFL adopt the two-point conversion?','1994',array['1970','1985','2002'],'The AFL used it in the 1960s, but the NFL waited until 1994.'),
(289,'rules',4,'In 1974, the NFL moved the goalposts from the goal line to where?','The back of the end zone',array['The 10-yard line','The sidelines','The 20-yard line'],'Players kept running into them on the goal line!'),
(290,'rules',4,'In 2015, extra-point kicks were moved back to the snap from which line?','15-yard line',array['2-yard line','10-yard line','20-yard line'],'That made extra points a 33-yard kick.'),
(291,'rules',4,'In what season did the NFL go to a 17-game regular season?','2021',array['2018','2020','2023'],'It was 14 games until 1978, then 16 until 2021.'),
(292,'rules',4,'In what year did the NFL first use instant replay to review calls?','1986',array['1978','1995','2003'],'It was dropped after 1991, then the coach''s challenge system arrived in 1999.'),
(293,'rules',4,'Which rule, created in 2003, requires teams to interview minority candidates for head coach jobs?','The Rooney Rule',array['The Halas Rule','The Brown Rule','The Shell Rule'],'It is named after Steelers owner Dan Rooney.'),
(294,'rules',4,'After a fair catch, a team may try a rare kick that has no rush allowed. What is it called?','Fair catch kick',array['Drop kick','Onside punt','Free punt'],'The kicker gets a free kick at the goal from a tee or a hold. It is worth 3 points.'),
(295,'rules',4,'In what year did the NFL add overtime to REGULAR-season games?','1974',array['1958','1966','1990'],'Before that, regular-season games could end in a tie after 60 minutes.'),
(296,'rules',4,'In 2020, the NFL playoffs expanded to how many teams?','14',array['12','16','10'],'Only the top seed in each conference gets a first-round bye now.'),
(297,'rules',4,'The "tuck rule" was famously abolished in what year?','2013',array['2002','2008','2018'],'It had been made famous by the 2002 Patriots-Raiders snow game.'),
(298,'strategy',4,'The "West Coast offense," built on short timing passes, is credited to which coach?','Bill Walsh',array['Don Coryell','Sid Gillman','Mike Martz'],'Walsh''s 49ers won three Super Bowls with it in the 1980s.'),
(299,'strategy',4,'"Air Coryell," a deep vertical passing attack, was made famous by which team?','San Diego Chargers',array['St. Louis Rams','Houston Oilers','Miami Dolphins'],'Don Coryell and Dan Fouts lit up scoreboards around 1980.'),
(300,'strategy',4,'Which defensive coordinator created the "46 defense" used by the 1985 Bears?','Buddy Ryan',array['Mike Ditka','Bud Carson','Dick LeBeau'],'It was named after safety Doug Plank''s jersey number, 46.'),
(301,'strategy',4,'The "Tampa 2" defense is most closely tied to which head coach?','Tony Dungy',array['Jon Gruden','Bill Belichick','Rex Ryan'],'Dungy and Monte Kiffin built Tampa Bay''s great defenses around it.'),
(302,'strategy',4,'Which defensive coach is famous for developing the "zone blitz"?','Dick LeBeau',array['Buddy Ryan','Wade Phillips','Monte Kiffin'],'LeBeau''s zone blitz helped the Steelers become "Blitzburgh."'),
(303,'strategy',4,'In 2008, the Dolphins shocked the Patriots using which direct-snap-to-RB formation?','Wildcat',array['Pistol','Wishbone','Single wing'],'Ronnie Brown scored 4 TDs out of the Wildcat in that game.'),
(304,'strategy',4,'The "Run and Shoot" offense used four wide receivers and no tight end. Which team ran it in the early 1990s?','Houston Oilers',array['Dallas Cowboys','Buffalo Bills','Kansas City Chiefs'],'Warren Moon threw for huge numbers in it.'),
(305,'strategy',4,'The Chiefs'' famous "Jet Chip Wasp" play converted a 3rd-and-15 in which Super Bowl?','Super Bowl LIV',array['Super Bowl LVII','Super Bowl IV','Super Bowl LVIII'],'Mahomes hit Tyreek Hill for 44 yards to spark the comeback against the 49ers.'),
(306,'teams',4,'What was the Kansas City Chiefs'' original name?','Dallas Texans',array['Kansas City Cowboys','Houston Oilers','Missouri Mustangs'],'Lamar Hunt''s AFL team moved from Dallas to Kansas City in 1963.'),
(307,'teams',4,'The New York Jets were originally called the New York...','Titans',array['Jets','Knights','Bulldogs'],'The team was renamed the Jets in 1963.'),
(308,'teams',4,'In 1943, two teams briefly merged because of WWII player shortages. Fans called them the...','Steagles',array['Phil-Pitts Bears','Card-Pitts','Brooklyn Tigers'],'The Eagles and Steelers combined for one season.'),
(309,'teams',4,'What was the Pittsburgh Steelers'' original name in 1933?','Pirates',array['Ironmen','Smoke','Miners'],'They became the Steelers in 1940.'),
(310,'teams',4,'The Baltimore Ravens began play in 1996 after which franchise relocated?','Cleveland Browns',array['Baltimore Colts','Houston Oilers','Los Angeles Rams'],'Cleveland kept the Browns name and history, and a new Browns team returned in 1999.'),
(311,'teams',4,'Washington''s great 1980s offensive line had what nickname?','The Hogs',array['The Herd','The Wall','The Tanks'],'The Hogs paved the way for three Super Bowl titles.'),
(312,'teams',4,'The Broncos'' late-1970s defense was known as the...','Orange Crush',array['Steel Curtain','No-Name Defense','Doomsday Defense'],'It led Denver to its first Super Bowl, after the 1977 season.'),
(313,'teams',4,'Which team''s defense was called "Doomsday"?','Dallas Cowboys',array['Pittsburgh Steelers','Minnesota Vikings','Los Angeles Rams'],'Bob Lilly and Randy White starred on the Doomsday defenses.'),
(314,'teams',4,'The 1972 Dolphins'' unheralded defense was famously called the...','No-Name Defense',array['Killer B''s','Orange Crush','Fun Bunch'],'The name came from Cowboys coach Tom Landry saying, before Super Bowl VI, that he could not recall their names.'),
(315,'teams',4,'The Colts famously left Baltimore in 1984 in the middle of the night using what?','Mayflower moving trucks',array['A cargo train','Private jets','A riverboat'],'The trucks rolled out in a snowstorm, heading for Indianapolis.'),
(316,'stadiums',4,'Which was the first domed stadium used by an NFL team?','Houston Astrodome',array['Louisiana Superdome','Pontiac Silverdome','Seattle Kingdome'],'The Houston Oilers moved into the Astrodome in 1968.'),
(317,'stadiums',4,'Which team''s old stadium had a famous hole in its roof?','Dallas Cowboys (Texas Stadium)',array['Minnesota Vikings (Metrodome)','Houston Oilers (Astrodome)','Seattle Seahawks (Kingdome)'],'Fans joked the hole was there "so God can watch His favorite team."'),
(318,'stadiums',4,'In December 2010, which stadium''s roof collapsed under heavy snow?','Metrodome',array['Silverdome','Kingdome','RCA Dome'],'The Vikings had to play home games elsewhere, including outdoors at the University of Minnesota.'),
(319,'stadiums',4,'The Seahawks played in which concrete dome from 1976 to 1999?','The Kingdome',array['The Astrodome','The Metrodome','The Silverdome'],'The Kingdome was demolished in 2000.'),
(320,'stadiums',4,'The Detroit Lions played in which suburban dome from 1975 to 2001?','Pontiac Silverdome',array['Tiger Stadium','Ford Field','Metrodome'],'The Silverdome also hosted Super Bowl XVI.'),
(321,'stadiums',4,'The 49ers played at which windy stadium before moving to Levi''s Stadium?','Candlestick Park',array['Kezar Stadium','Oakland Coliseum','Cow Palace'],'"The Catch" happened at Candlestick in January 1982.'),
(322,'stadiums',4,'The Steelers won 4 Super Bowls in the 1970s while playing home games at...','Three Rivers Stadium',array['Forbes Field','Heinz Field','Pitt Stadium'],'Three Rivers was home from 1970 to 2000.'),
(323,'stadiums',4,'The Dolphins'' perfect 1972 season was played at which home stadium?','The Orange Bowl',array['Joe Robbie Stadium','Hard Rock Stadium','Tampa Stadium'],'Miami played at the Orange Bowl from 1966 to 1986.'),
(324,'stadiums',4,'Lambeau Field was originally called...','City Stadium',array['Packer Park','Green Bay Field','Hagemeister Park'],'It was renamed in 1965 for team founder Curly Lambeau.'),
(325,'stadiums',4,'Washington played its home games at which stadium from 1961 to 1996?','RFK Stadium',array['FedEx Field','Griffith Stadium','Memorial Stadium'],'The stands at RFK famously bounced when fans jumped.'),
(326,'stadiums',4,'Which team''s fans sit in the famous end-zone section called the "Dawg Pound"?','Cleveland Browns',array['Buffalo Bills','Pittsburgh Steelers','Chicago Bears'],'Fans wear dog masks and bark at opponents!'),
(327,'stadiums',4,'Which NFL stadium sits at the highest elevation?','Empower Field at Mile High',array['Allegiant Stadium','State Farm Stadium','Lumen Field'],'It is about 5,280 feet above sea level, in Denver.');
