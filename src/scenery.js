import {sceneryTreeArt} from './scenery-tree-art.js';
import {createFoliageWindMaterial,updateFoliageWind} from './foliage-wind.js';
import {stoneRockParts,stoneRuneParts} from './stone-landmark-art.js';
import * as T from 'three';
import {SCENERY_ASSETS} from '../shared/scenery.js';

export function sceneryRenderParts(entry){const asset=SCENERY_ASSETS[entry.kind];if(!asset)return[];const {w,d,h}=asset.collider;return entry.kind==='boulder'?stoneRockParts({id:entry.id,w,d,h,biome:'forest'}):entry.kind==='runestone'?stoneRuneParts({id:entry.id,w,d,h,biome:'forest'}):sceneryTreeArt(entry.kind)?.parts||asset.parts;}

// A single instanced voxel batch, reusable in Survival, Line Wars and Castle.
// Descriptors can be the scenery obstacles themselves: art and collision then
// have one authoritative origin, scale and species.
export function createScenery({scene}){
 const root=new T.Group();root.name='voxel-scenery';scene.add(root);const geometry=new T.BoxGeometry(1,1,1),material=createFoliageWindMaterial({strength:.08,speed:.65,masked:true}),dummy=new T.Object3D(),color=new T.Color();let mesh=null,signature='',disposed=false;
 return{
  update(descriptors=[],{origin={x:0,z:0},heightAt=()=>.18,visible=true,time=0}={}){
   if(disposed)return;updateFoliageWind(material,time);root.visible=visible;if(!visible)return;const entries=descriptors.filter(entry=>Object.hasOwn(SCENERY_ASSETS,entry.kind)&&Number.isFinite(entry.x)&&Number.isFinite(entry.z));
   const key=entries.map(e=>[e.id,e.kind,e.x,e.z,e.scale,e.rotation,heightAt(e.x+(origin.x||0),e.z+(origin.z||0))].join(',')).join(';')+'|'+origin.x+','+origin.z;if(key===signature)return;signature=key;
   if(mesh){mesh.removeFromParent();mesh.dispose();mesh=null;}const count=entries.reduce((sum,e)=>sum+sceneryRenderParts(e).length,0);if(!count)return;
   geometry.setAttribute('foliageMask',new T.InstancedBufferAttribute(new Float32Array(count),1));mesh=new T.InstancedMesh(geometry,material,count);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);let i=0;
   for(const entry of entries){const scale=entry.scale??1,rotation=entry.rotation||0,sin=Math.sin(rotation),cos=Math.cos(rotation),x=entry.x+(origin.x||0),z=entry.z+(origin.z||0),floor=heightAt(x,z),tree=sceneryTreeArt(entry.kind),leafSet=new Set(tree?.leaves||[]);for(const part of sceneryRenderParts(entry)){const [px,py,pz,w,h,d,hex]=part;geometry.attributes.foliageMask.setX(i,leafSet.has(part)?1:0);dummy.position.set(x+(px*cos+pz*sin)*scale,floor+py*scale,z+(-px*sin+pz*cos)*scale);dummy.rotation.set(0,rotation,0);dummy.scale.set(w*scale,h*scale,d*scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i++,color.setHex(hex));}}
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();
  },
  dispose(){if(disposed)return;disposed=true;if(mesh)mesh.dispose();geometry.dispose();material.dispose();root.removeFromParent();}
 };
}
