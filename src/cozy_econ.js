// ===================== ECONOMY + FINDABLE SHOPS =====================
// Shops get a sign and a working door, a ❗ until you've visited, and a daily deal. Chests give fewer
// consumables and more coins, and coins have new uses: gear upgrades, daily deals, fishing gear, house decor.

// ---- shopkeepers stand beside their door (they used to block it); Mom moves aside from the home door ----
genNPCs=ccPatch(genNPCs,[["mk(p.x-6,p.y+0,'shop',","mk(p.x-4,p.y+0,'shop',"],["mk(kk.x+6,kk.y,'mom',","mk(kk.x+4,kk.y,'mom',"]]);

// ---- chests: one consumable instead of 1-2, much more often coins; a small chance of fishing gear ----
openChest=ccPatch(openChest,[
 ["else if(r<.92){const k=rollCons(),n=rint(1,2);","else if(r<.6){const k=rollCons(),n=1;"],
 ["else{const c=rint(50,150);S.coins+=c;lines.push(`${NM()} found a bag of ${c} coins! 🪙`)}","else if(r<.95||typeof czFishLoot!=='function'){const c=rint(40,90)*(1+(it.tier||0));S.coins+=c;lines.push(`${NM()} found a bag of ${c} coins! 🪙`)}else czFishLoot(lines)"]]);

// ---- where things are ----
function czTownDoors(){const out=[];POIS.forEach((p,k)=>{if(p.id==='champ')return;out.push({k:'shop',p,x:p.x-6,y:p.y-1},{k:p.id==='kickoff'?'home':'house',p,x:p.x+6,y:p.y-1})});return out}
function czShopkeeper(p){return npcs.find(n=>n.kind==='shop'&&Math.abs(n.home.x-p.x)<=8&&Math.abs(n.home.y-p.y)<=3)}
function czToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

// ---- doors ----
function czDoor(x,y){const d=czTownDoors().find(o=>o.x===x&&o.y===y);if(!d)return false;
 if(d.k==='shop'){const n=czShopkeeper(d.p);if(!n)return false;SFX.blip&&SFX.blip();dialog([`${n.name}: Come on in! Gear, snacks and today's deal.`],()=>openShop(n));return true}
 if(d.k==='home'){if(typeof czHouseEnter==='function'){czHouseEnter();return true}return false}
 dialog([pick(['Nobody\'s home. They\'re all out at the game!','A sign on the door: "Gone tailgating. Back after the 4th quarter."','You hear a TV inside: "...and he takes it all the way!" Nobody answers.'])]);return true}
interact=(orig=>function(){if(state==='world'&&!player.moving){const[fx,fy]=facing();if(inb(fx,fy)&&map[idx(fx,fy)]===T.DOOR&&czDoor(fx,fy))return}return orig.apply(this,arguments)})(interact);

// ---- shop visits, ❗ markers, daily deal ----
openShop=(orig=>function(n){S.shopSeen=S.shopSeen||{};S.shopSeen[n.id]=czToday();if(n.kind==='shop'&&shopTab==='up'&&!czUpList().length)shopTab='buy';return orig.apply(this,arguments)})(openShop);
function czShopId(n){return n.x+'_'+n.y}
function czDeal(n){if(!n)return null;const day=czToday(),tier=Math.min(5,(n.tier||0)+1);
 const pool=Object.keys(GEAR).filter(k=>GEAR[k].r===tier&&!(typeof LEGENDS!=='undefined'&&LEGENDS[k]));if(!pool.length)return null;
 let h=0;for(const ch of day+czShopId(n))h=(h*31+ch.charCodeAt(0))>>>0;const id=pool[h%pool.length];
 const price=Math.round(GEAR_PRICE[tier]*.7);const sold=!!(S.deals&&S.deals[day+'|'+czShopId(n)]);return{id,price,sold,day}}
function czBuyDeal(){const n=shopN,d=czDeal(n);if(!d||d.sold||S.coins<d.price)return;S.coins-=d.price;S.st.bought=(S.st.bought||0)+1;S.gear.push(d.id);
 S.deals=S.deals||{};for(const k in S.deals)if(!k.startsWith(d.day))delete S.deals[k];S.deals[d.day+'|'+czShopId(n)]=1;SFX.item();
 toast(`Bought ${GEAR[d.id].name}! Equip it in Menu → Gear.`);updHud();renderShop()}

// ---- gear upgrades (+1 to +3): each level adds 20% of the item's stats ----
const CZ_UPMAX=3;
function czUpLv(id){return(S.gup&&S.gup[id])||0}
function czUpCost(id){const g=GEAR[id];return Math.round(GEAR_PRICE[g.r]*.6*(czUpLv(id)+1))}
function czUpBonus(g,lv){const b={};if(!lv)return b;for(const k of['atk','def','hp','heal']){if(g[k])b[k]=Math.max(lv,Math.round(g[k]*.2*lv))}for(const k of['crit','dodge'])if(g[k])b[k]=lv;return b}
function czUpList(){return SLOTS.map(s=>S.equip[s]).filter(Boolean)}
stats=(orig=>function(){const s=orig.apply(this,arguments);if(!S||!S.gup)return s;
 for(const k of SLOTS){const id=S.equip[k];if(!id)continue;const b=czUpBonus(GEAR[id],czUpLv(id));s.atk+=b.atk||0;s.def+=b.def||0;s.hp+=b.hp||0;s.heal+=b.heal||0;s.crit+=(b.crit||0)/100;s.dodge+=(b.dodge||0)/100}return s})(stats);
function czUpgrade(id){const lv=czUpLv(id);if(lv>=CZ_UPMAX)return;const c=czUpCost(id);if(S.coins<c)return;S.coins-=c;S.gup=S.gup||{};S.gup[id]=lv+1;S.st.upgrades=(S.st.upgrades||0)+1;
 SFX.level&&SFX.level();toast(`⬆️ ${GEAR[id].name} is now +${lv+1}!`);updHud();renderShop()}
function czUpDesc(g,lv){const b=czUpBonus(g,lv),p=[];if(b.atk)p.push('ATK+'+b.atk);if(b.def)p.push('DEF+'+b.def);if(b.hp)p.push('💧+'+b.hp);if(b.crit)p.push('CRIT+'+b.crit+'%');if(b.dodge)p.push('JUKE+'+b.dodge+'%');if(b.heal)p.push('Heal+'+b.heal);return p.join('  ')}

renderShop=(orig=>function(){const n=shopN;
 if(shopTab==='up'){const tabs=`<div id="menuTabs"><button onclick="G.shopTab('buy')">🛒 Buy</button><button onclick="G.shopTab('sell')">💰 Sell</button><button class="on" onclick="G.shopTab('up')">⬆️ Upgrade</button><span class="coins">🪙 ${S.coins}</span><button class="x" onclick="G.closeMenu()">✕</button></div>`;
  const rows=czUpList().map(id=>{const g=GEAR[id],lv=czUpLv(id),c=czUpCost(id),max=lv>=CZ_UPMAX;
   return`<div class="card" style="border-color:${RAR[g.r].c}"><div class="ic">${czIc(g)}</div><div><b style="color:${RAR[g.r].c}">${g.name}${lv?' +'+lv:''}</b><br><small>${gearDesc(g)}${lv?'  <span class="good">('+czUpDesc(g,lv)+')</span>':''}</small>${max?'':`<br><small class="muted">Next: ${czUpDesc(g,lv+1)}</small>`}</div>${max?'<button disabled>MAX</button>':`<button ${S.coins>=c?'':'disabled'} onclick="czUpgrade('${id}')">${c}🪙</button>`}</div>`}).join('');
  $('#shop').innerHTML=tabs+`<div id="menuBody2"><p class="help" style="margin:4px 0 8px">Upgrade the gear you're wearing. Each level adds 20% to its stats (up to +${CZ_UPMAX}).</p><div class="grid">${rows||'<i>Equip some gear first.</i>'}</div></div>`;return}
 orig.apply(this,arguments);
 // Upgrade tab button
 const tb=$('#shop #menuTabs');if(tb){const b=document.createElement('button');b.textContent='⬆️ Upgrade';b.onclick=()=>G.shopTab('up');const coins=tb.querySelector('.coins');tb.insertBefore(b,coins)}
 // fishing goods and selling fish hook in here (cozy_fish.js)
 if(typeof czFishShop==='function')czFishShop();
 // today's deal on top of the Buy list
 if(shopTab==='buy'&&n&&n.kind==='shop'){const d=czDeal(n),grid=$('#shop .grid');if(d&&grid){const g=GEAR[d.id],full=GEAR_PRICE[g.r];
  const el=document.createElement('div');el.className='card czdeal';el.style.borderColor=RAR[g.r].c;
  el.innerHTML=`<div class="ic">${czIc(g)}</div><div><b>⭐ Today's deal</b> <small class="muted">(new one every day)</small><br><b style="color:${RAR[g.r].c}">${g.name}</b> [${RAR[g.r].n}]<br><small>${gearDesc(g)}</small></div>`+
   (d.sold?'<button disabled>Sold out</button>':`<button ${S.coins>=d.price?'':'disabled'} onclick="czBuyDeal()"><s style="opacity:.6">${full}</s> ${d.price}🪙</button>`);
  grid.insertBefore(el,grid.firstChild)}}})(renderShop);

// ---- signs over shop and home doors, ❗ over shopkeepers ----
const CZ_FONT={S:['111','100','111','001','111'],H:['101','101','111','101','101'],O:['111','101','101','101','111'],P:['111','101','111','100','100'],M:['10001','11011','10101','10001','10001'],E:['111','100','111','100','111']};
function czPixText(t,x,y,c){ctx.fillStyle=c;let cx=x;for(const ch of t){const g=CZ_FONT[ch];if(!g)continue;for(let r=0;r<5;r++)for(let i=0;i<g[r].length;i++)if(g[r][i]==='1')ctx.fillRect(cx+i,y+r,1,1);cx+=g[0].length+1}}
function czTextW(t){let w=0;for(const ch of t){const g=CZ_FONT[ch];if(g)w+=g[0].length+1}return w-1}
function czSign(tx,ty,txt,col){const w=czTextW(txt)+8,h=9,sx=Math.round(tx*16+8-w/2-camX),sy=Math.round(ty*16-camY-h-1);
 ctx.fillStyle='#2a1a12';ctx.fillRect(sx+2,sy-3,1,3);ctx.fillRect(sx+w-3,sy-3,1,3);
 ctx.fillStyle='#2a1a12';ctx.fillRect(sx-1,sy-1,w+2,h+2);ctx.fillStyle=col;ctx.fillRect(sx,sy,w,h);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(sx,sy,w,1);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(sx,sy+h-1,w,1);
 czPixText(txt,sx+4,sy+2,'#fff7e0')}
CZ_HOOKS.ground.push((x0,y0,vw,vh)=>{for(const d of czTownDoors()){if(d.x<x0-2||d.x>x0+vw+2||d.y<y0-1||d.y>y0+vh+2)continue;
 if(d.k==='shop')czSign(d.x,d.y,'SHOP','#b8452f');else if(d.k==='home')czSign(d.x,d.y,'HOME','#3f6fc8')}});
function czShopNews(n){const id=n.id,seen=S.shopSeen&&S.shopSeen[id];if(!seen)return'!';const d=czDeal(n);if(d&&!d.sold&&seen!==czToday())return'★';return null}
CZ_HOOKS.ents.push((x0,y0,vw,vh,ents)=>{if(state!=='world')return;for(const n of npcs){if(n.kind!=='shop'||n.x<x0-1||n.x>x0+vw+1||n.y<y0-1||n.y>y0+vh+2)continue;const m=czShopNews(n);if(!m)continue;
 ents.push({y:n.py+1,d:()=>{const b=Math.sin(frame/9)*1.5,sx=Math.round(n.px-camX+8),sy=Math.round(n.py-camY-14+b);ctx.fillStyle='#2a1a12';ctx.fillRect(sx-5,sy-8,10,10);ctx.fillStyle=m==='!'?'#ffd84a':'#fff7e0';ctx.fillRect(sx-4,sy-7,8,8);
  ctx.fillStyle=m==='!'?'#b8452f':'#e8900c';if(m==='!'){ctx.fillRect(sx-1,sy-6,2,4);ctx.fillRect(sx-1,sy-1,2,1)}else{ctx.fillRect(sx-1,sy-6,2,6);ctx.fillRect(sx-3,sy-4,6,2)}
  ctx.fillStyle='#2a1a12';ctx.fillRect(sx-1,sy+2,3,1)}})}});

// ---- map: 🛒 for shops, 🏠 for home ----
renderMap=(orig=>function(){orig.apply(this,arguments);const c=$('#mapCv');if(!c||!S)return;const g=c.getContext('2d'),M=2;g.font='11px sans-serif';g.textAlign='center';g.textBaseline='middle';
 for(const d of czTownDoors()){if(d.k==='house')continue;g.fillText(d.k==='shop'?'🛒':'🏠',d.x*M,d.y*M-2)}})(renderMap);

// ---- the first time near the Kickoff shop, point it out ----
let czShopHintT=0;
CZ_HOOKS.over.push(()=>{if(state!=='world'||!S||(S.flags&&S.flags.shopHint)||(S.shopSeen&&Object.keys(S.shopSeen).length)||!S.intro||++czShopHintT%30)return;const p=POIS[0];
 if(Math.abs(player.x-(p.x-6))+Math.abs(player.y-(p.y-1))<=5){S.flags=S.flags||{};S.flags.shopHint=1;toast('🛒 That red building is the Pro Shop. Walk up to the door to go in!')}});
(()=>{const st=document.createElement('style');st.textContent=`.czdeal{background:#fff6d6!important;box-shadow:0 0 0 2px #ffd84a inset}.czdeal s{margin-right:3px}`;document.head.appendChild(st)})();
