// ===================== FISHING =====================
// Face any water with a rod and press A (Space). Wait for the bite, hit it, then stop the needle in the green
// zone to reel in. Which fish bite depends on where you are (salt or fresh water, biome), time of day and rain.
// Rods and bait come from the Pro Shop (and rarely chests). Fish sell for coins; every catch goes in the journal
// and shows up in the fish tank at home.
const CZ_FISH_SP=[
 // id, name, rarity 0-4, where ('any' | 'salt' | 'fresh' | biome list), when (null|'day'|'night'), rain only, value, size [min,max] inches, colors [body, belly, fin]
 {id:'perch',n:'Pigskin Perch',r:0,w:'any',v:8,sz:[6,12],c:['#a8642e','#e8c89a','#6a3a18'],tip:'Bites almost anywhere.'},
 {id:'bass',n:'Blitz Bass',r:0,w:['plains','forest','springs','ruins'],v:12,sz:[10,20],c:['#5a8a3a','#d8e0a0','#2f5a22'],tip:'Lakes and rivers in the plains and forest.'},
 {id:'herring',n:'Huddle Herring',r:0,w:'salt',v:10,sz:[8,14],c:['#8aa8c8','#eef4fa','#4a6a8a'],tip:'Swims in big groups by the sea.'},
 {id:'trout',n:'Spiral Trout',r:1,w:['forest','mountain','springs'],t:'day',v:30,sz:[12,24],c:['#b8a070','#f0d8c0','#e86a8a'],tip:'Forest and mountain water, in daylight.'},
 {id:'flounder',n:'Fumble Flounder',r:1,w:'salt',v:28,sz:[10,18],c:['#9a8a6a','#d8ccb0','#6a5a3a'],tip:'Hides on the sea floor. Slippery!'},
 {id:'pike',n:'Field Goal Pike',r:1,w:['plains','forest','ruins'],v:35,sz:[18,36],c:['#7a8a3a','#e8e0a0','#f5c542'],tip:'Yellow stripes like goalposts. Plains and forest.'},
 {id:'puffer',n:'Punt Return Puffer',r:1,w:'salt',t:'night',v:40,sz:[6,12],c:['#e8c040','#fff0b0','#a87a20'],tip:'Puffs up by the sea at night.'},
 {id:'grayling',n:'Glacier Grayling',r:1,w:['mountain'],v:45,sz:[10,20],c:['#7a8aa8','#d8e0f0','#8a5ac8'],tip:'Only in icy mountain water.'},
 {id:'pupfish',n:'Oasis Pupfish',r:1,w:['desert','ruins','springs'],v:40,sz:[2,4],c:['#4a7ad8','#c8e0ff','#2a4a9a'],tip:'Tiny and blue. Desert oases and warm springs.'},
 {id:'rainbow',n:'Rookie Rainbow Trout',r:2,w:'fresh',rain:1,v:90,sz:[14,28],c:['#7aa86a','#f8e0e8','#e8607a'],tip:'Comes out when it rains, in fresh water.'},
 {id:'tuna',n:'Touchdown Tuna',r:2,w:'salt',t:'day',v:110,sz:[30,60],c:['#2a4a7a','#c8d4e0','#f5c542'],tip:'A big ocean fish that feeds in daylight.'},
 {id:'catfish',n:'Midnight Mudcat',r:2,w:['plains','springs','forest','ruins'],t:'night',v:100,sz:[20,40],c:['#5a4a3a','#b8a890','#2a2018'],tip:'Rivers and lakes, only at night.'},
 {id:'marlin',n:'Hail Mary Marlin',r:3,w:'salt',rain:1,v:220,sz:[60,110],c:['#2a5aa8','#e0ecf8','#1a3a7a'],tip:'Legend says it leaps in ocean storms.'},
 {id:'koi',n:'Hall of Fame Koi',r:3,w:['springs'],v:200,sz:[16,30],c:['#f8f0e8','#ffffff','#e8443a'],tip:'Lives in the hot springs. Very picky.'},
 {id:'guppy',n:'Golden Gridiron Guppy',r:4,w:'any',t:'night',rain:1,v:500,sz:[3,5],c:['#f5c542','#fff6c8','#e8900c'],tip:'Rumored to shine on rainy nights.'},
];
const CZ_FISH_RAR=[{n:'Common',c:'#8a9096',hits:1,spd:1},{n:'Uncommon',c:'#2e9e50',hits:2,spd:1.25},{n:'Rare',c:'#2f6fd6',hits:2,spd:1.55},{n:'Epic',c:'#9b40c6',hits:3,spd:1.8},{n:'Legendary',c:'#e8900c',hits:3,spd:2.1}];
const CZ_RODS=[null,{n:'Bamboo Rod',p:60,zone:.2,str:1,tier:0},{n:'Pro Rod',p:350,zone:.26,str:2,tier:1},{n:'Golden Rod',p:1200,zone:.32,str:2,tier:2,luck:.3}];
const CZ_BAIT={n:'Bait (x5)',p:25,qty:5};
function czFS(){return S.fish||(S.fish={rod:0,bait:0,log:{},bag:{}})}
function czFishBiome(x,y){const r=region[idx(x,y)];return(POIS[r]&&POIS[r].biome)||'plains'}
function czFishOk(sp,biome){const salt=biome==='coast';if(sp.w==='any')return true;if(sp.w==='salt')return salt;if(sp.w==='fresh')return!salt;return sp.w.includes(biome)}
function czFishPool(biome,night,rain){return CZ_FISH_SP.filter(sp=>czFishOk(sp,biome)&&(!sp.t||(sp.t==='night')===night)&&(!sp.rain||rain))}
function czFishRoll(biome){const f=czFS(),night=lightLevel().dark>.4,rain=czWeather()>.2,pool=czFishPool(biome,night,rain),rod=CZ_RODS[f.rod]||CZ_RODS[1];
 const W=[60,28,9,3,.8],boost=(F.bait?1.6:1)*(1+(rod.luck||0));let tot=0;const w=pool.map(sp=>{const v=W[sp.r]*(sp.r>=2?boost:1);tot+=v;return v});
 let r=Math.random()*tot;for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return pool[i]}return pool[0]}

// ---- pixel fish pictures (journal, shop, fish tank) ----
const CZ_FISH_IMG={};
function czFishCanvas(sp,dark){const c=document.createElement('canvas');c.width=26;c.height=14;const g=c.getContext('2d');const[b,l,f]=dark?['#3a3046','#3a3046','#3a3046']:sp.c;
 const O='#2a1a12',P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};const tall=sp.id==='flounder'||sp.id==='puffer'?2:0,long=sp.id==='pike'||sp.id==='marlin'||sp.id==='catfish';
 // outline + body
 P(4,4-tall/2,long?17:15,6+tall,O);P(3,5-tall/2,1,4+tall,O);P(long?21:19,5,1,4,O);
 P(4,5-tall/2,long?17:15,4+tall,b);P(5,8,long?14:12,1+tall/2,l);
 // tail
 P(long?21:19,3,1,8,O);P(long?22:20,2,2,10,O);P(long?22:20,3,1,8,f);P(long?23:21,3,1,2,f);P(long?23:21,9,1,2,f);
 // fins, eye, extras
 P(9,3-tall/2,5,1,O);P(10,2-tall/2,3,1,f);P(10,10+tall/2,3,1,f);P(6,5,1,1,'#fff');P(6,6,1,1,O);
 if(sp.id==='pike'&&!dark){P(10,5,1,4,'#f5c542');P(14,5,1,4,'#f5c542')}
 if(sp.id==='rainbow'&&!dark)P(5,7,13,1,'#e8607a');
 if(sp.id==='koi'&&!dark){P(8,5,3,2,'#e8443a');P(14,6,2,2,'#e8443a')}
 if(sp.id==='marlin'){P(0,6,4,1,O);P(1,6,3,1,dark?b:'#8ab0e0')}
 if(sp.id==='catfish'){P(2,8,2,1,O);P(1,9,2,1,O)}
 if(sp.id==='guppy'&&!dark){P(8,6,1,1,'#fff');P(13,5,1,1,'#fff')}
 return c}
function czFishImg(sp,dark){const k=sp.id+(dark?'_d':'');return CZ_FISH_IMG[k]||(CZ_FISH_IMG[k]=czFishCanvas(sp,dark).toDataURL())}
function czFishIc(sp,dark){return`<img class="czfi" src="${czFishImg(sp,dark)}" alt="">`}

// ---- the mini-game ----
const F={on:false};
function czFishStart(fx,fy){const f=czFS();if(!f.rod)return false;const biome=czFishBiome(fx,fy);
 Object.assign(F,{on:true,fx,fy,biome,phase:'cast',t:performance.now(),sp:null,hits:0,strikes:0,need:1,pos:0,dir:1,bait:f.bait>0,msg:''});
 if(F.bait){f.bait--}state='fish';czFishUI();SFX.blip&&SFX.blip();return true}
function czFishEnd(){F.on=false;const d=$('#czFish');if(d)d.style.display='none';if(state==='fish')state='world';updHud()}
function czFishTick(){if(!F.on)return;const now=performance.now(),el=now-F.t;
 if(F.phase==='cast'&&el>700){F.phase='wait';F.t=now;F.waitFor=(1500+Math.random()*3200)*(F.bait?.6:1);czFishUI()}
 else if(F.phase==='wait'&&el>F.waitFor){F.phase='bite';F.t=now;F.sp=czFishRoll(F.biome);SFX.item&&SFX.item();czFishUI()}
 else if(F.phase==='bite'&&el>900+150*czFS().rod){F.phase='lost';F.msg='Too slow! It got away.';F.t=now;czFishUI()}
 else if(F.phase==='reel'){const rr=CZ_FISH_RAR[F.sp.r],sp=.0011*rr.spd*(1+.15*F.hits);F.pos+=F.dir*sp*Math.min(40,el);F.t=now;if(F.pos>1){F.pos=1;F.dir=-1}if(F.pos<0){F.pos=0;F.dir=1}czFishMeter()}
 else if((F.phase==='lost'||F.phase==='caught')&&el>2600)czFishEnd()}
function czFishAct(){if(!F.on)return;const now=performance.now();
 if(F.phase==='wait'||F.phase==='cast'){F.phase='lost';F.msg='Reeled in too early. Wait for the ❗';F.t=now;czFishUI();return}
 if(F.phase==='bite'){F.phase='reel';F.need=CZ_FISH_RAR[F.sp.r].hits;F.hits=0;F.strikes=0;F.pos=Math.random();F.dir=1;F.zc=.25+Math.random()*.5;F.t=now;czFishUI();return}
 if(F.phase==='reel'){const rod=CZ_RODS[czFS().rod],half=rod.zone/2*(1-.12*F.sp.r);
  if(Math.abs(F.pos-F.zc)<=half){F.hits++;SFX.correct&&SFX.correct();if(F.hits>=F.need){czFishCatch();return}F.zc=.15+Math.random()*.7;F.msg='Nice! Keep reeling!'}
  else{F.strikes++;SFX.wrong&&SFX.wrong();if(F.strikes>=rod.str){F.phase='lost';F.msg=`The ${F.sp.n} got away!`;F.t=now}else F.msg='Missed! One more slip and it\'s gone.'}
  czFishUI();return}
 if(F.phase==='lost'||F.phase==='caught')czFishEnd()}
function czFishCatch(){const f=czFS(),sp=F.sp,sz=+(sp.sz[0]+Math.random()*(sp.sz[1]-sp.sz[0])).toFixed(1),L=f.log[sp.id]||(f.log[sp.id]={n:0,best:0});
 const first=!L.n,rec=sz>L.best;L.n++;if(rec)L.best=sz;f.bag[sp.id]=(f.bag[sp.id]||0)+1;S.st.fish=(S.st.fish||0)+1;
 F.phase='caught';F.t=performance.now();F.msg=`${first?'🆕 New species! ':''}${rec&&!first?'📏 New record! ':''}${sz}" long · sells for ${sp.v}🪙`;SFX.level&&SFX.level();czFishUI();saveGame(true)}

// ---- the panel ----
function czFishUI(){let d=$('#czFish');if(!d){d=document.createElement('div');d.id='czFish';document.body.appendChild(d);d.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;czFishAct()})}
 d.style.display='block';const f=czFS(),rod=CZ_RODS[f.rod],place=POIS[region[idx(F.fx,F.fy)]];
 const head=`<div class="fh">🎣 <b>${rod.n}</b> · ${place?place.name:''}${F.bait?' · 🪱 bait on':''}<span>🪱 ${f.bait}</span></div>`;
 let body='';
 if(F.phase==='cast')body=`<p class="fm">Casting...</p>`;
 else if(F.phase==='wait')body=`<p class="fm">Waiting for a bite... <small>(press A / Space when you see ❗)</small></p>`;
 else if(F.phase==='bite')body=`<p class="fm big">❗ BITE! Press A / Space!</p>`;
 else if(F.phase==='reel'){const rr=CZ_FISH_RAR[F.sp.r];body=`<p class="fm">Stop the needle in the green! <b>${F.hits}/${F.need}</b> ${'💢'.repeat(F.strikes)}<br><small>${F.msg||'It\'s a '+rr.n.toLowerCase()+' fish!'}</small></p><div class="meter"><i class="zone"></i><i class="needle"></i></div>`}
 else if(F.phase==='caught'){const sp=F.sp,rr=CZ_FISH_RAR[sp.r];body=`<div class="got">${czFishIc(sp)}<div><b style="color:${rr.c}">${sp.n}</b> <small>[${rr.n}]</small><br><small>${F.msg}</small></div></div>`}
 else if(F.phase==='lost')body=`<p class="fm">${F.msg}</p>`;
 d.innerHTML=head+body+`<div class="row"><button onclick="czFishAct()">${F.phase==='caught'||F.phase==='lost'?'OK':'🎣 Reel (A)'}</button><button onclick="czFishJournal()">📖 Journal</button><button onclick="czFishEnd()">Stop (B)</button></div>`;
 czFishMeter()}
function czFishMeter(){const m=$('#czFish .meter');if(!m||F.phase!=='reel')return;const rod=CZ_RODS[czFS().rod],half=rod.zone/2*(1-.12*F.sp.r);
 const z=m.querySelector('.zone'),n=m.querySelector('.needle');z.style.left=((F.zc-half)*100)+'%';z.style.width=(half*200)+'%';n.style.left=(F.pos*100)+'%'}
function czFishJournal(){const f=czFS();const w=$('#czFish')||document.body;const had=F.on;
 const rows=CZ_FISH_SP.map(sp=>{const L=f.log[sp.id],rr=CZ_FISH_RAR[sp.r];return`<div class="jr${L?'':' un'}">${czFishIc(sp,!L)}<div><b style="color:${L?rr.c:'#7a6a5a'}">${L?sp.n:'???'}</b> <small>[${rr.n}]</small><br><small>${L?`Caught ${L.n} · best ${L.best}" · ${sp.v}🪙`:sp.tip}</small></div></div>`}).join('');
 const n=Object.keys(f.log).length;
 czCloudDialog(true,`<h3>📖 Fish Journal <small>${n}/${CZ_FISH_SP.length}</small></h3><div class="czjour">${rows}</div><div class="row"><button id="czjX">Close</button></div>`);
 $('#czjX').onclick=()=>czCloudDialog(false)}

// ---- hooks into the game ----
interact=(orig=>function(){if(state==='world'&&!player.moving&&S){const[fx,fy]=facing();if(inb(fx,fy)&&map[idx(fx,fy)]===T.WATER&&!npcs.some(n=>n.x===fx&&n.y===fy)){
 if(czFS().rod){czFishStart(fx,fy);return}
 if(!czFishStart.tipped){czFishStart.tipped=1;dialog(['🎣 Looks like a good fishing spot!','Fishing rods are sold at the Pro Shop.'])}return}}return orig.apply(this,arguments)})(interact);
press=(orig=>function(k,v){if(state==='fish'){if(k==='A')czFishAct();else if(k==='B'||k==='MENU')czFishEnd();return}return orig.apply(this,arguments)})(press);
(function czFishLoop(){requestAnimationFrame(czFishLoop);if(F.on)czFishTick()})();
// line and bobber in the world
CZ_HOOKS.air.push(()=>{if(!F.on||!S)return;const bx=(F.fx+DX[player.dir]*.8)*16+8-camX,by=(F.fy+DY[player.dir]*.8)*16+9-camY,hx=player.px+8+DX[player.dir]*6-camX,hy=player.py-6-camY;
 const bob=F.phase==='bite'?Math.sin(performance.now()/40)*2+2:F.phase==='reel'?3:Math.sin(performance.now()/400)*1;
 ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo((hx+bx)/2,Math.min(hy,by)-8,bx,by+bob);ctx.stroke();
 ctx.fillStyle='#2a1a12';ctx.fillRect(bx-2,by-2+bob,4,5);ctx.fillStyle='#e8443a';ctx.fillRect(bx-1,by-1+bob,2,2);ctx.fillStyle='#fff';ctx.fillRect(bx-1,by+1+bob,2,1);
 if(F.phase==='bite'){ctx.fillStyle='#2a1a12';ctx.fillRect(bx-3,by-17,6,10);ctx.fillStyle='#ffd84a';ctx.fillRect(bx-2,by-16,4,8);ctx.fillStyle='#b8452f';ctx.fillRect(bx-1,by-15,2,4);ctx.fillRect(bx-1,by-10,2,1)}
 if(F.phase==='wait'&&(performance.now()/700|0)%3===0){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(bx,by+4,6,2,0,0,Math.PI*2);ctx.stroke()}});

// ---- chests: a rod if you don't have one, otherwise bait ----
function czFishLoot(lines){const f=czFS();if(!f.rod){f.rod=1;lines.push(`${NM()} found a 🎣 Bamboo Rod! Face any water and press A to fish.`)}else{const n=rint(3,5);f.bait+=n;lines.push(`${NM()} found 🪱 bait x${n}! It helps rare fish bite.`)}}

// ---- shop: rods and bait to buy, fish to sell ----
function czFishBuy(k){const f=czFS();if(k==='bait'){if(S.coins<CZ_BAIT.p)return;S.coins-=CZ_BAIT.p;f.bait+=CZ_BAIT.qty}else{const i=+k,r=CZ_RODS[i];if(!r||f.rod>=i||S.coins<r.p)return;S.coins-=r.p;f.rod=i;
 toast(i===1?'🎣 Got a Bamboo Rod! Face any water and press A (Space) to fish.':`🎣 Upgraded to the ${r.n}!`)}SFX.item&&SFX.item();updHud();renderShop()}
function czFishSell(id){const f=czFS();const ids=id?[id]:Object.keys(f.bag);let c=0;for(const k of ids){const sp=CZ_FISH_SP.find(s=>s.id===k);if(!sp)continue;c+=sp.v*(f.bag[k]||0);delete f.bag[k]}
 if(!c)return;S.coins+=c;S.st.fishCoins=(S.st.fishCoins||0)+c;SFX.item&&SFX.item();toast(`🐟 Sold fish for ${c} coins!`);updHud();renderShop()}
function czFishShop(){const grid=$('#shop .grid');if(!grid||!shopN)return;const f=czFS(),tier=shopN.tier||0;
 if(shopTab==='buy'){let h='';const next=f.rod+1,maxTier=tier>=2?3:tier>=1?2:1;
  if(next<=3&&next<=maxTier){const r=CZ_RODS[next];h+=`<div class="card"><div class="ic">🎣</div><div><b>${r.n}</b> <small>${f.rod?'(upgrade)':''}</small><br><small>${next===1?'Fish at any water! Press A while facing it.':next===2?'Bigger green zone, and one slip won\'t lose the fish.':'Biggest green zone and rare fish bite more often.'}</small></div><button ${S.coins>=r.p?'':'disabled'} onclick="czFishBuy(${next})">${r.p}🪙</button></div>`}
  else if(f.rod<3&&next>maxTier)h+=`<div class="card"><div class="ic">🎣</div><div><b>${CZ_RODS[next].n}</b><br><small>Sold at bigger towns' shops.</small></div><button disabled>—</button></div>`;
  h+=`<div class="card"><div class="ic">🪱</div><div><b>${CZ_BAIT.n}</b> <small>(have ${f.bait})</small><br><small>Fish bite faster, and rare fish bite more often.</small></div><button ${S.coins>=CZ_BAIT.p?'':'disabled'} onclick="czFishBuy('bait')">${CZ_BAIT.p}🪙</button></div>`;
  grid.insertAdjacentHTML('beforeend',h)}
 else if(shopTab==='sell'){const ks=Object.keys(f.bag).filter(k=>f.bag[k]>0);if(!ks.length)return;const tot=ks.reduce((a,k)=>a+CZ_FISH_SP.find(s=>s.id===k).v*f.bag[k],0);
  const h=`<div class="card czdeal"><div class="ic">🐟</div><div><b>Sell all fish</b><br><small>${ks.reduce((a,k)=>a+f.bag[k],0)} fish in your cooler</small></div><button onclick="czFishSell()">+${tot}🪙</button></div>`+
   ks.map(k=>{const sp=CZ_FISH_SP.find(s=>s.id===k);return`<div class="card"><div class="ic">${czFishIc(sp)}</div><div><b style="color:${CZ_FISH_RAR[sp.r].c}">${sp.n}</b> x${f.bag[k]}<br><small>${sp.v}🪙 each</small></div><button onclick="czFishSell('${k}')">+${sp.v*f.bag[k]}🪙</button></div>`}).join('');
  const it=grid.querySelector('i');if(it&&grid.children.length===0)grid.innerHTML='';if(grid.textContent.includes('No spare gear'))grid.innerHTML='';grid.insertAdjacentHTML('afterbegin',h)}}

// ---- awards ----
ACH.push(
 {g:'Fishing',id:'fish_first',n:'Gone Fishin\'',d:'Catch your first fish.',i:'🎣',t:'bronze',c:()=>(S.st.fish||0)>=1},
 {g:'Fishing',id:'fish_half',n:'Tackle Box',d:'Catch 8 different kinds of fish.',i:'🐟',t:'silver',c:()=>S.fish&&Object.keys(S.fish.log).length>=8},
 {g:'Fishing',id:'fish_all',n:'Master Angler',d:`Catch all ${CZ_FISH_SP.length} kinds of fish.`,i:'🏆',t:'gold',c:()=>S.fish&&Object.keys(S.fish.log).length>=CZ_FISH_SP.length},
 {g:'Fishing',id:'fish_gold',n:'Golden Catch',d:'Reel in the Golden Gridiron Guppy.',i:'✨',t:'plat',c:()=>S.fish&&!!S.fish.log.guppy});
(()=>{const st=document.createElement('style');st.textContent=`#czFish{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:55;display:none;background:#fbf1dc;border:3px solid #2a1a12;border-radius:10px;padding:10px 14px;width:min(380px,92vw);box-shadow:0 5px 0 #2a1a12;color:#2a1a12;user-select:none;-webkit-user-select:none}
#czFish,#czFish *{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
#czFish .fh{font-size:12px;display:flex;gap:4px}#czFish .fh span{margin-left:auto}#czFish .fm{margin:8px 0;font-size:14px;text-align:center}#czFish .fm.big{font-size:18px;font-weight:800;color:#b8452f;animation:czshake .25s infinite}
@keyframes czshake{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
#czFish .meter{position:relative;height:18px;background:#3a7bd5;border:2px solid #2a1a12;border-radius:6px;margin:4px 0 8px;overflow:hidden}#czFish .zone{position:absolute;top:0;bottom:0;background:#3ccf5a;border-left:2px solid #1e7a30;border-right:2px solid #1e7a30}
#czFish .needle{position:absolute;top:-2px;bottom:-2px;width:3px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px #2a1a12}
#czFish .row{display:flex;gap:6px}#czFish .row button{flex:1;font-size:12px}
#czFish .got{display:flex;gap:10px;align-items:center;margin:8px 0}#czFish .got .czfi{width:78px;height:42px}
.czfi{width:52px;height:28px;image-rendering:pixelated}
.czjour{max-height:52vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:6px}.czjour .jr{display:flex;gap:6px;align-items:center;background:#fff;border:2px solid #2a1a12;border-radius:6px;padding:4px;font-size:12px;line-height:1.3}.czjour .jr.un{background:#efe4cc}
#czCloud .box:has(.czjour){max-width:640px}`;document.head.appendChild(st)})();
