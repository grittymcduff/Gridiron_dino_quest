// ===================== TEAM BUS TICKET (fast travel home) =====================
// A bag item that rides you back to your front door in Kickoff Town from anywhere. Sold in every shop.
// The first one is free: Coach hands it over the first time you're far from home, so players see how it works.
CONS.bus={name:'Team Bus Ticket',icon:'🚌',desc:'Ride the team bus home to your front door in Kickoff Town',price:40};
function czBusSpot(){const k=POIS[0];return{x:k.x+6,y:k.y}} // the tile just below the HOME door
function czBusFar(){const h=czBusSpot();return Math.abs(S.x-h.x)+Math.abs(S.y-h.y)}
function czBusRide(){if(!S.inv.bus)return;
 if(czBusFar()<6){toast('🏠 You\'re already home!');return}
 if(state==='battle'||B){toast('Finish the challenge first!');return}
 S.inv.bus--;if(!S.inv.bus)delete S.inv.bus;S.st.bus=(S.st.bus||0)+1;closeMenu();
 const h=czBusSpot();S.dir='up';toast('🚌 All aboard! Next stop: home.');warp(h.x,h.y,'Home Sweet Home')}
useItem=(orig=>function(k){if(k==='bus')return czBusRide();return orig.apply(this,arguments)})(useItem);

// ---- a button on the world map too ----
openMap=(orig=>function(){orig.apply(this,arguments);const v=$('#mapView'),bar=v&&v.querySelector('#menuTabs');if(!bar)return;let b=bar.querySelector('.czBus');
 if(!b){b=document.createElement('span');b.className='czBus';bar.insertBefore(b,bar.querySelector('.x'))}
 const n=S.inv.bus||0;b.innerHTML=n?`<button onclick="czBusRide()">🚌 Ride home <small>(${n})</small></button>`:`<small title="Sold in every shop">🚌 Bus tickets: ${CONS.bus.price}🪙 at shops</small>`})(openMap);

// ---- the free first ticket ----
let czBusT=0;
CZ_HOOKS.over.push(()=>{if(state!=='world'||!S||!S.intro||++czBusT%60)return;S.flags=S.flags||{};if(S.flags.busFree)return;
 if(czBusFar()<40)return;S.flags.busFree=1;S.inv.bus=(S.inv.bus||0)+1;SFX.item&&SFX.item();saveGame(true);
 dialog(['📱 A text from Coach: "Long way from home, huh? Here\'s a free 🚌 Team Bus Ticket."','"Use it from your bag or the world map 🗺 and the bus takes you right to your front door. Shops sell more."'])});

(()=>{const st=document.createElement('style');st.textContent=`.czBus{margin-left:auto;margin-right:6px;font-size:12px}.czBus button{font:inherit;font-weight:700;padding:3px 10px;border-radius:6px;border:2px solid #2a1a12;background:#ffd84a;cursor:pointer}`;document.head.appendChild(st)})();
