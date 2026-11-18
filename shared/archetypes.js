import {HEROES,SKILLS} from './catalog.js';

export const ARCHETYPES=Object.freeze({
 physical_melee:Object.freeze({id:'physical_melee',name:'Físico corpo a corpo',attackType:'physical',style:'melee'}),
 physical_ranged:Object.freeze({id:'physical_ranged',name:'Físico à distância',attackType:'physical',style:'ranged'}),
 magic:Object.freeze({id:'magic',name:'Mágico',attackType:'magic',style:'spellcaster'})
});
export function heroArchetype(u){return typeof u?.hero==='string'&&Object.hasOwn(HEROES,u.hero)?HEROES[u.hero].archetype:null;}

// Compatibility intentionally excludes level, mana, cooldown and ownership.
// Native monsters and pets keep their authored loadouts regardless of range.
export function skillCompatibility(u,key){
 const skill=typeof key==='string'&&Object.hasOwn(SKILLS,key)?SKILLS[key]:null;
 const base={archetype:heroArchetype(u),allowedArchetypes:skill?[...skill.allowedArchetypes]:[],label:skill?.compatibilityLabel||'Indisponível',skillStyle:skill?.skillStyle||null};
 if(!skill)return{...base,allowed:false,code:'unknown-skill',reason:'Habilidade desconhecida.'};
 if(!u||typeof u!=='object')return{...base,allowed:false,code:'missing-unit',reason:'Escolha um herói.'};
 if(!u.hero)return{...base,allowed:true,code:'native-loadout',reason:null};
 if(!base.archetype)return{...base,allowed:false,code:'unknown-hero',reason:'Arquétipo do herói desconhecido.'};
 const allowed=skill.allowedArchetypes.includes(base.archetype);
 return{...base,allowed,code:allowed?'compatible':'incompatible-archetype',reason:allowed?null:`${skill.name}: ${skill.compatibilityLabel.toLowerCase()}. Seu herói é ${ARCHETYPES[base.archetype].name.toLowerCase()}.`};
}
export const canUseSkill=(u,key)=>skillCompatibility(u,key).allowed;
