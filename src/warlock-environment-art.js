import * as T from 'three';
import {createVoxelFire,VOXEL_FIRE_BUDGET} from './voxel-fire.js';
import {warlockIslandScale,WARLOCK_GROUND_RULES} from '../shared/warlock-ground.js';

export const WARLOCK_ENVIRONMENT_BUDGET=Object.freeze({islands:8,ground:16,fireSources:96,flames:96*VOXEL_FIRE_BUDGET.flames,embers:24,drawCalls:3,lights:0});
const fract=n=>n-Math.floor(n);
// The same authored voxel fire used by campfires, compressed into a low,
// continuous hazard border. All anchors are world coordinates, never camera offsets.
export function createWarlockEnvironmentArt({parent,groundMaterial=null}={}){
 const B=WARLOCK_ENVIRONMENT_BUDGET,root=new T.Group();root.name='warlock-lava-ground-and-fire';root.visible=false;parent?.add(root);
 const template=createVoxelFire(new T.Group(),{seed:27,smoke:false}),source=template.root.children[0],emberSource=template.root.children[2],groundGeometry=new T.CylinderGeometry(1,1,1,32),ownedMaterial=!groundMaterial,stone=groundMaterial||new T.MeshLambertMaterial();
 const make=(name,g,m,count)=>{const mesh=new T.InstancedMesh(g,m,count);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;root.add(mesh);return mesh;},ground=make('warlock-safe-islands',groundGeometry,stone,B.ground),flames=make('warlock-border-flames',source.geometry,source.material,B.flames),embers=make('warlock-border-embers',emberSource.geometry,emberSource.material,B.embers),dummy=new T.Object3D(),matrix=new T.Matrix4(),transform=new T.Matrix4(),color=new T.Color();
 for(const mesh of [flames,embers]){mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.receiveShadow=false;mesh.renderOrder=2;}ground.receiveShadow=true;
 let disposed=false,last=-1,signature='',islandCount=0;
 const put=(mesh,x,y,z,w,h,d,hex,yaw=0)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();mesh.setMatrixAt(mesh.count,dummy.matrix);mesh.setColorAt(mesh.count,color.setHex(hex));mesh.count++;};
 const finish=mesh=>{mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;};
 function reset(){root.visible=false;last=-1;signature='';islandCount=0;ground.count=flames.count=embers.count=0;}
 return{root,reset,update(war,time,{enabled=true}={}){if(disposed)return;root.visible=enabled&&!!war&&Number.isFinite(time);if(!root.visible)return;const frame=Math.floor(time*8),radius=Number.isFinite(war.arenaRadius)?war.arenaRadius:24,scale=warlockIslandScale(war),islands=(war.islands||[]).slice(0,WARLOCK_GROUND_RULES.islands),next=JSON.stringify([war.round,radius,islands]);if(frame===last&&signature===next)return;last=frame;signature=next;ground.count=flames.count=embers.count=0;islandCount=0;
  if(scale>0)for(const island of islands){if(![island.x,island.z,island.radiusX,island.radiusZ].every(Number.isFinite))continue;islandCount++;const rx=island.radiusX*scale,rz=island.radiusZ*scale;put(ground,island.x,-.19,island.z,rx,.55,rz,0x484b46);put(ground,island.x,.065,island.z,rx*.995,.13,rz*.995,0x97927b);}
  const t=frame/8;for(let i=0;i<B.fireSources;i++){const angle=i/B.fireSources*Math.PI*2,x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;template.update(t+i*.413);dummy.position.set(x,.14,z);dummy.rotation.set(0,angle,0);dummy.scale.set(1.25,.18,.5);dummy.updateMatrix();transform.copy(dummy.matrix);for(let j=0;j<source.count;j++){source.getMatrixAt(j,matrix);matrix.premultiply(transform);flames.setMatrixAt(flames.count,matrix);source.getColorAt(j,color);flames.setColorAt(flames.count++,color);}}
  for(let i=0;i<B.embers;i++){const angle=i/B.embers*Math.PI*2,life=fract(t*.32+i*.618),r=radius+.2+Math.sin(i*2.4+t*.4)*life*.6;put(embers,Math.sin(angle)*r,.25+life*2.1,Math.cos(angle)*r,.045,.085,.045,life>.7?0xcb743f:0xffce79,t+i);}
  for(const mesh of [ground,flames,embers])finish(mesh);
 },stats(){return{islands:islandCount,ground:ground.count,flames:flames.count,embers:embers.count,drawCalls:root.visible?root.children.filter(m=>m.count>0).length:0,lights:0};},dispose(){if(disposed)return;disposed=true;reset();root.removeFromParent();for(const mesh of [ground,flames,embers])mesh.dispose();groundGeometry.dispose();if(ownedMaterial)stone.dispose();template.dispose();root.clear();}};
}
