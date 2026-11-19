const released=new WeakSet();

// A skin can turn a simulation arrow into a melee slash. Snapshot refreshes
// update its live data, but must retain the kind of geometry already created.
export function refreshEffectEvent(entry,event){
 const {type,projectileKind}=entry.e;
 entry.e={...event,type,projectileKind};
}

// Removing an InstancedMesh from the scene does not release its GPU instance
// buffers. Dispose those objects, but keep borrowed projectile geometry/materials.
export function releaseEffect(entry){
 if(!entry||released.has(entry))return;
 released.add(entry);
 entry.group?.traverse(object=>{if(object.isInstancedMesh)object.dispose();});
 entry.group?.removeFromParent();
 for(const resource of new Set(entry.owned||[]))resource.dispose();
}
