import {heroArchetype,ARCHETYPES} from '../shared/archetypes.js';
import {HEROES,SKILLS,levelOf,skillAt} from '../shared/catalog.js';
import {MONSTERS,MONSTER_PROFILES} from '../shared/monsters.js';
import {LOOT_RARITIES} from '../shared/rarity.js';
import {skillFor} from '../shared/skill-quality.js';
import {icon} from './art.js';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const decimal=value=>finite(value).toLocaleString('pt-BR',{maximumFractionDigits:2});
const integer=value=>Math.max(0,Math.ceil(finite(value))).toLocaleString('pt-BR');
const percent=value=>`${decimal(clamp(finite(value),0,1)*100)}%`;
const SPIRIT_NAMES={raven:'Corvo de Odin',lynx:'Lince de Freya',helhound:'Guardião de Hel'};
const ELEMENTS={
 physical:{name:'Físico',color:'#c9c6ac',symbol:'◇'},fire:{name:'Fogo',color:'#f0b16e',symbol:'♨'},ice:{name:'Gelo',color:'#a8dced',symbol:'❄'},frost:{name:'Gelo',color:'#a8dced',symbol:'❄'},lightning:{name:'Relâmpago',color:'#e8d586',symbol:'ϟ'},wind:{name:'Vento',color:'#b5d7c0',symbol:'≈'},poison:{name:'Veneno',color:'#bfd78e',symbol:'◈'},water:{name:'Água',color:'#a7cadf',symbol:'≋'},earth:{name:'Terra',color:'#d5bb8a',symbol:'▱'},arcane:{name:'Arcano',color:'#cbb5e1',symbol:'✧'}
};
function elementFor(value){return Object.hasOwn(ELEMENTS,value)?ELEMENTS[value]:ELEMENTS.physical;}
function controlTypes(key,s){const types=[];if(s.stun>0||s.heroStun>0)types.push('Atordoamento');if(s.slow>0||['frostnova','warlockfrost'].includes(key))types.push('Lentidão');if(s.push>0||key==='forcepush')types.push('Repulsão');if(s.pull>0||['hook','gravity'].includes(key))types.push('Puxão');if(key==='swap')types.push('Troca de posição');return types;}
function profile(unit,count){
 if(unit.hero)return{key:'hero',name:'Herói',detail:`${count} técnica${count===1?'':'s'}`};
 if(unit.summon)return{key:'summon',name:'Invocação',detail:count?`${count} técnica${count===1?'':'s'}`:'Sem habilidades'};
 const rarity=unit.monsterRarity||unit.rarity;
 if(rarity==='boss'||unit.boss==='boss'||unit.boss===true)return{key:'boss',name:'Chefe',detail:`${count} / 5 técnicas`};
 if(rarity==='miniboss'||unit.boss==='miniboss')return{key:'miniboss',name:'Minichefe',detail:`${count} / 5 técnicas`};
 if(rarity==='special'||count>0)return{key:'special',name:'Especial',detail:`${count} técnica${count===1?'':'s'}`};
 return{key:'normal',name:'Normal',detail:'Sem habilidades'};
}
function stat(label,value,note=''){return `<div class="target-stat"><dt>${label}</dt><dd>${value}${note?`<small>${note}</small>`:''}</dd></div>`;}

/** Render live authoritative fields only; selecting an animal never issues orders. */
export function targetMarkup(unit,time=0){
 if(!unit)return '<section class="target-empty"><span aria-hidden="true">◎</span><h3>Conheça seu adversário.</h3><p>Clique em um animal para consultar vida, atributos e técnicas.</p><small>Botão direito continua movendo ou atacando.</small></section>';
 const meta=Object.hasOwn(MONSTERS,unit.kind)?MONSTERS[unit.kind]:null,common=Object.hasOwn(MONSTER_PROFILES,unit.kind)?MONSTER_PROFILES[unit.kind]:null,hero=Object.hasOwn(HEROES,unit.hero)?HEROES[unit.hero]:null;
 const name=escapeHTML(unit.name||meta?.name||hero?.name||common?.name||SPIRIT_NAMES[unit.kind]||'Animal do Pátio'),kind=escapeHTML(unit.summon?'Espírito invocado':hero?.animal||(meta?.mythic?'Besta mítica':'Criatura do Pátio'));
 const skills=[...new Set(Array.isArray(unit.skills)?unit.skills:[])].filter(key=>Object.hasOwn(SKILLS,key)),classification=profile(unit,skills.length),element=elementFor(unit.element),maxHp=Math.max(1,finite(unit.maxHp,1)),hp=clamp(finite(unit.hp),0,maxHp),health=clamp(hp/maxHp*100,0,100);
 const level=Number.isFinite(unit.monsterLevel)?unit.monsterLevel:Number.isFinite(unit.level)?unit.level:null,size=Math.max(.01,finite(unit.size,1)),interval=Math.max(.05,finite(unit.interval,1)),attackSpeed=Math.max(.01,finite(unit.attackSpeed,1)),rate=attackSpeed/interval;
 const crit=clamp(finite(unit.critChance),0,1),critMultiplier=Math.max(1,finite(unit.critMultiplier,2)),alive=unit.alive!==false&&hp>0;
 const maxMana=Math.max(0,finite(unit.maxMana)),mana=clamp(finite(unit.mana),0,maxMana);
 const state=[];
 if((unit.stun||0)>0)state.push({label:`Atordoado · ${decimal(unit.stun)}s`,key:'stun'});
 if(Math.max(unit.dots?.burn?.until||0,unit.dots?.lava?.until||0,unit.solarUntil||0)>time)state.push({label:'Queimando',key:'fire'});
 if(Math.max(unit.frostUntil||0,unit.dots?.frost?.until||0,(unit.webbedUntil||0)>time?0:unit.abilitySlowUntil||0)>time)state.push({label:'Frost · lento',key:'ice'});
 if((unit.webbedUntil||0)>time)state.push({label:'Teia · lento',key:'web'});
 if((unit.dots?.poison?.until||0)>time)state.push({label:'Envenenado',key:'poison'});
 if((unit.rageUntil||0)>time)state.push({label:'Fúria',key:'rage'});
 if((unit.avatar||0)>time)state.push({label:'Juramento de Tyr · imune a magia',key:'shield'});
 if((unit.itemReflectUntil||0)>time)state.push({label:'Reflexão ativa',key:'shield'});
 if((unit.shieldUntil||0)>time&&(unit.shield||0)>0)state.push({label:`Barreira · ${integer(unit.shield)}`,key:'shield'});
 const currentResists={...unit.resistances};for(const [key,value]of [['fire',unit.fireResist],['ice',unit.coldResist]])if(Number.isFinite(value)&&value!==0)currentResists[key]=value;
 const resistances=Object.entries(currentResists).filter(([key,value])=>Object.hasOwn(ELEMENTS,key)&&Number.isFinite(value)&&value!==0);
 return `<section class="target-card ${alive?'':'target-fallen'}" aria-label="Ficha do alvo: ${name}" style="--target-element:${element.color}">
  <div class="target-header"><span class="target-symbol" aria-hidden="true">${element.symbol}</span><div><div class="target-eyebrow">ALVO SELECIONADO</div><h3>${name}</h3><small class="target-species">${kind}${level!==null?` · Nível ${integer(level)}`:' · Nível não informado'}</small></div></div>
  <div class="target-tags"><span class="target-rarity target-rarity-${classification.key}">${classification.name}</span><span class="target-element">${element.name}</span><span>${unit.flying?'Voador':'Terrestre'}</span><span>Tamanho ${decimal(size)}×</span>${!alive?'<span class="target-dead">Derrotado</span>':''}</div>
  <div class="target-health"><div><span>VIDA</span><strong>${integer(hp)} <small>/ ${integer(maxHp)}</small></strong></div><div class="target-health-track" role="progressbar" aria-label="Vida do alvo" aria-valuemin="0" aria-valuemax="${Math.ceil(maxHp)}" aria-valuenow="${Math.ceil(hp)}"><i style="width:${health.toFixed(2)}%"></i></div></div>
  ${maxMana>0?`<div class="target-health target-mana"><div><span>MANA</span><strong style="color:#b5d4e4">${integer(mana)} <small>/ ${integer(maxMana)}</small></strong></div><div class="target-health-track" role="progressbar" aria-label="Mana do alvo" aria-valuemin="0" aria-valuemax="${Math.ceil(maxMana)}" aria-valuenow="${Math.ceil(mana)}"><i style="width:${(mana/maxMana*100).toFixed(2)}%;background:linear-gradient(90deg,#658da8,#b2d1dc)"></i></div></div>`:''}
  ${state.length?`<div class="target-statuses">${state.map(s=>`<span class="target-status target-status-${s.key}">${s.label}</span>`).join('')}</div>`:''}
  <dl class="target-stats">${unit.hero?stat('Arquétipo',escapeHTML(ARCHETYPES[heroArchetype(unit)]?.name||'Herói')):''}${stat('Dano básico',decimal(unit.basicDamage??unit.damage),unit.attackType==='magic'?'Mágico':'Físico')}${unit.hero?stat('ATQ mágico',decimal(unit.magicAttack)):''}${stat('Defesa física',decimal(unit.armor))}${stat('Defesa mágica',decimal(unit.magicDefense))}${stat('Ataques / segundo',decimal(rate),`${decimal(interval/attackSpeed)}s por ataque`)}${stat('Movimento',`${decimal(unit.speed)} m/s`)}${stat('Esquiva física',percent(unit.evasion))}${stat('Precisão',percent(unit.accuracy??.9))}${stat('Crítico',`${percent(crit)} <span>× ${decimal(critMultiplier)}</span>`)}${stat('Alcance',`${decimal(unit.range)} m`)}${unit.perfectEvasion>0?stat('Esquiva perfeita',percent(unit.perfectEvasion)):''}</dl>${unit.inheritedAttributes?'<p class="target-base-note">Atributos herdados do invocador · '+Object.entries(unit.inheritedAttributes).map(([k,v])=>escapeHTML(k.toUpperCase())+' '+decimal(v)).join(' · ')+'</p>':''}
  ${resistances.length?`<div class="target-resistances"><h4>Resistências elementais</h4>${resistances.map(([key,value])=>`<span class="${value<0?'target-weakness':'target-resistance'}"><i style="color:${ELEMENTS[key].color}">${ELEMENTS[key].symbol}</i>${ELEMENTS[key].name} <b>${value>0?'+':''}${decimal(value*100)}%</b></span>`).join('')}</div>`:''}
  <div class="target-skills-heading"><h4>Técnicas</h4><span>${classification.detail}</span></div>
  ${skills.length?`<div class="target-skills">${skills.slice(0,5).map(key=>{const rank=clamp(finite(levelOf(unit,key),1),1,5),s=skillFor(unit,key)||skillAt(key,rank),controls=controlTypes(key,s),cooldown=Math.max(0,finite(unit.cooldowns?.[key])),rarity=Object.hasOwn(LOOT_RARITIES,unit.skillRarities?.[key])?LOOT_RARITIES[unit.skillRarities[key]]:LOOT_RARITIES.common,bonus=Math.round((rarity.quality-1)*100);return `<article class="target-skill" aria-label="${escapeHTML(s.name)}, nível ${rank}, ${rarity.name}${bonus?', potência adicional '+bonus+'%':''}${controls.length?', controle: '+controls.join(', '):''}"><span class="target-skill-icon">${icon(key)}</span><div><b>${escapeHTML(s.name)}</b><small>${s.kind==='passive'?'Passiva':'Ativa'}${cooldown>0?` · recarga ${Math.ceil(cooldown)}s`:''}</small><span class="target-skill-rarity" style="display:inline-block;font-size:7px;line-height:1.5;margin-top:4px;color:${rarity.color}">${rarity.name}${bonus?' · +'+bonus+'% potência':' · potência base'}</span>${controls.length?`<span class="target-cc" title="${controls.join(' · ')}"><i aria-hidden="true">✧</i> ${controls.join(' · ')}</span>`:''}</div><em>Nv. ${rank}</em></article>`;}).join('')}</div>${skills.length>5?`<p class="target-more-skills">+ ${skills.length-5} técnica${skills.length-5===1?'':'s'} na build deste herói.</p>`:''}`:'<p class="target-no-skills">Este animal usa ataques comuns e seus atributos.</p>'}
  ${meta?.description?`<p class="target-description">${escapeHTML(meta.description)}</p>`:''}<p class="target-footnote">Valores atuais da partida. Elementos e estados podem modificar o resultado do combate.</p>
 </section>`;
}
