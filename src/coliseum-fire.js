import * as T from 'three';
import {createVoxelFire,VOXEL_FIRE_BUDGET} from './voxel-fire.js';
import {coliseumMoatLayout} from './coliseum-moat.js';
export const COLISEUM_FIRE_BUDGET=Object.freeze({sources:20,drawCalls:3,lights:0});
export function coliseumFireAnchors(zones=[]){
 const layout=coliseumMoatLayout(),anchors=[];
 for(let i=0;i<16;i++){
  const index=Math.floor((i+.5)*layout.inner.length/16),a=layout.inner[index],b=layout.outer[index],x=a.x+(b.x-a.x)*.58,z=a.z+(b.z-a.z)*.58;
  if(Math.min(Math.abs(x),Math.abs(z))<3.8)continue;
  anchors.push({x,y:.22,z,scale:.75+(i%3)*.18,seed:i*3.17});
 }
 for(const [i,zone]of zones.filter(z=>z.type==='lava'&&Number.isFinite(z.x)&&Number.isFinite(z.z)).entries()){
  const r=zone.r??zone.radius??2;
  anchors.push({x:zone.x+r*.3,y:.25,z:zone.z,scale:.54,seed:31+i*4.1});
 }
 return anchors.slice(0,COLISEUM_FIRE_BUDGET.sources);
}
// Reuses the exact campfire animation, combined into three draws for the arena.
export function createColiseumFire(){
 const root=new T.Group();root.name='muspelheim-volumetric-fire';root.visible=false;
 const template=createVoxelFire(new T.Group(),{seed:19}),parts=template.root.children,batches=parts.map((source,i)=>{
  const key=['flames','smoke','embers'][i],mesh=new T.InstancedMesh(source.geometry,source.material,VOXEL_FIRE_BUDGET[key]*COLISEUM_FIRE_BUDGET.sources);
  mesh.name='muspelheim-'+key;mesh.count=0;mesh.instanceColor=new T.InstancedBufferAttribute(new Float32Array(mesh.instanceMatrix.count*3),3);mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=true;mesh.renderOrder=2;root.add(mesh);return mesh;
 }),matrix=new T.Matrix4(),transform=new T.Matrix4(),colour=new T.Color();let last=-1,signature='',disposed=false,sources=0;
 return{root,update(time,{enabled=false,zones=[]}={}){
  if(disposed)return;root.visible=enabled&&Number.isFinite(time);if(!root.visible)return;
  const frame=Math.floor(time*8),anchors=coliseumFireAnchors(zones),next=JSON.stringify(anchors);if(frame===last&&signature===next)return;last=frame;signature=next;sources=anchors.length;const counts=[0,0,0];
  for(const anchor of anchors){template.update(frame/8+anchor.seed);transform.makeScale(anchor.scale,anchor.scale,anchor.scale);transform.setPosition(anchor.x,anchor.y,anchor.z);
   for(let i=0;i<parts.length;i++)for(let j=0;j<parts[i].count;j++){parts[i].getMatrixAt(j,matrix);matrix.premultiply(transform);batches[i].setMatrixAt(counts[i],matrix);parts[i].getColorAt(j,colour);batches[i].setColorAt(counts[i]++,colour);}
  }
  for(let i=0;i<batches.length;i++){const mesh=batches[i];mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=mesh.instanceColor.needsUpdate=true;if(mesh.count)mesh.computeBoundingSphere();}
 },stats(){return{sources:root.visible?sources:0,drawCalls:root.visible?3:0,lights:0};},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of batches)mesh.dispose();root.clear();template.dispose();}};
}
