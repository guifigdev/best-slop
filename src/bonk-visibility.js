import * as T from 'three';

// Compact the same reusable draw batches rather than submitting an entire map.
// Cells reject distant groups cheaply; a sphere retains partially visible voxels.
export function createBonkVisibility({cellSize=24,margin=.6}={}){
 const batches=new Map(),terrains=new Map(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(),box=new T.Box3(),point=new T.Vector3();
 let cameraVersion=0,lastProjection=null,lastDistance=-1;
 let totals={sourceInstances:0,visibleInstances:0,sourceTriangles:0,visibleTriangles:0,visibleCells:0,testedCells:0};
 function capture(mesh,count,{padding=0}={}){
  let entry=batches.get(mesh);if(!entry||entry.matrices.length<mesh.instanceMatrix.array.length)entry={matrices:new Float32Array(mesh.instanceMatrix.array.length),colors:mesh.instanceColor?new Float32Array(mesh.instanceColor.array.length):null,centers:new Float32Array(mesh.instanceMatrix.count*4),boxes:new Float32Array(mesh.instanceMatrix.count*6),cellCache:new Map(),bounds:new T.Box3()};
  if(mesh.instanceColor&&!entry.colors)entry.colors=new Float32Array(mesh.instanceColor.array.length);
  entry.extras??=new Map();for(const [name,attribute]of Object.entries(mesh.geometry.attributes)){if(!attribute.isInstancedBufferAttribute)continue;let source=entry.extras.get(name);if(!source||source.data.length!==attribute.array.length)entry.extras.set(name,source={attribute,data:new attribute.array.constructor(attribute.array.length)});source.attribute=attribute;source.data.set(attribute.array);}
  const {matrices,colors,centers,boxes,cellCache:cells,bounds}=entry;matrices.set(mesh.instanceMatrix.array.subarray(0,count*16));if(colors)colors.set(mesh.instanceColor.array.subarray(0,count*3));bounds.makeEmpty();for(const cell of cells.values()){cell.bounds.makeEmpty();cell.indices.length=0;}
  for(let i=0;i<count;i++){
   const n=i*16,x=matrices[n+12],y=matrices[n+13],z=matrices[n+14],r=Math.hypot(Math.hypot(matrices[n],matrices[n+1],matrices[n+2]),Math.hypot(matrices[n+4],matrices[n+5],matrices[n+6]),Math.hypot(matrices[n+8],matrices[n+9],matrices[n+10]))*.5+padding+margin;
   const ex=(Math.abs(matrices[n])+Math.abs(matrices[n+4])+Math.abs(matrices[n+8]))*.5+padding+margin,ey=(Math.abs(matrices[n+1])+Math.abs(matrices[n+5])+Math.abs(matrices[n+9]))*.5+padding+margin,ez=(Math.abs(matrices[n+2])+Math.abs(matrices[n+6])+Math.abs(matrices[n+10]))*.5+padding+margin;centers.set([x,y,z,r],i*4);boxes.set([x-ex,y-ey,z-ez,x+ex,y+ey,z+ez],i*6);const key=Math.floor(x/cellSize)+':'+Math.floor(z/cellSize);let cell=cells.get(key);if(!cell)cells.set(key,cell={bounds:new T.Box3(),indices:[]});cell.indices.push(i);point.set(x-ex,y-ey,z-ez);cell.bounds.expandByPoint(point);bounds.expandByPoint(point);point.set(x+ex,y+ey,z+ez);cell.bounds.expandByPoint(point);bounds.expandByPoint(point);
  }
  mesh.frustumCulled=true;mesh.boundingBox=bounds;mesh.boundingSphere=bounds.isEmpty()?new T.Sphere(new T.Vector3(),0):bounds.getBoundingSphere(new T.Sphere());
  entry.dirty=true;entry.selected??=new Int32Array(mesh.instanceMatrix.count);entry.nextSelected??=new Int32Array(mesh.instanceMatrix.count);entry.visibleCount??=-1;entry.count=count;entry.cells=[...cells.values()].filter(c=>c.indices.length);batches.set(mesh,entry);mesh.userData.visibilitySourceCount=count;
 }
 function terrain(mesh,cells){
  const sourceCount=cells.reduce((n,c)=>n+c.indices.length,0),index=mesh.geometry.index?.array.length>=sourceCount?mesh.geometry.index:new T.BufferAttribute(new Uint32Array(sourceCount),1).setUsage(T.DynamicDrawUsage);let n=0;for(const c of cells){index.array.set(c.indices,n);n+=c.indices.length;}index.needsUpdate=true;
  mesh.geometry.setIndex(index);mesh.geometry.setDrawRange(0,sourceCount);mesh.geometry.computeBoundingSphere();mesh.frustumCulled=true;terrains.set(mesh,{cells,sourceCount,selected:[],visibleCount:-1});
 }
 function update(camera,{maxDistance=Infinity}={}){
  if(!camera)return;camera.updateMatrixWorld();projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
  const limit=Number.isFinite(maxDistance)?Math.max(1,maxDistance):Infinity;
  if(!lastProjection||lastDistance!==limit||projection.elements.some((n,i)=>n!==lastProjection[i])){cameraVersion++;lastProjection=projection.elements.slice();lastDistance=limit;}
  totals={sourceInstances:0,visibleInstances:0,sourceTriangles:0,visibleTriangles:0,visibleCells:0,testedCells:0,uploadedInstances:0,uploadedTerrainIndices:0,reusedBatches:0};
  for(const [mesh,entry]of batches){
   totals.sourceInstances+=entry.count;
   if(!entry.dirty&&entry.cameraVersion===cameraVersion){totals.visibleInstances+=entry.visibleCount;totals.visibleCells+=entry.visibleCells;totals.testedCells+=entry.cells.length;totals.reusedBatches++;continue;}
   let count=0,visibleCells=0,changed=entry.dirty;
   for(const cell of entry.cells){totals.testedCells++;if(!frustum.intersectsBox(cell.bounds)||cell.bounds.distanceToPoint(camera.position)>limit)continue;visibleCells++;
    for(const i of cell.indices){const p=i*4;sphere.center.fromArray(entry.centers,p);sphere.radius=entry.centers[p+3];if(!frustum.intersectsSphere(sphere)||sphere.center.distanceTo(camera.position)-sphere.radius>limit)continue;box.min.fromArray(entry.boxes,i*6);box.max.fromArray(entry.boxes,i*6+3);if(!frustum.intersectsBox(box))continue;entry.nextSelected[count]=i;if(entry.selected[count]!==i)changed=true;count++;}
   }
   changed ||= count!==entry.visibleCount;
   if(changed){
    for(let at=0;at<count;at++){const i=entry.nextSelected[at];mesh.instanceMatrix.array.set(entry.matrices.subarray(i*16,i*16+16),at*16);if(entry.colors)mesh.instanceColor.array.set(entry.colors.subarray(i*3,i*3+3),at*3);for(const {attribute,data}of entry.extras.values()){const size=attribute.itemSize;attribute.array.set(data.subarray(i*size,i*size+size),at*size);}}
    mesh.instanceMatrix.clearUpdateRanges();if(count){mesh.instanceMatrix.addUpdateRange(0,count*16);mesh.instanceMatrix.needsUpdate=true;}if(mesh.instanceColor){mesh.instanceColor.clearUpdateRanges();if(count){mesh.instanceColor.addUpdateRange(0,count*3);mesh.instanceColor.needsUpdate=true;}}
    for(const {attribute}of entry.extras.values()){attribute.clearUpdateRanges();if(count){attribute.addUpdateRange(0,count*attribute.itemSize);attribute.needsUpdate=true;}}
    totals.uploadedInstances+=count;
   }else totals.reusedBatches++;
   [entry.selected,entry.nextSelected]=[entry.nextSelected,entry.selected];entry.visibleCount=count;entry.visibleCells=visibleCells;entry.cameraVersion=cameraVersion;entry.dirty=false;mesh.count=count;mesh.userData.visibilityVisibleCount=count;totals.visibleInstances+=count;totals.visibleCells+=visibleCells;
  }
  for(const [mesh,entry]of terrains){
   totals.sourceTriangles+=entry.sourceCount/3;totals.testedCells+=entry.cells.length;
   if(entry.cameraVersion===cameraVersion){totals.visibleTriangles+=entry.visibleCount/3;totals.visibleCells+=entry.selected.length;continue;}
   let count=0;const selected=[];for(let i=0;i<entry.cells.length;i++){const cell=entry.cells[i];box.copy(cell.bounds).expandByScalar(margin);if(!frustum.intersectsBox(box)||box.distanceToPoint(camera.position)>limit)continue;selected.push(i);count+=cell.indices.length;}
   if(count!==entry.visibleCount||selected.length!==entry.selected.length||selected.some((n,i)=>n!==entry.selected[i])){let offset=0;for(const i of selected){mesh.geometry.index.array.set(entry.cells[i].indices,offset);offset+=entry.cells[i].indices.length;}mesh.geometry.setDrawRange(0,count);mesh.geometry.index.clearUpdateRanges();if(count){mesh.geometry.index.addUpdateRange(0,count);mesh.geometry.index.needsUpdate=true;}totals.uploadedTerrainIndices+=count;}
   entry.cameraVersion=cameraVersion;entry.visibleCount=count;entry.selected=selected;totals.visibleCells+=selected.length;totals.visibleTriangles+=count/3;
  }
 }
 return{capture,terrain,update,clear(mesh){batches.delete(mesh);terrains.delete(mesh);},reset(){batches.clear();terrains.clear();},stats(){return{...totals,batches:batches.size,terrainMeshes:terrains.size};}};
}
