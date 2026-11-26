import * as T from 'three';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {roKatarCombatPose} from './ro-thief-combat.js';

// Two short physical blade trails, in world space. No camera-facing dagger
// sprite: the stepped, volumetric segments follow the two shoulder cuts.
const CAPACITY=64,SEGMENTS=10,INSTANCES=CAPACITY*2*SEGMENTS*2;
const clamp=n=>Math.max(0,Math.min(1,n));
export function roKatarTrailPose(progress,side,segment){
 const p=(progress-.18)/.44,q=(segment+.5)/SEGMENTS;
 if(p<=0||p>=1.75||q>Math.min(1,p))return null;
 const fade=clamp((1.75-p)/.65)*(1-.30*q);
 return{x:side*(.65-1.3*q),y:.70+.8*q,z:.9+Math.sin(q*Math.PI)*.08,dx:-side*1.3,dy:.8,dz:Math.cos(q*Math.PI)*.08,alpha:fade};
}
export function roDaggerTrailPose(progress,side,segment){
 const p=(progress-.12)/.55,q=(segment+.5)/SEGMENTS;if(p<=0||p>=1.5||q>Math.min(1,p))return null;
 const a=-.8+q*1.6;return{x:side*Math.sin(a)*.64,y:1.05+Math.sin(q*Math.PI)*.12,z:Math.cos(a)*1.4,dx:side*Math.cos(a)*1.024,dy:Math.cos(q*Math.PI)*.12*Math.PI,dz:-Math.sin(a)*2.24,alpha:clamp((1.5-p)/.5)*(1-.25*q)};
}
export function createRoKatarAttackArt({scene}){
 const root=new T.Group();root.name='ro-katar-volumetric-cuts';
 let mesh,geometry,material,alpha,disposed=false,last=-Infinity,world='';const records=new Map(),dummy=new T.Object3D(),color=new T.Color(),direction=new T.Vector3(),axis=new T.Vector3(0,0,1);
 function allocate(){if(mesh)return;scene.add(root);geometry=new T.BoxGeometry(1,1,1);alpha=new T.InstancedBufferAttribute(new Float32Array(INSTANCES),1);geometry.setAttribute('strokeOpacity',alpha);
  material=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false});material.onBeforeCompile=s=>{s.vertexShader='attribute float strokeOpacity;varying float vStrokeOpacity;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStrokeOpacity=strokeOpacity;');s.fragmentShader='varying float vStrokeOpacity;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vStrokeOpacity;');};material.customProgramCacheKey=()=> 'ro-katar-3d-cuts-v1';
  mesh=new T.InstancedMesh(geometry,material,INSTANCES);mesh.name='ro-katar-cross-cuts';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.renderOrder=4;root.add(mesh);
 }
 const reset=()=>{records.clear();if(mesh){mesh.count=0;mesh.visible=false;}};
 return{root,update(state,time=state?.time||0,heightAt=()=>0){if(disposed)return;if(!state){reset();return;}const key=[state.options?.mode,state.bonk?.map?.seed,state.bonk?.floor].join(':');if(key!==world||time<last)reset();world=key;last=time;const units=new Map((state.units||[]).map(u=>[u.id,u]));
  for(const e of state.effects||[]){const u=units.get(e.source);if(e.type!=='roAttack'||!u||e.id==null||!Number.isFinite(e.time))continue;const p=roAttackProfile(e,u),age=time-e.time;if(!(['katarCross','daggerStreaks'].includes(p.motion)&&(!e.skillKey||e.skillKey==='basic'))||age<0||age>=p.duration)continue;const id=e.id+':'+e.time;if(!records.has(id))records.set(id,{e:{...e},u,p});}
  while(records.size>CAPACITY)records.delete(records.keys().next().value);let at=0;
  for(const [id,{e,u,p}]of records){const age=time-e.time;if(age<0||age>=p.duration){records.delete(id);continue;}allocate();const progress=age/p.duration,yaw=Number.isFinite(e.direction)?e.direction:Number.isFinite(e.tx)&&Number.isFinite(e.tz)?Math.atan2(e.tx-e.x,e.tz-e.z):u.facing||0,c=Math.cos(yaw),s=Math.sin(yaw),scale=u.size||1,x=e.x??u.x,z=e.z??u.z,ground=heightAt(x,z)+(u.bonkJumpHeight||0),body=roKatarCombatPose(age,p.duration).body;
   for(const side of (p.motion==='katarCross'||u.roEquipment?.offhand?[-1,1]:[1]))for(let j=0;j<SEGMENTS;j++){const t=(p.motion==='katarCross'?roKatarTrailPose:roDaggerTrailPose)(progress,side,j);if(!t)continue;const reach=(e.range||(p.motion==='katarCross'?1.1:1.4))/(p.motion==='katarCross'?1.1:1.4);t.z*=reach;t.dz*=reach;for(let layer=0;layer<2;layer++){const width=layer?.027:.064;dummy.position.set(x+(t.x*c+t.z*s)*scale,ground+(t.y+body.y)*scale,z+(-t.x*s+t.z*c)*scale);direction.set(t.dx*c+t.dz*s,t.dy,-t.dx*s+t.dz*c).normalize();dummy.quaternion.setFromUnitVectors(axis,direction);dummy.scale.set(width*scale,width*scale,(layer?.17:.19)*scale);dummy.updateMatrix();mesh.setMatrixAt(at,dummy.matrix);mesh.setColorAt(at,color.setHex(layer?0xf3fcff:0x86bfe6));alpha.setX(at++,t.alpha*(layer?.95:.48));}}
  }
  if(mesh){mesh.count=at;mesh.visible=at>0;if(at){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;alpha.needsUpdate=true;mesh.computeBoundingSphere();}}
 },reset,stats:()=>({active:records.size,instances:mesh?.count||0,drawCalls:mesh?.visible?1:0,planes:0}),dispose(){if(disposed)return;disposed=true;reset();root.removeFromParent();mesh?.dispose();geometry?.dispose();material?.dispose();}};
}
