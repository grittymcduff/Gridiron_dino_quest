// =====================================================================
//  HAND-DRAWN PLAYER WITH CUSTOMIZATION (bald, empty-handed base; the engine draws hair, eyes, items)
//  art/cozy/sprites/heroart.png       120 x 192, 3 x 4 frames of 40 x 48 (same layout as hero.png)
//  art/cozy/sprites/heroart_mask.png  same size; gray levels mark what may be recolored:
//      40 = hair, 80 = skin, 120 = shirt (uniform color), 160 = shorts (kept), 200 = shoes (cleat color)
//  art/cozy/sprites/helm_<helmet id>_<down|up|left>.png   helmet views (right = mirrored left)
//  Hair color, skin tone, freckles, uniform color/stripes/scales, cleat color and helmets all apply.
// =====================================================================
const CZH={sets:{},cache:{}};
// hair styles: g = volume beyond the skull, hairline heights (fraction of head height) front / sides / above ear / back
const CZ_HAIR={
 shaggy:{g:.10,front:.32,side:.55,ear:.40,back:.84,bangs:1,tufts:1},
 buzz:{g:.02,front:.24,side:.42,ear:.34,back:.80},
 spiky:{g:.06,front:.28,side:.50,ear:.38,back:.82,spikes:1},
 long:{g:.10,front:.30,side:.60,ear:.42,back:.90,bangs:1,long:1},
 puffy:{g:.26,front:.30,side:.58,ear:.42,back:.86},
 ponytail:{g:.04,front:.26,side:.48,ear:.36,back:.82,tail:1}};
// one art sheet per hair style is optional: heroart_<style>.png (+ _mask). Missing styles use heroart.png
function czHeroSet(style,K){const sfx=K>1?'_hi':'',ks='heroart_'+style+sfx;const k=style!=='bald'&&COZY_IMG[ks]&&COZY_IMG[ks+'_mask']?ks:'heroart'+sfx;
 const a=COZY_IMG[k],m=COZY_IMG[k+'_mask'];if(!a||!m)return null;if(CZH.sets[k])return CZH.sets[k];
 const src=a.getContext('2d').getImageData(0,0,a.width,a.height),mask=m.getContext('2d').getImageData(0,0,m.width,m.height);
 const S_=src.data,M=mask.data,sum=[0,0,0,0,0,0],n=[0,0,0,0,0,0];
 for(let i=0;i<S_.length/4;i++){if(S_[i*4+3]<128)continue;let r=Math.round(M[i*4]/40);const R_=S_[i*4],G_=S_[i*4+1],B_=S_[i*4+2];if(!r&&B_>R_+20&&B_>G_+12&&((i/a.width)|0)%(48*K)>24*K)r=4;if(r>0&&r<6){sum[r]+=czLum(S_[i*4],S_[i*4+1],S_[i*4+2]);n[r]++}}
 // outline color = the darkest opaque color in the art
 let oc=[0,0,0],ol=1e9;for(let i=0;i<S_.length/4;i++){if(S_[i*4+3]<128)continue;const l=S_[i*4]+S_[i*4+1]+S_[i*4+2];if(l<ol){ol=l;oc=[S_[i*4],S_[i*4+1],S_[i*4+2]]}}
 return CZH.sets[k]={key:k,styled:k!=='heroart'+sfx,src,mask,outc:oc,mean:sum.map((v,i)=>n[i]?v/n[i]:1)}}
function czHeroReady(){return!!czHeroSet('shaggy')}
function czCrisp(img,w,h,flip){w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';if(flip){g.translate(w,0);g.scale(-1,1)}g.drawImage(img,0,0,w,h);
 const d=g.getImageData(0,0,w,h);for(let i=3;i<d.data.length;i+=4)d.data[i]=d.data[i]>110?255:0;g.putImageData(d,0,0);return c}
const CZH_FW=40,CZH_FH=48,CZH_DIRS=['down','up','left','right'];
function czHeroBuild(eq,hero,K){K=K||1;const SET=czHeroSet(hero.style,K);if(!SET)return null;const CZH_FW=40*K,CZH_FH=48*K;
 // under a helmet (not the crown) a drawn hairstyle is replaced by the bald head, so nothing pokes out or leaves holes;
 // long hair and ponytails keep the part that hangs below the helmet (drawn behind the body)
 if(SET.styled&&eq.helmet&&eq.helmet!=='dinocrown'&&HELM_LOOK[eq.helmet]){
  const k2=['H',K,SET.key,hero.hair,hero.skin,hero.fr,eq.helmet,eq.pads,eq.cleats].join('|');if(CZH.cache[k2])return CZH.cache[k2];
  const bald=czHeroBuild(eq,Object.assign({},hero,{style:'bald'}),K);
  if(hero.style!=='long'&&hero.style!=='ponytail')return CZH.cache[k2]=bald;
  const eq0=Object.assign({},eq,{helmet:null}),hair=czHeroBuild(eq0,hero,K),probe=czHeroBuild(eq0,Object.assign({},hero,{hair:hero.hair.toLowerCase()==='#ff00ff'?'#00ffff':'#ff00ff'}),K),out={};
  for(const d of CZH_DIRS)out[d]=bald[d].map((bf,i)=>{const hf=hair[d][i],c=document.createElement('canvas');c.width=bf.width;c.height=bf.height;c.hd=bf.hd;c._head=bf._head;c._hand=bf._hand;
   const W2=c.width,H2=c.height,g=c.getContext('2d');g.drawImage(bf,0,0);const B_=g.getImageData(0,0,W2,H2),Hd=hf.getContext('2d').getImageData(0,0,W2,H2).data,Pd=probe[d][i].getContext('2d').getImageData(0,0,W2,H2).data,cut=bf._chin;
   // hair pixels = the ones that change with the hair color; plus the dark outline right around them
   const isHair=new Uint8Array(W2*H2);for(let j=0;j<W2*H2;j++)if(Hd[j*4+3]&&(Hd[j*4]!==Pd[j*4]||Hd[j*4+1]!==Pd[j*4+1]||Hd[j*4+2]!==Pd[j*4+2]))isHair[j]=1;
   const near=j=>{const x=j%W2,y=(j/W2)|0;for(let dy=-K;dy<=K;dy++)for(let dx=-K;dx<=K;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W2&&Y<H2&&isHair[Y*W2+X])return true}return false};
   for(let y=cut;y<H2;y++)for(let x=0;x<W2;x++){const j=y*W2+x,q=j*4;if(!Hd[q+3])continue;
    const take=isHair[j]||(Hd[q]+Hd[q+1]+Hd[q+2]<200&&near(j)&&(B_.data[q+3]===0||Math.abs(Hd[q]-B_.data[q])+Math.abs(Hd[q+1]-B_.data[q+1])+Math.abs(Hd[q+2]-B_.data[q+2])>30));
    if(take){B_.data[q]=Hd[q];B_.data[q+1]=Hd[q+1];B_.data[q+2]=Hd[q+2];B_.data[q+3]=255}}
   // pockets the merge left between hanging hair and the neck: fill from the hairstyle frame, else outline
   const E=B_.data,seen=new Uint8Array(W2*H2),stk=[];for(let x=0;x<W2;x++)stk.push(x,(H2-1)*W2+x);for(let y=0;y<H2;y++)stk.push(y*W2,y*W2+W2-1);
   while(stk.length){const j=stk.pop();if(seen[j]||E[j*4+3]>0)continue;seen[j]=1;const x=j%W2,y=(j/W2)|0;if(x>0)stk.push(j-1);if(x<W2-1)stk.push(j+1);if(y>0)stk.push(j-W2);if(y<H2-1)stk.push(j+W2)}
   for(let j=0;j<W2*H2;j++){if(E[j*4+3]>0||seen[j])continue;const q=j*4;if(Hd[q+3]){E[q]=Hd[q];E[q+1]=Hd[q+1];E[q+2]=Hd[q+2]}else{E[q]=36;E[q+1]=22;E[q+2]=15}E[q+3]=255}
   g.putImageData(B_,0,0);return c});
  return CZH.cache[k2]=out}
 const H=eq.helmet&&HELM_LOOK[eq.helmet]?eq.helmet:null,P=hero.shirt?{t:hero.shirt}:(PAD_LOOK[eq.pads]||{t:'#4a6fb0'});
 const key=[K,SET.key,hero.style,hero.hair,hero.skin,hero.fr,H,eq.pads,eq.cleats,hero.shirt,hero.pants,hero.shoes].join('|');if(CZH.cache[key])return CZH.cache[key];
 const tgt=[null,hero.hair,hero.skin,P.t,hero.pants||null,hero.shoes||CLEAT_LOOK[eq.cleats]||'#e8e4dc'];const OUTC=SET.outc;
 const W=SET.src.width,Ht=SET.src.height,S_=SET.src.data,M=SET.mask.data;
 const full=document.createElement('canvas');full.width=W;full.height=Ht;const fg=full.getContext('2d');const out=fg.createImageData(W,Ht),O=out.data;
 const role=new Uint8Array(W*Ht);
 for(let i=0;i<W*Ht;i++){const a=S_[i*4+3];if(a<128)continue;O[i*4+3]=255;let r=Math.round(M[i*4]/40);let R=S_[i*4],G=S_[i*4+1],B=S_[i*4+2];if(!r&&hero.pants&&B>R+20&&B>G+12&&((i/W)|0)%(48*K)>24*K)r=4;role[i]=r;
  if(r>0&&r<6&&tgt[r]){const[tr,tg,tb]=hexToRgb(tgt[r]),q=czLum(R,G,B)/Math.max(1,SET.mean[r]);
   if(q<=1){R=tr*q;G=tg*q;B=tb*q}else{const u=Math.min(1,(q-1)*.9);R=tr+(255-tr)*u;G=tg+(255-tg)*u;B=tb+(240-tb)*u}}
  O[i*4]=R;O[i*4+1]=G;O[i*4+2]=B}
 const out4={};
 CZH_DIRS.forEach((d,row)=>{out4[d]=[0,1,2].map(col=>{
  const x0=col*CZH_FW,y0=row*CZH_FH,at=(x,y)=>role[(y0+y)*W+x0+x],BM=czHeroSet('bald',K).mask.data,atB=(x,y)=>Math.round(BM[((y0+y)*W+x0+x)*4]/40);
  // ---- geometry of this frame (from the base: skin=2, shirt=3) ----
  let st=9999;for(let y=0;y<CZH_FH;y++)for(let x=0;x<CZH_FW;x++)if(atB(x,y)===3&&y<st)st=y;
  let hy0=9999;const rowW=[];for(let y=0;y<st;y++){let a=-1,b=-1;for(let x=0;x<CZH_FW;x++)if(atB(x,y)===2){if(a<0)a=x;b=x}rowW.push([a,b]);if(a>=0&&y<hy0)hy0=y}
  let wmax=0;for(let y=hy0;y<st;y++){const[a,b]=rowW[y];if(a>=0)wmax=Math.max(wmax,b-a+1)}
  let hb=hy0;for(let y=hy0;y<st;y++){const[a,b]=rowW[y];if(a>=0&&b-a+1>=wmax*.6)hb=y}
  const hh=hb-hy0+1,r30=rowW[Math.min(st-1,hy0+Math.round(hh*.3))],hcx=(r30[0]+r30[1]+1)/2,HR=(r30[1]-r30[0]+1)/2;
  const SG=d==='right'?1:d==='left'?-1:0;
  const setPx=(x,y,c,r)=>{if(x<0||y<0||x>=CZH_FW||y>=CZH_FH)return;const i=((y0+y)*W+x0+x)*4;O[i]=c[0];O[i+1]=c[1];O[i+2]=c[2];O[i+3]=255;role[(y0+y)*W+x0+x]=r};
  const alphaAt=(x,y)=>x<0||y<0||x>=CZH_FW||y>=CZH_FH?0:O[((y0+y)*W+x0+x)*4+3];
  // side-view eye (the base only has eyes on the front views)
  if(SG&&!SET.styled){const ex=Math.round(hcx+SG*HR*.5-(SG<0?K:0)),ey=Math.round(hy0+hh*.5);for(let a=0;a<K;a++)for(let b=0;b<2*K;b++)setPx(ex+a,ey+b,OUTC,0)}
  // freckles on the cheeks
  if(hero.fr&&d!=='up'){const pts=SG?[[.32,.72],[.55,.68]].map(([u,v])=>[hcx+SG*HR*u,hy0+hh*v]):[[-.5,.7],[-.3,.75],[.3,.75],[.5,.7]].map(([u,v])=>[hcx+HR*u,hy0+hh*v]);
   const fs=Math.max(1,K-1);for(const[fx,fy]of pts){const X=Math.round(fx),Y=Math.round(fy);for(let a=0;a<fs;a++)for(let b=0;b<fs;b++)if(at(X+a,Y+b)===2)setPx(X+a,Y+b,[168,85,46],2)}}
  // ---- hair, drawn by style ----
  const NOHAIR=SET.styled||hero.style==='bald'||!CZ_HAIR[hero.style];
  const STY=CZ_HAIR[hero.style]||CZ_HAIR.shaggy,hairC=hexToRgb(hero.hair),isH=new Uint8Array(CZH_FW*CZH_FH);
  const g=STY.g,cyc=hy0+hh*.5,RX=HR*(1+g)+.5,RY=hh*.5*(1+g)+.5;
  if(!NOHAIR)for(let y=Math.max(0,Math.floor(hy0-hh*.45));y<Math.min(CZH_FH,Math.ceil(hy0+hh*1.35));y++)for(let x=0;x<CZH_FW;x++){
   const u=(x+.5-hcx)/HR,v=(y+.5-hy0)/hh,uf=SG?u*SG:0,bx=Math.floor(x/K);let on=false,behind=false;
   const cap=((x+.5-hcx)/RX)**2+((y+.5-cyc)/RY)**2<=1;
   if(cap){let lim;const bang=STY.bangs&&bx%3===0?.07:0;
    if(d==='up')lim=STY.back;else if(SG){lim=uf>.3?STY.front+bang:uf>-.35?STY.ear:STY.back}else lim=Math.abs(u)<.72?STY.front+bang:STY.side;
    on=v<lim}
   if(!on&&STY.spikes&&v<.1){for(const k of(SG?[-.7,-.3,.1]:[-.6,-.2,.2,.6]))if(Math.abs(u-k*(SG||1))<.15*(v+.24)/.3&&v>-.24)on=true}
   if(!on&&STY.tufts&&v<.04&&v>-.07){for(const k of[-.35,.05,.4])if(Math.abs(u-k)<.1)on=true}
   if(!on&&STY.long){if(d==='down'){const au=Math.abs(u);if(au>.62&&au<1.12&&v>.3&&v<1.25-.9*Math.max(0,au-.86)-.5*Math.max(0,.72-au)){on=true;behind=true}}
    else if(d==='up'){if(Math.abs(u)<1.02&&v>.3&&v<1.25)on=true}else if(uf<-.05&&uf>-1.15&&v>.3&&v<1.25-.6*Math.max(0,-uf-.8)){on=true;behind=true}}
   if(!on&&STY.tail){if(d==='up'){if(Math.abs(u)<.28&&v>.6&&v<1.2)on=true}
    else if(SG){const a=(uf+1.02)/.3,b=(v-.66)/.3;if(a*a+b*b<=1){on=true;behind=true}}}
   if(!on)continue;
   const r=at(x,y),al=alphaAt(x,y);
   if(v>1.02||behind&&v>.55){if(!(al===0||r===3||(d==='up')))continue}   // below the head: only over background/shirt (or the back view)
   isH[y*CZH_FW+x]=1}
  for(let y=0;y<CZH_FH;y++)for(let x=0;x<CZH_FW;x++){if(!isH[y*CZH_FW+x])continue;
   const up=y>=K&&isH[(y-K)*CZH_FW+x],dn=y+K<CZH_FH&&isH[(y+K)*CZH_FW+x],u=(x+.5-hcx)/HR,tex=(hash(Math.floor(x/K),Math.floor(y/K)+(row*7))%6===0);
   let c=hairC;if(!up)c=hexToRgb(shade(hero.hair,(SG?u*SG<.2:u<.25)?.22:.1));else if(!dn)c=hexToRgb(shade(hero.hair,-.28));else if(tex)c=hexToRgb(shade(hero.hair,-.14));
   setPx(x,y,c,1)}
  for(let y=0;y<CZH_FH;y++)for(let x=0;x<CZH_FW;x++){if(isH[y*CZH_FW+x]||alphaAt(x,y))continue;
   if((x>0&&isH[y*CZH_FW+x-1])||(x<CZH_FW-1&&isH[y*CZH_FW+x+1])||(y>0&&isH[(y-1)*CZH_FW+x])||(y<CZH_FH-1&&isH[(y+1)*CZH_FW+x]))setPx(x,y,OUTC,0)}
  // head box (now with hair) for helmets and the portrait
  let hx0=9999,hx1=-1;let hyt=hy0;for(let y=0;y<st;y++)for(let x=0;x<CZH_FW;x++){if(atB(x,y)===2&&y<=hb){if(x<hx0)hx0=x;if(x>hx1)hx1=x}const r=at(x,y);if(r===1&&y<hyt)hyt=y}
  const hy0h=hy0,hairTop=hyt;
  // uniform details on the shirt: sleeve stripes / scale pattern
  const sx=[];for(let x=0;x<CZH_FW;x++)for(let y=st;y<CZH_FH;y++)if(at(x,y)===3){sx.push(x);break}
  const sx0=Math.min(...sx),sx1=Math.max(...sx),cx=(sx0+sx1)/2,half=(sx1-sx0)/2;
  for(let y=st;y<CZH_FH;y++)for(let x=0;x<CZH_FW;x++){if(at(x,y)!==3)continue;const i=((y0+y)*W+x0+x)*4;
   if(P.z&&y-st>=3*K&&y-st<5*K&&Math.abs(x-cx)>half*.55){const[a,b,c]=hexToRgb(P.z);O[i]=a;O[i+1]=b;O[i+2]=c}
   else if(P.k&&(Math.floor(x/K)+Math.floor(y/K))%3===0){const[a,b,c]=hexToRgb(P.k);O[i]=a;O[i+1]=b;O[i+2]=c}}
  // hand: lowest part of the chosen arm (skin below the shirt top, away from the head)
  let hand=null;{const lab=new Int32Array(CZH_FW*CZH_FH),comps=[];let n=0;
   for(let y=st+2*K;y<CZH_FH;y++)for(let x=0;x<CZH_FW;x++){if(at(x,y)!==2||lab[y*CZH_FW+x])continue;n++;const q=[[x,y]];lab[y*CZH_FW+x]=n;const pts=[];
    while(q.length){const[a,b]=q.pop();pts.push([a,b]);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=a+dx,Y=b+dy;if(X<0||Y<st+2*K||X>=CZH_FW||Y>=CZH_FH||lab[Y*CZH_FW+X]||at(X,Y)!==2)continue;lab[Y*CZH_FW+X]=n;q.push([X,Y])}}
    if(pts.length>=2*K*K)comps.push(pts)}
   const mx=c=>c.reduce((s,p)=>s+p[0],0)/c.length;
   if(comps.length){comps.sort((A,B)=>mx(A)-mx(B));const pick=d==='down'||d==='left'?comps[0]:comps[comps.length-1];
    const yb=Math.max(...pick.map(p=>p[1])),low=pick.filter(p=>p[1]>yb-2*K);hand=[low.reduce((s,p)=>s+p[0],0)/low.length,yb-K*.5]}}
  // padded frame: 8 px headroom (crown, helmet tops) and 2 px each side; feet stay on the bottom edge
  const PX=2*K,PY=8*K,FW2=CZH_FW+PX*2,FH2=CZH_FH+PY;
  const c=document.createElement('canvas');c.width=FW2;c.height=FH2;c.hd=2*K;c._head=[hx0+PX,hy0+PY,hx1+PX,st+PY];c._chin=hb+PY+K;if(hand)c._hand=[hand[0]+PX,hand[1]+PY];const cg=c.getContext('2d');
  cg.putImageData(out,-x0+PX,-y0+PY,x0,y0,CZH_FW,CZH_FH);
  if(H&&hx1>0){const img=COZY_IMG['helm_'+H+'_'+(d==='right'?'left':d)];if(img){
   const crown=H==='dinocrown',side=d==='left'||d==='right',headW=hx1-hx0+1;
   const hw=crown?headW*.85:headW*(side?1.22:1.12),hc=czCrisp(img,hw,img.height*hw/img.width,d==='right');
   const hxp=Math.round((hx0+hx1+1)/2-hc.width/2+(d==='left'?-K:d==='right'?K:0))+PX;
   const top=(crown?hairTop-Math.round(hc.height*.55)+(hairTop<hy0?Math.round(hc.height*.25):0):hy0-K)+PY;
   const HANGS=hero.style==='long'||hero.style==='ponytail';
   if(!crown){ // hide hair the helmet should cover, then any outline left floating where that hair was
    const fd=cg.getImageData(0,0,FW2,FH2),D=fd.data,hd=hc.getContext('2d').getImageData(0,0,hc.width,hc.height).data;
    // the helmet's overall shape: everything between its left and right edge on each row, so openings
    // (facemask, ear holes, the gap at the back) still show the hair and face behind them
    const span=[];for(let v=0;v<hc.height;v++){let a=-1,b=-1;for(let u=0;u<hc.width;u++)if(hd[(v*hc.width+u)*4+3]>0){if(a<0)a=u;b=u}span.push([a,b])}
    const covered=(x,y)=>{const u=x-hxp,v=y-top;if(v<0||v>=hc.height)return false;const[a,b]=span[v];return a>=0&&u>=a&&u<=b};
    const bandEnd=Math.min(FH2,top+Math.round(hc.height*(side?.95:.9)));
    for(let y=0;y<bandEnd;y++)for(let x=0;x<FW2;x++){const fx=x-PX,fy=y-PY;if(fx<0||fy<0||fx>=CZH_FW||fy>=CZH_FH)continue;
     if(at(fx,fy)===1&&!covered(x,y)&&(y<bandEnd-K||!HANGS))D[(y*FW2+x)*4+3]=0}
    if(!HANGS)for(let y=bandEnd;y<FH2;y++)for(let x=0;x<FW2;x++){const fx=x-PX,fy=y-PY;if(fx>=0&&fy>=0&&fx<CZH_FW&&fy<CZH_FH&&at(fx,fy)===1)D[(y*FW2+x)*4+3]=0}
    const isOut=i=>D[i+3]>0&&D[i]+D[i+1]+D[i+2]<200&&!(at((i/4%FW2)-PX,((i/4/FW2)|0)-PY)===2);   // dark outline-like pixels (not eyes on skin)
    for(let pass=0;pass<2;pass++)for(let y=0;y<(HANGS?bandEnd+K:Math.min(FH2,st+PY));y++)for(let x=0;x<FW2;x++){const i=(y*FW2+x)*4;if(!isOut(i))continue;let keep=false;
     for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=FW2||Y>=FH2)continue;const j=(Y*FW2+X)*4;if(D[j+3]>0&&!isOut(j)){keep=true;break}}
     if(!keep&&!covered(x,y))D[i+3]=0}
    cg.putImageData(fd,0,0)}
   cg.drawImage(hc,hxp,top);
   // fill any small enclosed gaps (e.g. between facemask bars and the face) with the darkest neighboring color
   const fd2=cg.getImageData(0,0,FW2,FH2),E=fd2.data,seen=new Uint8Array(FW2*FH2),stk=[];
   for(let x=0;x<FW2;x++)stk.push(x,(FH2-1)*FW2+x);for(let y=0;y<FH2;y++)stk.push(y*FW2,y*FW2+FW2-1);
   while(stk.length){const i=stk.pop();if(seen[i]||E[i*4+3]>0)continue;seen[i]=1;const x=i%FW2,y=(i/FW2)|0;if(x>0)stk.push(i-1);if(x<FW2-1)stk.push(i+1);if(y>0)stk.push(i-FW2);if(y<FH2-1)stk.push(i+FW2)}
   for(let pass=0;pass<3*K;pass++)for(let i=0;i<FW2*FH2;i++){if(E[i*4+3]>0||seen[i])continue;const x=i%FW2,y=(i/FW2)|0;let best=-1,bl=1e9;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=FW2||Y>=FH2)continue;const j=(Y*FW2+X)*4;if(E[j+3]===0)continue;const l=E[j]+E[j+1]+E[j+2];if(l<bl){bl=l;best=j}}
    if(best>=0){E[i*4]=E[best];E[i*4+1]=E[best+1];E[i*4+2]=E[best+2];E[i*4+3]=255}}
   cg.putImageData(fd2,0,0)}}
  return c})});
 return CZH.cache[key]=out4}
makeBradySprites=(orig=>function(eqIn,heroIn){if(COZY_SHEETS.hero)return COZY_SHEETS.hero;
 const eq=eqIn||(S&&S.equip)||{},hero=heroIn||heroOf(S);return czHeroBuild(eq,hero)||orig(eqIn,heroIn)})(makeBradySprites);
// HUD portrait + creator portrait: crop around the drawn face
function czFaceBox(spr){const f=spr&&spr.down&&spr.down[0];if(!f||!f._head)return[4,2,24,17];const[x0,y0,x1]=f._head,w=x1-x0+4;return[x0-2,y0,w,Math.round(w*26/36)]}
drawFace=function(){const c=$('#face'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);const[x,y,w,h]=czFaceBox(bradySpr);g.drawImage(bradySpr.down[0],x,y,w,h,0,0,36,26)};
crRefresh=ccPatch(crRefresh,[['f.drawImage(spr.down[0],4,2,24,17,0,0,42,30)','f.drawImage(spr.down[0],...czFaceBox(spr),0,0,42,30)']]);
// equipped item, carried in the OFF hand: drawn behind the body so only the part
// that sticks out past the silhouette shows (reads as "holding it", not a sticker)
function czOffhand(fr,dir){if(fr._off&&fr._off[2]===dir)return fr._off;const g=fr.getContext('2d'),W=fr.width,y=Math.min(fr.height-1,fr._hand[1]),d=g.getImageData(0,y,W,1).data;let x0=-1,x1=-1;
 for(let x=0;x<W;x++)if(d[x*4+3]>40){if(x0<0)x0=x;x1=x}if(x0<0)x0=x1=fr._hand[0];const k=fr.hd||1,out=1.5*k;
 let x;if(dir==='right')x=x1+.5*k;else if(dir==='left')x=x0-.5*k;else x=fr._hand[0]<(x0+x1)/2?x1+out*.6:x0-out*.6;
 return fr._off=[x,y-1*k,dir]}
// how each item is carried. Returns positions in the frame's own canvas pixels (u = canvas px per game px)
//   pocket  - penalty flags: tucked in the back pocket, cloth hanging out
//   neck    - whistle: on a lanyard around the neck, resting on the chest
//   offhand - everything else: in the far hand, behind the body
function czCarry(fr,dir,proj){const u=fr.hd||2,h=fr._head,cx=(h[0]+h[2])/2,ny=h[3];
 const row=y=>{const g=fr.getContext('2d'),d=g.getImageData(0,Math.max(0,Math.min(fr.height-1,Math.round(y))),fr.width,1).data;let a=-1,b=-1;for(let x=0;x<fr.width;x++)if(d[x*4+3]>40){if(a<0)a=x;b=x}return[a,b]};
 if(proj==='whistle'){const wy=ny+1.8*u;if(dir==='up')return{mode:'neck',front:true,noItem:true,lan:[[cx-1.5*u,ny+.5*u],[cx+1.5*u,ny+.5*u]]};
  if(dir==='down')return{mode:'neck',front:true,x:cx,y:wy,sz:.5,lan:[[cx-2*u,ny-1*u],[cx,wy-1.2*u],[cx+2*u,ny-1*u]]};
  const[a,b]=row(wy),fx=dir==='right'?b-.5*u:a+.5*u;return{mode:'neck',front:true,x:fx,y:wy,sz:.5,flip:dir==='left',lan:[[cx,ny-.5*u],[fx,wy-1*u]]}}
 if(proj==='yflag'||proj==='rflag'){const hy=fr._hand[1]-3*u,[a,b]=row(hy);
  if(dir==='up')return{mode:'pocket',front:true,x:cx+(fr._hand[0]<cx?-2:2)*u,y:hy,sz:.75,rot:true};
  if(dir==='down')return{mode:'pocket',front:false,x:fr._hand[0]<cx?b+1*u:a-1*u,y:hy,sz:.75,rot:true};
  return{mode:'pocket',front:false,x:dir==='right'?a-1*u:b+1*u,y:hy,sz:.75,rot:true,flip:dir==='right'}}
 const o=czOffhand(fr,dir);return{mode:'off',front:false,x:o[0],y:o[1],sz:1,flip:dir==='left'}}
// draw the carried item. X,Y = where the frame's top-left lands, sc = screen px per canvas px, S = full item size
function czCarryDraw(im,fr,dir,proj,X,Y,sc,S,front,sparkle){const c=czCarry(fr,dir,proj);if(!!c.front!==!!front)return;
 if(c.lan){ctx.strokeStyle='#26222e';ctx.lineWidth=Math.max(1,Math.round(sc*(fr.hd||2)*.6));ctx.beginPath();c.lan.forEach(([x,y],k)=>{const a=X+x*sc,b=Y+y*sc;k?ctx.lineTo(a,b):ctx.moveTo(a,b)});ctx.stroke()}
 if(c.noItem)return;const s=Math.max(4,Math.round(S*c.sz)),x=Math.round(X+c.x*sc),y=Math.round(Y+c.y*sc);
 ctx.save();ctx.translate(x,c.rot?y+s/2-s*.15:y);if(c.rot)ctx.rotate(Math.PI);if(c.flip)ctx.scale(-1,1);ctx.drawImage(im,-s/2,-s/2,s,s);ctx.restore();
 if(sparkle){ctx.fillStyle='#fff6c0';ctx.fillRect(x+s/2-1,y-s/2,1,1)}}
// map: called once behind the body (front=false) and once in front (front=true)
drawMiniWeapon=(orig=>function(px,py,dir,front){if(!COZY_IMG.heroart||COZY_SHEETS.hero)return front?orig(px,py,dir):undefined;const w=GEAR[S.equip.weapon];const im=w&&COZY_IMG['held_'+w.proj];
 const f=player.moving?czWalkF(player.anim):0,fr=bradySpr[dir]&&bradySpr[dir][f];if(!im||!fr||!fr._hand||!fr._head)return;
 const sx=Math.round(px-camX),sy=Math.round(py-camY),ox=sx+8-spW(fr)/2,oy=sy+15-spH(fr)-(f?1:0);
 czCarryDraw(im,fr,dir,w.proj,ox,oy,1/fr.hd,8,!!front,w.r>=4&&(frame>>3)%3===0)})(drawMiniWeapon);
// battle: the same, until it's thrown
function czBattleHeld(bs,X,Y,front){if(!bs||!bs._hand||!bs._head||!S)return;if(B&&B.anim&&B.anim.type==='atk')return;const w=GEAR[S.equip.weapon];const im=w&&COZY_IMG['held_'+w.proj];if(!im)return;
 czCarryDraw(im,bs,'right',w.proj,X,Y,spW(bs)*3/bs.width,16,!!front,false)}

// battle: a 3x-detail version of the same player, drawn 1:1 in the battle scene (same size on screen)
let bradyBattle=null;
function czBattleSpr(){if(COZY_SHEETS.hero||!S)return null;const k=JSON.stringify([S.equip,S.hero]);if(!bradyBattle||bradyBattle._k!==k){bradyBattle=czHeroBuild(S.equip||{},heroOf(S),3);if(bradyBattle){bradyBattle._k=k;bradyBattle._hero=1;bradyBattle._red=tint(bradyBattle.right[0],'#ff3030')}}return bradyBattle}
drawBattle=ccPatch(drawBattle,[["const bs=bradySpr.right[","const BB=czBattleSpr()||bradySpr,bs=BB.right["],["ctx.drawImage(bs,0,0,spW(bs)*3,spH(bs)*3);ctx.restore();","czBattleHeld(bs,0,0,false);ctx.drawImage(bs,0,0,spW(bs)*3,spH(bs)*3);czBattleHeld(bs,0,0,true);ctx.restore();"],["drawProj(GEAR[S.equip.weapon]?.proj||'ball',56+pox+44,70+38,0,true);","if(!BB._hero)drawProj(GEAR[S.equip.weapon]?.proj||'ball',56+pox+44,70+38,0,true);"],["ctx.drawImage(bradyRed,","ctx.drawImage(BB._red||bradyRed,"]]);
// "Bald" hairstyle option (the base with no hair)
if(!HERO_STYLES.some(s=>s[0]==='bald'))HERO_STYLES.push(['bald','Bald']);

// townspeople use the same model as the player: their own hairstyle, hair, skin, shirt and pants colors
const CZ_NPC_SHOES=['#e8e4dc','#3a2a20','#6a4a30','#2a2a2a','#c84a3a','#4a6fb0'];
makeCharSprites=(orig=>function(look){if(!COZY_IMG.heroart||!look)return orig(look);
 const sk=JSON.stringify(look);let h=0;for(let i=0;i<sk.length;i++)h=(h*31+sk.charCodeAt(i))>>>0;
 const styles=HERO_STYLES.map(s=>s[0]).filter(s=>s!=='bald'||true);let style=styles[h%styles.length];
 if(look.h==='#d8d8d8'&&h%3===0)style='bald';
 const out=czHeroBuild({},{style,hair:look.h,skin:look.s,fr:look.fr,shirt:typeof ccMute==='function'?ccMute(look.t):look.t,pants:look.p,shoes:CZ_NPC_SHOES[(h>>4)%CZ_NPC_SHOES.length]},1);
 return out||orig(look)})(makeCharSprites);

// Commissioner Spino is a Spinosaurus: his own "Sail-type" Dino-Dex entry, separate from the
// Dome-type family he shares under the hood. It's a bonus card and doesn't count toward the 8 types.
FAMN.sail='Sail-type';
function czDexFam(e){return e&&e.boss&&e.name==='Commissioner Spino'?'sail':e.fam}
startBattle=ccPatch(startBattle,[["S.dex[en.fam]||(S.dex[en.fam]=","S.dex[czDexFam(en)]||(S.dex[czDexFam(en)]="]]);
victory=ccPatch(victory,[["S.dex[e.fam].def++","(S.dex[czDexFam(e)]||(S.dex[czDexFam(e)]={seen:1,def:0})).def++"]]);
function czTypeCount(){return Object.keys(S.dex).filter(k=>k!=='sail').length}
renderMenu=ccPatch(renderMenu,[["Types: <b>${Object.keys(S.dex).length}/8</b>","Types: <b>${czTypeCount()}/8</b>"],["<div class=\"grid dex\">`+FAMS.map(","<div class=\"grid dex\">`+FAMS.concat(S.dex.sail?['sail']:[]).map("]]);
{const a=ACH.find(a=>a.id==='dex');if(a)a.c=()=>czTypeCount()>=8}
dexSpr=(orig=>function(f){if(f!=='sail')return orig(f);if(dexCache.sail)return dexCache.sail;const im=COZY_BOSS.commissioner_spino,ref=orig('rex');
 const c=document.createElement('canvas');c.width=ref.width;c.height=ref.height;if(ref.hd)c.hd=ref.hd;if(im){const g=c.getContext('2d'),s=Math.min(c.width/im.width,c.height/im.height);g.imageSmoothingEnabled=false;g.drawImage(im,(c.width-im.width*s)/2,c.height-im.height*s,im.width*s,im.height*s)}
 return dexCache.sail=c})(dexSpr);
