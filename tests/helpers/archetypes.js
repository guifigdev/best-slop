import {HEROES,SKILLS} from '../../shared/catalog.js';

// Tests choose a legal actor for the mechanic under test; no mixed builds are
// smuggled into acquisition/cast fixtures to bypass the production rule.
export function heroForSkill(key,{differentStarter=false}={}){
 const skill=SKILLS[key];if(!skill)throw Error(`Unknown fixture skill: ${key}`);
 const found=Object.keys(HEROES).find(type=>skill.allowedArchetypes.includes(HEROES[type].archetype)&&(!differentStarter||HEROES[type].skill!==key));
 if(!found)throw Error(`No compatible fixture hero for ${key}`);return found;
}
