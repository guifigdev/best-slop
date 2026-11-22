// Density only. Enemy HP, damage, drops and the Endless Tower roster are untouched.
export const RO_HORDE_SPAWN_RULES=Object.freeze({opening:10,ambientOpening:8,pack:2,maxPerTick:2,arrivalMultiplier:1.65,minimumInterval:.12,ambientInterval:3.2,ambientCap:28,radiusMin:26,radiusSpread:12,minimumSafeDistance:12,candidates:12});
export function roHordeSpawnPlan({elapsed=0,progress=0,cleared=false,aliveBudget=280}={}){
 const R=RO_HORDE_SPAWN_RULES,oldInterval=Math.max(.095,.5-Math.max(0,elapsed)*.0007-Math.max(0,progress)*.07);
 return{opening:cleared?R.ambientOpening:R.opening,pack:R.pack,interval:cleared?R.ambientInterval:Math.max(R.minimumInterval,oldInterval*R.pack/R.arrivalMultiplier),cap:Math.min(aliveBudget,cleared?R.ambientCap:aliveBudget),elite:!cleared};
}
export function roHordeOpeningPoint(index,count,hero,random=Math.random){
 const pack=Math.floor(index/2),packs=Math.ceil(count/2),angle=(pack/Math.max(1,packs-1)-.5)*Math.PI*.9,radius=21+random()*5,side=(index%2-.5)*2.8;
 return{x:hero.x+Math.sin(angle)*radius+Math.cos(angle)*side,z:hero.z-Math.cos(angle)*radius+Math.sin(angle)*side};
}
export function roHordePackPoint(index,count,hero,angle,radius){const side=(index-(count-1)/2)*2.8;return{x:hero.x+Math.sin(angle)*radius+Math.cos(angle)*side,z:hero.z+Math.cos(angle)*radius-Math.sin(angle)*side};}
