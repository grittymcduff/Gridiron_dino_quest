// =====================================================================
//  COZY HARVEST STYLE  (local experiment, not part of the public game)
//  Loaded after game.js. Only changes how things are DRAWN:
//  map, saves, questions and game rules are untouched.
// =====================================================================
const COZY={
 outline:'#24160f',
 lightMode:(()=>{try{return localStorage.getItem('dinoCozyLight')||'auto'}catch(e){return'auto'}})(),
 cycle:60*60*10,         // full day/night cycle = 10 minutes (about 5 1/2 of daylight)
 cycleStart:.03,         // a new save starts in the early morning
 lights:null,lamps:[],chimneys:[],lanterns:[],parts:[],
 treeSpr:null,pineSpr:null,lampSpr:null,chimSpr:null,wallLantern:null,glowW:null,glowB:null,glowO:null,
 lm:null,
};

// ---------------------------------------------------------------------
//  HD upscaler for characters and dinos: Scale2x smoothing, thin warm
//  outline, soft top-left light. Keeps the same world size (hd doubles).
// ---------------------------------------------------------------------
function hdify(src,outline){
 const w=src.width,h=src.height,sc=src.hd||1;
 const sg=src.getContext('2d',{willReadFrequently:true}),sd=sg.getImageData(0,0,w,h),S32=new Uint32Array(sd.data.buffer);
 const W=w*2,H=h*2,c=document.createElement('canvas');c.width=W;c.height=H;c.hd=sc*2;
 const g=c.getContext('2d'),od=g.createImageData(W,H),O=new Uint32Array(od.data.buffer);
 const at=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:S32[y*w+x];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const P=at(x,y),A=at(x,y-1),B=at(x+1,y),C=at(x-1,y),D=at(x,y+1);
  let p1=P,p2=P,p3=P,p4=P;
  if(C===A&&C!==D&&A!==B)p1=A;if(A===B&&A!==C&&B!==D)p2=B;if(D===C&&D!==B&&C!==A)p3=C;if(B===D&&B!==A&&D!==C)p4=D;
  const o=(y*2)*W+x*2;O[o]=p1;O[o+1]=p2;O[o+W]=p3;O[o+W+1]=p4}
 const [or,og,ob]=hexToRgb(OUT),OUTK=((255<<24)|(ob<<16)|(og<<8)|or)>>>0;
 const [nr,ng,nb]=hexToRgb(outline||COZY.outline),NEWK=((255<<24)|(nb<<16)|(ng<<8)|nr)>>>0;
 const isOut=v=>v===OUTK,opq=v=>(v>>>24)>127;
 const T2=new Uint32Array(O);const AT=(x,y)=>(x<0||y<0||x>=W||y>=H)?0:T2[y*W+x];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,v=T2[i];if(!opq(v))continue;
  if(isOut(v)){ // thin the outline: keep only pixels touching the sprite body
   let touch=false;for(let dy=-1;dy<=1&&!touch;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const n=AT(x+dx,y+dy);if(opq(n)&&!isOut(n)){touch=true;break}}
   O[i]=touch?NEWK:0;continue}
  const up=AT(x,y-1),up2=AT(x,y-2),dn=AT(x,y+1),lf=AT(x-1,y);
  let f=0;if(!opq(up)||isOut(up))f=.16;else if(!opq(up2)||isOut(up2))f=.07;else if(!opq(lf)||isOut(lf))f=.05;
  if(!opq(dn)||isOut(dn))f=-.18;
  if(f){let r=v&255,gg=(v>>8)&255,b=(v>>16)&255;if(f>0){r+=(255-r)*f;gg+=(255-gg)*f;b+=(240-b)*f}else{r*=1+f;gg*=1+f;b*=1+f*.6}
   O[i]=((255<<24)|((b|0)<<16)|((gg|0)<<8)|(r|0))>>>0}}
 g.putImageData(od,0,0);return c}

// characters: every grid sprite becomes HD
renderGrid=(orig=>function(rows,pal,flip,hat){return hdify(orig(rows,pal,flip,hat))})(renderGrid);
// HUD face + character-creator face read a source rectangle, so double it
drawFace=function(){const c=$('#face'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(bradySpr.down[0],0,0,36,26,0,0,36,26)};
crRefresh=function(){if(!CR)return;const{h,spr}=crLook();CR.spr=spr;
 document.querySelectorAll('#creator [data-k]').forEach(b=>{const k=b.dataset.k,v=b.dataset.v;b.classList.toggle('on',k==='fr'?(v==='1')===h.fr:h[k]===v)});
 $('#crTag').textContent=h.name;
 [['crP1','down'],['crP2','right'],['crP3','up']].forEach(([id,d])=>{const g=$('#'+id).getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,42,42);g.drawImage(spr[d][0],0,0,42,42)});
 const f=$('#crFace').getContext('2d');f.imageSmoothingEnabled=false;f.clearRect(0,0,42,30);f.drawImage(spr.down[0],0,0,36,26,0,0,42,30);crAnim(true)};
// dinos: battle sprites get two passes (they're shown big), map sprites one
makeEnemy=(orig=>function(...a){const e=orig(...a);e.spr=e.spr._hi?czDinoBattle(e.spr._hi):hdify(hdify(e.spr));e.spr.bs=2;e.white=tint(e.spr,'#ffffff');return e})(makeEnemy);
dinoMini=(orig=>function(d){const m=orig(d);if(!m._hd){m.l=hdify(m.l);m.r=hdify(m.r);m._hd=1}return m})(dinoMini);
drawBossMap=(orig=>function(b){if(!b.spr){const r=makeDino(b.def.fam,b.def.pal,b.def.pattern,7);b.spr=r._hi||hdify(r)};return orig(b)})(drawBossMap);

// ---------------------------------------------------------------------
//  Optional hand-made sprite sheets (see art/cozy/README.md).
//  build.py fills COZY_ART with any PNGs found in art/cozy/sprites/.
// ---------------------------------------------------------------------
const COZY_FW=40,COZY_FH=48,COZY_DIRS=['down','up','left','right'];
const COZY_SHEETS={},COZY_IMG={};
function cozyLoadSheets(){const art=(typeof COZY_ART!=='undefined')?COZY_ART:{};
 return Promise.all(Object.entries(art).map(([k,src])=>new Promise(res=>{const im=new Image();im.onload=()=>{if(/^dino_/.test(k)){czDinoSheet(k.slice(5),im);return res()}if(/^boss_/.test(k)){czBossSheet(k.slice(5),im);return res()}if(/^(icon|held|map|helm|heroart)/.test(k)){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.hd=2;const g=c.getContext('2d');g.drawImage(im,0,0);COZY_IMG[k]=c;return res()}const out={};
  COZY_DIRS.forEach((d,r)=>{out[d]=[0,1,2].map(col=>{const c=document.createElement('canvas');c.width=COZY_FW;c.height=COZY_FH;c.hd=2;
   const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,col*COZY_FW,r*COZY_FH,COZY_FW,COZY_FH,0,0,COZY_FW,COZY_FH);return c})});
  COZY_SHEETS[k]=out;res()};im.onerror=()=>res();im.src=src})))}
makeBradySprites=(orig=>function(eq,hero){return COZY_SHEETS.hero||orig(eq,hero)})(makeBradySprites);
makeCharSprites=(orig=>function(look){const npcs_=Object.keys(COZY_SHEETS).filter(k=>/^npc/.test(k));
 if(npcs_.length){const k=npcs_[hash(look.s.length+parseInt(look.t.slice(1),16),parseInt(look.h.slice(1),16))%npcs_.length];return COZY_SHEETS[k]}
 return orig(look)})(makeCharSprites);
// Export a template sheet of the current hero (call cozyTemplate() in the console)
function cozyTemplate(){const spr=orig_makeBrady();const c=document.createElement('canvas');c.width=COZY_FW*3;c.height=COZY_FH*4;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 COZY_DIRS.forEach((d,r)=>spr[d].forEach((im,col)=>g.drawImage(im,col*COZY_FW+(COZY_FW-im.width)/2,r*COZY_FH+COZY_FH-im.height-2)));return c.toDataURL()}
const orig_makeBrady=()=>{const k=COZY_SHEETS.hero;delete COZY_SHEETS.hero;const s=makeBradySprites(newSave().equip,HERO_DEF);if(k)COZY_SHEETS.hero=k;return s};

// ---------------------------------------------------------------------
//  TILES
// ---------------------------------------------------------------------
const CZ={
 g0:'#4f8538',gA:'#477a33',gB:'#5b9241',gBlade:'#386428',gTip:'#6fa24a',gDeep:'#3c6a2c',
 dirt:'#8f6b43',dirtA:'#7e5c38',dirtB:'#a07a4e',dirtC:'#6e4f30',
 sand:'#cdb27a',sandA:'#bea06a',sandB:'#dcc48e',
 logA:'#7a4b2b',logB:'#93603a',logH:'#ad7a4c',logD:'#4b2c17',logK:'#3a2212',
 slate:'#44506e',slateD:'#323b55',slateH:'#5e6c90',
 shake:'#6e3f2a',shakeD:'#52301f',shakeH:'#8c5638',
 cob:'#8d8578',cobA:'#9b9384',cobB:'#7f776a',mortar:'#5a5248',
 water:'#2f5d84',waterA:'#2a5578',waterB:'#36688f',waterH:'#7fb0d2',foam:'#d6e8f0',
 glass:'#f5c85a',glassH:'#ffe9a6',glassD:'#c48a2a',frame:'#3a2414',
};
function czGrass(g,r,leafy){
 P_(g,0,0,CZ.g0,TP,TP);dots(g,r,[CZ.gA,CZ.gB,CZ.gA],90);
 for(let i=0;i<6;i++){const x=(r()*28)|0,y=(r()*28)|0;P_(g,x,y,CZ.gDeep,3,2);P_(g,x+1,y-1,CZ.gA,2,1)}
 for(let i=0;i<10;i++){const x=(r()*30)|0,y=(r()*26+4)|0;P_(g,x,y,CZ.gBlade);P_(g,x+1,y-1,CZ.gBlade);P_(g,x+1,y-2,CZ.gTip);P_(g,x+2,y,CZ.gBlade)}
 if(leafy)for(let i=0;i<2;i++){const x=(r()*28)|0,y=(r()*28)|0,c=['#c8662a','#d89a34','#a8442a'][(r()*3)|0];P_(g,x,y,c,2,1);P_(g,x+1,y+1,shade(c,-.25))}
}
// a clump of taller blades, so open grass doesn't read as flat
function czTuft(g,r){const n=1+((r()*2)|0);for(let k=0;k<n;k++){const cx=6+((r()*20)|0),cy=12+((r()*16)|0);
 for(let i=0;i<7;i++){const x=cx+i-3,h=3+((r()*4)|0)-Math.abs(i-3)/2|0;for(let j=0;j<h;j++)P_(g,x+(j>h/2&&i<3?-1:j>h/2&&i>3?1:0),cy-j,j===h-1?CZ.gTip:j<1?CZ.gDeep:CZ.gBlade)}}}
function czTiles(){
 const tc=tileCache;
 tc[T.GRASS]=[0,1,2,3,4,5].map(v=>mkT((g,r)=>{czGrass(g,r,v===3);if(v>=4)czTuft(g,r)}));
 tc[T.SAND]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,CZ.sand,TP,TP);dots(g,r,[CZ.sandA,CZ.sandB,'#c4a870'],70);
  for(let i=0;i<3;i++){const y=4+i*10+((r()*4)|0),x0=(r()*10)|0;for(let x=x0;x<x0+14;x++){const yy=y+Math.round(Math.sin(x/3));P_(g,x,yy,CZ.sandA);P_(g,x,yy-1,CZ.sandB)}}}));
 const pebbles=(g,r,n,lo,mid,hi)=>{for(let i=0;i<n;i++){const x=(r()*28)|0,y=(r()*28)|0,w=2+((r()*2)|0);P_(g,x,y+1,lo,w,2);P_(g,x,y,mid,w,2);P_(g,x,y,hi,1,1)}};
 tc[T.PATH]=[0,1,2].map(()=>mkT((g,r)=>{P_(g,0,0,CZ.dirt,TP,TP);dots(g,r,[CZ.dirtA,CZ.dirtB,CZ.dirtC],110);pebbles(g,r,4,'#5e4430','#9a8a74','#c8b8a0');
  for(let i=0;i<2;i++){const x=(r()*24)|0,y=(r()*28)|0;P_(g,x,y,CZ.dirtC,6,1);P_(g,x+1,y+1,CZ.dirtB,4,1)}}));
 tc[T.MFLOOR]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#7d7466',TP,TP);dots(g,r,['#6d6458','#8e8576','#746b5e'],100);pebbles(g,r,6,'#4a4238','#8a8070','#b0a898')}));
 tc[T.VFLOOR]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#3e2f2c',TP,TP);dots(g,r,['#4c3a36','#30231f','#46342f'],100);pebbles(g,r,4,'#1e1412','#55433e','#6e5a52');
  let x=(r()*20)|0,y=(r()*20)|0;for(let k=0;k<9;k++){P_(g,x,y,'#a8301c');P_(g,x,y+1,'#f07030');x+=1;y+=(r()<.5?1:-1)*((r()*2)|0)}}));
 // town ground: trampled village green with worn dirt patches and the odd flagstone
 tc[T.FLOOR]=[0,1,2,3,4,5,6,7].map(v=>mkT((g,r)=>{czGrass(g,r,v===3);
  for(let i=0;i<(v<3?1:0);i++){const cx=6+r()*20,cy=6+r()*20,rx=3+r()*4,ry=2+r()*2;ellT(g,cx,cy,rx,ry,(xx,yy,a,b)=>{const d=a*a+b*b;return d>.55&&((xx+yy)&1)?CZ.gA:d>.8?CZ.gA:(r()<.3?CZ.dirtA:'#86643f')})}
  if(v===5){ellT(g,10,20,5,3.5,(x,y,a,b)=>{const l=litOf(a,b);return a*a+b*b>.8?'#5a5248':l>.3?'#a8a092':'#8d8578'})}}));
 tc[T.FIELD]=[0,1].map(v=>mkT((g,r)=>{const c=v?'#4d8a3a':'#477f36';P_(g,0,0,c,TP,TP);dots(g,r,[shade(c,.08),shade(c,-.08)],90);
  for(let i=0;i<14;i++){const x=(r()*31)|0,y=(r()*30+1)|0;P_(g,x,y,shade(c,-.18));P_(g,x,y-1,shade(c,.12))}}));
 tc[T.FIELDLINE]=[mkT((g,r)=>{P_(g,0,0,'#4d8a3a',TP,TP);dots(g,r,['#56933f','#447c33'],80);P_(g,14,0,'#e8ecdc',4,TP);for(let y=0;y<TP;y++)if(r()<.3)P_(g,14+((r()*4)|0),y,'#bccab0')})];
 tc[T.WATER]=[0,1].map(f=>mkT((g,r)=>{P_(g,0,0,CZ.water,TP,TP);dots(g,r,[CZ.waterA,CZ.waterB],70);
  for(let i=0;i<4;i++){const y=3+i*8,x=(i*9+f*5)%TP;for(let k=0;k<6;k++)P_(g,(x+k)%TP,y+(k===0||k===5?1:0),CZ.waterB);P_(g,(x+2)%TP,y-1,CZ.waterH,2,1)}}));
 tc[T.LAVA]=[0,1].map(f=>mkT((g,r)=>{P_(g,0,0,'#b8361a',TP,TP);dots(g,r,['#8a2410','#a02e14'],70);
  for(let i=0;i<7;i++){const x=(r()*26)|0,y=(r()*26)|0,w=3+((r()*4)|0);ellT(g,x+w/2,y+2,w/2+.5,2.2,(xx,yy,a,b)=>b<-.2?'#ffc83a':f?'#ff7a1e':'#e85a18')}
  dots(g,r,['#ffe060'],f?8:3)}));
 tc[T.BRIDGE]=[mkT((g,r)=>{for(let y=0;y<TP;y+=8){P_(g,0,y,'#7a5232',TP,8);P_(g,0,y,'#9a6c44',TP,1);P_(g,0,y+7,'#3e2616',TP,1);
   for(let k=0;k<5;k++)P_(g,(r()*28)|0,y+2+((r()*4)|0),'#684428',4,1);P_(g,3,y+3,'#2a1a10');P_(g,28,y+3,'#2a1a10')}
  P_(g,0,0,'#3e2616',2,TP);P_(g,30,0,'#3e2616',2,TP)})];
 // log cabin walls
 const logs=(g,r)=>{for(let y=0;y<TP;y+=8){P_(g,0,y,CZ.logA,TP,8);P_(g,0,y+1,CZ.logB,TP,2);P_(g,0,y+1,CZ.logH,TP,1);P_(g,0,y+6,CZ.logD,TP,1);P_(g,0,y+7,CZ.logK,TP,1);
   for(let k=0;k<4;k++){const x=(r()*28)|0;P_(g,x,y+3+((r()*2)|0),shade(CZ.logA,-.12),3+((r()*4)|0),1)}
   if(r()<.35){const x=4+((r()*22)|0);P_(g,x,y+3,CZ.logK,2,2);P_(g,x,y+3,CZ.logD,1,1)}}};
 tc[T.WALL]=[mkT((g,r)=>logs(g,r))];
 tc[T.WINDOW]=[mkT((g,r)=>{logs(g,r);P_(g,6,4,CZ.frame,20,21);P_(g,8,6,CZ.glass,16,17);P_(g,8,6,CZ.glassH,16,3);P_(g,8,20,CZ.glassD,16,3);
  P_(g,15,6,CZ.frame,2,17);P_(g,8,13,CZ.frame,16,2);P_(g,9,7,'#fff6d0',3,2);P_(g,4,25,'#5e3a1e',24,3);P_(g,4,25,'#8a5a32',24,1);
  for(const x of[6,11,19,24]){P_(g,x,23,'#3f7a32',3,2);P_(g,x+1,22,['#e8604a','#f0c040','#e890b0'][(r()*3)|0],1,1)}})];
 tc[T.DOOR]=[mkT((g,r)=>{logs(g,r);P_(g,6,2,CZ.frame,20,30);P_(g,8,4,'#6b4226',16,28);for(let x=8;x<24;x+=4){P_(g,x,4,'#7d5030',3,28);P_(g,x+3,4,'#4e2e18',1,28)}
  P_(g,8,4,'#8a5a36',16,1);P_(g,8,11,'#3a2414',16,2);P_(g,8,23,'#3a2414',16,2);P_(g,20,16,'#d8a838',2,2);P_(g,20,16,'#fff0a0',1,1);P_(g,4,30,'#6a5a48',24,2)})];
 const roof=(c,cd,ch,shingle)=>mkT((g,r)=>{P_(g,0,0,c,TP,TP);
  for(let row=0;row<4;row++){const y=row*8,off=(row%2)*(shingle?4:5);
   for(let x=-off;x<TP;x+=(shingle?8:10)){const v=[c,shade(c,.05),shade(c,-.05)][(r()*3)|0];P_(g,x+1,y+1,v,(shingle?7:9),6);P_(g,x+1,y+1,ch,(shingle?7:9),1);P_(g,x,y,cd,1,7)}
   P_(g,0,y+7,cd,TP,1);P_(g,0,y+6,shade(c,-.12),TP,1)}
  dots(g,r,[shade(c,.1),shade(cd,-.1)],14)});
 tc[T.ROOF]=[roof(CZ.shake,CZ.shakeD,CZ.shakeH,false)];tc[T.ROOFB]=[roof(CZ.slate,CZ.slateD,CZ.slateH,true)];
 // ground cover
 const blades=(g,x,y,h,dark,mid,light)=>{for(const[dx,hh,c]of[[0,h-2,dark],[2,h,mid],[4,h-1,dark],[1,h-3,light],[3,h-1,light],[5,h-4,mid]]){for(let k=0;k<hh;k++)P_(g,x+dx+(k>hh*.7?(dx<3?-1:1):0),y-k,c)}P_(g,x-1,y+1,dark,8,1)};
 tc[T.TALL]=[0,1].map(()=>mkT((g,r)=>{for(const[x,y]of[[2,13],[16,12],[8,29],[22,29]])blades(g,x+((r()*2)|0),y,10,'#2c5222','#3f7030','#6c9c48')}));
 tc[T.JUNGLE]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#3a6a2c',TP,TP);dots(g,r,['#305e26','#467a36'],60);for(const[x,y]of[[0,14],[14,12],[6,30],[20,30]])blades(g,x,y,12,'#1c4020','#336628','#58884a')}));
 tc[T.BRUSH]=[0,1].map(()=>mkT((g,r)=>{for(const[x,y]of[[4,12],[18,14],[10,28],[22,29]]){ellT(g,x+5,y-3,6,4,(xx,yy,a,b)=>{const l=litOf(a,b);return(xx+yy)%3===0?'#5a4a22':l>.3?'#a8904a':l<-.3?'#5e4e26':'#7a6a32'});P_(g,x+1,y,'#4a3a1a',9,1)}}));
 tc[T.FLOWER]=[0,1,2].map(()=>mkT((g,r)=>{for(let i=0;i<5;i++){const x=3+((r()*25)|0),y=3+((r()*24)|0),c=['#d8584a','#e8b848','#ece4d4','#a874c8','#e08a3a'][(r()*5)|0];
  P_(g,x,y+2,'#2f5a22',1,4);P_(g,x+1,y+4,'#4a7a32',2,1);for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])P_(g,x+dx,y+dy,dy<0?shade(c,.15):c);P_(g,x,y,'#f0d070');P_(g,x+1,y+1,shade(c,-.3))}}));
 tc[T.TREE]=[mkT(()=>{})];tc[T.PINE]=[mkT(()=>{})]; // drawn as tall sprites instead
 tc[T.ROCK]=[0,1].map(()=>mkT((g,r)=>{ellT(g,16,19,13,10.5,(x,y,a,b)=>{const l=litOf(a,b),d=a*a+b*b;if(d>.86)return'#2e2a28';return l>.45?'#b4aea2':l>.15?'#928c80':l<-.4?'#545048':'#767064'});
  P_(g,10,13,'#ccc6ba',4,1);P_(g,17,16,'#5a564e',1,6);dots(g,r,['#686258'],6);P_(g,6,25,'#4a7a32',4,2);P_(g,7,24,'#6a9a48',2,1)}));
 tc[T.CACTUS]=[mkT((g,r)=>{const col=(x,y,w,h)=>{for(let k=0;k<w;k++)P_(g,x+k,y,k===0?'#1d4a24':k===w-1?'#173c1c':k===1?'#4a9a50':'#35803e',1,h)};
  col(12,4,8,28);col(3,8,5,10);P_(g,7,15,'#35803e',5,4);col(24,9,5,10);P_(g,20,17,'#35803e',4,4);for(let y=6;y<30;y+=3){P_(g,11,y,'#e0dcc0');P_(g,20,y+1,'#e0dcc0')}P_(g,14,2,'#e8608a',4,3)})];
 tc[T.FENCE]=[mkT((g,r)=>{for(const y of[10,20]){P_(g,0,y,'#2e1c10',TP,5);P_(g,0,y+1,'#7a5232',TP,3);P_(g,0,y+1,'#946640',TP,1)}
  for(const x of[5,23]){P_(g,x-1,4,'#2e1c10',6,26);P_(g,x,5,'#6e4a2c',4,24);P_(g,x,5,'#8a5e38',1,24);P_(g,x+3,5,'#4e321c',1,24);P_(g,x,4,'#2e1c10',4,1)}})];
 tc[T.SIGN]=[mkT((g,r)=>{P_(g,14,18,'#2e1c10',4,14);P_(g,15,18,'#5e3e22',2,14);P_(g,3,5,'#2e1c10',26,15);P_(g,4,6,'#8a5e38',24,13);P_(g,4,6,'#a8784a',24,1);P_(g,4,18,'#5e3e22',24,1);
  for(const[y,w]of[[9,18],[12,14],[15,16]])P_(g,7,y,'#4e321c',w,1)})];
 tc[T.FOUNTAIN]=[0,1].map(f=>mkT((g,r)=>{ellT(g,16,17,15.5,14,(x,y,a,b)=>{const d=a*a+b*b;if(d>.62)return y<17?(d>.9?'#7a7468':'#a8a294'):(d>.9?'#544e44':'#868072');return CZ.water});
  ellT(g,16,17,10,8.5,(x,y,a,b)=>b<-.3?CZ.waterH:(x+y+f)%5===0?CZ.waterB:CZ.water);P_(g,13,6,'#8a8476',6,12);P_(g,14,6,'#b0aa9c',2,12);ellT(g,16,6,4,2.5,'#868072');
  for(let k=0;k<4;k++){const ang=f*.8+k*1.57;P_(g,16+Math.cos(ang)*6,4+Math.sin(ang)*2-k%2,'#c8e0f0',2,2)}P_(g,15,1,'#e0f0ff',2,4)}));
}
buildTiles=(orig=>function(){orig();czTiles()})(buildTiles);
// grass edge fringe to match the new grass
buildFringe=function(){FRINGE={};
 for(const side of['top','bottom','left','right'])FRINGE[side]=[0,1,2].map(v=>{const c=hdCanvas(TP,TP,2),g=c.getContext('2d'),r=mulberry32(900+v*7+side.length);
  for(let i=0;i<TP;i++){const d=2+((r()*3)|0)+(i%7===0?2:0);for(let k=0;k<d;k++){const col=k===d-1?CZ.gBlade:k===d-2?CZ.gA:(r()<.3?CZ.gB:CZ.g0);
   if(side==='top')P_(g,i,k,col);else if(side==='bottom')P_(g,i,TP-1-k,col);else if(side==='left')P_(g,k,i,col);else P_(g,TP-1-k,i,col)}}return c})};

// ---------------------------------------------------------------------
//  TALL TREES, PINES, LAMP POSTS, CHIMNEYS
// ---------------------------------------------------------------------
const TREE_SCHEMES=[
 ['#16301a','#234a24','#336530','#4a823c','#66a04c'],   // green
 ['#14301e','#1f4a2a','#2d6236','#447d44','#5e9a56'],   // blue-green
 ['#1e3a16','#2e5420','#41702a','#5a8c34','#78a844'],   // yellow-green
 ['#5a2412','#8a3e1c','#b35a24','#d9802e','#f0a848'],   // orange
 ['#4a1814','#6e2420','#963226','#bd4a30','#dc6e4a'],   // red
 ['#5a4410','#8a6a1c','#b8902a','#dcb43c','#f2d466'],   // gold
];
function makeTreeSpr(scheme,seed){const W=76,H=84,c=hdCanvas(W,H,2),g=c.getContext('2d'),r=mulberry32(seed);const[k0,k1,k2,k3,k4]=scheme;
 // trunk with roots
 P_(g,32,52,'#24160c',12,30);P_(g,34,52,'#5a3a22',8,30);P_(g,35,54,'#7a5232',2,26);P_(g,40,52,'#3e2616',2,30);
 P_(g,28,79,'#24160c',20,3);P_(g,30,78,'#4a2e18',6,3);P_(g,40,78,'#4a2e18',6,3);
 // canopy: dark base mass, then lit clumps
 const cl=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2+r()*.4,d=8+r()*9;cl.push([38+Math.cos(a)*d*1.25,30+Math.sin(a)*d,9+r()*4])}
 cl.push([38,26,12],[30,20,9],[46,20,9],[38,14,9]);
 for(const[x,y,rd]of cl)ellT(g,x,y+2,rd+1.5,rd*.92+1.5,k0);
 for(const[x,y,rd]of cl.sort((a,b)=>a[1]-b[1]))ellT(g,x,y,rd,rd*.9,(xx,yy,a,b)=>{const l=litOf(a,b)+(r()-.5)*.25;return l>.55?k4:l>.2?k3:l>-.25?k2:l>-.6?k1:k0});
 // leaf texture
 const AD=g.getImageData(0,0,W,H).data;for(let i=0;i<120;i++){const x=(r()*W)|0,y=(r()*58)|0;if(AD[(y*W+x)*4+3]<200)continue;const up=y<30&&x<44;P_(g,x,y,up?k4:k1,2,1);P_(g,x+1,y+1,k2)}
 return c}
function makePineSpr(seed,snowy){const W=52,H=92,c=hdCanvas(W,H,2),g=c.getContext('2d'),r=mulberry32(seed);
 P_(g,22,74,'#24160c',8,16);P_(g,24,74,'#5a3a22',4,16);P_(g,21,89,'#24160c',10,3);
 const cols=['#14281a','#1d3a24','#2a5032','#3e6a44','#5a8a58'];
 for(let i=0;i<5;i++){const top=2+i*14,hw=8+i*4.5,h=22;
  for(let k=0;k<h;k++){const w=Math.round(hw*(k+2)/h),yy=top+k;for(let x=26-w;x<26+w;x++){const t=(x-(26-w))/(2*w);const l=t<.3?3:t<.55?2:t<.8?1:0;P_(g,x,yy,cols[l+(k<3?1:0)])}}
  for(let x=26-hw;x<26+hw;x+=3){const d=1+((r()*3)|0);P_(g,x,top+h-1,cols[0],2,d)}
  if(snowy){for(let x=26-hw*.6;x<26;x+=2)P_(g,x,top+3+((r()*3)|0),'#e8eef4',2,1)}}
 P_(g,25,0,'#2a5032',2,3);return c}
function makeLampSpr(){const c=hdCanvas(20,68,2),g=c.getContext('2d');
 P_(g,8,16,'#1e140c',5,48);P_(g,9,16,'#4a3020',2,48);P_(g,5,62,'#1e140c',11,6);P_(g,6,63,'#5a3a22',9,4);
 P_(g,9,10,'#1e140c',10,3);P_(g,16,10,'#1e140c',2,6);
 P_(g,12,15,'#1e140c',10,13);P_(g,13,16,'#f5c85a',8,10);P_(g,13,16,'#fff0b0',4,3);P_(g,16,16,'#1e140c',1,10);P_(g,11,14,'#2e2014',12,2);P_(g,13,26,'#2e2014',8,2);
 return c}
function makeWallLantern(){const c=hdCanvas(10,16,2),g=c.getContext('2d');P_(g,4,0,'#1e140c',2,3);P_(g,1,3,'#1e140c',8,11);P_(g,2,4,'#f5c85a',6,8);P_(g,2,4,'#fff0b0',3,3);P_(g,4,4,'#1e140c',1,8);P_(g,0,13,'#2e2014',10,2);return c}
function makeChimSpr(){const c=hdCanvas(22,30,2),g=c.getContext('2d');P_(g,0,0,'#1e1a18',22,30);
 for(let y=1;y<30;y+=5)for(let x=(y%10===1?1:5);x<21;x+=8){P_(g,x,y,'#6a645c',7,4);P_(g,x,y,'#8a847a',7,1)}
 P_(g,-1,0,'#1e1a18',24,5);P_(g,0,1,'#5a5650',22,3);P_(g,3,2,'#0e0c0a',16,2);return c}
function makeGlow(rgb,size){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
 gr.addColorStop(0,`rgba(${rgb},1)`);gr.addColorStop(.35,`rgba(${rgb},.55)`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.fillRect(0,0,size,size);return c}

function czScan(){ // find windows, doors, roofs, plaza corners once the world exists
 const L=[],lamps=[],chim=[],lan=[];const at=(x,y)=>inb(x,y)?map[idx(x,y)]:-1;const isRoof=t=>t===T.ROOF||t===T.ROOFB;
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=map[idx(x,y)];
  if(t===T.WINDOW)L.push({x:x*16+8,y:y*16+12,r:26,k:'w'});
  if(t===T.DOOR){if(at(x-1,y)===T.WALL){lan.push({x:x*16-6,y:y*16+3});L.push({x:x*16-1,y:y*16+8,r:30,k:'l'})}else if(at(x+1,y)===T.WALL){lan.push({x:x*16+17,y:y*16+3});L.push({x:x*16+22,y:y*16+8,r:30,k:'l'})}}
  if(t===T.FOUNTAIN)L.push({x:x*16+8,y:y*16+8,r:40,k:'b'});
  if(isRoof(t)&&!isRoof(at(x,y-1))&&isRoof(at(x-1,y))&&isRoof(at(x-2,y))&&!isRoof(at(x-3,y))&&isRoof(at(x+1,y)))chim.push({x:x*16+2,y:y*16-9});
  if(t===T.FLOOR){const o=d=>{const n=at(x+d[0],y+d[1]);return n!==T.FLOOR&&n!==T.FOUNTAIN&&!BLDG.has(n)};
   const corner=(o([-1,0])||o([1,0]))&&(o([0,-1])||o([0,1]))&&!SOLID.has(t);
   if(corner&&!lamps.some(l=>Math.abs(l.tx-x)+Math.abs(l.ty-y)<7))lamps.push({tx:x,ty:y})}}
 for(const l of lamps)L.push({x:l.tx*16+11,y:l.ty*16-6,r:42,k:'l'});
 COZY.lights=L;COZY.lamps=lamps;COZY.chimneys=chim;COZY.lanterns=lan}

buildMisc=(orig=>function(){orig();
 COZY.treeSpr=[];for(let i=0;i<TREE_SCHEMES.length;i++)for(let v=0;v<2;v++)COZY.treeSpr.push({s:makeTreeSpr(TREE_SCHEMES[i],500+i*13+v*7),autumn:i>=3,c:TREE_SCHEMES[i][3]});
 COZY.pineSpr=[0,1,2].map(v=>makePineSpr(800+v*11,false));COZY.pineSnow=[0,1].map(v=>makePineSpr(860+v*11,true));
 COZY.lampSpr=makeLampSpr();COZY.chimSpr=makeChimSpr();COZY.wallLantern=makeWallLantern();
 COZY.glowW=makeGlow('255,150,60',128);COZY.glowF=makeGlow('230,255,120',64);COZY.glowB=makeGlow('140,200,255',128);COZY.glowO=makeGlow('255,120,40',128);COZY.cut=makeGlow('0,0,0',128);
 czScan()})(buildMisc);
function treeFor(x,y){const h=hash(x,y),reg=hash((x/4)|0,(y/4)|0);const autumnZone=reg%5<2;const pool=COZY.treeSpr;
 const i=autumnZone?6+(h%6):((h%10)<8?(h%6):6+(h%6));return pool[i%pool.length]}

// ---------------------------------------------------------------------
//  WORLD DRAW (same as the original, plus tall trees, lamps, light and particles)
// ---------------------------------------------------------------------
drawOverlay=(orig=>function(t,x,y,sx,sy){if(t===T.TREE||t===T.PINE)return;return orig(t,x,y,sx,sy)})(drawOverlay);
drawShadow=(orig=>function(t,x,y,sx,sy){if(t===T.TREE||t===T.PINE){ctx.fillStyle='rgba(12,10,24,.32)';ell(sx+8,sy+15,13,4.5);return}return orig(t,x,y,sx,sy)})(drawShadow);
function czDrawTree(tx,ty){const sx=tx*16-camX,sy=ty*16-camY,sway=Math.round(Math.sin(frame/70+tx*.7+ty*.3)*.5*2)/2;
 if(map[idx(tx,ty)]===T.PINE){const reg=regionPoi(tx,ty),snow=reg&&reg.biome==='mountain';const arr=snow?COZY.pineSnow:COZY.pineSpr;blit(arr[hash(tx,ty)%arr.length],sx+8-13+sway,sy+16-46)}
 else blit(treeFor(tx,ty).s,sx+8-19+sway,sy+16-42)}

function lightLevel(){ // returns {dark:0..1, warm:0..1}
 const m=COZY.lightMode;if(m==='day')return{dark:0,warm:0};if(m==='dusk')return{dark:.32,warm:.8};if(m==='night')return{dark:.74,warm:0};
 const p=czDayPhase();
 if(p<.55)return{dark:0,warm:0};if(p<.62){const t=(p-.55)/.07;return{dark:t*.32,warm:t}}
 if(p<.67){const t=(p-.62)/.05;return{dark:.32+t*.42,warm:1-t}}if(p<.92)return{dark:.74,warm:0};
 const t=(p-.92)/.08;return{dark:.74*(1-t),warm:Math.sin(t*Math.PI)*.6}}

// extra world layers register here: ground (after tiles), ents (depth-sorted), air (after particles), over (after lighting)
const CZ_HOOKS={ground:[],ents:[],air:[],over:[]};function czHook(k,...a){for(const f of CZ_HOOKS[k])try{f(...a)}catch(e){console.warn('hook',k,e)}}
drawWorld=function(){
 const ppx=player.px,ppy=player.py;
 camX=Math.round(clamp(ppx+8-CW/2,0,MW*TS-CW));camY=Math.round(clamp(ppy+8-CH/2,0,MH*TS-CH));
 const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS);
 const vw=Math.ceil(CW/TS),vh=Math.ceil(CH/TS);
 for(const fn of[drawTile,drawShadow,drawOverlay])for(let ty=y0-1;ty<=y0+vh+1;ty++)for(let tx=x0-1;tx<=x0+vw+1;tx++){if(!inb(tx,ty))continue;fn(map[idx(tx,ty)],tx,ty,tx*TS-camX,ty*TS-camY)}
 // wall lanterns + chimneys (sit on buildings, below characters)
 for(const l of COZY.lanterns){const sx=l.x-camX,sy=l.y-camY;if(sx<-10||sy<-20||sx>CW+10||sy>CH+10)continue;blit(COZY.wallLantern,sx,sy)}
 for(const c of COZY.chimneys){const sx=c.x-camX,sy=c.y-camY;if(sx<-20||sy<-30||sx>CW+20||sy>CH+20)continue;blit(COZY.chimSpr,sx,sy);
  if(frame%9===0&&COZY.parts.length<260)COZY.parts.push({k:'smoke',x:c.x+5.5+(Math.random()-.5)*2,y:c.y,vx:.08+Math.random()*.08,vy:-.28-Math.random()*.1,t:0,m:150+Math.random()*60,s:2+Math.random()})}
 czHook('ground',x0,y0,vw,vh);
 if(route&&route.mark&&state==='world'){const m=route.mark,sx=m.x*16-camX,sy=m.y*16-camY,k=(frame>>3)&1;ctx.strokeStyle='rgba(16,8,36,.55)';ctx.lineWidth=1;ctx.strokeRect(sx+1.5+k,sy+1.5+k,13-2*k,13-2*k);ctx.strokeStyle='#ffd84a';ctx.strokeRect(sx+.5+k,sy+.5+k,15-2*k,15-2*k)}
 if(bumpFx&&bumpFx.t>0){bumpFx.t--;const a=bumpFx.t/24,sx=bumpFx.x*16-camX,sy=bumpFx.y*16-camY;ctx.strokeStyle=`rgba(255,255,255,${.9*a})`;ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,15,15);ctx.strokeStyle=`rgba(232,68,58,${.7*a})`;ctx.strokeRect(sx+1.5,sy+1.5,13,13);
  ctx.fillStyle=`rgba(255,255,255,${.8*a})`;const k=24-bumpFx.t,bx=player.px-camX+8+DX[player.dir]*7,by=player.py-camY+13+DY[player.dir]*5;ctx.fillRect(bx-3-k/3,by-k/4,2,2);ctx.fillRect(bx+2+k/3,by-k/4,2,2)}
 const ents=[];
 // tall trees (look further down so canopies that rise into view are included)
 for(let ty=y0-1;ty<=y0+vh+4;ty++)for(let tx=x0-2;tx<=x0+vw+2;tx++){if(!inb(tx,ty))continue;const t=map[idx(tx,ty)];if(t===T.TREE||t===T.PINE)ents.push({y:ty*16,d:()=>czDrawTree(tx,ty)})}
 for(const l of COZY.lamps){const sx=l.tx*16-camX,sy=l.ty*16-camY;if(sx<-20||sx>CW+20||sy<-10||sy>CH+50)continue;ents.push({y:l.ty*16,d:()=>{ctx.fillStyle='rgba(12,10,24,.3)';ell(sx+9,sy+15,5,2);blit(COZY.lampSpr,sx+4,sy+16-34)}})}
 for(const it of items){if(Math.abs(it.x*16-ppx)>CW/2+40||Math.abs(it.y*16-ppy)>CH/2+40)continue;if(it.kind==='sparkle'&&S.taken[it.id])continue;ents.push({y:it.y*16,d:()=>drawItem(it)})}
 for(const n of npcs){if(Math.abs(n.px-ppx)>CW/2+40||Math.abs(n.py-ppy)>CH/2+40)continue;ents.push({y:n.py,d:()=>drawChar(n.spr||(n.spr=makeCharSprites(n.look)),n.dir,n.moving?[1,0,2,0][((n.prog/4)|0)%4]:0,n.px,n.py)})}
 for(const b of bosses){if(Math.abs(b.x*16-ppx)>CW/2+80||Math.abs(b.y*16-ppy)>CH/2+80)continue;ents.push({y:b.y*16,d:()=>drawBossMap(b)})}
 if(state!=='title'&&folVisible())ents.push({y:Math.min(fol.py,ppy)-.5,d:drawFollower});
 if(state!=='title')ents.push({y:ppy+.1,d:()=>{const n=bumpFx&&bumpFx.t>16?1:0;const fx=ppx+DX[player.dir]*n,fy=ppy+DY[player.dir]*n;drawAura(fx-camX,fy-camY);drawMiniWeapon(fx,fy,player.dir,false);drawChar(bradySpr,player.dir,player.moving?czWalkF(player.anim):0,fx,fy);drawMiniWeapon(fx,fy,player.dir,true)}});
 czHook('ents',x0,y0,vw,vh,ents);
 ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
 if(state!=='title')drawBradyFx(ppx,ppy);
 czParticles(x0,y0,vw,vh);
 czHook('air',x0,y0,vw,vh);
 czLighting(ppx,ppy,x0,y0,vw,vh);
 czHook('over',x0,y0,vw,vh);
 if(warpFx>0){warpFx--;ctx.fillStyle=`rgba(255,255,255,${warpFx/40})`;ctx.fillRect(0,0,CW,CH)}
 if(excl>0){const sx=ppx-camX+5,sy=ppy-camY-20;ctx.fillStyle=OUT;ctx.fillRect(sx-1,sy-1,8,12);ctx.fillStyle='#fff';ctx.fillRect(sx,sy,6,10);ctx.fillStyle='#e8443a';ctx.fillRect(sx+2,sy+1,2,5);ctx.fillRect(sx+2,sy+7,2,2)}
};

// walk cycle: stride, pass (standing frame), stride, pass. The base sheet's two stride
// frames have the same leg forward, so flipping between only them looked frozen.
function czWalkF(a){return[1,0,2,0][((a/5)|0)%4]}
function czParticles(x0,y0,vw,vh){const P=COZY.parts,L=lightLevel();
 // falling leaves from autumn trees on screen
 if(frame%5===0&&P.length<260){const tx=x0+((Math.random()*(vw+2))|0),ty=y0+((Math.random()*(vh+2))|0);if(inb(tx,ty)&&map[idx(tx,ty)]===T.TREE){const tr=treeFor(tx,ty);if(tr.autumn||Math.random()<.25)P.push({k:'leaf',x:tx*16+8+(Math.random()-.5)*24,y:ty*16-20+Math.random()*10,vx:(Math.random()-.3)*.25,vy:.18+Math.random()*.12,t:0,m:220,c:tr.c,ph:Math.random()*6})}}
 // fireflies at night
 if(L.dark>.4&&frame%14===0&&P.length<260){const tx=x0+((Math.random()*vw)|0),ty=y0+((Math.random()*vh)|0);if(inb(tx,ty)){const t=map[idx(tx,ty)];if(t===T.TALL||t===T.GRASS||t===T.FLOWER||t===T.JUNGLE)P.push({k:'fly',x:tx*16+Math.random()*16,y:ty*16+Math.random()*16,vx:0,vy:0,t:0,m:260,ph:Math.random()*6})}}
 ctx.save();
 for(let i=P.length-1;i>=0;i--){const p=P[i];p.t++;if(p.t>p.m){P.splice(i,1);continue}const sx=p.x-camX,sy=p.y-camY;
  if(p.k==='dust'){p.x+=p.vx;p.y+=p.vy;p.vx*=.9;p.vy*=.9;p.s+=.06;const a=.75*(1-p.t/p.m);ctx.fillStyle=`rgba(${p.c},${a})`;ell(sx,sy,p.s,p.s*.7)}
  else if(p.k==='smoke'){p.x+=p.vx;p.y+=p.vy;p.s+=.035;const a=.38*(1-p.t/p.m);ctx.fillStyle=`rgba(${190-L.dark*90},${190-L.dark*80},${196-L.dark*60},${a})`;ell(sx,sy,p.s,p.s*.85)}
  else if(p.k==='leaf'){p.x+=p.vx+Math.sin(p.t/18+p.ph)*.35;p.y+=p.vy;ctx.globalAlpha=Math.min(1,(p.m-p.t)/30);ctx.fillStyle=p.c;const f=(p.t>>3)%2;ctx.fillRect(Math.round(sx*2)/2,Math.round(sy*2)/2,f?1.5:1,f?1:1.5);ctx.globalAlpha=1}
 }
 ctx.restore()}

function czLighting(ppx,ppy,x0,y0,vw,vh){const L=lightLevel();
 if(L.warm>0){ctx.fillStyle=`rgba(255,130,50,${.13*L.warm})`;ctx.fillRect(0,0,CW,CH)}
 if(L.dark<=0.01){czFlies(0);return}
 const S2=2;if(!COZY.lm)COZY.lm=document.createElement('canvas');const lm=COZY.lm;if(lm.width!==CW*S2||lm.height!==CH*S2){lm.width=CW*S2;lm.height=CH*S2}
 const g=lm.getContext('2d');g.setTransform(S2,0,0,S2,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,CW,CH);
 g.fillStyle=`rgba(10,14,42,${L.dark})`;g.fillRect(0,0,CW,CH);g.globalCompositeOperation='destination-out';
 const flick=k=>k==='l'?1+Math.sin(frame/7+k.length)*.03+(Math.random()-.5)*.02:1;
 const vis=[];for(const l of COZY.lights){const sx=l.x-camX,sy=l.y-camY;if(sx<-l.r||sy<-l.r||sx>CW+l.r||sy>CH+l.r)continue;vis.push([sx,sy,l.r*flick(l.k),l.k])}
 // lava glows
 for(let ty=y0;ty<=y0+vh;ty+=2)for(let tx=x0;tx<=x0+vw;tx+=2)if(inb(tx,ty)&&map[idx(tx,ty)]===T.LAVA)vis.push([tx*16+8-camX,ty*16+8-camY,40,'o']);
 vis.push([ppx+8-camX,ppy+8-camY,state==='title'?0:30,'p']);
 for(const[x,y,r,k]of vis){g.globalAlpha=k==='w'?.85:k==='p'?.55:1;g.drawImage(COZY.cut,x-r,y-r,r*2,r*2)}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(lm,0,0,CW,CH);
 ctx.globalCompositeOperation='lighter';
 for(const[x,y,r,k]of vis){if(k==='p')continue;const im=k==='b'?COZY.glowB:k==='o'?COZY.glowO:COZY.glowW;ctx.globalAlpha=(k==='w'?.22:.34)*L.dark/.74;ctx.drawImage(im,x-r*.8,y-r*.8,r*1.6,r*1.6)}
 ctx.restore();ctx.imageSmoothingEnabled=false;czFlies(L.dark)}

function czFlies(dark){const P=COZY.parts;ctx.save();ctx.globalCompositeOperation='lighter';
 for(const p of P){if(p.k!=='fly')continue;p.x+=Math.sin(p.t/40+p.ph)*.25;p.y+=Math.cos(p.t/55+p.ph)*.18;const a=Math.max(0,Math.sin(p.t/30+p.ph))*Math.min(1,(p.m-p.t)/40)*Math.min(1,dark*1.6);
  if(a<=0)continue;const sx=p.x-camX,sy=p.y-camY;ctx.globalAlpha=a*.35;ctx.drawImage(COZY.glowF,sx-5,sy-5,10,10);ctx.globalAlpha=a;ctx.fillStyle='#fff6a0';ctx.fillRect(Math.round(sx*2)/2,Math.round(sy*2)/2,1,1)}
 ctx.restore()}

function czSetLight(m){COZY.lightMode=m;try{localStorage.setItem('dinoCozyLight',m)}catch(e){}
 toast({auto:'🌗 Time of day: Auto (day/night cycle)',day:'☀️ Time of day: Day',dusk:'🌇 Time of day: Sunset',night:'🌙 Time of day: Night'}[m]);const b=$('#btnLight');if(b)b.textContent={auto:'🌗',day:'☀️',dusk:'🌇',night:'🌙'}[m]}
function czCycleLight(){const o=['auto','day','dusk','night'];czSetLight(o[(o.indexOf(COZY.lightMode)+1)%o.length])}
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='KeyN'&&(state==='world'||state==='title'))czCycleLight()});

// battle backdrops: softer, earthier colors
Object.assign(BIOME_SKY,{plains:['#7fa8c8','#e8d8b8','#5a8a40'],forest:['#5e8a78','#d8e0c0','#3f6a30'],coast:['#6a9ac0','#e8e0c8','#c8b07a'],desert:['#d8905a','#f0d8a8','#c8a068'],
 mountain:['#7a8aa8','#d8dce4','#8a7a62'],ruins:['#8e80b0','#e0d4e8','#5a8a40'],springs:['#6aaab8','#d8eee8','#4f8538'],volcano:['#4a1a18','#c05030','#3e302c']});

// ---------------------------------------------------------------------
//  UI skin: wood + parchment
// ---------------------------------------------------------------------
(function(){const st=document.createElement('style');st.textContent=`
html,body{background:radial-gradient(ellipse at center,#26304a 0%,#0c0f1a 75%)!important}
#game{box-shadow:0 0 0 4px #6b4527,0 0 0 7px #3a2414,0 0 0 9px #140c06,0 18px 50px rgba(0,0,0,.65)!important}
.box{background:#f4e2b8!important;border:3px solid #4a2c16!important;box-shadow:inset 0 0 0 2px #dcbc84,inset 0 0 0 4px #f8ecd0,0 3px 0 rgba(0,0,0,.4)!important;color:#3a2414}
button:not(.sw){background:#e8c88c!important;border-color:#4a2c16!important;color:#3a2414!important;box-shadow:0 2px 0 #4a2c16,inset 0 1px 0 #fbe6b8!important}
button:not(.sw):hover:not(:disabled){background:#f4d89c!important}
button.on:not(.sw){background:#f5c542!important;box-shadow:0 0 0 2px #a8501c,0 2px 0 #4a2c16,inset 0 1px 0 #fff0b0!important}
.bar{background:#5a3a22!important;border-color:#3a2414!important}
#face{background:#cfe0c8!important;border-color:#4a2c16!important}
`;document.head.appendChild(st)})();
// time-of-day button in the HUD
(function(){const box=document.getElementById('hudBtns');if(!box)return;const b=document.createElement('button');b.id='btnLight';b.title='Time of day (N)';b.textContent={auto:'🌗',day:'☀️',dusk:'🌇',night:'🌙'}[COZY.lightMode]||'🌗';b.onclick=()=>czCycleLight();box.insertBefore(b,box.firstChild)})();

// load any hand-made sheets before the game boots (boot waits on loadSigArt)
loadSigArt=(orig=>function(){return Promise.all([orig(),cozyLoadSheets()])})(loadSigArt);

// pitched-roof shading: lighter upper slope, ridge cap, darker lower slope, eave + gable trim
drawTile=(orig=>function(t,x,y,sx,sy){orig(t,x,y,sx,sy);if(t!==T.ROOF&&t!==T.ROOFB)return;
 const isR=(a,b)=>{if(!inb(a,b))return false;const m=map[idx(a,b)];return m===T.ROOF||m===T.ROOFB};
 let u=0,d=0;while(isR(x,y-u-1)&&u<12)u++;while(isR(x,y+d+1)&&d<12)d++;const n=u+d+1,mid=(n-1)/2,row=u;
 if(row<mid-.01){ctx.fillStyle='rgba(255,236,200,.07)';ctx.fillRect(sx,sy,16,16)}else if(row>mid+.01){ctx.fillStyle=`rgba(20,10,30,${.12+.05*(row-mid)})`;ctx.fillRect(sx,sy,16,16)}
 const tc=t===T.ROOFB?'#2a3248':'#3e2216',th=t===T.ROOFB?'#6a7898':'#9a6040';
 if(Math.abs(row-mid)<.01){ctx.fillStyle=tc;ctx.fillRect(sx,sy+6,16,4);ctx.fillStyle=th;ctx.fillRect(sx,sy+6,16,1)}
 else if(Math.abs(row-(mid-.5))<.01){ctx.fillStyle=tc;ctx.fillRect(sx,sy+14,16,2);ctx.fillStyle=th;ctx.fillRect(sx,sy+14,16,.5)}
 else if(Math.abs(row-(mid+.5))<.01){ctx.fillStyle=tc;ctx.fillRect(sx,sy,16,2)}
 if(u===0){ctx.fillStyle=tc;ctx.fillRect(sx,sy,16,1.5)}
 if(d===0){ctx.fillStyle=tc;ctx.fillRect(sx,sy+14,16,2);ctx.fillStyle='rgba(10,6,4,.35)';ctx.fillRect(sx,sy+16,16,2)}
 if(!isR(x-1,y)){ctx.fillStyle=tc;ctx.fillRect(sx,sy,1.5,16)}if(!isR(x+1,y)){ctx.fillStyle=tc;ctx.fillRect(sx+14.5,sy,1.5,16)}})(drawTile);

// ============================================================================
//  DENSER WORLD: more trees, boulders, tall grass and flowers (seeded, so the
//  world is the same every load). Solid pieces only go where all 8 neighbours
//  are open, so they can never close a route; tall sprites are kept off the
//  tiles that would hide a chest, sparkle, totem, NPC or boss.
// ============================================================================
let CZ_DENSE={added:{},cleared:0,ok:true};
function czDensify(){
 CZ_DENSE.pre=map.slice();const rr=mulberry32(WORLD_SEED+771),champ=poiById('champ'),ci=POIS.indexOf(champ);
 const OPEN=new Set([T.GRASS,T.MFLOOR,T.SAND]);
 const keep=new Uint8Array(MW*MH),mark=(x,y,r)=>{for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++)if(inb(x+a,y+b))keep[idx(x+a,y+b)]=1};
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=map[idx(x,y)];if(t===T.PATH||t===T.BRIDGE||t===T.GATE||t===T.DOOR||t===T.SIGN||t===T.TOTEM||t===T.MONO||t===T.FOUNTAIN)mark(x,y,1);if(town[idx(x,y)])mark(x,y,1)}
 for(const it of items)mark(it.x,it.y,2);for(const n of npcs)mark(n.x,n.y,2);for(const b of bosses)mark(b.x,b.y,3);for(const t of totems)mark(t.x,t.y,2);
 for(const p of POIS)mark(p.x,p.y,3);
 const solidAround=(x,y)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){if(!a&&!b)continue;if(!inb(x+a,y+b)||SOLID.has(map[idx(x+a,y+b)]))return true}return false};
 const before=flood(POIS[0].x,POIS[0].y+3);
 const add=(i,t)=>{map[i]=t;CZ_DENSE.added[t]=(CZ_DENSE.added[t]||0)+1};
 // pass 1: solid pieces (trees / pines / boulders / cactus)
 const R={plains:[.08,.016],forest:[.12,.012],coast:[.06,.014],springs:[.07,.014],mountain:[.05,.045],desert:[.025,.035],ruins:[.025,.035]};
 for(let y=2;y<MH-2;y++)for(let x=2;x<MW-2;x++){const i=idx(x,y);if(keep[i]||!OPEN.has(map[i])||region[i]===ci||town[i])continue;
  const b=POIS[region[i]].biome,pr=R[b];if(!pr||solidAround(x,y))continue;const v=rr();
  if(v<pr[0])add(i,b==='forest'?(rr()<.5?T.TREE:T.PINE):b==='mountain'?T.PINE:b==='desert'?T.CACTUS:b==='ruins'?T.COLUMN:T.TREE);
  else if(v<pr[0]+pr[1])add(i,T.ROCK)}
 // pass 2: grow tall grass / brush clumps and sprinkle flowers (walkable)
 const grow=[];for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=idx(x,y);if(town[i]||region[i]===ci||!OPEN.has(map[i])||map[i]===T.SAND&&POIS[region[i]].biome!=='desert')continue;
  const want=POIS[region[i]].biome==='desert'?T.BRUSH:T.TALL;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(map[idx(x+a,y+b)]===want)n++;
  if(n>=2&&rr()<.3)grow.push([i,want]);else if(map[i]===T.GRASS&&!keep[i]&&rr()<.035)grow.push([i,T.FLOWER])}
 for(const[i,t]of grow)add(i,t);
 // pass 3: keep tall sprites from hiding things (incl. the original trees)
 const pts=[...items,...totems,...npcs.map(n=>({x:n.x,y:n.y})),...bosses];
 for(const p of pts)for(let b=0;b<=2;b++)for(let a=-1;a<=1;a++){const x=p.x+a,y=p.y+b;if(!inb(x,y))continue;const i=idx(x,y);if(map[i]===T.TREE||map[i]===T.PINE){map[i]=base[i]===T.FLOOR?T.GRASS:base[i];CZ_DENSE.cleared++}}
 // safety net: nothing that was reachable may become unreachable (except the new pieces themselves)
 const after=flood(POIS[0].x,POIS[0].y+3);let lost=0;for(let i=0;i<MW*MH;i++)if(before[i]&&!after[i]&&!SOLID.has(map[i]))lost++;
 CZ_DENSE.lost=lost;CZ_DENSE.ok=lost===0;
}
genWorld=(orig=>function(){orig();try{czDensify()}catch(e){console.warn('densify',e)}})(genWorld);
// old saves: if the new scenery now sits on the saved spot, step to the nearest open tile
startPlayer=(orig=>function(){if(S&&inb(S.x,S.y)&&SOLID.has(map[idx(S.x,S.y)])){let best=null,bd=1e9;for(let b=-4;b<=4;b++)for(let a=-4;a<=4;a++){const x=S.x+a,y=S.y+b;if(inb(x,y)&&!SOLID.has(map[idx(x,y)])&&a*a+b*b<bd){bd=a*a+b*b;best=[x,y]}}if(best){S.x=best[0];S.y=best[1]}}return orig()})(startPlayer);

// little dust puffs at Brady's feet as he walks (bigger when running); color follows the ground
const CZ_DUST={[T.PATH]:'232,212,175',[T.SAND]:'232,210,160',[T.MFLOOR]:'180,170,150',[T.GRASS]:'205,215,170',[T.TALL]:'190,205,150',[T.FLOWER]:'205,215,170',[T.BRIDGE]:'170,135,95'};
onStep=(orig=>function(){orig.apply(this,arguments);if(state!=='world'||!COZY.parts||COZY.parts.length>250)return;const t=map[idx(player.x,player.y)],c=CZ_DUST[t]||CZ_DUST[base[idx(player.x,player.y)]];if(!c)return;
 const run=held.run,n=run?3:2,vert=!DX[player.dir],by=player.y*16+16+(player.dir==='up'?2:0);
 for(let i=0;i<n;i++){const side=i%2?1:-1,bx=player.x*16+8+(vert?side*(6+Math.random()*2):-DX[player.dir]*8+(Math.random()-.5)*4);
  COZY.parts.push({k:'dust',x:bx,y:by+(Math.random()-.5)*2,vx:(vert?side*.3:-DX[player.dir]*.35)*(run?1.4:1),vy:-.04-Math.random()*.05,s:1.7+Math.random()*.8,t:0,m:run?26:20,c})}})(onStep);
