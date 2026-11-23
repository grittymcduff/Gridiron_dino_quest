// ============================================================================
//  SEASON CLOCK + SEASON ACHIEVEMENTS
//  The day/night clock is saved with the game (S.st.ticks, 60 per second of play),
//  so "Day N" keeps counting across sessions. One in-game day = COZY.cycle ticks (10 min).
// ============================================================================
function czTicks(){return S&&S.st&&S.st.ticks!=null&&state!=='title'?S.st.ticks:frame}
function czDayPhase(){return(COZY.cycleStart+czTicks()/COZY.cycle)%1}
function czDay(){return Math.floor(COZY.cycleStart+czTicks()/COZY.cycle)+1}
const CZ_SEASON={days:15,realDays:7};
// count play time; note the day and real days when the Commissioner falls
let czLastFrame=0,czLastDay=0;
loop=(orig=>function(t){const f0=frame;orig(t);const n=frame-f0;
 if(!S||!S.st||state==='title'){czLastDay=0;return}
 if(S.st.ticks==null)czSeasonInit();S.st.ticks+=n;
 const d=czDay();if(czLastDay&&d>czLastDay&&state==='world')toast(`☀️ Day ${d}`);czLastDay=d;
 if(S.champion&&S.st.champDay==null&&!S.st.lateStart){S.st.champDay=d;S.st.champReal=(Date.now()-S.st.startedAt)/864e5;saveGame(true)}})(loop);
function czSeasonInit(){S.st.ticks=0;S.st.startedAt=Date.now();
 // saves from before the clock existed can't prove their times, so the two season goals are off for them
 if(!S.cz_new)S.st.lateStart=true}
newSave=(orig=>function(...a){const s=orig(...a);s.cz_new=1;s.st.ticks=0;s.st.startedAt=Date.now();return s})(newSave);

const CZ_TIMED=['season_days','season_week'];
ACH.push(
 {g:'Season Goals',id:'season_days',n:'Two-Minute Drill',d:`Out-coach Commissioner Spino by Day ${CZ_SEASON.days} of the in-game clock (about 2 1/2 hours of play).`,i:'⏱️',t:'plat',c:()=>S.st.champDay!=null&&S.st.champDay<=CZ_SEASON.days},
 {g:'Season Goals',id:'season_week',n:'One-Week Season',d:`Out-coach Commissioner Spino within ${CZ_SEASON.realDays} real days of starting your save.`,i:'📆',t:'gold',c:()=>S.st.champReal!=null&&S.st.champReal<=CZ_SEASON.realDays},
 {g:'Season Goals',id:'perfect',n:'Perfect Season',d:'',i:'💍',t:'plat',c:()=>czPerfect().done});
// the ultimate award: every other achievement (not the two timed ones) and every side quest
function czPerfect(){const ach=ACH.filter(a=>a.id!=='perfect'&&!CZ_TIMED.includes(a.id)),chests=items.filter(i=>i.kind==='chest'),sp=items.filter(i=>i.kind==='sparkle'),
 helpers=npcs.filter(n=>n.kind==='giver'||n.kind==='quiz'),tot=totems;
 const r={a:[ach.filter(a=>S.ach[a.id]).length,ach.length],c:[chests.filter(i=>S.taken[i.id]).length,chests.length],s:[sp.filter(i=>S.taken[i.id]).length,sp.length],
  h:[helpers.filter(n=>S.npc[n.id]).length,helpers.length],t:[tot.filter(o=>S.totem[o.id]!=null).length,tot.length]};
 r.done=Object.values(r).every(v=>!Array.isArray(v)||v[0]>=v[1]);return r}
Object.defineProperty(ACH.find(a=>a.id==='perfect'),'d',{get(){let t='Earn every other achievement (the two timed goals aside), beat every coach, legend and secret boss, and finish every side quest: open every chest, find every sparkle, help every townsperson and rally at every totem.';
 if(!S||!items.length)return t;const r=czPerfect();return t+` Progress: achievements ${r.a[0]}/${r.a[1]} · chests ${r.c[0]}/${r.c[1]} · sparkles ${r.s[0]}/${r.s[1]} · townsfolk ${r.h[0]}/${r.h[1]} · totems ${r.t[0]}/${r.t[1]}`}});
// show the day in the Progress tab
renderMenu=ccPatch(renderMenu,[["Steps ${S.steps}</div>","Steps ${S.steps} · ☀️ Day ${czDay()}</div>"]]);

// ============================================================================
//  DIFFICULTY COACH: watches recent challenges on the current difficulty and
//  suggests moving up (or down) after a challenge ends. Practice reps and the
//  Daily Challenge don't count. "Not now" starts the count over;
//  "Stop asking" turns it off for this save.
// ============================================================================
const CZ_DIFF_ORDER=['rookie','pro','allpro','superfan'],CZ_DIFF_NAME={rookie:'Rookie',pro:'Pro',allpro:'All-Pro',superfan:'Superfan'};
const CZ_UP={answers:25,acc:.85,winsInRow:3},CZ_DOWN={answers:15,acc:.45,lossesOf4:3};
function czDW(){let w=S.cz_dw;if(!w||w.d!==S.diff)w=S.cz_dw={d:S.diff,a:[],g:[]};return w}
recordAnswer=(orig=>function(q,ok){orig(q,ok);if(!S||!B||(B.opts&&B.opts.practice))return;const w=czDW();w.a.push(ok?1:0);if(w.a.length>30)w.a.shift()})(recordAnswer);
victory=(orig=>function(){const pr=B&&B.opts&&B.opts.practice;orig.apply(this,arguments);if(S&&!pr){const w=czDW();w.g.push(1);if(w.g.length>4)w.g.shift()}})(victory);
defeat=(orig=>function(){const pr=B&&B.opts&&B.opts.practice;orig.apply(this,arguments);if(S&&!pr){const w=czDW();w.g.push(0);if(w.g.length>4)w.g.shift()}})(defeat);
endBattle=(orig=>function(){orig.apply(this,arguments);setTimeout(czDiffCheck,900)})(endBattle);
function czDiffCheck(){if(!S||S.cz_noDiffTips||state!=='world')return;const w=czDW(),n=w.a.length;
 const acc=n?w.a.reduce((x,y)=>x+y,0)/n:0,i=CZ_DIFF_ORDER.indexOf(S.diff),last=w.g.slice(-CZ_UP.winsInRow);
 const up=i<3&&n>=CZ_UP.answers&&acc>=CZ_UP.acc&&last.length===CZ_UP.winsInRow&&last.every(x=>x);
 const down=i>0&&((n>=CZ_DOWN.answers&&acc<=CZ_DOWN.acc)||(w.g.length>=4&&w.g.filter(x=>!x).length>=CZ_DOWN.lossesOf4));
 if(!up&&!down)return;const cur=CZ_DIFF_NAME[S.diff],nx=CZ_DIFF_ORDER[i+(up?1:-1)],nn=CZ_DIFF_NAME[nx],right=w.a.reduce((x,y)=>x+y,0);
 const msg=up?`📈 Coach's note: you've got ${right} of your last ${n} ${cur} questions right and won ${CZ_UP.winsInRow} in a row. Ready to move up to ${nn}? Tougher questions, and wins there count toward the harder-difficulty awards.`
  :`📉 Coach's note: ${cur} is giving you a tough time lately (${right} of your last ${n} right). Want to drop to ${nn} for a while? Easier questions help you learn, and you can move back up any time.`;
 choice(msg,[up?`Move up to ${nn}`:`Switch to ${nn}`,'Not now','Stop asking'],k=>{
  if(k===0){S.diff=nx;S.cz_dw={d:nx,a:[],g:[]};toast(`${up?'📈':'📉'} Difficulty: ${nn}`);saveGame(true)}
  else if(k===1){w.a=[];w.g=[]} // start the count over: another 25 answers (or 15 if struggling) before asking again
  else{S.cz_noDiffTips=1;toast('Got it. Change difficulty any time in Menu → Options.')}
  if(k!==0)saveGame(true)})}
