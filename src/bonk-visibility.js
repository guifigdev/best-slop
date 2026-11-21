import * as T from 'three';

// Compact the same reusable draw batches rather than submitting an entire map.
// Cells reject distant groups cheaply; a sphere retains partially visible voxels.
export function createBonkVisibility({cellSize=24,margin=.6}={}){
 const batches=new Map(),terrains=new Map(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(),box=new T.Box3(),point=new T.Vector3();
 let totals={sourceInstances:0,visibleInstances:0,sourceTriangles:0,visibleTriangles:0,visibleCells:0,testedCells:0};
 function capture(mesh,count,{padding=0}={}){
  let entry=batches.get(mesh);if(!entry||entry.matrices.length<mesh.instanceMatrix.array.length)entry={matrices:new Float32Array(mesh.instanceMatrix.array.length),colors:mesh.instanceColor?new Float32Array(mesh.instanceColor.array.length):null,centers:new Float32Array(mesh.instanceMatrix.count*4),boxes:new Float32Array(mesh.instanceMatrix.count*6),cellCache:new Map(),bounds:new T.Box3()};
  if(mesh.instanceColor&&!entry.colors)entry.colors=new Float32Array(mesh.instanceColor.array.length);
  const {matrices,colors,centers,boxes,cellCache:cells,bounds}=entry;matrices.set(mesh.instanceMatrix.array.subarray(0,count*16));if(colors)colors.set(mesh.instanceColor.array.subarray(0,count*3));bounds.makeEmpty();for(const cell of cells.values()){cell.bounds.makeEmpty();cell.indices.length=0;}
  for(let i=0;i<count;i++){
   const n=i*16,x=matrices[n+12],y=matrices[n+13],z=matrices[n+14],r=Math.hypot(Math.hypot(matrices[n],matrices[n+1],matrices[n+2]),Math.hypot(matrices[n+4],matrices[n+5],matrices[n+6]),Math.hypot(matrices[n+8],matrices[n+9],matrices[n+10]))*.5+padding+margin;
   const ex=(Math.abs(matrices[n])+Math.abs(matrices[n+4])+Math.abs(matrices[n+8]))*.5+padding+margin,ey=(Math.abs(matrices[n+1])+Math.abs(matrices[n+5])+Math.abs(matrices[n+9]))*.5+padding+margin,ez=(Math.abs(matrices[n+2])+Math.abs(matrices[n+6])+Math.abs(matrices[n+10]))*.5+padding+margin;centers.set([x,y,z,r],i*4);boxes.set([x-ex,y-ey,z-ez,x+ex,y+ey,z+ez],i*6);const key=Math.floor(x/cellSize)+':'+Math.floor(z/cellSize);let cell=cells.get(key);if(!cell)cells.set(key,cell={bounds:new T.Box3(),indices:[]});cell.indices.push(i);point.set(x-ex,y-ey,z-ez);cell.bounds.expandByPoint(point);bounds.expandByPoint(point);point.set(x+ex,y+ey,z+ez);cell.bounds.expandByPoint(point);bounds.expandByPoint(point);
  }
  mesh.frustumCulled=true;mesh.boundingBox=bounds;mesh.boundingSphere=bounds.isEmpty()?new T.Sphere(new T.Vector3(),0):bounds.getBoundingSphere(new T.Sphere());
  entry.count=count;entry.cells=[...cells.values()].filter(c=>c.indices.length);batches.set(mesh,entry);mesh.userData.visibilitySourceCount=count;
 }
 function terrain(mesh,cells){
  const sourceCount=cells.reduce((n,c)=>n+c.indices.length,0),index=new T.BufferAttribute(new Uint32Array(sourceCount),1).setUsage(T.DynamicDrawUsage);let n=0;for(const c of cells){index.array.set(c.indices,n);n+=c.indices.length;}
  mesh.geometry.setIndex(index);mesh.geometry.setDrawRange(0,sourceCount);mesh.geometry.computeBoundingSphere();mesh.frustumCulled=true;terrains.set(mesh,{cells,sourceCount});
 }
 function update(camera){
  if(!camera)return;camera.updateMatrixWorld();projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
  totals={sourceInstances:0,visibleInstances:0,sourceTriangles:0,visibleTriangles:0,visibleCells:0,testedCells:0};
  for(const [mesh,entry]of batches){
   let count=0;totals.sourceInstances+=entry.count;
   for(const cell of entry.cells){totals.testedCells++;if(!frustum.intersectsBox(cell.bounds))continue;totals.visibleCells++;
    for(const i of cell.indices){const p=i*4;sphere.center.fromArray(entry.centers,p);sphere.radius=entry.centers[p+3];if(!frustum.intersectsSphere(sphere))continue;box.min.fromArray(entry.boxes,i*6);box.max.fromArray(entry.boxes,i*6+3);if(!frustum.intersectsBox(box))continue;mesh.instanceMatrix.array.set(entry.matrices.subarray(i*16,i*16+16),count*16);if(entry.colors)mesh.instanceColor.array.set(entry.colors.subarray(i*3,i*3+3),count*3);count++;}
   }
   mesh.count=count;mesh.instanceMatrix.clearUpdateRanges();if(count){mesh.instanceMatrix.addUpdateRange(0,count*16);mesh.instanceMatrix.needsUpdate=true;}if(mesh.instanceColor){mesh.instanceColor.clearUpdateRanges();if(count){mesh.instanceColor.addUpdateRange(0,count*3);mesh.instanceColor.needsUpdate=true;}}mesh.userData.visibilityVisibleCount=count;totals.visibleInstances+=count;
  }
  for(const [mesh,entry]of terrains){let count=0;totals.sourceTriangles+=entry.sourceCount/3;for(const cell of entry.cells){totals.testedCells++;box.copy(cell.bounds).expandByScalar(margin);if(!frustum.intersectsBox(box))continue;totals.visibleCells++;mesh.geometry.index.array.set(cell.indices,count);count+=cell.indices.length;}mesh.geometry.setDrawRange(0,count);mesh.geometry.index.clearUpdateRanges();if(count){mesh.geometry.index.addUpdateRange(0,count);mesh.geometry.index.needsUpdate=true;}totals.visibleTriangles+=count/3;}
 }
 return{capture,terrain,update,clear(mesh){batches.delete(mesh);terrains.delete(mesh);},reset(){batches.clear();terrains.clear();},stats(){return{...totals,batches:batches.size,terrainMeshes:terrains.size};}};
}
