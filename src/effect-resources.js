const released=new WeakSet();

// Removing an InstancedMesh from the scene does not release its GPU instance
// buffers. Dispose those objects, but keep borrowed projectile geometry/materials.
export function releaseEffect(entry){
 if(!entry||released.has(entry))return;
 released.add(entry);
 entry.group?.traverse(object=>{if(object.isInstancedMesh)object.dispose();});
 entry.group?.removeFromParent();
 for(const resource of new Set(entry.owned||[]))resource.dispose();
}
