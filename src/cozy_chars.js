// =====================================================================
//  COZY CHARACTER MODEL  (16 x 23 world units, drawn at 2x = 32 x 46 px)
//  Taller, farm-sim style townsfolk. Reads the same "look" data as the
//  original sprites (skin, hair, shirt, pants, hat, freckles, hair style,
//  helmet / uniform / cleats), so gear and the character creator still work.
// =====================================================================
const CC_W=32,CC_H=46,CC_STYLES=['shaggy','buzz','spiky','long','puffy','ponytail'];
function ccMake(o,dir,f){ // o: {skin,hair,style,shirt,pants,shoes,hat,fr,beard,H,P}
 const W=CC_W,Hh=CC_H,px=new Array(W*Hh).fill(null);
 const set=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(c&&x>=0&&y>=0&&x<W&&y<Hh)px[y*W+x]=c};
 const get=(x,y)=>(x<0||y<0||x>=W||y>=Hh)?null:px[y*W+x];
 const rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(x+i,y+j,c)};
 const ellip=(cx,cy,rx,ry,c,cond)=>{for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const a=(x+.5-cx)/rx,b=(y+.5-cy)/ry;if(a*a+b*b<=1&&(!cond||cond(x,y,a,b)))set(x,y,typeof c==='function'?c(x,y,a,b):c)}};
 const side=dir==='left',back=dir==='up';
 const skin=o.skin,skinD=shade(skin,-.18),hair=o.hair,hairD=shade(hair,-.3),hairL=shade(hair,.22);
 const shirt=o.shirt,shirtD=shade(shirt,-.25),pants=o.pants,pantsD=shade(pants,-.25),shoe=o.shoes,shoeD=shade(shoe,-.35);
 const P=o.P||{},Hm=o.H;
 const step=f===1?1:f===2?-1:0; // which leg is forward
 // ---- legs & shoes ----
 if(!side){
  const lift=[step===1?2:0,step===-1?2:0];
  [[10,0],[17,1]].forEach(([x,k])=>{const top=33,bot=41-lift[k];rect(x,top,5,bot-top,pants);rect(x+4,top,1,bot-top,pantsD);rect(x-(k?0:0),bot,5,3,shoe);rect(x,bot+2,5,1,shoeD);if(!back)set(x+1,bot,shade(shoe,.3))});
  rect(10,32,12,2,pantsD);
 }else{
  const sw=step*3;
  const leg=(x0,c,cd,sc)=>{rect(x0,33,5,8,c);rect(x0+4,33,1,8,cd);rect(x0-1,41,7,3,sc);rect(x0-1,43,7,1,shoeD)};
  leg(14-sw,pantsD,shade(pantsD,-.2),shoeD);leg(13+sw,pants,pantsD,shoe);
 }
 // ---- torso ----
 const bulk=P.bulk||0;
 if(!side){
  ellip(16,27,7.5+bulk*.6,7,shirt);rect(9-bulk,21,14+bulk*2,11,shirt);
  for(let y=21;y<33;y++){set(9-bulk,y,shirtD);set(22+bulk,y,shirtD)}rect(9-bulk,31,14+bulk*2,2,shirtD);
  if(bulk){rect(7-bulk,21,4,3,shade(shirt,.12));rect(21+bulk,21,4,3,shade(shirt,.12))}
  if(!back){rect(14,21,4,1,skinD);set(15,22,skinD);set(16,22,skinD)}
  if(P.z){for(let y=22;y<32;y++){set(11-bulk,y,P.z);set(20+bulk,y,P.z)}}
  if(P.k)for(let y=22;y<32;y++)for(let x=10-bulk;x<22+bulk;x++)if((x+y)%3===0&&get(x,y)===shirt)set(x,y,P.k);
  if(back&&o.num){ // jersey number on the back
   const n=o.num;rect(14,24,1,5,n);rect(17,24,1,5,n);rect(14,24,4,1,n);rect(14,28,4,1,n)}
 }else{
  ellip(16,27,6+bulk*.5,7,shirt);rect(11-bulk,21,10+bulk*2,11,shirt);for(let y=21;y<33;y++)set(20+bulk,y,shirtD);rect(11-bulk,31,10+bulk*2,2,shirtD);
  if(P.z)for(let y=22;y<32;y++)set(13,y,P.z);
  if(P.k)for(let y=22;y<32;y++)for(let x=11;x<21;x++)if((x+y)%3===0&&get(x,y)===shirt)set(x,y,P.k);
 }
 // ---- arms ----
 const armSwing=step*2;
 if(!side){
  for(const[x,s]of[[6-bulk,1],[23+bulk,-1]]){const dy=back?-armSwing*s:armSwing*s;rect(x,21+Math.max(0,dy),3,8,shirt);rect(x+(s>0?0:2),21,1,8,shirtD);rect(x,29+dy,3,3,skin);set(x+1,31+dy,skinD)}
 }else{
  const dx=-armSwing;rect(15+dx,22,4,7,shirt);rect(18+dx,22,1,7,shirtD);rect(15+dx,29,4,3,skin);rect(15+dx,31,4,1,skinD);
 }
 // ---- head ----
 const hcx=side?15:16,hcy=12;
 if(o.style==='long'&&!Hm){ // hair falling behind shoulders (drawn before the face)
  if(!side)ellip(16,19,10,8,hairD,(x,y)=>y>12);else ellip(19,18,6,8,hairD,(x,y)=>y>12)}
 ellip(hcx,hcy,9.5,9,skin);
 if(!side&&!back){set(6,13,skin);set(6,14,skinD);set(26,13,skin);set(26,14,skinD)}
 if(side){set(21,13,skin);set(21,14,skinD);set(5,13,skin)}
 // face
 if(!back){
  const eyes=side?[[8]]:[[10],[19]];
  for(const[ex]of eyes){rect(ex,12,3,4,'#2a1a14');set(ex,12,'#ffffff');set(ex+1,12,'#5a4a6a')}
  if(!side){set(9,16,'#e89a8a');set(10,16,'#e89a8a');set(21,16,'#e89a8a');set(22,16,'#e89a8a');set(15,17,'#9a4a3a');set(16,17,'#9a4a3a')}
  else{set(6,16,'#e89a8a');set(9,17,'#9a4a3a');set(5,14,skin);set(5,15,skinD)}
  if(o.fr){for(const[x,y]of(side?[[7,15],[10,15]]:[[11,16],[13,15],[18,15],[20,16]]))set(x,y,'#b5633a')}
  if(o.beard&&!Hm){if(!side){ellip(16,18.5,6,3.5,hair,(x,y)=>y>=16);set(15,17,shade(hair,-.4));set(16,17,shade(hair,-.4))}else ellip(11,18,5,3,hair,(x,y)=>y>=15)}
 }
 // ---- hair ----
 const hairPix=(x,y,c)=>set(x,y,c);
 if(!Hm){
  const st=o.style;
  const capBottom=back?20:st==='buzz'?7:side?10:9;
  const R=st==='puffy'?11.5:10.2;
  ellip(hcx,hcy-1,R,st==='puffy'?10.5:9.8,(x,y,a,b)=>b<-.45?hairL:hair,(x,y,a,b)=>{
   if(back)return y<=capBottom;
   if(side)return y<=capBottom||(x>=hcx+1&&y<=17);
   return y<=capBottom||((x<=8||x>=23)&&y<=(st==='buzz'?11:16))});
  if(!back&&st!=='buzz'){ // bangs
   const xs=side?[5,6,7,8,9,10,11,12,13,14]:[8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
   xs.forEach((x,i)=>{const d=(i%3===0)?2:(i%3===1?1:0);for(let k=0;k<d;k++)hairPix(x,capBottom+1+k,i%2?hair:hairD)})}
  if(st==='spiky')for(const x of(side?[8,12,16,20]:[8,12,16,20,24])){for(let k=0;k<4;k++){set(x,1-k+2,hair);set(x+1,1-k+3,hair)}set(x,-1+2,hairL)}
  if(st==='ponytail'){if(!side&&!back){ellip(26,10,2.5,3,hair);ellip(27,15,2,4,hairD)}else if(back)ellip(16,20,3,4,hair);else ellip(24,12,3,4,hair)}
  if(st==='long'&&back)rect(8,16,16,8,hair);
  if(st==='long'&&side)rect(17,16,6,8,hair);
  if(st==='puffy'&&!back){set(6,15,hairD);set(26,15,hairD)}
 }
 // ---- hat (townsfolk) ----
 if(o.hat&&!Hm){const hc=o.hat,hd=shade(hc,-.25),hl=shade(hc,.2);
  ellip(hcx,7,9.5,6,(x,y,a,b)=>b<-.3?hl:hc,(x,y)=>y<=8);
  if(!back){if(side)rect(1,8,12,2,hd);else rect(6,8,20,2,hd)}else rect(7,8,18,1,hd);
  if(!side)set(16,2,hl)}
 // ---- helmet (player gear) ----
 if(Hm){const hc=Hm.c,hd=shade(hc,-.25),hl=shade(hc,.25),hx=Hm.x||hl;
  ellip(hcx,hcy-1,11,10.5,(x,y,a,b)=>b<-.5?hl:a>.55?hd:hc,(x,y)=>back?y<=21:side?(y<=10||x>=hcx-1&&y<=18):(y<=10||((x<=8||x>=23)&&y<=18)));
  if(!Hm.crown){if(!side)rect(15,1,2,back?20:10,hx);else rect(6,2,13,2,hx)}
  if(Hm.crown){for(const x of[8,12,16,20,24]){rect(x,0,2,4,'#f5c542');set(x,0,'#fff0a0')}rect(6,3,20,2,hx)}
  if(Hm.visor&&!back){rect(side?5:9,12,side?7:15,3,'#22304a');rect(side?6:10,12,3,1,'#8fd0ff')}
  if(Hm.mask&&!back){const g='#c8ccd4';if(!side){rect(10,17,12,1,g);rect(10,19,12,1,g);set(10,18,g);set(15,18,g);set(16,18,g);set(21,18,g)}else{rect(3,16,8,1,g);rect(3,18,8,1,g);set(3,17,g)}}
  if(!back&&!side){rect(6,14,3,4,hd);rect(23,14,3,4,hd)}
 }
 // ---- outline + light ----
 const c=document.createElement('canvas');c.width=W;c.height=Hh;c.hd=2;const g=c.getContext('2d');
 const OL='#24160f';
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const v=get(x,y);
  if(v){let col=v;if(!get(x,y-1))col=shade(v,.14);else if(!get(x,y+1))col=shade(v,-.16);else if(!get(x+1,y)&&!side)col=shade(v,-.08);g.fillStyle=col;g.fillRect(x,y,1,1)}
  else if(get(x+1,y)||get(x-1,y)||get(x,y+1)||get(x,y-1)){g.fillStyle=OL;g.fillRect(x,y,1,1)}}
 return c}
function ccFlip(c){const f=document.createElement('canvas');f.width=c.width;f.height=c.height;f.hd=c.hd;const g=f.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);return f}
function ccSet(o){const out={};for(const d of['down','up','left']){out[d]=[0,1,2].map(f=>ccMake(o,d,f))}out.right=out.left.map(ccFlip);return out}
// cozy palette nudges: mute very saturated shirt colors a touch
const ccMute=c=>mix(c,'#6a5a48',.18);

makeCharSprites=(orig=>function(look){const npcs_=Object.keys(COZY_SHEETS).filter(k=>/^npc/.test(k));
 if(npcs_.length){const k=npcs_[hash(look.s.length+parseInt(look.t.slice(1),16),parseInt(look.h.slice(1),16))%npcs_.length];return COZY_SHEETS[k]}
 const hsh=hash(parseInt(look.t.slice(1),16),parseInt(look.p.slice(1),16));
 const style=look.style||CC_STYLES[hsh%CC_STYLES.length];
 const shoes=['#4a3020','#2a2420','#6a4a30','#3a3430'][hsh%4];
 return ccSet({skin:look.s,hair:look.h,style,shirt:ccMute(look.t),pants:look.p,shoes,hat:look.hat,fr:look.fr,beard:!look.hat&&style==='buzz'&&hsh%3===0})})(makeCharSprites);

makeBradySprites=function(eqIn,heroIn){if(COZY_SHEETS.hero)return COZY_SHEETS.hero;
 const eq=eqIn||(S&&S.equip)||{};const hero=heroIn||heroOf(S);const H=eq.helmet&&HELM_LOOK[eq.helmet],P=PAD_LOOK[eq.pads]||{t:'#4a6fb0'};
 return ccSet({skin:hero.skin,hair:hero.hair,style:hero.style,shirt:P.t,pants:'#3b4a6b',shoes:CLEAT_LOOK[eq.cleats]||'#e8e4dc',fr:hero.fr,H,P,num:P.z||'#ffffff'})};
// HUD + creator faces: crop the head of the new model
drawFace=function(){const c=$('#face'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(bradySpr.down[0],4,2,24,17,0,0,36,26)};
crRefresh=function(){if(!CR)return;const{h,spr}=crLook();CR.spr=spr;
 document.querySelectorAll('#creator [data-k]').forEach(b=>{const k=b.dataset.k,v=b.dataset.v;b.classList.toggle('on',k==='fr'?(v==='1')===h.fr:h[k]===v)});
 $('#crTag').textContent=h.name;
 [['crP1','down'],['crP2','right'],['crP3','up']].forEach(([id,d])=>{const g=$('#'+id).getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,42,42);const im=spr[d][0],s=42/im.height;g.drawImage(im,(42-im.width*s)/2,0,im.width*s,42)});
 const f=$('#crFace').getContext('2d');f.imageSmoothingEnabled=false;f.clearRect(0,0,42,30);f.drawImage(spr.down[0],4,2,24,17,0,0,42,30);crAnim(true)};
// Places that drew the old square sprite at a fixed size: draw the taller model with the right shape.
function ccFit(g,im,W,H){const s=H/im.height;g.drawImage(im,Math.round((W-im.width*s)/2),0,im.width*s,H)}
function ccPatch(fn,pairs){let src=fn.toString();for(const[a,b]of pairs){if(!src.includes(a)){console.warn('cozy patch miss',a);continue}src=src.split(a).join(b)}return eval('('+src+')')}
crAnim=ccPatch(crAnim,[["g.drawImage(CR.spr[d][fr],0,0,90,90)","ccFit(g,CR.spr[d][fr],90,90)"]]);
showTitle=ccPatch(showTitle,[["g.drawImage(tspr.right[0],0,0,72,72)","ccFit(g,tspr.right[0],72,72)"]]);
drawBattle=ccPatch(drawBattle,[
 ["ctx.translate(Math.round(56+pox+sh),70)","ctx.translate(Math.round(83-spW(bs)*1.5+pox+sh),126-spH(bs)*3)"],
 ["ctx.drawImage(bradyRed,Math.round(56+pox+sh),70,","ctx.drawImage(bradyRed,Math.round(83-spW(bs)*1.5+pox+sh),126-spH(bs)*3,"]]);
