import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {isRoArrowRainSkill,roArrowRainArrows,RO_ARROW_RAIN_TIMING} from '../shared/ro-arrow-rain.js';
export const RO_ARROW_RAIN_ART_BUDGET=Object.freeze({showers:8,arrows:336,drawCalls:1,lights:0});
export const roArrowRainVisualHandles=e=>['roArrowRainFall','roArrowRainImpact'].includes(e?.type)||isRoArrowRainSkill(e?.skillKey)&&['roAttack','abilityPulse','multishot'].includes(e?.type);
export function roArrowRainPose(event,time,heightAt=()=>0){
 const age=time-event.time,impact=event.type==='roArrowRainImpact',duration=event.duration||(impact?RO_ARROW_RAIN_TIMING.impact:RO_ARROW_RAIN_TIMING.fall);if(!Number.isFinite(age)||age<0||age>=duration)return[];
 return roArrowRainArrows(event).map(a=>{const offset=Math.min(a.offset,duration*.2),p=Math.max(0,Math.min(1,(age-offset)/Math.max(.01,duration-offset))),ground=heightAt(a.x,a.z)||0;return{...a,x:a.x+(impact?0:(1-p)*.65),y:ground+(impact?.75-age*.5:.85+a.height*(1-p*p)),z:a.z+(impact?0:(1-p)*.25),progress:p,scale:impact?Math.max(.2,1-age/duration*.65):1};});
}
function arrowGeometry(){
 const parts=[],add=(geo,color,y=0)=>{geo.translate(0,y,0);const c=new T.Color(color),colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<geo.attributes.position.count;i++)colors.set([c.r,c.g,c.b],i*3);geo.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(geo);};
 add(new T.BoxGeometry(.10,2.1,.10),0x8a603b,.30);
 const head=new T.ConeGeometry(.24,.6,4);head.rotateZ(Math.PI);add(head,0xc9e4eb,-.92);
 add(new T.BoxGeometry(.43,.47,.045),0x6f9eb0,1.15);add(new T.BoxGeometry(.045,.47,.43),0x9bbbc8,1.15);
 const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());return geometry;
}
export function createRoArrowRainArt({scene}={}){
 const geometry=arrowGeometry(),material=new T.MeshLambertMaterial({vertexColors:true}),mesh=new T.InstancedMesh(geometry,material,RO_ARROW_RAIN_ART_BUDGET.arrows);mesh.name='ro-arrow-rain-volley';mesh.count=0;mesh.castShadow=false;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);
 const dummy=new T.Object3D(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(new T.Vector3(),3);let disposed=false,showers=0;
 return{mesh,update(state,time=state?.time||0,heightAt=()=>0,camera){mesh.count=showers=0;if(disposed||!state)return;
  if(camera){camera.updateMatrixWorld();frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));}
  const events=(state.effects||[]).filter(e=>['roArrowRainFall','roArrowRainImpact'].includes(e.type)&&[e.x,e.z,e.time].every(Number.isFinite)&&time>=e.time&&time-e.time<(e.duration||(e.type==='roArrowRainImpact'?RO_ARROW_RAIN_TIMING.impact:RO_ARROW_RAIN_TIMING.fall))).slice(-RO_ARROW_RAIN_ART_BUDGET.showers*2);
  const groupIds=new Set();for(const e of events){const id=e.showerId??e.id;if(!groupIds.has(id)&&groupIds.size>=RO_ARROW_RAIN_ART_BUDGET.showers)continue;groupIds.add(id);for(const p of roArrowRainPose(e,time,heightAt)){
   if(mesh.count>=RO_ARROW_RAIN_ART_BUDGET.arrows)break;sphere.center.set(p.x,p.y,p.z);if(camera&&!frustum.intersectsSphere(sphere))continue;
   dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(.04,.1*Math.sin(p.angle),-.07);dummy.scale.setScalar(p.scale*(e.skillKey==='ac_shower'?.8:1));dummy.updateMatrix();mesh.setMatrixAt(mesh.count++,dummy.matrix);
  }}showers=groupIds.size;if(mesh.count)mesh.instanceMatrix.needsUpdate=true;
 },stats(){return{showers,arrows:mesh.count,drawCalls:Number(mesh.count>0),lights:0};},reset(){mesh.count=showers=0;},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
