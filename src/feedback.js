const LABELS={learn:'NOVA TÉCNICA',upgrade:'TÉCNICA EVOLUÍDA',item:'EQUIPAMENTO ADQUIRIDO',equipment:'EQUIPAMENTO EVOLUÍDO',enchant:'ARMA ENCANTADA',activate:'ITEM ATIVADO',gold:'OURO RECEBIDO',essence:'ESSÊNCIA RECUPERADA',level:'NÍVEL ALCANÇADO',attribute:'ATRIBUTO EVOLUÍDO',error:'AÇÃO NÃO CONCLUÍDA'};
const SYMBOLS={learn:'✦',upgrade:'↑',item:'◆',equipment:'↑',enchant:'✧',activate:'✧',gold:'◆',essence:'◈',level:'✧',attribute:'+',error:'!'};

/** Presentation only. Call after an authoritative command/snapshot confirms a change. */
export function createFeedback({host=document.body,schedule=setTimeout,cancel=clearTimeout}={}){
 const root=document.createElement('div');root.className='game-feedback';root.setAttribute('aria-hidden','true');host.append(root);
 if(host===document.body)root.classList.add('game-feedback-fixed');
 const live=document.createElement('div');live.className='feedback-announcer';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');host.append(live);
 const timers=new Set(),cards=[],reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 let gold=0,goldTimer=null,goldDelta=null,goldShown=0,goldHideTimer=null,destroyed=false,lastAttribute=0;
 function later(fn,ms){const id=schedule(()=>{timers.delete(id);if(!destroyed)fn();},ms);timers.add(id);return id;}
 function removeCard(card){const i=cards.indexOf(card);if(i>=0)cards.splice(i,1);card.remove();}
 function pulse(element,kind){if(!element)return;element.classList.remove('feedback-flash','feedback-gold-flash');void element.offsetWidth;element.classList.add(kind==='gold'?'feedback-gold-flash':'feedback-flash');later(()=>element.classList.remove('feedback-flash','feedback-gold-flash'),800);}
 function announce(text){live.textContent='';later(()=>{live.textContent=text;},35);}
 function particles(card,kind){if(reduced||kind==='error')return;const field=document.createElement('span');field.className='feedback-spark-field';for(let i=0;i<6;i++){const p=document.createElement('i');p.style.setProperty('--dx',`${(i-2.5)*18}px`);p.style.setProperty('--dy',`${-22-(i%3)*10}px`);p.style.setProperty('--delay',`${i*.025}s`);field.append(p);}card.append(field);}
 function show(event){
  const {kind='learn',title='',detail='',icon='',amount}=event;
  if(cards.length>=3)removeCard(cards[0]);
  const card=document.createElement('div');card.className=`feedback-card feedback-${kind}`;card.style.setProperty('--feedback-life',kind==='gold'?'1800ms':'3400ms');
  const picture=document.createElement('span');picture.className='feedback-picture';
  // `icon` is the renderer's own SVG string, never player-supplied HTML.
  if(typeof icon==='string'&&icon.trimStart().startsWith('<svg'))picture.innerHTML=icon;else picture.textContent=SYMBOLS[kind]||'✦';
  const body=document.createElement('div');body.className='feedback-body';const label=document.createElement('small');label.textContent=LABELS[kind]||LABELS.learn;const heading=document.createElement('strong');heading.textContent=title||(kind==='gold'?`+${Math.round(amount||0)} ouro`:'');body.append(label,heading);
  if(detail){const line=document.createElement('span');line.textContent=detail;body.append(line);}
  const check=document.createElement('span');check.className='feedback-check';check.textContent=kind==='error'?'!':'✓';const progress=document.createElement('i');progress.className='feedback-life';card.append(picture,body,check,progress);particles(card,kind);root.append(card);cards.push(card);
  if(kind!=='gold')announce([title,detail].filter(Boolean).join('. '));
  later(()=>{card.classList.add('feedback-leaving');later(()=>removeCard(card),220);},kind==='gold'?1800:3400);
 }
 function showGold(){
  goldTimer=null;const amount=Math.round(gold);gold=0;if(amount<=0)return;
  // Income and kill bounties never enter the large notification stack, never
  // displace an upgrade card and never announce each coin to a screen reader.
  const wallet=document.querySelector('.wallet strong')||document.querySelector('[data-gold-feedback]')||document.getElementById('gold')?.parentElement;if(!wallet)return;
  pulse(wallet,'gold');
  if(!goldDelta||goldDelta.parentElement!==wallet){goldDelta?.remove();goldShown=0;goldDelta=document.createElement('span');goldDelta.className='wallet-delta';goldDelta.setAttribute('aria-hidden','true');wallet.append(goldDelta);}
  goldShown+=amount;goldDelta.textContent='+'+goldShown.toLocaleString('pt-BR');
  // Keep one compact, bounded display window instead of restarting a floating
  // animation every time another small bounty arrives.
  if(!goldHideTimer)goldHideTimer=later(()=>{goldHideTimer=null;goldDelta?.remove();goldDelta=null;goldShown=0;},1600);
 }
 function play(event={}){
  if(destroyed)return;const kind=Object.hasOwn(LABELS,event.kind)?event.kind:'learn';
  if(kind==='gold'){if(!Number.isFinite(event.amount)||event.amount<=0)return;gold+=event.amount;if(!goldTimer)goldTimer=later(showGold,600);return;}
  if(kind==='attribute'){const now=Date.now();pulse(document.querySelector('.attribute-title'));if(now-lastAttribute<350)return;lastAttribute=now;}
  show({...event,kind});
  if(event.key){const button=[...document.querySelectorAll('[data-buy]')].find(b=>b.dataset.buy===event.key);pulse(button);}
  if(kind==='learn'||kind==='upgrade'){pulse(document.getElementById('abilities'));pulse(document.getElementById('slots'));}
  if(kind==='equipment')pulse(document.getElementById('inventory'));if(kind==='item')pulse(document.getElementById('inventory'));if(kind==='level')pulse(document.getElementById('level'));
 }
 function pointerFeedback(event){if(reduced||event.button!==0)return;const button=event.target.closest?.('.shop-item:not(:disabled),.attribute-row button:not(:disabled),.inventory-slot:not(:disabled),.ability:not(:disabled),.primary:not(:disabled)');if(!button)return;const rect=button.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='feedback-ripple';ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;button.append(ripple);later(()=>ripple.remove(),550);}
 document.addEventListener('pointerdown',pointerFeedback);
 return{play,destroy(){destroyed=true;for(const id of timers)cancel(id);timers.clear();document.removeEventListener('pointerdown',pointerFeedback);root.remove();live.remove();goldDelta?.remove();goldDelta=null;for(const el of document.querySelectorAll('.feedback-flash,.feedback-gold-flash'))el.classList.remove('feedback-flash','feedback-gold-flash');for(const el of document.querySelectorAll('.wallet-delta,.feedback-ripple'))el.remove();}};
}
