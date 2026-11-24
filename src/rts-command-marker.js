const direct=new Set(['move','attackMove','cfMove','ktMove','ttMove','wlMove','pkMove']);
export function rtsMovementMarkerPoint(command){
 if(!command||!Number.isFinite(command.x)||!Number.isFinite(command.z))return null;
 if(direct.has(command.type)||['ttUnitBatch','ktUnitBatch'].includes(command.type)&&command.action==='move')return {x:command.x,z:command.z};
 return null;
}
