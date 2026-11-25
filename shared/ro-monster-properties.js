import {RO_MONSTER_PROPERTIES} from './ro-monster-properties-data.js';
import {MONSTER_HABITATS} from './ragnarok-habitats.js';
export const roMonsterProperties=unit=>RO_MONSTER_PROPERTIES[unit?.roSourceId||MONSTER_HABITATS[unit?.ragnarokMvp||unit?.dungeonSpecies||unit?.ragnarokVisual]?.sourceId]||null;
export const roCanonicalElement=e=>({physical:'neutral',ice:'water',lightning:'wind',arcane:'ghost'})[e]||e||'neutral';
export const RO_WEAPON_SIZE=Object.freeze({dagger:[1,.75,.5],sword:[.75,1,.75],twohandedsword:[.75,.75,1],spear:[.75,.75,1],axe:[.5,.75,1],mace:[.75,1,1],staff:[1,1,1],bow:[1,1,.75],katar:[.75,1,.75],knuckle:[1,.75,.5],instrument:[.75,1,.75],book:[1,1,.5]});
export function roMonsterDamageMultiplier(enemy,element,{physical=false,weaponType=null,hands=1,mounted=false,power=0,ignoreSize=false}={}){const d=roMonsterProperties(enemy);if(!d)return 1;const property=d.multipliers[roCanonicalElement(element)]??1,kind=weaponType==='sword'&&hands===2?'twohandedsword':weaponType,size=physical&&weaponType?(RO_WEAPON_SIZE[kind]||[1,1,1])[['small','medium','large'].indexOf(d.size)]:1;return property*(ignoreSize?1:mounted&&kind==='spear'?1:size)*(1+Math.max(0,power));}
// Renewal hard DEF/MDEF curve. Soft defence remains a separate subtraction.
export function roDefenseDamage(raw,hard=0,soft=0,magic=false){hard=Math.max(0,hard);const base=magic?1000:4000;return Math.max(0,raw*(base+hard)/(base+hard*10)-Math.max(0,soft));}

const armorProperties=Object.fromEntries(Object.values(RO_MONSTER_PROPERTIES).filter(d=>d.elementLevel===1).map(d=>[d.element,d.multipliers]));
export const roArmorPropertyMultiplier=(armorElement,incoming)=>armorElement?(armorProperties[armorElement]?.[roCanonicalElement(incoming)]??1):1;
