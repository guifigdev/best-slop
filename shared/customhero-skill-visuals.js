import {elementImpactRequest} from './element-skill-visuals.js';
// Visual references were inspected before authoring. These are faithful
// silhouettes/choreography adaptations, not extracted Warcraft III models.
export const CUSTOMHERO_SKILL_REFERENCES=Object.freeze({
 stormbolt:'https://classic.battle.net/war3/human/units/mountainking.shtml',
 chain:'https://classic.battle.net/war3/orc/units/farseer.shtml',
 summon:'https://classic.battle.net/war3/images/orc/screens/ss018.jpg',
 blizzard:'https://classic.battle.net/war3/images/human/screens/ss011.jpg',
 stomp:'https://classic.battle.net/war3/images/orc/screens/ss002.jpg',
 heal:'https://classic.battle.net/war3/human/units/paladin.shtml',
 shockwave:'https://classic.battle.net/war3/orc/units/taurenchieftain.shtml'
});
export const CUSTOMHERO_SKILL_BUDGET=Object.freeze({effects:40,quads:768,triangles:6144,drawCalls:2,atlasSize:512,atlasCells:16,maxDistance:72,animationHz:24,history:256,loadConcurrency:2});
const modes=new Set(['campaign','tower','best','war','dungeon','linewars']);
const direct=Object.freeze({stomp:'stomp',heal:'heal',fountainHeal:'heal',summon:'summon',blizzard:'blizzard',fireball:'fire',frostnova:'frost',shockwave:'shockwave',forcepush:'force',drain:'drain',hook:'hook',blink:'blink',swap:'blink',shield:'shield',avatar:'avatar',cleave:'cleave',thunder:'thunder',flamebreath:'breath',dash:'dash'});
const summons=new Set(['summon','scarabs','odinsravens','thorsgoats','freyjascat','helguard']);
const skillFamilies=Object.freeze({heal:'heal',freyjasgrace:'heal',bolt:'stormbolt',chain:'chain',thorsjudgment:'thunder',stormdive:'thunder',helsfrost:'frost',frostnova:'frost',icewall:'frost',fireball:'fire',gungnir:'shockwave',shield:'shield',runicbarrier:'shield',spiritward:'shield',avatar:'avatar',weakeninghowl:'howl'});
export const isCustomHeroSkillMode=state=>modes.has(state?.options?.mode||'campaign');
/** Pure presentation policy: never infer a spell from a damage number, never
 * take over native RO skills, basic attacks, or enemy danger/warning events. */
export function customHeroSkillVisual(event,state){
 if(!event||!isCustomHeroSkillMode(state)||event.bonk||event.basicAttack||event.enemy||event.skillKey?.startsWith('ro_'))return null;
 const skill=event.skill||event.skillKey,type=event.type;
 if(elementImpactRequest(event,state,state?.time??event.time))return null;
 if(event.type==='frostnova')return null; // Shared approved ice and historical vapor.
 if(event.element==='water'||['waterball','splash','watersurge','earthspike','rockfall','earthquake'].includes(type))return null; // Coupled fluid/earth renderer owns these.
 if(type==='cast')return null; // The launch cue must not duplicate the contact.
 if(type==='bolt')return{family:skill==='bolt'?'stormbolt':'chain',duration:skill==='bolt'?.65:.44};
 if(type==='abilityPulse'){
  const family=skillFamilies[skill];return family?{family,duration:family==='heal'?1.05:.85}:null;
 }
 if(type==='summon')return{family:'summon',duration:1.15,skill:summons.has(skill)?skill:'summon'};
 if(type==='gravity'||type==='venomcloud')return{family:type==='gravity'?'gravity':'poison',duration:Math.min(12,Math.max(.1,event.duration||3))};
 if(type==='abilityField'&&['fire','ice'].includes(event.element))return{family:'field',duration:Math.min(8,Math.max(.1,event.duration||3))};
 const family=direct[type];if(!family)return null;
 return{family,duration:type==='blizzard'?Math.min(20,Math.max(1,event.duration||16)):family==='heal'?1.05:family==='shield'?1.15:family==='avatar'?1.3:family==='blink'?.7:.85};
}
export function customHeroSkillEventKey(event){return String(event.id??[event.type,event.source,event.x,event.z].join(':'))+':'+event.time;}
