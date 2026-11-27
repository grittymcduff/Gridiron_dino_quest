// ===================== YOUR HOUSE =====================
// The blue house in Kickoff Plains is yours. Inside: trophy shelf, a photo wall of dinos you've met, a fish tank,
// a stats board, and decor bought with coins. Friends online in your room can visit: your game sends them a
// snapshot of your house over the room connection (nothing is stored on a server).

// ---- dino photos: remember the dinos you meet (newest first, bosses and golden ones kept) ----
startBattle=(orig=>function(en,opts){const r=orig.apply(this,arguments);try{if(S&&en&&en.fam&&!(opts&&(opts.practice||opts.drill))){S.photos=S.photos||[];
 if(!S.photos.some(p=>p.n===en.name)){S.photos.unshift({f:en.fam,p:en.pal,pt:en.pattern||'none',n:en.name,lv:en.lv,b:en.boss?1:0,g:/^Golden /.test(en.name)?1:0});
  if(S.photos.length>40){const i=S.photos.map((p,k)=>[p,k]).reverse().find(([p])=>!p.b&&!p.g);S.photos.splice(i?i[1]:S.photos.length-1,1)}}}}catch(e){}return r})(startBattle);

// ---- decor shop (coins) ----
const CZ_DECOR={
 rug:{n:'Team Rug',p:150,i:'🟥',d:'A big striped rug for the middle of the room.'},
 plant:{n:'Potted Fern',p:80,i:'🪴',d:'A leafy plant for the corner.'},
 lamp:{n:'Floor Lamp',p:120,i:'💡',d:'Warm light for cozy nights.'},
 pennants:{n:'Team Pennants',p:100,i:'🚩',d:'A string of pennants along the wall.'},
 couch:{n:'Comfy Couch',p:300,i:'🛋️',d:'Perfect for watching film.'},
 plush:{n:'Rex Plushie',p:250,i:'🦖',d:'A giant stuffed T. rex.'},
 jersey:{n:'Framed Jersey',p:400,i:'👕',d:'Your jersey, framed on the wall.'},
 tv:{n:'Big-Screen TV',p:600,i:'📺',d:'Game day on the big screen.'},
 arcade:{n:'Retro Arcade',p:900,i:'🕹️',d:'An old-school football arcade cabinet.'},
};
const CZ_WALLS={cream:{n:'Cream',p:0,c:['#efe1c4','#e4d3b2']},sky:{n:'Sky Blue',p:60,c:['#bcd8ee','#a8c8e2']},mint:{n:'Mint',p:60,c:['#cdebd4','#b8dcc2']},red:{n:'Team Red',p:60,c:['#e8b0a4','#dc9c90']},navy:{n:'Night Navy',p:80,c:['#4a5a86','#404f78']}};
const CZ_FLOORS={oak:{n:'Oak',p:0,c:['#b07a45','#9a6838']},cherry:{n:'Cherry',p:80,c:['#8a4a32','#7a3e2a']},turf:{n:'Football Turf',p:250,c:['#43a047','#3b8f3f']}};
function czHS(){return S.house||(S.house={own:{},wall:'cream',floor:'oak',walls:{cream:1},floors:{oak:1}})}

// ---- a snapshot of a house (used for your own house too, so visiting looks exactly the same) ----
function czHouseSnap(){const h=czHS(),f=S.fish||{log:{}};
 return{v:1,name:NM(),look:czMyLook(),lv:S.lv,tro:S.trophies.slice(),ch:!!S.champion,
  ph:czPhotoPick(),dex:Object.keys(S.dex),gear:[...new Set(S.gear)],
  fish:Object.fromEntries(Object.entries(f.log).map(([k,v])=>[k,v.best])),
  st:{ans:S.st.ans,cor:S.st.cor,best:S.st.best,battles:S.st.battles,wins:S.st.wins,cat:S.st.cat,fish:S.st.fish||0,locked:S.st.locked||0},
  ach:Object.keys(S.ach||{}).length,achN:ACH.length,sk:S.sk||null,
  house:{own:h.own,wall:h.wall,floor:h.floor},day:typeof czDay==='function'?czDay():0}}

// ---- the room picture ----
const CZ_HV={data:null,mine:true,tab:'trophy',raf:0,t0:0,fishes:[]};
const CZ_PHOTO={};
function czPhotoCanvas(p){const k=p.n+'|'+p.f;if(CZ_PHOTO[k])return CZ_PHOTO[k];let c=null;try{c=makeDino(p.f,p.p||{B:'#7a9',L:'#cdb',P:'#354',K:'#fff'},p.pt||'none',5)}catch(e){try{c=dexSpr(p.f)}catch(e2){}}return CZ_PHOTO[k]=c}
function czRoomDraw(){const cv=$('#czHouseCv');if(!cv||!CZ_HV.data)return;const g=cv.getContext('2d'),W=cv.width,H=cv.height,d=CZ_HV.data,hs=d.house||{own:{}},own=hs.own||{},t=(performance.now()-CZ_HV.t0)/1000;g.imageSmoothingEnabled=false;
 const R_=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0)},O='#2a1a12';
 const wall=(CZ_WALLS[hs.wall]||CZ_WALLS.cream).c,floor=(CZ_FLOORS[hs.floor]||CZ_FLOORS.oak).c,FY=134;
 // wall + stripes + wainscot
 R_(0,0,W,FY,wall[0]);for(let x=0;x<W;x+=12)R_(x,0,6,FY-30,wall[1]);R_(0,FY-30,W,30,'#8a5a34');R_(0,FY-31,W,2,'#a8743f');for(let x=4;x<W;x+=24)R_(x,FY-26,18,22,'#7a4e2c');R_(0,FY-2,W,2,O);
 // floor
 if(hs.floor==='turf'){R_(0,FY,W,H-FY,floor[0]);for(let x=10;x<W;x+=40)R_(x,FY,2,H-FY,'#e8f0e0');for(let x=30;x<W;x+=40)for(let y=FY+6;y<H;y+=10)R_(x,y,4,1,'#cfe6c8')}
 else{for(let y=FY;y<H;y+=8){R_(0,y,W,8,(y/8|0)%2?floor[0]:floor[1]);for(let x=((y/8|0)%2)*30;x<W;x+=60)R_(x,y,1,8,'rgba(0,0,0,.25)')}}
 // window with sky
 const L=lightLevel(),night=L.dark>.45;R_(120,10,44,34,O);R_(122,12,40,30,night?'#1c2450':'#9fd0f8');if(night){R_(150,16,4,4,'#fff6c8');R_(130,30,1,1,'#fff');R_(140,20,1,1,'#fff')}else{R_(128,30,14,6,'#fff');R_(132,27,8,4,'#fff')}R_(141,12,2,30,O);R_(122,26,40,2,O);
 // pennants
 if(own.pennants){const cols=['#e8443a','#2f6fd6','#f5c542','#2e9e50','#9b40c6','#e8900c'];g.strokeStyle=O;g.beginPath();g.moveTo(4,6);g.quadraticCurveTo(W/2,20,W-4,6);g.stroke();for(let i=0;i<14;i++){const x=10+i*(W-20)/13,y=6+Math.sin(i/13*Math.PI)*10;g.fillStyle=cols[i%6];g.beginPath();g.moveTo(x-4,y);g.lineTo(x+4,y);g.lineTo(x,y+9);g.fill()}}
 // trophy shelf (left)
 R_(8,42,86,3,O);R_(8,74,86,3,O);R_(9,42,84,2,'#a8743f');R_(9,74,84,2,'#a8743f');
 const tros=POIS.filter(p=>p.boss&&p.id!=='champ').map(p=>p.boss.trophy);
 tros.slice(0,6).forEach((tn,i)=>{const x=14+(i%3)*28,y=(i<3?42:74),got=d.tro.includes(tn);if(got){R_(x+5,y-20,12,2,O);R_(x+4,y-18,14,8,O);R_(x+5,y-18,12,7,'#f5c542');R_(x+6,y-17,3,5,'#fff2b0');R_(x+9,y-10,4,5,O);R_(x+10,y-10,2,5,'#d8a020');R_(x+6,y-5,10,4,O);R_(x+7,y-4,8,2,'#d8a020');R_(x+1,y-15,3,5,O);R_(x+18,y-15,3,5,O)}
  else{g.strokeStyle='rgba(42,26,18,.25)';g.setLineDash([2,2]);g.strokeRect(x+5.5,y-18.5,11,13);g.setLineDash([])}});
 // championship trophy on the floor
 if(d.ch){const x=12,y=FY+2;R_(x+6,y-36,20,22,O);R_(x+7,y-35,18,20,'#f5c542');R_(x+9,y-33,5,14,'#fff2b0');R_(x+13,y-14,6,8,O);R_(x+14,y-14,4,8,'#d8a020');R_(x+4,y-6,24,6,O);R_(x+5,y-5,22,4,'#8a5a34');R_(x+2,y-30,4,10,O);R_(x+26,y-30,4,10,O)}
 // photo wall (center)
 const ph=(d.ph&&d.ph.length?d.ph:(d.dex||[]).map(f=>({f,n:f,dex:1}))).slice(0,8);
 ph.forEach((p,i)=>{const x=104+(i%4)*26+(i%2),y=50+((i/4)|0)*36+((i*7)%3);const gold=p.b||p.g;R_(x-1,y-1,24,30,O);R_(x,y,22,28,gold?'#f5c542':'#fbf7ee');R_(x+2,y+2,18,18,'#cfe6f0');
  const c=p.dex?dexSpr(p.f):czPhotoCanvas(p);if(c){const s=Math.min(18/c.width,18/c.height);const w=c.width*s,h=c.height*s;g.drawImage(c,x+2+(18-w)/2,y+20-h,w,h)}R_(x+10,y-3,2,3,'#e8443a')});
 if(!ph.length){g.fillStyle='rgba(42,26,18,.5)';g.font='7px monospace';g.fillText('Meet dinos to fill',108,70);g.fillText('your photo wall!',110,80)}
 // framed jersey
 if(own.jersey){R_(186,12,26,30,O);R_(188,14,22,26,'#fbf7ee');const tc=(d.look&&d.look.eq&&d.look.eq.pads)?'#2f6fd6':'#2f6fd6';R_(192,18,14,16,tc);R_(189,18,4,6,tc);R_(205,18,4,6,tc);g.fillStyle='#fff';g.font='bold 8px monospace';g.fillText('#'+(d.lv||1),193,30)}
 // fish tank on a cabinet (right)
 const TX=222,TY=56,TW=86,TH=48;R_(TX-2,TY+TH,TW+4,30,O);R_(TX-1,TY+TH+1,TW+2,28,'#8a5a34');R_(TX+6,TY+TH+6,TW-12,2,'#6a4428');R_(TX+6,TY+TH+16,TW-12,2,'#6a4428');
 R_(TX-2,TY-2,TW+4,TH+4,O);R_(TX,TY,TW,TH,'#4a9ad8');R_(TX,TY,TW,6,'#7ab8e8');R_(TX,TY+TH-6,TW,6,'#e8d690');R_(TX+8,TY+TH-18,2,12,'#2e9e50');R_(TX+11,TY+TH-14,2,8,'#3cb85a');R_(TX+TW-14,TY+TH-16,2,10,'#2e9e50');
 const fk=Object.keys(d.fish||{});
 fk.slice(0,8).forEach((id,i)=>{const sp=CZ_FISH_SP.find(s=>s.id===id);if(!sp)return;const img=CZ_FISH_IMG['cv_'+id]||(CZ_FISH_IMG['cv_'+id]=czFishCanvas(sp,false));const sp_=.25+((i*37)%10)/20,ph_=i*1.7;
  const fx=TX+4+((Math.sin(t*sp_+ph_)+1)/2)*(TW-30),fy=TY+10+((i*11)%26)+Math.sin(t*1.3+i)*2,dir=Math.cos(t*sp_+ph_)>0;g.save();if(!dir){g.translate(fx+13,0);g.scale(-1,1);g.translate(-fx-13,0)}g.drawImage(img,fx,fy);g.restore()});
 for(let i=0;i<4;i++){const by=TY+TH-8-((t*14+i*13)%(TH-12));R_(TX+TW-22+((i*5)%9),by,2,2,'rgba(255,255,255,.7)')}
 if(!fk.length){g.fillStyle='rgba(255,255,255,.85)';g.font='7px monospace';g.textAlign='center';g.fillText('Catch fish to',TX+TW/2,TY+24);g.fillText('fill the tank!',TX+TW/2,TY+33);g.textAlign='left'}
 g.strokeStyle='rgba(255,255,255,.35)';g.beginPath();g.moveTo(TX+4,TY+8);g.lineTo(TX+12,TY+40);g.stroke();
 // decor on the floor
 if(own.tv){const x=62,y=FY-50;R_(x+18,y+28,8,8,O);R_(x+10,y+34,24,3,O);R_(x,y,44,30,O);R_(x+2,y+2,40,26,(t*2|0)%2?'#2f8a3a':'#2e9e50');R_(x+12,y+12,20,2,'#fff');R_(x+20,y+8,4,10,'#e8f0e0')}
 if(own.rug){R_(96,FY+18,120,24,O);R_(98,FY+20,116,20,'#b8452f');for(let x=100;x<212;x+=12)R_(x,FY+20,6,20,'#d8604a');R_(98,FY+28,116,4,'#f5c542')}
 if(own.couch){R_(60,FY-8,56,26,O);R_(62,FY-6,52,10,'#4a6aa8');R_(62,FY+4,52,10,'#3a5a98');R_(58,FY-2,8,20,O);R_(59,FY-1,6,18,'#4a6aa8');R_(110,FY-2,8,20,O);R_(111,FY-1,6,18,'#4a6aa8')}
 if(own.plant){R_(W-20,FY-6,14,14,O);R_(W-19,FY-5,12,12,'#c8643a');for(let i=0;i<5;i++)R_(W-24+i*4,FY-22+((i*5)%7),4,16,'#2e9e50')}
 if(own.lamp){R_(214,FY-46,2,50,O);R_(206,FY-56,18,12,O);R_(207,FY-55,16,10,'#f5e0a0');if(night){g.fillStyle='rgba(255,230,150,.18)';g.beginPath();g.arc(215,FY-30,40,0,Math.PI*2);g.fill()}}

 if(own.arcade){const x=W-48;R_(x,FY-50,26,58,O);R_(x+1,FY-49,24,56,'#9b40c6');R_(x+4,FY-44,18,14,'#1a1230');R_(x+6,FY-40,4,2,'#f5c542');R_(x+12,FY-36,6,2,'#3ccf5a');R_(x+4,FY-26,18,6,'#7a2aa0');R_(x+8,FY-25,2,3,'#e8443a')}
 if(own.plush){const x=172,y=FY+6;R_(x,y-18,20,18,O);R_(x+1,y-17,18,16,'#3cb85a');R_(x+12,y-24,10,10,O);R_(x+13,y-23,8,8,'#3cb85a');R_(x+18,y-21,2,2,O);R_(x-4,y-8,6,4,'#3cb85a')}
 // the owner
 try{const spr=czPeerSprites(d.look);const fr=spr&&spr.down&&spr.down[0];if(fr){const s=1.5;g.drawImage(fr,150-fr.width*s/2,FY+28-fr.height*s,fr.width*s,fr.height*s)}}catch(e){}
 // name plate
 g.fillStyle=O;g.fillRect(4,4,92,14);g.fillStyle='#fbf1dc';g.fillRect(5,5,90,12);g.fillStyle=O;g.font='bold 8px monospace';g.fillText((d.name||'Brady').slice(0,12)+"'s House",9,14)}
function czRoomLoop(){if(!CZ_HV.data){CZ_HV.raf=0;return}czRoomDraw();CZ_HV.raf=requestAnimationFrame(czRoomLoop)}

// ---- the panel ----
function czHouseOpen(data,mine){CZ_HV.data=data;CZ_HV.mine=mine;CZ_HV.tab='trophy';CZ_HV.t0=performance.now();state='house';
 let d=$('#czHouse');if(!d){d=document.createElement('div');d.id='czHouse';d.innerHTML='<div class="box"><div class="hh"></div><canvas id="czHouseCv" width="320" height="180"></canvas><div class="tabs"></div><div class="body"></div></div>';document.body.appendChild(d)}
 d.style.display='flex';czHouseRender();if(!CZ_HV.raf)czRoomLoop();SFX.blip&&SFX.blip()}
function czHouseClose(){CZ_HV.data=null;const d=$('#czHouse');if(d)d.style.display='none';if(state==='house')state='world';updHud()}
function czHouseTab(t){CZ_HV.tab=t;czHouseRender()}
function czHouseRender(){const d=CZ_HV.data,box=$('#czHouse .box');if(!d||!box)return;const mine=CZ_HV.mine;
 box.querySelector('.hh').innerHTML=`<b>🏠 ${mine?'Your house':czCloudEsc(d.name)+'\'s house'}</b> <small>Lv ${d.lv} · 🏆 ${d.tro.length}/6${d.ch?' · 👑 Champion':''}</small><button onclick="czHouseClose()">✕ Leave</button>`;
 const tabs=[['trophy','🏆 Trophy Case'],['photos','🦖 Photo Wall'],['fish','🐟 Aquarium'],['stats','📊 Stats']];if(mine)tabs.push(['decor','🛋️ Decorate']);
 box.querySelector('.tabs').innerHTML=tabs.map(([k,n])=>`<button class="${CZ_HV.tab===k?'on':''}" onclick="czHouseTab('${k}')">${n}</button>`).join('');
 const b=box.querySelector('.body');let h='';
 if(CZ_HV.tab==='trophy'){const tros=POIS.filter(p=>p.boss&&p.id!=='champ');
  h=`<div class="tro">${tros.map(p=>{const got=d.tro.includes(p.boss.trophy);return`<div class="${got?'':'un'}">${got?'🏆':'▫️'} <b>${got?p.boss.trophy:'???'}</b><br><small>${p.name}</small></div>`}).join('')}${d.ch?'<div>👑 <b>Champion</b><br><small>Beat Commissioner Spino</small></div>':''}</div>`;
  const all=Object.keys(GEAR),have=new Set(d.gear);h+=`<h4>Gear collection (${all.filter(k=>have.has(k)).length}/${all.length})</h4><div class="gearwall">${all.sort((a,b)=>GEAR[a].r-GEAR[b].r).map(k=>{const g=GEAR[k],got=have.has(k);return`<div class="gw${got?'':' un'}" title="${got?g.name+' ['+RAR[g.r].n+']':'Not found yet'}" style="border-color:${got?RAR[g.r].c:'#c8b89a'}">${czIc(g)}</div>`}).join('')}</div>`}
 else if(CZ_HV.tab==='photos'){const ph=d.ph||[];h=ph.length?`<div class="photos">${ph.map((p,i)=>`<div class="pol${p.b||p.g?' gold':''}"><canvas data-i="${i}" width="64" height="52"></canvas><b>${czCloudEsc(p.n)}</b><small>Lv ${p.lv||'?'}${p.b?' · Boss':''}${p.g?' · ✨ Golden':''}</small></div>`).join('')}</div>`:`<p>No photos yet. Every new dino ${mine?'you meet':'they meet'} gets a photo here.</p>`}
 else if(CZ_HV.tab==='fish'){const ks=Object.keys(d.fish||{});h=`<p>${ks.length}/${CZ_FISH_SP.length} kinds of fish caught.</p><div class="czjour">${CZ_FISH_SP.map(sp=>{const best=d.fish&&d.fish[sp.id];return`<div class="jr${best?'':' un'}">${czFishIc(sp,!best)}<div><b>${best?sp.n:'???'}</b><br><small>${best?'Biggest: '+best+'"':'Not caught yet'}</small></div></div>`}).join('')}</div>`}
 else if(CZ_HV.tab==='stats'){const s=d.st||{},acc=s.ans?Math.round(s.cor/s.ans*100):0;
  h=`<div class="statgrid"><div><b>${acc}%</b><small>accuracy</small></div><div><b>${s.ans||0}</b><small>questions</small></div><div><b>${s.best||0}</b><small>best streak</small></div><div><b>${s.wins||0}</b><small>dinos out-coached</small></div><div><b>${(d.dex||[]).length}/8</b><small>dino types</small></div><div><b>${s.fish||0}</b><small>fish caught</small></div><div><b>${d.ach}/${d.achN}</b><small>awards</small></div><div><b>${s.locked||0}</b><small>questions locked in</small></div></div>`+
   `<div class="catbars">`+Object.keys(CATS).map(k=>{const c=(s.cat&&s.cat[k])||[0,0],p=c[0]?Math.round(c[1]/c[0]*100):0,lvl=d.sk&&d.sk[k]!=null?czSkName(d.sk[k]):'';return`<div class="cb"><span>${CATS[k].name}</span><div class="bar"><i style="width:${p}%;background:${CATS[k].c}"></i></div><small>${p}%${lvl?' · '+lvl:''}</small></div>`}).join('')+'</div>'}
 else if(CZ_HV.tab==='decor'&&mine){const hs=czHS();
  h=`<p class="coins">🪙 ${S.coins}</p><div class="grid">`+Object.entries(CZ_DECOR).map(([k,o])=>{const have=!!hs.own[k];return`<div class="card"><div class="ic">${o.i}</div><div><b>${o.n}</b><br><small>${o.d}</small></div>${have?`<button onclick="czDecorToggle('${k}')">${hs.own[k]===2?'Put out':'Put away'}</button>`:`<button ${S.coins>=o.p?'':'disabled'} onclick="czDecorBuy('${k}')">${o.p}🪙</button>`}</div>`}).join('')+'</div>'+
   `<h4>Walls</h4><div class="czsw">${Object.entries(CZ_WALLS).map(([k,o])=>czSwatch('wall',k,o)).join('')}</div><h4>Floor</h4><div class="czsw">${Object.entries(CZ_FLOORS).map(([k,o])=>czSwatch('floor',k,o)).join('')}</div>`}
 b.innerHTML=h;
 if(CZ_HV.tab==='photos')b.querySelectorAll('canvas[data-i]').forEach(c=>{const p=d.ph[+c.dataset.i],img=czPhotoCanvas(p);if(!img)return;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const s=Math.min(60/img.width,48/img.height);g.drawImage(img,(64-img.width*s)/2,50-img.height*s,img.width*s,img.height*s)})}
function czSwatch(kind,k,o){const hs=czHS(),have=kind==='wall'?hs.walls[k]:hs.floors[k],on=(kind==='wall'?hs.wall:hs.floor)===k;
 return`<button class="${on?'on':''}" onclick="czDecorStyle('${kind}','${k}')"><i style="background:linear-gradient(90deg,${o.c[0]} 50%,${o.c[1]} 50%)"></i>${o.n}${have?'':' · '+o.p+'🪙'}</button>`}
function czDecorBuy(k){const o=CZ_DECOR[k],hs=czHS();if(!o||hs.own[k]||S.coins<o.p)return;S.coins-=o.p;hs.own[k]=1;S.st.decor=(S.st.decor||0)+1;SFX.item&&SFX.item();czHouseRefresh()}
function czDecorToggle(k){const hs=czHS();if(!hs.own[k])return;hs.own[k]=hs.own[k]===2?1:2;czHouseRefresh()}
function czDecorStyle(kind,k){const hs=czHS(),cat=kind==='wall'?CZ_WALLS:CZ_FLOORS,bag=kind==='wall'?hs.walls:hs.floors,o=cat[k];if(!o)return;
 if(!bag[k]){if(S.coins<o.p)return;S.coins-=o.p;bag[k]=1;SFX.item&&SFX.item()}if(kind==='wall')hs.wall=k;else hs.floor=k;czHouseRefresh()}
function czHouseRefresh(){const d=czHouseSnap();d.house.own=Object.fromEntries(Object.entries(czHS().own).filter(([k,v])=>v===1));CZ_HV.data=d;updHud();czHouseRender();saveGame(true)}
// decor that's "put away" (2) isn't shown
const czSnapBase=czHouseSnap;czHouseSnap=function(){const s=czSnapBase();s.house.own=Object.fromEntries(Object.entries(s.house.own||{}).filter(([k,v])=>v===1));return s};

// ---- going in: your house, or a friend's ----

// ---- bosses and golden dinos stay on the wall; bosses beaten before photos existed get theirs added ----
function czPhotoBackfill(){if(!S)return;S.photos=S.photos||[];const have=new Set(S.photos.map(p=>p.n)),add=[];
 const snap=(d,lv)=>{if(d&&!have.has(d.name)){have.add(d.name);add.push({f:d.fam,p:d.pal,pt:d.pattern||'none',n:d.name,lv,b:1,g:0})}};
 try{for(const p of POIS)if(p.boss&&S.bosses&&S.bosses[p.id])snap(p.boss,p.boss.lv);
  for(const it of items)if(it.legend&&S.taken&&S.taken[it.id]&&LEGENDS[it.legend])snap(LEGENDS[it.legend],22);
  if(S.bosses&&S.bosses.goat&&typeof GOAT!=='undefined')snap(GOAT,GOAT.lv)}catch(e){}
 if(add.length)S.photos.push(...add)}
function czPhotoPick(){czPhotoBackfill();const ph=S.photos||[],star=ph.filter(p=>p.b||p.g),rest=ph.filter(p=>!p.b&&!p.g);
 // the order each boss was met is kept; up to 24 photos, special ones first
 return[...star,...rest].slice(0,Math.max(24,star.length))}
startGame=(orig=>function(){const r=orig.apply(this,arguments);try{czPhotoBackfill()}catch(e){}return r})(startGame);
function czHouseEnter(){const peers=CZ_NET.ch?Object.entries(CZ_NET.peers).filter(([id,q])=>q.look&&!q.busy).slice(0,3):[];
 if(!peers.length){czHouseOpen(czHouseSnap(),true);return}
 const opts=['🏠 My house',...peers.map(([id,q])=>`👋 ${q.look.name}'s house`),'Cancel'];
 choice('Whose house do you want to visit?',opts,i=>{if(i===0){czHouseOpen(czHouseSnap(),true);return}if(i>peers.length)return;const[id,q]=peers[i-1];czHouseKnock(id,q.look.name)})}
const CZ_KNOCK={id:null,t:0};
function czHouseKnock(id,name){CZ_KNOCK.id=id;CZ_KNOCK.name=name;CZ_KNOCK.t=Date.now();toast(`🚪 Knocking on ${name}'s door...`);
 try{CZ_NET.ch.send({type:'broadcast',event:'house_req',payload:{from:CZ_NET.id,to:id,name:NM()}})}catch(e){}
 setTimeout(()=>{if(CZ_KNOCK.id===id){CZ_KNOCK.id=null;toast(`Nobody answered at ${name}'s house. Try again in a bit.`)}},6000)}
CZ_NET.onChannel.push(ch=>{
 ch.on('broadcast',{event:'house_req'},({payload:p})=>{if(p.to!==CZ_NET.id||!S)return;
  try{CZ_NET.ch.send({type:'broadcast',event:'house',payload:{from:CZ_NET.id,to:p.from,data:czHouseSnap()}})}catch(e){}toast(`👋 ${czCleanName(p.name)} is visiting your house!`)});
 ch.on('broadcast',{event:'house'},({payload:p})=>{if(p.to!==CZ_NET.id||CZ_KNOCK.id!==p.from||!p.data)return;CZ_KNOCK.id=null;if(state!=='world'&&state!=='dialog')return;if(state==='dialog')try{closeDialog&&closeDialog()}catch(e){}
  const dd=p.data;dd.name=czCleanName(dd.name);czHouseOpen(dd,false)})});
press=(orig=>function(k,v){if(state==='house'){if(k==='B'||k==='A'||k==='MENU')czHouseClose();return}return orig.apply(this,arguments)})(press);

ACH.push({g:'Home',id:'home_decor',n:'Home Sweet Home',d:'Buy 3 things to decorate your house.',i:'🏠',t:'bronze',c:()=>Object.keys((S.house&&S.house.own)||{}).length>=3},
 {g:'Home',id:'home_full',n:'Dream House',d:`Own every decoration (${Object.keys(CZ_DECOR).length}).`,i:'🏡',t:'gold',c:()=>Object.keys((S.house&&S.house.own)||{}).length>=Object.keys(CZ_DECOR).length});
(()=>{const st=document.createElement('style');st.textContent=`#czHouse{position:fixed;inset:0;z-index:58;display:none;align-items:center;justify-content:center;background:rgba(16,11,30,.6)}
#czHouse,#czHouse *{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
#czHouse .box{background:#fbf1dc;border:3px solid #2a1a12;border-radius:10px;padding:10px 12px;width:min(820px,96vw);max-height:94vh;display:flex;flex-direction:column;color:#2a1a12;box-shadow:0 6px 0 #2a1a12}
#czHouse .hh{display:flex;align-items:center;gap:8px;margin-bottom:6px}#czHouse .hh small{color:#6a5848}#czHouse .hh button{margin-left:auto}
#czHouseCv{width:100%;aspect-ratio:320/180;max-height:42vh;object-fit:contain;image-rendering:pixelated;border:3px solid #2a1a12;border-radius:6px;background:#efe1c4}
#czHouse .tabs{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0 6px}#czHouse .tabs button{font-size:12px;padding:3px 8px}#czHouse .tabs button.on{background:#ffd84a}
#czHouse .body{overflow:auto;min-height:120px;font-size:13px}#czHouse h4{margin:8px 0 4px}
#czHouse .tro{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}#czHouse .tro>div{background:#fff;border:2px solid #2a1a12;border-radius:6px;padding:4px 6px;font-size:12px}#czHouse .tro .un{opacity:.55}
#czHouse .gearwall{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:4px}#czHouse .gw{background:#fff;border:2px solid;border-radius:6px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px}#czHouse .gw img{width:30px;height:30px;image-rendering:pixelated}#czHouse .gw.un{filter:brightness(0) opacity(.18)}
#czHouse .photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}#czHouse .pol{background:#fff;border:2px solid #2a1a12;padding:4px 4px 6px;text-align:center;font-size:11px;line-height:1.25}#czHouse .pol.gold{background:#fff2b0;border-color:#d8a020}#czHouse .pol canvas{width:100%;image-rendering:pixelated;background:#cfe6f0;display:block;margin-bottom:3px}#czHouse .pol small{display:block;color:#6a5848}
#czHouse .statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}#czHouse .statgrid>div{background:#fff;border:2px solid #2a1a12;border-radius:6px;text-align:center;padding:4px}#czHouse .statgrid b{font-size:18px;display:block}#czHouse .statgrid small{font-size:10px;color:#6a5848}
#czHouse .catbars .cb{display:grid;grid-template-columns:150px 1fr 110px;gap:6px;align-items:center;font-size:12px;margin:2px 0}#czHouse .catbars .bar{height:8px;background:#e8dcc0;border-radius:4px;overflow:hidden}#czHouse .catbars .bar i{display:block;height:100%}
#czHouse .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}#czHouse .card{display:flex;gap:8px;align-items:center;background:#fff;border:2px solid #2a1a12;border-radius:6px;padding:4px 6px;font-size:12px}#czHouse .card .ic{font-size:22px}#czHouse .card button{margin-left:auto;white-space:nowrap}
#czHouse .czsw{display:flex;gap:6px;flex-wrap:wrap}#czHouse .czsw button{font-size:12px;display:flex;align-items:center;gap:4px}#czHouse .czsw button.on{background:#ffd84a}#czHouse .czsw i{display:inline-block;width:14px;height:14px;border:1px solid #2a1a12}
#czHouse .coins{margin:0 0 6px;font-weight:800}
@media (max-width:600px){#czHouse .statgrid{grid-template-columns:repeat(2,1fr)}#czHouse .grid{grid-template-columns:1fr}#czHouse .catbars .cb{grid-template-columns:100px 1fr 70px}}`;document.head.appendChild(st)})();
