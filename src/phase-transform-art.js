import * as T from 'three';
import {phaseKillerSpec} from './phase-killer-art.js';

// Leave the previous public silhouette at the same actor while its body changes.
// This uses appearance data only: an unrevealed role never enters the renderer.
export function createPhaseTransformEffect(event,baseGeometry){
 if(event?.type!=='phaseTransform')return null;
 const group=new T.Group(),oldBody=new T.Group(),owned=[],material=new T.MeshBasicMaterial({color:0xb8d9cf,transparent:true,opacity:.6,depthWrite:false,toneMapped:false}),dustMaterial=new T.MeshBasicMaterial({color:0xc8b6e2,transparent:true,opacity:.85,depthWrite:false,toneMapped:false});
 owned.push(material,dustMaterial);
 const spec=phaseKillerSpec(event.from||'townsperson');
 for(const part of spec?.parts||[]){const mesh=new T.Mesh(baseGeometry,material);mesh.position.set(part[0],part[1],part[2]);mesh.scale.set(part[3],part[4],part[5]);oldBody.add(mesh);}
 for(const part of spec?.legs||[]){const mesh=new T.Mesh(baseGeometry,material);mesh.position.set(part.x,part.y,part.z);mesh.scale.set(part.w,part.h,part.d);oldBody.add(mesh);}
 oldBody.rotation.y=Number.isFinite(event.facing)?event.facing:0;
 const ringGeometry=new T.RingGeometry(.96,1.05,32),ringMaterial=new T.MeshBasicMaterial({color:0xb9dcd8,side:T.DoubleSide,transparent:true,depthWrite:false,toneMapped:false}),rune=new T.Mesh(ringGeometry,ringMaterial);owned.push(ringGeometry,ringMaterial);rune.rotation.x=-Math.PI/2;
 const dust=new T.InstancedMesh(baseGeometry,dustMaterial,18);dust.frustumCulled=false;group.add(oldBody,rune,dust);
 return{e:event,group,owned,phaseTransform:true,oldBody,rune,dust,material,dustMaterial,duration:Math.max(.5,Math.min(2,event.duration||1.1)),pose:new T.Object3D()};
}

export function updatePhaseTransformEffect(entry,time,units=[],height=0){
 const age=Math.max(0,time-entry.e.time),progress=age/entry.duration;if(progress>=1)return false;
 const source=units.find(u=>u.id===entry.e.source),x=source?.x??entry.e.x,z=source?.z??entry.e.z;
 entry.group.position.set(x,height+.12,z);entry.oldBody.scale.setScalar(Math.max(.2,1-progress*.65));entry.oldBody.position.y=progress*.7;entry.material.opacity=.65*(1-progress);
 entry.rune.scale.setScalar(.8+Math.sin(progress*Math.PI)*.8);entry.rune.material.opacity=(1-progress)*.85;entry.dustMaterial.opacity=.8*(1-progress);
 for(let i=0;i<18;i++){const angle=i*2.399963+progress*5,radius=.45+Math.sin(progress*Math.PI)*(.7+(i%3)*.2),p=entry.pose;p.position.set(Math.sin(angle)*radius,.1+((i/18+progress*1.4)%1)*3.3,Math.cos(angle)*radius);p.rotation.set(angle,progress*4,i);p.scale.setScalar(.13+(i%3)*.035);p.updateMatrix();entry.dust.setMatrixAt(i,p.matrix);}
 entry.dust.instanceMatrix.needsUpdate=true;return true;
}
