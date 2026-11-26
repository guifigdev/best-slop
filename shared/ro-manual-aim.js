export const RO_MANUAL_AIM_LEASE=.55;
export function validateRoManualAim(game,unit,value){
 if(!value||!Number.isFinite(value.x)||!Number.isFinite(value.z)||Math.abs(value.x)>115||Math.abs(value.z)>115)return null;
 if(value.target!==undefined&&(!Number.isSafeInteger(value.target)||!game.units.some(e=>e.id===value.target&&e.bonkEnemy&&e.alive)))return null;
 return{x:value.x,z:value.z,...(value.target!==undefined?{target:value.target}:{})};
}
export const activeRoManualAim=(game,unit)=>unit?.roManualAim?.until>(game?.bonk?.elapsed||0)?unit.roManualAim:null;
export function roManualAimPoint(unit,aim,range){
 const dx=aim.x-unit.x,dz=aim.z-unit.z,length=Math.hypot(dx,dz);if(length<.001)return{x:unit.x+Math.sin(unit.facing||0)*range,z:unit.z+Math.cos(unit.facing||0)*range};
 const distance=Math.min(range,length);return{x:unit.x+dx/length*distance,z:unit.z+dz/length*distance};
}
export function roAimTarget(unit,targets,aim,range){
 const selected=targets.find(e=>e.id===aim.target);if(selected)return selected;
 const point=roManualAimPoint(unit,aim,range),dx=point.x-unit.x,dz=point.z-unit.z,length=Math.hypot(dx,dz)||1;
 return targets.filter(e=>{const x=e.x-unit.x,z=e.z-unit.z,along=(x*dx+z*dz)/length,side=Math.abs(x*dz-z*dx)/length;return along>0&&along<=range+(e.collisionRadius||.4)&&side<=Math.max(.65,e.collisionRadius||.4);}).sort((a,b)=>Math.hypot(a.x-unit.x,a.z-unit.z)-Math.hypot(b.x-unit.x,b.z-unit.z))[0]||null;
}
