// =====================================================================
//  ITEM ART (optional): art/cozy/sprites/
//    icon_<item>.png  48x48  menu icons (Bag, Gear, shop, sell, battle bag)
//                     <item> = consumable key (water, orange, ...), gear id (leatherhelm, jersey, sneakers, ...)
//                     or, for equipment, its throw type (ball, bottle, yflag, rflag, whistle, cooler, gold)
//    held_<type>.png  32x32  the thrown item in battle + the item carried on the map
//    map_chest.png, map_chestgold.png, map_chestopen.png, map_sparkle.png  32x32 (one tile)
//  Anything without a file keeps its emoji / built-in drawing.
// =====================================================================
for(const k in CONS)CONS[k]._ik='icon_'+k;
for(const id in GEAR){const g=GEAR[id];g._ik='icon_'+(g.slot==='weapon'?g.proj:id)}
function czIc(o,inline){const src=o&&o._ik&&COZY_ART[o._ik];return src?`<img class="czic${inline?' in':''}" src="${src}" alt="">`:(o?o.icon:'')}
(function(){const st=document.createElement('style');st.textContent=`.czic{width:30px;height:30px;image-rendering:pixelated;vertical-align:middle;display:inline-block}.czic.in{width:20px;height:20px;margin:-3px 1px 0 0}.card .ic .czic{width:32px;height:32px}`;document.head.appendChild(st)})();
renderMenu=ccPatch(renderMenu,[['<div class="ic">${c.icon}</div>','<div class="ic">${czIc(c)}</div>'],['<div class="ic">${g.icon}</div>','<div class="ic">${czIc(g)}</div>'],['${g.icon} <b>${g.na','${czIc(g,1)} <b>${g.na']]);
renderShop=ccPatch(renderShop,[['<div class="ic">${c.icon}</div>','<div class="ic">${czIc(c)}</div>'],['<div class="ic">${g.icon}</div>','<div class="ic">${czIc(g)}</div>']]);
bag=ccPatch(bag,[['${CONS[k].icon} ${CONS[k].name} x${S.inv[k]}','${czIc(CONS[k],1)} ${CONS[k].name} x${S.inv[k]}']]);
// chests on the map
buildMisc=(orig=>function(){orig();if(COZY_IMG.map_chest)chestSpr=COZY_IMG.map_chest;if(COZY_IMG.map_chestgold)chestGoldSpr=COZY_IMG.map_chestgold;if(COZY_IMG.map_chestopen)chestOpen=COZY_IMG.map_chestopen})(buildMisc);
// pickup sparkle: twinkles in place
drawItem=(orig=>function(it){if(it.kind!=='chest'&&COZY_IMG.map_sparkle){const sx=it.x*16-camX,sy=it.y*16-camY,t=frame/14+it.x*1.7+it.y;
  ctx.save();ctx.globalAlpha=.65+.35*Math.sin(t);const s=12+2*Math.sin(t*1.3);ctx.drawImage(COZY_IMG.map_sparkle,sx+8-s/2,sy+8-s/2-1,s,s);ctx.restore();return}
 return orig(it)})(drawItem);
// thrown item in battle
drawProj=(orig=>function(k,x,y,t,small){const im=COZY_IMG['held_'+k];if(!im)return orig(k,x,y,t,small);
 const s=small?11:18;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(!small)ctx.rotate(t*.5);ctx.drawImage(im,-s/2,-s/2,s,s);ctx.restore()})(drawProj);
// item carried on the map, at the hand of the taller cozy character
drawMiniWeapon=(orig=>function(px,py,dir){const w=GEAR[S.equip.weapon];const im=w&&COZY_IMG['held_'+w.proj];if(!im)return orig(px,py,dir);
 const s=9,x=Math.round(px-camX)+(dir==='left'?-1:dir==='right'?8:dir==='up'?10:11),y=Math.round(py-camY)+3;
 if(dir==='left'){ctx.save();ctx.translate(x+s,y);ctx.scale(-1,1);ctx.drawImage(im,0,0,s,s);ctx.restore()}else ctx.drawImage(im,x,y,s,s);
 if(w.r>=4&&(frame>>3)%3===0){ctx.fillStyle='#fff6c0';ctx.fillRect(x+s-2,y-1,1,1)}})(drawMiniWeapon);
