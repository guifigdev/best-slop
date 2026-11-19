// The reference catalog keeps distances in native units / 256. These voxel
// models and the expanded battlefield need a separate, explicit combat scale.
export const CASTLE_RANGED_SCALE=3;
const cache=new WeakMap();
export function castleCombatRange(range){return Number.isFinite(range)&&range>200/256?range*CASTLE_RANGED_SCALE:range;}
export function castleFlightHeight(unit){
 if(!unit?.flying)return 0;
 const name=String(unit.name||'').toLowerCase();
 return /dragon|drake|wyrm/.test(name)?5.3:/roterothopter|gyrocopter/.test(name)?4.4:4.6;
}
export function castleCombatProfile(source){
 if(!source||typeof source!=='object'||source.castleSpatialScale===CASTLE_RANGED_SCALE)return source;
 if(cache.has(source))return cache.get(source);
 const profile={...source,castleSpatialScale:CASTLE_RANGED_SCALE,range:castleCombatRange(source.range),altitude:castleFlightHeight(source)};
 if(Array.isArray(source.weapons))profile.weapons=source.weapons.map(w=>({...w,range:castleCombatRange(w.range)}));
 cache.set(source,profile);return profile;
}
