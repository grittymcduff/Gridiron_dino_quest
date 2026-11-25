// ===================== CLOUD SAVES (sign in with Google) =====================
// The game still saves to this device as always. When the player signs in with Google, the save is
// also copied to their account (Supabase table dq_saves, through dq_save_get / dq_save_put), so they
// can pick it up on another device. If two devices both changed the save, the player chooses which to keep.
const CZ_CLOUD={user:null,ready:false,busy:false,timer:0,asking:false,lastAt:0,err:null};
function czCloudMeta(){try{return JSON.parse(localStorage.getItem('dq_cloud'))||{}}catch(e){return{}}}
function czCloudSetMeta(m){try{localStorage.setItem('dq_cloud',JSON.stringify(m))}catch(e){}}
function czCloudEsc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function czCloudWho(){const u=CZ_CLOUD.user;if(!u)return'';const m=u.user_metadata||{};return m.full_name||m.name||u.email||'your account'}
function czCloudAgo(t){if(!t)return'never';const s=Math.max(0,(Date.now()-new Date(t).getTime())/1000);
 if(s<60)return'just now';if(s<3600)return Math.round(s/60)+' min ago';if(s<86400)return Math.round(s/3600)+' hr ago';return new Date(t).toLocaleDateString()}
function czCloudSum(s){if(!s)return'—';const n=(s.team&&s.team.roster||[]).length;
 return`${czCloudEsc(s.hero&&s.hero.name||'Brady')} · Lv ${s.lv|0} · 🪙 ${s.coins|0} · 🦖 ${n}<br><small>saved ${czCloudAgo(s.savedAt)}</small>`}

// ---- start-up: finish a Google sign-in that just came back, or pick up an existing one ----
async function czCloudInit(){
 const q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.slice(1));
 const back=q.has('code')||q.has('error')||h.has('access_token')||h.has('error');
 let has=false;try{has=!!localStorage.getItem('dq-auth')}catch(e){}
 if(!back&&!has){czCloudUI();return}
 try{const sb=await czSb();
  sb.auth.onAuthStateChange((ev,sess)=>{const u=sess&&sess.user;CZ_CLOUD.user=u&&!u.is_anonymous?u:null;czCloudUI()});
  const{data}=await sb.auth.getSession();const u=data&&data.session&&data.session.user;CZ_CLOUD.user=u&&!u.is_anonymous?u:null}
 catch(e){CZ_CLOUD.err=String(e&&e.message||e)}
 const bad=q.get('error_description')||h.get('error_description');
 if(back){try{history.replaceState(null,'',location.pathname)}catch(e){}}
 CZ_CLOUD.ready=true;czCloudUI();
 if(bad){toast('☁️ Google sign-in didn\'t finish: '+bad.slice(0,80));return}
 if(CZ_CLOUD.user){if(back)toast('☁️ Signed in as '+czCloudWho());czCloudSync()}}

async function czCloudSignIn(){
 if(S&&state!=='title')saveGame(true);
 try{const sb=await czSb();const r=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(r.error)throw r.error}
 catch(e){toast('☁️ Couldn\'t start Google sign-in. Try again in a moment.')}}
async function czCloudSignOut(){
 try{await czCloudUpload(true)}catch(e){}
 try{await CZ_NET.sb.auth.signOut({scope:'local'})}catch(e){}
 CZ_CLOUD.user=null;czCloudSetMeta({});czCloudUI();czCloudDialog(false);
 toast('☁️ Signed out. Your game is still saved on this device.');
 if(CZ_NET.room&&S&&state!=='title'){const c=CZ_NET.room;await czNetLeave(true);czNetJoin(c)}}

// ---- keeping this device and the cloud in step ----
async function czCloudSync(){const u=CZ_CLOUD.user;if(!u||CZ_CLOUD.busy||CZ_CLOUD.asking)return;CZ_CLOUD.busy=true;
 try{const r=await CZ_NET.sb.rpc('dq_save_get');if(r.error)throw r.error;const cloud=r.data;
  const local=loadSave(),m=czCloudMeta(),same=m.uid===u.id,dirty=!same||!!m.dirty;
  if(!cloud){if(local)await czCloudPut(local,null,true);else czCloudSetMeta({uid:u.id,at:null,dirty:false});return}
  if(same&&cloud.at===m.at){if(dirty&&local)await czCloudPut(local,m.at);return}
  // the cloud has a save this device hasn't seen yet
  if(!local||(same&&!m.dirty)){czCloudAdopt(cloud);return}
  if(local.savedAt&&cloud.save&&local.savedAt===cloud.save.savedAt){czCloudSetMeta({uid:u.id,at:cloud.at,dirty:false});return}
  CZ_CLOUD.busy=false;czCloudChoose(local,cloud)}
 catch(e){CZ_CLOUD.err=String(e&&e.message||e)}
 finally{CZ_CLOUD.busy=false;czCloudUI()}}
async function czCloudPut(save,base,force){const u=CZ_CLOUD.user;if(!u)return;
 const r=await CZ_NET.sb.rpc('dq_save_put',{p_save:save,p_base:base,p_force:!!force});if(r.error)throw r.error;
 if(r.data&&r.data.conflict){CZ_CLOUD.busy=false;await czCloudSync();return}
 czCloudSetMeta({uid:u.id,at:r.data.at,dirty:false});CZ_CLOUD.lastAt=Date.now();CZ_CLOUD.err=null;czCloudUI()}
async function czCloudUpload(now){clearTimeout(CZ_CLOUD.timer);CZ_CLOUD.timer=0;const u=CZ_CLOUD.user;if(!u||CZ_CLOUD.asking)return;
 const m=czCloudMeta();if(m.uid!==u.id){czCloudSync();return}if(!m.dirty)return;const local=loadSave();if(!local)return;
 if(CZ_CLOUD.busy){if(!now)CZ_CLOUD.timer=setTimeout(()=>czCloudUpload(),4000);return}
 CZ_CLOUD.busy=true;try{await czCloudPut(local,m.at)}catch(e){CZ_CLOUD.err=String(e&&e.message||e);czCloudUI()}finally{CZ_CLOUD.busy=false}}
function czCloudAdopt(cloud){const u=CZ_CLOUD.user;try{localStorage.setItem(SAVE_KEY,JSON.stringify(cloud.save))}catch(e){}
 czCloudSetMeta({uid:u.id,at:cloud.at,dirty:false});
 if(state==='title'||!S){if(typeof showTitle==='function')showTitle();toast('☁️ Loaded your cloud save. Press Continue to play.')}
 else{if(typeof closeMenu==='function')try{closeMenu()}catch(e){}if(typeof B!=='undefined'&&B)try{endBattle()}catch(e){}startGame(cloud.save,false);saveGame(true);czCloudSetMeta({uid:u.id,at:cloud.at,dirty:false});toast('☁️ Loaded your cloud save.')}}

// every local save marks the cloud copy out of date and uploads it a few seconds later
saveGame=(orig=>function(silent){const ok=orig.apply(this,arguments);if(ok){const m=czCloudMeta();if(!m.dirty){m.dirty=true;czCloudSetMeta(m)}
 if(CZ_CLOUD.user&&!CZ_CLOUD.timer)CZ_CLOUD.timer=setTimeout(()=>czCloudUpload(),8000)}return ok})(saveGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&CZ_CLOUD.user)setTimeout(()=>czCloudUpload(true),0)});
window.addEventListener('focus',()=>{if(CZ_CLOUD.user&&state==='title')czCloudSync()});

// ---- screens ----
function czCloudDialog(show,html){let d=$('#czCloud');if(!d){d=document.createElement('div');d.id='czCloud';d.innerHTML='<div class="box"></div>';document.body.appendChild(d)}
 if(!show){d.style.display='none';return}d.style.display='flex';const b=d.querySelector('.box');
 if(html){b.innerHTML=html;return}
 if(!CZ_CLOUD.user){b.innerHTML=`<h3>☁️ Save to the cloud</h3><p>Sign in with Google to keep your game in the cloud. Then you can keep playing on any phone, tablet or computer by signing in there too.</p>
  <p><small>We only use your Google name and email to find your save (<a href="privacy.html" target="_blank" rel="noopener">privacy</a>). Grown-ups: some kids' Google accounts can't sign in to games; a parent's account works fine.</small></p>
  <div class="row"><button id="czcGo">Sign in with Google</button></div><div class="row"><button id="czcX">Not now</button></div>`;
  $('#czcGo').onclick=()=>{b.innerHTML='<h3>☁️ Going to Google…</h3><p>You\'ll come right back here after signing in.</p>';czCloudSignIn()};$('#czcX').onclick=()=>czCloudDialog(false);return}
 const m=czCloudMeta();
 b.innerHTML=`<h3>☁️ Cloud save is on</h3><p>Signed in as <b>${czCloudEsc(czCloudWho())}</b>.</p><p>Your game saves to the cloud by itself. On another device, sign in with the same Google account to pick up where you left off.</p>
  <p><small>${CZ_CLOUD.err?'⚠️ Last try didn\'t reach the cloud; it will try again.':'Last cloud save: '+czCloudAgo(m.at)}</small></p>
  <div class="row"><button id="czcNow">Save to cloud now</button></div><div class="row"><button id="czcOut">Sign out</button><button id="czcX">Close</button></div>`;
 $('#czcNow').onclick=async()=>{if(S&&state!=='title')saveGame(true);else{const mm=czCloudMeta();if(mm.uid!==CZ_CLOUD.user.id){await czCloudSync()}}await czCloudUpload(true);czCloudDialog(true);toast(CZ_CLOUD.err?'☁️ Couldn\'t reach the cloud right now':'☁️ Saved to the cloud')};
 $('#czcOut').onclick=()=>czCloudSignOut();$('#czcX').onclick=()=>czCloudDialog(false)}
function czCloudChoose(local,cloud){CZ_CLOUD.asking=true;
 czCloudDialog(true,`<h3>☁️ Which save do you want?</h3><p>This device and your cloud save are different. Pick one to keep. The other one will be replaced.</p>
  <div class="pick"><button id="czcL"><b>This device</b><br>${czCloudSum(local)}</button><button id="czcC"><b>Cloud save</b><br>${czCloudSum(cloud.save)}</button></div>`);
 const done=()=>{CZ_CLOUD.asking=false;czCloudDialog(false)};
 $('#czcL').onclick=async()=>{done();try{await czCloudPut(loadSave()||local,null,true);toast('☁️ Kept this device\'s save')}catch(e){toast('☁️ Couldn\'t reach the cloud right now')}};
 $('#czcC').onclick=()=>{done();czCloudAdopt(cloud)}}
function czCloudUI(){const tb=$('#titleBtns');if(tb&&!$('#btnTitleCloud')){const b=document.createElement('button');b.id='btnTitleCloud';b.onclick=()=>czCloudDialog(true);tb.appendChild(b)}
 const b=$('#btnTitleCloud');if(b)b.textContent=CZ_CLOUD.user?'☁️ Cloud save on':'☁️ Save to cloud';
 const o=$('#czCloudOpt');if(o)o.innerHTML=czCloudOptHtml()}
function czCloudOptHtml(){return CZ_CLOUD.user?`☁️ Cloud save is on (${czCloudEsc(czCloudWho())}) <button onclick="czCloudDialog(true)">Manage</button>`:`☁️ Keep your game on any device: <button onclick="czCloudDialog(true)">Sign in with Google</button>`}
renderMenu=(orig=>function(){orig.apply(this,arguments);if(menuTab==='opt'){const mb=$('#menuBody');if(mb&&!$('#czCloudOpt')){const d=document.createElement('div');d.id='czCloudOpt';d.className='help';d.style.marginTop='8px';d.innerHTML=czCloudOptHtml();mb.appendChild(d)}}})(renderMenu);
(()=>{const st=document.createElement('style');st.textContent=`#czCloud{position:fixed;inset:0;z-index:61;display:none;align-items:center;justify-content:center;background:rgba(16,11,30,.55)}
#czCloud,#czCloud *{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
#czCloud .box{background:#fbf1dc;border:3px solid #2a1a12;border-radius:10px;padding:16px 18px;max-width:380px;width:90%;color:#2a1a12;box-shadow:0 6px 0 #2a1a12}
#czCloud h3{margin:0 0 8px;font-size:17px}#czCloud p{margin:6px 0;font-size:13px;line-height:1.35}
#czCloud .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#czCloud .row button{flex:1;min-width:90px}
#czCloud .pick{display:flex;gap:8px;margin-top:10px}#czCloud .pick button{flex:1;text-align:left;font-size:12px;line-height:1.5;padding:8px;background:#fff;border:2px solid #2a1a12;border-radius:8px}
#czCloud .pick button:hover{background:#ffd84a}`;document.head.appendChild(st)})();
setTimeout(czCloudInit,0);
