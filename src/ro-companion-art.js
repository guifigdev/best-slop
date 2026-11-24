import * as T from 'three';
import {ragnarokMonsterSpec} from './ragnarok-monster-art.js';
export const RO_COMPANION_ART_BUDGET=Object.freeze({visible:16,parts:4096,drawCalls:1,lights:0,distance:64});
const cache=new Map(),mountedCache=new Map();
function mountedParts(kind){if(!mountedCache.has(kind)){const saddle=[{box:[0,1.29,-.18,.82,.20,.66,0x8b5939]},{box:[0,1.44,-.2,.52,.15,.44,0x563b2d]}];for(const side of [-1,1])saddle.push({box:[side*.48,1.08,-.18,.07,.40,.6,0x456977]});mountedCache.set(kind,[...roCompanionParts(kind),...saddle]);}return mountedCache.get(kind);}
function falconParts(){
 const parts=[],box=(x,y,z,w,h,d,c,wing=0)=>parts.push({box:[x,y,z,w,h,d,c],wing});
 box(0,.3,0,.36,.38,.65,0x796148);box(0,.58,.30,.32,.3,.31,0x8f7758);box(0,.53,.49,.17,.13,.23,0xc7a551);box(0,.33,.22,.26,.30,.20,0xe1cf9c);box(0,.20,-.45,.20,.10,.39,0x4e463b);
 for(const side of [-1,1]){box(side*.165,.61,.38,.035,.055,.075,0x161b20);box(side*.10,.04,.12,.055,.16,.06,0xc8ac67);box(side*.10,-.025,.19,.08,.045,.19,0xc8ac67);for(let i=0;i<6;i++){box(side*(.27+i*.12),.33-i*.025,-.02-i*.04,.19,.095,.62-i*.035,i%2?0x635342:0x998263,side);box(side*(.38+i*.12),.31-i*.025,-.32,.13,.065,.29,0x3f3a35,side);}}
 return parts;
}
export function roCompanionParts(kind){
 if(cache.has(kind))return cache.get(kind);
 const key={worg:'desertwolf',peco:'pecopeco',dragon:'ferus'}[kind],spec=key?ragnarokMonsterSpec(key):null;
 const parts=spec?[...spec.parts.map(box=>({box})),...spec.legs.map((l,i)=>({box:[l.x,l.y,l.z,l.w,l.h,l.d,l.color],leg:i+1}))]:kind==='falcon'?falconParts():[];
 for(const part of parts){Object.freeze(part.box);Object.freeze(part);}Object.freeze(parts);cache.set(kind,parts);return parts;
}
export function createRoCompanionArt({scene,material}={}){
 const geometry=new T.BoxGeometry(1,1,1);geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(1),3));
 const ownedMaterial=!material,mat=material||new T.MeshLambertMaterial({vertexColors:true}),mesh=new T.InstancedMesh(geometry,mat,RO_COMPANION_ART_BUDGET.parts);
 mesh.name='ro-allied-companions';mesh.count=0;mesh.instanceColor=new T.InstancedBufferAttribute(new Float32Array(RO_COMPANION_ART_BUDGET.parts*3),3);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);
 const root=new T.Object3D(),part=new T.Object3D(),matrix=new T.Matrix4(),color=new T.Color(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(new T.Vector3(),3);let visible=0,culled=0,disposed=false;
 return{mesh,update(state,time=state?.time||0,groundAt=()=>0,camera){
  mesh.count=visible=culled=0;if(disposed||!state?.bonk)return;
  if(camera){camera.updateMatrixWorld();frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));}
  const elapsed=state.bonk.elapsed||0,candidates=(state.bonk.roSkillSummons||[]).filter(p=>p.persistent&&p.until>elapsed&&state.units?.some(u=>u.id===p.source&&u.alive)&&roCompanionParts(p.companion).length);
  if(camera)candidates.sort((a,b)=>Math.hypot(a.x-camera.position.x,a.z-camera.position.z)-Math.hypot(b.x-camera.position.x,b.z-camera.position.z));
  for(const pet of candidates){
   if(visible>=RO_COMPANION_ART_BUDGET.visible){culled++;continue;}
   const ground=groundAt(pet.x,pet.z),fly=pet.companion==='falcon',height=Number.isFinite(ground)?ground:0;
   sphere.center.set(pet.x,height+1.7,pet.z);
   if(camera&&(Math.hypot(pet.x-camera.position.x,pet.z-camera.position.z)>RO_COMPANION_ART_BUDGET.distance||!frustum.intersectsSphere(sphere))){culled++;continue;}
   const attack=Math.max(0,1-(elapsed-(pet.attackAt??-100))/.35),scale=fly?1.05:pet.companion==='dragon'?.85:pet.mounted&&pet.companion==='peco'?.8:.9;
   root.position.set(pet.x,height+(pet.mounted?(state.units.find(u=>u.id===pet.source)?.bonkJumpHeight||0):0)+(fly?2.7+Math.sin(time*4)*.15-attack*.55:.03),pet.z);root.rotation.set(0,pet.facing||0,0);root.scale.setScalar(scale);root.updateMatrix();
   for(const p of pet.mounted?mountedParts(pet.companion):roCompanionParts(pet.companion)){
    if(mesh.count>=RO_COMPANION_ART_BUDGET.parts)break;const[x,y,z,w,h,d,hex]=p.box;
    part.position.set(x,y,z+(p.leg&&pet.moving?Math.sin(time*14+(p.leg%2)*Math.PI)*.09:0));part.rotation.set(0,0,p.wing?Math.sin(time*9)*.40*p.wing:0);part.scale.set(w,h,d);part.updateMatrix();matrix.multiplyMatrices(root.matrix,part.matrix);mesh.setMatrixAt(mesh.count,matrix);mesh.setColorAt(mesh.count,color.setHex(hex));mesh.count++;
   }
   // A tiny cyan harness makes allies readable without a permanent HUD label.
   if(mesh.count<RO_COMPANION_ART_BUDGET.parts){part.position.set(0,fly?.42:.85,-.06);part.rotation.set(0,0,0);part.scale.set(fly?.4:.7,.08,.13);part.updateMatrix();mesh.setMatrixAt(mesh.count,matrix.multiplyMatrices(root.matrix,part.matrix));mesh.setColorAt(mesh.count,color.setHex(0x72c6c0));mesh.count++;}visible++;
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
 },stats(){return{visible,culled,parts:mesh.count,drawCalls:Number(mesh.count>0),lights:0};},reset(){mesh.count=visible=culled=0;},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();if(ownedMaterial)mat.dispose();}};
}
