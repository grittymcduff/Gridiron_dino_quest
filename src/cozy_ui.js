// ===================== SMALL LAYOUT FIXES =====================
// Title screen on phones and tablets: logo at the top, the hero-and-dino scene left clear in the middle,
// and the buttons as a compact 3-across grid down on the grass. The keyboard help line is hidden (it doesn't apply to touch).
(()=>{const st=document.createElement('style');st.textContent=`
body.touch #title{justify-content:flex-start;padding:6px 8px 8px;box-sizing:border-box}
body.touch #titleArt{flex:1 1 auto;min-height:0}
body.touch #titleFoot{display:none}
body.touch #titleBtns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 5px;width:min(100%,520px)}
body.touch #titleBtns button{font-size:11px;line-height:1.2;padding:7px 5px;min-height:0;white-space:normal;overflow:hidden;text-overflow:ellipsis}
body.touch #titleBtns button[style*="display: none"],body.touch #titleBtns button.hidden{display:none}
`;document.head.appendChild(st)})();

// ===================== MUSIC: quieter, and fades out =====================
// Music has its own level (default 5%, on top of the main Volume). Each time a new piece starts
// (title, an area, a battle) it plays for 90 seconds, then fades out over 20 seconds. "Keep music playing" turns the fade off.
if(SETS.mvol==null)SETS.mvol=5;
const CZ_MF={track:null,start:performance.now(),PLAY:90,FADE:20};
function czMusTarget(){if(!SETS.music)return 0;const base=SETS.mvol/100;if(SETS.mkeep)return base;const el=(performance.now()-CZ_MF.start)/1000;
 if(el<CZ_MF.PLAY)return base;if(el>CZ_MF.PLAY+CZ_MF.FADE)return 0;return base*(1-(el-CZ_MF.PLAY)/CZ_MF.FADE)}
musOut=ccPatch(musOut,[["MUS.gain.gain.value=SETS.music?1:0","MUS.gain.gain.value=czMusTarget()"]]);
setMusic=ccPatch(setMusic,[["MUS.gain.gain.setTargetAtTime(on?1:0,a.currentTime,.1)","CZ_MF.start=performance.now();MUS.gain.gain.setTargetAtTime(czMusTarget(),a.currentTime,.1)"]]);
setInterval(()=>{let want=null;try{want=desiredTrack()}catch(e){}if(want&&want!==CZ_MF.track){CZ_MF.track=want;if(!(typeof CZ_SP!=='undefined'&&CZ_SP.routed))CZ_MF.start=performance.now()}
 if(MUS.gain)MUS.gain.gain.setTargetAtTime(czMusTarget(),MUS.gain.context.currentTime,.25)},250);
function czSetMusVol(v){SETS.mvol=Math.max(0,Math.min(100,Math.round(+v)));saveSet();CZ_MF.start=performance.now();const p=$('#musPct');if(p)p.textContent=SETS.mvol+'%'}
function czSetMusKeep(on){SETS.mkeep=!!on;saveSet();CZ_MF.start=performance.now()}
renderMenu=(orig=>function(){orig.apply(this,arguments);if(menuTab!=='opt'||$('#czMusRow'))return;const v=$('#menuBody .volRow');if(!v)return;
 v.insertAdjacentHTML('afterend',`<label class="volRow" id="czMusRow">🎵 Music <input type="range" min="0" max="100" step="5" value="${SETS.mvol}" oninput="czSetMusVol(this.value)"> <span id="musPct">${SETS.mvol}%</span></label>`+
  `<label class="czMusKeep"><input type="checkbox" ${SETS.mkeep?'checked':''} onchange="czSetMusKeep(this.checked)"> Keep music playing <small>(otherwise each song fades out after about a minute and a half, with a short quiet break before the next one)</small></label>`)})(renderMenu);
(()=>{const st=document.createElement('style');st.textContent='.opt .czMusKeep{display:block;width:100%;font-size:12px;margin:0 0 8px}.opt .czMusKeep small{opacity:.75}';document.head.appendChild(st)})();

// ===================== RECORDED MUSIC =====================
// One continuous soundtrack: the two exploration songs alternate everywhere (title, towns, every area, wild battles,
// Daily Challenge), with no restarts when you change area. The battle song fades in as you walk toward a boss you
// haven't beaten (Head Coaches, the Commissioner, guarded gold chests, the GOAT), plays through the boss fight,
// and fades back to the exploration song as you walk away.
// Everything goes through the Music level (default 5%). Each song plays ~90 s, fades out over 20 s, and after a
// quiet break of ~2 minutes the next song fades in ("Keep music playing" turns the fade and break off).
// Each file is turned down ("trim") to sit at the old chiptune's loudness. If a file can't load, or the game is
// opened from a local file, the chiptune plays as before.
const CZ_SONGS={explore:[{src:'audio/explore_map_of_wonder.m4a',trim:.19},{src:'audio/explore_pathfinder_playtime.m4a',trim:.165}],
 boss:{src:'audio/battle_rise_of_the_horizon.m4a',trim:.27}};
const CZ_SP={ok:location.protocol!=='file:'&&typeof Audio!=='undefined',A:null,Bm:null,gA:null,gB:null,routed:false,unlocked:false,idx:-1,mix:0,want:0,saved:null,BREAK:120,
 NEAR:5,FAR:14};
function czSongFail(){CZ_SP.ok=false;for(const el of[CZ_SP.A,CZ_SP.Bm])try{el&&el.pause()}catch(e){}if(CZ_SP.saved){Object.assign(TRACKS,CZ_SP.saved);CZ_SP.saved=null}}
function czSongSetup(){if(!CZ_SP.ok||CZ_SP.A)return;const mk=()=>{const el=new Audio();el.preload='none';el.playsInline=true;el.setAttribute('playsinline','');el.addEventListener('error',()=>{if(el.src)czSongFail()});return el};
 CZ_SP.A=mk();CZ_SP.Bm=mk();CZ_SP.Bm.loop=true;CZ_SP.A.addEventListener('ended',()=>czSongNext())}
function czSongRoute(){if(CZ_SP.routed||!CZ_SP.ok||!CZ_SP.A||!MUS.gain)return false;
 try{const a=MUS.gain.context,mk=el=>{const g=a.createGain();g.gain.value=0;a.createMediaElementSource(el).connect(g);g.connect(MUS.gain);return g};CZ_SP.gA=mk(CZ_SP.A);CZ_SP.gB=mk(CZ_SP.Bm);CZ_SP.routed=true;
  // the recordings replace every chiptune track (kept so they can come back if a file fails)
  CZ_SP.saved={};for(const k of Object.keys(TRACKS)){CZ_SP.saved[k]=TRACKS[k];TRACKS[k]={bpm:TRACKS[k].bpm,lead:['.'],bass:['.'],drums:['.']}}}
 catch(e){czSongFail();return false}return true}
function czSongNext(){const L=CZ_SONGS.explore;CZ_SP.idx=CZ_SP.idx<0?Math.floor(Math.random()*L.length):(CZ_SP.idx+1)%L.length;const s=L[CZ_SP.idx],el=CZ_SP.A;
 el.preload='auto';el.src=s.src;CZ_SP.trimA=s.trim;CZ_MF.start=performance.now();if(SETS.music)el.play().catch(()=>{})}
// how strongly the battle song should play: 1 in a boss fight, rising as you near an unbeaten boss on the map
function czBossWant(){if(!S||typeof map==='undefined'||!map)return 0;
 if(B)return(B.opts&&(B.opts.legend||B.opts.secretBoss))||(B.en&&B.en.boss)?1:CZ_SP.want;
 if(state==='title')return 0;let d=1e9;const px=player.x,py=player.y;
 for(const b of bosses){if(S.bosses&&S.bosses[b.poi])continue;if(b.secret&&!S.sanctum)continue;d=Math.min(d,Math.hypot(b.x-px,b.y-py))}
 for(const it of items){if(!it.legend||S.taken[it.id])continue;d=Math.min(d,Math.hypot(it.x-px,it.y-py))}
 return Math.max(0,Math.min(1,(CZ_SP.FAR-d)/(CZ_SP.FAR-CZ_SP.NEAR)))}
['pointerdown','keydown','touchend'].forEach(ev=>addEventListener(ev,()=>{czSongSetup();if(!CZ_SP.A||CZ_SP.unlocked)return;CZ_SP.unlocked=true;
 for(const el of[CZ_SP.A,CZ_SP.Bm]){if(!el.src)el.src=el===CZ_SP.Bm?CZ_SONGS.boss.src:CZ_SONGS.explore[0].src;el.muted=true;el.play().then(()=>{el.pause();el.muted=false}).catch(()=>{el.muted=false})}},{capture:true,passive:true}));
setInterval(()=>{if(!CZ_SP.ok)return;czSongSetup();if(!CZ_SP.routed&&!czSongRoute())return;const A=CZ_SP.A,Bm=CZ_SP.Bm;
 if(!SETS.music){if(!A.paused)A.pause();if(!Bm.paused)Bm.pause();return}
 // battle song mix: eases over ~4 s; getting close to a boss also brings the music back from a quiet break
 const was=CZ_SP.want;CZ_SP.want=czBossWant();if(was<.05&&CZ_SP.want>=.05)CZ_MF.start=performance.now();
 CZ_SP.mix+=Math.max(-.0625,Math.min(.0625,CZ_SP.want-CZ_SP.mix));if(CZ_SP.mix<.002)CZ_SP.mix=0;
 const el=(performance.now()-CZ_MF.start)/1000,quiet=!SETS.mkeep&&el>CZ_MF.PLAY+CZ_MF.FADE;
 if(CZ_SP.idx<0){czSongNext();return}
 if(quiet){if(!A.paused)A.pause();if(!Bm.paused)Bm.pause();if(el>CZ_MF.PLAY+CZ_MF.FADE+CZ_SP.BREAK&&CZ_SP.want<.05)czSongNext();return}
 CZ_SP.gA.gain.setTargetAtTime((CZ_SP.trimA||.18)*(1-CZ_SP.mix),CZ_SP.gA.context.currentTime,.2);CZ_SP.gB.gain.setTargetAtTime(CZ_SONGS.boss.trim*CZ_SP.mix,CZ_SP.gB.context.currentTime,.2);
 if(CZ_SP.mix>=.999){if(!A.paused)A.pause()}else if(A.paused&&CZ_SP.unlocked)A.play().catch(()=>{});
 if(CZ_SP.mix>0){if(Bm.paused&&CZ_SP.unlocked){if(!Bm.src.endsWith(CZ_SONGS.boss.src)){Bm.preload='auto';Bm.src=CZ_SONGS.boss.src}if(CZ_SP.restartB){Bm.currentTime=0;CZ_SP.restartB=false}Bm.play().catch(()=>{})}}
 else if(!Bm.paused){Bm.pause();CZ_SP.restartB=true}},250);
