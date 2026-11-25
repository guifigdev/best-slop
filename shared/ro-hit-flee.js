import {RO_MONSTER_ACCURACY} from './ro-monster-accuracy-data.js';
import {MONSTER_HABITATS} from './ragnarok-habitats.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function roMonsterAccuracy(enemy){
 const id=enemy?.roSourceId||MONSTER_HABITATS[enemy?.ragnarokMvp||enemy?.dungeonSpecies||enemy?.ragnarokVisual]?.sourceId;
 return RO_MONSTER_ACCURACY[id]||{hit:150+(enemy?.level||1)+Math.max(1,enemy?.dex||1),flee:100+(enemy?.level||1)+Math.max(1,enemy?.agi||1)};
}
// Renewal: HIT - target FLEE, capped to 5..100 percent. LATAM's published
// "HIT for 100%" and "FLEE for 95%" retain its server-specific monster values.
export const roPhysicalHitChance=(hit,flee,bonus=0)=>clamp(hit-flee+bonus,5,100)/100;
export const roHeroHitChance=(stats,enemy,bonus=0)=>Math.min(1,(stats.perfectHit||0)+(1-Math.min(1,stats.perfectHit||0))*roPhysicalHitChance(stats.hit,roMonsterAccuracy(enemy).flee,bonus));
export const roEnemyHitChance=(enemy,stats)=>roPhysicalHitChance(roMonsterAccuracy(enemy).hit,stats.flee);
