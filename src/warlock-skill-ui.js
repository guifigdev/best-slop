import {WARLOCK_SKILLS,WARLOCK_COLUMNS,wlSkillAt,wlSkillPrice} from '../shared/warlock-catalog.js';
import {warlockLinkAction} from '../shared/warlock-behavior.js';
import {gameIllustration} from './game-illustrations.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number(value.toFixed(2)).toLocaleString('pt-BR');
const definition=key=>typeof key==='string'&&Object.hasOwn(WARLOCK_SKILLS,key)?WARLOCK_SKILLS[key]:null;
// Functional descriptions of this game's groups; the native identifiers are
// the keyboard columns themselves, rather than invented original categories.
export const WARLOCK_COLUMN_LABELS=Object.freeze({G:'Bola de fogo',D:'Projéteis',R:'Mobilidade',T:'Suporte e projéteis',E:'Área e ofensiva',C:'Defesa e evasão',Y:'Controle',F:'Magia pessoal'});
export const warlockColumnLabel=column=>WARLOCK_COLUMN_LABELS[column]||column;

export function warlockSkillPurchase(state,unit,key){
 const skill=definition(key);if(!skill||!unit)return {enabled:false,reason:'Magia indisponível.',price:Infinity,rank:0,max:0};
 const rank=Math.max(0,unit.skillLevels?.[key]||0),price=wlSkillPrice(unit,key),max=unit.wlJordanSkill===key||unit.wlJordanPending?skill.maxRingLevel:skill.maxLevel;
 const other=(unit.skills||[]).find(k=>k!==key&&definition(k)?.column===skill.column);
 const reason=skill.column==='F'?'Magia pessoal: evolui com equipamento.':other?'A coluna '+skill.column+' já tem '+definition(other).name+'.':rank>=max?'Nível máximo alcançado.':state?.warlock?.phase!=='shop'?'Melhore entre rodadas, durante as compras.':!Number.isFinite(price)?'Melhoria indisponível.':(unit.gold||0)<price?'Faltam '+number(price-(unit.gold||0))+' de ouro.':'';
 return {enabled:!reason,reason:reason||((rank?'Melhorar':'Aprender')+' por '+number(price)+' de ouro.'),price,rank,max};
}

const rowFields=[['cooldown','Recarga','s'],['range','Alcance','m'],['radius','Raio','m'],['duration','Duração','s'],['missiles','Projéteis',''],['selfDamage','Dano em si',''],['slow','Lentidão','%'],['wallLength','Comprimento da parede','m'],['wallThickness','Espessura da parede','m'],['blastRadius','Raio da explosão','m'],['splashMultiplier','Dano máximo da explosão','%'],['pullRadius','Raio de atração','m'],['damageRadius','Raio de dano','m'],['flightDuration','Tempo de voo','s']];
const durationLabels={fireWall:'Duração da parede',iceWall:'Duração da parede',frostBolt:'Duração da lentidão',meteor:'Aviso antes do impacto',gravity:'Tempo de voo',control:'Tempo de voo',link:null,drain:'Duração da alteração de velocidade',disable:'Duração da prisão',windwalk:'Duração',shield:'Duração do escudo',rush:'Duração',timeshift:'Tempo para retornar',mirror:'Duração das imagens',repeater:'Duração do repetidor',vector:'Duração do vetor',dome:'Duração do domo'};
// Catalog factories share structural defaults across walls and Frost Bolt.
// A finite number alone does not make a stat part of that spell's mechanics.
function statLabel(skill,field,label){
 const family=skill.family,wall=family==='fireWall'||family==='iceWall';
 if(field==='wallLength'||field==='wallThickness')return wall?label:null;
 if(field==='slow')return family==='frostBolt'?label:null;
 if(field==='duration')return durationLabels[family]||null;
 if(field==='radius'&&wall)return null; // Walls use length/thickness, not a circle.
 if(field==='blastRadius'||field==='splashMultiplier')return family==='fireball'?label:null;
 if(field==='pullRadius'||field==='damageRadius')return family==='gravity'?label:null;
 if(field==='flightDuration')return family==='link'?label:null;
 return label;
}
const valueText=(value,suffix)=>Number.isFinite(value)?(suffix==='%'?number(value*100)+'%':number(value)+(suffix?' '+suffix:'')):'—';
export function warlockSkillDetails(state,unit,key){
 const skill=definition(key);if(!skill||!unit)return null;
 const purchase=warlockSkillPurchase(state,unit,key),rank=purchase.rank,current=rank?wlSkillAt(key,rank):null,next=skill.column!=='F'&&rank<purchase.max?wlSkillAt(key,rank+1):null,rows=[];
 const damage=s=>s&&Number.isFinite(s.damage)?number(s.damage)+(s.damageMax>s.damage?'–'+number(s.damageMax):''):'—';
 if(current?.damage>0||next?.damage>0)rows.push({label:'Dano base',current:damage(current),next:next?damage(next):null});
 for(const [field,baseLabel,suffix]of rowFields){
  const label=statLabel(skill,field,baseLabel);if(!label)continue;
  if(field==='range'&&skill.target==='self'||field==='missiles'&&Math.max(current?.[field]||0,next?.[field]||0)<=1)continue;
  if(!(current?.[field]>0||next?.[field]>0))continue;
  rows.push({label,current:valueText(current?.[field],suffix),next:next?valueText(next[field],suffix):null});
 }
 const cooldown=Math.max(0,unit.cooldowns?.[key]||0),link=key==='S019'?warlockLinkAction(state,unit):null;
 const status=!rank?'Ainda não aprendida.':state?.warlock?.phase!=='battle'?'Disponível quando o próximo round começar.':unit.alive===false?'Você volta no próximo round.':link?({recall:'Y recolhe o gancho.',cancel:'Y cancela o gancho.',release:'Y solta o vínculo.'}[link]||'Y solta o vínculo.'):cooldown?'Em recarga: '+number(cooldown)+' s.':'Pronta para conjurar.';
 const displayed=current||next||skill,description=skill.family==='frostBolt'?`Dispara uma lança de gelo que causa dano e aplica ${number(displayed.slow*100)}% de lentidão por ${number(displayed.duration)} s.`:displayed.description;
 return {key,name:skill.name,description,column:skill.column,category:warlockColumnLabel(skill.column),rank,max:Math.max(purchase.max,rank),nextRank:next?.level||null,rows,status,purchase};
}

export function warlockSkillTooltipMarkup(state,unit,key){
 const d=warlockSkillDetails(state,unit,key);if(!d)return '';
 return `<header><span>${gameIllustration('warlock','skill',key)}</span><div><small><kbd>${esc(d.column)}</kbd> ${esc(d.category)}</small><h3>${esc(d.name)}</h3><b>${d.rank?'Nível '+d.rank+' / '+d.max:'Ainda não aprendida'}</b></div></header><p>${esc(d.description)}</p><div class="wl-skill-values"><div class="wl-skill-value-head"><span>Valores base</span><b>${d.rank?'Atual':'—'}</b>${d.nextRank?'<b>Nível '+d.nextRank+'</b>':''}</div>${d.rows.map(r=>`<div><span>${esc(r.label)}</span><b>${esc(r.current)}</b>${d.nextRank?`<strong class="${r.next!==r.current?'improved':''}">${esc(r.next)}</strong>`:''}</div>`).join('')}</div><footer><b>${esc(d.status)}</b><span class="${d.purchase.enabled?'wl-skill-can-upgrade':''}">${esc(d.purchase.reason)}</span>${d.purchase.enabled&&d.rank?'<small>Use + na barra para melhorar sem mudar de atalho.</small>':''}</footer>`;
}

export function warlockAbilitiesMarkup(state,unit,{aim=null}={}){
 if(!state?.warlock||!unit)return '';
 const keys=(unit.skills||[]).filter(k=>definition(k)).sort((a,b)=>WARLOCK_COLUMNS.indexOf(definition(a).column)-WARLOCK_COLUMNS.indexOf(definition(b).column));
 return keys.map(key=>{
  const skill=definition(key),purchase=warlockSkillPurchase(state,unit,key),link=key==='S019'?warlockLinkAction(state,unit):null,cooldown=link?0:Math.max(0,unit.cooldowns?.[key]||0),ready=state.warlock.phase==='battle'&&unit.alive!==false&&purchase.rank>0&&!cooldown;
  const label=link?({recall:'Recolher gancho',cancel:'Cancelar gancho'}[link]||'Soltar vínculo'):skill.name,caption=link?(link==='recall'?'RECOLHER':'SOLTAR'):'N'+purchase.rank;
  return `<div class="ability-slot wl-ability-slot" data-wl-skill-tooltip="${esc(key)}"><button type="button" class="wl-ability-upgrade" data-wl-upgrade="${esc(key)}" ${state.warlock.phase==='shop'&&skill.column!=='F'?'':'hidden'} ${purchase.enabled&&purchase.rank?'':'disabled'} aria-label="Melhorar ${esc(skill.name)}: ${esc(purchase.reason)}" title="${esc(purchase.reason)}">+<small>◆ ${Number.isFinite(purchase.price)?number(purchase.price):'—'}</small></button><button type="button" class="ability ${cooldown?'cooling':''} ${aim===key||link?'active':''}" data-legacy-cast="${esc(key)}" aria-label="${esc(skill.column+', '+label+', nível '+purchase.rank)}" aria-disabled="${!ready}"><small>${esc(skill.column)}</small>${gameIllustration('warlock','skill',key)}<em>${esc(caption)}</em><span class="ability-cooldown" aria-hidden="true">${cooldown?Math.ceil(cooldown):''}</span></button><button type="button" class="wl-skill-info" data-wl-skill-info aria-label="Detalhes de ${esc(skill.name)}">i</button></div>`;
 }).join('');
}

let tooltipId=0;
const tooltipBindings=new WeakMap(),abilityBindings=new WeakMap();
export function bindWarlockSkillTooltips(container,{getState=()=>null,getUnit=()=>null}={}){
 const existing=tooltipBindings.get(container);if(existing){existing.setSource(getState,getUnit);return existing;}
 const doc=container.ownerDocument,win=doc.defaultView;let readState=getState,readUnit=getUnit,anchor=null,card=null,pinned=false,content='';
 const described=new Map();
 function hide(){for(const [el,previous]of described){if(previous)el.setAttribute('aria-describedby',previous);else el.removeAttribute('aria-describedby');}described.clear();anchor=null;pinned=false;content='';if(card){try{card.hidePopover?.();}catch{}card.hidden=true;}}
 function update(){
  if(!anchor?.isConnected||!anchor.getClientRects().length){hide();return;}
  const html=warlockSkillTooltipMarkup(readState(),readUnit(),anchor.dataset.wlSkillTooltip);if(!html){hide();return;}
  if(!card){card=doc.createElement('aside');card.id='wl-skill-tooltip-'+(++tooltipId);card.className='wl-skill-tooltip';card.setAttribute('role','tooltip');card.setAttribute('popover','manual');card.addEventListener('pointerleave',e=>{if(!pinned&&!anchor?.contains(e.relatedTarget)&&!anchor?.contains(doc.activeElement))hide();});doc.body.append(card);}
  if(html!==content){card.innerHTML=html;content=html;}card.hidden=false;
  const focused=doc.activeElement,target=anchor.contains(focused)&&focused.matches('button,[tabindex]')?focused:anchor.matches('button,[tabindex]')?anchor:anchor.querySelector('[data-legacy-cast]')||anchor;
  if(!described.has(target))described.set(target,target.getAttribute('aria-describedby'));target.setAttribute('aria-describedby',[described.get(target),card.id].filter(Boolean).join(' '));
  // A native dialog is in the top layer; put its tooltip in the same layer.
  const host=anchor.closest('dialog[open]')||doc.body;if(card.parentElement!==host)host.append(card);try{card.showPopover?.();}catch{}
  const a=anchor.getBoundingClientRect(),r=card.getBoundingClientRect(),width=win.innerWidth,height=win.innerHeight;
  card.style.left=Math.max(8,Math.min(width-r.width-8,a.left+a.width/2-r.width/2))+'px';
  card.style.top=Math.max(8,Math.min(height-r.height-8,a.top>=r.height+16?a.top-r.height-10:a.bottom+10))+'px';
 }
 const show=node=>{if(!node||!container.contains(node))return;if(anchor!==node){hide();anchor=node;}update();};
 const over=e=>{if(e.pointerType!=='touch'&&!pinned)show(e.target.closest?.('[data-wl-skill-tooltip]'));};
 const out=e=>{if(!pinned&&anchor&&!anchor.contains(e.relatedTarget)&&!card?.contains(e.relatedTarget)&&!anchor.contains(doc.activeElement))hide();};
 const focus=e=>show(e.target.closest?.('[data-wl-skill-tooltip]'));
 const blur=e=>{if(!pinned&&anchor&&!anchor.contains(e.relatedTarget))hide();};
 const click=e=>{const info=e.target.closest?.('[data-wl-skill-info]');if(info){e.preventDefault();e.stopPropagation();const node=info.closest('[data-wl-skill-tooltip]');if(pinned&&anchor===node)hide();else{show(node);pinned=true;}}};
 const outside=e=>{if(anchor&&!anchor.contains(e.target)&&!card?.contains(e.target))hide();};
 const key=e=>{if(e.key==='Escape')hide();};
 const events=[['pointerover',over],['pointerout',out],['focusin',focus],['focusout',blur],['click',click]];
 for(const [type,handler]of events)container.addEventListener(type,handler);doc.addEventListener('pointerdown',outside);doc.addEventListener('keydown',key);win.addEventListener('resize',update);doc.addEventListener('scroll',update,true);
 const api={update,hide,setSource(state,unit){readState=state;readUnit=unit;},destroy(){hide();card?.remove();for(const [type,handler]of events)container.removeEventListener(type,handler);doc.removeEventListener('pointerdown',outside);doc.removeEventListener('keydown',key);win.removeEventListener('resize',update);doc.removeEventListener('scroll',update,true);tooltipBindings.delete(container);}};
 tooltipBindings.set(container,api);return api;
}

export function bindWarlockAbilities(container,{send=()=>false,onCast=()=>{},getState=()=>null,getUnit=()=>null}={}){
 const existing=abilityBindings.get(container);if(existing){existing.setSource({send,onCast,getState,getUnit});existing.update();return existing;}
 let source={send,onCast,getState,getUnit};
 const tooltip=bindWarlockSkillTooltips(container,{getState,getUnit});
 const click=e=>{
  if(e.target.closest?.('[data-wl-skill-info]'))return;
  const upgrade=e.target.closest?.('[data-wl-upgrade]');
  if(upgrade&&container.contains(upgrade)){e.preventDefault();e.stopPropagation();if(upgrade.disabled||upgrade.hidden)return;const key=upgrade.dataset.wlUpgrade,state=source.getState(),unit=source.getUnit();if(state&&unit){const purchase=warlockSkillPurchase(state,unit,key);if(!purchase.enabled||!purchase.rank)return;}upgrade.disabled=true;source.send({type:'wlBuy',skill:key});return;}
  const cast=e.target.closest?.('[data-legacy-cast]');if(cast&&container.contains(cast)){e.preventDefault();if(cast.getAttribute('aria-disabled')==='true')return;source.onCast(cast.dataset.legacyCast);}
 };
 container.addEventListener('click',click);
 const api={update:tooltip.update,hide:tooltip.hide,setSource(next){source=next;tooltip.setSource(next.getState,next.getUnit);},destroy(){container.removeEventListener('click',click);tooltip.destroy();abilityBindings.delete(container);}};abilityBindings.set(container,api);return api;
}
