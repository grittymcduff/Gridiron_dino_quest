// ============================================================================
//  ONLINE ROOMS (step 1): see friends in the same world + emotes.
//  - Players who enter the same room code see each other walking around, with
//    their own look (hair, skin, gear) and a name tag.
//  - Emote wheel (E key or the 💬 button): emotes and preset phrases only, no
//    free-text chat.
//  - Uses Supabase Realtime (broadcast for movement/emotes, presence for who's
//    here). Single-player is unchanged when there's no room code or no network.
// ============================================================================
const CZ_NET={
 url:'https://hqozayzhguqbsfahuruc.supabase.co',
 key:'sb_publishable_8Fmhu0ldNTpAIZnzmEdQjg_4DQU_23h', // publishable key: meant to be public
 lib:'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/dist/umd/supabase.js',
 room:null,ch:null,sb:null,onChannel:[],status:'off',peers:{},sprites:{},last:null,lastSend:0,myEmote:null,lastEmote:0,
 // one id per tab (sessionStorage), so two tabs on the same computer are two players
 id:(()=>{try{let v=sessionStorage.getItem('dq_pid');if(!v){v=Math.random().toString(36).slice(2,10);sessionStorage.setItem('dq_pid',v)}return v}catch(e){return Math.random().toString(36).slice(2,10)}})()};
const CZ_EMOTES=[['wave','👋'],['cheer','🎉'],['thumbs','👍'],['spike','🏈'],['dance','🕺'],['laugh','😂'],['heart','❤️'],['wow','😮']];
const CZ_PHRASES=['GG!','Wanna battle?','Follow me!','Nice catch!','Over here!','Be right back'];
const CZ_CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function czNewCode(){let s='';const a=new Uint32Array(8);crypto.getRandomValues(a);for(let i=0;i<8;i++){s+=CZ_CODE_CHARS[a[i]%CZ_CODE_CHARS.length];if(i===3)s+='-'}return s}
function czFmtCode(c){return c&&c.length===8?c.slice(0,4)+'-'+c.slice(4):c||''}
function czCleanCode(c){return String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16)}
function czCleanName(n){return String(n||'Player').replace(/[^A-Za-z0-9 _'.-]/g,'').trim().slice(0,12)||'Player'}

// ---- connection ----------------------------------------------------------
// anonymous sign-in: no email or password, just a per-tab id the server can trust for duels
async function czNetAuth(){try{const{data}=await CZ_NET.sb.auth.getSession();let u=data&&data.session&&data.session.user;
 if(!u){const r=await CZ_NET.sb.auth.signInAnonymously();if(r.error)throw r.error;u=r.data.user}CZ_NET.uid=u.id;CZ_NET.authErr=null}catch(e){CZ_NET.uid=null;CZ_NET.authErr=String(e&&e.message||e)}}
function czLoadLib(){if(window.supabase&&window.supabase.createClient)return Promise.resolve();
 return new Promise((ok,bad)=>{const s=document.createElement('script');s.src=CZ_NET.lib;s.async=true;s.onload=()=>ok();s.onerror=()=>bad(new Error('lib'));document.head.appendChild(s)})}
function czMyLook(){const h=S&&S.hero||{};return{name:czCleanName(h.name||'Brady'),hero:{style:h.style||'shaggy',hair:h.hair,skin:h.skin,fr:!!h.fr},eq:{helmet:S.equip.helmet,pads:S.equip.pads,cleats:S.equip.cleats}}}
function czBusy(){return state==='battle'?'battle':(state==='duel'&&typeof CZ_DUEL!=='undefined'&&CZ_DUEL.cur&&CZ_DUEL.cur.q)?'duel':null}
function czTrackMeta(){return{id:CZ_NET.id,uid:CZ_NET.uid||null,coins:S?S.coins:0,busy:czBusy(),duel:(typeof CZ_DUEL!=='undefined'&&CZ_DUEL.cur&&CZ_DUEL.cur.q)?CZ_DUEL.cur.id:null,look:czMyLook(),...czMyPos()}}
function czMyPos(){return{x:player.x,y:player.y,dir:player.dir,m:player.moving?1:0,r:held.run?1:0}}
async function czNetJoin(code){code=czCleanCode(code);if(!code||code.length<4)return;czNetLeave(true);CZ_NET.room=code;try{localStorage.setItem('dq_room',code)}catch(e){}
 if(!S||state==='title'){CZ_NET.status='waiting';czNetUI();return}
 CZ_NET.status='connecting';czNetUI();
 try{await czLoadLib();if(!CZ_NET.sb)CZ_NET.sb=window.supabase.createClient(CZ_NET.url,CZ_NET.key,{realtime:{params:{eventsPerSecond:10}},auth:{storage:window.sessionStorage,storageKey:'dq-auth',persistSession:true,autoRefreshToken:true}});
  await czNetAuth()}
 catch(e){CZ_NET.status='error';czNetUI();toast("🌐 Couldn't reach the online room. Playing solo for now.");return}
 if(CZ_NET.room!==code)return;
 const ch=CZ_NET.sb.channel('dq-room-'+code,{config:{broadcast:{self:false},presence:{key:CZ_NET.id}}});CZ_NET.ch=ch;
 ch.on('broadcast',{event:'pos'},({payload:p})=>czPeerPos(p));
 ch.on('broadcast',{event:'emote'},({payload:p})=>{const q=CZ_NET.peers[p.id];if(q)q.emote={k:p.k,t:frame}});
 ch.on('broadcast',{event:'hello'},({payload:p})=>{if(p.id!==CZ_NET.id)czSendPos(true)});
 ch.on('presence',{event:'sync'},()=>czPresenceSync());
 for(const f of CZ_NET.onChannel)try{f(ch)}catch(e){}
 ch.subscribe(async st=>{if(CZ_NET.ch!==ch)return;
  if(st==='SUBSCRIBED'){const first=CZ_NET.status!=='on'&&!CZ_NET.toldOn;CZ_NET.status='on';czNetUI();if(first){CZ_NET.toldOn=1;toast(`🌐 You're online in room ${czFmtCode(code)}`)}await ch.track(czTrackMeta());ch.send({type:'broadcast',event:'hello',payload:{id:CZ_NET.id}});czSendPos(true);czPing(code)}
  else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){CZ_NET.status='retrying';czNetUI()}
  else if(st==='CLOSED'&&CZ_NET.room){CZ_NET.status='retrying';czNetUI()}})}
function czNetLeave(keepCode){const ch=CZ_NET.ch;CZ_NET.ch=null;CZ_NET.peers={};if(ch){try{ch.untrack();ch.unsubscribe();CZ_NET.sb&&CZ_NET.sb.removeChannel(ch)}catch(e){}}
 if(!keepCode){CZ_NET.room=null;try{localStorage.removeItem('dq_room')}catch(e){}}CZ_NET.status=CZ_NET.room?'waiting':'off';czNetUI()}
// keeps the free project awake while people play: one tiny row per room join (room stored as a hash, not the code)
async function czPing(code){try{const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('dq:'+code)),hex=[...new Uint8Array(h)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
 await CZ_NET.sb.from('room_pings').insert({room:hex})}catch(e){}}
function czPresenceSync(){const st=CZ_NET.ch?CZ_NET.ch.presenceState():{},seen=new Set();
 for(const k in st){const m=st[k]&&st[k][0];if(!m||m.id===CZ_NET.id)continue;seen.add(m.id);let p=CZ_NET.peers[m.id];
  if(!p){p=CZ_NET.peers[m.id]={id:m.id,px:m.x*16,py:m.y*16,tx:m.x,ty:m.y,dir:m.dir||'down',m:0,anim:0};toast(`🌐 ${czCleanName(m.look&&m.look.name)} joined`)}
  p.look=m.look||p.look;p.uid=m.uid||p.uid;p.coins=m.coins!=null?m.coins:p.coins;p.busy=m.busy||null;p.duel=m.duel||null}
 for(const id in CZ_NET.peers)if(!seen.has(id)){toast(`🌐 ${czCleanName(CZ_NET.peers[id].look&&CZ_NET.peers[id].look.name)} left`);delete CZ_NET.peers[id]}
 czNetUI()}
function czPeerPos(p){const q=CZ_NET.peers[p.id];if(!q)return;q.tx=p.x;q.ty=p.y;q.dir=p.dir||q.dir;q.m=p.m;q.r=p.r;q.seen=frame;
 if(Math.hypot(q.tx*16-q.px,q.ty*16-q.py)>64){q.px=q.tx*16;q.py=q.ty*16}}
function czSendPos(force){if(!CZ_NET.ch||CZ_NET.status!=='on'||!S)return;const p=czMyPos(),k=p.x+','+p.y+','+p.dir+','+p.m;
 const now=performance.now();if(!force&&(k===CZ_NET.last||now-CZ_NET.lastSend<110))return;CZ_NET.last=k;CZ_NET.lastSend=now;
 CZ_NET.ch.send({type:'broadcast',event:'pos',payload:{id:CZ_NET.id,...p}})}
function czSendEmote(k){if(!CZ_NET.ch||CZ_NET.status!=='on')return;const now=performance.now();if(now-CZ_NET.lastEmote<1200)return;CZ_NET.lastEmote=now;
 CZ_NET.myEmote={k,t:frame};CZ_NET.ch.send({type:'broadcast',event:'emote',payload:{id:CZ_NET.id,k}});czEmoteWheel(false)}

// ---- per-frame: send our moves, glide everyone else toward where they are ----
loop=(orig=>function(t){const f0=frame;orig(t);if(!CZ_NET.ch||!S)return;const n=frame-f0;if(state==='world')czSendPos(false);
 for(const id in CZ_NET.peers){const q=CZ_NET.peers[id],tx=q.tx*16,ty=q.ty*16,dx=tx-q.px,dy=ty-q.py,d=Math.hypot(dx,dy);
  const sp=(q.r?2.25:1.125)*n;if(d<=sp){q.px=tx;q.py=ty;q.walking=q.m&&q.seen&&frame-q.seen<20}else{q.px+=dx/d*sp;q.py+=dy/d*sp;q.walking=true;q.anim+=sp/1.6}}})(loop);
// our look changed (new gear, new hair): update what others see
rebuildBrady=(orig=>function(){const r=orig.apply(this,arguments);if(CZ_NET.ch&&CZ_NET.status==='on')try{CZ_NET.ch.track(czTrackMeta())}catch(e){}return r})(rebuildBrady);
startGame=(orig=>function(){const r=orig.apply(this,arguments);let code=null;try{code=localStorage.getItem('dq_room')}catch(e){}if(code)setTimeout(()=>czNetJoin(code),300);return r})(startGame);

// ---- drawing other players, name tags and emote bubbles ----
function czPeerSprites(look){const key=JSON.stringify(look);if(CZ_NET.sprites[key])return CZ_NET.sprites[key];
 let s=null;try{s=czHeroBuild(look.eq||{},look.hero||{},1)}catch(e){}if(!s)s=bradySpr;return CZ_NET.sprites[key]=s}
function czBubble(x,y,emote){const age=frame-emote.t;if(age>200)return;const a=age<10?age/10:age>170?(200-age)/30:1,isPh=typeof emote.k==='number';
 const txt=isPh?CZ_PHRASES[emote.k]:(CZ_EMOTES.find(e=>e[0]===emote.k)||['', '❔'])[1];ctx.save();ctx.globalAlpha=a;
 ctx.font=isPh?'bold 7px monospace':'10px sans-serif';const w=Math.max(14,Math.ceil(ctx.measureText(txt).width)+8),bx=Math.round(x-w/2),by=Math.round(y-(age<10?age*.6:6)-14);
 ctx.fillStyle='#2a1a12';ctx.fillRect(bx-1,by-1,w+2,14);ctx.fillStyle='#fff8e8';ctx.fillRect(bx,by,w,12);ctx.fillRect(Math.round(x)-1,by+12,3,2);ctx.fillStyle='#2a1a12';ctx.fillRect(Math.round(x),by+14,1,1);
 ctx.fillStyle='#2a1a12';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,Math.round(x),by+6.5);ctx.restore()}
function czNameTag(x,y,name){ctx.save();ctx.font='bold 6px monospace';const w=Math.ceil(ctx.measureText(name).width)+4,bx=Math.round(x-w/2);ctx.fillStyle='rgba(20,12,30,.6)';ctx.fillRect(bx,y-5,w,7);
 ctx.fillStyle='#ffe9a8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,Math.round(x),y-1.5);ctx.restore()}
CZ_HOOKS.ents.push((x0,y0,vw,vh,ents)=>{if(!CZ_NET.ch)return;
 for(const id in CZ_NET.peers){const q=CZ_NET.peers[id];if(!q.look||q.px<(x0-2)*16||q.py<(y0-2)*16||q.px>(x0+vw+2)*16||q.py>(y0+vh+3)*16)continue;
  const spr=czPeerSprites(q.look),f=q.walking?czWalkF(q.anim):0;
  ents.push({y:q.py+.1,d:()=>{drawChar(spr,q.dir,f,q.px,q.py);const fr=spr[q.dir]&&spr[q.dir][f],h=fr?spH(fr):24,cx=q.px-camX+8,top=q.py-camY+15-h;
   czNameTag(cx,top-2,czCleanName(q.look.name));if(q.emote)czBubble(cx,top-9,q.emote)}})}
 if(CZ_NET.myEmote){const e=CZ_NET.myEmote,fr=bradySpr[player.dir]&&bradySpr[player.dir][0],h=fr?spH(fr):24;ents.push({y:1e9,d:()=>czBubble(player.px-camX+8,player.py-camY+15-h-4,e)})}});

// ---- UI: room dialog, HUD button, emote wheel ----
(function(){const st=document.createElement('style');st.textContent=`
#czNet,#czEmo{position:fixed;z-index:60}#czNet,#czNet *,#czEmo,#czEmo *{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
#czNet{inset:0;display:none;align-items:center;justify-content:center;background:rgba(16,11,30,.55)}
#czNet .box{background:#fbf1dc;border:3px solid #2a1a12;border-radius:10px;padding:16px 18px;max-width:340px;width:90%;color:#2a1a12;box-shadow:0 6px 0 #2a1a12}
#czNet h3{margin:0 0 8px;font-size:17px}#czNet p{margin:6px 0;font-size:13px;line-height:1.35}
#czNet input{width:100%;box-sizing:border-box;font-size:18px;letter-spacing:2px;text-transform:uppercase;padding:8px;border:2px solid #2a1a12;border-radius:6px;margin:6px 0;font-family:monospace}
#czNet .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#czNet button{flex:1;min-width:90px}
#czNet .code{font-family:monospace;font-size:22px;letter-spacing:3px;background:#fff;border:2px dashed #2a1a12;border-radius:6px;padding:6px;text-align:center}
#czNet ul{margin:4px 0;padding-left:18px;font-size:13px}
#czEmo{left:50%;bottom:86px;transform:translateX(-50%);display:none;background:#fbf1dc;border:3px solid #2a1a12;border-radius:10px;padding:8px;box-shadow:0 4px 0 #2a1a12;max-width:94vw}
#czEmo .em{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}#czEmo .em button{font-size:20px;padding:4px 6px}
#czEmo .ph{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px}#czEmo .ph button{font-size:12px;padding:5px 4px}
@media(max-width:520px){#czEmo .em{grid-template-columns:repeat(4,1fr)}#czEmo .ph{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(st);
 const d=document.createElement('div');d.id='czNet';d.innerHTML='<div class="box"></div>';d.onclick=e=>{if(e.target===d)czNetDialog(false)};document.body.appendChild(d);
 const w=document.createElement('div');w.id='czEmo';w.innerHTML='<div class="em">'+CZ_EMOTES.map(([k,e])=>`<button data-k="${k}" title="${k}">${e}</button>`).join('')+'</div><div class="ph">'+CZ_PHRASES.map((p,i)=>`<button data-p="${i}">${p}</button>`).join('')+'</div>';
 w.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.k)czSendEmote(b.dataset.k);else if(b.dataset.p!=null)czSendEmote(+b.dataset.p)};document.body.appendChild(w);
 const box=document.getElementById('hudBtns');if(box){const b=document.createElement('button');b.id='btnNet';b.title='Online room';b.textContent='🌐';b.onclick=()=>czNetDialog(true);box.insertBefore(b,box.firstChild);
  const e2=document.createElement('button');e2.id='btnEmo';e2.title='Emotes (E)';e2.textContent='💬';e2.style.display='none';e2.onclick=()=>czEmoteWheel();box.insertBefore(e2,box.firstChild)}
 const tb=document.getElementById('titleBtns');if(tb){const b=document.createElement('button');b.id='btnTitleNet';b.onclick=()=>czNetDialog(true);tb.appendChild(b)}
 window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='KeyE'&&state==='world'&&CZ_NET.status==='on'){czEmoteWheel();e.preventDefault()}
  else if(e.code==='Escape'){czEmoteWheel(false);czNetDialog(false)}})})();
function czEmoteWheel(show){const w=$('#czEmo');if(!w)return;if(show===undefined)show=w.style.display!=='block';w.style.display=show&&CZ_NET.status==='on'?'block':'none'}
function czNetDialog(show){const d=$('#czNet');if(!d)return;if(!show){d.style.display='none';return}d.style.display='flex';const b=d.querySelector('.box');
 if(!CZ_NET.room){b.innerHTML=`<h3>🌐 Play online</h3><p>Enter a room code to see friends in your world and send emotes. Share the code only with people you know.</p>
  <input id="czCode" maxlength="9" placeholder="ABCD-1234" autocomplete="off"><div class="row"><button id="czJoin">Join room</button><button id="czMake">New code</button></div><div class="row"><button id="czClose">Close</button></div>`;
  const inp=$('#czCode');inp.onkeydown=e=>{if(e.key==='Enter')$('#czJoin').click()};setTimeout(()=>inp.focus(),30);
  $('#czJoin').onclick=()=>{const c=czCleanCode(inp.value);if(c.length<4){inp.focus();return}czNetJoin(c);czNetDialog(true)};
  $('#czMake').onclick=()=>{czNetJoin(czNewCode());czNetDialog(true)};$('#czClose').onclick=()=>czNetDialog(false);return}
 const code=czFmtCode(CZ_NET.room);
 if(CZ_NET.status==='waiting'||state==='title'){const sv=loadSave();
  b.innerHTML=`<h3>✅ You've joined the room!</h3><div class="code">${code}</div>
   <p><b>Next step:</b> ${sv?'continue your game or start a new one':'start a new game'} to see your friends in the world.</p>
   <p>Share this code with friends so they can join too. You'll rejoin this room automatically every time you play.</p>
   <div class="row">${sv?`<button id="czGoCont">▶ Continue (Lv ${sv.lv})</button>`:''}<button id="czGoNew">🏈 New Game</button></div>
   <div class="row"><button id="czCopy">Copy code</button><button id="czLeave">Leave room</button></div>`;
  if(sv)$('#czGoCont').onclick=()=>{czNetDialog(false);G.continueGame()};$('#czGoNew').onclick=()=>{czNetDialog(false);G.showNew()};
  $('#czCopy').onclick=()=>{try{navigator.clipboard.writeText(code);toast('📋 Room code copied')}catch(e){}};$('#czLeave').onclick=()=>{czNetLeave(false);czNetDialog(true)};return}
 const names=Object.values(CZ_NET.peers).map(q=>czCleanName(q.look&&q.look.name));
 const stat={on:'Connected',connecting:'Connecting…',retrying:'Reconnecting…',error:"Couldn't connect (playing solo)",waiting:'Start or continue a game to go online'}[CZ_NET.status]||'';
 b.innerHTML=`<h3>🌐 Online room</h3><div class="code">${code}</div><p>${stat}${CZ_NET.status==='on'?` · ${names.length} other player${names.length===1?'':'s'} here`:''}</p>
  ${names.length?'<ul>'+names.map(n=>`<li>${n}</li>`).join('')+'</ul>':''}<p>Friends join with this code. Press <b>E</b> or 💬 for emotes. To <b>duel</b>, walk up to a friend and press <b>Space</b>, tap them, or use ⚔️ below.</p>
  <div class="row"><button id="czCopy">Copy code</button><button id="czLeave">Leave room</button></div><div class="row"><button id="czClose">Close</button></div>`;
 $('#czCopy').onclick=()=>{try{navigator.clipboard.writeText(code);toast('📋 Room code copied')}catch(e){}};$('#czLeave').onclick=()=>{czNetLeave(false);czNetDialog(true)};$('#czClose').onclick=()=>czNetDialog(false)}
function czNetUI(){const tbn=$('#btnTitleNet');if(tbn)tbn.textContent=CZ_NET.room?`🌐 Room ${czFmtCode(CZ_NET.room)}`:'🌐 Play online';const b=$('#btnNet');if(b){const n=Object.keys(CZ_NET.peers).length;b.textContent=CZ_NET.status==='on'?`🌐 ${n+1}`:(CZ_NET.status==='off'||CZ_NET.status==='error'||CZ_NET.status==='waiting')?'🌐':'🌐…';b.title=CZ_NET.room?'Online room '+CZ_NET.room:'Play online'}
 const e=$('#btnEmo');if(e)e.style.display=CZ_NET.status==='on'?'':'none';const d=$('#czNet');if(d&&d.style.display==='flex'&&!(document.activeElement&&document.activeElement.id==='czCode'))czNetDialog(true)}

// pick up a remembered room on the title screen too (shows on the button; connects once a game starts)
try{const rc=localStorage.getItem('dq_room');if(rc){CZ_NET.room=rc;CZ_NET.status='waiting'}}catch(e){}
czNetUI();

// ---------------------------------------------------------------------------
//  FINDING EACH OTHER
//  - Map screen (M): a labeled marker for everyone in your room, kept live
//  - In the world: an arrow at the screen edge pointing to each friend who's
//    off screen, with their name and how many tiles away they are
// ---------------------------------------------------------------------------
const CZ_PEER_COLS=['#ff7ab8','#7ad0ff','#ffd84a','#9be67a','#c89aff','#ff9a5a'];
// distinct colors in join order, so two friends never share one
function czPeerCol(id){const q=CZ_NET.peers[id];if(q&&q.col==null){const used=new Set(Object.values(CZ_NET.peers).map(p=>p.col).filter(c=>c!=null));let i=0;while(used.has(i)&&i<CZ_PEER_COLS.length)i++;q.col=i%CZ_PEER_COLS.length}return CZ_PEER_COLS[q?q.col:0]}
renderMap=(orig=>function(){orig.apply(this,arguments);if(!CZ_NET.ch||!S)return;const c=$('#mapCv'),g=c.getContext('2d'),M=2,pulse=(Date.now()>>8)&1;
 g.save();g.font='bold 10px monospace';g.textAlign='center';g.textBaseline='bottom';
 for(const id in CZ_NET.peers){const q=CZ_NET.peers[id],x=q.tx*M,y=q.ty*M,col=czPeerCol(id),name=czCleanName(q.look&&q.look.name)+(q.busy==='duel'?' ⚔️':q.busy?' 🦖':'');
  g.fillStyle='#2a1a12';g.beginPath();g.arc(x,y,6+pulse,0,6.283);g.fill();g.fillStyle=col;g.beginPath();g.arc(x,y,4+pulse,0,6.283);g.fill();g.fillStyle='#fff';g.fillRect(x-1,y-1,2,2);
  g.lineWidth=3;g.strokeStyle='#2a1a12';g.strokeText(name,x,y-8);g.fillStyle=col;g.fillText(name,x,y-8)}
 g.restore()})(renderMap);
// keep the map's friend markers moving while it's open
setInterval(()=>{const mv=$('#mapView');if(CZ_NET.ch&&mv&&!mv.classList.contains('hidden'))try{renderMap()}catch(e){}},1000);
CZ_HOOKS.over.push(()=>{if(!CZ_NET.ch||state!=='world'||!S)return;const padX=16,padT=CH*.16,padB=CH*.13,cx=CW/2,cy=(padT+CH-padB)/2;
 for(const id in CZ_NET.peers){const q=CZ_NET.peers[id];if(!q.look)continue;const sx=q.px-camX+8,sy=q.py-camY+4;
  if(sx>-4&&sx<CW+4&&sy>-10&&sy<CH+10)continue; // on screen already
  const dx=sx-cx,dy=sy-cy,k=Math.min((cx-padX)/Math.abs(dx||1e-6),(dy<0?cy-padT:CH-padB-cy)/Math.abs(dy||1e-6)),ax=cx+dx*k,ay=cy+dy*k,ang=Math.atan2(dy,dx),col=czPeerCol(id);
  const dist=Math.round(Math.hypot(q.tx-player.x,q.ty-player.y)),label=`${czCleanName(q.look.name)} ${dist}`;
  ctx.save();ctx.translate(Math.round(ax),Math.round(ay));ctx.rotate(ang);ctx.fillStyle='#2a1a12';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-6);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();
  ctx.save();ctx.font='bold 6px monospace';const w=Math.ceil(ctx.measureText(label).width)+4,lx=Math.round(Math.max(2,Math.min(CW-w-2,ax-Math.cos(ang)*14-w/2))),ly=Math.round(Math.max(padT-6,Math.min(CH-padB,ay-Math.sin(ang)*12-4)));
  ctx.fillStyle='rgba(20,12,30,.7)';ctx.fillRect(lx,ly,w,8);ctx.fillStyle=col;ctx.textBaseline='middle';ctx.fillText(label,lx+2,ly+4.5);ctx.restore()}});
