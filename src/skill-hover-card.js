import {RO_SKILLS,roBasicAttack} from '../shared/ragnarok-jobs.js';
import {skillFor} from '../shared/skill-quality.js';
import {levelOf} from '../shared/catalog.js';
import {roSkillCastTime,roSkillManaCost,roSkillCooldown} from '../shared/ro-skill-controls.js';
import {skillShopEntry} from './skill-shop-ui.js';
import {icon} from './art.js';
import {escapeHTML as esc} from './competition-ui.js';

const labels={hpRegen:'Vida/s',magicDefense:'Defesa mágica',damageBonus:'Bônus de dano',summonHp:'Vida do aliado',summonDuration:'Duração da invocação',summonRange:'Alcance do aliado',summonSpeed:'Movimento do aliado',pulses:'Pulsos',shieldHits:'Cargas da barreira',damage:'Dano base',heal:'Cura base',mana:'Mana',cooldown:'Recarga',castRange:'Alcance',distance:'Distância',radius:'Raio da área',duration:'Duração',stun:'Atordoamento',shield:'Barreira',shieldHpPercent:'Vida convertida em barreira',chance:'Chance',lifesteal:'Roubo de vida',attackSpeed:'Vel. de ataque',moveSpeed:'Movimento',armor:'Armadura',hp:'Vida',manaRegen:'Mana/s',reflect:'Reflexão',evasion:'Esquiva',poison:'Veneno/s',burn:'Queimadura/s',multiplier:'Crítico ×',jumps:'Saltos',bounces:'Ricochetes',summonCount:'Invocações',summonDamage:'Dano do aliado',atkCoefficient:'Escala de ATK',matkCoefficient:'Escala de MATK'};
const percent=new Set(['damageBonus','chance','lifesteal','attackSpeed','moveSpeed','reflect','evasion','shieldHpPercent','atkCoefficient','matkCoefficient']);
const seconds=new Set(['summonDuration','cooldown','duration','stun']),metres=new Set(['summonRange','castRange','distance','radius']);
const fmt=(key,n)=>!Number.isFinite(n)?'—':(percent.has(key)?Math.round(n*100)+'%':Number(n.toFixed(2)).toLocaleString('pt-BR'))+(seconds.has(key)?' s':metres.has(key)?' m':'');
export function equippedSkillDetails(state,unit,token){
 if(!state||!unit||typeof token!=='string')return null;const split=token.indexOf(':'),mode=token.slice(0,split),key=token.slice(split+1);
 if(mode==='classic'){
  if(!unit.skills?.includes(key)||['bonk','castlefight','treetag','kodotag','warlock','phasekiller','bloody'].includes(state.options?.mode))return null;
  const skill=skillFor(unit,key),rank=levelOf(unit,key),entry=skillShopEntry(unit,state,key);if(!skill||!entry)return null;
  const next=rank<5?skillFor({...unit,skillLevels:{...unit.skillLevels,[key]:rank+1}},key):null;
  const rows=Object.keys(labels).filter(k=>Number.isFinite(skill[k])||Number.isFinite(next?.[k])).map(k=>({label:labels[k],current:fmt(k,skill[k]),next:next?fmt(k,next[k]):null}));
  return{key,name:skill.name,art:key,description:skill.description,rank,max:5,kind:skill.kind==='passive'?'Passiva · sempre ativa':'Habilidade ativa',element:skill.damageType==='physical'?'Dano físico':skill.damageType==='magic'?'Dano mágico':null,rows,canUpgrade:entry.enabled,upgradeReason:entry.reason,points:unit.skillPoints||0,auto:!!unit.autoSkills?.[key],passive:skill.kind==='passive'};
 }
 if(mode==='ro'&&state.options?.mode==='bonk'){
  const b=state.bonk,skill=b?.weapons?.find(s=>s?.key===key);if(!skill)return null;const rank=skill.level||1,next=rank<8?rank+1:null,stats=b.stats||{},definition=key==='basic'?roBasicAttack(unit):RO_SKILLS[key]||skill;
  // These are the same level and haste multipliers used by the combat engine.
  const damage=level=>(skill.damage||0)*(1+(level-1)*.28),rows=[];
  if(skill.damage>0)rows.push({label:'Dano base',current:fmt('damage',damage(rank)),next:next?fmt('damage',damage(next)):null});
  rows.push({label:'Conjuração',current:fmt('cooldown',roSkillCastTime(definition,rank,stats).total),next:next?fmt('cooldown',roSkillCastTime(definition,next,stats).total):null});
  rows.push({label:'SP',current:fmt('mana',roSkillManaCost(skill)),next:next?fmt('mana',roSkillManaCost(skill,next)):null},{label:'Recarga',current:fmt('cooldown',roSkillCooldown(definition,rank,stats)),next:next?fmt('cooldown',roSkillCooldown(definition,next,stats)):null},{label:'Alcance',current:fmt('distance',(skill.range||0)*(stats.area||1)),next:next?fmt('distance',(skill.range||0)*(stats.area||1)):null});
  for(const k of ['duration','radius','summonCount','healPercent'])if(Number.isFinite(skill.mechanics?.[k]))rows.push({label:k==='healPercent'?'Cura da vida máxima':labels[k]||k,current:k==='healPercent'?Math.round(skill.mechanics[k]*100)+'%':fmt(k,skill.mechanics[k]),next:null});
  const pending=!!b.offer,offered=!!b.offer?.choices?.some(c=>c.kind==='weapon'&&c.key===key),canUpgrade=offered&&rank<8,upgradeReason=rank>=8?'Nível máximo alcançado.':offered?'Usa uma das quatro ofertas desta subida de nível.':pending?'Esta habilidade não está entre as quatro ofertas.':'Melhore quando aparecer entre as quatro ofertas de nível.';
  return{key,name:skill.name,art:skill.skill||'cleave',description:skill.description,rank,max:8,kind:skill.kind==='passive'?'Passiva · sempre ativa':'Habilidade ativa',element:({physical:'Físico',fire:'Fogo',ice:'Gelo',wind:'Vento',holy:'Sagrado',poison:'Veneno',dark:'Sombrio',arcane:'Arcano'})[skill.element],rows,canUpgrade,upgradeReason,points:pending?1:0,auto:skill.auto!==false,passive:skill.kind==='passive'};
 }
 return null;
}
export function skillHoverCardMarkup(d){
 if(!d)return'';const next=d.rank<d.max;
 return `<header>${icon(d.art)}<div><small>${esc(d.kind)}${d.element?' · '+esc(d.element):''}</small><h3>${esc(d.name)}</h3><b>Nível ${d.rank} / ${d.max}</b></div></header><p>${esc(d.description)}</p><div class="skill-hover-values"><div class="skill-hover-column-head"><span>Detalhes</span><b>Atual</b>${next?'<b>Próximo</b>':''}</div>${d.rows.map(row=>`<div><span>${esc(row.label)}</span><b>${esc(row.current)}</b>${next?`<strong class="${row.next&&row.next!==row.current?'improved':''}">${row.next?esc(row.next):'—'}</strong>`:''}</div>`).join('')}</div><footer><b>${d.passive?'Sempre ativa':d.auto?'Uso automático ligado':'Uso manual'}</b><span class="${d.canUpgrade?'skill-hover-ready':''}">${esc(d.upgradeReason)}</span>${d.canUpgrade?'<small>O botão + escolhe esta melhoria sem trocar seu atalho.</small>':''}</footer>`;
}
export function createSkillHoverCard({root,getDetails}){
 let anchor=null,pinned=false,card=null,signature='';
 const hide=()=>{anchor?.removeAttribute('aria-describedby');anchor=null;pinned=false;if(card)card.hidden=true;signature='';};
 function update(){if(!anchor?.isConnected||!anchor.getClientRects().length){hide();return;}const d=getDetails(anchor.dataset.skillInspect);if(!d){hide();return;}if(!card){card=document.createElement('aside');card.id='skill-hover-card';card.className='skill-hover-card';card.setAttribute('role','tooltip');document.body.append(card);}const html=skillHoverCardMarkup(d);if(html!==signature){card.innerHTML=html;signature=html;}card.hidden=false;anchor.setAttribute('aria-describedby',card.id);const r=anchor.getBoundingClientRect(),c=card.getBoundingClientRect(),left=Math.max(8,Math.min(innerWidth-c.width-8,r.left+r.width/2-c.width/2)),top=Math.max(8,Math.min(innerHeight-c.height-8,r.top-c.height-12));card.style.left=left+'px';card.style.top=top+'px';}
 const show=node=>{if(!node)return;anchor?.removeAttribute('aria-describedby');anchor=node;update();};
 const over=e=>{if(e.pointerType==='touch')return;if(!pinned)show(e.target.closest?.('[data-skill-inspect]'));};
 const out=e=>{if(!pinned&&anchor&&!anchor.contains(e.relatedTarget))hide();};
 const focus=e=>{if(globalThis.matchMedia?.('(hover: none)').matches)return;show(e.target.closest?.('[data-skill-inspect]'));};
 const blur=e=>{if(!pinned&&anchor&&!anchor.contains(e.relatedTarget))hide();};
 const click=e=>{const info=e.target.closest?.('[data-skill-info]');if(info){e.preventDefault();e.stopPropagation();const node=info.closest('[data-skill-inspect]');if(pinned&&anchor===node)hide();else{pinned=true;show(node);}}else if(anchor&&!anchor.contains(e.target))hide();};
 const key=e=>{if(e.key==='Escape')hide();};
 root.addEventListener('pointerover',over);root.addEventListener('pointerout',out);root.addEventListener('focusin',focus);root.addEventListener('focusout',blur);root.addEventListener('click',click);document.addEventListener('keydown',key);
 return{update,hide,destroy(){hide();card?.remove();for(const [name,handler]of [['pointerover',over],['pointerout',out],['focusin',focus],['focusout',blur],['click',click]])root.removeEventListener(name,handler);document.removeEventListener('keydown',key);}};
}
