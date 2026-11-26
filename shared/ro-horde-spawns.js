// Steady small groups keep exploration populated without unlimited crowd growth.
export const RO_HORDE_SPAWN_RULES=Object.freeze({opening:10,ambientOpening:8,pack:3,maxPerTick:3,minimumInterval:1.3,ambientInterval:3.5,ambientCap:20,radiusMin:26,radiusSpread:12,minimumSafeDistance:12,candidates:12});
export function roHordeSpawnPlan({elapsed=0,progress=0,cleared=false,aliveBudget=280}={}){const R=RO_HORDE_SPAWN_RULES;return{opening:cleared?R.ambientOpening:R.opening,pack:R.pack,interval:cleared?R.ambientInterval:Math.max(R.minimumInterval,2.4-Math.max(0,progress)*.05-Math.min(900,Math.max(0,elapsed))*.0006),cap:Math.min(aliveBudget,cleared?R.ambientCap:32+Math.min(24,Math.max(0,progress)*2)),elite:!cleared};}
export function roHordeOpeningPoint(index,count,hero,random=Math.random){
 const pack=Math.floor(index/2),packs=Math.ceil(count/2),angle=(pack/Math.max(1,packs-1)-.5)*Math.PI*.9,radius=21+random()*5,side=(index%2-.5)*2.8;
 return{x:hero.x+Math.sin(angle)*radius+Math.cos(angle)*side,z:hero.z-Math.cos(angle)*radius+Math.sin(angle)*side};
}
export function roHordePackPoint(index,count,hero,angle,radius){const side=(index-(count-1)/2)*2.8;return{x:hero.x+Math.sin(angle)*radius+Math.cos(angle)*side,z:hero.z+Math.cos(angle)*radius-Math.sin(angle)*side};}
