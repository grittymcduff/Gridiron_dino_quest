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
setInterval(()=>{let want=null;try{want=desiredTrack()}catch(e){}if(want&&want!==CZ_MF.track){CZ_MF.track=want;CZ_MF.start=performance.now()}
 if(MUS.gain)MUS.gain.gain.setTargetAtTime(czMusTarget(),MUS.gain.context.currentTime,.25)},250);
function czSetMusVol(v){SETS.mvol=Math.max(0,Math.min(100,Math.round(+v)));saveSet();CZ_MF.start=performance.now();const p=$('#musPct');if(p)p.textContent=SETS.mvol+'%'}
function czSetMusKeep(on){SETS.mkeep=!!on;saveSet();CZ_MF.start=performance.now()}
renderMenu=(orig=>function(){orig.apply(this,arguments);if(menuTab!=='opt'||$('#czMusRow'))return;const v=$('#menuBody .volRow');if(!v)return;
 v.insertAdjacentHTML('afterend',`<label class="volRow" id="czMusRow">🎵 Music <input type="range" min="0" max="100" step="5" value="${SETS.mvol}" oninput="czSetMusVol(this.value)"> <span id="musPct">${SETS.mvol}%</span></label>`+
  `<label class="czMusKeep"><input type="checkbox" ${SETS.mkeep?'checked':''} onchange="czSetMusKeep(this.checked)"> Keep music playing <small>(otherwise it fades out after about a minute and a half, and comes back for a new area or battle)</small></label>`)})(renderMenu);
(()=>{const st=document.createElement('style');st.textContent='.opt .czMusKeep{display:block;width:100%;font-size:12px;margin:0 0 8px}.opt .czMusKeep small{opacity:.75}';document.head.appendChild(st)})();

// ===================== RECORDED MUSIC =====================
// Real songs replace the chiptune for battles and for traveling outdoors. They play through the same Music level
// (default 5%) and the same fade-out. Each file is turned down ("trim") so it sits at the chiptune's loudness.
// Exploration alternates between two songs. If a file can't load (or the game is opened from a local file),
// the chiptune plays instead.
const CZ_SONGS={
 battle:[{src:'audio/battle_rise_of_the_horizon.m4a',trim:.27,loop:true}],
 field:[{src:'audio/explore_map_of_wonder.m4a',trim:.19},{src:'audio/explore_pathfinder_playtime.m4a',trim:.165}]};
CZ_SONGS.boss=CZ_SONGS.battle;
const CZ_SP={el:null,trim:null,group:null,song:null,ok:location.protocol!=='file:'&&typeof Audio!=='undefined',routed:false,unlocked:false,silenced:{},lastField:-1};
function czSongGroup(t){return CZ_SONGS[t]?t:null}
function czSongMute(group,on){// silence (or bring back) the chiptune for this part of the game
 if(on){if(!CZ_SP.silenced[group]){CZ_SP.silenced[group]=TRACKS[group];TRACKS[group]={bpm:TRACKS[group].bpm,lead:['.'],bass:['.'],drums:['.']}}}
 else if(CZ_SP.silenced[group]){TRACKS[group]=CZ_SP.silenced[group];delete CZ_SP.silenced[group]}}
function czSongFail(){CZ_SP.ok=false;try{CZ_SP.el&&CZ_SP.el.pause()}catch(e){}for(const g of Object.keys(CZ_SP.silenced))czSongMute(g,false)}
function czSongSetup(){if(!CZ_SP.ok||CZ_SP.el)return;const el=new Audio();el.preload='none';el.playsInline=true;el.setAttribute('playsinline','');
 el.addEventListener('error',()=>{if(el.src)czSongFail()});el.addEventListener('ended',()=>{if(CZ_SP.group==='field')czSongStart('field',true)});CZ_SP.el=el}
function czSongRoute(){if(CZ_SP.routed||!CZ_SP.ok||!CZ_SP.el||!MUS.gain)return false;
 try{const a=MUS.gain.context,src=a.createMediaElementSource(CZ_SP.el),g=a.createGain();g.gain.value=.2;src.connect(g);g.connect(MUS.gain);CZ_SP.trim=g;CZ_SP.routed=true;
  for(const k of Object.keys(CZ_SONGS))czSongMute(k,true)}catch(e){czSongFail();return false}return true}
function czSongStart(group,next){const list=CZ_SONGS[group];if(!list||!CZ_SP.routed)return;let i=0;
 if(group==='field'){i=list.length>1?(CZ_SP.lastField<0?Math.floor(Math.random()*list.length):(CZ_SP.lastField+1)%list.length):0;CZ_SP.lastField=i}
 const s=list[i],el=CZ_SP.el;CZ_SP.group=group;CZ_SP.song=s;if(CZ_SP.trim)CZ_SP.trim.gain.value=s.trim;el.loop=!!s.loop;
 if(!el.src.endsWith(s.src)){el.preload='auto';el.src=s.src}else el.currentTime=0;el.play().catch(()=>{})}
// browsers only let sound start after a tap or key press: unlock the player on the first one
['pointerdown','keydown','touchend'].forEach(ev=>addEventListener(ev,()=>{czSongSetup();if(!CZ_SP.el||CZ_SP.unlocked)return;const el=CZ_SP.el;
 if(!el.src)el.src=CZ_SONGS.field[0].src;el.muted=true;el.play().then(()=>{if(!CZ_SP.group)el.pause();el.muted=false;CZ_SP.unlocked=true}).catch(()=>{el.muted=false})},{capture:true,passive:true}));
setInterval(()=>{if(!CZ_SP.ok)return;czSongSetup();if(!CZ_SP.routed&&!czSongRoute())return;let want=null;try{want=desiredTrack()}catch(e){}
 const g=czSongGroup(want),gone=!SETS.music||(!SETS.mkeep&&(performance.now()-CZ_MF.start)/1000>CZ_MF.PLAY+CZ_MF.FADE+1);
 const same=g&&(CZ_SP.group===g||(CZ_SONGS[g]===CZ_SONGS[CZ_SP.group]));
 if(!g||gone){if(!CZ_SP.el.paused)CZ_SP.el.pause();if(!g)CZ_SP.group=null;return}
 if(!same)czSongStart(g);else if(CZ_SP.el.paused&&CZ_SP.unlocked)CZ_SP.el.play().catch(()=>{})},250);
