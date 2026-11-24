// ============================================================================
//  ONLINE DUELS (step 2): challenge another player in your room to the same 10
//  questions. The server (Supabase functions in server/duels.sql) picks the
//  questions, keeps the answers secret, enforces the 15-second shot clock and
//  decides the winner. Winner takes the stake from the loser; a tie returns it.
//  Levels: Mixed (3 Rookie, 3 Pro, 2 All-Pro, 2 Superfan) or one level only,
//  chosen by the challenger and shown to the other player before they accept.
// ============================================================================
const CZ_DUEL={levels:[['mixed','Mixed'],['rookie','Rookie only'],['pro','Pro only'],['allpro','All-Pro only'],['superfan','Superfan only']],
 stakes:[0,10,25,50,100],clock:15,cur:null,invite:null,waiting:null};
const czLvName=k=>(CZ_DUEL.levels.find(l=>l[0]===k)||['','Mixed'])[1];
async function czRpc(fn,args){const r=await CZ_NET.sb.rpc(fn,args);if(r.error)throw new Error(r.error.message);return r.data}
function czDuelReady(){return CZ_NET.status==='on'&&!!CZ_NET.uid}

// ---- extra broadcast events on the room channel (hooked when we join) ----
CZ_NET.onChannel.push(ch=>{
 ch.on('broadcast',{event:'duel_invite'},({payload:p})=>{if(p.to===CZ_NET.id)czDuelInvited(p)});
 ch.on('broadcast',{event:'duel_reply'},({payload:p})=>{if(p.to===CZ_NET.id)czDuelReplied(p)});
 ch.on('broadcast',{event:'duel_prog'},({payload:p})=>{const d=CZ_DUEL.cur;if(d&&p.duel===d.id&&p.from!==CZ_NET.id){d.opN=p.n;d.opS=p.s;czDuelHeader()}})});
function czBcast(event,payload){try{CZ_NET.ch&&CZ_NET.ch.send({type:'broadcast',event,payload:{from:CZ_NET.id,...payload}})}catch(e){}}

// ---- UI shell ----
(function(){const st=document.createElement('style');st.textContent=`
#czDuel{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(16,11,30,.72)}
#czDuel,#czDuel *{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
#czDuel .box{background:#fbf1dc;border:3px solid #2a1a12;border-radius:10px;padding:14px 16px;width:min(560px,94vw);color:#2a1a12;box-shadow:0 6px 0 #2a1a12;max-height:92vh;overflow:auto}
#czDuel h3{margin:0 0 8px;font-size:17px}#czDuel p{margin:6px 0;font-size:13px;line-height:1.4}
#czDuel .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}#czDuel .row button{flex:1;min-width:90px}
#czDuel .pick button{flex:0 0 auto;min-width:0;padding:5px 9px;font-size:12px}#czDuel .pick button.sel{background:#ffd84a;outline:2px solid #2a1a12}
#czDuel .pick button:disabled{opacity:.35}
#czDuel .hdr{display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:14px;margin-bottom:6px}
#czDuel .dots{display:flex;gap:3px;margin:2px 0 8px}#czDuel .dots i{width:9px;height:9px;border:1px solid #2a1a12;border-radius:2px;background:#e8dcc0}
#czDuel .dots i.ok{background:#3ccf5a}#czDuel .dots i.no{background:#e84030}#czDuel .dots i.done{background:#8a8070}
#czDuel .q{font-size:15px;font-weight:bold;margin:8px 0 10px;min-height:42px}
#czDuel .opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}#czDuel .opts button{text-align:left;padding:9px;font-size:13px;min-height:44px}
#czDuel .opts button.right{background:#9be6a8}#czDuel .opts button.wrong{background:#f0a090}
#czDuel .clock{height:8px;background:#e8dcc0;border:1px solid #2a1a12;border-radius:4px;overflow:hidden;margin-top:10px}#czDuel .clock b{display:block;height:100%;background:#e0a030}
#czDuel .tag{display:inline-block;font-size:11px;padding:1px 6px;border:1px solid #2a1a12;border-radius:8px;margin-left:6px;background:#fff}
#czDuel .big{font-size:22px;font-weight:bold;text-align:center;margin:8px 0}
@media(max-width:520px){#czDuel .opts{grid-template-columns:1fr}}`;document.head.appendChild(st);
 const d=document.createElement('div');d.id='czDuel';d.innerHTML='<div class="box"></div>';document.body.appendChild(d);
 window.addEventListener('keydown',e=>{const c=CZ_DUEL.cur;if(!c||!c.q||c.locked||e.target.tagName==='INPUT')return;const k=+e.key;if(k>=1&&k<=4){e.preventDefault();e.stopPropagation();czDuelPick(k-1)}},true);
 // a Duel button in the emote wheel
 const w=$('#czEmo');if(w){const r=document.createElement('div');r.className='ph';r.innerHTML='<button id="czDuelBtn" style="grid-column:1/-1;font-weight:bold">⚔️ Challenge a player to a duel</button>';w.appendChild(r);
  $('#czDuelBtn').onclick=()=>{czEmoteWheel(false);czDuelChoose()}}})();
function czDuelBox(html){const d=$('#czDuel');d.style.display='flex';d.querySelector('.box').innerHTML=html;return d.querySelector('.box')}
function czDuelClose(){const d=$('#czDuel');d.style.display='none';if(state==='duel')state='world'}

// ---- choosing an opponent and setting up a challenge ----
function czDuelChoose(){if(!czDuelReady()){czDuelBox(`<h3>⚔️ Duels</h3><p>${CZ_NET.status!=='on'?'Join an online room first (🌐).':"Duels need the server's sign-in, which isn't available right now."}</p><div class="row"><button onclick="czDuelClose()">OK</button></div>`);return}
 const peers=Object.values(CZ_NET.peers).filter(q=>q.uid);
 if(!peers.length){czDuelBox(`<h3>⚔️ Duels</h3><p>Nobody else is in this room yet. Share the room code with a friend.</p><div class="row"><button onclick="czDuelClose()">OK</button></div>`);return}
 // nearest first
 peers.sort((a,b)=>Math.hypot(a.tx-player.x,a.ty-player.y)-Math.hypot(b.tx-player.x,b.ty-player.y));
 if(peers.length===1)return czDuelSetup(peers[0]);
 czDuelBox(`<h3>⚔️ Who do you want to duel?</h3><div class="row">${peers.map(q=>`<button data-id="${q.id}">${czCleanName(q.look&&q.look.name)}</button>`).join('')}</div><div class="row"><button onclick="czDuelClose()">Cancel</button></div>`)
  .querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>czDuelSetup(CZ_NET.peers[b.dataset.id]))}
function czDuelSetup(peer){if(!peer)return czDuelClose();const sel={level:'mixed',stake:0},max=Math.min(S.coins,peer.coins!=null?peer.coins:S.coins),name=czCleanName(peer.look&&peer.look.name);
 const draw=()=>{const b=czDuelBox(`<h3>⚔️ Challenge ${name}</h3><p>You both get the same 10 questions with a ${CZ_DUEL.clock}-second shot clock. Most right wins; if it's a tie, whoever finished first wins.</p>
  <p><b>Questions</b></p><div class="row pick">${CZ_DUEL.levels.map(([k,n])=>`<button data-l="${k}" class="${sel.level===k?'sel':''}">${n}</button>`).join('')}</div>
  <p style="font-size:12px">${sel.level==='mixed'?'3 Rookie, 3 Pro, 2 All-Pro, 2 Superfan, easiest first.':'All 10 from one level.'}</p>
  <p><b>Stake</b> (winner takes it from the loser)</p><div class="row pick">${CZ_DUEL.stakes.map(v=>`<button data-s="${v}" class="${sel.stake===v?'sel':''}" ${v>max?'disabled':''}>${v?v+' 🪙':'Just for fun'}</button>`).join('')}</div>
  <div class="row"><button id="czSend">Send challenge</button><button onclick="czDuelClose()">Cancel</button></div>`);
  b.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>{sel.level=x.dataset.l;draw()});b.querySelectorAll('[data-s]').forEach(x=>x.onclick=()=>{sel.stake=+x.dataset.s;draw()});
  $('#czSend').onclick=()=>czDuelSend(peer,sel.level,sel.stake)};
 state==='world'&&(state='duel');draw()}
async function czDuelSend(peer,level,stake){const name=czCleanName(peer.look&&peer.look.name);czDuelBox(`<h3>⚔️ Sending…</h3>`);
 try{const id=await czRpc('dq_duel_create',{p_opp:peer.uid,p_level:level,p_stake:stake,p_room:CZ_NET.room,p_a_name:czMyLook().name,p_b_name:name});
  CZ_DUEL.waiting={id,peer,level,stake,name,t:Date.now()};czBcast('duel_invite',{to:peer.id,duel:id,level,stake,name:czMyLook().name});
  czDuelBox(`<h3>⚔️ Waiting for ${name}…</h3><p>${czLvName(level)} · ${stake?stake+' coins':'just for fun'}</p><div class="row"><button id="czCancel">Cancel challenge</button></div>`);
  $('#czCancel').onclick=()=>{czRpc('dq_duel_decline',{p_id:id}).catch(()=>{});czBcast('duel_reply',{to:peer.id,duel:id,ok:false,cancel:true});CZ_DUEL.waiting=null;czDuelClose()};
  setTimeout(()=>{if(CZ_DUEL.waiting&&CZ_DUEL.waiting.id===id){CZ_DUEL.waiting=null;czRpc('dq_duel_decline',{p_id:id}).catch(()=>{});czDuelBox(`<h3>⚔️ No answer</h3><p>${name} didn't respond.</p><div class="row"><button onclick="czDuelClose()">OK</button></div>`)}},60000)}
 catch(e){czDuelBox(`<h3>⚔️ Couldn't start the duel</h3><p>${String(e.message||e).slice(0,120)}</p><div class="row"><button onclick="czDuelClose()">OK</button></div>`)}}

// ---- receiving a challenge ----
function czDuelInvited(p){if(CZ_DUEL.cur||CZ_DUEL.invite||!S){czBcast('duel_reply',{to:p.from,duel:p.duel,ok:false,busy:true});return}
 if(state!=='world'&&state!=='duel'){czBcast('duel_reply',{to:p.from,duel:p.duel,ok:false,busy:true});return}
 CZ_DUEL.invite=p;state='duel';SFX.encounter&&SFX.encounter();const name=czCleanName(p.name),broke=p.stake>S.coins;
 czDuelBox(`<h3>⚔️ ${name} challenges you!</h3><div class="big">${czLvName(p.level)}</div><p style="text-align:center">${p.stake?`Stake: <b>${p.stake} coins</b> (winner takes it)`:'Just for fun, no coins'}</p>
  <p>Same 10 questions for both of you, ${CZ_DUEL.clock}-second shot clock.${broke?' <b>You don\'t have enough coins for this stake.</b>':''}</p>
  <div class="row"><button id="czAcc" ${broke?'disabled':''}>Accept</button><button id="czDec">Decline</button></div>`);
 const decline=()=>{czRpc('dq_duel_decline',{p_id:p.duel}).catch(()=>{});czBcast('duel_reply',{to:p.from,duel:p.duel,ok:false});CZ_DUEL.invite=null;czDuelClose()};
 $('#czDec').onclick=decline;$('#czAcc').onclick=async()=>{czDuelBox('<h3>⚔️ Starting…</h3>');try{await czRpc('dq_duel_accept',{p_id:p.duel});czBcast('duel_reply',{to:p.from,duel:p.duel,ok:true});
  CZ_DUEL.invite=null;czDuelStart(p.duel,name,p.level,p.stake)}catch(e){CZ_DUEL.invite=null;czDuelBox(`<h3>⚔️ This challenge expired</h3><div class="row"><button onclick="czDuelClose()">OK</button></div>`)}};
 setTimeout(()=>{if(CZ_DUEL.invite===p)decline()},55000)}
function czDuelReplied(p){const w=CZ_DUEL.waiting;if(!w||w.id!==p.duel)return;CZ_DUEL.waiting=null;
 if(p.ok)czDuelStart(w.id,w.name,w.level,w.stake);
 else czDuelBox(`<h3>⚔️ ${w.name} ${p.busy?'is busy right now':'declined'}</h3><div class="row"><button onclick="czDuelClose()">OK</button></div>`)}

// ---- playing the duel ----
async function czDuelStart(id,opName,level,stake){state='duel';czDuelBox('<h3>⚔️ Get ready…</h3>');
 try{const qs=await czRpc('dq_duel_questions',{p_id:id});CZ_DUEL.cur={id,opName,level,stake,qs,i:0,score:0,res:[],opN:0,opS:0,locked:false};SFX.encounter&&SFX.encounter();czDuelQuestion()}
 catch(e){czDuelBox(`<h3>⚔️ Couldn't load the duel</h3><p>${String(e.message||e).slice(0,120)}</p><div class="row"><button onclick="czDuelClose()">OK</button></div>`)}}
function czDuelHeader(){const d=CZ_DUEL.cur,h=$('#czDuel .hdr');if(!d||!h)return;h.innerHTML=`<span>You ${d.score}</span><span>Q ${Math.min(d.i+1,10)}/10</span><span>${d.opS} ${czCleanName(d.opName)}</span>`;
 const od=$('#czDuel .dots.op');if(od)od.innerHTML=Array.from({length:10},(_,k)=>`<i class="${k<d.opN?'done':''}"></i>`).join('')}
function czDuelQuestion(){const d=CZ_DUEL.cur;if(d.i>=10)return czDuelFinish();const q=d.qs[d.i];d.q=q;d.locked=false;d.t0=performance.now();
 czDuelBox(`<div class="hdr"></div><div class="dots me">${Array.from({length:10},(_,k)=>`<i class="${k<d.res.length?(d.res[k]?'ok':'no'):''}"></i>`).join('')}</div><div class="dots op"></div>
  <div><span class="tag">${czLvName(['','rookie','pro','allpro','superfan'][q.d]).replace(' only','')}</span><span class="tag">${q.cat}</span></div>
  <div class="q">${escapeHTML(q.q)}</div><div class="opts">${q.opts.map((o,k)=>`<button data-k="${k}">${k+1}. ${escapeHTML(o)}</button>`).join('')}</div>
  <div class="clock"><b style="width:100%"></b></div><p id="czExpl" style="min-height:18px"></p>`).querySelectorAll('.opts button').forEach(b=>b.onclick=()=>czDuelPick(+b.dataset.k));
 czDuelHeader();clearInterval(d.tick);d.tick=setInterval(()=>{const left=CZ_DUEL.clock-(performance.now()-d.t0)/1000,bar=$('#czDuel .clock b');if(bar)bar.style.width=Math.max(0,left/CZ_DUEL.clock*100)+'%';if(left<=0&&!d.locked)czDuelPick(-1)},100)}
async function czDuelPick(k){const d=CZ_DUEL.cur;if(!d||d.locked)return;d.locked=true;clearInterval(d.tick);const q=d.q,choice=k>=0?q.opts[k]:'';
 const btns=[...document.querySelectorAll('#czDuel .opts button')];btns.forEach(b=>b.disabled=true);
 let r;try{r=(await czRpc('dq_duel_answer',{p_id:d.id,p_idx:d.i,p_choice:choice}))[0]}catch(e){r={ok:false,answer:'',expl:''}}
 d.res.push(!!r.ok);if(r.ok){d.score++;SFX.correct&&SFX.correct()}else SFX.wrong&&SFX.wrong();
 btns.forEach((b,j)=>{const o=q.opts[j];if(o===r.answer)b.classList.add('right');else if(j===k)b.classList.add('wrong')});
 const ex=$('#czExpl');if(ex)ex.textContent=(r.ok?'✔ ':k<0?'⏱ Time! ':'✘ ')+(r.expl||'');
 czBcast('duel_prog',{duel:d.id,n:d.i+1,s:d.score});d.i++;czDuelHeader();setTimeout(czDuelQuestion,r.ok?1300:2200)}
async function czDuelFinish(){const d=CZ_DUEL.cur;czDuelBox(`<div class="hdr"></div><div class="big">Waiting for ${czCleanName(d.opName)}…</div><div class="dots op"></div><p style="text-align:center">Results come in when you both finish (or the clock runs out).</p>`);czDuelHeader();
 const poll=async()=>{if(CZ_DUEL.cur!==d)return;let r;try{r=(await czRpc('dq_duel_result',{p_id:d.id}))[0]}catch(e){}
  if(!r||r.status!=='done'){setTimeout(poll,1500);return}
  const meA=r.a===CZ_NET.uid,my=meA?r.a_score:r.b_score,their=meA?r.b_score:r.a_score,won=r.winner===CZ_NET.uid,tie=!r.winner;
  S.cz_duels=S.cz_duels||{};let delta=0;if(!S.cz_duels[d.id]){S.cz_duels[d.id]=1;if(!tie&&r.stake){delta=won?r.stake:-Math.min(r.stake,S.coins);S.coins+=delta}
   S.st.duels=(S.st.duels||0)+1;if(won)S.st.duelWins=(S.st.duelWins||0)+1;updHud();saveGame(true);try{CZ_NET.ch&&CZ_NET.ch.track(czTrackMeta())}catch(e){}}
  won?SFX.level&&SFX.level():SFX.hit&&SFX.hit();
  czDuelBox(`<h3>⚔️ Duel over</h3><div class="big">${tie?"It's a tie!":won?'🏆 You win!':`${czCleanName(d.opName)} wins`}</div>
   <p style="text-align:center;font-size:16px"><b>You ${my}</b> — <b>${their} ${czCleanName(d.opName)}</b>${my===their&&!tie?' (tie-break: '+(won?'you':'they')+' finished first)':''}</p>
   <p style="text-align:center">${tie?'Stakes returned.':r.stake?(delta>0?`+${delta} coins 🪙`:`${delta} coins`):'Played just for fun.'}</p>
   <div class="row"><button id="czGG">GG! 👋</button><button onclick="czDuelClose();CZ_DUEL.cur=null">Back to the world</button></div>`);
  $('#czGG').onclick=()=>{czDuelClose();CZ_DUEL.cur=null;CZ_NET.lastEmote=0;czSendEmote(0)}};
 poll()}
function escapeHTML(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
// list a Duel button next to each player in the room dialog
czNetDialog=(orig=>function(show){orig(show);if(!show||!CZ_NET.room||CZ_NET.status!=='on')return;const ul=$('#czNet ul');if(!ul)return;
 ul.innerHTML=Object.values(CZ_NET.peers).map(q=>`<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:3px 0">${czCleanName(q.look&&q.look.name)}${q.uid?`<button data-d="${q.id}" style="flex:0;min-width:0;padding:3px 8px;font-size:12px">⚔️ Duel</button>`:''}</li>`).join('');
 ul.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{czNetDialog(false);czDuelSetup(CZ_NET.peers[b.dataset.d])})})(czNetDialog);
