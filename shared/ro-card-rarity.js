import {LOOT_RARITIES} from './rarity.js';
import {RO_TOWER_DROP_MAP} from './ragnarok-tower-drops.js';
import {RO_MONSTER_PROPERTIES} from './ro-monster-properties-data.js';

// Local collection grades use Custom Hero's palette. Drop probability is unchanged.
export function roCardRarity(card){
 if(card?.rarity&&Object.hasOwn(LOOT_RARITIES,card.rarity))return card.rarity;
 const level=Math.max(1,...(card?.monsters||[]).map(key=>RO_MONSTER_PROPERTIES[RO_TOWER_DROP_MAP[key]?.sourceId]?.level||1));
 return card?.mvp?(level>=140?'heroic':'legendary'):level>=100?'epic':level>=50?'rare':'common';
}
export const roCardRarityVisual=card=>LOOT_RARITIES[roCardRarity(card)];
