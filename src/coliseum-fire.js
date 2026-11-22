import * as T from 'three';
import {createVoxelFire,VOXEL_FIRE_BUDGET} from './voxel-fire.js';
import {coliseumMoatLayout} from './coliseum-moat.js';
export const COLISEUM_FIRE_BUDGET=Object.freeze({sources:20,drawCalls:3,lights:0});
export function coliseumFireAnchors(zones=[],seed=1937){
 const layout=coliseumMoatLayout(),anchors=[];let value=(Number(seed)||1937)>>>0;const random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296),centers=Array.from({length:6},()=>random()),count=14+Math.floor(random()*4);
 for(let attempt=0;attempt<120&&anchors.length<count;attempt++){
  const along=(centers[attempt%centers.length]+(random()-.5)*.105+1)%1,index=along*layout.inner.length,i=Math.floor(index),j=(i+1)%layout.inner.length,t=index-i,depth=.23+random()*.58;
  const a={x:layout.inner[i].x*(1-t)+layout.inner[j].x*t,z:layout.inner[i].z*(1-t)+layout.inner[j].z*t},b={x:layout.outer[i].x*(1-t)+layout.outer[j].x*t,z:layout.outer[i].z*(1-t)+layout.outer[j].z*t},x=a.x+(b.x-a.x)*depth,z=a.z+(b.z-a.z)*depth;
  if(Math.min(Math.abs(x),Math.abs(z))<3.8||anchors.some(p=>Math.hypot(p.x-x,p.z-z)<.9))continue;
  anchors.push({x,y:.22,z,scale:.38+random()*.85,seed:random()*160,tempo:.72+random()*.6});
 }
 for(const zone of zones.filter(z=>z.type==='lava'&&Number.isFinite(z.x)&&Number.isFinite(z.z))){
  const r=zone.r??zone.radius??2,count=1+Number(random()>.6);for(let i=0;i<count;i++){const angle=random()*Math.PI*2,distance=r*(.12+random()*.53);anchors.push({x:zone.x+Math.cos(angle)*distance,y:.25,z:zone.z+Math.sin(angle)*distance,scale:.25+random()*.4,seed:random()*160,tempo:.8+random()*.5});}
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
 return{root,update(time,{enabled=false,zones=[],seed=1937}={}){
  if(disposed)return;root.visible=enabled&&Number.isFinite(time);if(!root.visible)return;
  const frame=Math.floor(time*8),anchors=coliseumFireAnchors(zones,seed),next=JSON.stringify(anchors);if(frame===last&&signature===next)return;last=frame;signature=next;sources=anchors.length;const counts=[0,0,0];
  for(const anchor of anchors){template.update(frame/8*anchor.tempo+anchor.seed);const breath=.77+.23*Math.sin(frame/8*.47+anchor.seed),size=anchor.scale*breath;transform.makeScale(size,size,size);transform.setPosition(anchor.x,anchor.y,anchor.z);
   for(let i=0;i<parts.length;i++)for(let j=0;j<parts[i].count;j++){parts[i].getMatrixAt(j,matrix);matrix.premultiply(transform);batches[i].setMatrixAt(counts[i],matrix);parts[i].getColorAt(j,colour);batches[i].setColorAt(counts[i]++,colour);}
  }
  for(let i=0;i<batches.length;i++){const mesh=batches[i];mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=mesh.instanceColor.needsUpdate=true;if(mesh.count)mesh.computeBoundingSphere();}
 },stats(){return{sources:root.visible?sources:0,drawCalls:root.visible?3:0,lights:0};},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of batches)mesh.dispose();root.clear();template.dispose();}};
}
