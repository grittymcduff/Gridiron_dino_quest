'use strict';
// =====================================================================
//  BRADY'S GRIDIRON DINO QUEST
// =====================================================================
const $ = s => document.querySelector(s);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let R = Math.random;
const rint=(a,b)=>a+Math.floor(R()*(b-a+1));
const pick=a=>a[Math.floor(R()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function hexToRgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function rgbToHex(r,g,b){return'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('')}
function shade(h,f){const[r,g,b]=hexToRgb(h);return f>=0?rgbToHex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):rgbToHex(r*(1+f),g*(1+f),b*(1+f))}
function hsl(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return rgbToHex(255*f(0),255*f(8),255*f(4))}
function makeNoise(seed){const r=mulberry32(seed);const P=new Float32Array(65536);for(let i=0;i<P.length;i++)P[i]=r();
 const g=(x,y)=>P[((y&255)<<8)|(x&255)],sm=t=>t*t*(3-2*t);
 const n=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,a=g(xi,yi),b=g(xi+1,yi),c=g(xi,yi+1),d=g(xi+1,yi+1),u=sm(xf),v=sm(yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
 return(x,y,o=3)=>{let s=0,amp=1,f=1,t=0;for(let i=0;i<o;i++){s+=n(x*f,y*f)*amp;t+=amp;amp*=.5;f*=2}return s/t}}

// ---------------- CONSTANTS ----------------
const TS=16;let CW=320, CH=208;
const ZOOMS=[0.75,1,1.5,2],ZOOMN=['Close-up','Normal','Wide','Extra wide'];let zoomI=1;
const MW=212, MH=156, WORLD_SEED=1120;
const T={GRASS:0,TALL:1,PATH:2,WATER:3,SAND:4,TREE:5,ROCK:6,FLOWER:7,FLOOR:8,WALL:9,ROOF:10,DOOR:11,FENCE:12,BRIDGE:13,LAVA:14,JUNGLE:15,FOUNTAIN:16,BRUSH:17,SIGN:18,GATE:19,FIELD:20,TOTEM:21,CACTUS:22,MFLOOR:23,VFLOOR:24,ROOFB:25,COLUMN:26,GOAL:27,PINE:28,FIELDLINE:29,WINDOW:30,MONO:31};
const SOLID=new Set([T.MONO,T.WATER,T.TREE,T.ROCK,T.WALL,T.ROOF,T.FENCE,T.LAVA,T.FOUNTAIN,T.SIGN,T.GATE,T.TOTEM,T.CACTUS,T.ROOFB,T.COLUMN,T.GOAL,T.PINE,T.DOOR,T.WINDOW]);
const OBJ=new Set([T.MONO,T.TREE,T.PINE,T.ROCK,T.CACTUS,T.COLUMN,T.TOTEM,T.SIGN,T.FLOWER,T.TALL,T.JUNGLE,T.BRUSH,T.GOAL,T.FENCE]);
const ENC={[T.TALL]:.10,[T.JUNGLE]:.12,[T.BRUSH]:.10,[T.GRASS]:.009,[T.SAND]:.009,[T.MFLOOR]:.011,[T.FLOWER]:.009,[T.PATH]:.004,[T.VFLOOR]:.02};
const DX={up:0,down:0,left:-1,right:1}, DY={up:-1,down:1,left:0,right:0};
const CATS={rules:{name:'Rules',c:'#e8443a'},strategy:{name:'Positions & Strategy',c:'#159a86'},history:{name:'History',c:'#8e44ad'},players:{name:'Players',c:'#2f6fd6'},teams:{name:'Teams & Cities',c:'#2e9e50'},stadiums:{name:'Stadiums',c:'#e67e22'}};

const POIS=[
 {id:'kickoff',name:'Kickoff Town',region:'Kickoff Plains',x:106,y:122,biome:'plains',lv:[1,3],diff:[1,1]},
 {id:'harbor',name:'Huddle Harbor',region:'Huddle Coast',x:34,y:118,biome:'coast',cat:'teams',lv:[3,6],diff:[1,2],
  boss:{name:'Captain Longneck',fam:'sauro',lv:8,pal:{B:'#3f8fb0',L:'#d8f0f0',P:'#1f4d6b',K:'#e8dcc0'},pattern:'spots',trophy:'Compass Trophy',
   intro:["Ahoy, {N}! I'm Captain Longneck, Head Coach of TEAMS & CITIES!","I've sailed to every NFL city. Do you know where all 32 teams play? Let's find out!"],
   outro:["Shiver my shoulder pads! You know your teams!","Take the COMPASS TROPHY. Now, onward!"]}},
 {id:'dunes',name:'Draft Day Dunes',region:'Draft Day Desert',x:169,y:124,biome:'desert',cat:'players',lv:[3,6],diff:[1,2],
  boss:{name:'Scout Raptor',fam:'raptor',lv:8,pal:{B:'#c98a3a',L:'#f4dfb0',P:'#6b3a1a',K:'#f4f4f4'},pattern:'stripes',trophy:'Draft Trophy',
   intro:["Hssss... I'm Scout Raptor, Head Coach of PLAYERS!","I've scouted every superstar from Montana to Mahomes. Let's see your scouting report!"],
   outro:["Impressive! You'd make a great GM someday.","The DRAFT TROPHY is yours!"]}},
 {id:'rulebook',name:'Rulebook Ridge',region:'Rulebook Woods',x:42,y:65,biome:'forest',cat:'rules',lv:[6,9],diff:[1,2],
  boss:{name:'Referee Rex',fam:'rex',lv:11,pal:{B:'#f2f2f2',L:'#dcdcdc',P:'#1b1b1b',K:'#f4f4f4'},pattern:'vstripes',trophy:'Whistle Trophy',
   intro:["TWEEEEET! I'm Referee Rex, Head Coach of RULES!","Downs, scoring, penalties... One wrong answer and that's a FLAG on you!"],
   outro:["After review... the ruling stands: YOU WIN!","Take the WHISTLE TROPHY."]}},
 {id:'springs',name:'Stadium Springs',region:'Stadium Springs',x:178,y:73,biome:'springs',cat:'stadiums',lv:[6,9],diff:[1,2],
  boss:{name:'Groundskeeper Stego',fam:'stego',lv:11,pal:{B:'#4d9a4a',L:'#cfe8a8',P:'#f5c542',K:'#f4f4f4'},pattern:'none',trophy:'Turf Trophy',
   intro:["Hey! Stay off my turf! I'm Groundskeeper Stego, Head Coach of STADIUMS!","From Lambeau to SoFi, I've mowed 'em all. Do you know where every team plays?"],
   outro:["Well, I'll be. You know your stadiums!","Here's the TURF TROPHY. Wipe your cleats!"]}},
 {id:'peak',name:'Playbook Peak',region:'Playbook Mountains',x:65,y:23,biome:'mountain',cat:'strategy',lv:[9,12],diff:[2,3],
  boss:{name:'Coordinator Ankylo',fam:'ankylo',lv:14,pal:{B:'#7a6a8a',L:'#c8bcd8',P:'#3a2a4a',K:'#d8c070'},pattern:'none',trophy:'Playbook Trophy',
   intro:["I'm Coordinator Ankylo, Head Coach of POSITIONS & STRATEGY.","Blitzes, audibles, nickel packages... Can you read my defense?"],
   outro:["You read that coverage perfectly.","The PLAYBOOK TROPHY is yours, Coach {N}."]}},
 {id:'canton',name:'Canton Ruins',region:'Canton Ruins',x:150,y:25,biome:'ruins',cat:'history',lv:[9,12],diff:[2,3],
  boss:{name:'Curator Trike',fam:'trike',lv:14,pal:{B:'#b5654a',L:'#f0d0b0',P:'#f5c542',K:'#fff6d8'},pattern:'spots',trophy:'Legacy Trophy',
   intro:["Welcome to the Ruins. I'm Curator Trike, Head Coach of HISTORY.","The Ice Bowl, The Catch, the Immaculate Reception... History remembers. Do you?"],
   outro:["You honor the legends of the game.","Take the LEGACY TROPHY. Your gold jacket awaits!"]}},
 {id:'champ',name:'Championship Stadium',region:'Championship Volcano',x:107,y:65,biome:'volcano',cat:null,lv:[12,15],diff:[2,3],
  boss:{name:'Commissioner Spino',fam:'spino',lv:20,pal:{B:'#d4a017',L:'#fff0b0',P:'#8a1c1c',K:'#ffffff'},pattern:'stripes',trophy:"Champion's Ring",final:true,
   intro:["So... the kid with the freckles made it to the Championship.","I am COMMISSIONER SPINO. Every category. Every era. Every rule.","Win this, and you're a true Gridiron Legend. KICKOFF!"],
   outro:["Incredible... You know this game like a true pro.","{N}, you are the CHAMPION of the Gridiron Isles!"]}},
];
const LEGENDS={
 goldball:{name:'Coach Hoodosaurus',title:'The Hooded Mastermind',fam:'rex',pal:{B:'#8a8d94',L:'#c8cad0',P:'#3c3f48',K:'#f4f4f4'},pattern:'none',
  intro:["...","You opened my chest. You didn't knock.","I don't do small talk. We're on to the questions.","Do your job, kid."],
  outro:["...","It is what it is. The Golden Football is yours.","Now get out of my film room. We're on to the next one."]},
 goldhelm:{name:'Coach Iron Sweep',title:'The Old-School Drill Sergeant',fam:'trike',pal:{B:'#2f5a3a',L:'#e8d070',P:'#f5c542',K:'#fff6d8'},pattern:'none',
  intro:["Kid... THIS is a dinosaur.","We start with FUNDAMENTALS. Perfect practice makes perfect players!","Show me you know where this game came from!"],
  outro:["Hmph. Discipline. Desire. You've got both.","The Golden Helmet is yours. Wear it with pride."]},
 goldjacket:{name:'Coach Mustachiodon',title:'Da Sideline Legend',fam:'ankylo',pal:{B:'#2a3460',L:'#e8803a',P:'#c8501a',K:'#d8c070'},pattern:'stripes',
  intro:["Whaddya think this is, a PICNIC?!","On MY sideline, you know your history or you take a seat!","Let's see what you got, kid!"],
  outro:["...Okay. OKAY. That's some real football knowledge right there!","Take the Gold Jacket. You earned it."]},
 goldcleats:{name:'The Big Tunasaurus',title:'The Turnaround Specialist',fam:'sauro',pal:{B:'#3a5aa0',L:'#d8e0f0',P:'#a8323a',K:'#f0f0f0'},pattern:'spots',
  intro:["You want the Golden Cleats? Everybody wants the Golden Cleats.","Let me tell you something: you are what your answers say you are.","So let's find out what you are."],
  outro:["Alright. You're a pro. Don't let it go to your head.","The Golden Cleats are yours. Now go win somewhere else."]},
 hose:{name:'Coach Clockwatcher',title:'The Five-Minutes-Early Man',fam:'raptor',pal:{B:'#1f3f8a',L:'#e8e8f0',P:'#c8202a',K:'#f4f4f4'},pattern:'stripes',
  intro:["You're LATE.","On my team, if you're on time, you're LATE. Five minutes early, every time!","The shot clock is running. MOVE!"],
  outro:["...Right on time. I'm impressed.","Take the Hydration Hose. And set your watch five minutes fast."]},
};
const GOAT={name:'The GOAT-osaurus',fam:'rex',lv:30,pal:{B:'#ece4d0',L:'#fffaf0',P:'#a89878',K:'#f5c542'},pattern:'vstripes',
 intro:["...So. You've won on Rookie. On Pro. On All-Pro. Even on Superfan.","Every tier. Every kind of question. That's how you found my island.","I am the GREATEST OF ALL TIME-osaurus. Ten seconds a question. No mercy."],
 outro:["...Incredible. The title is yours, kid. YOU are the GOAT.","Take the Fossil Football and the Dino King Crown. Wear them proudly."]};
const BOSS_ORDER=['harbor','dunes','rulebook','springs','peak','canton'];
const poiById=id=>POIS.find(p=>p.id===id);

// ---------------- ITEMS ----------------
const CONS={
 water:{name:'Water Bottle',icon:'💧',desc:'Heal 30 HP',heal:30,price:15},
 orange:{name:'Orange Slices',icon:'🍊',desc:'Heal 20 HP',heal:20,price:10},
 sports:{name:'Sports Drink',icon:'🥤',desc:'Heal 60 HP',heal:60,price:35},
 icepack:{name:'Ice Pack',icon:'🧊',desc:'Fully heal',heal:9999,price:90},
 hint:{name:"Coach's Clipboard",icon:'📋',desc:'Battle: remove 2 wrong answers',battle:true,price:25},
 timeout:{name:'Timeout Card',icon:'⏱️',desc:'Battle: skip a question, no damage',battle:true,price:30},
 horn:{name:'Air Horn',icon:'📯',desc:'No wild dinos for 150 steps',buff:['horn',150],price:40},
 pep:{name:'Pep Talk Card',icon:'📣',desc:'+30% damage for 3 battles',buff:['pep',3],price:40},
 guard:{name:'Mouthguard',icon:'🦷',desc:'-35% damage taken for 3 battles',buff:['guard',3],price:40},
 bar:{name:'Energy Bar',icon:'🍫',desc:'Heal 6 HP per correct answer for 3 battles',buff:['regen',3],price:45},
 film:{name:'Game Film',icon:'🎞️',desc:'+50% XP for 3 battles',buff:['film',3],price:50},
 coin:{name:'Lucky Coin',icon:'🪙',desc:'+50% coins for 3 battles',buff:['lucky',3],price:35},
};
const BUFFS={pep:{name:'Pumped Up',icon:'📣'},guard:{name:'Mouthguard',icon:'🦷'},regen:{name:'Second Wind',icon:'🍫'},film:{name:'Film Study',icon:'🎞️'},lucky:{name:'Lucky',icon:'🪙'},horn:{name:'Air Horn',icon:'📯',steps:true}};
const RAR=[{n:'Common',c:'#8a9096'},{n:'Uncommon',c:'#2e9e50'},{n:'Rare',c:'#2f6fd6'},{n:'Epic',c:'#9b40c6'},{n:'Legendary',c:'#e8900c'},{n:'Mythic',c:'#e0408a'}];
const GEAR={
 // weapons
 foamball:{name:'Foam Football',slot:'weapon',r:0,atk:2,icon:'🏈',proj:'ball'},
 practiceball:{name:'Practice Football',slot:'weapon',r:0,atk:4,icon:'🏈',proj:'ball'},
 bottle:{name:'Water Bottle Slinger',slot:'weapon',r:0,atk:3,heal:2,icon:'🧴',proj:'bottle'},
 yflag:{name:'Yellow Penalty Flag',slot:'weapon',r:1,atk:5,crit:5,icon:'🚩',proj:'yflag'},
 pigskin:{name:'Leather Pigskin',slot:'weapon',r:1,atk:7,icon:'🏈',proj:'ball'},
 squeeze:{name:'Squeeze Bottle Blaster',slot:'weapon',r:1,atk:6,heal:4,icon:'🧴',proj:'bottle'},
 rflag:{name:'Red Challenge Flag',slot:'weapon',r:2,atk:9,crit:10,icon:'🚩',proj:'rflag'},
 spiral:{name:'Tight Spiral',slot:'weapon',r:2,atk:11,icon:'🏈',proj:'ball'},
 whistle:{name:"Coach's Whistle",slot:'weapon',r:2,atk:10,crit:8,icon:'📢',proj:'whistle'},
 cooler:{name:'Victory Ice Bucket',slot:'weapon',r:3,atk:14,heal:8,icon:'🪣',proj:'cooler'},
 hailmary:{name:'Hail Mary Ball',slot:'weapon',r:3,atk:17,crit:12,icon:'🏈',proj:'ball'},
 sigflags:{name:"Referee's Signal Flags",slot:'weapon',r:3,atk:15,crit:15,icon:'🚩',proj:'yflag'},
 goldball:{name:'Golden Football',slot:'weapon',r:4,atk:24,crit:15,icon:'🏆',proj:'gold'},
 hose:{name:'Hydration Hose',slot:'weapon',r:4,atk:19,heal:14,icon:'🚿',proj:'cooler'},
 fossilball:{name:'Fossil Football',slot:'weapon',r:5,atk:30,crit:20,heal:8,icon:'🦴',proj:'gold'},
 // helmets
 dinocrown:{name:'Dino King Crown',slot:'helmet',r:5,def:20,hp:40,crit:5,icon:'👑'},
 leatherhelm:{name:'Leather Helmet',slot:'helmet',r:0,def:2,icon:'⛑️'},
 practicehelm:{name:'Practice Helmet',slot:'helmet',r:0,def:3,icon:'⛑️'},
 visorhelm:{name:'Visor Helmet',slot:'helmet',r:1,def:5,dodge:3,icon:'⛑️'},
 prohelm:{name:'Pro Helmet',slot:'helmet',r:2,def:8,icon:'⛑️'},
 titanhelm:{name:'Titanium Facemask Helmet',slot:'helmet',r:3,def:12,hp:10,icon:'⛑️'},
 goldhelm:{name:'Golden Helmet',slot:'helmet',r:4,def:16,hp:25,icon:'👑'},
 // pads
 jersey:{name:'Practice Jersey',slot:'pads',r:0,def:1,hp:10,icon:'👕'},
 mesh:{name:'Mesh Jersey',slot:'pads',r:0,def:2,hp:15,icon:'👕'},
 shoulder:{name:'Shoulder Pads',slot:'pads',r:1,def:5,hp:20,icon:'🛡️'},
 ribs:{name:'Rib Protector',slot:'pads',r:1,def:4,hp:30,icon:'🛡️'},
 probowl:{name:'Pro Bowl Pads',slot:'pads',r:2,def:8,hp:35,icon:'🛡️'},
 dinoscale:{name:'Dino-Scale Armor',slot:'pads',r:3,def:12,hp:50,icon:'🦖'},
 goldjacket:{name:'Hall of Fame Gold Jacket',slot:'pads',r:4,def:15,hp:80,icon:'🧥'},
 // cleats
 sneakers:{name:'Sneakers',slot:'cleats',r:0,dodge:3,icon:'👟'},
 turf:{name:'Turf Shoes',slot:'cleats',r:0,dodge:5,icon:'👟'},
 molded:{name:'Molded Cleats',slot:'cleats',r:1,dodge:8,icon:'👟'},
 speed:{name:'Speed Cleats',slot:'cleats',r:2,dodge:12,crit:3,icon:'👟'},
 raptorcleats:{name:'Raptor-Claw Cleats',slot:'cleats',r:3,dodge:16,crit:5,icon:'🦶'},
 goldcleats:{name:'Golden Cleats',slot:'cleats',r:4,dodge:20,crit:8,atk:3,icon:'✨'},
};
const SLOTS=['weapon','helmet','pads','cleats'], SLOTN={weapon:'Weapon',helmet:'Helmet',pads:'Armor',cleats:'Cleats'};
const GEAR_PRICE=[40,90,180,400,1000,3000];
function gearDesc(g){const p=[];if(g.atk)p.push('ATK+'+g.atk);if(g.def)p.push('DEF+'+g.def);if(g.hp)p.push('HP+'+g.hp);if(g.crit)p.push('CRIT+'+g.crit+'%');if(g.dodge)p.push('JUKE+'+g.dodge+'%');if(g.heal)p.push('Heal '+g.heal+'/correct');return p.join('  ')}
function rollGear(lv,minR=0){const w=[50,30,14,5,1].map((v,i)=>i<minR?0:v*Math.pow(1+lv/8,i));let s=w.reduce((a,b)=>a+b,0),r=R()*s,ri=0;for(;ri<w.length;ri++){r-=w[ri];if(r<=0)break}ri=Math.min(ri,4);const ids=Object.keys(GEAR).filter(k=>GEAR[k].r===ri);return pick(ids)}
function rollCons(){const w={water:30,orange:20,sports:12,hint:10,timeout:8,bar:5,pep:5,guard:5,horn:4,film:3,coin:3,icepack:2};let s=0;for(const k in w)s+=w[k];let r=R()*s;for(const k in w){r-=w[k];if(r<=0)return k}return'water'}

// ---------------- SAVE STATE ----------------
const SAVE_KEY='bradyDinoQuest_v1';
let S=null; // save
function newSave(diff,hero){return{v:1,hero:heroOf({hero}),x:POIS[0].x,y:POIS[0].y+3,dir:'down',lv:1,xp:0,hp:72,coins:30,
 inv:{water:3,orange:2,hint:1,timeout:1},gear:['foamball','jersey','sneakers'],equip:{weapon:'foamball',helmet:null,pads:'jersey',cleats:'sneakers'},
 buffs:{},trophies:[],taken:{},bosses:{},npc:{},totem:{},seen:{},missed:{},dex:{},names:{},
 st:{ans:0,cor:0,cat:{},best:0,streak:0,battles:0,wins:0},respawn:{x:POIS[0].x,y:POIS[0].y+3},steps:0,visited:{kickoff:1},diff:diff||'pro',sound:true,mapv:2,gateOpen:false,champion:false,intro:false}}
let saveWarned=false;
function saveGame(silent){if(!S||state==='title')return false;S.savedAt=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));if(!silent)toast('💾 Game saved');return true}catch(e){if(!silent||!saveWarned){saveWarned=true;toast("⚠️ This browser is blocking saves. Use Menu → Options → Export save code.")}return false}}
function encodeSave(){return btoa(unescape(encodeURIComponent(JSON.stringify(S))))}
function decodeSave(code){try{const o=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));if(o&&typeof o.lv==='number'&&typeof o.x==='number'&&o.inv&&o.equip)return o}catch(e){}return null}
function loadSave(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null}catch(e){return null}}

// ---------------- WORLD GEN ----------------
let map,base,region,town;
const items=[], npcs=[], bosses=[], totems=[];
function idx(x,y){return y*MW+x}
function inb(x,y){return x>=0&&y>=0&&x<MW&&y<MH}
function genWorld(){
 const rr=mulberry32(WORLD_SEED);
 const nA=makeNoise(WORLD_SEED+1),nB=makeNoise(WORLD_SEED+2),nC=makeNoise(WORLD_SEED+3),nD=makeNoise(WORLD_SEED+4);
 map=new Uint8Array(MW*MH);base=new Uint8Array(MW*MH);region=new Uint8Array(MW*MH);town=new Uint8Array(MW*MH);
 const champ=poiById('champ'),ci=POIS.indexOf(champ);
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  const i=idx(x,y);let best=0,bd=1e9;
  POIS.forEach((p,k)=>{if(p.id==='champ')return;const d=Math.hypot(x-p.x,y-p.y)+(nD(x/10,y/10)-.5)*16;if(d<bd){bd=d;best=k}});
  const dc=Math.hypot(x-champ.x,y-champ.y);
  if(dc<12.6)best=ci;
  region[i]=best;
  const edge=Math.min(x,y,MW-1-x,MH-1-y)+(nB(x/5,y/5)-.5)*5;
  const e=nA(x/13,y/13,4),m=nB(x/7+50,y/7+50,3),g=nC(x/5,y/5,2);
  const b=POIS[best].biome;let t=T.GRASS,bs=T.GRASS;
  if(b==='desert')bs=T.SAND;else if(b==='mountain')bs=T.MFLOOR;else if(b==='volcano')bs=T.VFLOOR;
  t=bs;
  if(b==='volcano'){
   if(dc>=9&&dc<12)t=T.LAVA;else t=T.VFLOOR;
  }else if(edge<3)t=T.WATER;else if(edge<4.6){t=T.SAND;bs=T.SAND}
  else switch(b){
   case'plains':t=e<.3?T.WATER:m>.64?T.TREE:g>.6?T.TALL:g<.28&&m<.4?T.FLOWER:T.GRASS;break;
   case'forest':t=e<.29?T.WATER:m>.55?(rr()<.5?T.TREE:T.PINE):g>.52?T.JUNGLE:m<.3&&g<.3?T.FLOWER:T.GRASS;break;
   case'mountain':t=e>.63?T.ROCK:m>.62?T.PINE:g>.6?T.TALL:T.MFLOOR;break;
   case'coast':t=e<.35?T.WATER:e<.39?(bs=T.SAND,T.SAND):m>.66?T.TREE:g>.56?T.TALL:T.GRASS;break;
   case'desert':t=e<.26?T.WATER:e<.29?(bs=T.GRASS,T.GRASS):m>.65?(rr()<.6?T.CACTUS:T.ROCK):g>.56?T.BRUSH:T.SAND;break;
   case'springs':t=e<.37?T.WATER:m>.67?T.TREE:g>.56?T.TALL:g<.3?T.FLOWER:T.GRASS;break;
   case'ruins':t=e<.27?T.WATER:m>.66?(rr()<.55?T.COLUMN:T.ROCK):g>.55?T.TALL:T.GRASS;break;
  }
  map[i]=t;base[i]=bs;
 }
 // volcano interior: stadium field
 for(let dy=-4;dy<=4;dy++)for(let dx=-7;dx<=7;dx++){const x=champ.x+dx,y=champ.y+dy,i=idx(x,y);map[i]=Math.abs(dx)===7?(dy===0?T.GOAL:T.FIELD):(dx===0?T.FIELDLINE:T.FIELD);base[i]=T.FIELD;town[i]=ci+1}
 // towns
 POIS.forEach((p,k)=>{if(p.id!=='champ')stampTown(p,k)});
 // last-chance camp south of the volcano
 const cx=champ.x,cy=champ.y+16;
 for(let dy=-2;dy<=2;dy++)for(let dx=-5;dx<=5;dx++){const i=idx(cx+dx,cy+dy);map[i]=T.FLOOR;base[i]=T.FLOOR;town[i]=ci+1}
 map[idx(cx+3,cy)]=T.FOUNTAIN;map[idx(cx-1,cy-2)]=T.SIGN;
 // paths
 const ent=(p,ox,oy)=>{let best=null,bd=1e9;[[-10,1],[10,1],[0,8]].forEach(([ex,ey])=>{const d=Math.hypot(p.x+ex-ox,p.y+ey-oy);if(d<bd){bd=d;best=[p.x+ex,p.y+ey]}});return best};
 const link=(a,b)=>{const A=poiById(a),B=poiById(b);const ea=ent(A,B.x,B.y),eb=ent(B,A.x,A.y);carve(ea[0],ea[1],eb[0],eb[1])};
 link('kickoff','harbor');link('kickoff','dunes');link('harbor','rulebook');link('rulebook','peak');link('peak','canton');link('canton','springs');link('springs','dunes');
 const kk=poiById('kickoff');carve(kk.x,kk.y+8,kk.x,kk.y+12);carve(kk.x-10,kk.y+1,kk.x-14,kk.y+1);
 // kickoff -> camp -> gate
 const ek=ent(kk,cx,cy);carve(ek[0],ek[1],cx,cy+3);carve(cx,cy+3,cx,cy+2);
 carve(cx,cy-2,cx,champ.y+12);
 for(let y=champ.y+12;y>=champ.y+5;y--)for(const x of[cx,cx+1]){const i=idx(x,y);if(map[i]===T.LAVA)map[i]=T.BRIDGE;else if(map[i]!==T.FIELD&&map[i]!==T.FIELDLINE)map[i]=T.PATH;base[i]=T.VFLOOR}
 for(const x of[cx,cx+1]){map[idx(x,champ.y+11)]=T.GATE}
 // reachability
 const reach=flood(kk.x,kk.y+3);
 // totems
 const prr=mulberry32(WORLD_SEED+9);
 const cand=[];for(let y=2;y<MH-2;y++)for(let x=2;x<MW-2;x++){const i=idx(x,y);if(reach[i]&&!town[i]&&!SOLID.has(map[i])&&map[i]!==T.PATH&&map[i]!==T.BRIDGE&&region[i]!==ci)cand.push(i)}
 const open4=i=>{const x=i%MW,y=(i/MW)|0;return[[1,0],[-1,0],[0,1],[0,-1]].every(([a,b])=>{const j=idx(x+a,y+b);return!SOLID.has(map[j])&&!town[j]})};
 const nearPath=i=>{const x=i%MW,y=(i/MW)|0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){if(map[idx(x+a,y+b)]===T.PATH)return true}return false};
 const used=new Set();const far=(i,m=4)=>{for(const u of used){const dx=(u%MW)-(i%MW),dy=((u/MW)|0)-((i/MW)|0);if(dx*dx+dy*dy<m*m)return false}return true};
 const poiDist=i=>Math.min(...POIS.map(p=>Math.hypot((i%MW)-p.x,((i/MW)|0)-p.y)));
 // legendary chests first, spread far apart and away from towns
 const corners=[[12,12,'goldball'],[MW-13,12,'goldhelm'],[12,MH-13,'goldjacket'],[MW-13,MH-13,'goldcleats'],[(MW/2|0)+30,MH-10,'hose']];
 corners.forEach(([tx,ty,g],k)=>{let bi=-1,bd=1e9;for(const i of cand){if(!open4(i)||used.has(i)||poiDist(i)<20)continue;const d=Math.hypot((i%MW)-tx,((i/MW)|0)-ty);if(d<bd){bd=d;bi=i}}if(bi>=0){items.push({id:'L'+k,x:bi%MW,y:(bi/MW)|0,kind:'chest',legend:g});used.add(bi)}});
 let tries=0;while(totems.length<11&&tries++<8000){const i=cand[(prr()*cand.length)|0];if(open4(i)&&nearPath(i)&&far(i,14)){map[i]=T.TOTEM;base[i]=base[i]===T.FLOOR?T.GRASS:base[i];totems.push({id:'t'+totems.length,x:i%MW,y:(i/MW)|0});used.add(i)}}
 // chests & sparkles
 const dist=i=>Math.hypot((i%MW)-kk.x,((i/MW)|0)-kk.y);
 tries=0;let n=0;while(n<50&&tries++<20000){const i=cand[(prr()*cand.length)|0];if(map[i]===T.TOTEM||!open4(i)||!far(i,11)||dist(i)<12)continue;items.push({id:'c'+n,x:i%MW,y:(i/MW)|0,kind:'chest',tier:Math.min(4,Math.floor(dist(i)/18))});used.add(i);n++}
 n=0;tries=0;while(n<44&&tries++<20000){const i=cand[(prr()*cand.length)|0];if(map[i]===T.TOTEM||!far(i,7))continue;items.push({id:'s'+n,x:i%MW,y:(i/MW)|0,kind:'sparkle'});used.add(i);n++}
 // NPCs
 genNPCs(prr,reach,cand,used);
 // bosses
 POIS.forEach(p=>{if(!p.boss)return;const bx=p.x,by=p.id==='champ'?p.y:p.y-7;bosses.push({poi:p.id,x:bx,y:by,def:p.boss,spr:null})});
 // kickoff monolith (secret warp)
 map[idx(kk.x-2,kk.y-8)]=T.MONO;base[idx(kk.x-2,kk.y-8)]=T.FIELD;MONO_K={x:kk.x-2,y:kk.y-8};
 carveSanctum();
 if(SANCT){
  const mkS=(x,y,kind,name,o={})=>{npcs.push(Object.assign({id:'ns'+npcs.length,x,y,tx:x,ty:y,prog:0,moving:false,dir:'down',home:{x,y},rad:0,kind,name,look:{s:'#e8d8b8',h:'#d8d8d8',t:'#7a6a4a',p:'#4a3a2a',hat:'#b8a070',fr:false},timer:100,tip:7},o))};
  mkS(SANCT.x-6,SANCT.y+5,'shop','Fossil Merchant',{tier:3});mkS(SANCT.x+6,SANCT.y+5,'tip','Old Fossil',{tip:11});
  bosses.push({poi:'goat',x:SANCT.x,y:SANCT.y-2,def:GOAT,spr:null,secret:true});
 }
}
let SANCT=null,MONO_K=null,MONO_S=null;
const SANCT_ID=99;
function carveSanctum(){
 const HW=16,HH=12;let best=null,bs=-1;
 const blocked=(cx,cy)=>{for(let y=cy-HH;y<=cy+HH;y++)for(let x=cx-HW;x<=cx+HW;x++){if(!inb(x,y))return true;const i=idx(x,y),t=map[i];if(town[i]||t===T.PATH||t===T.BRIDGE||t===T.GATE||t===T.TOTEM||t===T.LAVA)return true}
  for(const it of items)if(Math.abs(it.x-cx)<=HW&&Math.abs(it.y-cy)<=HH)return true;for(const n of npcs)if(Math.abs(n.x-cx)<=HW+1&&Math.abs(n.y-cy)<=HH+1)return true;return false};
 const cands=[];for(let cy=HH+3;cy<MH-HH-3;cy+=3)for(let cx=HW+3;cx<MW-HW-3;cx+=3){if(blocked(cx,cy))continue;const d=Math.min(...POIS.map(p=>Math.hypot(p.x-cx,p.y-cy)));cands.push([d,cx,cy])}
 cands.sort((a,b)=>b[0]-a[0]);
 const k=POIS[0];
 for(const[,cx,cy]of cands.slice(0,40)){
  const saveM=map.slice(),saveB=base.slice(),saveT=town.slice();
  stampSanctum(cx,cy,HW,HH);
  const rr=flood(k.x,k.y+3);
  const ok=items.every(it=>rr[idx(it.x,it.y)]||(it.kind==='chest'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>rr[idx(it.x+a,it.y+b)])))&&npcs.every(n=>rr[idx(n.x,n.y)]||town[idx(n.x,n.y)]===SANCT_ID)&&!rr[idx(cx,cy)];
  if(ok){SANCT={x:cx,y:cy};break}
  map.set(saveM);base.set(saveB);town.set(saveT)}
}
function stampSanctum(cx,cy,HW,HH){
 const set=(dx,dy,t,b)=>{const i=idx(cx+dx,cy+dy);map[i]=t;base[i]=b??T.SAND;town[i]=SANCT_ID};
 for(let dy=-HH;dy<=HH;dy++)for(let dx=-HW;dx<=HW;dx++){const ring=Math.abs(dx)>HW-3||Math.abs(dy)>HH-3;set(dx,dy,ring?T.WATER:T.SAND,ring?T.GRASS:T.SAND)}
 // fossil field
 for(let dy=-5;dy<=1;dy++)for(let dx=-7;dx<=7;dx++)set(dx,dy,Math.abs(dx)===7?(dy===-2?T.GOAL:T.FIELD):(dx===0?T.FIELDLINE:T.FIELD),T.FIELD);
 // columns ring
 for(const dx of[-12,-8,-4,4,8,12])set(dx,-8,T.COLUMN,T.SAND);for(const dy of[-4,0,4])for(const dx of[-12,12])set(dx,dy,T.COLUMN,T.SAND);
 for(const dx of[-11,-10,10,11])set(dx,7,T.FLOWER,T.SAND);
 set(0,6,T.FOUNTAIN,T.FLOOR);set(-3,8,T.MONO,T.SAND);set(3,8,T.SIGN,T.SAND);
 MONO_S={x:cx-3,y:cy+8};
}
function flood(sx,sy){const r=new Uint8Array(MW*MH),q=[idx(sx,sy)];r[q[0]]=1;while(q.length){const i=q.pop(),x=i%MW,y=(i/MW)|0;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(r[j])continue;const t=map[j];if(SOLID.has(t)&&t!==T.GATE)continue;r[j]=1;q.push(j)}}return r}
function carve(ax,ay,bx,by){const r=mulberry32(ax*7919+ay*31+bx*13+by);let x=ax,y=ay,g=0;
 while((x!==bx||y!==by)&&g++<3000){setPath(x,y);const dx=bx-x,dy=by-y;
  if(dx!==0&&(dy===0||r()<Math.abs(dx)/(Math.abs(dx)+Math.abs(dy))*1.0+(r()-.5)*.3))x+=Math.sign(dx);else y+=Math.sign(dy)}
 setPath(bx,by)}
function setPath(x,y){for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++){const tx=x+ox,ty=y+oy;if(!inb(tx,ty))continue;const i=idx(tx,ty);if(town[i])continue;const t=map[i];if(t===T.WATER||t===T.LAVA)map[i]=T.BRIDGE;else if(t!==T.BRIDGE&&t!==T.GATE)map[i]=T.PATH}}
function stampTown(p,k){
 const set=(dx,dy,t,b)=>{const x=p.x+dx,y=p.y+dy;if(!inb(x,y))return;const i=idx(x,y);map[i]=t;base[i]=b||T.FLOOR;town[i]=k+1};
 for(let dy=-11;dy<=7;dy++)for(let dx=-9;dx<=9;dx++){const edge=Math.abs(dx)===9||dy===-11||dy===7;set(dx,dy,edge?T.GRASS:T.FLOOR,edge?T.GRASS:T.FLOOR)}
 // field with fence
 for(let dy=-10;dy<=-6;dy++)for(let dx=-6;dx<=6;dx++){const f=dy===-10||Math.abs(dx)===6;set(dx,dy,f?T.FENCE:(dx===0?T.FIELDLINE:T.FIELD),f?T.FLOOR:T.FIELD)}
 set(-5,-8,T.GOAL,T.FIELD);set(5,-8,T.GOAL,T.FIELD);
 // shop (left, red roof) & house (right, blue roof)
 const bld=(x0,roof)=>{for(let dx=0;dx<5;dx++){set(x0+dx,-4,roof);set(x0+dx,-3,roof);set(x0+dx,-2,dx===1||dx===3?T.WINDOW:T.WALL);set(x0+dx,-1,dx===2?T.DOOR:T.WALL)}};
 bld(-8,T.ROOF);bld(4,T.ROOFB);
 set(0,2,T.FOUNTAIN);set(-2,6,T.SIGN);
 // flowers decor
 for(const[dx,dy]of[[-8,5],[-7,5],[8,5],[7,5],[-8,0],[8,0]])set(dx,dy,T.FLOWER,T.FLOOR);
 // town paths out to west/east/south
 for(let dx=-9;dx<=9;dx++){set(dx,1,T.PATH,T.PATH)}for(let dy=1;dy<=7;dy++){set(0,dy,dy===2?T.FOUNTAIN:T.PATH,T.PATH)}set(0,2,T.FOUNTAIN,T.PATH);
}
const NAMES=['Ava','Leo','Maya','Eli','Zoe','Jack','Nora','Owen','Lily','Mason','Ruby','Caleb','Ivy','Luke','Aria','Finn','Gus','Hazel','Jude','Kai','Mia','Nico','Quinn','Rosa','Sam','Tess','Wes','Yara','Coach Dale','Grandpa Joe','Aunt Bev','Ranger Tom','Hiker Sue','Fan Freddie','Mr. Patel','Ms. Kim','Big Lou','Dr. Ortiz'];
const SKINS=['#f6d3b3','#eab88e','#c98d5e','#9a6337','#6b4226'],HAIRS=['#2a1c14','#5b3a1f','#c9922e','#141414','#9c3a20','#d8d8d8','#e8c070'];
function genNPCs(prr,reach,cand,used){
 const P=a=>a[(prr()*a.length)|0];
 const mk=(x,y,kind,o={})=>{const n=Object.assign({id:'n'+npcs.length,x,y,tx:x,ty:y,prog:0,moving:false,dir:P(['down','left','right','up']),home:{x,y},rad:o.rad??2,kind,name:o.name||P(NAMES),
  look:{s:P(SKINS),h:P(HAIRS),t:hsl(prr()*360,55+prr()*25,48),p:hsl(prr()*360,25,30+prr()*20),hat:prr()<.35?hsl(prr()*360,60,45):null,fr:prr()<.2},timer:60+prr()*180,tip:(prr()*TIPS.length)|0},o);npcs.push(n);return n};
 POIS.forEach((p,k)=>{
  if(p.id==='champ'){const cx=p.x,cy=p.y+16;mk(cx-3,cy,'shop',{rad:0,name:'Camp Vendor',tier:3,dir:'down'});mk(cx,cy+1,'tip',{rad:1,name:'Old Scout'});return}
  mk(p.x-6,p.y+0,'shop',{rad:0,name:'Pro Shop',tier:{kickoff:0,harbor:1,dunes:1,rulebook:2,springs:2,peak:3,canton:3}[p.id],dir:'down'});
  const spots=[[-6,4],[5,4],[-3,-5],[3,6],[7,2],[-7,3],[4,-5]];for(let j=0;j<3;j++){const kind=P(['tip','tip','quiz','quiz','giver']);const[sx,sy]=spots.splice((prr()*spots.length)|0,1)[0];mk(p.x+sx,p.y+sy,kind,{rad:2})}
 });
 const kk=POIS[0];
 mk(kk.x+6,kk.y,'mom',{rad:0,name:'Mom',dir:'down',look:{s:'#f2c9a0',h:'#3a2418',t:'#c0506a',p:'#3b4a6b',hat:null,fr:true}});
 mk(kk.x+2,kk.y-7,'coach',{rad:0,name:'Coach Dale',dir:'down',look:{s:'#c98d5e',h:'#141414',t:'#e8443a',p:'#2a2a2a',hat:'#1a3a8a',fr:false}});
 // roadside
 const path=[];for(let i=0;i<map.length;i++)if(map[i]===T.PATH&&!town[i])path.push(i);
 let tries=0,n=0;while(n<22&&tries++<20000){const i=path[(prr()*path.length)|0],x=i%MW,y=(i/MW)|0;
  const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[x+a*2,y+b*2]).filter(([a,b])=>inb(a,b)&&reach[idx(a,b)]&&!SOLID.has(map[idx(a,b)])&&map[idx(a,b)]!==T.PATH&&!town[idx(a,b)]&&!used.has(idx(a,b)));
  if(!opts.length)continue;const[a,b]=opts[0];if(npcs.some(o=>Math.abs(o.x-a)+Math.abs(o.y-b)<13))continue;used.add(idx(a,b));
  mk(a,b,P(['tip','quiz','quiz','giver']),{rad:0});n++}
}

// ---------------- SPRITES: CHARACTERS ----------------
const OUT='#1a1230';
const CHR={
 down:["................",".....hhhhhh.....","...hhhhHHhhhh...","..hhhhhhhhhhhh..","..hhhhhhhhhhhh..","..hhhshhhhshhh..","..hssssssssssh..","..hssessssessh..","..hssessssessh..","..hsfsfssfsfsh..","...ssssmmssss...","...tttttttttt...","..tttttttttttt..","..sTttttttttTs.."],
 up:["................",".....hhhhhh.....","...hhhhHHhhhh...","..hhhhhhhhhhhh..","..hhhhHhhhhhhh..","..hhhhhhhhhhhh..","..hhhhhhhhhhhh..","..hhhhhhhhhhhh..","..shhhhhhhhhhs..","...hhhhhhhhhh...","....ssssssss....","...tttttttttt...","..tttttwwttttt..","..sTttttttttTs.."],
 left:["................",".....hhhhhh.....","....hhhhHHhhh...","...hhhhhhhhhhh..","...hhhhhhhhhhhh.","..hhshhhhhhhhhh.","..sssssshhhhhhh.",".ssesssshhhhhh..","..sesssssshhhh..","..sfsfsssssshh..","...smsssssss....","....tttttttt....","....tttttttt....","....ttssttTT...."],
};
const LEGS={
 down:[["....pppppppp....","....bbb..bbb...."],["....ppp..ppp....","....bbb...bb...."],["....ppp..ppp....","....bb...bbb...."]],
 up:[["....pppppppp....","....bbb..bbb...."],["....ppp..ppp....","....bbb...bb...."],["....ppp..ppp....","....bb...bbb...."]],
 left:[[".....pppppp.....",".....bbb.bbb...."],["....ppp..ppp....","...bbb....bbb..."],["......pppp......","......bbbb......"]],
};
function charPal(l){return{h:l.hat?l.h:l.h,H:shade(l.h,.25),s:l.s,S:shade(l.s,-.15),f:l.fr?'#b5633a':l.s,e:'#1b1b2a',m:'#b5534a',t:l.t,T:shade(l.t,-.25),w:'#ffffff',p:l.p,b:'#f0f0f0'}}
function renderGrid(rows,pal,flip,hat){const h=rows.length,w=rows[0].length;const c=document.createElement('canvas');c.width=w+2;c.height=h+2;const g=c.getContext('2d');
 const grid=[];for(let y=0;y<h;y++){grid.push([]);for(let x=0;x<w;x++){let ch=rows[y][flip?w-1-x:x];let col=ch==='.'?null:pal[ch];if(hat&&y<=3&&(ch==='h'||ch==='H'))col=ch==='H'?shade(hat,.25):hat;if(hat&&y===4&&ch==='h')col=shade(hat,-.2);grid[y].push(col)}}
 for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){const own=grid[y]&&grid[y][x];if(own){g.fillStyle=own;g.fillRect(x+1,y+1,1,1)}else{const n=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>grid[y+b]&&grid[y+b][x+a]);if(n){g.fillStyle=OUT;g.fillRect(x+1,y+1,1,1)}}}
 return c}
function makeCharSprites(look){const pal=charPal(look);const out={};
 for(const d of['down','up','left','right']){const src=d==='right'?'left':d;out[d]=LEGS[src].map(l=>renderGrid(CHR[src].concat(l),pal,d==='right',look.hat))}
 return out}
const HELM_LOOK={leatherhelm:{c:'#8a5a30'},practicehelm:{c:'#e8e8ec',x:'#c8202a',mask:1},visorhelm:{c:'#2f6fd6',x:'#ffffff',mask:1,visor:1},prohelm:{c:'#c8202a',x:'#ffffff',mask:1},titanhelm:{c:'#8a9aac',x:'#2a2a38',mask:1,visor:1},goldhelm:{c:'#f5c542',x:'#ffffff',mask:1},dinocrown:{c:'#f5c542',x:'#e0408a',mask:0,crown:1}};
const PAD_LOOK={jersey:{t:'#2f6fd6'},mesh:{t:'#2f6fd6',z:'#ffffff'},shoulder:{t:'#2f6fd6',bulk:1},ribs:{t:'#1f8a5a',bulk:1,z:'#ffffff'},probowl:{t:'#c8202a',bulk:2,z:'#ffffff'},dinoscale:{t:'#3aa655',bulk:2,k:'#1f6a35'},goldjacket:{t:'#e8b820',bulk:2,z:'#fff6c0'}};
const CLEAT_LOOK={sneakers:'#f0f0f0',turf:'#2a2a2a',molded:'#e8443a',speed:'#36c0f0',raptorcleats:'#7a4ab8',goldcleats:'#f5c542'};
function gearGrid(g,dir,H,P){
 if(P.bulk){if(dir==='left'){for(const r of[11,12])if(g[r][3]==='.')g[r][3]='t';if(P.bulk>1&&g[13][3]==='.')g[13][3]='T'}
  else{g[11][2]=g[11][13]='t';if(P.bulk>1){g[11][1]=g[11][14]='T';g[12][1]=g[12][14]='t'}}}
 if(P.z){if(dir!=='left'){for(const r of[11,12])for(const c of[3,12])if(g[r][c]==='t')g[r][c]='z'}else{for(let c=0;c<16;c++)if(g[11][c]==='t'&&c%3===0)g[11][c]='z'}}
 if(P.k)for(const r of[11,12,13])for(let c=0;c<16;c++)if(g[r][c]==='t'&&(r+c)%2===0)g[r][c]='k';
 if(!H)return;
 const rows=dir==='up'?[1,2,3,4,5,6,7,8,9]:[1,2,3,4,5];
 for(const r of rows)for(let c=0;c<16;c++){const ch=g[r][c];if(ch==='h'||ch==='H'||(dir==='up'&&r===8&&ch==='s'))g[r][c]='c'}
 if(dir!=='up')for(let r=6;r<=9;r++)for(let c=0;c<16;c++)if(g[r][c]==='h')g[r][c]='C';
 if(H.x){if(dir==='left'){for(let c=0;c<16;c++)if(g[1][c]==='c')g[1][c]='x'}else for(const r of dir==='up'?[1,2,3,4,5,6,7,8,9]:[1,2,3,4])for(const c of[7,8])if(g[r][c]==='c')g[r][c]='x'}
 if(H.crown){for(const c of(dir==='left'?[5,8,11]:[3,7,8,12]))g[0][c]='x';for(let c=0;c<16;c++)if(g[1][c]==='c')g[1][c]='x'}
 if(H.visor&&dir!=='up'){const lo=dir==='left'?1:3,hi=dir==='left'?6:12;for(const r of[7,8])for(let c=lo;c<=hi;c++)if(g[r][c]==='e'||g[r][c]==='s')g[r][c]=(r===7&&c===lo+1)?'V':'v'}
 if(H.mask&&dir!=='up'){for(let c=0;c<16;c++)if(g[10][c]==='s'||g[10][c]==='m')g[10][c]='g';if(dir==='down'){if(g[9][2]==='C')g[9][2]='g';if(g[9][13]==='C')g[9][13]='g'}}
}
// ---- player character look (Character Creator) ----
const HERO_DEF={name:'Brady',hair:'#2a1c14',style:'shaggy',skin:'#f2c9a0',fr:true};
const HERO_HAIR=[['#2a1c14','Dark brown'],['#141414','Black'],['#5b3a1f','Brown'],['#9c3a20','Auburn'],['#d0622a','Ginger'],['#e8c070','Blonde'],['#e8e4d8','Platinum'],['#3a7bd5','Blue'],['#e0608a','Pink'],['#3aa655','Green']];
const HERO_SKIN=['#f6d3b3','#f2c9a0','#eab88e','#c98d5e','#9a6337','#6b4226'];
const HERO_STYLES=[['shaggy','Shaggy'],['buzz','Buzz Cut'],['spiky','Spiky'],['long','Long'],['puffy','Puffy'],['ponytail','Ponytail']];
function cleanName(n){return String(n||'').replace(/[^\p{L}\p{N} '.\-]/gu,'').replace(/\s+/g,' ').trim().slice(0,12)}
function heroOf(sv){const h=Object.assign({},HERO_DEF,(sv&&sv.hero)||{});h.name=cleanName(h.name)||HERO_DEF.name;
 if(!HERO_STYLES.some(x=>x[0]===h.style))h.style=HERO_DEF.style;if(!/^#[0-9a-f]{6}$/i.test(h.hair))h.hair=HERO_DEF.hair;if(!/^#[0-9a-f]{6}$/i.test(h.skin))h.skin=HERO_DEF.skin;h.fr=!!h.fr;return h}
function NM(){return heroOf(S).name}          // player's name, plain text (dialog uses textContent)
function NMH(){return esc(NM())}               // player's name, HTML-safe
function poss(n){return n+(/s$/i.test(n)?"'":"'s")}
// Hair styles edit the 16-wide character grid. "top" changes (rows 0-9) are skipped under a helmet so
// helmets keep their exact shape; "j" pixels are extra hair the helmet code never touches (shows below/behind it).
function applyHair(g,dir,style,helm){
 const set=(r,cs,ch)=>{for(const c of cs)if(g[r])g[r][c]=ch};
 const rng=(a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push(i);return o};
 const sw=(r,cs,from,to)=>{for(const c of cs)if(g[r][c]===from)g[r][c]=to};
 const side=dir!=='left';
 if(style==='buzz'&&!helm){set(1,rng(0,15),'.');
  if(side){set(2,rng(0,15),'.');set(2,rng(4,11),'h');set(2,[7,8],'H');if(dir==='down'){sw(5,rng(3,12),'h','s');for(const r of[7,8,9])sw(r,[2,13],'h','s')}}
  else{set(2,rng(0,15),'.');set(2,rng(5,11),'h');set(2,[8,9],'H');sw(5,[2,3],'h','s')}}
 if(style==='spiky'&&!helm){
  if(side){set(0,[3,6,9,12],'h');set(1,rng(3,12),'h')}else{set(0,[6,9,12],'h');set(1,rng(4,13),'h');set(2,[13],'h')}}
 if(style==='puffy'&&!helm){
  if(side){set(0,rng(5,10),'h');set(1,rng(3,12),'h');set(2,[2,3,12,13],'h');for(const r of[3,4,5])set(r,[1,14],'h');for(const r of[6,7,8,9])set(r,[1,14],'h');if(dir==='up')set(8,[2,13],'h')}
  else{set(0,rng(5,11),'h');set(1,rng(4,12),'h');set(2,[3,13],'h');set(3,[2,14],'h');set(4,[2,15],'h');for(const r of[5,6])set(r,[15],'h');set(7,[14,15],'h');set(8,[14,15],'h');set(9,[14],'h')}}
 if(style==='long'){
  if(dir==='down'){if(!helm){for(let r=4;r<=10;r++)set(r,[1,14],'j');set(10,[2,13],'j')}set(11,[1,2,13,14],'j');set(12,[1,14],'j')}
  else if(dir==='up'){if(!helm){sw(8,[2,13],'s','h');set(9,[2,13],'h')}set(10,rng(3,12),'j');set(11,rng(4,11),'j')}
  else{if(!helm)for(let r=5;r<=9;r++)set(r,[14],'j');set(10,[12,13,14],'j');set(11,[12,13],'j')}}
 if(style==='ponytail'){
  if(dir==='down'){set(4,[14],'q');set(5,[14],'j');set(6,[14],'j');set(7,[14],'j')}
  else if(dir==='up'){set(10,[7,8],'q');set(11,[7,8],'j');set(12,[7,8],'j')}
  else{set(3,[14],'q');set(4,[15],'j');set(5,[15],'j');set(6,[15],'j');set(7,[15],'j');set(8,[14],'j')}}
}
function makeBradySprites(eqIn,heroIn){const eq=eqIn||(S&&S.equip)||{};const hero=heroIn||heroOf(S);const H=eq.helmet&&HELM_LOOK[eq.helmet],P=PAD_LOOK[eq.pads]||{t:'#6a8fd0'};
 const pal=charPal(Object.assign({},BRADY_LOOK,{s:hero.skin,h:hero.hair,fr:hero.fr}));pal.j=hero.hair;pal.q='#e8443a';
 pal.t=P.t;pal.T=shade(P.t,-.25);pal.b=CLEAT_LOOK[eq.cleats]||'#f0f0f0';pal.z=P.z||'#ffffff';pal.k=P.k||pal.T;
 if(H){pal.c=H.c;pal.C=shade(H.c,-.25);pal.x=H.x||shade(H.c,.3);pal.g='#9aa0aa';pal.v='#22304a';pal.V='#8fd0ff'}
 const out={};for(const d of['down','up','left','right']){const src=d==='right'?'left':d;
  out[d]=LEGS[src].map(l=>{const g=CHR[src].concat(l).map(r=>r.split(''));applyHair(g,src,hero.style,!!H);gearGrid(g,src,H,P);return renderGrid(g.map(r=>r.join('')),pal,d==='right',null)})}
 return out}
function rebuildBrady(){bradySpr=makeBradySprites();bradyRed=tint(bradySpr.right[0],'#ff3030');drawFace()}
const BRADY_LOOK={s:'#f2c9a0',h:'#2a1c14',t:'#2f6fd6',p:'#3b4a6b',hat:null,fr:true};
let bradySpr,bradyRed;

// ---------------- SPRITES: DINOSAURS ----------------
const FAMS=['rex','raptor','sauro','trike','stego','ankylo','ptero','spino'];
const FAMN={rex:'Rex-type',raptor:'Raptor-type',sauro:'Longneck-type',trike:'Horned-type',stego:'Plated-type',ankylo:'Armored-type',ptero:'Flyer-type',spino:'Sail-type'};
const PREF=['Blitz','Punt','Fumble','Huddle','Snap','Gridiron','Tackle','Spiral','Endzone','Sack','Hike','Kickoff','Pylon','Audible','Scramble','Lateral','Shotgun','Redzone','Touchback','Flag','Chain','Pigskin','Hashmark','Goalpost','Juke','Stiffarm','Nickel','Wildcat','Dropkick','Onside'];
const SUF={rex:['osaurus','rex','tyrant'],raptor:['raptor','nychus','ripper'],sauro:['osaurus','otitan','neck'],trike:['tops','ceratops','horn'],stego:['stego','oplates','odon'],ankylo:['ankylus','oshell','club'],ptero:['dactyl','odon','wing'],spino:['spinus','osail','ospino']};
function dinoName(f){let p=pick(PREF),s=pick(SUF[f]);if(s[0]==='o'&&/[aeiou]$/i.test(p))s=s.slice(1);return p+s}
function randPal(){const h=R()*360;return{B:hsl(h,40+R()*30,42+R()*12),L:hsl(h+30,45,78),P:hsl(h+(R()<.5?180:-35),50,28+R()*10),K:R()<.5?'#f0e6cc':'#6b6b78'}}
function makeDino(fam,pal,pattern,seed){
 const W=56,H=48,px=new Array(W*H).fill(null),rr=mulberry32(seed||1);
 const set=(x,y,c)=>{x=Math.floor(x);y=Math.floor(y);if(x>=0&&y>=0&&x<W&&y<H)px[y*W+x]=c};
 const get=(x,y)=>x>=0&&y>=0&&x<W&&y<H?px[y*W+x]:null;
 const ell=(cx,cy,rx,ry,c,cond)=>{for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const a=(x+.5-cx)/rx,b=(y+.5-cy)/ry;if(a*a+b*b<=1&&(!cond||cond(x,y)))set(x,y,c)}};
 const poly=(pts,c)=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;pts.forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)});for(let y=Math.floor(y0);y<=y1;y++)for(let x=Math.floor(x0);x<=x1;x++){let ins=false;const X=x+.5,Y=y+.5;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi)ins=!ins}if(ins)set(x,y,c)}};
 const line=(x0,y0,x1,y1,r0,r1,c)=>{const n=Math.ceil(Math.hypot(x1-x0,y1-y0))*2+1;for(let i=0;i<=n;i++){const t=i/n,r=r0+(r1-r0)*t;ell(x0+(x1-x0)*t,y0+(y1-y0)*t,r,r,c)}};
 const B=pal.B,D=shade(pal.B,-.3),L=pal.L,P=pal.P,K=pal.K,E='#111018',Wt='#ffffff';
 const eye=(x,y)=>{set(x,y,Wt);set(x+1,y,E);set(x,y+1,Wt);set(x+1,y+1,E)};
 const belly=(cx,cy,rx,ry,minY)=>ell(cx,cy,rx,ry,L,(x,y)=>y>=minY&&get(x,y)===B);
 if(fam==='rex'||fam==='spino'){
  if(fam==='spino'){ell(32,17,11,10,P,(x,y)=>y<25);for(let x=23;x<42;x+=3)line(x,26,x+1,11+Math.abs(32-x)/2,.6,.4,shade(P,-.3))}
  line(35,34,37,44,3.5,2.5,D);ell(36,45,4,1.6,D);
  poly([[38,23],[55,17],[55,21],[41,34]],B);
  ell(32,29,11,9,B);
  line(26,25,18,17,6,5,B);
  if(fam==='spino'){ell(12,15,10,4.5,B);ell(8,18,7,2.5,B)}else{ell(14,13,9,6,B);ell(12,18,8,3,B)}
  for(let x=5;x<18;x++)set(x,17,E);for(let x=6;x<17;x+=2)set(x,18,Wt);
  belly(29,34,8,6,30);
  line(24,30,20,33,1.6,1.1,D);set(19,34,Wt);
  ell(33,35,6,6,B);line(32,36,30,44,4,3,B);ell(28,45,5,1.7,B);set(23,46,Wt);set(25,46,Wt);
  eye(11,11);set(6,12,D);
 }else if(fam==='raptor'){
  line(32,32,34,44,2.5,1.5,D);ell(35,45,3.5,1.3,D);
  line(36,26,55,21,4,1,B);
  ell(30,27,9,6,B);line(23,24,16,16,3.6,3,B);ell(12,14,7,4.2,B);ell(6,15.5,4.5,2.4,B);
  for(let x=3;x<13;x++)set(x,17,E);for(let x=4;x<12;x+=2)set(x,18,Wt);
  line(13,10,22,8,1.6,.6,P);line(16,11,24,11,1.2,.5,P);
  belly(29,30,6,3,28);
  line(23,28,18,32,1.5,1,D);set(17,33,Wt);
  ell(31,32,4.5,4.5,B);line(31,32,28,39,3.5,2.4,B);line(28,39,30,44,2,1.5,B);ell(28,45,4,1.3,B);set(24,43,Wt);set(25,44,Wt);
  eye(10,12);
 }else if(fam==='sauro'){
  line(26,36,26,45,3,3,D);line(42,36,42,45,3,3,D);
  line(44,30,55,41,5,1,B);
  ell(34,32,13,9,B);line(24,28,11,9,5,3,B);ell(8,8,5.5,3.5,B);
  for(let x=4;x<9;x++)set(x,10,E);
  belly(34,37,10,4,34);
  line(28,37,28,45,3.6,3.6,B);line(40,37,40,45,3.6,3.6,B);set(26,46,Wt);set(29,46,Wt);set(38,46,Wt);set(41,46,Wt);
  eye(6,6);
 }else if(fam==='trike'){
  line(24,36,24,45,3,3,D);line(40,36,40,45,3,3,D);
  poly([[44,27],[55,33],[44,37]],B);
  ell(33,31,13,9,B);
  ell(21,23,8.5,10.5,P);ell(21,23,6.5,8.5,shade(P,.3));for(let a=0;a<6;a++){const an=-1.9+a*.65;set(21+Math.cos(an)*9.5,23+Math.sin(an)*11.5,K)}
  ell(13,30,9,6.5,B);poly([[2,31],[8,26],[8,35]],shade(K,-.4));
  poly([[11,25],[14,25],[5,13]],K);poly([[16,24],[19,25],[13,12]],K);poly([[5,27],[8,27],[3,22]],K);
  belly(33,36,10,4,33);
  line(27,37,27,45,4,4,B);line(38,37,38,45,4,4,B);
  eye(11,27);
 }else if(fam==='stego'){
  for(let i=0;i<6;i++){const x=19+i*5,y=24-Math.sin(i/5*Math.PI)*4;poly([[x-3.5,y+3],[x+3.5,y+3],[x,y-7]],P)}
  line(24,36,24,45,3,3,D);line(39,36,39,45,3,3,D);
  line(43,32,55,27,4,1.2,B);poly([[51,27],[53,27],[54,20]],K);poly([[48,29],[50,29],[49,22]],K);
  ell(31,32,14,8.5,B);line(19,35,10,37,4,3,B);ell(8,37,4.5,3,B);for(let x=4;x<9;x++)set(x,39,E);
  belly(31,37,11,4,35);
  line(27,37,27,45,3.6,3.6,B);line(37,37,37,45,3.6,3.6,B);
  eye(6,35);
 }else if(fam==='ankylo'){
  line(22,38,22,45,3,3,D);line(39,38,39,45,3,3,D);
  line(44,36,52,34,3,2,B);ell(52,34,4,3.5,K);ell(52,33,2,1.5,shade(K,.3));
  ell(30,35,16,8,B);
  for(let y=29;y<38;y+=4)for(let x=18+(y%8?2:0);x<44;x+=5)if(get(x,y)===B)ell(x,y,1.6,1.4,K,(a,b)=>get(a,b)===B);
  for(let x=16;x<46;x+=5)poly([[x,39],[x+3,39],[x+1.5,43]],Wt);
  ell(12,37,5.5,4.5,B);set(9,33,K);set(10,33,K);set(10,32,K);for(let x=7;x<12;x++)set(x,40,E);
  line(26,40,26,45,3.4,3.4,B);line(36,40,36,45,3.4,3.4,B);
  eye(10,35);
 }else if(fam==='ptero'){
  poly([[30,21],[53,8],[42,27]],D);
  ell(28,25,6,4.5,B);
  poly([[26,22],[3,7],[11,18],[24,29]],L);line(26,22,3,7,1.2,.5,B);
  ell(22,17,4.5,3.5,B);poly([[23,14],[35,8],[26,18]],P);poly([[19,16],[6,20],[19,19]],shade(K,-.2));
  belly(28,27,4,2,26);
  line(29,28,31,33,1,1,D);line(26,28,25,33,1,1,D);
  eye(20,16);
 }
 // patterns
 if(pattern==='stripes'){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(px[y*W+x]===B&&((x+Math.floor(y*.4))%7)<2&&y<38)px[y*W+x]=P}
 else if(pattern==='vstripes'){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(px[y*W+x]===B&&(x%5)<2)px[y*W+x]=P}
 else if(pattern==='spots'){for(let k=0;k<14;k++){let tries=0;while(tries++<40){const x=(rr()*W)|0,y=(rr()*H)|0;if(px[y*W+x]===B){ell(x,y,1.3+rr()*1.2,1.2+rr(),P,(a,b)=>get(a,b)===B);break}}}}
 // shading + outline
 const c=document.createElement('canvas');c.width=W+2;c.height=H+2;const g=c.getContext('2d');
 for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++){const v=get(x,y);if(v){let col=v;if(!get(x,y-1))col=shade(v,.22);else if(!get(x,y+1)||!get(x,y+2))col=shade(v,-.18);else if(!get(x+1,y))col=shade(v,-.1);g.fillStyle=col;g.fillRect(x+1,y+1,1,1)}else if(get(x+1,y)||get(x-1,y)||get(x,y+1)||get(x,y-1)){g.fillStyle=OUT;g.fillRect(x+1,y+1,1,1)}}
 return c}

function tint(c,col){const t=document.createElement('canvas');t.width=c.width;t.height=c.height;const g=t.getContext('2d');g.drawImage(c,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,t.width,t.height);return t}
// ---------------- TILES ----------------
const tileCache={};
let tseed=77;
function mkT(fn){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');fn(g,mulberry32(tseed++));return c}
const P_=(g,x,y,c,w=1,h=1)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
function circ(g,cx,cy,r,c){for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*.8)P_(g,cx+x,cy+y,c)}
function dots(g,r,cols,n){for(let i=0;i<n;i++)P_(g,(r()*16)|0,(r()*16)|0,cols[(r()*cols.length)|0])}
function buildTiles(){
 const tc=tileCache;
 tc[T.GRASS]=[0,1,2].map(()=>mkT((g,r)=>{P_(g,0,0,'#6cc04a',16,16);dots(g,r,['#5cae3e','#7ed05a'],18);for(let i=0;i<3;i++){const x=(r()*14)|0,y=(r()*13+2)|0;P_(g,x,y,'#4e9a36');P_(g,x+1,y-1,'#4e9a36')}}));
 tc[T.SAND]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#f0da9a',16,16);dots(g,r,['#e2c47c','#fff0c4','#d9b86a'],16)}));
 tc[T.PATH]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#d8b77a',16,16);dots(g,r,['#c49e5f','#e8cf9a'],16);P_(g,(r()*12)|0,(r()*12)|0,'#a98a5a',2,1)}));
 tc[T.MFLOOR]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#a8957a',16,16);dots(g,r,['#968468','#bba98d'],18);const x=(r()*10)|0,y=(r()*10)|0;P_(g,x,y,'#7d6c54',3,1);P_(g,x+2,y+1,'#7d6c54',1,2)}));
 tc[T.VFLOOR]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#4a3838',16,16);dots(g,r,['#5c4646','#3a2a2a'],18);if(r()<.5)P_(g,(r()*14)|0,(r()*14)|0,'#c0392b');P_(g,(r()*10)|0,(r()*12)|0,'#2a1c1c',4,1)}));
 tc[T.FLOOR]=[0,1].map(v=>mkT((g,r)=>{P_(g,0,0,'#d9cfb8',16,16);P_(g,0,0,'#bcae92',16,1);P_(g,0,8,'#bcae92',16,1);P_(g,0,0,'#bcae92',1,8);P_(g,8,8,'#bcae92',1,8);P_(g,1,1,'#e8e0cc',7,1);P_(g,9,9,'#e8e0cc',7,1);dots(g,r,['#cfc4aa'],5)}));
 tc[T.FIELD]=[0,1].map(v=>mkT((g,r)=>{P_(g,0,0,v?'#4caf50':'#43a047',16,16);dots(g,r,[v?'#55b859':'#3d9641'],10)}));
 tc[T.FIELDLINE]=[mkT((g,r)=>{P_(g,0,0,'#4caf50',16,16);P_(g,7,0,'#ffffff',2,16)})];
 tc[T.WATER]=[0,1].map(f=>mkT((g,r)=>{P_(g,0,0,'#3a7bd5',16,16);dots(g,r,['#336fc4'],10);for(let i=0;i<3;i++){const y=2+i*5,x=(i*5+f*4)%16;P_(g,x,y,'#7fb6ff',4,1);P_(g,(x+4)%16,y+1,'#7fb6ff',2,1)}}));
 tc[T.LAVA]=[0,1].map(f=>mkT((g,r)=>{P_(g,0,0,'#d8431c',16,16);for(let i=0;i<5;i++){const x=((r()*13)|0),y=((r()*13)|0);P_(g,x,y,f?'#ff8a1e':'#f06a1a',3,2)}dots(g,r,['#ffd23a'],f?4:2);dots(g,r,['#a82e10'],8)}));
 tc[T.BRIDGE]=[mkT((g,r)=>{P_(g,0,0,'#b07a45',16,16);for(let y=0;y<16;y+=4){P_(g,0,y+3,'#7a4f28',16,1);P_(g,0,y,'#c99260',16,1)}P_(g,0,0,'#5e3a1c',1,16);P_(g,15,0,'#5e3a1c',1,16)})];
 tc[T.WALL]=[mkT((g,r)=>{P_(g,0,0,'#efe3c6',16,16);for(let y=3;y<16;y+=4)P_(g,0,y,'#d4c29b',16,1);P_(g,0,15,'#a89670',16,1)})];
 tc[T.WINDOW]=[mkT((g,r)=>{P_(g,0,0,'#efe3c6',16,16);for(let y=3;y<16;y+=4)P_(g,0,y,'#d4c29b',16,1);P_(g,3,3,'#5a4630',10,9);P_(g,4,4,'#8fc4f0',8,7);P_(g,4,4,'#c8e4ff',3,2);P_(g,7,4,'#5a4630',1,7);P_(g,4,7,'#5a4630',8,1)})];
 tc[T.DOOR]=[mkT((g,r)=>{P_(g,0,0,'#efe3c6',16,16);P_(g,3,2,'#4a2e18',10,14);P_(g,4,3,'#8a5530',8,13);P_(g,4,8,'#7a4a26',8,1);P_(g,10,9,'#f5c542',1,2)})];
 const roof=(c1,c2,c3)=>mkT((g,r)=>{P_(g,0,0,c1,16,16);for(let y=0;y<16;y+=4){P_(g,0,y+3,c2,16,1);for(let x=(y/4%2)*4;x<16;x+=8)P_(g,x,y,c2,1,3)}P_(g,0,0,c3,16,1)});
 tc[T.ROOF]=[roof('#c8423a','#9a2e28','#e0605a')];tc[T.ROOFB]=[roof('#3f6fc8','#2c509a','#6a92e0')];
 // objects (transparent overlays)
 tc[T.TALL]=[0,1].map(()=>mkT((g,r)=>{for(const[x,y]of[[1,6],[8,6],[4,14],[11,14]]){P_(g,x,y-5,'#2f7a28',1,5);P_(g,x+2,y-6,'#2f7a28',1,6);P_(g,x+4,y-4,'#2f7a28',1,4);P_(g,x+1,y-4,'#7fd05a',1,4);P_(g,x+3,y-5,'#5fb848',1,5);P_(g,x,y,'#3a8a30',6,1)}}));
 tc[T.JUNGLE]=[0,1].map(()=>mkT((g,r)=>{P_(g,0,0,'#3f8f3a',16,16);for(const[x,y]of[[0,7],[7,6],[3,15],[10,15]]){P_(g,x,y-6,'#1d5a25',1,6);P_(g,x+2,y-7,'#1d5a25',1,7);P_(g,x+4,y-5,'#1d5a25',1,5);P_(g,x+1,y-5,'#5bb04e',1,5);P_(g,x+3,y-6,'#3a8a35',1,6)}}));
 tc[T.BRUSH]=[0,1].map(()=>mkT((g,r)=>{for(const[x,y]of[[2,6],[9,7],[5,14],[11,14]]){P_(g,x,y-3,'#8a7a3a',5,3);P_(g,x+1,y-4,'#a89448',3,1);P_(g,x,y-1,'#6a5a28',5,1);P_(g,x+2,y-5,'#6a5a28',1,1)}}));
 tc[T.FLOWER]=[0,1,2].map(()=>mkT((g,r)=>{for(let i=0;i<4;i++){const x=1+((r()*12)|0),y=1+((r()*12)|0),c=['#ff5a6e','#ffd84a','#ffffff','#c07aff'][(r()*4)|0];P_(g,x,y+1,'#3f8a2a',1,2);P_(g,x-1,y,c);P_(g,x+1,y,c);P_(g,x,y-1,c);P_(g,x,y+1,c);P_(g,x,y,'#ffe08a')}}));
 tc[T.TREE]=[0,1].map(()=>mkT((g,r)=>{P_(g,5,10,'#3a2414',6,6);P_(g,6,10,'#6b4226',4,6);circ(g,8,7,7,'#174d22');circ(g,8,7,6,'#2f8a3a');circ(g,6,5,3,'#4fb04a');P_(g,5,3,'#7fd06a',2,1);dots(g,r,['#24732e'],6)}));
 tc[T.PINE]=[0,1].map(()=>mkT((g,r)=>{P_(g,6,12,'#5a3a1e',4,4);for(let i=0;i<3;i++){const y=1+i*4,w=4+i*2;for(let k=0;k<5;k++){P_(g,8-w/2-k*.5+.5,y+k,'#1d5a2e',w+k,1)}}for(let i=0;i<3;i++){const y=2+i*4;P_(g,6,y,'#3f8f4a',2,2)}}));
 tc[T.ROCK]=[0,1].map(()=>mkT((g,r)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const a=(x-8)/7.2,b=(y-9)/6.2;const d=a*a+b*b;if(d<=1)P_(g,x,y,d>.75?'#3b3e46':(y<7?'#b5bac4':y>12?'#5d616b':'#8a8f99'))}P_(g,5,6,'#d8dce4',2,1)}));
 tc[T.CACTUS]=[mkT((g,r)=>{P_(g,6,2,'#1f5a26',4,14);P_(g,7,2,'#3fa04a',2,14);P_(g,2,6,'#1f5a26',3,2);P_(g,2,4,'#1f5a26',2,4);P_(g,11,8,'#1f5a26',3,2);P_(g,12,5,'#1f5a26',2,5);P_(g,3,4,'#3fa04a',1,3);P_(g,12,6,'#3fa04a',1,3);P_(g,8,1,'#ff6a9a')})];
 tc[T.COLUMN]=[mkT((g,r)=>{P_(g,3,1,'#5a5650',10,3);P_(g,4,2,'#ece8dc',8,1);P_(g,4,4,'#5a5650',8,10);P_(g,5,4,'#e8e4d8',6,10);P_(g,6,4,'#c8c2b0',1,10);P_(g,9,4,'#c8c2b0',1,10);P_(g,3,13,'#5a5650',10,3);P_(g,4,14,'#d8d2c2',8,1);if(r()<.5)P_(g,10,6,'#6cc04a',2,2)})];
 tc[T.FENCE]=[mkT((g,r)=>{P_(g,0,5,'#5e3a1c',16,3);P_(g,0,6,'#c08a4a',16,1);P_(g,0,10,'#5e3a1c',16,3);P_(g,0,11,'#c08a4a',16,1);for(const x of[2,12]){P_(g,x-1,3,'#5e3a1c',4,12);P_(g,x,4,'#d8a060',2,10)}})];
 tc[T.SIGN]=[mkT((g,r)=>{P_(g,7,9,'#4a2e18',2,7);P_(g,2,3,'#4a2e18',12,8);P_(g,3,4,'#c99260',10,6);P_(g,4,5,'#7a4f28',8,1);P_(g,4,7,'#7a4f28',6,1)})];
 tc[T.GOAL]=[mkT((g,r)=>{P_(g,7,8,'#c9a227',2,8);P_(g,2,7,'#f5d142',12,2);P_(g,2,0,'#f5d142',2,8);P_(g,12,0,'#f5d142',2,8);P_(g,2,0,'#fff0a0',1,8)})];
 tc[T.TOTEM]=[mkT((g,r)=>{P_(g,3,11,'#4a4a58',10,5);P_(g,4,12,'#8a8a98',8,3);for(let y=0;y<9;y++)for(let x=0;x<16;x++){const a=(x-8)/6,b=(y-5.5)/4;if(a*a+b*b<=1)P_(g,x,y,a*a+b*b>.7?'#8a5a10':'#f5c542')}P_(g,6,5,'#ffffff',4,1);for(let x=6;x<10;x+=2)P_(g,x,4,'#ffffff',1,3);P_(g,4,3,'#fff6c0',2,1)})];
 tc[T.FOUNTAIN]=[0,1].map(f=>mkT((g,r)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const a=(x-7.5)/7.5,b=(y-8)/7;const d=a*a+b*b;if(d<=1)P_(g,x,y,d>.62?(y<8?'#d8d8e0':'#9a9aa8'):'#4a90e8')}P_(g,6,4,'#c8e4ff',4,8);P_(g,7,1,'#c8e4ff',2,4);if(f){P_(g,4,5,'#ffffff');P_(g,11,9,'#ffffff')}else{P_(g,10,4,'#ffffff');P_(g,5,10,'#ffffff')}}));
 tc[T.MONO]=[mkT((g,r)=>{P_(g,3,13,'#3a3448',10,3);P_(g,4,1,'#2a2438',8,13);P_(g,5,0,'#2a2438',6,1);P_(g,5,1,'#5a5070',6,12);P_(g,5,1,'#7a7090',2,12);P_(g,6,3,'#2a2438',4,1);P_(g,6,10,'#2a2438',4,1)})];
 tc[T.GATE]=[mkT((g,r)=>{P_(g,0,0,'#b07a45',16,16);P_(g,0,0,'#2a2a38',16,3);for(let x=1;x<16;x+=3){P_(g,x,0,'#3a3a48',2,16);P_(g,x,0,'#f5c542',2,2)}P_(g,0,8,'#3a3a48',16,2)})];
}
const BASE_OF={[T.TALL]:T.GRASS,[T.JUNGLE]:T.GRASS,[T.FLOWER]:T.GRASS,[T.TREE]:T.GRASS,[T.PINE]:T.GRASS,[T.ROCK]:T.GRASS,[T.CACTUS]:T.SAND,[T.BRUSH]:T.SAND,[T.COLUMN]:T.GRASS,[T.TOTEM]:T.GRASS,[T.SIGN]:T.GRASS,[T.GOAL]:T.FIELD,[T.FENCE]:T.GRASS};
const hash=(x,y)=>((x*73856093)^(y*19349663))>>>0;

// ---------------- MINI ITEM SPRITES ----------------
let chestSpr,chestGoldSpr,chestOpen;
function buildMisc(){
 const ch=(body,band)=>mkT(g=>{P_(g,1,4,OUT,14,11);P_(g,2,5,body,12,9);P_(g,2,5,shade(body,.2),12,2);P_(g,2,8,band,12,2);P_(g,7,7,'#f5c542',2,4);P_(g,7,8,OUT,2,1);P_(g,1,14,'rgba(0,0,0,.25)',14,2)});
 chestSpr=ch('#9a5a2a','#5e3a1c');chestGoldSpr=ch('#f5c542','#b8860b');
 chestOpen=mkT(g=>{P_(g,1,7,OUT,14,8);P_(g,2,8,'#5e3a1c',12,6);P_(g,1,3,OUT,14,5);P_(g,2,4,'#7a4a20',12,3)});
}

// ---------------- CANVAS & RENDER ----------------
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
let camX=0,camY=0,frame=0,now=0;
const player={x:0,y:0,tx:0,ty:0,prog:0,moving:false,dir:'down',anim:0,bump:0};
function walkable(x,y,self){if(!inb(x,y))return false;const t=map[idx(x,y)];if(SOLID.has(t))return false;
 for(const n of npcs){if(n===self)continue;if((n.x===x&&n.y===y)||(n.moving&&n.tx===x&&n.ty===y))return false}
 if(self&&((player.x===x&&player.y===y)||(player.moving&&player.tx===x&&player.ty===y)))return false;
 for(const it of items)if(it.kind==='chest'&&it.x===x&&it.y===y)return false;
 for(const b of bosses)if(x>=b.x-1&&x<=b.x+1&&y>=b.y-1&&y<=b.y)return false;
 return true}
const LAYERED=new Set([...OBJ,T.FOUNTAIN]);
const SHADOW_OBJ=new Set([T.MONO,T.TREE,T.PINE,T.ROCK,T.CACTUS,T.COLUMN,T.TOTEM,T.SIGN,T.GOAL,T.FOUNTAIN,T.FENCE]);
const BLDG=new Set([T.WALL,T.WINDOW,T.DOOR,T.ROOF,T.ROOFB]);
function tileImg(t,x,y){const arr=tileCache[t]||tileCache[T.GRASS];const ab=(frame>>5)&1;
 if(t===T.WATER||t===T.LAVA||t===T.FOUNTAIN)return arr[ab%arr.length];if(t===T.FIELD)return arr[x&1];return arr[hash(x,y)%arr.length]}
function drawTile(t,x,y,sx,sy){ // ground layer
 if(LAYERED.has(t)){let b=base[idx(x,y)];if(LAYERED.has(b))b=T.GRASS;if(t===T.FOUNTAIN&&b!==T.PATH)b=T.FLOOR;drawTile(b,x,y,sx,sy);return}
 ctx.drawImage(tileImg(t,x,y),sx,sy);
 if(t===T.WATER){if(y>0&&map[idx(x,y-1)]!==T.WATER&&map[idx(x,y-1)]!==T.BRIDGE){ctx.fillStyle='#b8dcff';ctx.fillRect(sx,sy,16,1)}if(x>0&&map[idx(x-1,y)]!==T.WATER&&map[idx(x-1,y)]!==T.BRIDGE){ctx.fillStyle='#9cc9ff';ctx.fillRect(sx,sy,1,16)}}
}
function drawShadow(t,x,y,sx,sy){
 if(SHADOW_OBJ.has(t)){ctx.fillStyle='rgba(16,8,36,.34)';
  if(t===T.FENCE){ctx.fillRect(sx,sy+13,16,2);return}
  if(t===T.SIGN){ctx.fillRect(sx+5,sy+14,9,2);return}
  ctx.fillRect(sx+3,sy+13,14,2);ctx.fillRect(sx+5,sy+15,13,2);ctx.fillStyle='rgba(16,8,36,.18)';ctx.fillRect(sx+7,sy+17,10,1);ctx.fillRect(sx+16,sy+9,2,4);return}
 if(BLDG.has(t)){const below=y+1<MH?map[idx(x,y+1)]:t,right=x+1<MW?map[idx(x+1,y)]:t;
  if(!BLDG.has(below)){ctx.fillStyle='rgba(16,8,36,.32)';ctx.fillRect(sx+2,sy+16,14,3);ctx.fillStyle='rgba(16,8,36,.16)';ctx.fillRect(sx+3,sy+19,14,2)}
  if(!BLDG.has(right)){ctx.fillStyle='rgba(16,8,36,.28)';ctx.fillRect(sx+16,sy+4,3,BLDG.has(below)?12:15)}}
}
function drawOverlay(t,x,y,sx,sy){if(!LAYERED.has(t))return;ctx.drawImage(tileImg(t,x,y),sx,sy);
 if(t===T.MONO&&S){const all=secretReady()||(MONO_S&&x===MONO_S.x&&y===MONO_S.y);TIERS.forEach(([k,,c],i)=>{const lit=all||tierWins(k)>=SECRET_WINS;ctx.fillStyle=lit?c:'#3a3448';ctx.fillRect(sx+7,sy+3+i*2.5|0,2,2)});
  if(all){ctx.fillStyle=`rgba(200,160,255,${.25+.2*Math.sin(frame/8)})`;ctx.fillRect(sx+4,sy,8,14)}}}
let bumpFx=null;
function drawWorld(){
 const ppx=player.px,ppy=player.py;
 camX=Math.round(clamp(ppx+8-CW/2,0,MW*TS-CW));camY=Math.round(clamp(ppy+8-CH/2,0,MH*TS-CH));
 const x0=Math.floor(camX/TS),y0=Math.floor(camY/TS);
 const vw=Math.ceil(CW/TS),vh=Math.ceil(CH/TS);
 for(const fn of[drawTile,drawShadow,drawOverlay])for(let ty=y0-1;ty<=y0+vh+1;ty++)for(let tx=x0-1;tx<=x0+vw+1;tx++){if(!inb(tx,ty))continue;fn(map[idx(tx,ty)],tx,ty,tx*TS-camX,ty*TS-camY)}
 if(bumpFx&&bumpFx.t>0){bumpFx.t--;const a=bumpFx.t/24,sx=bumpFx.x*16-camX,sy=bumpFx.y*16-camY;ctx.strokeStyle=`rgba(255,255,255,${.9*a})`;ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,15,15);ctx.strokeStyle=`rgba(232,68,58,${.7*a})`;ctx.strokeRect(sx+1.5,sy+1.5,13,13);
  ctx.fillStyle=`rgba(255,255,255,${.8*a})`;const k=24-bumpFx.t,bx=player.px-camX+8+DX[player.dir]*7,by=player.py-camY+13+DY[player.dir]*5;ctx.fillRect(bx-3-k/3,by-k/4,2,2);ctx.fillRect(bx+2+k/3,by-k/4,2,2)}
 const ents=[];
 for(const it of items){if(Math.abs(it.x*16-ppx)>CW/2+40||Math.abs(it.y*16-ppy)>CH/2+40)continue;if(it.kind==='sparkle'&&S.taken[it.id])continue;ents.push({y:it.y*16,d:()=>drawItem(it)})}
 for(const n of npcs){if(Math.abs(n.px-ppx)>CW/2+40||Math.abs(n.py-ppy)>CH/2+40)continue;ents.push({y:n.py,d:()=>drawChar(n.spr,n.dir,n.moving?1+((n.prog/8)|0)%2:0,n.px,n.py)})}
 for(const b of bosses){if(Math.abs(b.x*16-ppx)>CW/2+80||Math.abs(b.y*16-ppy)>CH/2+80)continue;ents.push({y:b.y*16,d:()=>drawBossMap(b)})}
 if(state!=='title')ents.push({y:ppy,d:()=>{const n=bumpFx&&bumpFx.t>16?1:0;const fx=ppx+DX[player.dir]*n,fy=ppy+DY[player.dir]*n;drawAura(fx-camX,fy-camY);if(player.dir==='up')drawMiniWeapon(fx,fy,player.dir);drawChar(bradySpr,player.dir,player.moving?1+((player.anim/8)|0)%2:0,fx,fy);if(player.dir!=='up')drawMiniWeapon(fx,fy,player.dir)}});
 ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
 if(state!=='title')drawBradyFx(ppx,ppy);
 if(warpFx>0){warpFx--;ctx.fillStyle=`rgba(255,255,255,${warpFx/40})`;ctx.fillRect(0,0,CW,CH)}
 if(excl>0){const sx=ppx-camX+5,sy=ppy-camY-16;ctx.fillStyle=OUT;ctx.fillRect(sx-1,sy-1,8,12);ctx.fillStyle='#fff';ctx.fillRect(sx,sy,6,10);ctx.fillStyle='#e8443a';ctx.fillRect(sx+2,sy+1,2,5);ctx.fillRect(sx+2,sy+7,2,2)}
}
const fxp=[];
function legendCount(){return SLOTS.filter(k=>S.equip[k]&&GEAR[S.equip[k]].r>=4).length}
function mythicOn(){return SLOTS.some(k=>S.equip[k]&&GEAR[S.equip[k]].r>=5)}
function drawAura(sx,sy){if(S.lv>=20){const a=.2+.12*Math.sin(frame/10);ctx.fillStyle=S.lv>=30?`rgba(255,140,220,${a})`:`rgba(255,210,70,${a})`;ell(sx+8,sy+15,10,4);ctx.fillStyle=`rgba(255,240,180,${a*.8})`;ell(sx+8,sy+15,6,2.5)}}
function drawMiniWeapon(px,py,dir){const w=GEAR[S.equip.weapon];if(!w)return;const k=w.proj;const sx=Math.round(px-camX)+(dir==='left'?0:dir==='up'?12:12),sy=Math.round(py-camY)+(dir==='up'?7:9);
 const col={ball:'#8a4a20',gold:w.r>=5?'#ece4d0':'#f5c542',yflag:'#f5d142',rflag:'#e8443a',bottle:'#4a9af0',whistle:'#c8ccd8',cooler:'#f07a1a'}[k]||'#8a4a20';
 ctx.fillStyle=OUT;ctx.fillRect(sx-1,sy-1,6,5);ctx.fillStyle=col;ctx.fillRect(sx,sy,4,3);ctx.fillStyle='#fff';if(k==='ball'||k==='gold')ctx.fillRect(sx+1,sy+1,2,1);else if(k==='yflag'||k==='rflag')ctx.fillRect(sx,sy,1,1);else if(k==='cooler')ctx.fillRect(sx,sy,4,1);
 if(w.r>=4&&(frame>>3)%3===0){ctx.fillStyle='#fff6c0';ctx.fillRect(sx+3,sy-2,1,1)}}
function drawBradyFx(ppx,ppy){const lv=S.lv,lc=legendCount(),my=mythicOn();
 if(lv>=10&&frame%(lv>=20?10:26)===0)fxp.push({x:ppx+2+R()*12,y:ppy-2+R()*14,vy:-.35,t:36,m:36,c:lv>=30?'#ffb0e8':lv>=20?'#ffe08a':'#ffffff'});
 if((lc>=2||my)&&player.moving&&frame%4===0)fxp.push({x:ppx+4+R()*8,y:ppy+13,vy:-.2,t:28,m:28,c:my?'#ff7ac0':'#f5c542'});
 for(let i=fxp.length-1;i>=0;i--){const p=fxp[i];p.y+=p.vy;if(--p.t<=0){fxp.splice(i,1);continue}ctx.globalAlpha=p.t/p.m;ctx.fillStyle=p.c;const x=Math.round(p.x-camX),y=Math.round(p.y-camY);ctx.fillRect(x,y,1,1);if(p.t>p.m*.5){ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3)}}
 ctx.globalAlpha=1;
 if(S.champion){const a=frame/18,x=Math.round(ppx-camX+8+Math.cos(a)*9),y=Math.round(ppy-camY-5+Math.sin(a)*3);ctx.fillStyle=OUT;ctx.fillRect(x-2,y-1,5,3);ctx.fillRect(x-1,y-2,3,5);ctx.fillStyle='#ffe08a';ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3)}}
function drawChar(spr,dir,f,px,py){const sx=Math.round(px-camX),sy=Math.round(py-camY);
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx+3,sy+14,10,2);ctx.fillRect(sx+4,sy+15,8,2);
 ctx.drawImage(spr[dir][f],sx-1,sy-3-(f?1:0))}
function drawItem(it){const sx=it.x*16-camX,sy=it.y*16-camY;
 if(it.kind==='chest'){ctx.drawImage(S.taken[it.id]?chestOpen:(it.legend?chestGoldSpr:chestSpr),sx,sy);if(it.legend&&!S.taken[it.id]&&(frame>>3)%4===0){ctx.fillStyle='#fff';ctx.fillRect(sx+12,sy+3,1,3);ctx.fillRect(sx+11,sy+4,3,1)}}
 else{const p=(frame>>3)%4,c=['#ffffff','#fff6a0','#f5c542','#fff6a0'][p];const s=p===2?3:2;ctx.fillStyle=c;ctx.fillRect(sx+8,sy+8-s,1,s*2+1);ctx.fillRect(sx+8-s,sy+8,s*2+1,1);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillRect(sx+7,sy+7,3,3)}}
function drawBossMap(b){if(!b.spr)b.spr=makeDino(b.def.fam,b.def.pal,b.def.pattern,7);const s=b.spr;const sx=b.x*16+8-s.width/2-camX,sy=b.y*16+16-s.height-camY+Math.round(Math.sin(frame/20)*1);
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx+8,sy+s.height-3,s.width-16,4);ctx.drawImage(s,sx,sy);
 if(!S.bosses[b.poi]&&(frame>>4)%2===0){ctx.fillStyle=OUT;ctx.fillRect(sx+s.width/2-3,sy-12,7,11);ctx.fillStyle='#f5c542';ctx.fillRect(sx+s.width/2-2,sy-11,5,9);ctx.fillStyle=OUT;ctx.fillRect(sx+s.width/2,sy-10,1,4);ctx.fillRect(sx+s.width/2,sy-5,1,1)}}

// ---------------- ZOOM ----------------
function applyCanvasSize(battle){const z=battle?1:ZOOMS[zoomI];const w=Math.round(320*z),h=Math.round(208*z);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}CW=w;CH=h}
let zoomT=0;
function setZoom(d){if(state!=='world'&&state!=='title')return;const n=clamp(zoomI+d,0,ZOOMS.length-1);if(n===zoomI)return;zoomI=n;if(S&&state==='world'){S.zoom=n;saveGame(true)}toast(`🔍 Zoom: ${ZOOMN[n]}`);updZoomBtns()}
function updZoomBtns(){const a=$('#btnZin'),b=$('#btnZout');if(a)a.disabled=zoomI===0;if(b)b.disabled=zoomI===ZOOMS.length-1}
// ---------------- FULLSCREEN ----------------
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
function toggleFS(){const el=document.documentElement;
 try{if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
  const r=el.requestFullscreen||el.webkitRequestFullscreen;
  if(!r){toast("Full screen isn't available here. On iPhone: Share → Add to Home Screen.");return}
  const pr=r.call(el,{navigationUI:'hide'});if(pr&&pr.catch)pr.catch(()=>toast('This browser blocked full screen'))}catch(e){toast('This browser blocked full screen')}}
function updFsBtn(){const on=!!fsEl();document.querySelectorAll('.fsBtn').forEach(b=>b.textContent=on?'⛶ Exit full screen':'⛶ Full screen');const h=$('#btnFs');if(h)h.textContent=on?'⛶ Exit':'⛶'}
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{fit();updFsBtn();setTimeout(fit,150)}));
// ---------------- INPUT ----------------
const held={up:0,down:0,left:0,right:0,run:0};const dirStack=[];
const KEYMAP={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
function setDir(d,v){held[d]=v;const i=dirStack.indexOf(d);if(i>=0)dirStack.splice(i,1);if(v)dirStack.push(d)}
function curDir(){return dirStack.length?dirStack[dirStack.length-1]:null}
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const d=KEYMAP[e.code];
 if(d){e.preventDefault();if(!e.repeat){setDir(d,1);if(state!=='world')press('DIR',d)}return}
 if(e.key==='Shift'){held.run=1;return}
 if(['Equal','NumpadAdd'].includes(e.code)){e.preventDefault();setZoom(-1);return}
 if(['Minus','NumpadSubtract'].includes(e.code)){e.preventDefault();setZoom(1);return}
 if(e.repeat)return;
 if(['Space','Enter','KeyZ'].includes(e.code)){e.preventDefault();press('A')}
 else if(['Escape','Backspace','KeyX'].includes(e.code)){e.preventDefault();press('B')}
 else if(['KeyI','Tab'].includes(e.code)){e.preventDefault();press('MENU')}
 else if(e.code==='KeyM'){press('MAP')}
 else if(e.code==='KeyF'){toggleFS()}
 else if(/^Digit[1-4]$/.test(e.code)){press('ANS',+e.code.slice(5)-1)}
});
window.addEventListener('keyup',e=>{const d=KEYMAP[e.code];if(d)setDir(d,0);if(e.key==='Shift')held.run=0});
window.addEventListener('blur',()=>{for(const d of['up','down','left','right'])setDir(d,0);held.run=0});

// ---------------- AUDIO ----------------
let AC=null;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});return AC}
function tone(f,d,type='square',v=.05,when=0,f2){if(!S||!S.sound)return;const a=ac();if(!a)return;try{const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
const SFX={blip:()=>tone(880,.04,'square',.03),
 correct:()=>{tone(523,.09);tone(659,.09,'square',.05,.08);tone(784,.16,'square',.05,.16)},
 wrong:()=>{tone(220,.12,'sawtooth',.05);tone(150,.25,'sawtooth',.05,.1)},
 hit:()=>tone(300,.12,'square',.05,0,80),
 item:()=>{tone(784,.07);tone(1047,.12,'square',.05,.07)},
 level:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.12,'square',.05,i*.1))},
 encounter:()=>{[440,554,440,554,659].forEach((f,i)=>tone(f,.08,'square',.05,i*.07))},
 heal:()=>{[523,784,1047].forEach((f,i)=>tone(f,.1,'triangle',.07,i*.08))},
 bump:()=>tone(90,.06,'square',.03),
 win:()=>{[523,523,523,659,784,659,784,1047].forEach((f,i)=>tone(f,.12,'square',.05,i*.11))}};

// ---------------- GAME STATE ----------------
let state='title',excl=0,graceSteps=0,lastRegion=-1,lastTown=0,titleT=0;
function stats(){const s={atk:12+(S.lv-1)*3,def:S.lv-1,hp:60+(S.lv-1)*12,crit:.08,dodge:0,heal:0};
 for(const k of SLOTS){const id=S.equip[k];if(!id)continue;const g=GEAR[id];s.atk+=g.atk||0;s.def+=g.def||0;s.hp+=g.hp||0;s.crit+=(g.crit||0)/100;s.dodge+=(g.dodge||0)/100;s.heal+=g.heal||0}
 return s}
const xpNeed=lv=>20+lv*18;
function regionPoi(x,y){return POIS[region[idx(x,y)]]}

// ---------------- WORLD UPDATE ----------------
function startPlayer(){player.x=player.tx=S.x;player.y=player.ty=S.y;player.dir=S.dir||'down';player.prog=0;player.moving=false;player.px=S.x*16;player.py=S.y*16}
function updateWorld(){
 if(excl>0){excl--;if(excl===0)beginWild();return}
 const p=player;
 if(p.moving){p.prog+=p.spd;p.anim+=p.spd/1.6;if(p.prog>=16){p.prog=0;p.moving=false;p.x=p.tx;p.y=p.ty;onStep()}}
 if(!p.moving&&state==='world'){const d=curDir();if(d){p.dir=d;const nx=p.x+DX[d],ny=p.y+DY[d];if(walkable(nx,ny)){p.tx=nx;p.ty=ny;p.moving=true;p.spd=held.run?4:2}else if(p.bump--<=0){p.bump=18;SFX.bump();bumpFx={x:nx,y:ny,t:24}}}else p.anim=0}
 p.px=(p.x+(p.tx-p.x)*p.prog/16)*16;p.py=(p.y+(p.ty-p.y)*p.prog/16)*16;
 for(const n of npcs){
  if(n.moving){n.prog+=1;if(n.prog>=16){n.prog=0;n.moving=false;n.x=n.tx;n.y=n.ty}}
  else if(n.rad>0&&--n.timer<=0){n.timer=90+R()*200;const d=pick(['up','down','left','right']);n.dir=d;const nx=n.x+DX[d],ny=n.y+DY[d];if(Math.abs(nx-n.home.x)<=n.rad&&Math.abs(ny-n.home.y)<=n.rad&&walkable(nx,ny,n)&&!town[idx(nx,ny)]===!town[idx(n.x,n.y)]){n.tx=nx;n.ty=ny;n.moving=true}}
  else if(n.rad===0&&--n.timer<=0&&n.kind!=='shop'){n.timer=120+R()*240;n.dir=pick(['up','down','left','right'])}
  n.px=(n.x+(n.tx-n.x)*n.prog/16)*16;n.py=(n.y+(n.ty-n.y)*n.prog/16)*16;
 }
}
function onStep(){
 S.x=player.x;S.y=player.y;S.dir=player.dir;S.steps++;
 const i=idx(player.x,player.y);
 // passive regen
 if(S.steps%20===0)saveGame(true);
 if(S.steps%8===0){const mx=stats().hp;if(S.hp<mx){S.hp++;updHud()}}
 if(S.buffs.horn){S.buffs.horn--;if(S.buffs.horn<=0){delete S.buffs.horn;toast('📯 Air Horn wore off')}updHud()}
 // sparkle pickup
 for(const it of items)if(it.kind==='sparkle'&&!S.taken[it.id]&&it.x===player.x&&it.y===player.y){S.taken[it.id]=1;if(R()<.3){const c=rint(15,40);S.coins+=c;toast(`✨ Found ${c} coins!`)}else{const k=rollCons();S.inv[k]=(S.inv[k]||0)+1;toast(`✨ Found ${CONS[k].icon} ${CONS[k].name}!`)}SFX.item();updHud()}
 // region & town
 const r=region[i];if(r!==lastRegion){lastRegion=r;banner(POIS[r].region)}
 const tw=town[i];if(tw!==lastTown){lastTown=tw;if(tw===SANCT_ID){if(map[i]!==T.WATER)banner('✦ The Fossil Sanctum ✦')}else if(tw){const p=POIS[tw-1];if(!S.visited[p.id]){S.visited[p.id]=1}banner(p.name);saveGame(true)}}
 updObjective();
 if(graceSteps>0){graceSteps--;return}
 if(tw||S.buffs.horn)return;
 const rate=ENC[map[i]]||0;
 if(R()<rate){excl=30;SFX.encounter()}
}
function facing(){return[player.x+DX[player.dir],player.y+DY[player.dir]]}
function interact(){if(player.moving)return;
 const[fx,fy]=facing();if(!inb(fx,fy))return;
 const n=npcs.find(n=>n.x===fx&&n.y===fy&&!n.moving);if(n){talk(n);return}
 const it=items.find(it=>it.kind==='chest'&&it.x===fx&&it.y===fy);if(it){openChest(it);return}
 const b=bosses.find(b=>fx>=b.x-1&&fx<=b.x+1&&fy>=b.y-1&&fy<=b.y);if(b){bossTalk(b);return}
 const t=map[idx(fx,fy)];
 if(t===T.FOUNTAIN){S.hp=stats().hp;S.respawn={x:player.x,y:player.y};SFX.heal();updHud();saveGame(true);dialog([`${NM()} takes a big drink at the Hydration Station.','HP fully restored! Respawn point set and game saved. 💾`]);return}
 if(t===T.MONO){useMonolith(fx,fy);return}
 if(t===T.SIGN&&town[idx(fx,fy)]===SANCT_ID){dialog(['THE FOSSIL SANCTUM','Only those who have won battles on every difficulty may stand here.','The GOAT-osaurus waits on the ancient field. The monolith returns you home.']);return}
 if(t===T.SIGN){const p=POIS[(town[idx(fx,fy)]||1)-1];const lines=[p.id==='champ'?'LAST CHANCE CAMP. Championship Stadium lies north, past the lava gate.':`Welcome to ${p.name.toUpperCase()}!`];if(p.boss&&p.id!=='champ')lines.push(`Home of ${p.boss.name}, Head Coach of ${CATS[p.cat].name.toUpperCase()}. The coach waits on the practice field to the north.`);if(p.id==='kickoff')lines.push('Hydration Station (fountain): heal and save. Pro Shop: buy gear. Tall grass: wild dinos!');dialog(lines);return}
 if(t===T.TOTEM){const tt=totems.find(o=>o.x===fx&&o.y===fy);const last=S.totem[tt.id];if(last!=null&&S.steps-last<300){dialog([`The Pep Rally Totem is quiet... Come back after ${300-(S.steps-last)} more steps.`]);return}
  S.totem[tt.id]=S.steps;S.st.totems=(S.st.totems||0)+1;const k=pick(['pep','guard','regen','film','lucky','horn']);const amt=k==='horn'?150:3;S.buffs[k]=(S.buffs[k]||0)+amt;const heal=Math.round(stats().hp*.3);S.hp=Math.min(stats().hp,S.hp+heal);SFX.level();updHud();
  dialog([`📣 The Pep Rally Totem ROARS with crowd noise!`,`${NM()} gains ${BUFFS[k].icon} ${BUFFS[k].name} ${k==='horn'?'(150 steps)':'(3 battles)'} and recovers ${heal} HP!`]);return}
 if(t===T.GATE){if(S.trophies.length>=6){openGate();return}dialog([`A heavy gate guards Championship Stadium.`,`Only a player with all 6 Coach Trophies may enter. (You have ${S.trophies.length}/6)`]);return}
 if(t===T.DOOR){dialog(['The door is locked. Everyone is outside watching football!']);return}
}
const TIERS=[['rookie','Rookie','#3ccf5a'],['pro','Pro','#f0c030'],['allpro','All-Pro','#e84030'],['superfan','Superfan','#b050e0']];
const SECRET_WINS=5;
function tierWins(t){return(S.st.winsBy&&S.st.winsBy[t])||0}
function secretReady(){return TIERS.every(([t])=>tierWins(t)>=SECRET_WINS)}
function useMonolith(x,y){
 if(MONO_S&&x===MONO_S.x&&y===MONO_S.y){choice('The monolith hums softly. Return to Kickoff Town?',['Warp home','Stay'],i=>{if(i===0)warp(MONO_K.x,MONO_K.y+1,'Kickoff Town')});return}
 const prog=TIERS.map(([t,n])=>`${tierWins(t)>=SECRET_WINS?'💎':'⬛'} ${n}: ${Math.min(tierWins(t),SECRET_WINS)}/${SECRET_WINS} wins`).join('   ');
 if(!SANCT){dialog(['An ancient monolith. It is silent.']);return}
 if(secretReady()){choice('All four gems blaze with light! The monolith opens a path to somewhere... hidden. Step through?',['Step through','Not yet'],i=>{if(i===0){S.sanctum=1;warp(MONO_S.x,MONO_S.y-1,null)}});return}
 dialog(['An ancient monolith with four empty gem sockets, one for each difficulty.',`It awakens for those who win ${SECRET_WINS} battles on EVERY difficulty. Change difficulty in Menu → Options.`,prog])}
let warpFx=0;
function warp(x,y,name){S.x=x;S.y=y;startPlayer();lastRegion=-1;lastTown=-1;warpFx=40;SFX.level();if(name)banner(name);saveGame(true);drawMiniMap(true)}
function openGate(){for(let i=0;i<map.length;i++)if(map[i]===T.GATE)map[i]=T.BRIDGE;S.gateOpen=true;SFX.win();dialog(['The six trophies glow... The Championship Gate swings open!',`Commissioner Spino awaits in the stadium. Good luck, ${NM()}!`]);drawMiniMap(true)}
function openChest(it){
 if(S.taken[it.id]){dialog(['The chest is empty.']);return}
 if(it.legend){const L=LEGENDS[it.legend],g=GEAR[it.legend];
  dialog([`✨ A LEGENDARY CHEST! Inside: the ${g.icon} ${g.name}! ✨`,'But a gruff old coach is guarding it...',`${L.name}, ${L.title}`].concat(L.intro.map(l=>`${L.name}: ${l}`)),()=>
   choice(`⚠️ LEGEND CHALLENGE: ${L.name} asks only SUPERFAN questions (deep-cut history, records, classic games) with a 12-second shot clock. Recommended: Lv 15+ with good gear. Accept?`,['Bring it on!','Not yet'],i=>{
    if(i===0){const e=makeEnemy(L.fam,22,{name:L.name,pal:L.pal,pattern:L.pattern,boss:true,legend:true});startBattle(e,{legend:it,cat:null,diff:[4,4],shotclock:12})}
    else dialog([`${L.name}: Come back when you're ready. IF you're ever ready.`])}));return}
 S.taken[it.id]=1;SFX.item();S.st.chests=(S.st.chests||0)+1;const lines=[];
 if(it.legend){const g=GEAR[it.legend];S.gear.push(it.legend);lines.push(`✨ A LEGENDARY CHEST! ✨`,`${NM()} found the ${g.icon} ${g.name}! (${gearDesc(g)})`,'Equip it from the Menu → Gear.')}
 else{const lv=4+it.tier*4;const r=R();
  if(r<.35){const id=rollGear(lv);const g=GEAR[id];S.gear.push(id);lines.push(`${NM()} found ${g.icon} ${g.name}! [${RAR[g.r].n}]`,`${gearDesc(g)}. Equip it from the Menu → Gear.`)}
  else if(r<.92){const k=rollCons(),n=rint(1,2);S.inv[k]=(S.inv[k]||0)+n;lines.push(`${NM()} found ${CONS[k].icon} ${CONS[k].name} x${n}!`,CONS[k].desc+'.')}
  else{const c=rint(50,150);S.coins+=c;lines.push(`${NM()} found a bag of ${c} coins! 🪙`)}}
 updHud();dialog(lines)}
function talk(n){
 const dd={up:'down',down:'up',left:'right',right:'left'};n.dir=dd[player.dir];
 const key=n.id;
 if(n.kind==='shop'){dialog([`${n.name}: Welcome! Need gear for the Gridiron?`],()=>openShop(n));return}
 if(n.kind==='mom'){if(!S.npc.mom){S.npc.mom=1;S.inv.water=(S.inv.water||0)+3;SFX.item();dialog([`Mom: ${NM()}! Be careful out there with all those dinosaurs.`,"Here, take 3 more Water Bottles. Stay hydrated!","And remember: the Hydration Station fountain heals you and saves your game."]);updHud()}else dialog([pick(["Mom: Don't forget your sunscreen, sweetie!","Mom: I'm so proud of you! Keep studying that playbook.","Mom: Dinner's at six. Finish your battles by then!"])]);return}
 if(n.kind==='coach'){choice(`Coach Dale: Hey ${NM()}! Want a practice rep against a training dino? Questions are easy and it's a good warm-up.`,['Let\'s go!','Not now'],i=>{if(i===0){startBattle(makeEnemy('raptor',1,{name:'Tackle Dummy-raptor',pal:{B:'#c8a060',L:'#f0e0c0',P:'#8a2a2a',K:'#f4f4f4'},pattern:'stripes'}),{practice:true,cat:null,diff:[1,1]})}else dialog(["Coach Dale: Remember: right answers hit hard, and answering in a row builds your streak!"])});return}
 if(n.kind==='tip'){dialog([`${n.name}: ${TIPS[(n.tip+S.steps)%TIPS.length]}`]);return}
 if(n.kind==='giver'){if(!S.npc[key]){S.npc[key]=1;const k=rollCons();S.inv[k]=(S.inv[k]||0)+1;SFX.item();updHud();dialog([`${n.name}: You look like you could use this!`,`${NM()} received ${CONS[k].icon} ${CONS[k].name}! (${CONS[k].desc})`])}else dialog([`${n.name}: ${TIPS[(n.tip+3)%TIPS.length]}`]);return}
 if(n.kind==='quiz'){const reg=regionPoi(n.x,n.y);let q;for(let t=0;t<12;t++){q=pickQuestion(reg.cat&&R()<.6?reg.cat:null,1,reg.diff[1]);if(!q.pic)break}const opts=shuffle([q.a,...q.w]);const first=!S.npc[key];
  choice(`${n.name}: POP QUIZ! ${first?'(Get it right for 25 coins!) ':''}${q.q}`,opts,i=>{const ok=opts[i]===q.a;recordAnswer(q,ok);
   if(ok){SFX.correct();let l=[`✔ Correct! ${q.x}`];if(first){S.npc[key]=1;S.coins+=25;l.push(`${NM()} earned 25 coins! 🪙`)}updHud();dialog(l)}
   else{SFX.wrong();dialog([`✘ Not quite. The answer is: ${q.a}.`,q.x,'(Added to your Film Room for review.)'])}});return}
}
function bossTalk(b){const d=b.def;
 if(b.secret){if(S.bosses.goat){dialog([`${d.name}: You've already proven it. Now go teach someone else the game.`]);return}
  dialog(d.intro.map(l=>`${d.name}: ${l}`),()=>choice(`⚠️ SECRET BOSS: mixed All-Pro and Superfan questions, 10-second shot clock. Recommended: Lv 25+. Ready?`,['Kickoff!','Not yet'],i=>{if(i===0){const e=makeEnemy(d.fam,d.lv,{name:d.name,pal:d.pal,pattern:d.pattern,boss:true,legend:true});startBattle(e,{secretBoss:b,cat:null,diff:[3,4],shotclock:10})}}));return}
 const p=poiById(b.poi);
 if(S.bosses[b.poi]){dialog([`${d.name}: Great game, ${NM()}! Keep studying ${p.cat?CATS[p.cat].name:'everything'}!`]);return}
 if(d.final&&S.trophies.length<6){dialog([`${d.name}: Come back with all six trophies.`]);return}
 dialog(d.intro.map(l=>`${d.name}: ${l}`),()=>{const e=makeEnemy(d.fam,d.lv,{name:d.name,pal:d.pal,pattern:d.pattern,boss:true});startBattle(e,{boss:b,cat:p.cat,diff:p.cat?[1,3]:[2,3]})})}

// ---------------- QUESTIONS ----------------
const recent=[];
function pickQuestion(cat,dmin,dmax,preferMissed){
 if(dmin<4){if(S.diff==='rookie')dmax=Math.min(dmax,2);if(S.diff==='allpro')dmin=Math.max(dmin,Math.min(2,dmax));if(S.diff==='superfan'){dmin=3;dmax=4}}
 let pool=QB.filter(q=>(!cat||q.cat===cat)&&q.d>=dmin&&q.d<=dmax);if(pool.length<4)pool=QB.filter(q=>!cat||q.cat===cat);
 const avail=pool.filter(q=>!recent.includes(q.id));let P=avail.length?avail:pool;
 if(S.diff==='superfan'&&dmax>=4&&R()<.7){const p4=P.filter(q=>q.d===4);if(p4.length)P=p4}
 const missed=P.filter(q=>S.missed[q.id]);let q;
 if(missed.length&&(preferMissed||R()<.25))q=pick(missed);
 else{const fresh=P.filter(q=>!S.seen[q.id]);q=pick(fresh.length?fresh:P)}
 recent.push(q.id);if(recent.length>15)recent.shift();return q}
function recordAnswer(q,ok){if(ok&&q.pic){if(q.pic.startsWith('sig'))S.st.sig=(S.st.sig||0)+1;else S.st.form=(S.st.form||0)+1}S.seen[q.id]=(S.seen[q.id]||0)+1;S.st.ans++;const c=S.st.cat[q.cat]||(S.st.cat[q.cat]=[0,0]);c[0]++;
 if(ok){S.st.cor++;c[1]++;S.st.streak++;S.st.best=Math.max(S.st.best,S.st.streak);if(S.missed[q.id]){S.missed[q.id]--;if(S.missed[q.id]<=0){delete S.missed[q.id];S.st.mastered=(S.st.mastered||0)+1}}}
 else{S.st.streak=0;S.missed[q.id]=2}}

// ---------------- PICTURE QUESTIONS ----------------
const N_=[100,95],NL_=[80,85];
// Signal poses. Arms: [upperAngle, forearmAngle] in degrees (0 = image right, 90 = down), or {h:[x,y], e:[x,y]}:
// put the wrist at h, bending the elbow toward e. Hands: fist | palm | flat | point | grab | hide. z:'r' draws the
// ref's right arm (image left) in front. grab:1 aims the left hand at the right wrist.
const SIGNALS={
 touchdown:{n:'Touchdown',d:1,x:'Both arms straight up means touchdown. The same signal means a field goal or extra point is good.',hands:{r:'palm',l:'palm'},f:[{r:[-98,-94],l:[-82,-86]}]},
 firstdown:{n:'First down',d:1,x:'Pointing toward the defense\'s end zone means first down.',hands:{r:'fist',l:'point'},f:[{r:N_,l:[0,0]}]},
 incomplete:{n:'Incomplete pass',d:1,x:'Arms swinging back and forth across the body means incomplete pass. It also means a penalty was declined or a kick was missed.',hands:{r:'flat',l:'flat'},f:[{r:[150,170],l:[30,10]},{r:[60,0],l:[120,180],z:'r'}]},
 timeout:{n:'Timeout',d:1,x:'Hands crossed above the head means timeout.',hands:{r:'palm',l:'palm'},f:[{r:{h:[76,8],e:[34,30]},l:{h:[52,8],e:[94,30]}}]},
 holding:{n:'Holding',d:1,x:'Grabbing one wrist in front of the chest means holding.',hands:{r:'fist',l:'grab'},f:[{r:{h:[58,52],e:[56,80]},l:{grab:1,e:[86,80]}}]},
 safety:{n:'Safety',d:2,x:'Palms pressed together above the head means safety: 2 points for the defense.',hands:{r:'palm',l:'palm'},f:[{r:{h:[61,13],e:[34,32]},l:{h:[67,13],e:[94,32]}}]},
 falsestart:{n:'False start',d:2,x:'Forearms rolling over each other in front of the body means false start (or illegal formation).',hands:{r:'fist',l:'fist'},f:[{r:{h:[72,62],e:[46,80]},l:{h:[58,74],e:[82,82]}},{r:{h:[70,70],e:[46,80]},l:{h:[56,64],e:[82,82]},z:'r'},{r:{h:[66,74],e:[46,80]},l:{h:[62,60],e:[82,82]}}]},
 offside:{n:'Offside',d:2,x:'Hands on the hips means offside (or encroachment).',hands:{r:'fist',l:'fist'},f:[{r:{h:[48,86],e:[30,70]},l:{h:[80,86],e:[98,70]}}]},
 pi:{n:'Pass interference',d:2,x:'Open hands pushing forward from the shoulders means pass interference.',hands:{r:'palm',l:'palm'},f:[{r:{h:[50,48],e:[44,76]},l:{h:[78,48],e:[84,76]}},{r:{h:[46,40],e:[36,70]},l:{h:[82,40],e:[92,70]}}]},
 personalfoul:{n:'Personal foul',d:2,x:'One wrist chopping down on the other above the head means personal foul.',hands:{r:'flat',l:'flat'},f:[{r:{h:[76,10],e:[34,26]},l:{h:[90,8],e:[104,40]}},{r:{h:[76,10],e:[34,26]},l:{h:[72,4],e:[100,40]}}]},
 delay:{n:'Delay of game',d:2,x:'Arms folded across the chest means delay of game.',hands:{r:'fist',l:'fist'},f:[{r:{h:[76,66],e:[50,76]},l:{h:[52,72],e:[78,82]},z:'r'}]},
 facemask:{n:'Face mask',d:2,x:'Grabbing the face mask and pulling down means face mask penalty.',hands:{r:'grab',l:'fist'},front:1,f:[{r:{h:[62,45],e:[58,78]},l:NL_},{r:{h:[62,60],e:[54,86]},l:NL_}]},
 unsportsmanlike:{n:'Unsportsmanlike conduct',d:3,x:'Arms stretched straight out to the sides, palms down, means unsportsmanlike conduct.',hands:{r:'flat',l:'flat'},f:[{r:[180,180],l:[0,0]}]},
 grounding:{n:'Intentional grounding',d:3,x:'Both arms waving together on a diagonal across the body means intentional grounding.',hands:{r:'flat',l:'flat'},f:[{r:[-35,-35],l:[-35,-35],z:'r'},{r:[145,145],l:[145,145]}]},
 lossofdown:{n:'Loss of down',d:3,x:'Both hands held behind the head means loss of down.',hands:{r:'hide',l:'hide'},behind:1,f:[{r:{h:[56,24],e:[28,30]},l:{h:[72,24],e:[100,30]}}]},
};
const OFF_BASE=[[48,48],[54,48],[60,48],[66,48],[72,48]];
const FORMS={
 iform:{n:'I-formation',d:1,side:'o',x:'The I-formation puts the QB under center with the fullback and tailback stacked in a straight line behind him, like the letter I.',o:[[78,48],[12,48],[108,49]],qb:[60,53],b:[[60,60],[60,67]]},
 shotgun:{n:'Shotgun',d:1,side:'o',x:'In the shotgun, the QB stands several yards behind the center with a running back beside him.',o:[[78,48],[12,48],[108,49],[92,50]],qb:[60,62],b:[[68,62]]},
 victory:{n:'Victory formation',d:1,side:'o',x:'In the victory formation the QB takes the snap and kneels to run out the clock, with backs close by to guard against a fumble.',o:[[78,48],[42,48]],qb:[60,53],b:[[53,56],[67,56],[60,66]],kneel:1},
 pistol:{n:'Pistol',d:2,side:'o',x:'The pistol puts the QB about 4 yards behind the center (closer than the shotgun) with the running back directly behind him.',o:[[78,48],[12,48],[108,49]],qb:[60,58],b:[[60,67]]},
 singleback:{n:'Singleback',d:2,side:'o',x:'Singleback has the QB under center with just one running back behind him.',o:[[78,48],[42,48],[12,48],[108,49]],qb:[60,53],b:[[60,64]]},
 empty:{n:'Empty backfield',d:2,side:'o',x:'An empty backfield has no running backs behind the QB: five receivers spread out to pass.',o:[[8,48],[20,50],[96,50],[108,48],[78,48]],qb:[60,60],b:[]},
 wishbone:{n:'Wishbone',d:3,side:'o',x:'The wishbone has a fullback right behind the QB and two halfbacks behind him, forming a Y like a wishbone.',o:[[78,48],[12,48]],qb:[60,53],b:[[60,59],[51,65],[69,65]]},
 d43:{n:'4-3 defense',d:2,side:'d',x:'A 4-3 defense has 4 defensive linemen and 3 linebackers.',dl:[49,56,64,71],lb:[48,60,72],cb:[[12,38],[108,38]],s:[[44,24],[76,24]]},
 d34:{n:'3-4 defense',d:2,side:'d',x:'A 3-4 defense has 3 defensive linemen and 4 linebackers.',dl:[52,60,68],lb:[38,52,68,82],cb:[[12,38],[108,38]],s:[[44,24],[76,24]]},
 nickel:{n:'Nickel defense',d:3,side:'d',x:'Nickel defense swaps a linebacker for a 5th defensive back (like a nickel is 5 cents) to defend the pass.',dl:[49,56,64,71],lb:[54,66],cb:[[12,38],[108,38],[92,38]],s:[[44,24],[76,24]]},
};
function fillC(g,cx,cy,r,c){g.fillStyle=c;for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy<=r*r)g.fillRect(x,y,1,1)}}
const picCache={};
const SIG_W=128,SIG_H=144;
// Referee signal frame, 128x144 pixel art with light from the top-left. Each arm gets its own outline so arms
// crossing the body (or each other) stay readable; striped short sleeves + bare forearms contrast with the shirt.
function refFrame(key,fi){const ck=key+':'+fi;if(picCache[ck])return picCache[ck];
 const W=SIG_W,H=SIG_H,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const sig=SIGNALS[key],fr=sig.f[fi];
 const OC='#1a1230',SK='#e8b48a',SKH='#f8d6b2',SKD='#c48a62',SKDD='#9e6a48',WH='#f4f4f0',WHH='#ffffff',WHD='#c4c4cc',BK='#18181e',BKH='#40404c',BKD='#0b0b0f';
 const LX=-.6,LY=-.8,UA=22,FA=21,CX=64;
 const px=(x,y,col)=>{if(col){g.fillStyle=col;g.fillRect(x,y,1,1)}};
 const lit=(dx,dy,r)=>(dx*LX+dy*LY)/r; // >0 faces the light
 // capsule raster: mode 'o' = outline disk, 'f' = fill with col(along, across, light)
 const cap=(x0,y0,x1,y1,r,mode,col)=>{const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1e-9,len=Math.sqrt(L2),nx=-dy/len,ny=dx/len,R=mode==='o'?r+1.15:r;
  for(let y=Math.floor(Math.min(y0,y1)-R-1);y<=Math.ceil(Math.max(y0,y1)+R+1);y++)for(let x=Math.floor(Math.min(x0,x1)-R-1);x<=Math.ceil(Math.max(x0,x1)+R+1);x++){
   const X=x+.5,Y=y+.5;let t=((X-x0)*dx+(Y-y0)*dy)/L2;t=Math.max(0,Math.min(1,t));const qx=x0+dx*t,qy=y0+dy*t,ex=X-qx,ey=Y-qy,d=Math.hypot(ex,ey);if(d>R)continue;
   px(x,y,mode==='o'?OC:col(t*len,(X-x0)*nx+(Y-y0)*ny,lit(ex,ey,r)))}};
 const skin=(a,p,l)=>l>.42?SKH:l<-.55?SKDD:l<-.2?SKD:SK;
 const stripe=(p,l,w)=>(Math.floor((p+20)/w)&1)?(l>.45?BKH:BK):(l>.45?WHH:l<-.3?WHD:WH);
 // ---- arms ----
 const solve=(sx,sy,spec)=>{if(Array.isArray(spec)){const u=spec[0]*Math.PI/180,f=spec[1]*Math.PI/180,ex=sx+Math.cos(u)*UA,ey=sy+Math.sin(u)*UA;return{sx,sy,ex,ey,hx:ex+Math.cos(f)*FA,hy:ey+Math.sin(f)*FA}}
  let[tx,ty]=spec.h;const vx=tx-sx,vy=ty-sy;let D=Math.hypot(vx,vy);const ux=vx/D,uy=vy/D;
  if(D>=UA+FA-.5){const ex=sx+ux*UA,ey=sy+uy*UA;return{sx,sy,ex,ey,hx:ex+ux*FA,hy:ey+uy*FA}}
  D=Math.max(D,Math.abs(UA-FA)+1);const a=(UA*UA-FA*FA+D*D)/(2*D),h=Math.sqrt(Math.max(0,UA*UA-a*a)),bx=sx+ux*a,by=sy+uy*a;
  const c1=[bx-uy*h,by+ux*h],c2=[bx+uy*h,by-ux*h],e=spec.e||[sx,sy+40],pick=Math.hypot(c1[0]-e[0],c1[1]-e[1])<Math.hypot(c2[0]-e[0],c2[1]-e[1])?c1:c2;
  return{sx,sy,ex:pick[0],ey:pick[1],hx:tx,hy:ty}};
 const hands=Object.assign({r:'fist',l:'fist'},sig.hands||{},fr.hands||{});
 const handGeo=(A,type)=>{const dx=A.hx-A.ex,dy=A.hy-A.ey,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;return{ux,uy,cx:A.hx+ux*3,cy:A.hy+uy*3,type}};
 const drawHand=(A,type,mode)=>{if(type==='hide')return;const H=handGeo(A,type),{ux,uy}=H,vx=-uy,vy=ux;
  if(type==='fist'||type==='grab'){cap(A.hx,A.hy,A.hx+ux*3.5,A.hy+uy*3.5,type==='grab'?4.4:4.7,mode,skin);
   if(mode==='f'){const k=type==='grab'?3:2;for(let i=-1;i<=1;i++){const fx=A.hx+ux*(5-k*.4)+vx*i*2.2,fy=A.hy+uy*(5-k*.4)+vy*i*2.2;px(Math.floor(fx),Math.floor(fy),SKDD)}
    if(type==='grab')for(let i=-1;i<=1;i++)px(Math.floor(A.hx+ux*2+vx*i*2.2),Math.floor(A.hy+uy*2+vy*i*2.2),SKD)}}
  else if(type==='point'){cap(A.hx,A.hy,A.hx+ux*3,A.hy+uy*3,4,mode,skin);cap(A.hx+ux*3,A.hy+uy*3,A.hx+ux*10,A.hy+uy*10,1.6,mode,skin)}
  else{const wd=type==='flat'?3.1:3.6;cap(A.hx,A.hy,A.hx+ux*6.5,A.hy+uy*6.5,wd,mode,skin);
   cap(A.hx+ux*1.5+vx*(wd+.4),A.hy+uy*1.5+vy*(wd+.4),A.hx+ux*4+vx*(wd+1.6),A.hy+uy*4+vy*(wd+1.6),1.3,mode,skin); // thumb
   if(mode==='f')for(const i of[-1.3,0,1.3])for(const t of[7.2,8.4])px(Math.floor(A.hx+ux*t+vx*i*1.15),Math.floor(A.hy+uy*t+vy*i*1.15),SKD)}};
 const sleeve=UA*.62;
 const drawArm=(A,type)=>{for(const mode of['o','f']){
   cap(A.sx,A.sy,A.ex,A.ey,4.4,mode,(a,p,l)=>a<sleeve-1.6?stripe(p,l,3):a<sleeve?BK:skin(a,p,l));
   cap(A.ex,A.ey,A.hx,A.hy,3.7,mode,skin);drawHand(A,type,mode)}};
 // ---- body ----
 const legs=()=>{for(let y=94;y<=121;y++){const sp=y<98?0:Math.min(3,(y-97)*.6);for(let x=51;x<=77;x++){const rel=x-CX;if(Math.abs(rel+.5)<sp)continue;
   const leftLeg=rel<0,lx=leftLeg?(x-51)/(CX-51):(77-x)/(77-CX);px(x,y,leftLeg?(x<=52?BKH:BK):(x>=75?BKD:BK))}}
  for(const[x0,x1]of[[48,61],[67,80]])for(let y=121;y<=127;y++)for(let x=x0;x<=x1;x++){if(y===121&&(x===x0||x===x1))continue;px(x,y,y===127?'#2e2e36':y<=122?BKH:BKD)}
  g.fillStyle='#f4d03f';g.fillRect(53,95,3,5);g.fillStyle='#c9a21f';g.fillRect(55,96,1,4)}; // flag in the pocket
 const torso=()=>{for(let y=46;y<=93;y++){const hw=y<=48?[11,13.5,14.5][y-46]:15-(y-49)*.075;for(let x=Math.floor(CX-hw);x<Math.ceil(CX+hw);x++){const rel=x+.5-CX,e=rel/hw;
    let col=stripe(rel,e<-.72?.6:e>.55?-.6:0,4);if(e>.72&&col===BK)col=BKD;px(x,y,col)}}
  for(let y=89;y<=93;y++)for(let x=50;x<78;x++)px(x,y,y===89?BKH:BK);g.fillStyle='#c8ccd4';g.fillRect(62,90,4,3);g.fillStyle='#8a8f9a';g.fillRect(63,91,2,1);
  for(let y=42;y<=53;y++){const v=Math.max(0,(53-y)*.62);for(let x=55;x<73;x++){const rel=x+.5-CX;if(Math.abs(rel)<v-1.6)px(x,y,y<47?SKD:SK);else if(Math.abs(rel)<v+.4&&y>=46)px(x,y,BK)}}};
 const head=()=>{const hx=CX,hy=28,r=11;
  for(let y=hy-r-1;y<=hy+r;y++)for(let x=hx-r-1;x<=hx+r;x++){const dx=x+.5-hx,dy=y+.5-hy,d=Math.hypot(dx,dy*1.05);if(d>r)continue;const l=lit(dx,dy,r);
   if(y<hy-2)px(x,y,l>.35?WHH:l<-.35?WHD:WH);else px(x,y,skin(0,0,l*.9-(y>hy+8?.25:0)))}
  for(let x=hx-13;x<=hx+12;x++){px(x,hy-3,x>hx+6?WHD:WH);px(x,hy-2,'#9a9aa6')} // brim + its shadow
  px(hx,hy-r-1,BK);px(hx-1,hy-r,BK);px(hx,hy-r,BK);px(hx+1,hy-r,BK); // cap button
  for(const ex of[hx-r-1,hx+r]){for(let y=hy+1;y<=hy+5;y++){px(ex,y,ex<hx?SK:SKD);px(ex<hx?ex-1:ex+1,y,y===hy+1||y===hy+5?null:(ex<hx?SKD:SKDD))}}
  for(const ex of[hx-6,hx+3]){g.fillStyle='#5a3a26';g.fillRect(ex,hy,4,1);g.fillStyle='#ffffff';g.fillRect(ex+1,hy+2,2,2);g.fillStyle='#1b1b2a';g.fillRect(ex+2,hy+2,2,3)}
  g.fillStyle=SKD;g.fillRect(hx,hy+4,1,3);g.fillRect(hx+1,hy+6,1,1);
  g.fillStyle='#9a4a3a';g.fillRect(hx-3,hy+9,6,1);g.fillStyle='#c46a5a';g.fillRect(hx-2,hy+10,4,1);
  g.fillStyle=SKD;g.fillRect(hx-4,hy+12,9,2)}; // neck shadow under chin
 const R=solve(50,54,fr.r),Lsp=Object.assign({},fr.l);if(Lsp.grab){const t=.7;Lsp.h=[R.ex+(R.hx-R.ex)*t+3,R.ey+(R.hy-R.ey)*t]}
 const Lm=Array.isArray(fr.l)?solve(78,54,fr.l):solve(78,54,Lsp);
 const arms=()=>{if(fr.z==='r'){drawArm(Lm,hands.l);drawArm(R,hands.r)}else{drawArm(R,hands.r);drawArm(Lm,hands.l)}};
 legs();torso();if(sig.behind){arms();head()}else{head();arms()}
 // outer silhouette outline
 const id=g.getImageData(0,0,W,H),a=id.data,o=document.createElement('canvas');o.width=W;o.height=H;const og=o.getContext('2d');og.fillStyle=OC;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(a[(y*W+x)*4+3])continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([p,q])=>{const X=x+p,Y=y+q;return X>=0&&Y>=0&&X<W&&Y<H&&a[(Y*W+X)*4+3]}))og.fillRect(x,y,1,1)}
 og.drawImage(c,0,0);return picCache[ck]=o}
function drawPic(cv2,pic,t){const g=cv2.getContext('2d');g.imageSmoothingEnabled=false;const[kind,key]=pic.split(':');
 if(kind==='sig'){const W=SIG_W,H=SIG_H;g.fillStyle='#4caf50';g.fillRect(0,0,W,H);g.fillStyle='#43a047';for(let y=0;y<H;y+=24)g.fillRect(0,y,W,12);g.fillStyle='#ffffff';g.fillRect(0,128,W,3);g.fillStyle='rgba(0,0,0,.28)';for(let y=125;y<=131;y++){const w=34*Math.sqrt(1-((y-128)/3.6)**2);g.fillRect(Math.round(64-w),y,Math.round(2*w),1)}
  const sig=SIGNALS[key];const fi=Math.floor((t||0)/450)%sig.f.length;g.drawImage(refFrame(key,fi),0,0);return}
 const F=FORMS[key],W=120,H=84;
 for(let y=0;y<H;y+=10){g.fillStyle=(y/10)%2?'#43a047':'#4caf50';g.fillRect(0,y,W,10);g.fillStyle='#e8f5e8';g.fillRect(0,y+4,W,1)}
 g.fillStyle='#ffffff';for(let y=0;y<H;y+=2){g.fillRect(44,y,1,1);g.fillRect(75,y,1,1)}
 g.fillStyle='#3a7bd5';g.fillRect(0,44,W,1);
 const O=(x,y,col)=>{fillC(g,x,y,3.4,'#1a1230');fillC(g,x,y,2.5,col)};
 const X=(x,y,col)=>{g.fillStyle='#1a1230';for(let i=-3;i<=3;i++){g.fillRect(x+i-1,y+i-1,3,3);g.fillRect(x+i-1,y-i-1,3,3)}g.fillStyle=col;for(let i=-2;i<=2;i++){g.fillRect(x+i,y+i,1,1);g.fillRect(x+i,y-i,1,1)}};
 if(F.side==='o'){OFF_BASE.forEach(([x,y])=>O(x,y,'#ffffff'));F.o.forEach(([x,y])=>O(x,y,'#ffffff'));F.b.forEach(([x,y])=>O(x,y,'#ffffff'));O(F.qb[0],F.qb[1],'#f5c542');if(F.kneel){g.fillStyle='#1a1230';g.fillRect(F.qb[0]-3,F.qb[1]+4,7,1)}}
 else{g.globalAlpha=.45;OFF_BASE.forEach(([x,y])=>O(x,y,'#ffffff'));[[78,48],[12,48],[108,49],[60,53],[60,62]].forEach(([x,y])=>O(x,y,'#ffffff'));g.globalAlpha=1;
  F.dl.forEach(x=>X(x,41,'#ff5a4a'));F.lb.forEach(x=>X(x,33,'#ff5a4a'));F.cb.forEach(([x,y])=>X(x,y,'#ff5a4a'));F.s.forEach(([x,y])=>X(x,y,'#ff5a4a'))}}
// build picture questions into the bank
(function(){const r=mulberry32(4242);const P=a=>a[(r()*a.length)|0];
 const add=(cat,d,qtext,pic,ans,pool,x)=>{const others=pool.filter(n=>n!==ans);const w=[];while(w.length<3){const o=P(others);if(!w.includes(o))w.push(o)}QB.push({id:QB.length,cat,d,q:qtext,a:ans,w,x,pic})};
 const sigNames=Object.values(SIGNALS).map(s=>s.n);for(const k in SIGNALS){const s=SIGNALS[k];add('rules',s.d,'What is the referee signaling?','sig:'+k,s.n,sigNames,s.x)}
 const offN=Object.values(FORMS).filter(f=>f.side==='o').map(f=>f.n),defN=Object.values(FORMS).filter(f=>f.side==='d').map(f=>f.n).concat(['Dime defense','Goal-line defense']);
 for(const k in FORMS){const f=FORMS[k];add('strategy',f.d,f.side==='o'?'The offense (O\'s, QB in gold) is moving up the field. What formation is this?':'What defensive alignment are the red X\'s in?','form:'+k,f.n,f.side==='o'?offN:defN,f.x)}})();
function pickPic(cat,dmax){const pool=QB.filter(q=>q.pic&&(!cat||q.cat===cat)&&q.d<=Math.max(dmax,1)&&!recent.includes(q.id));if(!pool.length)return null;const miss=pool.filter(q=>S.missed[q.id]);const q=(miss.length&&R()<.4)?pick(miss):pick(pool);recent.push(q.id);if(recent.length>15)recent.shift();return q}
function showPic(q){const card=$('#qPic');if(!q||!q.pic){card.classList.add('hidden');return}card.classList.remove('hidden');const sig=q.pic.startsWith('sig');const c=$('#qPicC');c.width=sig?SIG_W:120;c.height=sig?SIG_H:84;c.style.width=(sig?168:252)+'px';c.style.height=(sig?189:176)+'px';drawPic(c,q.pic,0)}

// ---------------- ENEMIES ----------------
const BIOME_FAMS={plains:FAMS.slice(0,7),forest:['raptor','rex','stego','raptor'],coast:['sauro','ptero','trike','sauro'],desert:['raptor','ankylo','rex','spino'],mountain:['ptero','ankylo','trike','ptero'],ruins:['trike','sauro','stego','spino'],springs:['sauro','stego','ptero','trike'],volcano:['rex','spino','ankylo','ptero']};
function makeEnemy(fam,lv,o={}){const shiny=!o.boss&&!o.name&&R()<.04;const pal=o.pal||(shiny?{B:'#e8b820',L:'#fff2b0',P:'#a86a00',K:'#ffffff'}:randPal());
 const name=o.name||((shiny?'Golden ':'')+dinoName(fam));
 const hp=Math.round((o.boss?90+lv*16:24+lv*9)*(o.legend?1.15:1)*(S&&S.diff==='superfan'?1.2:1));
 const spr=makeDino(fam,pal,o.pattern||pick(['none','stripes','spots','none']),(R()*1e9)|0);return{fam,lv,name,maxHp:hp,hp,atk:(5+lv*2.6)*(o.boss?1.3:1)*(o.legend?1.15:1),boss:!!o.boss,legend:!!o.legend,shiny,spr,white:tint(spr,'#ffffff')}}
function beginWild(){const reg=regionPoi(player.x,player.y);const fams=BIOME_FAMS[reg.biome];const lv=rint(reg.lv[0],reg.lv[1]);const e=makeEnemy(pick(fams),lv);
 const cat=reg.cat&&R()<.55?reg.cat:null;startBattle(e,{cat,diff:reg.diff,biome:reg.biome})}

// ---------------- BATTLE ----------------
let B=null;
const BIOME_SKY={plains:['#8fd0ff','#d8f0ff','#7cc860'],forest:['#6fb89a','#c8ecd8','#3f8f3a'],coast:['#7ac8ff','#e0f6ff','#e8d690'],desert:['#ffb46a','#ffe6b0','#e0c080'],mountain:['#9ab0d0','#e0e8f4','#a8957a'],ruins:['#b8a8e0','#f0e8ff','#7cc860'],springs:['#80d8e8','#e0fcff','#6cc04a'],volcano:['#5a1a1a','#d8603a','#4a3838']};
function startBattle(en,opts){$('#plName').textContent=NM().toUpperCase();
 state='battle';B={en,opts,phase:'intro',q:null,streak:0,t:0,anim:null,pops:[],shake:0,trans:0,removed:new Set(),biome:opts.biome||(opts.secretBoss?'ruins':opts.boss?poiById(opts.boss.poi).biome:regionPoi(player.x,player.y).biome),qStart:0,sel:0,bag:false};
 S.st.battles++;const fr=S.dex[en.fam]||(S.dex[en.fam]={seen:0,def:0});fr.seen++;S.names[en.name]=1;
 $('#battle').classList.remove('hidden');$('#hud').classList.add('hidden');
 updBattleBoxes(true);
 const intro=opts.secretBoss?`✦ SECRET BOSS! ${en.name} rises from the fossil field! 10-second shot clock`:opts.legend?`⚠️ LEGEND CHALLENGE! ${en.name} wants to battle! Superfan questions · 12-second shot clock`:opts.boss?`${en.name} wants to battle!`:opts.practice?`Practice time! ${en.name} (Lv ${en.lv}) steps up!`:`A wild ${en.shiny?'✨':''}${en.name} (Lv ${en.lv}) appeared!`;
 setPanel(`<div class="qIntro">${esc(intro)}${opts.cat?`<br><small>Category: <b style="color:${CATS[opts.cat].c}">${CATS[opts.cat].name}</b></small>`:''}</div>`,`<button class="tool go" onclick="G.nextQ()">Ready! ▶</button>`);
}
function setPanel(main,tools){if(!(B&&B.phase==='feedback'&&B.q&&B.q.pic))$('#qPic').classList.add('hidden');$('#qMain').innerHTML=main;$('#qTools').innerHTML=tools||'';$('#qFeedback').classList.add('hidden')}
function updBattleBoxes(instant){const e=B.en,s=stats();
 $('#enName').textContent=e.name;$('#enLv').textContent='Lv'+e.lv;$('#enTag').textContent=e.legend?'⭐ LEGENDARY COACH':e.boss?'HEAD COACH':FAMN[e.fam]+(e.shiny?' ✨':'');
 setBar('#enHp',e.hp/e.maxHp,instant);setBar('#plHp',S.hp/s.hp,instant);$('#plLv').textContent='Lv'+S.lv;$('#plHpT').textContent=`${Math.max(0,Math.ceil(S.hp))}/${s.hp}`;
 $('#plXp').style.width=(S.xp/xpNeed(S.lv)*100)+'%';
 const bf=Object.keys(S.buffs).filter(k=>k!=='horn').map(k=>BUFFS[k].icon).join('');
 $('#streak').innerHTML=(B.streak>=2?`🔥 Streak x${B.streak}`:'')+(bf?` <span title="Active buffs">${bf}</span>`:'')}
function setBar(sel,f,instant){const el=$(sel);f=clamp(f,0,1);if(instant){el.style.transition='none';requestAnimationFrame(()=>el.style.transition='')}el.style.width=(f*100)+'%';el.style.background=f>.5?'#3ccf5a':f>.2?'#f0c030':'#e84030'}
function nextQ(){
 if(!B)return;B.phase='question';B.bag=false;B.removed=new Set();
 const o=B.opts;let d=o.diff||[1,2];if(B.en.boss&&B.en.hp<B.en.maxHp*.5)d=[Math.min(3,d[0]+1),3];
 let q=null;if(!o.legend&&!o.secretBoss&&!o.drill&&(!o.cat||o.cat==='rules'||o.cat==='strategy')&&S.diff!=='superfan'&&R()<.22)q=pickPic(o.cat,d[1]);
 if(!q)q=pickQuestion(o.cat||null,d[0],d[1],o.drill);B.q=q;B.ans=shuffle([q.a,...q.w]);B.qStart=performance.now();B.sel=0;renderQ();}
function renderQ(){B.bag=false;if(B.pausedAt){B.qStart+=performance.now()-B.pausedAt;B.pausedAt=0}const q=B.q;const c=CATS[q.cat];
 const main=`<div id="qHead"><span class="cat" style="background:${c.c}">${c.name}</span><span class="diff">${q.d>=4?'<b style="color:#9b40c6">★★★★ SUPERFAN</b>':'★'.repeat(q.d)+'☆'.repeat(3-q.d)}</span><span id="qTimer"></span></div>
 <div id="qText">${esc(q.q)}</div>
 <div id="qAns">${B.ans.map((a,i)=>`<button class="ans${B.removed.has(i)?' gone':''}${i===B.sel?' sel':''}" data-i="${i}" onclick="G.answer(${i})"><b>${i+1}</b> ${esc(a)}</button>`).join('')}</div>`;
 const n=k=>S.inv[k]||0;
 const tools=`<button class="tool" ${n('hint')&&!B.removed.size?'':'disabled'} onclick="G.useHint()">📋 Hint (${n('hint')})</button><button class="tool" ${n('timeout')?'':'disabled'} onclick="G.useTimeout()">⏱️ Timeout (${n('timeout')})</button><button class="tool" onclick="G.bag()">🎒 Bag</button><button class="tool" onclick="G.run()">🏃 Run</button>`;
 setPanel(main,tools);showPic(B.q)}
function answer(i){
 if(!B||B.phase!=='question'||B.removed.has(i))return;
 B.phase='feedback';const q=B.q,ok=B.ans[i]===q.a,s=stats();const secs=(performance.now()-B.qStart)/1000;
 recordAnswer(q,ok);
 document.querySelectorAll('#qAns .ans').forEach((el,k)=>{if(B.ans[k]===q.a)el.classList.add('right');else if(k===i)el.classList.add('wrong');el.disabled=true});
 let msg='';
 if(ok){B.streak++;const crit=R()<s.crit+(B.streak>=3?.05:0),quick=secs<7;if(quick)S.st.quick=(S.st.quick||0)+1;if(B.opts.shotclock&&B.opts.shotclock-secs<=2)S.flags.buzzer=1;
  let dmg=s.atk*(.9+R()*.2)*(1+Math.min(B.streak-1,5)*.1)*(S.buffs.pep?1.3:1)*(quick?1.15:1)*(crit?1.6:1);dmg=Math.max(1,Math.round(dmg));
  B.en.hp=Math.max(0,B.en.hp-dmg);let heal=s.heal+(S.buffs.regen?6:0);if(heal){S.hp=Math.min(s.hp,S.hp+heal)}
  B.anim={type:'atk',t:0,dmg,crit,proj:GEAR[S.equip.weapon]?.proj||'ball'};SFX.correct();setTimeout(()=>SFX.hit(),380);
  msg=`<b class="good">✔ CORRECT!</b> ${crit?'<b class="crit">CRITICAL HIT!</b> ':''}${quick?'<b class="quick">Quick Snap!</b> ':''}${B.streak>=3?`<b class="fire">🔥x${B.streak}</b> `:''}<b>${dmg} damage!</b>${heal?` <span class="good">+${heal} HP</span>`:''}<br>${esc(q.x)}`}
 else{B.streak=0;B.wrong=(B.wrong||0)+1;const dodge=R()<s.dodge;let dmg=0;
  if(!dodge){dmg=B.en.atk*(.9+R()*.2)*30/(30+s.def)*(S.buffs.guard?.65:1)*({rookie:.7,pro:1,allpro:1.25,superfan:1.5}[S.diff]||1);if(B.opts.practice)dmg*=.3;dmg=Math.max(1,Math.round(dmg));S.hp=Math.max(0,S.hp-dmg)}
  B.anim={type:'hit',t:0,dmg,dodge};SFX.wrong();
  msg=`<b class="bad">${i===-1?'⏱ SHOT CLOCK EXPIRED! ':''}✘ ${dodge?`Wrong... but ${NMH()} JUKED the attack!`:'WRONG!'}</b> ${dodge?'':`<b>${NMH()} takes ${dmg} damage.</b>`}<br>Answer: <b>${esc(q.a)}</b>. ${esc(q.x)}`}
 $('#qTools').innerHTML='';B.fbReady=false;
 setTimeout(()=>{if(!B||B.phase!=='feedback')return;const fb=$('#qFeedback');fb.innerHTML=msg;fb.className=(ok?'box ok':'box no')+(q.pic?' picfb':'');$('#qTools').innerHTML=`<button class="tool go" onclick="G.cont()">Continue ▶</button>`;B.fbReady=true},700);
 setTimeout(()=>B&&updBattleBoxes(),400);
}
function cont(){if(!B)return;if(B.phase==='feedback'){if(B.fbReady===false)return;if(B.en.hp<=0)return victory();if(S.hp<=0)return defeat();return nextQ()}
 if(B.phase==='end'){const cb=B.after;endBattle();cb&&cb()}}
function useHint(){if(!B||B.phase!=='question'||!S.inv.hint||B.removed.size)return;S.inv.hint--;const wrong=B.ans.map((a,i)=>i).filter(i=>B.ans[i]!==B.q.a);shuffle(wrong);B.removed.add(wrong[0]);B.removed.add(wrong[1]);if(B.removed.has(B.sel))B.sel=B.ans.indexOf(B.q.a);SFX.blip();renderQ()}
function useTimeout(){if(!B||B.phase!=='question'||!S.inv.timeout)return;S.inv.timeout--;SFX.blip();
 setPanel(`<div class="qIntro">⏱️ TIMEOUT! ${NMH()} takes a breather. The answer was <b>${esc(B.q.a)}</b>.<br><small>${esc(B.q.x)}</small></div>`,`<button class="tool go" onclick="G.nextQ()">Next question ▶</button>`);B.phase='timeout'}
function bag(){if(!B||B.phase!=='question')return;B.bag=true;B.pausedAt=performance.now();const list=Object.keys(CONS).filter(k=>S.inv[k]&&CONS[k].heal);
 setPanel(`<div class="qIntro">🎒 <b>Bag</b> (HP ${Math.ceil(S.hp)}/${stats().hp})<div class="bagList">${list.length?list.map(k=>`<button class="tool" onclick="G.useItem('${k}',true)">${CONS[k].icon} ${CONS[k].name} x${S.inv[k]}<br><small>${CONS[k].desc}</small></button>`).join(''):'<i>No healing items!</i>'}</div></div>`,`<button class="tool" onclick="G.back()">◀ Back to question</button>`)}
function run(){if(!B||B.phase!=='question')return;
 if(B.en.boss){toast("You can't run from a Head Coach!");return}
 if(R()<.7+stats().dodge){B.phase='end';B.after=null;setPanel(`<div class="qIntro">🏃 ${NMH()} got away safely!</div>`,`<button class="tool go" onclick="G.cont()">Continue ▶</button>`)}
 else{const dmg=Math.max(1,Math.round(B.en.atk*.6));S.hp=Math.max(0,S.hp-dmg);B.anim={type:'hit',t:0,dmg};SFX.wrong();updBattleBoxes();B.phase='feedback';B.fbReady=true;
  setPanel(`<div class="qIntro">🏃 ${NMH()} tried to run... but ${esc(B.en.name)} blocked the way! <b>-${dmg} HP</b></div>`,`<button class="tool go" onclick="G.cont()">Continue ▶</button>`)}}
function victory(){const e=B.en;B.phase='end';SFX.win();S.st.wins++;S.dex[e.fam].def++;
 if(!B.opts.practice){S.st.winsBy[S.diff]=(S.st.winsBy[S.diff]||0)+1;if(e.shiny)S.st.golden=(S.st.golden||0)+1;if(S.hp<=stats().hp*.1)S.flags.comeback=1;if(e.boss&&!B.wrong)S.flags.flawless=1;
  if(B.opts.boss){S.st.bossBy[S.diff]=(S.st.bossBy[S.diff]||0)+1;if(B.opts.boss.def.final)S.st.champBy[S.diff]=(S.st.champBy[S.diff]||0)+1}}
 const lines=[`<b>${esc(e.name)}</b> ${e.boss?'has been defeated!':'fainted!'}`];
 if(B.opts.practice){lines.push('Nice practice rep! +5 XP. Coach Dale gives you a high five. ✋');S.xp+=5;}
 else{
  let xp=Math.round((10+e.lv*6)*(e.boss?3:1)*(S.buffs.film?1.5:1)*(e.shiny?2:1)),coins=Math.round((6+e.lv*3)*(e.boss?4:1)*(S.buffs.lucky?1.5:1)*(e.shiny?3:1));
  S.xp+=xp;S.coins+=coins;lines.push(`+${xp} XP   +${coins} coins 🪙`);
  const drops=[];if(B.opts.secretBoss){S.bosses.goat=1;S.gear.push('fossilball','dinocrown');lines.push(`✦ THE GOAT HAS FALLEN! ${NMH()} claims the <span style="color:${RAR[5].c}">🦴 Fossil Football</span> and the <span style="color:${RAR[5].c}">👑 Dino King Crown</span> [Mythic]!`);drops.push(['c','icepack'],['c','icepack'])}
  else if(B.opts.legend){const it=B.opts.legend,g=GEAR[it.legend];S.taken[it.id]=1;S.gear.push(it.legend);lines.push(`🏆 LEGEND DEFEATED! ${NMH()} claims the <span style="color:${RAR[4].c}">${g.icon} ${g.name}</span>!`);drops.push(['c','icepack'])}
  else if(e.boss){const p=poiById(B.opts.boss.poi);drops.push(['g',rollGear(e.lv+8,BOSS_ORDER.indexOf(p.id)>=2||p.id==='champ'?3:2)]);drops.push(['c',rollCons()],['c',rollCons()])}
  else{if(R()<.45)drops.push(['c',rollCons()]);if(R()<.14||e.shiny)drops.push(['g',rollGear(e.lv)])}
  drops.forEach(([t,k])=>{if(t==='c'){S.inv[k]=(S.inv[k]||0)+1;lines.push(`Loot: ${CONS[k].icon} ${CONS[k].name}`)}else{S.gear.push(k);const g=GEAR[k];lines.push(`Loot: <span style="color:${RAR[g.r].c}">${g.icon} ${g.name} [${RAR[g.r].n}]</span>`)}});
  // buff countdown
  for(const k of Object.keys(S.buffs)){if(k==='horn')continue;S.buffs[k]--;if(S.buffs[k]<=0){delete S.buffs[k];lines.push(`${BUFFS[k].icon} ${BUFFS[k].name} wore off.`)}}
 }
 while(S.xp>=xpNeed(S.lv)){S.xp-=xpNeed(S.lv);S.lv++;S.hp=stats().hp;lines.push(`<b class="good">⭐ LEVEL UP! ${NMH()} is now Lv ${S.lv}! HP fully restored.</b>`);if(S.lv===10)lines.push(`✨ ${NMH()} now sparkles with confidence!`);if(S.lv===20)lines.push(`🌟 A golden aura now surrounds ${NMH()}!`);if(S.lv===30)lines.push(`💫 ${NMH()} glows like a true legend!`);setTimeout(SFX.level,600)}
 let after=null;
 if(B.opts.secretBoss){after=()=>dialog(GOAT.outro.map(l=>`${GOAT.name}: ${l}`).concat(['Equip your Mythic gear from Menu → Gear.']))}
 else if(B.opts.legend){const L=LEGENDS[B.opts.legend.legend];after=()=>dialog(L.outro.map(l=>`${L.name}: ${l}`).concat(['Equip your legendary gear from Menu → Gear.']))}
 else if(e.boss&&B.opts.boss){const b=B.opts.boss,d=b.def;S.bosses[b.poi]=1;if(!S.trophies.includes(d.trophy))S.trophies.push(d.trophy);lines.push(`🏆 ${NMH()} earned the <b>${d.trophy}</b>!`);
  after=()=>{dialog(d.outro.map(l=>`${d.name}: ${l}`),()=>{if(d.final){S.champion=true;saveGame(true);showEnding()}else if(S.trophies.length>=6)dialog(['All 6 Coach Trophies collected! 🏆','Head to the Championship Gate in the volcano at the center of the map!'])})}}
 B.after=after;updBattleBoxes();saveGame(true);
 setPanel(`<div class="qIntro vic">${lines.join('<br>')}</div>`,`<button class="tool go" onclick="G.cont()">Continue ▶</button>`)}
function defeat(){B.phase='end';const lost=Math.floor(S.coins*.25);S.coins-=lost;
 B.after=()=>{S.hp=stats().hp;S.x=S.respawn.x;S.y=S.respawn.y;startPlayer();lastRegion=-1;updHud();dialog([`${NM()} is out of breath and heads back to the locker room...`,`Dropped ${lost} coins on the way. Wrong answers were added to the Film Room. Study up and try again!`])};
 setPanel(`<div class="qIntro">😵 ${NMH()} can't keep going!</div>`,`<button class="tool go" onclick="G.cont()">Continue ▶</button>`)}
function endBattle(){B=null;state='world';graceSteps=4;$('#battle').classList.add('hidden');$('#hud').classList.remove('hidden');updHud();setTimeout(checkAch,400)}
function drawBattle(){
 const sky=BIOME_SKY[B.biome]||BIOME_SKY.plains;const g=ctx.createLinearGradient(0,0,0,140);g.addColorStop(0,sky[0]);g.addColorStop(1,sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
 // stylized stripes
 ctx.fillStyle='rgba(255,255,255,.15)';for(let i=0;i<6;i++)ctx.fillRect(0,20+i*18+((frame/2+i*7)%18),CW,2);
 ctx.fillStyle=sky[2];ctx.fillRect(0,100,CW,108);ctx.fillStyle=shade(sky[2],-.12);for(let x=0;x<CW;x+=8)ctx.fillRect(x+((x/8)%2)*4,104+((x*7)%20),3,1);
 const plat=(cx,cy,rx,ry)=>{ctx.fillStyle=shade(sky[2],-.25);ell(cx,cy+2,rx,ry);ctx.fillStyle=shade(sky[2],.15);ell(cx,cy,rx,ry);ctx.fillStyle=shade(sky[2],-.08);ell(cx,cy+1,rx-6,ry-3)};
 plat(232,92,54,11);plat(78,124,58,12);
 let sh=B.shake>0?(B.shake--,(R()-.5)*6):0;
 const a=B.anim;let eox=0,eoy=0,pox=0,flashE=false,flashP=false;
 if(a){a.t++;if(a.type==='atk'){if(a.t<10)pox=a.t*1.5;else if(a.t<20)pox=(20-a.t)*1.5;if(a.t>22&&a.t<40){flashE=(a.t>>1)%2===0;eox=(a.t%4<2?2:-2)}if(a.t===24){B.pops.push({x:232,y:40,t:0,txt:'-'+a.dmg,c:a.crit?'#ffd23a':'#ffffff'});B.shake=a.crit?10:5}}
  else{if(a.t<10)eox=-a.t*2;else if(a.t<20)eox=-(20-a.t)*2;if(a.t>14&&a.t<34){flashP=(a.t>>1)%2===0;pox=(a.t%4<2?-2:2)}if(a.t===16){B.pops.push({x:84,y:66,t:0,txt:a.dodge?'JUKE!':'-'+a.dmg,c:a.dodge?'#7fffb0':'#ff6a5a'});if(!a.dodge)B.shake=6}}
  if(a.t>50)B.anim=null}
 // enemy
 const es=B.en.spr,dead=B.en.hp<=0&&B.phase==='end';const bob=B.en.fam==='ptero'?Math.sin(frame/12)*3-8:Math.sin(frame/25)*1;
 if(!dead||((frame>>2)%2)){ctx.save();if(dead)ctx.globalAlpha=.4;const ex=Math.round(232-es.width+eox+sh),ey=Math.round(96-es.height*2+bob);ctx.drawImage(es,ex,ey,es.width*2,es.height*2);if(flashE){ctx.globalAlpha=.75;ctx.drawImage(B.en.white,ex,ey,es.width*2,es.height*2)}ctx.restore()}
 // projectile
 if(a&&a.type==='atk'&&a.t>=8&&a.t<24){const t=(a.t-8)/16;const x=110+(222-110)*t,y=86-(Math.sin(t*Math.PI)*40)+(50-86)*t;drawProj(a.proj,x,y,a.t)}
 // brady
 const bs=bradySpr.right[B.anim&&B.anim.type==='atk'&&B.anim.t<20?1:0];
 if(S.lv>=20){const a=.22+.12*Math.sin(frame/10);ctx.fillStyle=S.lv>=30?`rgba(255,140,220,${a})`:`rgba(255,210,70,${a})`;ell(83+pox,122,30,8)}
 ctx.save();ctx.translate(Math.round(56+pox+sh),70);ctx.drawImage(bs,0,0,bs.width*3,bs.height*3);ctx.restore();
 if(flashP){ctx.globalAlpha=.6;ctx.drawImage(bradyRed,Math.round(56+pox+sh),70,54,54);ctx.globalAlpha=1}
 // weapon icon in hand
 drawProj(GEAR[S.equip.weapon]?.proj||'ball',56+pox+44,70+38,0,true);
 if(S.lv>=10)for(let i=0;i<(S.lv>=20?5:3);i++){if((frame+i*11)%24>=12)continue;const x=58+((frame*3+i*37)%52),y=72+((i*53+((frame/4)|0)*7)%50);ctx.fillStyle=S.lv>=30?'#ffb0e8':S.lv>=20?'#ffe08a':'#ffffff';ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3)}
 if(S.champion){const a=frame/18,x=Math.round(83+pox+Math.cos(a)*22),y=Math.round(66+Math.sin(a)*6);ctx.fillStyle='#ffe08a';ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5)}
 // pops
 B.pops=B.pops.filter(p=>p.t<50);for(const p of B.pops){p.t++;ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle=OUT;const y=p.y-p.t*.6;ctx.fillText(p.txt,p.x+1,y+1);ctx.fillStyle=p.c;ctx.fillText(p.txt,p.x,y)}
 // intro transition
 if(B.trans<24){B.trans++;ctx.fillStyle=OUT;const h=(24-B.trans)/24*CH/2;ctx.fillRect(0,0,CW,h);ctx.fillRect(0,CH-h,CW,h)}
}
function ell(cx,cy,rx,ry){ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill()}
function drawProj(k,x,y,t,small){x=Math.round(x);y=Math.round(y);const s=small?1:1.4;ctx.save();ctx.translate(x,y);if(!small)ctx.rotate(t*.5);ctx.scale(s,s);
 if(k==='ball'||k==='gold'){ctx.fillStyle=OUT;ell(0,0,7,4.5);ctx.fillStyle=k==='gold'?'#f5c542':'#8a4a20';ell(0,0,6,3.5);ctx.fillStyle='#fff';ctx.fillRect(-3,-1,6,1);ctx.fillRect(-2,-2,1,3);ctx.fillRect(0,-2,1,3);ctx.fillRect(2,-2,1,3)}
 else if(k==='yflag'||k==='rflag'){ctx.fillStyle=OUT;ctx.fillRect(-5,-5,10,10);ctx.fillStyle=k==='yflag'?'#f5d142':'#e8443a';ctx.fillRect(-4,-4,8,8);ctx.fillStyle='#fff';ctx.fillRect(-4,-4,3,3)}
 else if(k==='bottle'){ctx.fillStyle=OUT;ctx.fillRect(-3,-7,7,14);ctx.fillStyle='#4a9af0';ctx.fillRect(-2,-4,5,10);ctx.fillStyle='#fff';ctx.fillRect(-1,-6,3,2);ctx.fillRect(-1,-2,1,6)}
 else if(k==='whistle'){ctx.fillStyle=OUT;ell(0,0,5,4);ctx.fillStyle='#c8ccd8';ell(0,0,4,3);ctx.fillRect(2,-3,6,3);ctx.fillStyle='#e8443a';ctx.fillRect(-8,-1,4,1)}
 else if(k==='cooler'){ctx.fillStyle=OUT;ctx.fillRect(-6,-5,12,11);ctx.fillStyle='#f07a1a';ctx.fillRect(-5,-4,10,9);ctx.fillStyle='#fff';ctx.fillRect(-5,-4,10,2);if(!small){ctx.fillStyle='#8fd0ff';for(let i=0;i<5;i++)ctx.fillRect(-10+i*4,-8-((t+i)%3)*2,2,2)}}
 ctx.restore()}

// ---------------- ACHIEVEMENTS ----------------
const ATIER={bronze:{n:'Bronze',c:'#c07a3a',pts:10},silver:{n:'Silver',c:'#8a96a8',pts:25},gold:{n:'Gold',c:'#e8b820',pts:50},plat:{n:'Platinum',c:'#7ad8e8',pts:100}};
const st=()=>S.st,legendsBeat=()=>items.filter(i=>i.legend&&S.taken[i.id]).length;
const ACH=[
 {g:'Getting Started',id:'first_win',n:'First Down',d:'Win your first battle.',i:'🏈',t:'bronze',c:()=>st().wins>=1},
 {g:'Getting Started',id:'streak3',n:'Hat Trick',d:'Answer 3 questions in a row correctly.',i:'🎩',t:'bronze',c:()=>st().best>=3},
 {g:'Getting Started',id:'lv5',n:'Rookie of the Year',d:'Reach level 5.',i:'⭐',t:'bronze',c:()=>S.lv>=5},
 {g:'Getting Started',id:'ans100',n:'Student of the Game',d:'Answer 100 questions.',i:'📚',t:'bronze',c:()=>st().ans>=100},
 {g:'Getting Started',id:'quick25',n:'Quick Snap',d:'Earn 25 Quick Snap bonuses.',i:'⚡',t:'bronze',c:()=>(st().quick||0)>=25},
 {g:'Getting Started',id:'totems5',n:'Pep Rally',d:'Use 5 Pep Rally Totems.',i:'📣',t:'bronze',c:()=>(st().totems||0)>=5},
 {g:'Getting Started',id:'shopper',n:'Pro Shopper',d:'Buy 15 items.',i:'🛒',t:'bronze',c:()=>(st().bought||0)>=15},
 {g:'Getting Started',id:'trophy1',n:'Coach Killer',d:'Earn your first Coach Trophy.',i:'🏆',t:'bronze',c:()=>S.trophies.length>=1},
 {g:'Mastery',id:'streak10',n:'On Fire',d:'Answer 10 in a row correctly.',i:'🔥',t:'silver',c:()=>st().best>=10},
 {g:'Mastery',id:'streak25',n:'Unstoppable',d:'Answer 25 in a row correctly.',i:'🚀',t:'gold',c:()=>st().best>=25},
 {g:'Mastery',id:'lv15',n:'Pro Bowler',d:'Reach level 15.',i:'🌟',t:'silver',c:()=>S.lv>=15},
 {g:'Mastery',id:'lv25',n:'Hall of Famer',d:'Reach level 25.',i:'🧥',t:'gold',c:()=>S.lv>=25},
 {g:'Mastery',id:'ans500',n:'Walking Encyclopedia',d:'Answer 500 questions.',i:'🧠',t:'silver',c:()=>st().ans>=500},
 {g:'Mastery',id:'mastered10',n:'Film Room Rat',d:'Master 10 questions from your Film Room.',i:'🎬',t:'silver',c:()=>(st().mastered||0)>=10},
 {g:'Mastery',id:'allcat',n:'Well-Rounded',d:'Get 20 correct in every category.',i:'🎯',t:'silver',c:()=>Object.keys(CATS).every(k=>(st().cat[k]||[0,0])[1]>=20)},
 {g:'Mastery',id:'comeback',n:'Comeback Kid',d:'Win a battle with 10% HP or less.',i:'💪',t:'silver',c:()=>S.flags.comeback},
 {g:'Mastery',id:'buzzer',n:'Buzzer Beater',d:'Answer correctly with 2 seconds or less on a shot clock.',i:'⏱️',t:'silver',c:()=>S.flags.buzzer},
 {g:'Mastery',id:'flawless',n:'Flawless',d:'Beat a coach without a single wrong answer.',i:'💎',t:'gold',c:()=>S.flags.flawless},
 {g:'Exploration',id:'explorer',n:'Road Trip',d:'Visit all 7 towns.',i:'🗺️',t:'silver',c:()=>['kickoff','harbor','dunes','rulebook','springs','peak','canton'].every(k=>S.visited[k])},
 {g:'Exploration',id:'chests20',n:'Treasure Hunter',d:'Open 20 chests.',i:'🧰',t:'silver',c:()=>(st().chests||0)>=20},
 {g:'Exploration',id:'dex',n:'Paleontologist',d:'Discover all 8 dino families.',i:'🦕',t:'silver',c:()=>Object.keys(S.dex).length>=8},
 {g:'Exploration',id:'golden',n:'Golden Ticket',d:'Defeat a rare golden dino.',i:'✨',t:'gold',c:()=>(st().golden||0)>=1},
 {g:'Exploration',id:'trophy6',n:'Six-Pack',d:'Collect all 6 Coach Trophies.',i:'🏅',t:'gold',c:()=>S.trophies.length>=6},
 {g:'Exploration',id:'champion',n:'Gridiron Legend',d:'Defeat Commissioner Spino.',i:'👑',t:'gold',c:()=>S.champion},
 {g:'Exploration',id:'legend1',n:'Old-School Respect',d:'Defeat a legendary coach guarding a gold chest.',i:'🧢',t:'gold',c:()=>legendsBeat()>=1},
 {g:'Exploration',id:'legend5',n:'Legends Never Die',d:'Defeat all 5 legendary coaches.',i:'🏛️',t:'plat',c:()=>legendsBeat()>=5},
 {g:'Difficulty Challenges',id:'rookie10',n:'Rookie Camp',d:'Win 10 battles on Rookie.',i:'🟢',t:'bronze',c:()=>tierWins('rookie')>=10},
 {g:'Difficulty Challenges',id:'pro10',n:'Making the Team',d:'Win 10 battles on Pro.',i:'🟡',t:'silver',c:()=>tierWins('pro')>=10},
 {g:'Difficulty Challenges',id:'allpro10',n:'All-Pro Grind',d:'Win 10 battles on All-Pro.',i:'🔴',t:'gold',c:()=>tierWins('allpro')>=10},
 {g:'Difficulty Challenges',id:'superfan10',n:'True Superfan',d:'Win 10 battles on Superfan.',i:'🟣',t:'plat',c:()=>tierWins('superfan')>=10},
 {g:'Difficulty Challenges',id:'coach_rookie',n:'Training Wheels',d:'Beat a Head Coach on Rookie.',i:'🚲',t:'bronze',c:()=>(st().bossBy.rookie||0)>=1},
 {g:'Difficulty Challenges',id:'coach_pro',n:'Head of the Class',d:'Beat a Head Coach on Pro.',i:'📋',t:'silver',c:()=>(st().bossBy.pro||0)>=1},
 {g:'Difficulty Challenges',id:'coach_allpro',n:'All-Pro Coach Killer',d:'Beat a Head Coach on All-Pro.',i:'🥇',t:'gold',c:()=>(st().bossBy.allpro||0)>=1},
 {g:'Difficulty Challenges',id:'coach_superfan',n:'Superfan Showdown',d:'Beat a Head Coach on Superfan.',i:'💜',t:'plat',c:()=>(st().bossBy.superfan||0)>=1},
 {g:'Difficulty Challenges',id:'champ_allpro',n:'All-Pro Champion',d:'Beat Commissioner Spino on All-Pro.',i:'🏆',t:'plat',c:()=>(st().champBy.allpro||0)>=1},
 {g:'Difficulty Challenges',id:'champ_superfan',n:'Superfan Supreme',d:'Beat Commissioner Spino on Superfan.',i:'👑',t:'plat',c:()=>(st().champBy.superfan||0)>=1},
 {g:'Mastery',id:'zebra',n:'Speaks Zebra',d:'Correctly read 15 referee signals.',i:'🦓',t:'silver',c:()=>(st().sig||0)>=15},
 {g:'Mastery',id:'xo',n:'X\'s and O\'s',d:'Correctly identify 10 formations.',i:'📐',t:'silver',c:()=>(st().form||0)>=10},
 {g:'Daily Challenge',id:'daily1',n:'Daily Habit',d:'Finish your first Daily Challenge.',i:'📅',t:'bronze',c:()=>(loadDaily().played||0)>=1},
 {g:'Daily Challenge',id:'daily7',n:'Week-Long Streak',d:'Play the Daily Challenge 7 days in a row.',i:'🗓️',t:'silver',c:()=>(loadDaily().bestStreak||0)>=7},
 {g:'Daily Challenge',id:'dailyperfect',n:'Perfect Day',d:'Get all 10 Daily Challenge questions right.',i:'🌞',t:'gold',c:()=>!!loadDaily().perfect},
 {g:'Secrets',id:'sanctum',n:'Into the Sanctum',d:'Find the hidden Fossil Sanctum.',hint:'Win battles on every difficulty, then visit the monolith in Kickoff Town.',i:'🌋',t:'plat',secret:true,c:()=>S.sanctum},
 {g:'Secrets',id:'goat',n:'The GOAT',d:'Defeat the GOAT-osaurus.',hint:'Something ancient waits in a hidden place.',i:'🐐',t:'plat',secret:true,c:()=>S.bosses.goat},
];
const achQ=[];let achShowing=false;
function checkAch(){if(!S||state==='title')return;for(const a of ACH){if(S.ach[a.id])continue;let ok=false;try{ok=!!a.c()}catch(e){}if(ok){S.ach[a.id]=Date.now();const r=ATIER[a.t].pts*2;S.coins+=r;achQ.push([a,r])}}if(achQ.length){updHud();saveGame(true);showAch()}}
function showAch(){if(achShowing||!achQ.length)return;achShowing=true;const[a,r]=achQ.shift();const el=$('#achToast'),tt=ATIER[a.t];
 el.innerHTML=`<div class="ai" style="background:${tt.c}">${a.i}</div><div><small style="color:${tt.c}">🏅 ${tt.n.toUpperCase()} ACHIEVEMENT</small><br><b>${esc(a.n)}</b><br><small>${esc(a.d)} · +${r} 🪙</small></div>`;el.style.borderColor=tt.c;el.classList.add('show');SFX.level();
 setTimeout(()=>{el.classList.remove('show');setTimeout(()=>{achShowing=false;showAch()},400)},3200)}
function achPoints(){return ACH.filter(a=>S.ach[a.id]).reduce((n,a)=>n+ATIER[a.t].pts,0)}
// ---------------- DIALOG ----------------
let dq=null;
function dialog(lines,cb){state='dialog';dq={lines:lines.map(l=>String(l).replace(/\{N\}/g,NM())),cb,i:0,shown:0,full:'',choice:null};showLine()}
function showLine(){$('#dialog').classList.remove('hidden');dq.full=dq.lines[dq.i];dq.shown=0;$('#dlgChoices').innerHTML='';$('#dlgNext').style.display='none'}
function choice(text,opts,cb){state='dialog';dq={lines:[text],cb:null,i:0,shown:0,full:text,choice:{opts,cb,sel:0}};$('#dialog').classList.remove('hidden');$('#dlgChoices').innerHTML='';$('#dlgNext').style.display='none'}
function renderChoices(){const c=dq.choice;$('#dlgChoices').innerHTML=c.opts.map((o,i)=>`<button class="ch${i===c.sel?' sel':''}" onclick="G.pickChoice(${i})">${c.opts.length>2?(i+1)+'. ':''}${esc(o)}</button>`).join('')}
function updDialog(){if(!dq)return;if(dq.shown<dq.full.length){dq.shown=Math.min(dq.full.length,dq.shown+2);$('#dlgText').textContent=dq.full.slice(0,dq.shown);if(dq.shown>=dq.full.length){if(dq.choice)renderChoices();else $('#dlgNext').style.display='block'}}}
function advDialog(){if(!dq)return;if(dq.shown<dq.full.length){dq.shown=dq.full.length;$('#dlgText').textContent=dq.full;if(dq.choice)renderChoices();else $('#dlgNext').style.display='block';return}
 if(dq.choice){pickChoice(dq.choice.sel);return}
 SFX.blip();dq.i++;if(dq.i<dq.lines.length){showLine();return}
 const cb=dq.cb;dq=null;$('#dialog').classList.add('hidden');state='world';cb&&cb()}
function pickChoice(i){if(!dq||!dq.choice)return;if(dq.shown<dq.full.length)return;const cb=dq.choice.cb;dq=null;$('#dialog').classList.add('hidden');state='world';SFX.blip();cb&&cb(i)}

// ---------------- HUD ----------------
function updHud(){if(!S)return;const s=stats();S.hp=Math.min(S.hp,s.hp);
 $('#hudNm').textContent=$('#plName').textContent=NM().toUpperCase();$('#hudLv').textContent='Lv'+S.lv;setBar('#hudHp',S.hp/s.hp);$('#hudHpT').textContent=`${Math.ceil(S.hp)}/${s.hp}`;$('#hudCoins').textContent='🪙 '+S.coins;
 $('#trophies').textContent=`🏆 ${S.trophies.length}/6`;
 $('#buffs').innerHTML=Object.keys(S.buffs).map(k=>`<span class="buff" title="${BUFFS[k].name}">${BUFFS[k].icon}<small>${S.buffs[k]}${BUFFS[k].steps?'':''}</small></span>`).join('');
 $('#btnSnd').textContent=S.sound?'🔊':'🔇';$('#btnSnd').title='Sound effects';updObjective()}
let objTarget=null;
function updObjective(){let txt,tgt;
 if(S.champion){txt='🏆 CHAMPION! Keep exploring & studying.';tgt=null}
 else if(S.trophies.length>=6){const c=poiById('champ');txt='Final: Championship Stadium';tgt=c}
 else{const id=BOSS_ORDER.find(i=>!S.bosses[i]);const p=poiById(id);txt=`Next: ${p.name} (${CATS[p.cat].name})`;tgt=p}
 objTarget=tgt;$('#objective').textContent=txt}
function drawCompass(){const c=$('#compass'),g=c.getContext('2d');g.clearRect(0,0,24,24);if(!objTarget)return;
 const ty=objTarget.id==='champ'&&!S.gateOpen?objTarget.y+12:objTarget.y-5;const a=Math.atan2(ty-player.y,objTarget.x-player.x);const d=Math.hypot(objTarget.x-player.x,ty-player.y);
 g.save();g.translate(12,12);g.fillStyle='#1a1230';g.beginPath();g.arc(0,0,11,0,7);g.fill();g.fillStyle='#fdf8ec';g.beginPath();g.arc(0,0,9,0,7);g.fill();
 if(d<4){g.fillStyle='#e8443a';g.beginPath();g.arc(0,0,3,0,7);g.fill()}else{g.rotate(a);g.fillStyle='#e8443a';g.beginPath();g.moveTo(8,0);g.lineTo(-4,-5);g.lineTo(-1,0);g.lineTo(-4,5);g.closePath();g.fill()}g.restore()}
let toastT=0;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200)}
let banT=0;function banner(m){const b=$('#banner');b.textContent=m;b.classList.add('show');clearTimeout(banT);banT=setTimeout(()=>b.classList.remove('show'),2200)}
function drawFace(){const c=$('#face'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(bradySpr.down[0],0,0,18,13,0,0,36,26)}

// ---------------- MENU ----------------
let menuTab='bag';
function openMenu(tab){state='menu';menuTab=tab||menuTab;$('#menu').classList.remove('hidden');renderMenu()}
function closeMenu(){$('#menu').classList.add('hidden');$('#shop').classList.add('hidden');$('#mapView').classList.add('hidden');state=B?'battle':'world';updHud()}
function renderMenu(){
 const tabs=[['bag','🎒 Bag'],['gear','🏈 Gear'],['dex','🦖 Dino-Dex'],['film','🎬 Film Room'],['prog','🏆 Progress'],['ach','🏅 Awards'],['guide','📖 Guide'],['opt','⚙️ Options']];
 $('#menuTabs').innerHTML=tabs.map(([k,n])=>`<button class="${k===menuTab?'on':''}" onclick="G.tab('${k}')">${n}</button>`).join('')+`<button class="x" onclick="G.closeMenu()">✕</button>`;
 const s=stats();let h='';
 if(menuTab==='bag'){const ks=Object.keys(CONS).filter(k=>S.inv[k]);h=`<div class="sub">HP ${Math.ceil(S.hp)}/${s.hp} · 🪙 ${S.coins} coins</div><div class="grid">`+(ks.length?ks.map(k=>{const c=CONS[k];const usable=!c.battle;return`<div class="card"><div class="ic">${c.icon}</div><div><b>${c.name}</b> x${S.inv[k]}<br><small>${c.desc}</small></div>${usable?`<button onclick="G.useItem('${k}')">Use</button>`:'<small class="muted">battle only</small>'}</div>`}).join(''):'<i>Your bag is empty. Check chests ✨ and win battles for loot!</i>')+'</div>'}
 else if(menuTab==='gear'){h=`<div class="gearPrev"><canvas id="gp1" width="54" height="54"></canvas><canvas id="gp2" width="54" height="54"></canvas><canvas id="gp3" width="54" height="54"></canvas><div><b>${esc(poss(NM()))} look</b><br><small>Helmets, armor and cleats change how you look, and your weapon shows in your hand. Higher levels and legendary gear add sparkles and auras!</small><br><button onclick="G.editLook()" style="margin-top:3px">✂️ Change look</button></div></div><div class="stats">ATK <b>${s.atk}</b> · DEF <b>${s.def}</b> · Max HP <b>${s.hp}</b> · CRIT <b>${Math.round(s.crit*100)}%</b> · JUKE <b>${Math.round(s.dodge*100)}%</b>${s.heal?` · Heal <b>${s.heal}</b>/correct`:''}</div>`;
  h+='<div class="slots">'+SLOTS.map(sl=>{const id=S.equip[sl],g=id&&GEAR[id];return`<div class="slot"><small>${SLOTN[sl]}</small><br>${g?`<span style="color:${RAR[g.r].c}">${g.icon} <b>${g.name}</b></span><br><small>${gearDesc(g)}</small>`:'<i>empty</i>'}</div>`}).join('')+'</div>';
  const counts={};S.gear.forEach(id=>counts[id]=(counts[id]||0)+1);
  h+='<div class="grid">'+Object.keys(counts).sort((a,b)=>GEAR[b].r-GEAR[a].r).map(id=>{const g=GEAR[id],eq=S.equip[g.slot]===id;return`<div class="card" style="border-color:${RAR[g.r].c}"><div class="ic">${g.icon}</div><div><b style="color:${RAR[g.r].c}">${g.name}</b>${counts[id]>1?' x'+counts[id]:''}<br><small>${RAR[g.r].n} ${SLOTN[g.slot]} · ${gearDesc(g)}</small></div>${eq?'<small class="good">equipped</small>':`<button onclick="G.equip('${id}')">Equip</button>`}</div>`}).join('')+'</div>'}
 else if(menuTab==='dex'){const seen=Object.keys(S.names).length;h=`<div class="sub">Unique dinos met: <b>${seen}</b> · Families: <b>${Object.keys(S.dex).length}/8</b></div><div class="grid dex">`+FAMS.map(f=>{const d=S.dex[f];return`<div class="card"><canvas class="dexc" data-f="${f}" width="58" height="50"></canvas><div><b>${d?FAMN[f]:'???'}</b><br><small>${d?`Seen ${d.seen} · Beaten ${d.def}`:'Not discovered'}</small></div></div>`}).join('')+'</div>'}
 else if(menuTab==='film'){const ids=Object.keys(S.missed).map(Number);const acc=S.st.ans?Math.round(S.st.cor/S.st.ans*100):0;
  h=`<div class="sub">Accuracy: <b>${acc}%</b> (${S.st.cor}/${S.st.ans}) · Best streak: <b>${S.st.best}</b></div><div class="catbars">`+Object.keys(CATS).map(k=>{const c=S.st.cat[k]||[0,0];const p=c[0]?Math.round(c[1]/c[0]*100):0;return`<div class="cb"><span>${CATS[k].name}</span><div class="bar"><i style="width:${p}%;background:${CATS[k].c}"></i></div><small>${c[1]}/${c[0]}</small></div>`}).join('')+'</div>';
  h+=`<h4>Plays to review (${ids.length}) ${ids.length?`<button onclick="G.drill()">🏋️ Practice Drill</button>`:''}</h4>`+(ids.length?ids.map(id=>{const q=QB[id];return`<div class="film">${q.pic?`<canvas class="filmPic" data-pic="${q.pic}"></canvas>`:''}<span class="cat" style="background:${CATS[q.cat].c}">${CATS[q.cat].name}</span> ${esc(q.q)}<br><b class="good">✔ ${esc(q.a)}</b> <small>${esc(q.x)}</small></div>`}).join(''):'<i>No missed questions right now. Questions you miss show up here until you get them right twice.</i>')}
 else if(menuTab==='prog'){h=`<div class="sub">Level <b>${S.lv}</b> · XP ${S.xp}/${xpNeed(S.lv)} · Battles ${S.st.battles} · Wins ${S.st.wins} · Steps ${S.steps}</div><div class="grid">`+BOSS_ORDER.concat(['champ']).map(id=>{const p=poiById(id),d=p.boss,done=S.bosses[id];return`<div class="card ${done?'won':''}"><div class="ic">${done?'🏆':'🔒'}</div><div><b>${done?d.trophy:'???'}</b><br><small>${p.name} · ${d.name}<br>${p.cat?CATS[p.cat].name:'All categories'} · Lv ${d.lv}</small></div></div>`}).join('')+'</div>'}
 else if(menuTab==='guide'){h=`<div class="sub">Study the referee signals and formations you'll see in picture questions. Moving signals are animated.</div><h4>🦓 Referee signals</h4><div class="ggrid">`+Object.entries(SIGNALS).map(([k,s2])=>`<div class="gcard"><canvas class="gpic" data-pic="sig:${k}" width="${SIG_W}" height="${SIG_H}"></canvas><b>${s2.n}</b><small>${esc(s2.x)}</small></div>`).join('')+`</div><h4>📐 Formations</h4><div class="ggrid wide">`+Object.entries(FORMS).map(([k,f])=>`<div class="gcard"><canvas class="gpic" data-pic="form:${k}" width="120" height="84"></canvas><b>${f.n}</b><small>${esc(f.x)}</small></div>`).join('')+'</div>'}
 else if(menuTab==='ach'){const got=ACH.filter(a=>S.ach[a.id]).length,maxP=ACH.reduce((n,a)=>n+ATIER[a.t].pts,0);
  h=`<div class="stats">🏅 ${got}/${ACH.length} achievements · ${achPoints()}/${maxP} points · Harder difficulties earn rarer awards!</div><div class="tierprog">`+TIERS.map(([t,n,c])=>`<span style="border-color:${c}">${tierWins(t)>=SECRET_WINS?'💎':'⬛'} ${n}: ${tierWins(t)} wins</span>`).join('')+`</div>`;
  const groups=[...new Set(ACH.map(a=>a.g))];
  h+=groups.map(g=>`<h4>${g}</h4><div class="grid">`+ACH.filter(a=>a.g===g).map(a=>{const ok=S.ach[a.id],tt=ATIER[a.t],hide=a.secret&&!ok;return`<div class="card ach ${ok?'got':''}" style="border-color:${ok?tt.c:'#cbbd98'}"><div class="ic" style="${ok?'':'filter:grayscale(1);opacity:.45'}">${hide?'❓':a.i}</div><div><b>${hide?'???':esc(a.n)}</b> <small style="color:${tt.c};font-weight:800">${tt.n}</small><br><small>${hide?esc(a.hint):esc(a.d)}</small></div>${ok?'<span class="good">✔</span>':''}</div>`}).join('')+'</div>').join('')}
 else if(menuTab==='opt'){h=`<div class="opt"><button class="musBtn" onclick="G.music();G.tab('opt')">🎵 Music</button><button class="fsBtn" onclick="G.fs()">⛶ Full screen</button><button onclick="G.save()">💾 Save game</button><button onclick="G.snd()">${S.sound?'🔊 Sound: ON':'🔇 Sound: OFF'}</button><button onclick="G.openMap()">🗺 World map</button></div>
  <div class="sub">Difficulty: <b>${{rookie:'Rookie',pro:'Pro',allpro:'All-Pro',superfan:'Superfan'}[S.diff]}</b> <button onclick="G.cycleDiff()">Change</button></div>
  <div class="help"><b>Controls</b><br>Move: Arrow keys / WASD · Run: hold Shift<br>Talk / Interact / Confirm: Space, Enter or Z<br>Back: Esc or X · Menu: I or Tab · Map: M<br>Battle answers: 1–4 keys or click/tap<br>Zoom: + / − keys, mouse wheel, pinch, or the 🔍 buttons<br>Full screen: F key or the ⛶ button<br>Daily Challenge: the 📅 button or the title screen<br><br><b>Tips</b><br>Tall grass has the most wild dinos. Each region's dinos ask more questions from the local Head Coach's category.<br>Questions you miss come back later so you can master them.</div>
  <div class="help"><b>Save codes</b>: the game auto-saves in this browser. To move your progress to another device or browser, export a save code there and import it here.<div class="opt"><button onclick="G.exportSave()">📤 Export save code</button><button onclick="G.importSave()">📥 Import save code</button></div><div id="saveIO"></div></div>
  <div class="opt"><button class="danger" onclick="G.reset()">🗑 Start a new game</button></div>`}
 $('#menuBody').innerHTML=h;updMusicBtn();
 document.querySelectorAll('.filmPic').forEach(c=>{const sig=c.dataset.pic.startsWith('sig');c.width=sig?SIG_W:120;c.height=sig?SIG_H:84;drawPic(c,c.dataset.pic,0)});
 document.querySelectorAll('.gpic').forEach(c=>drawPic(c,c.dataset.pic,0));
 if(menuTab==='gear')[['gp1','down'],['gp2','right'],['gp3','up']].forEach(([id,d])=>{const c=$('#'+id),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(bradySpr[d][0],0,0,54,54)});
 if(menuTab==='dex')document.querySelectorAll('.dexc').forEach(c=>{const f=c.dataset.f;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(S.dex[f]){g.drawImage(dexSpr(f),0,0)}else{g.globalAlpha=.25;g.drawImage(dexSpr(f),0,0);g.globalCompositeOperation='source-atop';g.globalAlpha=1;g.fillStyle='#1a1230';g.fillRect(0,0,58,50)}})}
const dexCache={};function dexSpr(f){if(!dexCache[f]){const r=mulberry32(FAMS.indexOf(f)+3);const h=r()*360;dexCache[f]=makeDino(f,{B:hsl(h,50,48),L:hsl(h+30,45,78),P:hsl(h+180,50,30),K:'#f0e6cc'},'none',5)}return dexCache[f]}
function useItem(k,inBattle){const c=CONS[k];if(!S.inv[k])return;const s=stats();
 if(c.heal){if(S.hp>=s.hp){toast('HP is already full!');return}S.hp=Math.min(s.hp,S.hp+c.heal);SFX.heal();toast(`${c.icon} Used ${c.name}!`)}
 else if(c.buff){const[b,n]=c.buff;S.buffs[b]=(S.buffs[b]||0)+n;SFX.item();toast(`${c.icon} ${BUFFS[b].name} active!`)}
 else return;
 S.inv[k]--;if(!S.inv[k])delete S.inv[k];updHud();
 if(inBattle&&B){updBattleBoxes();renderQ()}else renderMenu()}
function equip(id){const g=GEAR[id];S.equip[g.slot]=id;SFX.blip();rebuildBrady();updHud();renderMenu()}

// ---------------- CHARACTER CREATOR ----------------
let CR=null,crTimer=0;
function openCreator(mode,keep){if(!(keep&&CR&&CR.mode===mode))CR={mode,hero:mode==='edit'?heroOf(S):heroOf(null),helm:false};CR.ret=state;state='create';
 const h=CR.hero,box=$('#creator');
 box.innerHTML=`<div class="crHead"><b>🎨 ${mode==='edit'?'Change your look':'Create your player'}</b><button class="x" onclick="G.crBack()">✕</button></div>
 <div class="crBody"><div class="crPrev"><div class="crStage"><div id="crTag"></div><canvas id="crP0" width="90" height="90"></canvas></div>
  <div class="crTurn"><canvas id="crP1" width="42" height="42"></canvas><canvas id="crP2" width="42" height="42"></canvas><canvas id="crP3" width="42" height="42"></canvas><canvas id="crFace" width="42" height="30" title="HUD face"></canvas></div>
  <label class="crHelm"><input type="checkbox" id="crHelm"${CR.helm?' checked':''}> Try on a helmet</label></div>
 <div class="crOpts">
  <div class="crRow"><span>Name</span><input id="crName" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Brady"></div>
  <div class="crRow"><span>Hair color</span><div class="opts">${HERO_HAIR.map(([c,n])=>`<button class="sw" data-k="hair" data-v="${c}" title="${n}" style="background:${c}"></button>`).join('')}</div></div>
  <div class="crRow"><span>Hair style</span><div class="opts">${HERO_STYLES.map(([k,n])=>`<button class="st" data-k="style" data-v="${k}">${n}</button>`).join('')}</div></div>
  <div class="crRow"><span>Skin tone</span><div class="opts">${HERO_SKIN.map(c=>`<button class="sw" data-k="skin" data-v="${c}" style="background:${c}"></button>`).join('')}</div></div>
  <div class="crRow"><span>Freckles</span><div class="opts"><button class="st" data-k="fr" data-v="1">On</button><button class="st" data-k="fr" data-v="0">Off</button></div></div>
 </div></div>
 <div class="crBtns"><button onclick="G.crBack()">◀ Back</button><button onclick="G.crRandom()">🎲 Surprise me</button><button class="go" onclick="G.crDone()">${mode==='edit'?'✔ Save look':'Next: Difficulty ▶'}</button></div>`;
 const inp=$('#crName');inp.value=h.name;
 inp.oninput=()=>{const v=inp.value.replace(/[^\p{L}\p{N} '.\-]/gu,'');if(v!==inp.value)inp.value=v;CR.hero.name=v;crRefresh()};
 inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();crDone()}else if(e.key==='Escape'){e.preventDefault();crBack()}};
 $('#crHelm').onchange=e=>{CR.helm=e.target.checked;crRefresh()};
 box.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k,v=b.dataset.v;CR.hero[k]=k==='fr'?v==='1':v;SFX.blip();crRefresh()};
 box.classList.remove('hidden');crRefresh();clearInterval(crTimer);crTimer=setInterval(crAnim,220)}
function crLook(){const h=heroOf({hero:CR.hero});const eq=Object.assign({},CR.mode==='edit'?S.equip:newSave().equip);if(CR.helm&&!eq.helmet)eq.helmet='prohelm';return{h,spr:makeBradySprites(eq,h)}}
function crRefresh(){if(!CR)return;const{h,spr}=crLook();CR.spr=spr;
 document.querySelectorAll('#creator [data-k]').forEach(b=>{const k=b.dataset.k,v=b.dataset.v;b.classList.toggle('on',k==='fr'?(v==='1')===h.fr:h[k]===v)});
 $('#crTag').textContent=h.name;
 [['crP1','down'],['crP2','right'],['crP3','up']].forEach(([id,d])=>{const g=$('#'+id).getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,42,42);g.drawImage(spr[d][0],0,0,42,42)});
 const f=$('#crFace').getContext('2d');f.imageSmoothingEnabled=false;f.clearRect(0,0,42,30);f.drawImage(spr.down[0],0,0,18,13,0,0,42,30);crAnim(true)}
let crF=0;
function crAnim(still){if(!CR||!CR.spr)return;if(!still)crF++;const dirs=['down','right','up','left'],d=dirs[(crF>>4)%4],fr=[1,0,2,0][crF%4];
 const g=$('#crP0').getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,90,90);g.drawImage(CR.spr[d][fr],0,0,90,90)}
function crClose(){clearInterval(crTimer);$('#creator').classList.add('hidden')}
function crDone(){if(!CR)return;CR.hero=heroOf({hero:Object.assign({},CR.hero,{name:$('#crName').value})});SFX.blip();crClose();
 if(CR.mode==='edit'){S.hero=CR.hero;rebuildBrady();updHud();saveGame(true);state='menu';renderMenu();toast(`✂️ Looking good, ${NM()}!`)}
 else{state='title';$('#newGameBox').classList.remove('hidden')}}
function crBack(){if(!CR)return;crClose();if(CR.mode==='edit'){state='menu';renderMenu()}else state='title'}
function crRandom(){const p=a=>a[(Math.random()*a.length)|0];Object.assign(CR.hero,{hair:p(HERO_HAIR)[0],style:p(HERO_STYLES)[0],skin:p(HERO_SKIN),fr:Math.random()<.4});SFX.blip();crRefresh()}

// ---------------- SHOP ----------------
let shopN=null,shopTab='buy';
function openShop(n){shopN=n;state='menu';$('#shop').classList.remove('hidden');
 if(!n.stock){const rr=mulberry32(hash(n.x,n.y));const tier=n.tier||0;const pool=Object.keys(GEAR).filter(k=>GEAR[k].r===tier||GEAR[k].r===Math.max(0,tier-1));n.stock=[];for(let i=0;i<4&&pool.length;i++){const k=pool.splice((rr()*pool.length)|0,1)[0];n.stock.push(k)}}renderShop()}
function renderShop(){const n=shopN;let h=`<div id="menuTabs"><button class="${shopTab==='buy'?'on':''}" onclick="G.shopTab('buy')">🛒 Buy</button><button class="${shopTab==='sell'?'on':''}" onclick="G.shopTab('sell')">💰 Sell gear</button><span class="coins">🪙 ${S.coins}</span><button class="x" onclick="G.closeMenu()">✕</button></div><div id="menuBody2">`;
 if(shopTab==='buy'){h+='<div class="grid">'+Object.keys(CONS).map(k=>{const c=CONS[k];return`<div class="card"><div class="ic">${c.icon}</div><div><b>${c.name}</b> <small>(have ${S.inv[k]||0})</small><br><small>${c.desc}</small></div><button ${S.coins>=c.price?'':'disabled'} onclick="G.buy('${k}')">${c.price}🪙</button></div>`}).join('')+n.stock.map(k=>{const g=GEAR[k],p=GEAR_PRICE[g.r];return`<div class="card" style="border-color:${RAR[g.r].c}"><div class="ic">${g.icon}</div><div><b style="color:${RAR[g.r].c}">${g.name}</b><br><small>${SLOTN[g.slot]} · ${gearDesc(g)}</small></div><button ${S.coins>=p?'':'disabled'} onclick="G.buyGear('${k}')">${p}🪙</button></div>`}).join('')+'</div>'}
 else{const sellable=S.gear.map((id,i)=>({id,i})).filter(o=>!(S.equip[GEAR[o.id].slot]===o.id&&S.gear.filter(x=>x===o.id).length===1));
  h+='<div class="grid">'+(sellable.length?sellable.map(o=>{const g=GEAR[o.id];return`<div class="card"><div class="ic">${g.icon}</div><div><b style="color:${RAR[g.r].c}">${g.name}</b><br><small>${gearDesc(g)}</small></div><button onclick="G.sell(${o.i})">+${Math.round(GEAR_PRICE[g.r]/2)}🪙</button></div>`}).join(''):'<i>No spare gear to sell. (Equipped items can\'t be sold.)</i>')+'</div>'}
 $('#shop').innerHTML=h+'</div>'}

// ---------------- MAP VIEW ----------------
let miniMap=null;
const MAPC={[T.GRASS]:'#6cc04a',[T.TALL]:'#3f9a35',[T.PATH]:'#e0c080',[T.WATER]:'#3a7bd5',[T.SAND]:'#f0da9a',[T.TREE]:'#26703a',[T.PINE]:'#1d5a2e',[T.ROCK]:'#7a7f88',[T.FLOWER]:'#8fd070',[T.FLOOR]:'#e8e0cc',[T.WALL]:'#efe3c6',[T.ROOF]:'#c8423a',[T.ROOFB]:'#3f6fc8',[T.DOOR]:'#7a4a26',[T.WINDOW]:'#efe3c6',[T.FENCE]:'#a8743f',[T.BRIDGE]:'#b07a45',[T.LAVA]:'#e8501c',[T.JUNGLE]:'#2f7d36',[T.FOUNTAIN]:'#4a90e8',[T.BRUSH]:'#c8b070',[T.SIGN]:'#a8743f',[T.GATE]:'#f5c542',[T.FIELD]:'#43a047',[T.FIELDLINE]:'#ffffff',[T.TOTEM]:'#f5c542',[T.CACTUS]:'#2f8a3a',[T.MFLOOR]:'#a8957a',[T.VFLOOR]:'#4a3838',[T.COLUMN]:'#e8e4d8',[T.GOAL]:'#f5d142',[T.MONO]:'#5a5070'};
function drawMiniMap(force){if(miniMap&&!force)return;miniMap=document.createElement('canvas');miniMap.width=MW*2;miniMap.height=MH*2;const g=miniMap.getContext('2d');for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){g.fillStyle=(town[idx(x,y)]===SANCT_ID&&!S.sanctum)?MAPC[T.WATER]:(MAPC[map[idx(x,y)]]||'#000');g.fillRect(x*2,y*2,2,2)}}
function openMap(){drawMiniMap();state='menu';$('#menu').classList.add('hidden');$('#mapView').classList.remove('hidden');renderMap()}
function renderMap(){const c=$('#mapCv'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(miniMap,0,0);
 const M=2;for(const it of items)if(it.legend&&!S.taken[it.id]){g.fillStyle=OUT;g.fillRect(it.x*M-3,it.y*M-3,7,7);g.fillStyle='#f5c542';g.fillRect(it.x*M-2,it.y*M-2,5,5)}
 g.font='bold 10px monospace';g.textAlign='center';
 for(const p of POIS){const done=S.bosses[p.id];g.fillStyle=OUT;g.fillRect(p.x*M-5,p.y*M-5,10,10);g.fillStyle=p.id==='kickoff'?'#fff':done?'#3ccf5a':'#e8443a';g.fillRect(p.x*M-4,p.y*M-4,8,8);
  const lab=p.name+(done?' ✔':'');g.lineWidth=3;g.strokeStyle=OUT;g.strokeText(lab,p.x*M,p.y*M-9);g.fillStyle='#fff';g.fillText(lab,p.x*M,p.y*M-9)}
 if((frame>>4)%2===0){g.fillStyle='#fff';g.fillRect(player.x*M-3,player.y*M-3,7,7);g.fillStyle='#2f6fd6';g.fillRect(player.x*M-2,player.y*M-2,5,5)}}

// ---------------- TITLE / ENDING ----------------
function showTitle(){state='title';$('#title').classList.remove('hidden');const sv=loadSave();$('#btnCont').style.display=sv?'':'none';if(sv)$('#btnCont').textContent=`▶ Continue (Lv ${sv.lv} · 🏆 ${(sv.trophies||[]).length}/6)`;
 const th=heroOf(sv),tspr=makeBradySprites(sv?sv.equip:newSave().equip,th);$('#logoName').textContent=`★ ${poss(th.name).toUpperCase()} ★`;
 const c=$('#titleBrady'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(tspr.right[0],0,0,72,72);
 const d=$('#titleDino'),gd=d.getContext('2d');gd.imageSmoothingEnabled=false;gd.save();gd.translate(116,0);gd.scale(-1,1);gd.drawImage(makeDino('rex',{B:'#4fae5a',L:'#d8f0b0',P:'#1f5a2a',K:'#f4f4f4'},'stripes',3),0,0,116,100);gd.restore()}
function startGame(sv,isNew){S=sv;S.hero=heroOf(S);
 for(const k of['buffs','taken','bosses','npc','totem','seen','missed','dex','names','visited','ach','flags'])S[k]=S[k]||{};
 for(const k of['winsBy','bossBy','champBy'])S.st[k]=S.st[k]||{};
 $('#title').classList.add('hidden');$('#hud').classList.remove('hidden');
 if(S.mapv!==2){S.mapv=2;S.x=S.respawn.x=POIS[0].x;S.y=S.respawn.y=POIS[0].y+3;S.taken={};S.npc={};S.totem={};if(!isNew)setTimeout(()=>toast(`🗺 The isles doubled in size! ${NM()} is back in Kickoff Town.`),600)}
 if(S.gateOpen)for(let i=0;i<map.length;i++)if(map[i]===T.GATE)map[i]=T.BRIDGE;
 zoomI=S.zoom??1;updZoomBtns();
 startPlayer();state='world';lastRegion=region[idx(S.x,S.y)];lastTown=town[idx(S.x,S.y)];rebuildBrady();updHud();ac();setTimeout(checkAch,2500);
 if(isNew){dialog(["🦖 THE GRIDIRON ISLES are overrun by DINOSAURS!","These dinos only respect one thing: FOOTBALL KNOWLEDGE.",`In battle, a question pops up. Answer RIGHT and ${NM()} attacks. Answer WRONG and the dino attacks ${NM()}!`,"Beat the 6 Head Coach dinos to earn their trophies, then face COMMISSIONER SPINO in the volcano at the center of the isles.","Follow the red compass (top-right) to your next goal. Talk to people with Space/Enter. Press M for the map and I for your menu.",`Ready, ${NM()}? Let's go! 🏈`],()=>{S.intro=true;saveGame(true)})}
 else{banner(POIS[lastRegion].region);toast(`Welcome back, ${NM()}!`)}}
function showEnding(){state='menu';$('#endName').textContent=NM();const acc=S.st.ans?Math.round(S.st.cor/S.st.ans*100):0;$('#ending').classList.remove('hidden');
 $('#endStats').innerHTML=`Level <b>${S.lv}</b> · Questions answered <b>${S.st.ans}</b> · Accuracy <b>${acc}%</b><br>Best streak <b>${S.st.best}</b> · Dinos battled <b>${S.st.battles}</b> · Steps <b>${S.steps}</b>`;SFX.win()}

// ---------------- MUSIC ----------------
const SET_KEY='bdq_settings_v1';
function loadSet(){try{return JSON.parse(localStorage.getItem(SET_KEY))||{}}catch(e){return{}}}
const SETS=Object.assign({music:true},loadSet());
function saveSet(){try{localStorage.setItem(SET_KEY,JSON.stringify(SETS))}catch(e){}}
const TRACKS={
 title:{bpm:120,lead:"C5 . E5 G5 C6 . B5 G5 | A5 . F5 A5 G5 . E5 . | F5 . A5 C6 B5 . G5 B5 | C6 . . . G5 . - - | E5 . G5 C6 E6 . D6 C6 | B5 . G5 . A5 . B5 . | C6 . G5 . E5 . G5 . | C6 . . . - . - .",
  bass:"C3 . C3 . G2 . G2 . | F2 . F2 . C3 . C3 . | F2 . F2 . G2 . G2 . | C3 . G2 . C3 . - . | C3 . C3 . E2 . E2 . | G2 . G2 . G2 . G2 . | A2 . F2 . G2 . G2 . | C3 . G2 . C3 . . .",drums:"k h s h k k s h"},
 field:{bpm:132,lead:"G4 B4 D5 . B4 D5 G5 . | F#5 . E5 D5 E5 . D5 B4 | C5 E5 G5 . E5 G5 C6 . | B5 A5 G5 F#5 G5 . - . | E5 . D5 B4 C5 . A4 . | B4 D5 G5 . F#5 E5 D5 . | E5 G5 B5 . A5 G5 F#5 . | G5 . D5 . G4 . - .",
  bass:"G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | C3 . G2 . C3 . G2 . | D3 . A2 . D3 . D2 . | C3 . G2 . A2 . E2 . | G2 . D3 . D2 . A2 . | E2 . B2 . C3 . D3 . | G2 . D3 . G2 . . .",drums:"k h s h k h s h k h s h k k s s"},
 town:{bpm:108,lead:"A4 . C5 . F5 . E5 D5 | C5 . A4 . G4 . . . | A4 . C5 . F5 . G5 A5 | G5 . E5 . F5 . . . | D5 . F5 . A5 . G5 F5 | E5 . C5 . D5 . E5 . | F5 . A5 . G5 F5 E5 D5 | C5 . . . F4 . . .",
  bass:"F2 . C3 . F2 . C3 . | C2 . G2 . C2 . G2 . | F2 . C3 . D3 . A2 . | Bb2 . F2 . C3 . . . | Bb2 . F2 . Bb2 . F2 . | C3 . G2 . C3 . G2 . | F2 . C3 . Bb2 . C3 . | F2 . C3 . F2 . . .",drums:"k - h - s - h - k - h h s - h -"},
 volcano:{bpm:116,lead:"E4 . F4 . E4 . - . | G4 . F4 . E4 . . . | B4 . C5 . B4 . A4 . | G4 . F4 . E4 . . . | E5 . F5 . E5 . D5 . | C5 . B4 . A4 . B4 . | C5 . B4 . A4 . G4 . | F4 . . . E4 . . .",
  bass:"E2 . . E2 F2 . . . | E2 . . E2 D2 . . .",drums:"k - - h s - h - k - k h s - h h"},
 sanctum:{bpm:96,lead:"E5 . B4 . G5 . F#5 . | E5 . B4 . D5 . . . | C5 . G4 . E5 . D5 . | B4 . . . - . - . | E5 . G5 . B5 . A5 . | G5 . F#5 . E5 . . . | C5 . E5 . D5 . B4 . | E5 . . . - . - .",
  bass:"E2 . . . . . . . | C2 . . . D2 . . .",drums:"h - - - h - - - h - - - h - h -"},
 battle:{bpm:152,lead:"A4 C5 E5 A5 G5 E5 C5 E5 | F5 . E5 . D5 . C5 B4 | A4 C5 E5 A5 B5 A5 G5 E5 | F5 E5 D5 B4 E5 . . . | A5 . G5 . F5 . E5 . | D5 E5 F5 G5 A5 . E5 . | F5 . E5 . D5 C5 B4 C5 | B4 . G#4 . E4 . . .",
  bass:"A2 A2 A3 A2 A2 A2 A3 A2 | F2 F2 F3 F2 F2 F2 F3 F2 | A2 A2 A3 A2 G2 G2 G3 G2 | F2 F2 F3 F2 E2 E2 E3 E2",drums:"k h s h k k s h k h s h k s s s"},
 boss:{bpm:160,lead:"D5 . D5 F5 E5 . D5 C5 | D5 . A4 . Bb4 . A4 . | D5 . D5 F5 G5 . F5 E5 | F5 . E5 . C#5 . . . | F5 . A5 . G5 F5 E5 D5 | E5 . G5 . F5 E5 D5 C#5 | D5 F5 A5 D6 C#6 A5 E5 C#5 | D5 . . . - . - .",
  bass:"D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | G1 G2 G1 G2 G1 G2 G1 G2 | A1 A2 A1 A2 A1 A2 C#2 E2",drums:"k k s h k k s s"},
 daily:{bpm:140,lead:"C5 E5 G5 E5 C6 . G5 . | A5 G5 F5 E5 D5 . . . | D5 F5 A5 F5 D6 . A5 . | B5 A5 G5 F5 E5 . G5 .",
  bass:"C3 . G2 . C3 . G2 . | F2 . C3 . F2 . C3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 .",drums:"k h s h k h s h"},
};
const noteHz=n=>{const m=/^([A-G])(#|b)?(\d)$/.exec(n);if(!m)return 0;const s={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);return 440*Math.pow(2,(s+(+m[3]+1)*12-69)/12)};
for(const k in TRACKS){const t=TRACKS[k];for(const ch of['lead','bass','drums'])t[ch]=t[ch].replace(/\|/g,' ').trim().split(/\s+/)}
const MUS={cur:null,step:0,t:0,gain:null,noise:null};
function musOut(){const a=ac();if(!a)return null;if(!MUS.gain){MUS.gain=a.createGain();MUS.gain.gain.value=SETS.music?1:0;MUS.gain.connect(a.destination);
 const b=a.createBuffer(1,a.sampleRate*.3,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.noise=b}return a}
function mNote(a,type,f,t,dur,vol){const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol,t);g.gain.setValueAtTime(vol,t+dur*.7);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(MUS.gain);o.start(t);o.stop(t+dur+.02)}
function mDrum(a,k,t){if(k==='k'){const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(MUS.gain);o.start(t);o.stop(t+.16);return}
 const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=MUS.noise;f.type='highpass';f.frequency.value=k==='h'?7000:1800;const d=k==='h'?.03:.11;g.gain.setValueAtTime(k==='h'?.025:.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(MUS.gain);s.start(t);s.stop(t+d+.02)}
function hold(arr,i){let n=1;while(arr[(i+n)%arr.length]==='.'&&n<16)n++;return n}
function musicTick(){const want=desiredTrack();if(!want)return;const a=musOut();if(!a||a.state!=='running')return;
 if(want!==MUS.cur){MUS.cur=want;MUS.step=0;MUS.t=a.currentTime+.08}
 const tr=TRACKS[MUS.cur],e=60/tr.bpm/2;if(MUS.t<a.currentTime-.5)MUS.t=a.currentTime+.05;
 while(MUS.t<a.currentTime+.2){const i=MUS.step;
  const L=tr.lead[i%tr.lead.length],Bn=tr.bass[i%tr.bass.length],Dr=tr.drums[i%tr.drums.length];
  if(L!=='.'&&L!=='-')mNote(a,'square',noteHz(L),MUS.t,e*hold(tr.lead,i%tr.lead.length)*.95,.035);
  if(Bn!=='.'&&Bn!=='-')mNote(a,'triangle',noteHz(Bn),MUS.t,e*hold(tr.bass,i%tr.bass.length)*.9,.09);
  if(Dr!=='-'&&Dr!=='.')mDrum(a,Dr,MUS.t);
  MUS.t+=e;MUS.step++}}
function desiredTrack(){if(state==='title')return'title';if(state==='daily')return'daily';
 if(B)return(B.opts.secretBoss||B.opts.legend||B.en.boss)?'boss':'battle';
 if(!S||!map)return null;const i=idx(player.x,player.y);if(town[i]===SANCT_ID)return'sanctum';if(town[i])return'town';if(POIS[region[i]].biome==='volcano')return'volcano';return'field'}
function setMusic(on){SETS.music=on;saveSet();if(MUS.gain){const a=ac();MUS.gain.gain.setTargetAtTime(on?1:0,a.currentTime,.1)}updMusicBtn();toast(on?'🎵 Music on':'🎵 Music off')}
function updMusicBtn(){const b=$('#btnMus');if(b)b.textContent=SETS.music?'🎵':'🔕';document.querySelectorAll('.musBtn').forEach(x=>x.textContent=SETS.music?'🎵 Music: ON':'🔕 Music: OFF')}
setInterval(musicTick,40);
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,()=>{const a=ac();if(a&&a.state==='suspended')a.resume().catch(()=>{});musOut()},{passive:true}));

// ---------------- DAILY CHALLENGE ----------------
const DAILY_KEY='bdq_daily_v1',DAILY_LAUNCH=Date.UTC(2026,10,21),DAILY_SECS=20,PLAY_URL='https://grittymcduff.github.io/Gridiron_dino_quest/';
function loadDaily(){try{return JSON.parse(localStorage.getItem(DAILY_KEY))||{days:{},streak:0,best:0}}catch(e){return{days:{},streak:0,best:0}}}
function saveDaily(d){try{localStorage.setItem(DAILY_KEY,JSON.stringify(d))}catch(e){}}
const dStr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function todayStr(){return dStr(new Date())}
function dailyNum(ds){const[y,m,d]=ds.split('-').map(Number);return Math.round((Date.UTC(y,m-1,d)-DAILY_LAUNCH)/864e5)+1}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function dailyQs(ds){const r=mulberry32(hashStr('daily:'+ds));const take=(d,n)=>{const pool=QB.filter(q=>q.d===d&&!q.pic);const out=[];while(out.length<n&&pool.length)out.push(pool.splice((r()*pool.length)|0,1)[0]);return out};
 return[...take(1,3),...take(2,3),...take(3,3),...take(4,1)].map(q=>{const a=[q.a,...q.w];for(let i=a.length-1;i>0;i--){const j=(r()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return{q,ans:a}})}
let D=null;
function openDaily(){if(state!=='world'&&state!=='title')return;const ds=todayStr(),dd=loadDaily();D={ret:state,ds,n:dailyNum(ds),fromGame:state==='world'};state='daily';$('#daily').classList.remove('hidden');
 if(dd.days[ds]){D.phase='done';renderDailyResult(dd.days[ds],dd);return}
 D.phase='intro';$('#daily').innerHTML=`<div class="dhead"><b>📅 Daily Challenge #${D.n}</b><button class="x" onclick="G.closeDaily()">✕</button></div>
 <div class="dintro"><div style="font-size:40px">🦖🏈</div><h3>Today's 10 questions</h3><p>Everyone who plays today gets the <b>same 10 questions</b>, from easy to Superfan. You have <b>${DAILY_SECS} seconds</b> per question. Faster correct answers score more, and 3 in a row adds a streak bonus.</p><p>One try per day. Share your score with friends when you're done!</p>
 ${dd.streak?`<p>🔥 Current streak: <b>${dd.streak} day${dd.streak>1?'s':''}</b> · Best score: <b>${dd.best}</b></p>`:''}<button class="dgo" onclick="G.dailyStart()">Start ▶</button></div>`}
function dailyStart(){if(!D)return;D.qs=dailyQs(D.ds);D.i=0;D.score=0;D.res=[];D.streak=0;dailyQ()}
function dailyQ(){const it=D.qs[D.i],q=it.q,c=CATS[q.cat];D.phase='q';D.qStart=performance.now();
 $('#daily').innerHTML=`<div class="dhead"><b>📅 Daily #${D.n}</b><span class="dots">${D.qs.map((_,k)=>`<i class="${k<D.i?(D.res[k]?'g':'r'):k===D.i?'c':''}"></i>`).join('')}</span><b>${D.score} pts</b></div>
 <div class="dbar"><i id="dTimer"></i></div>
 <div class="dq"><div class="dmeta"><span class="cat" style="background:${c.c}">${c.name}</span> <span class="diff">${q.d>=4?'<b style="color:#9b40c6">★★★★ SUPERFAN</b>':'★'.repeat(q.d)+'☆'.repeat(3-q.d)}</span> <small>Question ${D.i+1} of 10</small></div>
 <div class="dtext">${esc(q.q)}</div><div class="dans">${it.ans.map((a,k)=>`<button class="ans" onclick="G.dailyAnswer(${k})"><b>${k+1}</b> ${esc(a)}</button>`).join('')}</div><div id="dFb"></div></div>`}
function dailyAnswer(k){if(!D||D.phase!=='q')return;D.phase='fb';const it=D.qs[D.i],q=it.q,ok=k>=0&&it.ans[k]===q.a,secs=(performance.now()-D.qStart)/1000;let pts=0;
 if(ok){D.streak++;pts=100+Math.round(50*Math.max(0,1-secs/DAILY_SECS))+(D.streak>=3?25:0);SFX.correct()}else{D.streak=0;SFX.wrong()}
 D.score+=pts;D.res.push(ok?1:0);if(D.fromGame&&S)recordAnswer(q,ok);
 document.querySelectorAll('#daily .ans').forEach((el,j)=>{el.disabled=true;if(it.ans[j]===q.a)el.classList.add('right');else if(j===k)el.classList.add('wrong')});
 $('#dFb').innerHTML=`<div class="box ${ok?'ok':'no'} dfb"><b class="${ok?'good':'bad'}">${k<0?'⏱ TIME! ':''}${ok?`✔ Correct! +${pts}`:'✘ Not quite.'}</b> ${ok?'':`Answer: <b>${esc(q.a)}</b>. `}${esc(q.x)}</div><button class="dgo" onclick="G.dailyNext()">${D.i<9?'Next ▶':'See results ▶'}</button>`}
function dailyNext(){if(!D||D.phase!=='fb')return;D.i++;if(D.i<10)return dailyQ();
 const dd=loadDaily(),y=new Date();y.setDate(y.getDate()-1);dd.streak=(dd.last===dStr(y))?dd.streak+1:1;dd.last=D.ds;dd.best=Math.max(dd.best||0,D.score);dd.bestStreak=Math.max(dd.bestStreak||0,dd.streak);
 const rec={score:D.score,res:D.res,n:D.n};dd.days[D.ds]=rec;dd.played=(dd.played||0)+1;if(D.res.every(x=>x))dd.perfect=1;saveDaily(dd);
 if(D.fromGame&&S){const c=Math.round(D.score/10);S.coins+=c;rec.coins=c;saveGame(true)}SFX.win();D.phase='done';renderDailyResult(rec,dd)}
function dailyShareText(rec,dd){const c=rec.res.filter(x=>x).length;return`🦖🏈 Gridiron Dino Quest: Daily #${rec.n}\n${c}/10 · ${rec.score} pts${dd.streak>1?` · 🔥${dd.streak}-day streak`:''}\n${rec.res.map(x=>x?'🟩':'🟥').join('')}\nPlay: ${PLAY_URL}`}
function renderDailyResult(rec,dd){const c=rec.res.filter(x=>x).length,txt=dailyShareText(rec,dd);const now=new Date(),mid=new Date(now);mid.setHours(24,0,0,0);const ms=mid-now,h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);
 $('#daily').innerHTML=`<div class="dhead"><b>📅 Daily Challenge #${rec.n}</b><button class="x" onclick="G.closeDaily()">✕</button></div>
 <div class="dintro"><div class="dscore">${rec.score}<small> pts</small></div><div class="dgrid">${rec.res.map(x=>x?'🟩':'🟥').join('')}</div>
 <p><b>${c}/10 correct</b>${c===10?' · PERFECT DAY! 🏆':''} · 🔥 Streak: <b>${dd.streak} day${dd.streak>1?'s':''}</b> · Best: <b>${dd.best}</b>${rec.coins?` · +${rec.coins} 🪙 added to your game`:''}</p>
 <textarea id="dShare" readonly rows="5">${esc(txt)}</textarea>
 <div class="opt" style="justify-content:center"><button class="dgo" onclick="G.dailyCopy()">📋 Copy score</button>${navigator.share?'<button class="dgo" onclick="G.dailyShare()">📤 Share</button>':''}<button onclick="G.closeDaily()">Done</button></div>
 <small>Next challenge in ${h}h ${m}m. Missed questions from today are in your Film Room when you play from inside the game.</small></div>`}
function closeDaily(){if(!D)return;$('#daily').classList.add('hidden');state=D.ret==='title'?'title':'world';D=null;if(state==='title')showTitle();else{updHud();setTimeout(checkAch,300)}}

// ---------------- PRESS ROUTER ----------------
function press(k,v){
 if(state==='daily'){if(!D)return;if(k==='ANS'&&D.phase==='q')dailyAnswer(v);else if(k==='A'){if(D.phase==='fb')dailyNext();else if(D.phase==='intro')dailyStart()}else if(k==='B'&&(D.phase==='intro'||D.phase==='done'))closeDaily();return}
 if(state==='create'){if(k==='A')crDone();else if(k==='B')crBack();return}
 if(state==='title'){if(!$('#newGameBox').classList.contains('hidden'))return;if(k==='A'){const sv=loadSave();if(sv)startGame(sv,false);else openCreator('new')}return}
 if(state==='world'){if(excl>0)return;if(k==='A')interact();else if(k==='MENU')openMenu();else if(k==='MAP')openMap();return}
 if(state==='dialog'){if(k==='A')advDialog();else if(k==='DIR'&&dq&&dq.choice&&dq.shown>=dq.full.length){const n=dq.choice.opts.length;dq.choice.sel=(dq.choice.sel+(v==='up'||v==='left'?n-1:1))%n;renderChoices();SFX.blip()}else if(k==='ANS'&&dq&&dq.choice&&v<dq.choice.opts.length&&dq.shown>=dq.full.length)pickChoice(v);return}
 if(state==='battle'){if(!B)return;
  if(B.phase==='question'&&!B.bag){if(k==='ANS')answer(v);else if(k==='DIR'){const m={left:-1,right:1,up:-2,down:2}[v];let s=B.sel;for(let t=0;t<4;t++){s=(s+m+4)%4;if(!B.removed.has(s))break}B.sel=s;document.querySelectorAll('#qAns .ans').forEach((el,i)=>el.classList.toggle('sel',i===s));SFX.blip()}else if(k==='A')answer(B.sel)}
  else if(k==='A'||k==='B'){if(B.phase==='feedback'||B.phase==='end')cont();else if(B.phase==='intro'||B.phase==='timeout')nextQ();else if(B.bag)renderQ()}
  return}
 if(state==='menu'){if(k==='B'||k==='MENU'||k==='MAP'){if(!$('#ending').classList.contains('hidden'))return;closeMenu()}return}
}

// ---------------- MAIN LOOP ----------------
let acc=0,lastT=0;
function loop(t){requestAnimationFrame(loop);const dt=Math.min(100,t-lastT||16);lastT=t;acc+=dt;
 while(acc>=1000/60){acc-=1000/60;frame++;
  if(state==='world'||state==='dialog'||(state==='menu'&&!B))updateWorld();
  if(state==='world'&&frame%90===0)checkAch();
  if(state==='dialog'&&(frame%1===0))updDialog();
  if(state==='title'){titleT++;player.px=((Math.sin(titleT/900)*.5+.5)*(MW-24)+12)*16;player.py=((Math.cos(titleT/1300)*.5+.5)*(MH-16)+8)*16}
 }
 applyCanvasSize(state==='battle'||!!B);ctx.imageSmoothingEnabled=false;
 if(state==='battle'||(B&&state==='menu')){drawBattle();if(B&&B.phase==='question'&&!B.bag){const el=$('#qTimer');const s=(performance.now()-B.qStart)/1000;if(B.opts.shotclock){const r=B.opts.shotclock-s;if(el){el.textContent=`⏱ ${Math.max(0,Math.ceil(r))}s`;el.style.color=r<4?'#c62828':'#1f6fd6'}if(r<=0)answer(-1)}else if(el){el.textContent=s<7?`⚡ ${Math.ceil(7-s)}s`:''}}}
 else{drawWorld();if(state!=='title')drawCompass()}
 if(state==='daily'&&D&&D.phase==='q'){const r=1-(performance.now()-D.qStart)/1000/DAILY_SECS,el=$('#dTimer');if(el){el.style.width=Math.max(0,r*100)+'%';el.style.background=r>.5?'#3ccf5a':r>.2?'#f0c030':'#e84030'}if(r<=0)dailyAnswer(-1)}
 if(frame%6===0){const t=performance.now();if(B&&B.q&&B.q.pic&&!$('#qPic').classList.contains('hidden'))drawPic($('#qPicC'),B.q.pic,t);if(state==='menu'&&menuTab==='guide'&&!$('#menu').classList.contains('hidden'))document.querySelectorAll('.gpic').forEach(c=>{if(c.dataset.pic.startsWith('sig'))drawPic(c,c.dataset.pic,t)})}
 if(!$('#mapView').classList.contains('hidden'))renderMap();
}

// ---------------- LAYOUT / TOUCH ----------------
const isTouch=('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches;
function fit(){const holder=$('#holder'),g=$('#game');const portrait=innerHeight>innerWidth;const tc=isTouch?(portrait?200:0):0;
 const s=Math.min((innerWidth-8)/640,(innerHeight-tc-8)/416);g.style.transform=`scale(${s})`;holder.style.width=640*s+'px';holder.style.height=416*s+'px';
 document.body.classList.toggle('touch',isTouch);document.body.classList.toggle('portrait',portrait)}
window.addEventListener('resize',fit);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame(true)});
window.addEventListener('pagehide',()=>saveGame(true));
function bindZoom(){
 $('#game').addEventListener('wheel',e=>{if(state!=='world')return;e.preventDefault();const t=performance.now();if(t-zoomT<220)return;zoomT=t;setZoom(e.deltaY>0?1:-1)},{passive:false});
 let pd=0;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
 $('#game').addEventListener('touchstart',e=>{if(e.touches.length===2)pd=dist(e.touches)},{passive:true});
 $('#game').addEventListener('touchmove',e=>{if(e.touches.length!==2||!pd)return;const d=dist(e.touches);if(d/pd>1.3){setZoom(-1);pd=d}else if(d/pd<.77){setZoom(1);pd=d}},{passive:true});
 $('#game').addEventListener('touchend',e=>{if(e.touches.length<2)pd=0},{passive:true});
 $('#btnZin').onclick=()=>setZoom(-1);$('#btnMus').onclick=()=>setMusic(!SETS.music);$('#btnDaily').onclick=()=>openDaily();updMusicBtn();$('#btnFs').onclick=()=>toggleFS();$('#btnZout').onclick=()=>setZoom(1);updZoomBtns()}
function bindTouch(){document.querySelectorAll('[data-d]').forEach(b=>{const d=b.dataset.d;const on=e=>{e.preventDefault();setDir(d,1);if(state!=='world')press('DIR',d)},off=e=>{e.preventDefault();setDir(d,0)};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)});
 const tb=(id,fn)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();fn()});
 tb('#tA',()=>press('A'));tb('#tB',()=>{held.run=1;press('B')});$('#tB').addEventListener('pointerup',()=>held.run=0);tb('#tM',()=>press('MENU'))}

// ---------------- PUBLIC API (for onclick) ----------------
window.G={daily:()=>openDaily(),dailyStart:()=>dailyStart(),dailyAnswer:k=>dailyAnswer(k),dailyNext:()=>dailyNext(),closeDaily:()=>closeDaily(),
 dailyCopy:()=>{const t=$('#dShare');t.select();const ok=()=>toast('📋 Score copied! Paste it to your friends.');try{navigator.clipboard.writeText(t.value).then(ok,()=>{document.execCommand('copy');ok()})}catch(e){try{document.execCommand('copy');ok()}catch(e2){toast('Select the text and copy it')}}},
 dailyShare:()=>{try{navigator.share({text:$('#dShare').value}).catch(()=>{})}catch(e){}},
 music:()=>setMusic(!SETS.music),fs:()=>{toggleFS();setTimeout(updFsBtn,300)},nextQ,answer,cont,useHint,useTimeout,bag,run,back:()=>renderQ(),useItem,equip,pickChoice,closeMenu,openMap,
 tab:t=>{menuTab=t;renderMenu()},save:()=>saveGame(),snd:()=>{S.sound=!S.sound;updHud();renderMenu()},
 cycleDiff:()=>{S.diff={rookie:'pro',pro:'allpro',allpro:'superfan',superfan:'rookie'}[S.diff];renderMenu()},
 reset:()=>{const b=$('#menuBody');b.innerHTML=`<div class="help"><b>Start over?</b> Your current progress will be erased.<br><br><button class="danger" onclick="G.doReset()">Yes, erase and start over</button> <button onclick="G.tab('opt')">Cancel</button></div>`},
 doReset:()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}location.reload()},
 drill:()=>{closeMenu();startBattle(makeEnemy('stego',Math.max(1,S.lv-2),{name:'Film Room Dummy-stego',pal:{B:'#8a8a9a',L:'#d8d8e0',P:'#e8443a',K:'#f4f4f4'},pattern:'spots'}),{practice:true,drill:true,cat:null,diff:[1,3]})},
 shopTab:t=>{shopTab=t;renderShop()},
 exportSave:()=>{saveGame(true);$('#saveIO').innerHTML=`<textarea id="saveCode" readonly rows="3" style="width:100%;font-size:9px">${encodeSave()}</textarea><button onclick="G.copySave()">📋 Copy</button> <small>Paste this into "Import save code" on another device.</small>`;const t=$('#saveCode');t.focus();t.select()},
 copySave:()=>{const t=$('#saveCode');t.select();const ok=()=>toast('📋 Save code copied!');try{navigator.clipboard.writeText(t.value).then(ok,()=>{document.execCommand('copy');ok()})}catch(e){try{document.execCommand('copy');ok()}catch(e2){toast('Select the text and copy it manually')}}},
 importSave:()=>{$('#saveIO').innerHTML=`<textarea id="saveCode" rows="3" style="width:100%;font-size:9px" placeholder="Paste a save code here"></textarea><button onclick="G.doImport()">Load this save</button> <small>This replaces your current progress.</small>`;$('#saveCode').focus()},
 doImport:()=>{const o=decodeSave($('#saveCode').value);if(!o){toast("That save code doesn't look right");return}try{localStorage.setItem(SAVE_KEY,JSON.stringify(o))}catch(e){}closeMenu();if(B)endBattle();startGame(o,false);saveGame(true);toast('📥 Save loaded!')},
 buy:k=>{const c=CONS[k];if(S.coins<c.price)return;S.coins-=c.price;S.st.bought=(S.st.bought||0)+1;S.inv[k]=(S.inv[k]||0)+1;SFX.item();updHud();renderShop()},
 buyGear:k=>{const p=GEAR_PRICE[GEAR[k].r];if(S.coins<p)return;S.coins-=p;S.st.bought=(S.st.bought||0)+1;S.gear.push(k);SFX.item();toast(`Bought ${GEAR[k].name}! Equip it in Menu → Gear.`);updHud();renderShop()},
 sell:i=>{const id=S.gear[i];if(!id)return;S.gear.splice(i,1);S.coins+=Math.round(GEAR_PRICE[GEAR[id].r]/2);SFX.item();updHud();renderShop()},
 newGame:d=>{$('#newGameBox').classList.add('hidden');startGame(newSave(d,CR&&CR.hero),true)},
 editLook:()=>openCreator('edit'),crDone:()=>crDone(),crBack:()=>crBack(),crRandom:()=>crRandom(),crReopen:()=>{$('#newGameBox').classList.add('hidden');openCreator('new',true)},
 cont:cont,
 continueGame:()=>{const sv=loadSave();if(sv)startGame(sv,false)},
 showNew:()=>openCreator('new'),
 endContinue:()=>{$('#ending').classList.add('hidden');state='world';updHud()},
};

// ---------------- BOOT ----------------
function boot(){
 genWorld();buildTiles();buildMisc();
 npcs.forEach(n=>{n.spr=makeCharSprites(n.look);n.px=n.x*16;n.py=n.y*16});
 S=newSave();S.sound=false;bradySpr=makeBradySprites();bradyRed=tint(bradySpr.right[0],'#ff3030');player.px=POIS[0].x*16;player.py=POIS[0].y*16;
 $('#btnMenu').onclick=()=>{if(state==='world')openMenu()};$('#btnMap').onclick=()=>{if(state==='world')openMap()};$('#btnSnd').onclick=()=>{S.sound=!S.sound;updHud()};
 fit();bindTouch();bindZoom();showTitle();requestAnimationFrame(loop);
}
boot();
