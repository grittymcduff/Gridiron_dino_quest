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

// ---------------------------------------------------------------------------
//  TOWN PROPS: a handful of region-themed props on each town's open floor.
//  Solid (Brady walks around them) but only placed where all 8 neighbours are
//  open, away from doors, paths, NPCs and items, so nothing gets boxed in.
// ---------------------------------------------------------------------------
const OUTL='#2a1a12';
const CZ_PROP_ART={
 barrel(){const c=hdCanvas(32,40,2),g=c.getContext('2d');P_(g,7,8,OUTL,18,32);P_(g,8,9,'#8a5a32',16,30);P_(g,8,9,'#a8743e',5,30);P_(g,20,9,'#6e4426',4,30);
  for(const y of[12,24,35])P_(g,7,y,'#3a3a40',18,2);P_(g,9,9,'#c9925a',14,2);return c},
 crate(){const c=hdCanvas(32,40,2),g=c.getContext('2d');P_(g,5,12,OUTL,22,28);P_(g,6,13,'#b88a4e',20,26);P_(g,6,13,'#d4a868',20,3);P_(g,6,25,'#8a6234',20,2);
  for(let i=0;i<20;i++){P_(g,6+i,14+((i*1.2)|0)%12,'#8a6234',1,1)}P_(g,6,13,'#8a6234',2,26);P_(g,24,13,'#8a6234',2,26);return c},
 hay(){const c=hdCanvas(32,36,2),g=c.getContext('2d');ellT(g,16,24,13,10,OUTL);ellT(g,16,23,12,9,(x,y,a,b)=>b<-.4?'#f0d27a':a>.5?'#b8902e':'#dcb24c');for(let i=0;i<6;i++)P_(g,8+i*3,18+(i%3)*4,'#a07a24',2,1);P_(g,4,23,'#8a4a2a',24,2);return c},
 planter(){const c=hdCanvas(32,36,2),g=c.getContext('2d');P_(g,3,22,OUTL,26,13);P_(g,4,23,'#9a5a3a',24,11);P_(g,4,23,'#b87048',24,2);
  for(let i=0;i<5;i++){const x=6+i*5,col=['#e8443a','#f5c542','#e86ab8','#f5f0e0','#e8443a'][i];ellT(g,x+1,15+(i%2)*2,3,3,'#3f8a3a');ellT(g,x+1,13+(i%2)*2,2,2,col)}return c},
 bench(){const c=hdCanvas(32,32,2),g=c.getContext('2d');P_(g,1,12,OUTL,30,8);P_(g,2,13,'#a8743e',28,3);P_(g,2,16,'#8a5a32',28,3);P_(g,1,20,OUTL,30,4);P_(g,2,20,'#c9925a',28,2);
  P_(g,4,23,OUTL,3,7);P_(g,25,23,OUTL,3,7);return c},
 mailbox(){const c=hdCanvas(32,44,2),g=c.getContext('2d');P_(g,14,20,OUTL,4,24);P_(g,15,20,'#6e4426',2,24);P_(g,7,8,OUTL,18,13);P_(g,8,9,'#2f6fd6',16,11);P_(g,8,9,'#5a92ea',16,2);P_(g,23,4,OUTL,2,8);P_(g,23,4,'#e8443a',5,3);return c},
 anchor(){const c=hdCanvas(32,44,2),g=c.getContext('2d');P_(g,15,6,OUTL,4,30);P_(g,16,7,'#5a5e6a',2,28);P_(g,9,10,OUTL,16,4);P_(g,10,11,'#5a5e6a',14,2);ellT(g,17,5,4,4,OUTL);ellT(g,17,5,2,2,'#8a8e9a');
  for(let i=0;i<9;i++){P_(g,8+i,34-Math.abs(i-4)*1.2|0,'#5a5e6a',2,2);P_(g,17+i,30+Math.abs(i-4)*1.0|0,'#5a5e6a',2,2)}return c},
 buoys(){const c=hdCanvas(32,32,2),g=c.getContext('2d');for(const[x,y,col]of[[10,22,'#e8443a'],[22,22,'#f5f0e0'],[16,14,'#f5c542']]){ellT(g,x,y,6,6,OUTL);ellT(g,x,y,5,5,(a,b,u,v)=>v<-.3?'#fff':col)}return c},
 logs(){const c=hdCanvas(32,32,2),g=c.getContext('2d');for(const[x,y]of[[9,24],[23,24],[16,15]]){ellT(g,x,y,7,6,OUTL);ellT(g,x,y,6,5,'#8a5a32');ellT(g,x,y,4,3,'#d4a868');P_(g,x,y,'#a8743e',1,1)}return c},
 mushrooms(){const c=hdCanvas(32,32,2),g=c.getContext('2d');for(const[x,y,s]of[[10,22,6],[21,24,5],[16,16,4]]){P_(g,x-1,y,OUTL,4,7);P_(g,x,y,'#f0e6d0',2,6);ellT(g,x+1,y,s+1,s*.7+1,OUTL);ellT(g,x+1,y,s,s*.7,(a,b,u,v)=>v<-.3?'#ff8a7a':'#d8443a');P_(g,x-1,y-2,'#fff',2,2)}return c},
 cairn(){const c=hdCanvas(32,40,2),g=c.getContext('2d');for(const[x,y,rx,ry]of[[16,32,11,6],[16,23,8,5],[16,15,6,4],[16,9,4,3]]){ellT(g,x,y,rx+1,ry+1,OUTL);ellT(g,x,y,rx,ry,(a,b,u,v)=>v<-.3?'#c8c4cc':'#8e8a96')}return c},
 pots(){const c=hdCanvas(32,36,2),g=c.getContext('2d');for(const[x,y,s]of[[10,26,7],[22,28,5]]){ellT(g,x,y,s+1,s+2,OUTL);ellT(g,x,y,s,s+1,(a,b,u,v)=>u>.4?'#9a4a2a':v<-.3?'#e89a6a':'#c8683a');P_(g,x-3,y-s-3,OUTL,7,3);P_(g,x-2,y-s-3,'#b8582a',5,2);P_(g,x-s+1,y-1,'#f5e6c8',s*2-2,1)}return c},
 cactuspot(){const c=hdCanvas(32,44,2),g=c.getContext('2d');P_(g,9,30,OUTL,14,12);P_(g,10,31,'#c8683a',12,10);P_(g,10,31,'#e89a6a',12,2);P_(g,13,10,OUTL,6,21);P_(g,14,11,'#3f9a4a',4,20);P_(g,14,11,'#6ac86a',1,20);P_(g,8,16,OUTL,6,4);P_(g,9,17,'#3f9a4a',5,2);P_(g,8,12,OUTL,3,6);P_(g,9,13,'#3f9a4a',1,5);P_(g,15,8,'#e86ab8',2,2);return c},
 urn(){const c=hdCanvas(32,40,2),g=c.getContext('2d');ellT(g,16,26,9,10,OUTL);ellT(g,16,26,8,9,(a,b,u,v)=>u>.4?'#8a8478':v<-.3?'#e0dace':'#b8b2a4');P_(g,11,13,OUTL,10,4);P_(g,12,14,'#c8c2b4',8,2);P_(g,9,27,'#8a8478',14,1);return c},
 rubble(){const c=hdCanvas(32,32,2),g=c.getContext('2d');P_(g,6,14,OUTL,12,18);P_(g,7,15,'#d0cabc',10,16);P_(g,7,15,'#ece6d8',3,16);P_(g,8,13,OUTL,8,3);ellT(g,24,26,5,4,OUTL);ellT(g,24,26,4,3,'#b8b2a4');return c},
 tub(){const c=hdCanvas(32,32,2),g=c.getContext('2d');ellT(g,16,22,13,9,OUTL);ellT(g,16,22,12,8,'#8a5a32');ellT(g,16,19,10,5,'#7ac8e0');ellT(g,13,18,3,1.5,'#d8f4ff');P_(g,4,22,'#6e4426',24,2);return c},
 towels(){const c=hdCanvas(32,44,2),g=c.getContext('2d');P_(g,5,8,OUTL,3,34);P_(g,24,8,OUTL,3,34);P_(g,4,8,OUTL,24,3);P_(g,8,10,OUTL,8,16);P_(g,9,11,'#e86ab8',6,14);P_(g,17,10,OUTL,7,14);P_(g,18,11,'#7ac8e0',5,12);P_(g,9,15,'#fff',6,1);return c},
};
const CZ_PROP_SETS={plains:['hay','barrel','planter','mailbox','bench','crate'],coast:['barrel','crate','anchor','buoys','bench','planter'],forest:['logs','mushrooms','crate','bench','planter','barrel'],
 mountain:['logs','cairn','barrel','crate','bench','logs'],desert:['pots','cactuspot','crate','pots','bench','hay'],ruins:['urn','rubble','crate','urn','bench','planter'],springs:['tub','towels','planter','bench','barrel','planter']};
const CZ_PROPS={list:[],at:new Set(),img:{}};
function czPlaceProps(){CZ_PROPS.list=[];CZ_PROPS.at=new Set();const rr=mulberry32(WORLD_SEED+303);
 const busy=new Set();for(const n of npcs)for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)busy.add(idx(n.home.x+a,n.home.y+b));for(const it of items)busy.add(idx(it.x,it.y));
 const blockedNear=(x,y)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){if(!a&&!b)continue;const j=idx(x+a,y+b),m=map[j];if(SOLID.has(m)&&m!==T.TREE&&m!==T.PINE||CZ_PROPS.at.has(j)||m===T.PATH||m===T.DOOR||m===T.FOUNTAIN||m===T.SIGN)return true;if(SOLID.has(m))return true}return false};
 POIS.forEach((p,k)=>{if(p.id==='champ')return;const set=CZ_PROP_SETS[p.biome]||CZ_PROP_SETS.plains,cand=[];
  for(let dy=-5;dy<=6;dy++)for(let dx=-8;dx<=8;dx++){const x=p.x+dx,y=p.y+dy;if(!inb(x,y))continue;const i=idx(x,y);if(town[i]!==k+1||map[i]!==T.FLOOR||busy.has(i))continue;
   // keep the doorways and the row in front of the buildings clear
   if(dy>=-1&&dy<=0&&Math.abs(dx)>=3)continue;cand.push([x,y])}
  for(let i=cand.length-1;i>0;i--){const j=(rr()*(i+1))|0;[cand[i],cand[j]]=[cand[j],cand[i]]}
  let n=0;for(const[x,y]of cand){if(n>=7)break;if(blockedNear(x,y))continue;const i=idx(x,y);CZ_PROPS.at.add(i);CZ_PROPS.list.push({x,y,k:set[n%set.length]});n++}});
 // safety: every NPC and item must still be reachable
 const R=flood(POIS[0].x,POIS[0].y+3),bad=[...npcs,...items].filter(o=>!R[idx(o.x,o.y)]&&![[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>R[idx(o.x+a,o.y+b)])&&town[idx(o.x,o.y)]!==SANCT_ID);
 CZ_PROPS.bad=bad.length}
walkable=(orig=>function(x,y,self){if(CZ_PROPS.at.size&&inb(x,y)&&CZ_PROPS.at.has(idx(x,y)))return false;return orig(x,y,self)})(walkable);
CZ_HOOKS.ents.push((x0,y0,vw,vh,ents)=>{for(const p of CZ_PROPS.list){if(p.x<x0-2||p.y<y0-2||p.x>x0+vw+2||p.y>y0+vh+3)continue;const im=CZ_PROPS.img[p.k]||(CZ_PROPS.img[p.k]=CZ_PROP_ART[p.k]());
 ents.push({y:p.y*16,d:()=>{const sx=p.x*16-camX,sy=p.y*16-camY;ctx.fillStyle='rgba(12,10,24,.28)';ell(sx+8,sy+14,7,2.5);blit(im,sx+(16-spW(im))/2,sy+16-spH(im))}})}});
genWorld=(orig=>function(){orig();try{czPlaceProps()}catch(e){console.warn('props',e)}})(genWorld);
// cobblestone plaza around each town fountain + flower beds along the building fronts
const CZ_PLAZA={img:null,tiles:[],beds:[]};
function czCobble(){const c=hdCanvas(32,32,2),g=c.getContext('2d'),r=mulberry32(77);P_(g,0,0,'#8e8478',32,32);
 for(let y=0;y<32;y+=6)for(let x=-(y/6%2)*4;x<32;x+=8){const w=6+((r()*2)|0);P_(g,x+1,y+1,'#6e665c',w,5);P_(g,x+1,y+1,r()<.5?'#b4aa9a':'#a89e8e',w-1,4);P_(g,x+1,y+1,'#cfc6b6',w-2,1)}return c}
function czPlazaSetup(){CZ_PLAZA.tiles=[];CZ_PLAZA.beds=[];POIS.forEach((p,k)=>{if(p.id==='champ')return;const fx=p.x,fy=p.y+2;
 for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++){const x=fx+a,y=fy+b;if(!inb(x,y)||town[idx(x,y)]!==k+1)continue;const d=Math.hypot(a,b);if(d<=3.6)CZ_PLAZA.tiles.push({x,y,d})}
 for(const x0 of[-8,4])for(let dx=0;dx<5;dx++){if(dx===2)continue;const x=p.x+x0+dx,y=p.y;if(inb(x,y)&&map[idx(x,y)]===T.FLOOR&&!CZ_PROPS.at.has(idx(x,y)))CZ_PLAZA.beds.push({x,y,v:hash(x,y)%4})}})}
CZ_HOOKS.ground.push((x0,y0,vw,vh)=>{const im=CZ_PLAZA.img||(CZ_PLAZA.img=czCobble());
 for(const t of CZ_PLAZA.tiles){if(t.x<x0-1||t.y<y0-1||t.x>x0+vw+1||t.y>y0+vh+1)continue;const sx=t.x*16-camX,sy=t.y*16-camY,m=map[idx(t.x,t.y)];
  ctx.save();ctx.beginPath();ctx.rect(sx,sy,16,16);ctx.clip();
  // round the plaza's outline: only draw the part of the tile inside the circle
  const f=POIS.find(p=>Math.abs(p.x-t.x)<=3&&Math.abs(p.y+2-t.y)<=3);ctx.beginPath();ctx.arc(f.x*16-camX+8,(f.y+2)*16-camY+8,2.9*16-2,0,6.283);ctx.clip();
  blit(im,sx,sy);ctx.restore();if(m===T.FOUNTAIN)blit(tileImg(T.FOUNTAIN,t.x,t.y),sx,sy)}
 for(const f of POIS){if(f.id==='champ')continue;const cx=f.x*16-camX+8,cy=(f.y+2)*16-camY+8;if(cx<-60||cy<-60||cx>CW+60||cy>CH+60)continue;ctx.strokeStyle='rgba(60,52,44,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,2.9*16-2.5,0,6.283);ctx.stroke()}
 for(const b of CZ_PLAZA.beds){if(b.x<x0-1||b.y<y0-1||b.x>x0+vw+1||b.y>y0+vh+1)continue;const sx=b.x*16-camX,sy=b.y*16-camY;
  ctx.fillStyle='#5a3a22';ctx.fillRect(sx,sy,16,5);ctx.fillStyle='#6e4a2c';ctx.fillRect(sx,sy,16,1);ctx.fillStyle='#3f7a2a';for(let i=0;i<4;i++)ctx.fillRect(sx+1+i*4,sy-1,3,3);
  const cols=[['#e8443a','#f5c542'],['#e86ab8','#f5f0e0'],['#f5c542','#7ab8f0'],['#f5f0e0','#e8443a']][b.v];for(let i=0;i<4;i++){ctx.fillStyle=cols[i%2];ctx.fillRect(sx+2+i*4,sy-1,2,2)}}});
genWorld=(orig=>function(){orig();try{czPlazaSetup()}catch(e){console.warn('plaza',e)}})(genWorld);

// ---------------------------------------------------------------------------
//  BATTLE BACKDROPS: a painted, layered scene per region (far shapes, a detailed
//  middle layer, textured ground). Static layers are rendered once per region
//  into a cache; clouds, waves, steam, embers and light motes move on top.
// ---------------------------------------------------------------------------
const CZ_BG={cache:{}};
function czBgRidge(g,W,col,base,amp,ph,sharp){g.fillStyle=col;g.beginPath();g.moveTo(0,base+40);for(let x=0;x<=W;x+=2){const v=sharp?Math.abs(((x*.9+ph*13)%46)-23)/23:(Math.sin(x*.021+ph)*.55+Math.sin(x*.053+ph*2.3)*.3+Math.sin(x*.11+ph)*.15)*.5+.5;g.lineTo(x,Math.round(base-v*amp))}g.lineTo(W,base+40);g.fill()}
function czBgTree(g,x,y,s,cols,trunk){g.fillStyle=trunk;g.fillRect(x-1,y-s*.6,3,s*.6+1);for(const[dx,dy,r,c]of[[0,-s*.9,s*.55,0],[-s*.35,-s*.65,s*.42,1],[s*.35,-s*.62,s*.4,1],[0,-s*1.15,s*.4,2]]){g.fillStyle=cols[c];g.beginPath();g.arc(x+dx,y+dy,r,0,6.283);g.fill()}
 g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.arc(x-s*.15,y-s*1.2,s*.18,0,6.283);g.fill()}
function czBgPine(g,x,y,s,col,dark,snow){g.fillStyle='#4a3020';g.fillRect(x-1,y-3,2,4);for(let i=0;i<4;i++){const w=s*(.55-i*.11),yy=y-3-i*s*.28;g.fillStyle=i%2?col:dark;g.beginPath();g.moveTo(x-w,yy);g.lineTo(x,yy-s*.42);g.lineTo(x+w,yy);g.fill();if(snow&&i===3){g.fillStyle='#f4f8ff';g.fillRect(x-1,yy-s*.42,2,2)}}}
function czBattleBg(bio,sky){const key=bio+CW+'x'+CH+sky.join();if(CZ_BG.cache[key])return CZ_BG.cache[key];
 const W=CW,H=CH,c=document.createElement('canvas');c.width=W*RS;c.height=H*RS;const g=c.getContext('2d');g.scale(RS,RS);const r=mulberry32(bio.length*977+3),H0=100;
 const far=mix(sky[1],sky[0],.25),haze=mix(sky[1],sky[2],.35),mid=mix(sky[1],sky[2],.6),gnd=sky[2];
 // ---- far + middle layers
 if(bio==='plains'){czBgRidge(g,W,mix(far,'#7a9ab8',.3),86,16,1);czBgRidge(g,W,haze,94,12,4);
  for(let x=8;x<W;x+=26+((r()*20)|0)){const s=7+r()*5;czBgTree(g,x,H0-1,s,[mix(gnd,'#2a4a20',.35),mix(gnd,'#1e3a18',.5),mix(gnd,'#8ab060',.3)],'#4a3020')}
  g.fillStyle='#6a4a2c';for(let x=0;x<W;x+=12){g.fillRect(x,H0-6,1,6)}g.fillRect(0,H0-5,W,1)}
 else if(bio==='forest'){czBgRidge(g,W,mix(far,'#3a5a4a',.35),80,10,2);for(let x=-4;x<W+8;x+=7)czBgPine(g,x,H0-4+((r()*4)|0),16+r()*8,mix(haze,'#2a4a38',.45),mix(haze,'#1a3a28',.6));
  for(let x=-10;x<W+20;x+=18+((r()*12)|0)){const s=10+r()*6;czBgTree(g,x,H0+1,s,['#2f5a26','#244a1e','#4a7a34'],'#3a2416')}
  g.fillStyle='rgba(255,250,210,.10)';for(let i=0;i<4;i++){const x=40+i*80;g.beginPath();g.moveTo(x,0);g.lineTo(x+18,0);g.lineTo(x+48,H0);g.lineTo(x+24,H0);g.fill()}}
 else if(bio==='coast'){g.fillStyle=mix(sky[1],'#3a7ac0',.55);g.fillRect(0,78,W,24);g.fillStyle=mix(sky[1],'#2a5a9a',.6);g.fillRect(0,90,W,12);
  g.fillStyle=mix(far,'#5a7a6a',.5);g.beginPath();g.ellipse(W*.78,79,30,6,0,Math.PI,0);g.fill();g.fillStyle='#f4f0e8';g.fillRect(W*.78+12,62,3,12);g.fillStyle='#e8443a';g.fillRect(W*.78+12,62,3,3);g.fillRect(W*.78+12,68,3,2);g.fillStyle='#fff6c0';g.fillRect(W*.78+11,60,5,2);
  g.fillStyle='#f4f0e0';g.beginPath();g.moveTo(60,70);g.lineTo(60,82);g.lineTo(70,82);g.fill();g.fillStyle='#6a4a2c';g.fillRect(52,82,22,3)}
 else if(bio==='desert'){g.fillStyle=mix(far,'#c87a4a',.45);for(const[x,w,h]of[[30,50,26],[110,34,18],[200,70,30],[290,40,22]]){g.fillRect(x,H0-h,w,h);g.fillStyle=mix(far,'#9a5a3a',.5);g.fillRect(x+w-6,H0-h,6,h);g.fillStyle=mix(far,'#e0a070',.4);g.fillRect(x,H0-h,w,2);g.fillStyle=mix(far,'#c87a4a',.45)}
  czBgRidge(g,W,mix(haze,'#e0b878',.5),98,8,2);for(const x of[70,170,250]){g.fillStyle='#4a7a3a';g.fillRect(x,H0-16,4,16);g.fillRect(x-5,H0-11,5,3);g.fillRect(x-5,H0-15,2,5);g.fillRect(x+4,H0-9,4,3);g.fillRect(x+6,H0-13,2,5)}}
 else if(bio==='mountain'){const pk=(x,b,w,h,c1,c2)=>{g.fillStyle=c1;g.beginPath();g.moveTo(x-w,b);g.lineTo(x,b-h);g.lineTo(x+w,b);g.fill();g.fillStyle=c2;g.beginPath();g.moveTo(x,b-h);g.lineTo(x+w,b);g.lineTo(x+w*.15,b);g.fill();
   g.fillStyle='#f4f8ff';g.beginPath();g.moveTo(x,b-h);g.lineTo(x-w*.28,b-h*.7);g.lineTo(x-w*.1,b-h*.74);g.lineTo(x+w*.05,b-h*.66);g.lineTo(x+w*.28,b-h*.72);g.fill()};
  for(const[x,w,h]of[[40,50,52],[130,60,64],[230,55,50],[310,45,44]])pk(x,96,w,h,mix(far,'#8a90a8',.4),mix(far,'#5a6078',.5));
  for(let x=-4;x<W+8;x+=9)czBgPine(g,x,H0+1,12+r()*8,'#3a6a48','#2a5038',true)}
 else if(bio==='ruins'){czBgRidge(g,W,mix(far,'#8a80a8',.35),88,12,3);czBgRidge(g,W,haze,96,8,1);const st='#d8d0c0',sd='#a8a090';
  for(const[x,h,broken]of[[24,40,0],[48,34,1],[72,40,0],[200,30,1],[224,40,0],[248,40,0],[272,22,1]]){g.fillStyle=sd;g.fillRect(x,H0-h,8,h);g.fillStyle=st;g.fillRect(x,H0-h,5,h);if(!broken){g.fillStyle=st;g.fillRect(x-2,H0-h-3,12,3)}else{g.fillStyle=sd;g.fillRect(x+1,H0-h-2,4,2)}}
  g.fillStyle=st;g.fillRect(222,H0-46,36,4);g.fillStyle=sd;g.fillRect(222,H0-42,36,1)}
 else if(bio==='springs'){czBgRidge(g,W,mix(far,'#6a9a8a',.35),84,14,5);czBgRidge(g,W,haze,94,10,2);
  for(const[x,w]of[[60,40],[200,56]]){g.fillStyle='#6a6458';g.beginPath();g.ellipse(x,H0-2,w/2+3,6,0,0,6.283);g.fill();g.fillStyle='#7ad0e0';g.beginPath();g.ellipse(x,H0-3,w/2,4,0,0,6.283);g.fill();g.fillStyle='#c8f0f8';g.fillRect(x-w/4,H0-5,w/3,1)}
  for(let x=10;x<W;x+=40+((r()*20)|0))czBgTree(g,x,H0-6,7+r()*3,['#3f7a4a','#2f6a3a','#6aa060'],'#4a3020')}
 else if(bio==='volcano'){g.fillStyle='#2a1414';g.beginPath();g.moveTo(W*.5-110,H0);g.lineTo(W*.5-18,H0-62);g.lineTo(W*.5+18,H0-62);g.lineTo(W*.5+110,H0);g.fill();
  g.fillStyle='#3a1c18';g.beginPath();g.moveTo(W*.5+18,H0-62);g.lineTo(W*.5+110,H0);g.lineTo(W*.5+30,H0);g.fill();const cg=g.createRadialGradient(W*.5,H0-62,2,W*.5,H0-62,26);cg.addColorStop(0,'rgba(255,150,60,.9)');cg.addColorStop(1,'rgba(255,90,30,0)');g.fillStyle=cg;g.fillRect(W*.5-30,H0-88,60,40);
  g.fillStyle='#ffb040';g.beginPath();g.ellipse(W*.5,H0-62,16,2.5,0,0,6.283);g.fill();
  for(const[sx,dir]of[[-10,-1],[6,1]]){let x=W*.5+sx,y=H0-60;g.fillStyle='#ff6a2a';while(y<H0-4){g.fillRect(Math.round(x),y,2,2);y+=2;x+=dir*(.9+Math.sin(y/5)*.8)}}czBgRidge(g,W,'#241010',H0+1,8,2,true)}
 else{czBgRidge(g,W,far,92,14,1);czBgRidge(g,W,haze,98,8,3)}
 // ---- ground with texture
 const gr=g.createLinearGradient(0,H0,0,H);gr.addColorStop(0,shade(gnd,.06));gr.addColorStop(1,shade(gnd,-.18));g.fillStyle=gr;g.fillRect(0,H0,W,H-H0);g.fillStyle=shade(gnd,.18);g.fillRect(0,H0,W,1);
 const dk=shade(gnd,-.16),lt=shade(gnd,.14);
 for(let i=0;i<220;i++){const x=(r()*W)|0,y=H0+3+((r()*(H-H0-4))|0),k=r();
  if(bio==='coast'||bio==='desert'){g.fillStyle=k<.5?dk:lt;g.fillRect(x,y,3+((r()*4)|0),1)}
  else if(bio==='volcano'){g.fillStyle=k<.08?'#ff6a2a':k<.6?'#2a2020':'#5a4a44';g.fillRect(x,y,k<.08?3:2,1)}
  else{g.fillStyle=k<.45?dk:lt;g.fillRect(x,y,1,2);g.fillRect(x+2,y-1,1,3);if(k>.93){g.fillStyle=['#f5c542','#f5f0e0','#e86ab8','#e8443a'][(r()*4)|0];g.fillRect(x+1,y-2,2,2)}}}
 if(bio==='coast'){g.fillStyle='rgba(255,255,255,.75)';g.fillRect(0,H0,W,1);for(let i=0;i<10;i++){g.fillStyle='#f4e8e0';g.fillRect((r()*W)|0,H0+10+((r()*80)|0),2,1)}}
 return CZ_BG.cache[key]=c}
function czBattleAnim(bio,sky){const H0=100;
 // clouds: soft pixel puffs drifting
 const cl=bio==='volcano'?'rgba(70,40,40,.55)':'rgba(255,255,255,.82)',sh=bio==='volcano'?'rgba(40,20,20,.4)':'rgba(200,210,230,.55)';
 for(let i=0;i<4;i++){const w=30+i*10,x=((i*97+frame*(.05+i*.015))%(CW+w*2))-w,y=12+((i*23)%36);ctx.fillStyle=sh;ell(x+2,y+3,w*.48,5);ctx.fillStyle=cl;ell(x,y,w*.48,5);ell(x-w*.22,y-2,w*.26,5);ell(x+w*.18,y-4,w*.25,6)}
 if(bio==='coast'){for(let i=0;i<16;i++){const x=(i*41+frame*.25)%CW,y=82+(i%4)*5;ctx.fillStyle='rgba(220,240,255,.8)';ctx.fillRect(x,y,6+(i%3)*2,1)}
  const f=Math.sin(frame/30)*1.5;ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(0,H0+1+f,CW,1)}
 if(bio==='springs'){ctx.fillStyle='rgba(255,255,255,.32)';for(let i=0;i<8;i++){const x=(i<4?50:185)+(i%4)*10,y=H0-8-((frame*.25+i*11)%26);ell(x+Math.sin((frame+i*40)/30)*3,y,4+((frame/40+i)%3),3)}}
 if(bio==='volcano'){for(let i=0;i<14;i++){const t=(frame*.6+i*37)%140,x=CW*.5-14+((i*19)%28)+Math.sin((frame+i*30)/20)*6,y=H0-62-t*.5;ctx.fillStyle=`rgba(255,${120+(i%3)*40},40,${1-t/140})`;ctx.fillRect(x,y,2,2)}}
 if(bio==='forest'){for(let i=0;i<10;i++){const x=(i*37+Math.sin((frame+i*50)/60)*10)%CW,y=40+((i*29)%50)+Math.sin((frame+i*20)/40)*4;ctx.fillStyle=`rgba(255,250,200,${.4+.3*Math.sin((frame+i*13)/15)})`;ctx.fillRect(x,y,1,1)}}
 if(bio==='desert'){ctx.fillStyle='rgba(255,240,200,.08)';for(let y=H0-10;y<H0;y+=3)ctx.fillRect(0,y+Math.sin((frame+y*7)/12),CW,1)}}
drawBattleScenery=function(bio,sky){const c=czBattleBg(bio,sky);ctx.drawImage(c,0,0,CW,CH);czBattleAnim(bio,sky)};

// ---------------------------------------------------------------------------
//  TITLE SCENE: golden-hour meadow with Brady and a friendly T-rex, in the open
//  space beside the logo, instead of a camera drifting over the raw world map
// ---------------------------------------------------------------------------
const CZ_TITLE={sky:['#6a5a9a','#f8c088','#6a9a48'],flies:[]};
function czTitleSprites(){if(CZ_TITLE.brady!==undefined)return;
 try{const h=czHeroBuild({},{style:'shaggy',hair:'#5b3a1f',skin:'#f2c9a0',fr:true},3);CZ_TITLE.brady=h&&h.right?h.right[0]:null}catch(e){CZ_TITLE.brady=null}
 try{const d=COZY_DINO.rex,c=document.createElement('canvas');c.width=d.width;c.height=d.height;c.getContext('2d').putImageData(d,0,0);CZ_TITLE.dino=c}catch(e){CZ_TITLE.dino=null}
 const ta=$('#titleArt');if(ta)ta.style.visibility='hidden';
 const st=document.createElement('style');st.textContent='#title{background:linear-gradient(rgba(16,11,30,.04),rgba(16,11,30,.08) 55%,rgba(16,11,30,.45))}';document.head.appendChild(st)}
function czDrawTitle(){const sky=CZ_TITLE.sky,hz=CH*.6,g=ctx.createLinearGradient(0,0,0,hz);g.addColorStop(0,sky[0]);g.addColorStop(.7,sky[1]);g.addColorStop(1,'#ffe0b0');ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
 // low sun just above the hills
 const sx=CW*.66,sy=hz-34,sg=ctx.createRadialGradient(sx,sy,4,sx,sy,80);sg.addColorStop(0,'rgba(255,244,200,.95)');sg.addColorStop(.2,'rgba(255,222,150,.7)');sg.addColorStop(1,'rgba(255,180,120,0)');ctx.fillStyle=sg;ctx.fillRect(sx-90,sy-90,180,180);
 ctx.fillStyle='#fff4d0';ell(sx,sy,12,12);
 // the meadow backdrop, its horizon moved down to the title's horizon
 const bg=czBattleBg('plains',sky);ctx.save();ctx.translate(0,hz-100);ctx.drawImage(bg,0,0,CW,CH);ctx.restore();
 const gg=ctx.createLinearGradient(0,hz+CH-100,0,CH);gg.addColorStop(0,shade(sky[2],-.16));gg.addColorStop(1,shade(sky[2],-.3));ctx.fillStyle=gg;ctx.fillRect(0,hz+CH-100-1,CW,CH);
 czBattleAnim('plains',sky);
 ctx.fillStyle='rgba(255,170,90,.10)';ctx.fillRect(0,0,CW,CH);
 czTitleSprites();const gy=CH*.615;
 if(CZ_TITLE.dino){const d=CZ_TITLE.dino,h=CH*.24,w=d.width*h/d.height,x=CW*.5-w*.15,y=gy-h+3+Math.sin(frame/55);ctx.fillStyle='rgba(20,10,30,.3)';ell(x+w*.5,gy+1,w*.34,4);
  ctx.save();ctx.translate(x+w,y);ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(d,0,0,w,h);ctx.restore()}
 if(CZ_TITLE.brady){const b=CZ_TITLE.brady,h=CH*.17,w=b.width*h/b.height,x=CW*.5-w*1.15,y=gy-h+Math.round(Math.sin(frame/40)*.6);ctx.fillStyle='rgba(20,10,30,.3)';ell(x+w*.5,gy,w*.28,3);
  ctx.drawImage(b,x,y,w,h)}
 // fireflies starting to come out
 const F=CZ_TITLE.flies;if(F.length<22&&Math.random()<.2)F.push({x:Math.random()*CW,y:hz+Math.random()*(CH-hz),t:0,ph:Math.random()*6});
 ctx.save();ctx.globalCompositeOperation='lighter';for(const f of F){f.t++;f.x+=Math.sin((f.t+f.ph*40)/50)*.25;f.y-=.08;const a=Math.max(0,Math.sin(f.t/40))*(f.t<400?1:0);ctx.fillStyle=`rgba(255,230,120,${.18*a})`;ctx.fillRect(f.x-2,f.y-2,5,5);ctx.fillStyle=`rgba(255,250,200,${.9*a})`;ctx.fillRect(f.x,f.y,1,1)}ctx.restore();
 CZ_TITLE.flies=F.filter(f=>f.t<400)}
drawWorld=(orig=>function(){if(state==='title'&&COZY_IMG.heroart){czDrawTitle();return}return orig.apply(this,arguments)})(drawWorld);

// ---------------------------------------------------------------------------
//  AMBIENT LIFE + FEEL
// ---------------------------------------------------------------------------
const CZ_AMB={bf:[],birds:[],df:[],rip:[],rustle:[],rain:[],bt:99};
const czTallAt=(x,y)=>{if(!inb(x,y))return false;const t=map[idx(x,y)];return t===T.TALL||t===T.BRUSH||t===T.JUNGLE};
// tall grass: blades in front of Brady's feet while he stands in it, and a rustle of leaves when he steps in
CZ_HOOKS.ents.push((x0,y0,vw,vh,ents)=>{if(state==='title')return;const tx=Math.round(player.px/16),ty=Math.round(player.py/16);if(!czTallAt(tx,ty))return;
 ents.push({y:player.py+.3,d:()=>{const sx=Math.round(player.px-camX),sy=Math.round(player.py-camY),t=map[idx(tx,ty)],cols=t===T.BRUSH?['#7a6a2a','#a8923a','#d0b858']:['#2c5222','#3f7030','#6c9c48'];
  const sway=player.moving?Math.round(Math.sin(frame/3)):0;for(let i=0;i<6;i++){const x=sx+1+i*2.6,h=4+((i*7+tx)%3);ctx.fillStyle=cols[i%2];ctx.fillRect(Math.round(x+(i%2?sway:0)),sy+16-h,1,h);ctx.fillStyle=cols[2];ctx.fillRect(Math.round(x+(i%2?sway:0)),sy+16-h,1,1)}}})});
onStep=(orig=>function(){orig.apply(this,arguments);if(state!=='world'||!czTallAt(player.x,player.y))return;const t=map[idx(player.x,player.y)],col=t===T.BRUSH?'#b8a048':'#5a9a40';
 for(let i=0;i<5;i++)CZ_AMB.rustle.push({x:player.x*16+4+Math.random()*8,y:player.y*16+10,vx:(Math.random()-.5)*.9,vy:-.8-Math.random()*.7,t:0,col})})(onStep);
CZ_HOOKS.air.push(()=>{const R=CZ_AMB.rustle;for(const p of R){p.t++;p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.vx*=.96;ctx.globalAlpha=Math.max(0,1-p.t/34);ctx.fillStyle=p.col;ctx.fillRect(Math.round(p.x-camX),Math.round(p.y-camY),2,1)}ctx.globalAlpha=1;CZ_AMB.rustle=R.filter(p=>p.t<34)});

// weather: some in-game days bring a passing shower (snow up in the mountains, never in the desert)
function czWeather(){if(state==='title'||!S||!S.st)return 0;const d=czDay(),h=hash(d*7,WORLD_SEED&1023)%100;if(h>=35)return 0;
 const p=czDayPhase(),start=.08+(h%7)*.05,len=.07;const k=(p-start)/len;if(k<0||k>1)return 0;return Math.min(1,Math.sin(k*Math.PI)*1.6)}
function czWeatherKind(){const b=POIS[region[idx(player.x,player.y)]].biome;return b==='desert'||b==='volcano'?null:b==='mountain'?'snow':'rain'}

// butterflies by day near grass and flowers; birds that take off as you approach; dragonflies by water; fish ripples
function czAmbTick(x0,y0,vw,vh){if(state==='title')return;const L=lightLevel(),day=L.dark<.3,wet=czWeather()>.2,A=CZ_AMB;const rnd=(a,b)=>a+Math.random()*(b-a);
 const tileAt=(x,y)=>inb(x,y)?map[idx(x,y)]:-1,pick=(test)=>{for(let k=0;k<12;k++){const x=x0+((Math.random()*vw)|0),y=y0+((Math.random()*vh)|0);if(test(tileAt(x,y),x,y))return[x,y]}return null};
 if(day&&!wet&&A.bf.length<4&&Math.random()<.02){const p=pick(t=>t===T.FLOWER||t===T.GRASS||t===T.TALL);if(p)A.bf.push({x:p[0]*16+8,y:p[1]*16+4,vx:0,vy:0,t:0,c:['#f5f0e0','#f5c542','#f09040','#7ab8f0','#e86ab8'][(Math.random()*5)|0]})}
 if(day&&!wet&&A.birds.length<3&&Math.random()<.01){const p=pick((t,x,y)=>(t===T.GRASS||t===T.PATH||t===T.SAND)&&Math.hypot(x-player.x,y-player.y)>5);if(p)A.birds.push({x:p[0]*16+8,y:p[1]*16+12,fly:0,t:0,dir:Math.random()<.5?-1:1,c:['#6a4a30','#5a5a68','#8a5a3a'][(Math.random()*3)|0]})}
 if(A.df.length<3&&Math.random()<.015){const p=pick((t,x,y)=>t!==T.WATER&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tileAt(x+a,y+b)===T.WATER));if(p)A.df.push({x:p[0]*16+8,y:p[1]*16+6,vx:0,vy:0,t:0,ph:Math.random()*6,c:Math.random()<.5?'#3aa0c8':'#3ab878'})}
 if(A.rip.length<5&&Math.random()<.04){const p=pick((t,x,y)=>t===T.WATER&&tileAt(x,y-1)===T.WATER&&tileAt(x,y+1)===T.WATER);if(p)A.rip.push({x:p[0]*16+rnd(3,13),y:p[1]*16+rnd(4,12),t:0,jump:Math.random()<.15})}
 const inView=o=>Math.abs(o.x-player.px)<CW*.75&&Math.abs(o.y-player.py)<CH*.75;
 for(const b of A.bf){b.t++;b.vx+=(Math.random()-.5)*.25;b.vy+=(Math.random()-.5)*.25-.004;b.vx*=.92;b.vy*=.92;b.x+=b.vx;b.y+=b.vy+Math.sin(b.t/6)*.25;if(!day||wet)b.gone=1}
 for(const b of A.birds){b.t++;if(!b.fly&&Math.hypot(b.x-player.px-8,b.y-player.py-8)<40){b.fly=1;b.dir=b.x<player.px+8?-1:1}if(b.fly){b.fly++;b.x+=b.dir*(1.2+b.fly*.03);b.y-=1.1+b.fly*.02}if(b.fly>160)b.gone=1}
 for(const f of A.df){f.t++;const mx=(f.t%80<10)?1.8:.5;f.vx+=(Math.random()-.5)*.5;f.vy+=(Math.random()-.5)*.5;const sp=Math.hypot(f.vx,f.vy);if(sp>mx){f.vx*=mx/sp;f.vy*=mx/sp}f.x+=f.vx;f.y+=f.vy;if(f.t>1400)f.gone=1}
 for(const r of A.rip)r.t++;
 A.bf=A.bf.filter(b=>!b.gone&&inView(b));A.birds=A.birds.filter(b=>!b.gone&&inView(b));A.df=A.df.filter(f=>!f.gone&&inView(f));A.rip=A.rip.filter(r=>r.t<70&&inView(r))}
CZ_HOOKS.ground.push((x0,y0,vw,vh)=>{for(const r of CZ_AMB.rip){const sx=r.x-camX,sy=r.y-camY,k=r.t/70;
  if(r.jump&&r.t<26){const a=r.t/26;ctx.fillStyle='#c8d8e8';ctx.fillRect(Math.round(sx-4+a*8),Math.round(sy-Math.sin(a*Math.PI)*7),2,1);continue}
  ctx.strokeStyle=`rgba(220,240,255,${.7*(1-k)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(sx,sy,2+k*7,1+k*3,0,0,6.283);ctx.stroke()}});
CZ_HOOKS.ents.push((x0,y0,vw,vh,ents)=>{for(const b of CZ_AMB.birds)ents.push({y:b.fly?1e9:b.y-4,d:()=>{const sx=Math.round(b.x-camX),sy=Math.round(b.y-camY),fl=b.fly&&((b.t>>2)&1);
  if(!b.fly){ctx.fillStyle='rgba(12,10,24,.25)';ctx.fillRect(sx-2,sy+1,4,1);ctx.fillStyle=b.c;ctx.fillRect(sx-2,sy-2,4,2);ctx.fillRect(sx+(b.dir>0?1:-2),sy-3,2,1);ctx.fillStyle='#f0b040';ctx.fillRect(sx+(b.dir>0?3:-3),sy-3,1,1);if((b.t>>5)%5===0){ctx.fillStyle=b.c;ctx.fillRect(sx+(b.dir>0?1:-2),sy-1,2,1)}}
  else{ctx.fillStyle=b.c;ctx.fillRect(sx-1,sy,3,1);if(fl){ctx.fillRect(sx-3,sy-1,2,1);ctx.fillRect(sx+2,sy-1,2,1)}else{ctx.fillRect(sx-3,sy+1,2,1);ctx.fillRect(sx+2,sy+1,2,1)}}}})});
CZ_HOOKS.air.push((x0,y0,vw,vh)=>{czAmbTick(x0,y0,vw,vh);
 for(const b of CZ_AMB.bf){const sx=Math.round(b.x-camX),sy=Math.round(b.y-camY),o=(b.t>>2)&1;ctx.fillStyle=b.c;if(o){ctx.fillRect(sx-2,sy-1,2,2);ctx.fillRect(sx+1,sy-1,2,2)}else{ctx.fillRect(sx-1,sy-1,1,2);ctx.fillRect(sx+1,sy-1,1,2)}ctx.fillStyle='#2a1a12';ctx.fillRect(sx,sy-1,1,2)}
 for(const f of CZ_AMB.df)czDrawFly(f,f.c,'rgba(220,240,255,.8)',null)});
// rain / snow overlay, after lighting so it sits on top
CZ_HOOKS.over.push(()=>{if(state==='title')return;const w=czWeather(),kind=czWeatherKind();if(!w||!kind)return;
 ctx.fillStyle=`rgba(40,50,80,${.16*w})`;ctx.fillRect(0,0,CW,CH);const n=Math.round((kind==='snow'?70:110)*w);
 for(let i=0;i<n;i++){const s=hash(i*13,i*7);if(kind==='rain'){const x=((s%977)+frame*1.6+(i*31))%(CW+40)-20,y=((s>>4)%611+frame*5.2)%(CH+20)-10;ctx.fillStyle='rgba(200,215,240,.55)';ctx.fillRect(Math.round(x),Math.round(y),1,4);ctx.fillRect(Math.round(x-1),Math.round(y+3),1,2)}
  else{const x=((s%977)+Math.sin((frame+i*40)/40)*6+frame*.3)%(CW+10)-5,y=((s>>4)%611+frame*.7+(i%5))%(CH+10)-5;ctx.fillStyle='rgba(250,252,255,.9)';ctx.fillRect(Math.round(x),Math.round(y),(i%3)?1:2,(i%3)?1:2)}}
 if(kind==='rain')for(let i=0;i<14*w;i++){const s=hash(i*29,(frame>>3)+i),x=s%CW,y=(s>>8)%CH,k=(frame%8)/8;ctx.strokeStyle=`rgba(220,230,255,${.5*(1-k)})`;ctx.beginPath();ctx.ellipse(x,y,1+k*3,.5+k,0,0,6.283);ctx.stroke()}});

// battle entrance: bars sweep in and part, with a quick flash
startBattle=(orig=>function(){const r=orig.apply(this,arguments);CZ_AMB.bt=0;return r})(startBattle);
drawBattle=(orig=>function(){orig.apply(this,arguments);const t=CZ_AMB.bt;if(t>=34)return;CZ_AMB.bt++;
 const k=t<10?1:Math.max(0,1-(t-10)/24),bars=8,bh=CH/bars;ctx.fillStyle='#120c22';for(let i=0;i<bars;i++){const w=CW*k*(i%2?1:.92);if(i%2)ctx.fillRect(0,i*bh,w,bh+1);else ctx.fillRect(CW-w,i*bh,w,bh+1)}
 if(t<6){ctx.fillStyle=`rgba(255,255,255,${.8-t*.13})`;ctx.fillRect(0,0,CW,CH)}})(drawBattle);
