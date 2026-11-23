// =====================================================================
//  HAND-DRAWN DINOS (optional): art/cozy/sprites/dino_<family>.png
//  One 116 x 100 px picture per family, painted in KEY COLORS so every
//  dino can still get its own colors:
//    red    (#c00000 family) = body          -> pal.B
//    green  (#00c000 family) = belly / light -> pal.L
//    blue   (#0000c0 family) = accents        -> pal.P (plates, sails, crests)
//    yellow (#c0c000 family) = claws, horns, teeth -> pal.K
//  Lighter / darker versions of a key color become lighter / darker
//  versions of the dino's color. Every other color (outline, eyes,
//  white) is kept exactly as painted.
// =====================================================================
const CZ_DINO_W=116,CZ_DINO_H=100,CZ_DINO_FAMS=['rex','raptor','sauro','trike','stego','ankylo','ptero','spino'];
const CZ_KEY={B:'#c00000',L:'#00c000',P:'#0000c0',K:'#c0c000'};
const COZY_DINO={},COZY_DINO_MASK={}; // fam -> ImageData of the art / of its role mask
// dino art may be 116 x 100 (key colors or masked) or 232 x 200 (double detail, shown 1:1 in battle)
function czDinoSheet(name,im){const isMask=/_mask$/.test(name),fam=name.replace(/_mask$/,'');if(!CZ_DINO_FAMS.includes(fam))return;
 const big=im.width>=CZ_DINO_W*2,w=big?CZ_DINO_W*2:CZ_DINO_W,h=big?CZ_DINO_H*2:CZ_DINO_H;
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(im,0,0,w,h);
 (isMask?COZY_DINO_MASK:COZY_DINO)[fam]=g.getImageData(0,0,w,h)}
// which key a pixel belongs to (or null), and how much lighter/darker than the key's base it is
function czKeyOf(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx<40||(mx-mn)/mx<.45)return null;
 let h;const d=mx-mn;if(mx===r)h=((g-b)/d+6)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;
 const key=(h<30||h>=330)?'B':(h>=30&&h<90)?'K':(h>=90&&h<180)?'L':(h>=200&&h<280)?'P':null;if(!key)return null;
 const L=(mx+mn)/510,dl=L-.376;return{key,f:clamp(dl>0?dl*1.6:dl*2.6,-.8,.8)}}
const CZ_ROLE=[null,'B','L','P','K'];
const czLum=(r,g,b)=>.299*r+.587*g+.114*b;
function czDinoBuild(fam,pal,pattern,seed){pattern='none'; // detailed art: color variants only, no painted-on stripes/spots
 const src=COZY_DINO[fam],W=src.width,H=src.height,k2=W/CZ_DINO_W,mask=COZY_DINO_MASK[fam];
 const c=document.createElement('canvas');c.width=W;c.height=H;c.hd=2*k2;const g=c.getContext('2d');const out=g.createImageData(W,H),S_=src.data,O=out.data;
 const rr=mulberry32(seed||1);
 // role of every pixel: from the mask if there is one, else from key colors
 const role=new Uint8Array(W*H),shadeF=new Float32Array(W*H);
 for(let i=0;i<W*H;i++){if(S_[i*4+3]<128)continue;
  if(mask){role[i]=Math.round(mask.data[i*4]/60)}
  else{const k=czKeyOf(S_[i*4],S_[i*4+1],S_[i*4+2]);if(k){role[i]=CZ_ROLE.indexOf(k.key);shadeF[i]=k.f}}}
 // masked art: shading = each pixel's brightness against its role's average
 const mean=[0,0,0,0,0],cnt=[0,0,0,0,0];
 if(mask){for(let i=0;i<W*H;i++)if(role[i]){mean[role[i]]+=czLum(S_[i*4],S_[i*4+1],S_[i*4+2]);cnt[role[i]]++}for(let r=1;r<5;r++)mean[r]=cnt[r]?mean[r]/cnt[r]:1}
 const pat=new Uint8Array(W*H);
 if(pattern==='stripes'){for(let y=0;y<H*.78;y++)for(let x=0;x<W;x++)if(((x+Math.floor(y*.4))%(14*k2))<4*k2)pat[y*W+x]=1}
 else if(pattern==='vstripes'){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if((x%(10*k2))<4*k2)pat[y*W+x]=1}
 else if(pattern==='spots'){for(let n=0;n<14;n++){for(let t=0;t<40;t++){const x=(rr()*W)|0,y=(rr()*H)|0;if(role[y*W+x]!==1)continue;const rx=(2.6+rr()*2.4)*k2,ry=(2.4+rr()*2)*k2;
   for(let yy=Math.floor(y-ry);yy<=y+ry;yy++)for(let xx=Math.floor(x-rx);xx<=x+rx;xx++){const a=(xx-x)/rx,b=(yy-y)/ry;if(a*a+b*b<=1&&xx>=0&&yy>=0&&xx<W&&yy<H)pat[yy*W+xx]=1}break}}}
 for(let i=0;i<W*H;i++){const r=S_[i*4],gg=S_[i*4+1],b=S_[i*4+2],a=S_[i*4+3];if(a<128){O[i*4+3]=0;continue}O[i*4+3]=255;
  const ro=role[i];if(!ro){O[i*4]=r;O[i*4+1]=gg;O[i*4+2]=b;continue}
  const base=(ro===1&&pat[i])?pal.P:pal[CZ_ROLE[ro]];let R2,G2,B2;
  if(mask){const[tr,tg,tb]=hexToRgb(base),q=czLum(r,gg,b)/Math.max(1,mean[ro]);
   if(q<=1){R2=tr*q;G2=tg*q;B2=tb*q}else{const u=Math.min(1,(q-1)*.8);R2=tr+(255-tr)*u;G2=tg+(255-tg)*u;B2=tb+(240-tb)*u}}
  else[R2,G2,B2]=hexToRgb(shade(base,shadeF[i]));
  O[i*4]=R2;O[i*4+1]=G2;O[i*4+2]=B2}
 g.putImageData(out,0,0);return c}
// battle view is shown twice as big: one smoothing pass on top of 116 x 100 art (232 x 200 art is used as is)
function czDinoBattle(hi){const c=hi.hd>=4?hi:hdify(hi,'#24160f');c.bs=2;return c}
// keep every caller working: small (original-size) canvas, with the full art attached as ._hi
makeDino=(orig=>function(fam,pal,pattern,seed){if(!COZY_DINO[fam])return orig(fam,pal,pattern,seed);
 const hi=czDinoBuild(fam,pal,pattern,seed);const lo=document.createElement('canvas');lo.width=CZ_DINO_W/2;lo.height=CZ_DINO_H/2;
 const g=lo.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(hi,0,0,lo.width,lo.height);lo._hi=hi;return lo})(makeDino);
// template export: the built-in dino of a family, in key colors, at 116 x 100 (call cozyDinoTemplate('rex'))
function cozyDinoTemplate(fam){const saved=COZY_DINO[fam];delete COZY_DINO[fam];const raw=makeDino(fam,CZ_KEY,'none',3);if(saved)COZY_DINO[fam]=saved;return hdify(raw,'#24160f').toDataURL()}

// =====================================================================
//  ONE-OF-A-KIND BOSS ART (optional): art/cozy/sprites/boss_<name>.png
//  116 x 100 px, facing left, painted in FINAL colors (not recolored).
//  <name> is the boss's name in lower case with underscores,
//  e.g. boss_captain_longneck.png. Bosses without a file use their family art.
// =====================================================================
const COZY_BOSS={};
const czBossSlug=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
// 116 x 100 (shown 2x in battle) or 232 x 200 (double detail, shown 1:1 in battle); same world size either way
function czBossSheet(slug,im){const big=im.width>=CZ_DINO_W*2,w=big?CZ_DINO_W*2:CZ_DINO_W,h=big?CZ_DINO_H*2:CZ_DINO_H;
 const c=document.createElement('canvas');c.width=w;c.height=h;c.hd=big?4:2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,w,h);COZY_BOSS[slug]=c}
makeEnemy=(orig=>function(fam,lv,o={}){const e=orig(fam,lv,o);const art=o.name&&COZY_BOSS[czBossSlug(o.name)];
 if(art){e.spr=art.hd>=4?art:czDinoBattle(art);e.spr.bs=2;e.white=tint(e.spr,'#ffffff')}return e})(makeEnemy);
drawBossMap=(orig=>function(b){if(!b.spr){const art=COZY_BOSS[czBossSlug(b.def.name)];if(art)b.spr=art}return orig(b)})(drawBossMap);
// every named dino with a fixed look (for templates and the art list)
function czBossList(){const out=[];
 POIS.forEach(p=>{if(p.boss)out.push({group:p.boss.final||p.id==='champ'?'Final boss':'Head Coach',name:p.boss.name,fam:p.boss.fam,pal:p.boss.pal,pattern:p.boss.pattern,where:p.name,lv:p.boss.lv,map:true})});
 Object.entries(LEGENDS).forEach(([k,L])=>out.push({group:'Legendary coach',name:L.name,fam:L.fam,pal:L.pal,pattern:L.pattern,where:'Gold chest ('+GEAR[k].name+')',lv:22,map:false}));
 out.push({group:'Secret boss',name:GOAT.name,fam:GOAT.fam,pal:GOAT.pal,pattern:GOAT.pattern,where:'Secret island',lv:GOAT.lv,map:true});
 out.push({group:'Practice dummy',name:'Tackle Dummy-raptor',fam:'raptor',pal:{B:'#c8a060',L:'#f0e0c0',P:'#8a2a2a',K:'#f4f4f4'},pattern:'stripes',where:'Kickoff Town practice',lv:1,map:false});
 out.push({group:'Practice dummy',name:'Film Room Dummy-stego',fam:'stego',pal:{B:'#8a8a9a',L:'#d8d8e0',P:'#e8443a',K:'#f4f4f4'},pattern:'spots',where:'Film Room drills',lv:0,map:false});
 return out.map(b=>Object.assign(b,{file:'boss_'+czBossSlug(b.name)+'.png'}))}
function cozyBossTemplate(name){const b=czBossList().find(x=>x.name===name);const savedF=COZY_DINO[b.fam];delete COZY_DINO[b.fam];
 const raw=makeDino(b.fam,b.pal,b.pattern,7);if(savedF)COZY_DINO[b.fam]=savedF;return hdify(raw,'#24160f').toDataURL()}

// the dino that follows you: build it from the full art (half size, sharp) instead of the small Dex copy
const czMiniCache=new WeakMap();
dinoMini=(orig=>function(d){const f=dinoFull(d);if(!f._hi)return orig(d);if(czMiniCache.has(f))return czMiniCache.get(f);
 const hi=f._hi,w=hi.width/2,h=hi.height/2,l=document.createElement('canvas');l.width=w;l.height=h;l.hd=hi.hd;
 const g=l.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(hi,0,0,w,h);
 const r=document.createElement('canvas');r.width=w;r.height=h;r.hd=l.hd;const rg=r.getContext('2d');rg.translate(w,0);rg.scale(-1,1);rg.drawImage(l,0,0);
 const m={l,r,_hd:1};czMiniCache.set(f,m);return m})(dinoMini);

// the spino slot now holds the dome-headed dino (Commissioner Spino keeps his own boss art)
FAMN.spino='Dome-type';
SUF.spino=['ocephalus','odome','dome'];   // e.g. Blitzocephalus, Puntodome, Snapdome
