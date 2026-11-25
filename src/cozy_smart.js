// ===================== SMART COACH (adaptive questions) =====================
// Tracks a skill level (1-4) per category and picks question difficulty so the player gets about 70-75% right.
// Leans toward weak categories some of the time, and brings missed questions back on a schedule
// (a few questions later, the next day, a few days later) until they stick.
// Off switch in Options. Legend/Superfan-only fights, picture plays, duels and the Daily Challenge are unchanged.
const CZ_SK_START={rookie:1.4,pro:2.0,allpro:2.6,superfan:3.2};
const CZ_SK_NAMES=[[1.6,'Rookie'],[2.3,'Starter'],[3.0,'Pro'],[3.6,'All-Pro'],[9,'Superfan']];
let czSmartLast=null;
function czSmartOn(){return!!S&&S.smart!==false}
function czSkills(){if(S.sk)return S.sk;const b=CZ_SK_START[S.diff]||2,sk={};
 for(const k of Object.keys(CATS)){const c=S.st.cat[k];let v=b;if(c&&c[0]>=10)v+=(c[1]/c[0]-.7)*2;sk[k]=Math.max(1,Math.min(4,v))}return S.sk=sk}
function czSkName(v){for(const[t,n]of CZ_SK_NAMES)if(v<t)return n;return'Superfan'}
function czExpect(sk,d){return 1/(1+Math.exp((d-sk)*1.6))}
function czRvDue(id){const r=S.rv&&S.rv[id];return!!r&&S.st.ans>=r.a&&Date.now()>=r.t}
function czWeakCat(){const sk=czSkills(),ks=Object.keys(CATS);let tot=0;const w=ks.map(k=>{const v=Math.pow(4.3-sk[k],2);tot+=v;return v});let r=R()*tot;for(let i=0;i<ks.length;i++){r-=w[i];if(r<=0)return ks[i]}return ks[0]}
function czWeakest(n){const sk=czSkills();return Object.keys(CATS).sort((a,b)=>sk[a]-sk[b]).slice(0,n)}

pickQuestion=(orig=>function(cat,dmin,dmax,preferMissed){
 czSmartLast=null;if(!czSmartOn()||dmin>=4||preferMissed)return orig.apply(this,arguments);
 const sk=czSkills();let why=null;
 // lean toward weak spots: when the place doesn't set a category, 40% of questions come from the weaker ones
 if(!cat&&R()<.4){cat=czWeakCat();why='focus'}
 // a missed question that's due for another look comes first, about a third of the time
 const allowHi=S.diff==='rookie'?3:4;
 if(S.rv&&R()<.2){const due=Object.keys(S.rv).filter(id=>czRvDue(id)).map(Number).map(id=>QB[id]).filter(q=>q&&(!cat||q.cat===cat)&&q.d<=allowHi&&!recent.includes(q.id));
  if(due.length){const q=pick(due);recent.push(q.id);if(recent.length>15)recent.shift();czSmartLast={id:q.id,why:'review'};return q}}
 const c=cat||pick(Object.keys(CATS)),s=sk[c]||2;
 // aim for ~72% right: a bit below the player's level, with some spread
 const lo=Math.max(1,(dmin||1)-1),hi=Math.min(allowHi,(dmax||3)+1,s>=3.2?4:3);
 const tgt=Math.max(lo,Math.min(hi,Math.round(s-.75+(R()-.5)*1.2)));
 let P=null;for(const wide of[0,1,2]){const pool=QB.filter(q=>(!cat||q.cat===cat)&&!q.pic&&Math.abs(q.d-tgt)<=wide&&q.d>=lo&&q.d<=hi&&!recent.includes(q.id));if(pool.length>=3){P=pool;break}}
 if(!P)return orig.apply(this,[cat,dmin,dmax,preferMissed]);
 const fresh=P.filter(q=>!S.seen[q.id]);const q=pick(fresh.length&&R()<.8?fresh:P);
 recent.push(q.id);if(recent.length>15)recent.shift();czSmartLast={id:q.id,why};return q})(pickQuestion);

recordAnswer=(orig=>function(q,ok){const r=orig.apply(this,arguments);if(!S||!q||q.pic)return r;
 if(czSmartOn()){const sk=czSkills(),k=q.cat;if(sk[k]!=null){const d=Math.min(4,q.d);sk[k]=Math.max(1,Math.min(4.3,sk[k]+.14*((ok?1:0)-czExpect(sk[k],d))))}}
 // spaced review: wrong -> back in ~8 questions; right when due -> next day -> 3 days later -> mastered
 S.rv=S.rv||{};const id=q.id,rv=S.rv[id];
 if(!ok)S.rv[id]={s:0,a:S.st.ans+8,t:0};
 else if(rv&&czRvDue(id)){const s=rv.s+1;if(s>=3){delete S.rv[id];S.st.locked=(S.st.locked||0)+1}else S.rv[id]={s,a:S.st.ans+20,t:Date.now()+(s===1?20:72)*3600e3}}
 return r})(recordAnswer);

// a small tag on the question so the player knows why it came up
renderQ=(orig=>function(){const r=orig.apply(this,arguments);if(B&&B.q&&czSmartLast&&czSmartLast.id===B.q.id&&czSmartLast.why){const h=$('#qHead');if(h&&!h.querySelector('.czwhy')){const t=document.createElement('span');t.className='czwhy';
 t.textContent=czSmartLast.why==='review'?'🔁 Review':'🎯 Focus area';t.title=czSmartLast.why==='review'?'You missed this one before. Let\'s lock it in!':'The coach is drilling one of your weaker areas.';h.appendChild(t)}}return r})(renderQ);

// Film Room: the coach's read on you; Options: on/off
renderMenu=(orig=>function(){orig.apply(this,arguments);const mb=$('#menuBody');if(!mb||!S)return;
 if(menuTab==='film'&&czSmartOn()){const sk=czSkills(),weak=czWeakest(2),due=S.rv?Object.keys(S.rv).length:0;const d=document.createElement('div');d.className='czplay';
  d.innerHTML=`<h4>🧠 Smart Coach's playbook</h4><p><small>Questions adjust to you, so you get most of them right but still learn something new. Your level in each area:</small></p><div class="czsk">`+
   Object.keys(CATS).map(k=>`<div><span>${CATS[k].name}</span><div class="bar"><i style="width:${Math.round((sk[k]-1)/3.3*100)}%;background:${CATS[k].c}"></i></div><b>${czSkName(sk[k])}</b></div>`).join('')+
   `</div><p>🎯 <b>Working on:</b> ${weak.map(k=>CATS[k].name).join(' and ')} · 🔁 <b>${due}</b> question${due===1?'':'s'} coming back for review${S.st.locked?` · 🔒 <b>${S.st.locked}</b> locked in`:''}</p>`;
  mb.insertBefore(d,mb.firstChild)}
 if(menuTab==='opt'&&!$('#czSmartOpt')){const d=document.createElement('div');d.id='czSmartOpt';d.className='help';d.style.marginTop='8px';
  d.innerHTML=`🧠 <b>Smart Coach</b>: ${czSmartOn()?'On':'Off'} <button onclick="S.smart=${czSmartOn()?'false':'true'};renderMenu()">${czSmartOn()?'Turn off':'Turn on'}</button><br><small>${czSmartOn()?'Questions adjust to how you\'re doing, lean into your weaker areas, and bring back missed questions until they stick. Your difficulty setting is where it starts.':'Questions follow your difficulty setting only.'}</small>`;mb.appendChild(d)}})(renderMenu);
(()=>{const st=document.createElement('style');st.textContent=`.czwhy{margin-left:auto;font-size:11px;background:#fff6d6;color:#2a1a12;border:2px solid #2a1a12;border-radius:6px;padding:0 5px}
.czplay{background:#fff6d6;border:2px solid #2a1a12;border-radius:8px;padding:6px 10px;margin-bottom:10px}.czplay h4{margin:2px 0}.czplay p{margin:4px 0}
.czsk>div{display:grid;grid-template-columns:150px 1fr 70px;gap:6px;align-items:center;font-size:12px;margin:2px 0}.czsk .bar{height:8px;background:#e8dcc0;border-radius:4px;overflow:hidden}.czsk .bar i{display:block;height:100%}`;document.head.appendChild(st)})();
