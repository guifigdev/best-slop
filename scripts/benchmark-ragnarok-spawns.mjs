import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {performance} from 'node:perf_hooks';
import {mkdirSync,writeFileSync} from 'node:fs';
import {ragnarokMonsterSpec} from '../src/ragnarok-monster-art.js';
import {RAGNAROK_VOXEL_REFERENCES} from '../shared/monster-visual-references.js';

const keys=Object.keys(RAGNAROK_VOXEL_REFERENCES).filter(key=>ragnarokMonsterSpec(key)).slice(0,12),count=280,base=new T.BoxGeometry(),material=new T.MeshBasicMaterial();
function run(reuse) {const cache=new Map();let allocations=0,checksum=0;const start=performance.now();
 for(let i=0;i<count;i++) {
  const key=keys[i%keys.length],spec=ragnarokMonsterSpec(key),body=new T.Group();
  if(!reuse||!cache.has(key))for(const [x,y,z,w,h,d]of spec.parts) {const mesh=new T.Mesh(base.clone(),material);allocations++;mesh.position.set(x,y,z);mesh.scale.set(w,h,d);body.add(mesh);}
  let geometry=cache.get(key);
  if(!geometry){const chunks=body.children.map(mesh=>{mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(mesh.matrix);});geometry=mergeGeometries(chunks);for(const chunk of chunks)chunk.dispose();cache.set(key,geometry);}
  for(const mesh of [...body.children]){mesh.geometry.dispose();body.remove(mesh);}body.add(new T.Mesh(geometry,material));
  checksum+=geometry.attributes.position.count;
 }
 const result={milliseconds:performance.now()-start,temporaryBoxGeometries:allocations,bakedBodies:cache.size,checksum};for(const g of cache.values())g.dispose();return result;
}
run(false);run(true);const samples=Array.from({length:5},()=>({before:run(false),after:run(true)}));
if(samples.some(s=>s.before.checksum!==s.after.checksum))throw new Error('Geometry changed');
const median=key=>samples.map(s=>s[key].milliseconds).sort((a,b)=>a-b)[2];
const result={command:'node scripts/benchmark-ragnarok-spawns.mjs',scenario:{actors:count,uniqueSpecies:keys.length,keys},medianMs:{before:median('before'),after:median('after')},speedup:median('before')/median('after'),temporaryBoxGeometries:{before:samples[0].before.temporaryBoxGeometries,after:samples[0].after.temporaryBoxGeometries},bakedBodies:samples[0].after.bakedBodies,checksum:samples[0].before.checksum,samples,notes:['Real Three.js construction/merge/disposal matching view body cache paths.','Only the first instance of an authored species constructs voxel boxes.','No renderer/GPU frame-rate claim. Model geometry and all 280 actors retained.']};
mkdirSync('outputs/ro-conversion',{recursive:true});writeFileSync('outputs/ro-conversion/performance-spawns.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));base.dispose();material.dispose();
