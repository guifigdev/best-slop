export const ACTOR_LOD=Object.freeze({nearDistance:32,farDistance:65,middleHz:15,farHz:8});
// Presentation only. Root translation, facing, HP, selection and gameplay are
// still updated every frame. Important actions keep full pose sampling.
export function actorPoseLod(unit,focus,time,{enabled=true,selected=false}={}){
 const important=unit.hero||unit.bonkHero||unit.bonkBoss||unit.boss||!unit.alive||selected||unit.roCasting||time-(unit.attackAt??-10)<.8||time-(unit.hitAt??-10)<.35;
 if(!enabled||important||!unit.bonkEnemy||!focus)return{level:0,bucket:time};
 const distance=Math.hypot(unit.x-focus.x,unit.z-focus.z);if(distance<ACTOR_LOD.nearDistance)return{level:0,bucket:time};
 const level=distance<ACTOR_LOD.farDistance?1:2,hz=level===1?ACTOR_LOD.middleHz:ACTOR_LOD.farHz;
 return{level,bucket:Math.floor(time*hz+(Number(unit.id)||0)*.17)};
}
