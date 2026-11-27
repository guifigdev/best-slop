import {RO_MONSTER_WALK_MS} from './ro-monster-walk-data.js';
export const RO_BASE_MOVE_SPEED=5;
// Ragnarok's unmodified player takes 150ms per cell. Preserve each species'
// ratio to that player when translating cells to our world-space units.
// Player reference: https://github.com/rathena/rathena/blob/6b917c1808cc93c65f27f47079b2c58a11df7c6c/src/common/mmo.hpp#L87
export const RO_PLAYER_WALK_MS=150;
export function roMonsterMoveSpeed(sourceId,{stationary=false,fallback=3.5,difficultySpeed=.96}={}){
 if(stationary)return 0;
 const delay=RO_MONSTER_WALK_MS[sourceId],base=delay>0?RO_BASE_MOVE_SPEED*RO_PLAYER_WALK_MS/delay:fallback;
 return base*(difficultySpeed/.96);
}
