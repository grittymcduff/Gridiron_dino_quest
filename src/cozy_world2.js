// ============================================================================
//  WORLD POLISH, PART 2
//  Hidden gold chests with landscape clues, plus the extra map layers that hang
//  off the drawWorld hooks (ground / ents / air / over) defined in cozy.js.
// ============================================================================

// ---------------------------------------------------------------------------
//  GOLD CHESTS: off the map screen until opened. Clues in the world instead:
//   - golden dragonflies: rare far out, more as you get close, circling the spot
//     right beside it (they drift toward the chest, so following them works)
//   - golden flowers sprinkled in the grass around it
//   - one townsperson near each chest knows an old saying about the place
// ---------------------------------------------------------------------------
const CZ_GOLD={far:30,flies:[],flowers:[],riddles:{}};
function czGoldChests(){return items.filter(i=>i.legend&&!S.taken[i.id])}
function czNearestGold(){let best=null,bd=1e9;for(const it of czGoldChests()){const d=Math.hypot(it.x-player.x,it.y-player.y);if(d<bd){bd=d;best=it}}return best?{it:best,d:bd}:null}

// golden flowers: a few per chest, on open grass within 6 tiles (fixed, from the world seed)
function czGoldFlowers(){CZ_GOLD.flowers=[];const rr=mulberry32(WORLD_SEED+515);
 for(const it of items.filter(i=>i.legend)){for(let b=-6;b<=6;b++)for(let a=-6;a<=6;a++){const x=it.x+a,y=it.y+b,d=Math.hypot(a,b);if(!inb(x,y)||d>6||d<1.5)continue;
  const t=map[idx(x,y)];if(t!==T.GRASS&&t!==T.TALL&&t!==T.FLOWER&&t!==T.SAND&&t!==T.MFLOOR)continue;if(rr()<.16*(1-d/7))CZ_GOLD.flowers.push({x,y,id:it.id,ox:2+((rr()*11)|0),oy:4+((rr()*9)|0),k:(rr()*3)|0})}}}
CZ_HOOKS.ground.push((x0,y0,vw,vh)=>{for(const f of CZ_GOLD.flowers){if(f.x<x0-1||f.y<y0-1||f.x>x0+vw+1||f.y>y0+vh+1||S.taken[f.id])continue;
 const sx=f.x*16-camX+f.ox,sy=f.y*16-camY+f.oy,tw=((frame>>4)+f.x)%40===0;
 ctx.fillStyle='#3f7a2a';ctx.fillRect(sx,sy+2,1,3);ctx.fillStyle=tw?'#fffbe0':'#f5c542';ctx.fillRect(sx-1,sy+1,3,1);ctx.fillRect(sx,sy,1,3);ctx.fillStyle='#b8801c';ctx.fillRect(sx,sy+1,1,1)}});

// golden dragonflies
function czGoldFlyTarget(d){return d>CZ_GOLD.far?0:d>20?1:d>12?2:d>6?3:5}
function czGoldTick(){const n=state==='world'?czNearestGold():null,F=CZ_GOLD.flies;
 const want=n?czGoldFlyTarget(n.d):0;
 // spawn at the edge of view on a random side; they wander in, then lean toward the chest
 if(n&&F.filter(f=>!f.leave).length<want&&Math.random()<.02){const ang=Math.random()*6.283,r=Math.min(CW,CH)*.45;
  F.push({x:player.px+8+Math.cos(ang)*r,y:player.py+8+Math.sin(ang)*r*.7,vx:0,vy:0,t:0,ph:Math.random()*6.283,ch:n.it})}
 for(const f of F){f.t++;const cx=f.ch.x*16+8,cy=f.ch.y*16+4,dx=cx-f.x,dy=cy-f.y,dist=Math.hypot(dx,dy)||1;
  if(S.taken[f.ch.id]||!n||n.it!==f.ch||F.filter(g=>!g.leave).length>want)f.leave=f.leave||1;
  if(dist<40){// circle the chest
   const a=Math.atan2(dy,dx)+1.3;f.vx+=Math.cos(a)*.08+dx/dist*.02;f.vy+=Math.sin(a)*.08+dy/dist*.02}
  else{f.vx+=dx/dist*.03+(Math.random()-.5)*.35;f.vy+=dy/dist*.03+(Math.random()-.5)*.35}
  if(f.leave){f.leave++;f.vy-=.03}
  // dragonfly flight: dart, then hover
  const sp=Math.hypot(f.vx,f.vy),mx=(f.t%90<12)?2.2:.9;if(sp>mx){f.vx*=mx/sp;f.vy*=mx/sp}f.vx*=.94;f.vy*=.94;f.x+=f.vx;f.y+=f.vy}
 CZ_GOLD.flies=F.filter(f=>!(f.leave>90)&&Math.abs(f.x-player.px)<CW&&Math.abs(f.y-player.py)<CH)}
function czDrawFly(f,body,wing,glow){const sx=Math.round(f.x-camX),sy=Math.round(f.y-camY+Math.sin(f.t/9+f.ph)*1.5),a=f.leave?Math.max(0,1-f.leave/90):Math.min(1,f.t/40);
 if(a<=0||sx<-4||sy<-4||sx>CW+4||sy>CH+4)return;ctx.globalAlpha=a;const flap=(f.t>>1)&1,dir=f.vx<0?-1:1;
 if(glow){ctx.globalCompositeOperation='lighter';ctx.fillStyle=glow;ctx.fillRect(sx-2,sy-2,5,4);ctx.globalCompositeOperation='source-over'}
 ctx.fillStyle=wing;if(flap){ctx.fillRect(sx-2,sy-2,2,1);ctx.fillRect(sx+1,sy-2,2,1)}else{ctx.fillRect(sx-2,sy,2,1);ctx.fillRect(sx+1,sy,2,1)}
 ctx.fillStyle=body;ctx.fillRect(sx-(dir<0?2:0),sy-1,3,1);ctx.fillRect(sx+(dir<0?-1:1)*-1,sy-1,1,1);ctx.globalAlpha=1}
CZ_HOOKS.air.push(()=>{czGoldTick();const night=lightLevel().dark>.4;for(const f of CZ_GOLD.flies)czDrawFly(f,'#ffcf3a','rgba(255,246,200,.85)',night?'rgba(255,200,60,.35)':null)});

// map screen: unopened gold chests are hidden; opened ones get a small gold check
renderMap=ccPatch(renderMap,[["for(const it of items)if(it.legend&&!S.taken[it.id]){g.fillStyle=OUT;g.fillRect(it.x*M-3,it.y*M-3,7,7);g.fillStyle='#f5c542';g.fillRect(it.x*M-2,it.y*M-2,5,5)}",
 "for(const it of items)if(it.legend&&S.taken[it.id]){g.fillStyle=OUT;g.fillRect(it.x*M-4,it.y*M-1,9,4);g.fillRect(it.x*M+1,it.y*M-5,4,4);g.fillStyle='#f5c542';g.fillRect(it.x*M-3,it.y*M,2,2);g.fillRect(it.x*M-1,it.y*M+1,2,1);g.fillRect(it.x*M+1,it.y*M-1,2,2);g.fillRect(it.x*M+3,it.y*M-4,1,3)}"]]);
function czMapLegendText(){const el=$('#mapView');if(!el)return;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode())if(t.nodeValue.includes('legendary chest (guarded!)'))t.nodeValue=t.nodeValue.replace('legendary chest (guarded!)','gold chest found ✓ (unfound ones are hidden: follow the golden dragonflies)')}

// riddles: one tip-giver in the town nearest each chest knows an old saying about the place
const CZ_BIOME_WORDS={plains:'out in the open meadows',forest:'deep in the woods',coast:'along the windy shore',mountain:'up on the high rocky slopes',desert:'out among the sun-baked dunes',ruins:'among the crumbling old stones',springs:'by the steamy springs',volcano:'out on the ash fields'};
function czRiddleFor(it){const near=(test,r)=>{let n=0;for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++)if(inb(it.x+a,it.y+b)&&test(map[idx(it.x+a,it.y+b)]))n++;return n};
 const biome=CZ_BIOME_WORDS[POIS[region[idx(it.x,it.y)]].biome]||'out in the wild country';const feats=[];
 if(near(t=>t===T.WATER,6)>4)feats.push('where you can hear the water lapping');
 if(near(t=>t===T.TREE||t===T.PINE,4)>10)feats.push('where the trees crowd close together');
 if(near(t=>t===T.ROCK||t===T.COLUMN,5)>2)feats.push('among the boulders');
 if(near(t=>t===T.TALL||t===T.BRUSH,4)>12)feats.push('where the grass grows tall enough to hide in');
 if(near(t=>t===T.PATH,8)===0)feats.push('far from any trail');
 const f=feats.length?feats[(it.x+it.y)%feats.length]:'where few travelers wander';
 return `My grandpa used to say: "Gold sleeps ${biome}, ${f}. When the little golden dragonflies start to gather, you're close."`}
function czSetupRiddles(){CZ_GOLD.riddles={};const used=new Set();
 for(const it of items.filter(i=>i.legend)){let best=null,bd=1e9;for(const n of npcs){if(n.kind!=='tip'||used.has(n.id)||town[idx(n.x,n.y)]===SANCT_ID)continue;const d=Math.hypot(n.x-it.x,n.y-it.y);if(d<bd){bd=d;best=n}}
  if(best){used.add(best.id);CZ_GOLD.riddles[best.id]=it}}}
talk=(orig=>function(n){const it=CZ_GOLD.riddles[n.id];if(n.kind==='tip'&&it&&!S.taken[it.id]){const dd={up:'down',down:'up',left:'right',right:'left'};n.dir=dd[player.dir];
 dialog([`${n.name}: ${TIPS[(n.tip+S.steps)%TIPS.length]}`,`${n.name}: ${czRiddleFor(it)}`]);return}return orig(n)})(talk);

genWorld=(orig=>function(){orig();try{czGoldFlowers();czSetupRiddles()}catch(e){console.warn('gold',e)}})(genWorld);
openMap=(orig=>function(){orig();czMapLegendText()})(openMap);

// ---------------------------------------------------------------------------
//  SMOOTH EDGES: where two kinds of ground meet at a corner (water/sand/path/
//  gravel/grass), the corner is rounded off with the neighbour's texture, so
//  coasts and paths curve instead of stepping. Water edges get a foam line.
// ---------------------------------------------------------------------------
const CZ_EDGE={cache:{},data:{},R:13};
const CZ_EDGE_OK=new Set([T.TALL,T.FLOWER,T.JUNGLE,T.BRUSH,T.TREE,T.PINE,T.ROCK,T.CACTUS]);
function czCls(t){return t===T.WATER?'w':t===T.SAND?'s':t===T.PATH?'p':t===T.MFLOOR?'m':(t===T.GRASS||t===T.TALL||t===T.FLOWER||t===T.JUNGLE)?'g':null}
const CZ_EDGE_PAIRS=new Set(['wg','gw','ws','sw','wp','pw','wm','mw','pg','gp','sg','gs','ps','sp','mg','gm','pm','mp']);
function czTexData(c,f){const k=c+f;if(CZ_EDGE.data[k])return CZ_EDGE.data[k];const t={w:T.WATER,s:T.SAND,p:T.PATH,m:T.MFLOOR,g:T.GRASS}[c];
 const im=tileCache[t][c==='w'?f:0],g=im.getContext('2d');return CZ_EDGE.data[k]=g.getImageData(0,0,im.width,im.height)}
// corners: 0=NW 1=NE 2=SW 3=SE; B[k] = neighbour class for that corner (or null)
function czEdgeImg(A,B,f){const key=A+B.join('')+f;if(CZ_EDGE.cache[key])return CZ_EDGE.cache[key];
 const N=32,R=CZ_EDGE.R,c=hdCanvas(N,N,2),g=c.getContext('2d'),out=g.createImageData(N,N),o=out.data;
 B.forEach((b,k)=>{if(!b)return;const src=czTexData(b,f).data,cx=k&1?N-R:R,cy=k&2?N-R:R,x0=k&1?N-R:0,y0=k&2?N-R:0,wat=A==='w'||b==='w';
  for(let y=y0;y<y0+R;y++)for(let x=x0;x<x0+R;x++){const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<=R)continue;const i=(y*N+x)*4;
   // foam: a light rim on the water side of the curve
   if(wat&&d<R+1.6){const onWater=b==='w';if(onWater){o[i]=232;o[i+1]=244;o[i+2]=255;o[i+3]=255;continue}}
   o[i]=src[i];o[i+1]=src[i+1];o[i+2]=src[i+2];o[i+3]=255}
  if(wat&&A==='w'){// land filled into a water corner: foam just inside the water
   for(let y=y0;y<y0+R;y++)for(let x=x0;x<x0+R;x++){const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<=R&&d>R-1.5){const i=(y*N+x)*4;o[i]=232;o[i+1]=244;o[i+2]=255;o[i+3]=230}}}});
 g.putImageData(out,0,0);return CZ_EDGE.cache[key]=c}
CZ_HOOKS.ground.push((x0,y0,vw,vh)=>{const f=(frame>>5)&1,cl=(x,y)=>inb(x,y)?czCls(groundAt(x,y)):null;
 for(let ty=y0-1;ty<=y0+vh+1;ty++)for(let tx=x0-1;tx<=x0+vw+1;tx++){if(!inb(tx,ty))continue;const t=map[idx(tx,ty)];if(LAYERED.has(t)&&!CZ_EDGE_OK.has(t))continue;const A=czCls(groundAt(tx,ty));if(!A)continue;
  const n=cl(tx,ty-1),s=cl(tx,ty+1),w=cl(tx-1,ty),e=cl(tx+1,ty);if(n===A&&s===A&&w===A&&e===A)continue;
  const corner=(a,b,d)=>a&&a===b&&a!==A&&CZ_EDGE_PAIRS.has(A+a)&&(d===a||d===null||true)?a:null;
  const B=[corner(n,w,cl(tx-1,ty-1)),corner(n,e,cl(tx+1,ty-1)),corner(s,w,cl(tx-1,ty+1)),corner(s,e,cl(tx+1,ty+1))];
  if(!B[0]&&!B[1]&&!B[2]&&!B[3])continue;blit(czEdgeImg(A,B,A==='w'||B.includes('w')?f:0),tx*16-camX,ty*16-camY)}});
// foam on every water edge (the base game only lit the top and left), moving gently, plus a darker shallow band
CZ_HOOKS.ground.unshift((x0,y0,vw,vh)=>{const land=(x,y)=>{if(!inb(x,y))return false;const m=map[idx(x,y)];return m!==T.WATER&&m!==T.BRIDGE&&m!==T.GATE};
 for(let ty=y0-1;ty<=y0+vh+1;ty++)for(let tx=x0-1;tx<=x0+vw+1;tx++){if(!inb(tx,ty)||map[idx(tx,ty)]!==T.WATER)continue;const sx=tx*16-camX,sy=ty*16-camY;
  const N=land(tx,ty-1),S_=land(tx,ty+1),W=land(tx-1,ty),E=land(tx+1,ty);if(!N&&!S_&&!W&&!E)continue;
  ctx.fillStyle='rgba(20,52,110,.22)';if(N)ctx.fillRect(sx,sy+1,16,3);if(S_)ctx.fillRect(sx,sy+12,16,4);if(W)ctx.fillRect(sx+1,sy,3,16);if(E)ctx.fillRect(sx+12,sy,4,16);
  for(let k=0;k<16;k++){const w=Math.sin((frame/22)+(tx*16+k)/5+ty)>.25?1:0,v=Math.sin((frame/22)+(ty*16+k)/5+tx)>.25?1:0;
   ctx.fillStyle='rgba(236,246,255,.9)';if(N)ctx.fillRect(sx+k,sy+w,1,1);if(S_)ctx.fillRect(sx+k,sy+15-w,1,1);if(W)ctx.fillRect(sx+v,sy+k,1,1);if(E)ctx.fillRect(sx+15-v,sy+k,1,1);
   ctx.fillStyle='rgba(220,238,255,.45)';if(N&&w)ctx.fillRect(sx+k,sy+2,1,1);if(S_&&w)ctx.fillRect(sx+k,sy+13,1,1);if(W&&v)ctx.fillRect(sx+2,sy+k,1,1);if(E&&v)ctx.fillRect(sx+13,sy+k,1,1)}}});
// a few glints drifting across open water
CZ_HOOKS.ground.push((x0,y0,vw,vh)=>{if(lightLevel().dark>.5)return;for(let ty=y0;ty<=y0+vh;ty++)for(let tx=x0;tx<=x0+vw;tx++){if(!inb(tx,ty)||map[idx(tx,ty)]!==T.WATER)continue;const h=hash(tx,ty);if(h%7)continue;
 const ph=((frame+h)%160)/160;if(ph>.35)continue;const a=Math.sin(ph/.35*Math.PI);ctx.fillStyle=`rgba(255,255,255,${.75*a})`;const sx=tx*16-camX+(h>>3)%12+2,sy=ty*16-camY+(h>>5)%10+3;ctx.fillRect(sx,sy,3,1);ctx.fillRect(sx+1,sy-1,1,1)}});
