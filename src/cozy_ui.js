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
