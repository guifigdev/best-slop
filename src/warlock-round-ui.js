import {installFloatingWindow} from './floating-window.js';
import {warlockColumnLabel,warlockSkillDetails,bindWarlockSkillTooltips} from './warlock-skill-ui.js';
import {WARLOCK_SKILLS,WARLOCK_ITEMS,WARLOCK_COLUMNS,WARLOCK_MASTERIES,wlSkillPrice,wlMasteryLevel,wlMasteryPrice} from '../shared/warlock-catalog.js';
import {gameIllustration} from './game-illustrations.js';
import {legacyCharacterPortrait} from './legacy-character-art.js';
import {warlockResultsMarkup} from './warlock-results.js';
import {escapeHTML as esc} from './competition-ui.js';
import {patchHTML} from './snapshot-dom.js';

export function warlockRoundScreen(state,owner){
 const w=state?.warlock,unit=state?.units?.find(u=>u.owner===owner&&u.warlockCharacter);
 if(state?.options?.mode!=='warlock'||!w||!unit||state.onlineRoom&&!state.onlineRoom.started)return null;
 return {unit,war:w,final:w.phase==='finished',result:w.phase==='shop'&&!!w.lastResult&&(state.time||0)<(w.resultUntil||0),seconds:Math.max(0,Math.ceil(w.remaining||0))};
}
function skillCard(u,s,shopping,state){
 const rank=u.skillLevels?.[s.key]||0,price=wlSkillPrice(u,s.key),max=u.wlJordanSkill===s.key||u.wlJordanPending?s.maxRingLevel:s.maxLevel,other=u.skills.find(k=>WARLOCK_SKILLS[k]?.column===s.column&&k!==s.key);
 const reason=other?'Coluna já escolhida':rank>=max?'Nível máximo':u.gold<price?'Ouro insuficiente':'';
 return `<button type="button" class="wl-shop-card ${rank?'owned':''}" data-wl-skill-tooltip="${esc(s.key)}" tabindex="0" ${shopping?`data-wl-buy-skill="${esc(s.key)}" ${reason?'aria-disabled="true"':''}`:'aria-disabled="true"'} aria-label="${esc((shopping?(rank?'Melhorar ':'Aprender '):'Consultar ')+s.name)}"><span class="wl-shop-icon">${gameIllustration('warlock','skill',s.key)}</span><span><b>${esc(s.name)}</b><small>${esc(warlockSkillDetails(state,u,s.key)?.description||s.description)}</small><em>${rank?'Nível '+rank+' / '+max:'Nova magia'}</em></span><strong>${shopping?(reason||'◆ '+price):'N'+rank}</strong></button>`;
}
export function warlockShopContents(u,{shopping=true,tab='skills',state=null}={}){
 if(tab==='skills')return `<p class="wl-shop-rule">${shopping?'Escolha uma magia por tecla. Clique na carta para aprender ou melhorar.':'Suas magias equipadas e seus níveis atuais.'}</p>`+WARLOCK_COLUMNS.map(col=>{
  const skills=Object.values(WARLOCK_SKILLS).filter(s=>s.column===col&&(shopping?col!=='F':u.skills.includes(s.key)));
  return skills.length?`<section class="wl-shop-column"><h3><kbd>${col}</kbd><b>${esc(warlockColumnLabel(col))}</b> · ${shopping?(u.skills.some(k=>WARLOCK_SKILLS[k]?.column===col)?'Magia escolhida':'Escolha sua magia'):'Magias equipadas'}</h3><div>${skills.map(s=>skillCard(u,s,shopping,state)).join('')}</div></section>`:'';
 }).join('');
 const items=shopping?Object.values(WARLOCK_ITEMS):u.inventory.map(i=>WARLOCK_ITEMS[i.key]).filter(Boolean);
 let html='<div class="wl-item-grid">'+items.map(d=>{const rank=u.inventory.find(i=>i.key===d.key)?.level||0,reason=rank>=d.maxLevel?'Máximo':!rank&&u.inventory.length>=u.inventorySlots?'Mochila cheia':u.gold<d.cost?'Ouro insuficiente':'';return `<button class="wl-shop-card ${rank?'owned':''}" ${shopping?`data-wl-buy-item="${esc(d.key)}" ${reason?'disabled':''}`:'disabled'}><span class="wl-shop-icon">${gameIllustration('warlock','item',d.key)}</span><span><b>${esc(d.name)}</b><small>${esc(d.description)}</small><em>${rank?'Nível '+rank:'Não equipado'}</em></span><strong>${shopping?(reason||'◆ '+d.cost):'N'+rank}</strong></button>`;}).join('')+'</div>';
 if(!shopping)return items.length?html:'<p>Sua mochila está vazia.</p>'; 
 if(u.inventorySlots<6)html+=`<button data-wl-expand ${u.gold<2?'disabled':''}>Ampliar mochila para 6 espaços · ◆ 2</button>`;
 html+='<h3 class="wl-research-heading">Melhorias do mago</h3><div class="wl-item-grid">'+Object.entries(WARLOCK_MASTERIES).map(([key,d])=>{const rank=wlMasteryLevel(u,key),price=wlMasteryPrice(u,key);return `<button class="wl-shop-card" data-wl-mastery="${key}" ${!Number.isFinite(price)||u.gold<price?'disabled':''}><span class="wl-shop-icon">${gameIllustration('warlock','mastery',key)}</span><span><b>${esc(d.name)}</b><small>${esc(d.description)}</small><em>Nível ${rank} / ${d.maxLevel}</em></span><strong>${Number.isFinite(price)?'◆ '+price:'Máximo'}</strong></button>`;}).join('')+'</div>';
 return html;
}
export function warlockRoundResultMarkup(w,owner){
 const result=w.lastResult,winner=result?.winner;if(!result)return '';
 return `<div class="wl-result-confetti" aria-hidden="true">${Array.from({length:16},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><small>ROUND ${result.round} CONCLUÍDO</small>${winner?`<span class="wl-winner-portrait">${legacyCharacterPortrait('warlock',winner.character)}</span><h2>${winner.owner===owner?'Você venceu!':esc(winner.name)+' venceu!'}</h2>`:'<h2>Empate!</h2>'}<p>A loja abre em <b data-wl-result-seconds>3</b>s</p>`;
}

export function createWarlockRoundUI({getState,getOwner,send,view,onEnd,doc=globalThis.document}={}){
 let dialog=null,notice=null,dock=null,autoRound=null,resultKey=null,signature='',tab='skills',finalShown=false,windowDrag=null,tooltips=null;
 function close(){tooltips?.hide();if(dialog?.open)dialog.close();}
 function ensure(){if(dialog)return;
  dialog=doc.createElement('dialog');dialog.className='warlock-round-shop';dialog.setAttribute('aria-modal','false');dialog.setAttribute('aria-label','Loja do Warlock');doc.body.append(dialog);
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}});
  tooltips=bindWarlockSkillTooltips(dialog,{getState,getUnit:()=>warlockRoundScreen(getState(),getOwner())?.unit});
  notice=doc.createElement('section');notice.className='wl-round-result';notice.setAttribute('role','status');notice.setAttribute('aria-live','assertive');notice.hidden=true;doc.body.append(notice);
  dock=doc.createElement('nav');dock.className='wl-shop-dock';dock.setAttribute('aria-label','Preparação do próximo round');dock.innerHTML='<button data-wl-open>Loja · <b data-wl-seconds>30</b>s</button><button data-wl-ready>Pronto para lutar</button>';dock.hidden=true;doc.body.append(dock);dock.querySelector('[data-wl-open]').onclick=()=>open('skills');dock.querySelector('[data-wl-ready]').onclick=()=>send({type:'wlReady'});
 }
 function open(page='skills'){const screen=warlockRoundScreen(getState(),getOwner());if(!screen||screen.result)return false;ensure();tab=page==='inventory'||page==='items'?'items':'skills';signature='';paint(screen);if(!dialog.open)dialog.show();windowDrag?.refresh();return true;}
 function paint(screen){const {unit:u,war:w,final}=screen,shopping=w.phase==='shop',sig=JSON.stringify([final,shopping,w.round,tab,u.gold,u.ready,u.skills,u.skillLevels,u.inventory,u.inventorySlots,u.masteries,u.wlJordanSkill,u.wlJordanPending]);if(sig===signature)return;signature=sig;
  const html=final?`<header class="wl-shop-header"><small>WARLOCK · CAMPEÃO DA PARTIDA</small><button data-wl-close aria-label="Fechar resultado">×</button></header>${warlockResultsMarkup(getState(),getOwner())}`:`<header class="wl-shop-header"><div><small>${shopping?'PREPARAÇÃO · ROUND '+(w.round+1):'SEU PERSONAGEM'}</small><h2>${shopping?'Loja de feitiços':tab==='items'?'Sua mochila':'Seu grimório'}</h2></div><span class="wl-shop-gold">◆ ${u.gold}<small>OURO DISPONÍVEL</small></span><button data-wl-close aria-label="Voltar à arena">×</button></header>${shopping?'<p class="wl-shop-countdown">O próximo round começa em <b data-wl-seconds>30</b>s, ou quando todos estiverem prontos.</p><nav class="wl-shop-tabs" aria-label="Produtos da loja"><button data-wl-tab="skills" aria-pressed="'+(tab==='skills')+'">Feitiços</button><button data-wl-tab="items" aria-pressed="'+(tab==='items')+'">Equipamentos e melhorias</button></nav>':''}<div class="wl-shop-stock">${warlockShopContents(u,{shopping,tab,state:getState()})}</div><footer><span>${shopping?'As compras ficam com você nos próximos rounds.':'Suas magias usam as teclas indicadas na barra.'}</span>${shopping?`<button class="primary" data-wl-ready ${u.ready?'disabled':''}>${u.ready?'Pronto · aguardando':'Pronto para lutar →'}</button>`:'<button data-wl-close>Voltar à arena</button>'}</footer>`;
  patchHTML(dialog,html,['data-wl-skill-tooltip','data-wl-buy-skill','data-wl-buy-item','data-wl-mastery','data-wl-tab','data-wl-ready','data-wl-close']);
  for(const b of dialog.querySelectorAll('[data-wl-close]'))b.onclick=close;
  for(const b of dialog.querySelectorAll('[data-wl-tab]'))b.onclick=()=>{tab=b.dataset.wlTab;signature='';paint(screen);};
  for(const b of dialog.querySelectorAll('[data-wl-buy-skill]'))b.onclick=()=>{if(b.getAttribute('aria-disabled')!=='true')send({type:'wlBuy',skill:b.dataset.wlBuySkill});};
  for(const b of dialog.querySelectorAll('[data-wl-buy-item]'))b.onclick=()=>send({type:'wlBuy',item:b.dataset.wlBuyItem});
  for(const b of dialog.querySelectorAll('[data-wl-mastery]'))b.onclick=()=>send({type:'wlBuy',mastery:b.dataset.wlMastery});
  for(const b of dialog.querySelectorAll('[data-wl-ready]'))b.onclick=()=>send({type:'wlReady'});
  const expand=dialog.querySelector('[data-wl-expand]');if(expand)expand.onclick=()=>send({type:'wlBuy',upgrade:'inventory'});
  windowDrag?.destroy();windowDrag=installFloatingWindow(doc,doc.defaultView,{element:dialog,handle:dialog.querySelector('.wl-shop-header'),getScope:()=> 'warlock:'+tab,getUserId:getOwner,isOpen:()=>dialog.open});windowDrag.refresh();
  if(final){const button=dialog.querySelector('.warlock-final-ranking')?.parentElement?.querySelector('.primary');if(button)button.onclick=onEnd;}
 }
 return {open,close,render(){const state=getState(),screen=warlockRoundScreen(state,getOwner());if(!screen){close();if(dock)dock.hidden=true;if(notice)notice.hidden=true;return;}ensure();const {war:w}=screen;
  notice.hidden=!screen.result;dock.hidden=w.phase!=='shop'||screen.result;
  if(screen.result){close();const key=w.lastResult.round+':'+w.lastResult.at;if(key!==resultKey){resultKey=key;notice.innerHTML=warlockRoundResultMarkup(w,getOwner());const winner=state.units.find(u=>u.owner===w.lastResult.winner?.owner);if(winner)view?.focusPoint?.({...winner,distance:15});}notice.querySelector('[data-wl-result-seconds]').textContent=Math.max(0,Math.ceil(w.resultUntil-state.time));return;}
  if(screen.final&&!finalShown){finalShown=true;const winner=state.units.find(u=>state.winningOwners?.includes(u.owner));if(winner)view?.focusPoint?.({...winner,distance:15});open();}
  else if(w.phase==='shop'&&autoRound!==w.round){autoRound=w.round;open();}
  else if(w.phase==='battle'&&dialog.open&&dialog.dataset.wlPhase==='shop')close();
  if(dialog.open){paint(screen);tooltips?.update();dialog.dataset.wlPhase=w.phase;}for(const el of [...dialog.querySelectorAll('[data-wl-seconds]'),...dock.querySelectorAll('[data-wl-seconds]')])el.textContent=screen.seconds;
  const ready=dock.querySelector('[data-wl-ready]');ready.disabled=!!screen.unit.ready;ready.textContent=screen.unit.ready?'Pronto · aguardando':'Pronto para lutar';
 },reset(){close();windowDrag?.destroy();windowDrag=null;tooltips?.destroy();tooltips=null;dialog?.remove();notice?.remove();dock?.remove();dialog=notice=dock=null;autoRound=resultKey=null;signature='';tab='skills';finalShown=false;}};
}
