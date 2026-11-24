import {HEROES,SKILLS} from '../shared/catalog.js';
import {skillFor} from '../shared/skill-quality.js';
import {TREE_TAG_SKILLS,TREE_TAG_WORKER_SKILLS,treeTagSkillAt} from '../shared/tree-tag-catalog.js';
import {WARLOCK_SKILLS,wlSkillAt} from '../shared/warlock-catalog.js';
import {PHASE_KILLER_SKILLS,phaseKillerSkillAt} from '../shared/phase-killer-catalog.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {treeTagCanSee} from '../shared/tree-tag.js';
import {castleMatchups,castleTypeName} from './castle-unit-info.js';
import {escapeHTML as esc} from './competition-ui.js';

const finite=Number.isFinite,n=value=>value.toLocaleString('pt-BR',{maximumFractionDigits:1}),same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
const labels={str:'FOR',agi:'AGI',vit:'VIT',int:'INT',dex:'DES',luk:'SOR'};
const elements={physical:'Físico',fire:'Fogo',ice:'Gelo',frost:'Gelo',water:'Água',earth:'Terra',wind:'Vento',lightning:'Relâmpago',poison:'Veneno',holy:'Sagrado',dark:'Sombrio',arcane:'Arcano',neutral:'Neutro',ghost:'Fantasma',undead:'Morto-vivo'};
function viewerOf(state,owner){return state?.units?.find(u=>same(u.id,state.players?.[owner]))||state?.units?.find(u=>same(u.owner,owner)&&u.hero);}
export function unitInspectionAllowed(state,owner,unit){
 if(!unit||!state?.units?.some(u=>same(u.id,unit.id)))return false;
 const mode=state.options?.mode;
 if(!['treetag','kodotag'].includes(mode))return true;
 const viewer=viewerOf(state,owner);if(!viewer)return false;
 if(same(unit.owner,owner)||unit.team!=null&&unit.team===viewer.team)return true;
 if(unit.treeTagCaptured||unit.kodoTagCaptured)return false;
 const vision=state.treeTag?.vision||state.kodoTag?.vision||state.explorationVision;
 if(Array.isArray(vision?.unitIds))return vision.unitIds.some(id=>same(id,unit.id));
 if(vision?.cells&&vision.bounds&&finite(unit.x)&&finite(unit.z)){
  const b=vision.bounds,x=Math.floor((unit.x-b.minX)/(b.maxX-b.minX)*vision.size),z=Math.floor((unit.z-b.minZ)/(b.maxZ-b.minZ)*vision.size);
  return x>=0&&z>=0&&x<vision.size&&z<vision.size&&String(vision.cells[z*vision.size+x])==='2';
 }
 return mode==='treetag'&&treeTagCanSee(state,viewer,unit);
}
export function inspectedUnitSkills(state,unit,owner){
 const mode=state.options?.mode;
 // Local games may still hold private powers in memory. Another inhabitant's
 // powers must not disclose the hidden Phase Killer role.
 if(mode==='phasekiller'&&!same(unit.owner,owner))return null;
 const ro=mode==='bonk'&&same(unit.id,state.players?.[owner]),source=mode==='bonk'?(ro?state.bonk?.weapons||unit.bonkWeapons||unit.skills:unit.bonkWeapons||unit.skills):unit.skills,entries=Array.isArray(source)?source:[];
 return [...new Map(entries.filter(Boolean).map(entry=>{
  const key=typeof entry==='string'?entry:entry.key,rank=finite(entry.level)?entry.level:unit.skillLevels?.[key];let definition;
  if(mode==='treetag')definition=TREE_TAG_WORKER_SKILLS[key]||treeTagSkillAt(key,rank)||TREE_TAG_SKILLS[key];
  else if(mode==='warlock')definition=wlSkillAt(key,rank)||WARLOCK_SKILLS[key];
  else if(mode==='phasekiller')definition=phaseKillerSkillAt(key,rank)||PHASE_KILLER_SKILLS[key];
  else if(mode==='bonk')definition=typeof entry==='object'?entry:RO_SKILLS[key];
  else if(Object.hasOwn(SKILLS,key))definition=skillFor(unit,key)||SKILLS[key];
  const value=typeof entry==='object'?entry:{};
  return [key,{key,name:value.name||definition?.name,description:value.description||definition?.description||'',kind:value.kind||definition?.kind,rank:finite(rank)?rank:null,cooldown:unit.cooldowns?.[key],mana:value.mana??value.manaCost??definition?.mana??definition?.manaCost}];
 })).values()].filter(skill=>skill.name);
}
function statusOf(state,u){
 const time=finite(state.time)?state.time:0,elapsed=state.treeTag?.elapsed??time,status=[];
 if(u.alive===false||u.hp===0)status.push('Derrotado');
 if(u.treeTagCaptured||u.kodoTagCaptured)status.push('Capturado');
 if(u.treeTagWaiting)status.push('Aguardando retorno');
 if(u.stun>0)status.push('Atordoado · '+n(u.stun)+'s');
 if(u.rootUntil>time||u.treeTagRootUntil>elapsed)status.push('Imobilizado');
 if(u.webbedUntil>time)status.push('Preso em teia');
 if(u.wlFrozenUntil>time)status.push('Congelado');
 if(u.wlFrostUntil>time||u.frostUntil>time||u.abilitySlowUntil>time)status.push('Lento');
 if(Math.max(u.dots?.burn?.until||0,u.dots?.lava?.until||0,u.solarUntil||0,u.wlLavaContactUntil||0,u.wlMeteorBurnUntil||0)>time)status.push('Queimando');
 if(u.dots?.poison?.until>time)status.push('Envenenado');
 if(u.shield>0&&u.shieldUntil>time)status.push('Barreira · '+n(u.shield));
 return status;
}
function relationOf(state,u,owner){if(state.options?.mode==='phasekiller')return same(u.owner,owner)?'Seu personagem':'Unidade observada';const viewer=viewerOf(state,owner);return same(u.owner,owner)?'Seu personagem':viewer?.team!=null&&u.team===viewer.team?'Aliado':'Inimigo';}
function meter(label,current,max){if(!finite(current))return '';const percent=finite(max)&&max>0?Math.max(0,Math.min(100,current/max*100)):null;return `<div class="unit-inspector-meter ${label==='SP / Mana'?'mana':''}"><div><span>${label}</span><b>${n(current)}${finite(max)?' / '+n(max):''}</b></div>${percent!==null?`<i role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${Math.max(0,Math.min(max,current))}"><i style="width:${percent}%"></i></i>`:''}</div>`;}
function weaknessesOf(state,u){
 const resists={...u.resistances};if(finite(u.fireResist))resists.fire=u.fireResist;if(finite(u.coldResist))resists.ice=u.coldResist;
 const rows=Object.entries(resists).filter(([,value])=>finite(value)&&value!==0).map(([element,value])=>`<li class="${value<0?'weak':'resistant'}">${value<0?'Vulnerável a':'Resiste a'} ${esc(elements[element]||element)} <b>${n(Math.abs(value)*100)}%</b></li>`);
 if(state.options?.mode==='castlefight'&&u.armorType&&['light','medium','heavy','fortified','unarmored','hero','divine','normal'].includes(u.armorType)){
  const matches=castleMatchups(u);for(const m of matches.weak)rows.push(`<li class="weak">Recebe mais dano ${esc(castleTypeName(m.type))} <b>+${n((m.multiplier-1)*100)}%</b></li>`);
  for(const m of matches.resistant)rows.push(`<li class="resistant">Resiste a ${esc(castleTypeName(m.type))} <b>${n((1-m.multiplier)*100)}%</b></li>`);
 }
 return rows.length?`<section><h4>Fraquezas e resistências</h4><ul class="unit-inspector-resists">${rows.join('')}</ul></section>`:'';
}
export function unitInspectorMarkup(state,u,owner){
 const privatePK=state.options?.mode==='phasekiller'&&!same(u.owner,owner),name=privatePK&&u.pkDisguise&&!u.pkDisplayName?'Habitante':u.pkDisplayName||u.name||HEROES[u.hero]?.name||u.kind||'Unidade',stats=[];
 const stat=(label,value,suffix='')=>{if(finite(value))stats.push(`<div><dt>${label}</dt><dd>${n(value)}${suffix}</dd></div>`);};
 stat('Nível',u.monsterLevel??u.level);stat('ATQ',u.basicDamage??u.damage);stat('ATQ mágico',u.magicAttack);stat('Defesa física',u.armor);stat('Defesa mágica',u.magicDefense);stat('Movimento',u.speed,' m/s');stat('Alcance',u.range,' m');
 if(finite(u.interval)&&u.interval>0)stat('Intervalo de ataque',u.interval/(finite(u.attackSpeed)&&u.attackSpeed>0?u.attackSpeed:1),' s');
 stat('Precisão',finite(u.accuracy)?u.accuracy*100:null,'%');stat('Esquiva',finite(u.evasion)?u.evasion*100:null,'%');stat('Crítico',finite(u.critChance)?u.critChance*100:null,'%');
 const attributes=privatePK?{}:u.totalAttributes||u.attributes||u.inheritedAttributes||{},attributeRows=Object.entries(attributes).filter(([,v])=>finite(v)).map(([key,value])=>`<div><dt>${esc(labels[key]||key.toUpperCase())}</dt><dd>${n(value)}</dd></div>`),skills=inspectedUnitSkills(state,u,owner),statuses=statusOf(state,u),tags=[];
 if(u.element)tags.push(elements[u.element]||u.element);if(u.attackType)tags.push('Ataque '+(u.attackType==='physical'?'físico':castleTypeName(u.attackType)||u.attackType));if(u.armorType)tags.push('Armadura '+castleTypeName(u.armorType));if(typeof u.flying==='boolean')tags.push(u.flying?'Voador':'Terrestre');
 return `<div class="unit-inspector-summary"><div><small>${esc(relationOf(state,u,owner))}</small><h3>${esc(name)}</h3></div>${u.bonkBoss||u.monsterRarity==='boss'?'<span class="unit-inspector-boss">Chefe</span>':''}</div>${tags.length?`<div class="unit-inspector-tags">${tags.map(tag=>'<span>'+esc(tag)+'</span>').join('')}</div>`:''}${meter('Vida',u.hp,u.maxHp)}${u.maxMana>0?meter('SP / Mana',u.mana,u.maxMana):''}${statuses.length?`<div class="unit-inspector-status" aria-label="Estados atuais">${statuses.map(s=>'<span>'+esc(s)+'</span>').join('')}</div>`:''}${stats.length?`<dl class="unit-inspector-stats">${stats.join('')}</dl>`:''}${attributeRows.length?`<section><h4>Atributos${u.inheritedAttributes&&!u.attributes&&!u.totalAttributes?' herdados':''}</h4><dl class="unit-inspector-attributes">${attributeRows.join('')}</dl></section>`:''}${privatePK?'':weaknessesOf(state,u)}<section><h4>Habilidades${skills?.length?' · '+skills.length:''}</h4>${skills?.length?`<ul class="unit-inspector-skills">${skills.map(s=>`<li><div><b>${esc(s.name)}</b>${s.rank!==null?'<em>Nv. '+n(s.rank)+'</em>':''}</div><small>${s.kind==='passive'?'Passiva':s.kind==='active'?'Ativa':''}${finite(s.cooldown)&&s.cooldown>0?' · Recarga '+n(s.cooldown)+'s':''}${finite(s.mana)&&s.mana>0?' · Mana '+n(s.mana):''}</small>${s.description?'<p>'+esc(s.description)+'</p>':''}</li>`).join('')}</ul>`:`<p class="unit-inspector-empty">${skills===null?'Habilidades não públicas.':'Nenhuma habilidade informada.'}</p>`}</section>`;
}

export function clampUnitInspectorPosition(p,size,viewport){const left=8,top=Math.min(56,Math.max(8,viewport.height-48));return {left:Math.max(left,Math.min(Math.max(left,viewport.width-size.width-8),p.left)),top:Math.max(top,Math.min(Math.max(top,viewport.height-size.height-8),p.top))};}
export function createUnitInspector({getState,getOwner,document:doc=globalThis.document}={}){
 const win=doc?.defaultView||globalThis.window;let panel=null,content=null,grip=null,selected=null,position=null,drag=null,last='';
 const viewport=()=>({width:win.innerWidth,height:win.innerHeight});
 function place(p){if(!panel)return;const r=panel.getBoundingClientRect();position=clampUnitInspectorPosition(p,{width:r.width,height:r.height},viewport());panel.style.left=position.left+'px';panel.style.top=position.top+'px';panel.style.right='auto';}
 function finish(cancel=false){if(!drag)return;const previous=drag;drag=null;if(cancel)place(previous.origin);panel?.classList.remove('is-dragging');try{grip.releasePointerCapture(previous.id);}catch{}}
 function close(){const was=!!panel;finish();panel?.remove();panel=content=grip=null;selected=null;last='';return was;}
 function ensure(){if(panel||!doc)return;panel=doc.createElement('section');panel.className='unit-inspector';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','unit-inspector-title');panel.innerHTML='<header><button type="button" class="unit-inspector-drag" aria-label="Mover ficha da unidade. Use as setas para ajustar."><svg viewBox="0 0 20 16" aria-hidden="true"><path d="M5 4h1m4 0h1m4 0h1M5 11h1m4 0h1m4 0h1"/></svg><span id="unit-inspector-title">Ficha da unidade</span></button><button type="button" data-unit-inspector-close aria-label="Fechar ficha da unidade">×</button></header><div class="unit-inspector-content"></div>';doc.body.append(panel);content=panel.querySelector('.unit-inspector-content');grip=panel.querySelector('.unit-inspector-drag');panel.querySelector('[data-unit-inspector-close]').onclick=close;
  grip.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0||e.isPrimary===false)return;e.preventDefault();e.stopPropagation();const r=panel.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,origin:{left:r.left,top:r.top}};panel.classList.add('is-dragging');try{grip.setPointerCapture(e.pointerId);}catch{}});
  grip.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();place({left:drag.origin.left+e.clientX-drag.x,top:drag.origin.top+e.clientY-drag.y});});
  grip.addEventListener('pointerup',e=>{if(e.pointerId===drag?.id)finish();});grip.addEventListener('pointercancel',()=>finish(true));grip.addEventListener('lostpointercapture',()=>finish());grip.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  grip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const r=panel.getBoundingClientRect(),step=e.shiftKey?24:8;place({left:r.left+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),top:r.top+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)});});
 }
 function update(){if(selected===null)return false;const state=getState(),unit=state?.units?.find(u=>same(u.id,selected));if(!unitInspectionAllowed(state,getOwner(),unit)){close();return false;}ensure();const html=unitInspectorMarkup(state,unit,getOwner());if(html!==last){content.innerHTML=html;last=html;}if(!drag)place(position||{left:viewport().width-panel.getBoundingClientRect().width-14,top:88});return true;}
 const resize=()=>{if(panel)place(position||{left:8,top:56});},blur=()=>finish(true),escape=e=>{if(e.key==='Escape'&&panel&&!e.defaultPrevented){close();e.preventDefault();}};
 win?.addEventListener('resize',resize);win?.addEventListener('blur',blur);doc?.addEventListener('keydown',escape);
 return {open(id){const state=getState(),unit=state?.units?.find(u=>same(u.id,id));if(!unitInspectionAllowed(state,getOwner(),unit))return false;const changed=!same(selected,id);selected=unit.id;const result=update();if(changed&&content)content.scrollTop=0;return result;},update,close,isOpen:()=>!!panel,destroy(){close();win?.removeEventListener('resize',resize);win?.removeEventListener('blur',blur);doc?.removeEventListener('keydown',escape);}};
}
