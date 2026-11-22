import {ITEMS,levelOf} from '../shared/catalog.js';
import {escapeHTML as esc} from './competition-ui.js';
const modes=['campaign','tower','best','war'],key='customhero.first-shop-tour.v1';
export function shopCountdown(state){
 if(!state||!modes.includes(state.options?.mode)||state.phase!=='preparation')return null;
 if(state.onlineRoom&&!state.onlineRoom.started)return{lobby:true,label:'SALA EM PREPARAÇÃO',text:'O host inicia quando o grupo estiver pronto',urgent:false};
 const seconds=Math.max(0,Math.ceil(state.timer||0));return{label:'LOJA ABERTA',seconds,text:Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'),urgent:seconds<=10};
}
export function firstShopStep(state,u){
 if(!u||!modes.includes(state?.options?.mode)||state.phase!=='preparation'||state.wave>0||state.onlineRoom?.players?.find(p=>p.id===u.owner)?.heroChosen===false)return null;
 const equipment=u.inventory?.some(s=>s&&!ITEMS[s.key]?.consumable),book=u.inventory?.findIndex(s=>s?.key==='xpbook'),ranks=(u.skills||[]).reduce((n,k)=>n+levelOf(u,k),0);
 if(!equipment)return{index:0,title:'Seu primeiro equipamento',text:'Brokkr vende equipamentos. Eles entram na mochila e seus bônus já ficam ativos.',action:'Ir até Brokkr',npc:'equipment',item:['mage','owl'].includes(u.hero)?'staff':u.hero==='ranger'?'bow':u.hero==='turtle'?'armor':'blade'};
 if(u.level<=1&&book>=0)return{index:2,title:'Leia o tomo de experiência',text:'A Tabuleta do Aprendiz concede 80 XP. Use-a para chegar ao nível 2 e ganhar um ponto de habilidade.',action:'Usar o tomo agora',slot:book};
 if(u.level<=1)return{index:1,title:'Um tomo para evoluir',text:'Visite Hugin e compre a Tabuleta do Aprendiz. Ela custa 350 de ouro e concede 80 XP.',action:'Ir até Hugin',npc:'books',item:'xpbook'};
 if(ranks<=1)return{index:3,title:'Melhore sua habilidade',text:'Você subiu de nível! Use o botão + acima da habilidade ou aprenda outra técnica na aba Técnicas.',action:'Mostrar minha habilidade',skill:u.skills?.[0]};
 return{index:4,title:'Você está pronto',text:'Equipamento comprado e primeira habilidade evoluída. Prepare sua build e entre na próxima prova.',action:'Concluir guia',done:true};
}
export function createShopGuide({root,getState,getUnit,onRoute,onUse,onSkill,onStepChange=()=>{},storage=globalThis.localStorage}){
 let timer=null,tour=null,closed=false,last='',highlight=null,disposed=false;
 try{closed=storage?.getItem(key)==='done';}catch{}
 function clearHighlight(){highlight?.classList.remove('shop-tutorial-target');highlight=null;}
 return{update(){if(disposed)return;const state=getState(),count=shopCountdown(state);if(!timer){timer=document.createElement('section');timer.className='shop-countdown';timer.setAttribute('aria-label','Tempo da loja');timer.setAttribute('aria-live','off');root.append(timer);}const shopModal=document.querySelector('#overlay-modal[data-npc] .modal'),timerHost=shopModal||root;if(timer.parentElement!==timerHost)timerHost.prepend(timer);timer.classList.toggle('in-shop',!!shopModal);timer.hidden=!count;if(count){timer.classList.toggle('urgent',count.urgent);timer.classList.toggle('lobby',!!count.lobby);const value=JSON.stringify(count);if(timer.dataset.value!==value){timer.dataset.value=value;timer.innerHTML=`<small>${esc(count.label)}</small><strong>${esc(count.text)}</strong>${count.lobby?'':`<span>${count.urgent?'A próxima prova vai começar!':'Compre, evolua e prepare sua build'}</span>`}`;}}
  const step=!closed?firstShopStep(state,getUnit()):null;if(!step){tour?.remove();tour=null;last='';clearHighlight();return;}
  if(!tour){tour=document.createElement('aside');tour.className='first-shop-tour';tour.setAttribute('aria-label','Primeiros passos na loja');root.append(tour);}
  const signature=JSON.stringify(step);if(last!==signature){if(last)onStepChange(step);last=signature;tour.innerHTML=`<header><small>PRIMEIROS PASSOS · ${Math.min(4,step.index+1)} / 4</small><button type="button" data-tour-close aria-label="Fechar guia da loja">×</button></header><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p><button type="button" data-tour-action>${esc(step.action)} →</button><small>Você pode fechar este guia e jogar normalmente.</small>`;
   tour.querySelector('[data-tour-close]').onclick=()=>{closed=true;tour.remove();tour=null;clearHighlight();};
   tour.querySelector('[data-tour-action]').onclick=()=>{if(step.done){closed=true;try{storage?.setItem(key,'done');}catch{}tour.remove();tour=null;clearHighlight();}else if(step.npc)onRoute(step.npc);else if(Number.isInteger(step.slot))onUse(step.slot);else if(step.skill)onSkill(step.skill);};
  }
  const tourHost=document.querySelector('#overlay-modal[data-npc] .modal')||root;if(tour.parentElement!==tourHost){if(tourHost===root)root.append(tour);else tourHost.insertBefore(tour,tourHost.querySelector('h2')?.nextSibling||null);}tour.classList.toggle('in-shop',tourHost!==root);tour.querySelector('[data-tour-action]').hidden=!!(step.npc&&getUnit()?.shopInteraction===step.npc);
  const target=step.item?document.querySelector(`[data-npc-buy="${step.item}"]`):step.skill?document.querySelector(`[data-skill-upgrade="${step.skill}"]`):null;if(target!==highlight){clearHighlight();highlight=target;highlight?.classList.add('shop-tutorial-target');}
 },restart(){closed=false;last='';},reset(){clearHighlight();tour?.remove();tour=null;last='';if(timer)timer.hidden=true;},destroy(){disposed=true;clearHighlight();timer?.remove();tour?.remove();}};
}
