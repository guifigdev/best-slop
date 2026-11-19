import {CUSTOM_HERO_IDENTITIES} from '../shared/hero-identities.js';

// Project the existing combat event into the new skin without changing the
// event owned by the simulation, hit resolution, damage or attack timings.
export function customHeroAttackEffect(event,source){
 if(!source?.hero||!Object.hasOwn(CUSTOM_HERO_IDENTITIES,source.hero)||source.castleBuilderKey||source.treeTagCharacter||source.warlockCharacter||source.kodoTagCharacter)return event;
 if(event.basicAttack&&event.type==='arrow'&&source.range<3&&['knight','turtle','raccoon'].includes(source.hero))return{...event,type:'slash',projectileKind:null};
 if(!['arrow','bounce'].includes(event.type)||!event.basicAttack&&event.type!=='bounce'&&event.skill!=='multishot')return event;
 return{...event,projectileKind:['mage','owl'].includes(source.hero)?'arcane':'arrow'};
}
