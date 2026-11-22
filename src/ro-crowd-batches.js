import * as T from 'three';

// Share sculpture/limb draws between visible enemies. Depth testing rejects
// fragments hidden by the front enemy; no unreliable CPU silhouette guesses.
export function createRoCrowdBatches(scene){
 const batches=new Map(),ids=new WeakMap(),hidden=[];let next=0,submitted=0,draws=0;
 const identity=o=>{if(!ids.has(o))ids.set(o,++next);return ids.get(o);};
 return{restore(){for(const m of hidden)m.visible=true;hidden.length=0;for(const b of batches.values())b.count=0;},update(entries){submitted=0;draws=0;
  for(const actor of entries){if(!actor.root.visible)continue;actor.root.updateWorldMatrix(true,true);for(const parent of [actor.body,...actor.legs,actor.hp].filter(Boolean)){if(!parent.visible)continue;parent.traverse(m=>{
   if(!m.isMesh||!m.visible||m.userData.hoverOutline||m.material.transparent||!m.geometry?.attributes?.position)return;
   const key=identity(m.geometry)+':'+identity(m.material);let b=batches.get(key);
   if(!b){const mesh=new T.InstancedMesh(m.geometry,m.material,512);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.name='ro-crowd-'+key;scene.add(mesh);b={mesh,count:0,idle:0};batches.set(key,b);}
   if(b.count>=512)return;b.mesh.setMatrixAt(b.count++,m.matrixWorld);m.visible=false;hidden.push(m);submitted++;
  });}}
  for(const [key,b]of batches){b.mesh.count=b.count;if(b.count){b.idle=0;b.mesh.instanceMatrix.needsUpdate=true;draws++;}else if(++b.idle>120){b.mesh.removeFromParent();b.mesh.dispose();batches.delete(key);}}
 },stats(){return{instances:submitted,drawCalls:draws,batches:batches.size};}};
}
