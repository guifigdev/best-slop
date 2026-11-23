import {roSkillIsAvailable} from './ro-skill-policy.js';
import {RO_SKILLS,roBasicAttack} from './ragnarok-jobs.js';
import {BONK_RULES} from './bonk-catalog.js';
import {roEnchantOffers} from './ro-equipment-enchants.js';
import {RO_LEARNED_SKILL_LIMIT,RO_ACTIVE_SLOT_COUNT,roActiveSkillKeys} from './ro-skill-loadout.js';

export function roSkillOfferPool(unit){
 const build=unit.bonkBuild,entries=[],active=roActiveSkillKeys(unit);
 for(const key of ['basic',...Object.keys(RO_SKILLS)]){
  const definition=key==='basic'?roBasicAttack(unit):RO_SKILLS[key],level=build.weapons[key]||0;
  if(!definition||key!=='basic'&&!roSkillIsAvailable(unit,definition)||level>=BONK_RULES.maxWeaponLevel||!level&&Object.keys(build.weapons).length>=RO_LEARNED_SKILL_LIMIT)continue;
  const passive=definition.kind==='passive';
  entries.push({kind:'weapon',key,name:definition.name,description:definition.description+(passive?' Passiva: funciona sem ocupar a barra.':!level&&active.length>=RO_ACTIVE_SLOT_COUNT?' Fica aprendida; equipe no menu Habilidades.':''),skill:definition.skill,level:level+1,passive});
 }
 entries.push(...roEnchantOffers(unit));
 if(!entries.length)entries.push({kind:'heal',key:'feast',name:'Maçã de Yggdrasil',description:'Recupere 35% de vida e receba 25 Zeny.',skill:'heal',level:1});
 return entries;
}
export function drawRoSkillOffers(unit,random=Math.random){
 const pool=roSkillOfferPool(unit),choices=[];
 const identity=entry=>{if(entry.kind!=='weapon')return entry.kind+':'+entry.key;const d=entry.key==='basic'?roBasicAttack(unit):RO_SKILLS[entry.key];return [d?.kind,d?.element,d?.role||'attack'].join(':');};
 const draw=kind=>{const candidates=pool.map((entry,i)=>({entry,i})).filter(({entry})=>!kind||entry.kind===kind),used=new Set(choices.map(identity)),distinct=candidates.filter(({entry})=>!used.has(identity(entry))),eligible=distinct.length?distinct:candidates;if(!eligible.length)return false;
  const weights=eligible.map(({entry})=>entry.kind==='weapon'&&entry.level===1?2:1),total=weights.reduce((a,b)=>a+b,0);let value=Math.min(.999999,Math.max(0,random()))*total,index=0;while(index<weights.length-1&&value>=weights[index])value-=weights[index++];choices.push(pool.splice(eligible[index].i,1)[0]);return true;};
 draw('weapon');draw('weapon');draw('tome');while(choices.length<4&&pool.length)draw();return choices;
}
