import {skillAt,levelOf} from './catalog.js';
const POWER={common:1,rare:1.05,epic:1.1,legendary:1.15,heroic:1.2};
const BENEFITS=['extraAttack','damageBonus','manaBurn','damage','heal','burn','poison','armor','hp','shield','distance','chance','multiplier','evasion','reflect','lifesteal','attackSpeed','moveSpeed','manaRegen','cleave','retention','rageDamage','rageSpeed','summonHp','summonDamage'];
export function skillFor(u,key){const base=skillAt(key,levelOf(u,key));if(!base)return base;const power=POWER[u?.skillRarities?.[key]]||1;if(power===1)return base;const s={...base};for(const field of BENEFITS)if(Number.isFinite(s[field]))s[field]*=power;if(s.kind==='active'&&s.cooldown>0)s.cooldown/=power;return s;}
