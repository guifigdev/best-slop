import * as T from 'three';
import {hoverRelation} from './hover-highlight.js';
import {previewPolygon} from './skill-preview.js';

export const RTS_FEEDBACK_BUDGET=Object.freeze({targets:64,rings:130,brackets:520,arrows:16,drawCalls:3,moveSeconds:1.55});
export const RTS_FEEDBACK_COLORS=Object.freeze({attack:0xff5141,area:0xffbd52,move:0x65ff83});
const finitePoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const live=u=>u&&u.alive!==false&&u.hp!==0&&finitePoint(u);
const effectRoles=new Set(['effect','secondary','landing','target']);

/** Center-point membership in the same X/Z shape drawn by skill-preview.js. */
export function previewContainsPoint(shape,point){
 if(!shape||!finitePoint(point)||!finitePoint(shape))return false;
 const dx=point.x-shape.x,dz=point.z-shape.z,epsilon=1e-6;
 if(shape.type==='circle')return Number.isFinite(shape.radius)&&shape.radius>0&&dx*dx+dz*dz<=shape.radius*shape.radius+epsilon;
 const angle=Number.isFinite(shape.angle)?shape.angle:0,side=dx*Math.cos(angle)-dz*Math.sin(angle),along=dx*Math.sin(angle)+dz*Math.cos(angle);
 if(shape.type==='rect')return shape.width>0&&shape.depth>0&&Math.abs(side)<=shape.width/2+epsilon&&Math.abs(along)<=shape.depth/2+epsilon;
 if(shape.type==='cone'){if(!(shape.radius>0&&Number.isFinite(shape.halfAngle)&&shape.halfAngle>=0)||dx*dx+dz*dz>shape.radius*shape.radius+epsilon)return false;if(dx*dx+dz*dz<epsilon)return true;const delta=Math.atan2(Math.sin(Math.atan2(dx,dz)-angle),Math.cos(Math.atan2(dx,dz)-angle));return Math.abs(delta)<=shape.halfAngle+epsilon;}
 if(shape.type==='corridor'){
  if(!(Number.isFinite(shape.length)&&shape.length>0&&Number.isFinite(shape.radius)&&shape.radius>0))return false;
  if(!shape.radial){const width=Math.min(shape.radius,shape.length),start=Number.isFinite(shape.start)?shape.start:0,end=shape.length+(Number.isFinite(shape.end)?shape.end:0);return Math.abs(side)<=width+epsilon&&along>=start-epsilon&&along<=end+epsilon;}
  const polygon=previewPolygon(shape);let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j],ex=b.x-a.x,ez=b.z-a.z,cross=(point.x-a.x)*ez-(point.z-a.z)*ex,dot=(point.x-a.x)*ex+(point.z-a.z)*ez;if(Math.abs(cross)<epsilon&&dot>=-epsilon&&dot<=ex*ex+ez*ez+epsilon)return true;if((a.z>point.z)!==(b.z>point.z)&&point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;
 }
 return false;
}

/** Read-only policy. Hover never changes the authoritative attack selection. */
export function rtsTargetFeedbackPolicy(state,owner,{preview=null,selectedIds=[],isVisible=()=>true}={}){
 const attackIds=new Set(),aoeIds=new Set(),targetIds=new Set(),disabled={enabled:false,sourceId:null,attackIds,aoeIds,targetIds};
 if(!state||state.options?.mode==='bonk')return disabled;
 const units=state.units||[],byId=new Map(units.map(u=>[u.id,u])),hero=byId.get(state.players?.[owner])||units.find(u=>u.hero&&u.owner===owner),source=byId.get(preview?.sourceId)||hero;
 const hostile=u=>live(u)&&isVisible(u)&&hoverRelation(u,owner,state)==='enemy';
 const sources=[hero,...Array.from(selectedIds||[],id=>byId.get(id))].filter(u=>live(u)&&u.owner===owner);
 for(const attacker of sources){const explicit=typeof attacker.target==='object'?attacker.target?.id:attacker.target,last=attacker.order!=='stop'?(state.effects||[]).findLast(e=>e.source===attacker.id&&e.basicAttack&&e.target!=null&&(state.time||0)-e.time<=Math.max(.6,attacker.interval||1.2)*1.25):null,id=explicit??last?.target,u=byId.get(id);if(hostile(u)&&attackIds.size<RTS_FEEDBACK_BUDGET.targets)attackIds.add(u.id);}
 if(source&&source.owner===owner&&live(source)&&preview?.shapes){const shapes=preview.shapes.filter(s=>effectRoles.has(s.role||'effect'));for(const u of units){if(aoeIds.size+attackIds.size>=RTS_FEEDBACK_BUDGET.targets)break;if(hostile(u)&&shapes.some(shape=>previewContainsPoint(shape,u)))aoeIds.add(u.id);}}
 for(const id of attackIds)targetIds.add(id);for(const id of aoeIds)targetIds.add(id);
 return{enabled:true,sourceId:source?.id??null,attackIds,aoeIds,targetIds};
}

function arrowGeometry(){
 // A broad, concave Warcraft-style chevron, kept native and texture-free.
 const shape=new T.Shape();shape.moveTo(-.6,.25);shape.lineTo(0,-.6);shape.lineTo(.6,.25);shape.lineTo(.24,.25);shape.lineTo(0,-.12);shape.lineTo(-.24,.25);shape.closePath();return new T.ShapeGeometry(shape);
}

export function createRtsTargetFeedback({scene}={}){
 const root=new T.Group();root.name='rts-command-feedback';root.visible=false;scene?.add(root);
 const ringGeometry=new T.RingGeometry(.82,1,40).rotateX(-Math.PI/2),boxGeometry=new T.BoxGeometry(1,1,1),chevronGeometry=arrowGeometry(),material=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthTest:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}),arrowMaterial=material.clone();arrowMaterial.depthTest=false;
 const make=(name,g,m,count)=>{const mesh=new T.InstancedMesh(g,m,count);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=8;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);return mesh;};
 const rings=make('rts-unit-target-rings',ringGeometry,material,RTS_FEEDBACK_BUDGET.rings),brackets=make('rts-target-corner-brackets',boxGeometry,material,RTS_FEEDBACK_BUDGET.brackets),arrows=make('rts-command-chevrons',chevronGeometry,arrowMaterial,RTS_FEEDBACK_BUDGET.arrows),dummy=new T.Object3D(),color=new T.Color();let disposed=false,destination=null,policy=rtsTargetFeedbackPolicy(null),moveVisible=false;
 const put=(mesh,x,y,z,w,h,d,hex,{yaw=0,ground=false,quaternion=null}={})=>{if(mesh.count>=mesh.instanceMatrix.count||![x,y,z,w,h,d].every(Number.isFinite))return;dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(ground?-Math.PI/2:0,yaw,0);if(quaternion)dummy.quaternion.copy(quaternion);dummy.updateMatrix();mesh.setMatrixAt(mesh.count,dummy.matrix);mesh.setColorAt(mesh.count,color.setHex(hex));mesh.count++;};
 const ring=(x,y,z,r,hex)=>put(rings,x,y,z,r,1,r,hex);
 const finish=mesh=>{mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;};
 function mark(point,time=0){if(disposed||!finitePoint(point)||!Number.isFinite(time))return false;destination={x:point.x,z:point.z,startedAt:time};return true;}
 function reset(){destination=null;moveVisible=false;policy=rtsTargetFeedbackPolicy(null);root.visible=false;for(const mesh of [rings,brackets,arrows])mesh.count=0;}
 return{root,mark,reset,update(state,owner,time=state?.time||0,{actors=null,heightAt=()=>0,preview=null,selectedIds=[],move=null,camera=null}={}){
  if(disposed)return policy;const visible=u=>{if(!actors)return true;const actor=actors.get?.(u.id)||actors[u.id];return !!actor&&actor.root?.visible!==false;};
  policy=rtsTargetFeedbackPolicy(state,owner,{preview,selectedIds,isVisible:visible});root.visible=policy.enabled&&Number.isFinite(time);for(const mesh of [rings,brackets,arrows])mesh.count=0;moveVisible=false;if(!root.visible)return policy;
  const pulse=.5+.5*Math.sin(time*6.5),units=new Map((state.units||[]).map(u=>[u.id,u]));
  for(const id of policy.targetIds){const u=units.get(id),actor=actors?.get?.(id)||actors?.[id],position=actor?.root?.position||u,x=position.x,z=position.z,y=heightAt(x,z)+.095,size=Math.max(.45,Math.min(7,(u.size||1)*(u.radius||u.collisionRadius||.65))),r=size+.32,attack=policy.attackIds.has(id),hex=attack?RTS_FEEDBACK_COLORS.attack:RTS_FEEDBACK_COLORS.area;
   ring(x,y,z,r*(1+pulse*.035),hex);if(attack)ring(x,y+.012,z,r*1.17,hex);
   // Four solid L corners read clearly against voxel grass, ice and paving.
   for(const sx of [-1,1])for(const sz of [-1,1]){const px=x+sx*r*.88,pz=z+sz*r*.88;put(brackets,px-sx*r*.16,y+.025,pz,r*.38,.065,.11,hex);put(brackets,px,y+.025,pz-sz*r*.16,.11,.065,r*.38,hex);}
   if(attack){const h=(actor?.modelHeight||2.6)*(u.size||1),top=(actor?.root?.position?.y??heightAt(x,z))+h+.55+pulse*.15;put(arrows,x,top,z,.8,.8,1,hex,{quaternion:camera?.quaternion||null});}
  }
  const marker=move&&finitePoint(move)&&Number.isFinite(move.startedAt)?move:destination,age=marker?time-marker.startedAt:Infinity;
  if(marker&&age>=0&&age<RTS_FEEDBACK_BUDGET.moveSeconds){moveVisible=true;const x=marker.x,z=marker.z,y=heightAt(x,z)+.115,phase=age/RTS_FEEDBACK_BUDGET.moveSeconds,hex=RTS_FEEDBACK_COLORS.move,scale=1.15-phase*.18;ring(x,y,z,scale,hex);ring(x,y+.01,z,.4+fract(age*1.8)*1.15,hex);for(let i=0;i<3;i++)put(arrows,x,y+.035+i*.025,z+(i-1)*.46,.65,.65,1,hex,{ground:true});for(const sx of [-1,1])for(const sz of [-1,1])put(brackets,x+sx*.95,y+.025,z+sz*.95,.24,.07,.24,hex);}
  for(const mesh of [rings,brackets,arrows])finish(mesh);return policy;
 },ids(){return policy.targetIds;},stats(){return{enabled:root.visible,attackTargets:policy.attackIds.size,areaTargets:policy.aoeIds.size,targets:policy.targetIds.size,moveVisible,rings:rings.count,brackets:brackets.count,arrows:arrows.count,drawCalls:root.visible?root.children.filter(m=>m.count>0).length:0};},dispose(){if(disposed)return;reset();disposed=true;root.removeFromParent();for(const mesh of [rings,brackets,arrows])mesh.dispose();ringGeometry.dispose();boxGeometry.dispose();chevronGeometry.dispose();material.dispose();arrowMaterial.dispose();root.clear();}};
}
const fract=n=>n-Math.floor(n);
