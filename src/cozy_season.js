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
