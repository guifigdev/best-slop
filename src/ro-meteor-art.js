import * as T from 'three';
import {roMeteorStones,isRoMeteorSkill} from '../shared/ro-meteor.js';
import {createVoxelFire} from './voxel-fire.js';

export const RO_METEOR_BUDGET=Object.freeze({showers:8,boulders:24,impactGroups:8,debrisPerImpact:8,rocks:88,flames:408,drawCalls:2});
const B=RO_METEOR_BUDGET,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const roMeteorVisualHandles=e=>e?.type==='roMeteorFall'||e?.type==='roMeteorImpact'||e?.type==='roAttack'&&isRoMeteorSkill(e.skillKey);
export function roMeteorPose(event,time,heightAt=()=>0){
 const age=time-event.time,duration=Math.max(.1,event.duration||.9);if(age<0||age>=duration)return[];
 const p=clamp(age/duration,0,1),travel=p*p;
 return roMeteorStones(event).map(stone=>({...stone,x:stone.x-stone.driftX*(1-travel),y:(heightAt(stone.x,stone.z)||0)+stone.size+stone.height*(1-travel),z:stone.z-stone.driftZ*(1-travel),progress:p,angle:stone.spin+age*2.4}));
}
export function createRoMeteorArt({scene}){
 const raw=new T.IcosahedronGeometry(1,1),rockGeometry=raw.index?raw.toNonIndexed():raw;
 if(raw!==rockGeometry)raw.dispose();
 const vertices=rockGeometry.getAttribute('position'),colors=new Float32Array(vertices.count*3),tint=new T.Color();
 for(let face=0;face<vertices.count/3;face++){
  const hex=face%11===0?0xffc465:face%7===0?0xcf5727:[0x42372f,0x605047,0x78604a,0x51433a][face%4];tint.setHex(hex);
  for(let j=0;j<3;j++){const i=face*3+j;colors.set([tint.r,tint.g,tint.b],i*3);}
 }
 rockGeometry.setAttribute('color',new T.BufferAttribute(colors,3));
 const rockMaterial=new T.MeshLambertMaterial({vertexColors:true,emissive:0x3e1508,emissiveIntensity:.5,flatShading:true}),rocks=new T.InstancedMesh(rockGeometry,rockMaterial,B.rocks);rocks.name='ro-meteor-boulders';rocks.count=0;rocks.castShadow=false;rocks.frustumCulled=true;scene.add(rocks);
 const hidden=new T.Group(),fire=createVoxelFire(hidden,{seed:632,smoke:false}),sources=[fire.root.getObjectByName('voxel-fire-flames'),fire.root.getObjectByName('voxel-fire-embers')],fireGeometry=sources[0].geometry.clone(),fireMaterial=sources[0].material.clone(),flames=new T.InstancedMesh(fireGeometry,fireMaterial,B.flames);flames.name='ro-meteor-flaming-tails';flames.count=0;flames.frustumCulled=true;flames.castShadow=flames.receiveShadow=false;flames.renderOrder=3;scene.add(flames);
 const dummy=new T.Object3D(),local=new T.Matrix4(),world=new T.Matrix4(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere();let disposed=false,fallCount=0,debrisCount=0;
 const visible=(x,y,z,r,cull)=>{sphere.center.set(x,y,z);sphere.radius=r;return !cull||frustum.intersectsSphere(sphere);};
 const clear=()=>{rocks.count=flames.count=fallCount=debrisCount=0;rocks.visible=flames.visible=false;};clear();
 return{rocks,flames,update(state,time=state?.time||0,heightAt=()=>0,camera){
  if(disposed)return;clear();if(!state||!Number.isFinite(time))return;
  const cull=!!camera?.projectionMatrix&&!!camera?.matrixWorldInverse;if(cull)frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const effects=state.effects||[],falls=effects.filter(e=>e.type==='roMeteorFall'&&[e.x,e.z,e.time].every(Number.isFinite)&&time>=e.time&&time-e.time<(e.duration||.9)).slice(-B.showers);
  for(const event of falls)for(const p of roMeteorPose(event,time,heightAt)){
   if(!visible(p.x,p.y+1.8,p.z,p.size+4,cull))continue;
   dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.angle*.7,p.angle,p.angle*.43);dummy.scale.set(p.size,p.size*.94,p.size*1.08);dummy.updateMatrix();rocks.setMatrixAt(rocks.count++,dummy.matrix);fallCount++;
   // Same animated flames and embers as the campfire, flowing above each rock.
   dummy.rotation.set(0,0,-.18);dummy.scale.set(p.size*1.7,p.size*1.1,p.size*1.7);dummy.updateMatrix();fire.update(time+p.spin,{enabled:true});
   for(const source of sources)for(let i=0;i<source.count;i++){source.getMatrixAt(i,local);world.multiplyMatrices(dummy.matrix,local);flames.setMatrixAt(flames.count,world);source.getColorAt(i,tint);flames.setColorAt(flames.count++,tint);}
  }
  const impacts=effects.filter(e=>e.type==='roMeteorImpact'&&[e.x,e.z,e.time].every(Number.isFinite)&&time>=e.time&&time-e.time<(e.duration||.85)).slice(-B.impactGroups);
  for(const event of impacts){const p=clamp((time-event.time)/(event.duration||.85),0,1),radius=Math.min(12,event.radius||4),ground=heightAt(event.x,event.z)||0;if(!visible(event.x,ground+2,event.z,radius+3,cull))continue;
   for(let i=0;i<B.debrisPerImpact;i++){const angle=i*2.39996+(event.source||0),spread=radius*p*(.6+(i%3)*.15),x=event.x+Math.cos(angle)*spread,z=event.z+Math.sin(angle)*spread,size=(.13+(i%3)*.09)*(1-p*.7);dummy.position.set(x,(heightAt(x,z)||0)+size+Math.sin(p*Math.PI)*(1.6+(i%3)*.5),z);dummy.rotation.set(p*8,angle,p*4);dummy.scale.set(size,size*.8,size);dummy.updateMatrix();rocks.setMatrixAt(rocks.count++,dummy.matrix);debrisCount++;}
  }
  for(const mesh of [rocks,flames]){mesh.visible=mesh.count>0;if(mesh.count){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}}
 },stats(){return{boulders:fallCount,debris:debrisCount,flames:flames.count,drawCalls:Number(rocks.visible)+Number(flames.visible),smoke:0};},dispose(){if(disposed)return;disposed=true;clear();for(const mesh of [rocks,flames]){mesh.removeFromParent();mesh.dispose();mesh.geometry.dispose();mesh.material.dispose();}fire.dispose();}};
}
