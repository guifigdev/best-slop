import {CASTLE_RESCUE_STRIKE} from '../shared/castle-rescue.js';
import * as T from 'three';

// Rescue Strike has its own brief warning. It never depends on Survival's
// boss-warning list, and its outer contour always matches the damage radius.
export function createCastleRescueEffect(event,baseGeometry){
 if(!['castleRescueWarning','castleRescueStrike'].includes(event.type))return null;
 const warning=event.type==='castleRescueWarning',radius=Number.isFinite(event.radius)?event.radius:CASTLE_RESCUE_STRIKE.radius,group=new T.Group(),owned=[],material=new T.MeshBasicMaterial({color:warning?0xf4d17c:0xffffff,transparent:true,opacity:warning?.22:.92,depthWrite:false,side:T.DoubleSide,toneMapped:false});owned.push(material);
 const outlineGeometry=new T.RingGeometry(Math.max(0,radius-.065),radius,64),outlineMaterial=new T.MeshBasicMaterial({color:0xffd886,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide,toneMapped:false}),outline=new T.Mesh(outlineGeometry,outlineMaterial);owned.push(outlineGeometry,outlineMaterial);outline.rotation.x=-Math.PI/2;outline.position.y=.025;
 if(warning){const geometry=new T.CircleGeometry(radius,64),fill=new T.Mesh(geometry,material);owned.push(geometry);fill.rotation.x=-Math.PI/2;group.add(fill,outline);}
 else{const blocks=new T.InstancedMesh(baseGeometry,material,24);blocks.frustumCulled=false;for(let i=0;i<24;i++)blocks.setColorAt(i,new T.Color([0xe8f6ff,0x88c7ef,0xffdc8c][i%3]));group.add(blocks,outline);}
 return{group,e:event,owned,mat:material,castleRescue:true,duration:warning?(event.duration||.35):.65,radius,warning};
}

export function updateCastleRescueEffect(entry,time,height=0){
 const age=Math.max(0,time-entry.e.time);if(age>=entry.duration)return false;
 const progress=age/entry.duration,{group,mat,radius,warning}=entry;group.position.set(entry.e.x,height+.12,entry.e.z);
 if(warning){mat.opacity=.16+progress*.2+Math.sin(progress*Math.PI*3)*.045;group.children[1].material.opacity=.75+progress*.25;}
 else{const mesh=group.children[0],t=Math.floor(progress*8)/8,pose=new T.Object3D();mat.opacity=Math.max(0,.96-progress*.96);group.children[1].material.opacity=(1-progress)*.9;
  for(let i=0;i<24;i++){const angle=i*2.399963,spread=Math.min(radius-.3,(.2+t*.8)*(radius-.3))*(.45+(i%4)*.18),lift=Math.max(0,Math.sin(t*Math.PI)*(.55+(i%5)*.25));pose.position.set(Math.sin(angle)*spread,lift+.13,Math.cos(angle)*spread);pose.rotation.set(t*1.8,angle,t*1.3);const size=(.17+(i%3)*.08)*(1-t*.5);pose.scale.set(size,size*(i%4===0?2.2:1),size);pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);}mesh.instanceMatrix.needsUpdate=true;
 }
 return true;
}
