import {RO_SKILLS,roLineage,roBasicAttack,roSkillTier} from './ragnarok-jobs.js';
import {BONK_TOMES,BONK_RULES} from './bonk-catalog.js';
import {RO_LEARNED_SKILL_LIMIT,roActiveSkillKeys} from './ro-skill-loadout.js';

export function roSkillOfferPool(unit){
 const build=unit.bonkBuild,entries=[],lineage=roLineage(unit.roLineage),active=roActiveSkillKeys(unit);
 for(const key of ['basic',...lineage.skills]){
  const definition=key==='basic'?roBasicAttack(unit):RO_SKILLS[key],level=build.weapons[key]||0;
  if(!definition||(key==='basic'?0:roSkillTier(unit.roLineage,key))>(unit.roTier||0)||level>=BONK_RULES.maxWeaponLevel||!level&&Object.keys(build.weapons).length>=RO_LEARNED_SKILL_LIMIT)continue;
  const passive=definition.kind==='passive';
  entries.push({kind:'weapon',key,name:definition.name,description:definition.description+(passive?' Passiva: funciona sem ocupar a barra.':!level&&active.length>=4?' Fica aprendida; equipe no menu Habilidades.':''),skill:definition.skill,level:level+1,passive});
 }
 for(const [key,definition]of Object.entries(BONK_TOMES)){const level=build.tomes[key]||0;if(level<BONK_RULES.maxTomeLevel&&(level||Object.keys(build.tomes).length<BONK_RULES.tomeSlots))entries.push({kind:'tome',key,name:definition.name,description:definition.description,skill:definition.skill,level:level+1});}
 if(!entries.length)entries.push({kind:'heal',key:'feast',name:'Maçã de Yggdrasil',description:'Recupere 35% de vida e receba 25 Zeny.',skill:'heal',level:1});
 return entries;
}
export function drawRoSkillOffers(unit,random=Math.random){
 const pool=roSkillOfferPool(unit),choices=[];
 const draw=kind=>{const eligible=pool.map((entry,i)=>({entry,i})).filter(({entry})=>!kind||entry.kind===kind);if(!eligible.length)return false;
  const weights=eligible.map(({entry})=>entry.kind==='weapon'&&entry.level===1?2:1),total=weights.reduce((a,b)=>a+b,0);let value=Math.min(.999999,Math.max(0,random()))*total,index=0;while(index<weights.length-1&&value>=weights[index])value-=weights[index++];choices.push(pool.splice(eligible[index].i,1)[0]);return true;};
 draw('weapon');draw('weapon');draw('tome');while(choices.length<4&&pool.length)draw();return choices;
}
