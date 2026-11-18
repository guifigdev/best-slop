import * as T from 'three';
import {SCENERY_ASSETS} from '../shared/scenery.js';

// A single instanced voxel batch, reusable in Survival, Line Wars and Castle.
// Descriptors can be the scenery obstacles themselves: art and collision then
// have one authoritative origin, scale and species.
export function createScenery({scene}){
 const root=new T.Group();root.name='voxel-scenery';scene.add(root);const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial(),dummy=new T.Object3D(),color=new T.Color();let mesh=null,signature='',disposed=false;
 return{
  update(descriptors=[],{origin={x:0,z:0},heightAt=()=>.18,visible=true}={}){
   if(disposed)return;root.visible=visible;if(!visible)return;const entries=descriptors.filter(entry=>Object.hasOwn(SCENERY_ASSETS,entry.kind)&&Number.isFinite(entry.x)&&Number.isFinite(entry.z));
   const key=entries.map(e=>[e.id,e.kind,e.x,e.z,e.scale,e.rotation,heightAt(e.x+(origin.x||0),e.z+(origin.z||0))].join(',')).join(';')+'|'+origin.x+','+origin.z;if(key===signature)return;signature=key;
   if(mesh){mesh.removeFromParent();mesh.dispose();mesh=null;}const count=entries.reduce((sum,e)=>sum+SCENERY_ASSETS[e.kind].parts.length,0);if(!count)return;
   mesh=new T.InstancedMesh(geometry,material,count);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);let i=0;
   for(const entry of entries){const scale=entry.scale??1,rotation=entry.rotation||0,sin=Math.sin(rotation),cos=Math.cos(rotation),x=entry.x+(origin.x||0),z=entry.z+(origin.z||0),floor=heightAt(x,z);for(const [px,py,pz,w,h,d,hex]of SCENERY_ASSETS[entry.kind].parts){dummy.position.set(x+(px*cos+pz*sin)*scale,floor+py*scale,z+(-px*sin+pz*cos)*scale);dummy.rotation.set(0,rotation,0);dummy.scale.set(w*scale,h*scale,d*scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i++,color.setHex(hex));}}
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();
  },
  dispose(){if(disposed)return;disposed=true;if(mesh)mesh.dispose();geometry.dispose();material.dispose();root.removeFromParent();}
 };
}
