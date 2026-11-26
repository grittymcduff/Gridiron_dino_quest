// ===================== NEW QUESTION TYPES =====================
// "pick" questions: choose every right answer (the question says how many). "order" questions: tap the answers
// in the right order. Both count as one question (all right = correct). They show up in challenges, Film Room
// drills and the Smart Coach, but never in pop quizzes (one-tap choice boxes) or the Daily Challenge.
// Facts that can change are true through the 2025 season and Super Bowl LX (Feb. 2026); lines marked // TS need a yearly check.
// {t:'pick'|'order', c:category, d:difficulty, q, ok:[right answers] or [answers in order], no:[wrong answers] (pick only), lead:'order hint', x}
const CZ_Q_TYPED=[
// ---- pick all that apply ----
{t:'pick',c:'rules',d:2,q:'Which of these are ways to score points?',ok:['Touchdown','Field goal','Safety','Extra point'],no:['Touchback','Fair catch'],x:'Touchdown 6, field goal 3, safety 2, extra point kick 1. A touchback and a fair catch don\'t score anything.'},
{t:'pick',c:'strategy',d:2,q:'Which of these positions play on DEFENSE?',ok:['Linebacker','Cornerback','Safety'],no:['Tight end','Center','Fullback'],x:'Linebackers, cornerbacks and safeties are defenders. Tight ends, centers and fullbacks play offense.'},
{t:'pick',c:'teams',d:2,q:'Which teams play in the AFC North?',ok:['Baltimore Ravens','Cincinnati Bengals','Cleveland Browns','Pittsburgh Steelers'],no:['Indianapolis Colts','Tennessee Titans'],x:'The AFC North is the Ravens, Bengals, Browns and Steelers. The Colts and Titans are in the AFC South.'},
{t:'pick',c:'players',d:3,q:'Tom Brady won Super Bowls with which teams?',ok:['New England Patriots','Tampa Bay Buccaneers'],no:['San Francisco 49ers','Las Vegas Raiders','New York Jets','Miami Dolphins'],x:'Brady won six with the Patriots and one with the Buccaneers, seven in all.'},
{t:'pick',c:'history',d:3,q:'Which teams share the record for most Super Bowl wins (6)?',ok:['New England Patriots','Pittsburgh Steelers'],no:['San Francisco 49ers','Dallas Cowboys','Green Bay Packers','Kansas City Chiefs'],x:'The Patriots and Steelers have 6 each. The 49ers and Cowboys have 5. Seattle beat New England in Super Bowl LX, keeping it a tie.'}, // TS
{t:'pick',c:'players',d:3,q:'Which players have won Super Bowl MVP at least THREE times?',ok:['Tom Brady','Joe Montana','Patrick Mahomes'],no:['Terry Bradshaw','Bart Starr','Eli Manning'],x:'Brady won it 5 times, Montana and Mahomes 3 each. Bradshaw, Starr and Eli Manning each won it twice.'}, // TS
{t:'pick',c:'players',d:3,q:'Pick the top THREE in career rushing yards.',ok:['Emmitt Smith','Walter Payton','Frank Gore'],no:['Barry Sanders','Adrian Peterson','Jim Brown'],x:'Emmitt Smith 18,355, Walter Payton 16,726, Frank Gore 16,000. Barry Sanders (15,269) and Adrian Peterson (14,918) are next.'},
{t:'pick',c:'players',d:3,q:'Pick the top THREE in career receiving yards.',ok:['Jerry Rice','Larry Fitzgerald','Terrell Owens'],no:['Randy Moss','Isaac Bruce','Tony Gonzalez'],x:'Jerry Rice 22,895, Larry Fitzgerald 17,492, Terrell Owens 15,934. Moss, Bruce and Gonzalez are all just over 15,000.'},
{t:'pick',c:'players',d:4,q:'Pick the top THREE in career sacks (official since 1982).',ok:['Bruce Smith','Reggie White','Kevin Greene'],no:['Julius Peppers','Michael Strahan','Lawrence Taylor'],x:'Bruce Smith 200, Reggie White 198, Kevin Greene 160. Julius Peppers is just behind with 159.5.'},
{t:'pick',c:'players',d:4,q:'Pick the top THREE single-season sack totals of all time.',ok:['Myles Garrett','Michael Strahan','T.J. Watt'],no:['Mark Gastineau','J.J. Watt','Reggie White'],x:'Myles Garrett set the record with 23 in 2025. Michael Strahan (2001) and T.J. Watt (2021) each had 22.5. Mark Gastineau had 22 in 1984.'}, // TS
{t:'pick',c:'players',d:4,q:'Pick the top THREE single-season passing touchdown totals (through 2025).',ok:['Peyton Manning','Patrick Mahomes','Tom Brady'],no:['Dan Marino','Aaron Rodgers','Drew Brees'],x:'Peyton Manning threw 55 in 2013. Patrick Mahomes (2018) and Tom Brady (2007) threw 50. Marino and Rodgers each had 48.'}, // TS
{t:'pick',c:'players',d:4,q:'Which FOUR players have scored six touchdowns in a single NFL game?',ok:['Ernie Nevers','Dub Jones','Gale Sayers','Alvin Kamara'],no:['Jerry Rice','Jim Brown'],x:'Ernie Nevers (1929), Dub Jones (1951), Gale Sayers (1965) and Alvin Kamara (Christmas 2020). Six is the record; Jerry Rice and Jim Brown topped out at five.'},
{t:'pick',c:'history',d:4,q:'Which FOUR teams have never played in a Super Bowl (through Super Bowl LX)?',ok:['Cleveland Browns','Detroit Lions','Jacksonville Jaguars','Houston Texans'],no:['Buffalo Bills','Minnesota Vikings'],x:'The Browns, Lions, Jaguars and Texans have never made it. The Bills and Vikings have been four times each but never won.'}, // TS
{t:'pick',c:'players',d:4,q:'Which FOUR players won both the Heisman Trophy and Super Bowl MVP?',ok:['Roger Staubach','Jim Plunkett','Marcus Allen','Desmond Howard'],no:['Joe Montana','Barry Sanders'],x:'Staubach (Super Bowl VI), Plunkett (XV), Allen (XVIII) and Howard (XXXI) did both. Montana never won the Heisman, and Sanders never played in a Super Bowl.'},
// ---- put in order ----
{t:'order',c:'rules',d:2,q:'Put these scoring plays in order, FEWEST points first.',lead:'fewest points first',ok:['Extra point kick','Safety','Field goal','Touchdown'],x:'Extra point 1, safety 2, field goal 3, touchdown 6.'},
{t:'order',c:'history',d:3,q:'Put these events in order, OLDEST first.',lead:'oldest first',ok:['The NFL is founded','The first NFL Draft','The first Super Bowl','The AFL and NFL merge'],x:'The league was founded in 1920, the first draft was in 1936, the first Super Bowl was played in January 1967, and the merger happened in 1970.'},
{t:'order',c:'history',d:3,q:'Put these famous plays in order, OLDEST first.',lead:'oldest first',ok:['The Immaculate Reception','The Catch','The Music City Miracle','The Philly Special'],x:'Immaculate Reception 1972, The Catch (January 1982), Music City Miracle (January 2000), Philly Special (Super Bowl LII, February 2018).'},
{t:'order',c:'players',d:3,q:'Put these career rushing leaders in order, MOST yards first.',lead:'most yards first',ok:['Emmitt Smith','Walter Payton','Frank Gore','Barry Sanders'],x:'Emmitt Smith 18,355, Walter Payton 16,726, Frank Gore 16,000, Barry Sanders 15,269.'},
{t:'order',c:'players',d:4,q:'Put these career passing yards leaders in order, MOST yards first.',lead:'most yards first',ok:['Tom Brady','Drew Brees','Peyton Manning','Brett Favre'],x:'Tom Brady 89,214, Drew Brees 80,358, Peyton Manning 71,940, Brett Favre 71,838. Manning and Favre are only 102 yards apart.'}, // TS
{t:'order',c:'players',d:4,q:'Put these single-season rushing totals in order, MOST yards first.',lead:'most yards first',ok:['Eric Dickerson (1984)','Adrian Peterson (2012)','Jamal Lewis (2003)','Barry Sanders (1997)'],x:'Dickerson 2,105, Peterson 2,097 (just 8 short!), Lewis 2,066, Sanders 2,053.'},
{t:'order',c:'players',d:4,q:'Put these single-season receiving totals in order, MOST yards first.',lead:'most yards first',ok:['Calvin Johnson (2012)','Cooper Kupp (2021)','Julio Jones (2015)','Jerry Rice (1995)'],x:'Calvin Johnson 1,964, Cooper Kupp 1,947, Julio Jones 1,871, Jerry Rice 1,848.'}, // TS
{t:'order',c:'history',d:4,q:'Put these field goals in order, LONGEST first.',lead:'longest first',ok:['Cam Little (2025)','Justin Tucker (2021)','Brandon Aubrey (2024)','Tom Dempsey (1970)'],x:'Cam Little 68 yards, Justin Tucker 66, Brandon Aubrey 65, Tom Dempsey 63. Dempsey\'s kick was the record for 43 years.'}, // TS
];
// one-answer questions on the 2025 season and Super Bowl LX (same format as the main bank)
const CZ_Q_2025=[
['players',3,'Who broke the single-season sack record with 23 sacks in 2025?','Myles Garrett',['T.J. Watt','Micah Parsons','Maxx Crosby'],'Garrett topped the 22.5 shared by Michael Strahan (2001) and T.J. Watt (2021).'],
['history',3,'Which kicker made the longest field goal in NFL history, 68 yards, in 2025?','Cam Little',['Justin Tucker','Brandon Aubrey','Harrison Butker'],'The Jaguars kicker beat Justin Tucker\'s 66-yarder from 2021. He also made a 67-yarder in Week 18.'], // TS
['history',3,'In Super Bowl LX, Seahawks kicker Jason Myers set a Super Bowl record by making how many field goals?','5',['3','4','6'],'Myers went 5 for 5 as Seattle beat New England 29-13.'],
['history',2,'Which quarterback led the Seahawks to the Super Bowl LX title?','Sam Darnold',['Geno Smith','Russell Wilson','Drake Maye'],'Darnold, once called a bust, won it all in his first season in Seattle. Drake Maye was the Patriots\' QB.'],
['players',3,'Who led the NFL with 1,621 rushing yards in 2025?','James Cook',['Derrick Henry','Saquon Barkley','Jonathan Taylor'],'The Bills running back just beat Derrick Henry (1,595) and Jonathan Taylor (1,585).'],
['players',4,'Who led the NFL with 18 rushing touchdowns in 2025?','Jonathan Taylor',['Josh Allen','Derrick Henry','Josh Jacobs'],'The Colts star was one of the league\'s top scorers all season.'],
['players',4,'Which Seahawks receiver led the NFL with 1,793 receiving yards in 2025?','Jaxon Smith-Njigba',['DK Metcalf','Tyler Lockett','Cooper Kupp'],'Smith-Njigba edged out Puka Nacua (1,715) for the receiving title and was named Offensive Player of the Year.'],
['players',4,'Which tight end set the record for catches by a tight end in a season, 126, in 2025?','Trey McBride',['Travis Kelce','George Kittle','Mark Andrews'],'The Cardinals tight end broke Zach Ertz\'s mark of 116 from 2018.'],
];
for(const r of CZ_Q_2025)QB.push({id:QB.length,cat:r[0],d:r[1],q:r[2],a:r[3],w:r[4],x:r[5]});
for(const r of CZ_Q_TYPED)QB.push({id:QB.length,cat:r.c,d:r.d,q:r.q,t:r.t,ok:r.ok,no:r.no||[],lead:r.lead,a:r.t==='order'?r.ok.join(' → '):r.ok.join(', '),w:[],x:r.x});

// ---- keep them out of pop quizzes and the Daily Challenge ----
let czNoTyped=false;
talk=(orig=>function(){czNoTyped=true;try{return orig.apply(this,arguments)}finally{czNoTyped=false}})(talk);
pickQuestion=(orig=>function(){let q=orig.apply(this,arguments);if(czNoTyped)for(let i=0;i<25&&q&&q.t;i++)q=orig.apply(this,arguments);return q})(pickQuestion);
dailyQs=ccPatch(dailyQs,[["QB.filter(q=>q.d===d&&!q.pic)","QB.filter(q=>q.d===d&&!q.pic&&!q.t)"]]);

// ---- in challenges ----
function czTQ(){return B&&B.q&&B.q.t?B.tq:null}
function czTqInit(){const q=B.q;if(B.tq&&B.tq.id===q.id&&B.tq.n===B.qn)return;
 const opts=q.t==='order'?shuffle(q.ok.slice()):shuffle([...q.ok,...q.no]);B.tq={id:q.id,n:B.qn,opts,picked:[],gone:new Set(),cur:0,locked:false};
 // these take longer to read, so the shot clock gets 60% more time
 if(B.opts.shotclock){B.opts.sc0=B.opts.sc0||B.opts.shotclock;B.opts.shotclock=Math.round(B.opts.sc0*1.6)}}
nextQ=(orig=>function(){B&&(B.qn=(B.qn||0)+1);const r=orig.apply(this,arguments);if(B&&B.opts&&B.opts.sc0&&!(B.q&&B.q.t))B.opts.shotclock=B.opts.sc0;return r})(nextQ);
function czTqHtml(){const q=B.q,T=B.tq,need=q.ok.length;
 const cnt=T.picked.length,ready=cnt===need;
 return`<div id="qAns" class="tqgrid">${T.opts.map((o,k)=>{const p=T.picked.indexOf(k),gone=T.gone.has(k);
   return`<button class="ans tq${p>=0?' pick':''}${gone?' gone':''}${k===T.cur?' sel':''}" data-k="${k}" ${gone||T.locked?'disabled':''} onclick="czTqTap(${k})">${q.t==='order'?`<b class="ord">${p>=0?p+1:'·'}</b>`:`<b class="chk">${p>=0?'✔':''}</b>`} ${esc(o)}</button>`}).join('')}</div>
 <div class="tqbar"><span>${q.t==='order'?`Tap them in order (${esc(q.lead)}).`:`Pick ${need}.`} <b>${cnt}/${need}</b></span><button class="tool" ${cnt&&!T.locked?'':'disabled'} onclick="czTqClear()">↩ Clear</button><button class="tool go${T.cur===T.opts.length?' sel':''}" ${ready&&!T.locked?'':'disabled'} onclick="czTqLock()">✔ Lock it in</button></div>`}
renderQ=(orig=>function(){if(!B||!B.q||!B.q.t)return orig.apply(this,arguments);czTqInit();
 const r=orig.apply(this,arguments);const a=$('#qAns');if(a)a.outerHTML=czTqHtml();
 const t=$('#qText');if(t&&!t.querySelector('.tqtag'))t.insertAdjacentHTML('afterbegin',`<span class="tqtag">${B.q.t==='order'?'🔢 PUT IN ORDER':'☑️ PICK '+B.q.ok.length}</span> `);return r})(renderQ);
function czTqRedraw(){const a=$('#qAns'),bar=$('.tqbar');if(!a||!czTQ())return;const tmp=document.createElement('div');tmp.innerHTML=czTqHtml();a.replaceWith(tmp.children[0]);bar&&bar.replaceWith(tmp.children[0])}
function czTqTap(k){const T=czTQ();if(!T||T.locked||B.phase!=='question'||T.gone.has(k)||(T.fixed&&T.fixed.has(k)))return;const q=B.q,i=T.picked.indexOf(k);
 if(q.t==='order'){if(i>=0)T.picked.splice(i)/* tapping a placed one un-places it and everything after */;else if(T.picked.length<q.ok.length)T.picked.push(k)}
 else{if(i>=0)T.picked.splice(i,1);else if(T.picked.length<q.ok.length)T.picked.push(k)}
 T.cur=k;SFX.blip&&SFX.blip();czTqRedraw()}
function czTqClear(){const T=czTQ();if(!T||T.locked)return;T.picked=T.picked.filter(k=>T.fixed&&T.fixed.has(k));czTqRedraw()}
function czTqLock(){const T=czTQ();if(!T||T.locked||B.phase!=='question')return;const q=B.q;if(T.picked.length!==q.ok.length)return;T.locked=true;
 let right=0,ok;
 if(q.t==='order'){T.picked.forEach((k,pos)=>{if(T.opts[k]===q.ok[pos])right++});ok=right===q.ok.length}
 else{T.picked.forEach(k=>{if(q.ok.includes(T.opts[k]))right++});ok=right===q.ok.length}
 // show which were right
 document.querySelectorAll('#qAns .tq').forEach(el=>{const k=+el.dataset.k,o=T.opts[k],p=T.picked.indexOf(k);el.disabled=true;
  if(q.t==='order'){if(p>=0)el.classList.add(T.opts[k]===q.ok[p]?'right':'wrong');const want=q.ok.indexOf(o);if(want>=0&&!(p>=0&&want===p))el.insertAdjacentHTML('beforeend',` <small class="should">→ ${want+1}</small>`)}
  else{if(q.ok.includes(o))el.classList.add(p>=0?'right':'miss');else if(p>=0)el.classList.add('wrong')}});
 const bar=$('.tqbar');if(bar)bar.innerHTML=`<span><b>${right} of ${q.ok.length}</b> ${q.t==='order'?'in the right spot':'right'}${ok?' 🎯':''}</span>`;
 // the game's answer step marks '#qAns .ans' buttons by position; keep this layout's own marks instead
 const els=[...document.querySelectorAll('#qAns .tq')],keep=els.map(el=>el.className);
 B.ans=[q.a,'✗'];answer(ok?0:1);els.forEach((el,i)=>{el.className=keep[i];el.disabled=true})}
// hint: removes two wrong answers (pick) or places the first one for you (order)
useHint=(orig=>function(){const T=czTQ();if(!T)return orig.apply(this,arguments);if(B.phase!=='question'||!S.inv.hint||B.removed.size||T.locked)return;S.inv.hint--;const q=B.q;
 if(q.t==='order'){const k=T.opts.indexOf(q.ok[0]);T.picked=[k];T.fixed=new Set([k])}
 else{const wrong=T.opts.map((o,k)=>k).filter(k=>!q.ok.includes(T.opts[k])&&!T.picked.includes(k));shuffle(wrong);wrong.slice(0,2).forEach(k=>T.gone.add(k))}
 B.removed.add(-9);SFX.item&&SFX.item();updHud();renderQ()})(useHint);
// keyboard / gamepad: arrows move, A taps (or locks in when on the Lock button), number keys tap
press=(orig=>function(k,v){const T=state==='battle'&&B&&B.phase==='question'&&!B.bag?czTQ():null;if(!T)return orig.apply(this,arguments);
 const n=T.opts.length;
 if(k==='ANS'){if(v<n)czTqTap(v);return}
 if(k==='DIR'){const m={left:-1,right:1,up:-2,down:2}[v]||0;let c=T.cur;for(let t=0;t<n+1;t++){c=(c+m+n+1)%(n+1);if(c===n||!T.gone.has(c))break}T.cur=c;czTqRedraw();SFX.blip&&SFX.blip();return}
 if(k==='A'){if(T.cur===n)czTqLock();else czTqTap(T.cur);return}
 return orig.apply(this,arguments)})(press);
(()=>{const st=document.createElement('style');st.textContent=`
#qAns.tqgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#qAns .tq{position:relative;text-align:left}#qAns .tq.pick{background:#ffe9a8;box-shadow:inset 0 0 0 2px #e8900c}
#qAns .tq .ord,#qAns .tq .chk{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:50%;background:#2a1a12;color:#fff;font-size:12px;margin-right:4px}
#qAns .tq.pick .ord,#qAns .tq.pick .chk{background:#e8900c}
#qAns .tq.miss{box-shadow:inset 0 0 0 3px #2e9e50;background:#e6f6e9}#qAns .tq .should{color:#2e7a3e;font-weight:800}
.tqbar{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:13px}.tqbar span{flex:1}.tqbar .tool.sel{outline:3px solid #ffd84a}
.tqtag{display:inline-block;font-size:11px;background:#2a1a12;color:#ffd84a;border-radius:4px;padding:1px 5px;vertical-align:middle}
@media (max-width:600px){#qAns.tqgrid{grid-template-columns:1fr 1fr;gap:4px}#qAns .tq{font-size:12px;padding:6px}}`;document.head.appendChild(st)})();
