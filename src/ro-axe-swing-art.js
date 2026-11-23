import * as T from 'three';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';

export const RO_AXE_SWING_BUDGET=Object.freeze({active:8,segments:32,drawCalls:2,maxDistance:65,sweepAngle:Math.PI*2/3});
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export const roAxeSwingHandles=(event,source)=>event?.type==='roAttack'&&roAttackProfile(event,source).motion==='axeSlam';
export function roAxeSwingFrame(event,time,heightAt=()=>0,source){
 const age=time-event.time;if(age<0||age>=.58)return null;
 const yaw=Number.isFinite(event.direction)?event.direction:Number.isFinite(event.angle)?event.angle:Number.isFinite(event.tx)&&Number.isFinite(event.tz)?Math.atan2(event.tx-event.x,event.tz-event.z):source?.facing||0;
 const sweep=smooth((age-.055)/.245),angle=RO_AXE_SWING_BUDGET.sweepAngle*sweep,opacity=age<.31?1:1-smooth((age-.31)/.27),ground=heightAt(event.x,event.z);
 return{x:event.x+Math.cos(yaw)*.23,y:(Number.isFinite(ground)?ground:0)+1.5,z:event.z-Math.sin(yaw)*.23,yaw,angle,sweep,opacity,age};
}
function axeGeometry(){
 const positions=[],normals=[],colors=[],matrix=new T.Matrix4(),normalMatrix=new T.Matrix3(),v=new T.Vector3(),normal=new T.Vector3(),color=new T.Color();
 const add=(geometry,m,c)=>{const g=geometry.index?geometry.toNonIndexed():geometry;normalMatrix.getNormalMatrix(m);color.setHex(c);for(let i=0;i<g.attributes.position.count;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(m);normal.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(normalMatrix).normalize();positions.push(v.x,v.y,v.z);normals.push(normal.x,normal.y,normal.z);colors.push(color.r,color.g,color.b);}if(g!==geometry)g.dispose();geometry.dispose();};
 const box=(x,y,z,w,h,d,c)=>{matrix.makeTranslation(x,y,z);add(new T.BoxGeometry(w,h,d),matrix,c);};
 box(0,1.25,0,.15,2.8,.16,0x6d3e24);box(0,-.1,0,.22,.2,.23,0xc6a25e);
 for(let i=0;i<6;i++)box(0,.15+i*.15,0,.19,.065,.2,0x382c25);
 box(0,2.48,0,.3,.55,.3,0x3d4650);box(0,2.57,.18,.12,.12,.035,0xe4bc6b);
 for(const side of [-1,1]){
  const shape=new T.Shape();shape.moveTo(.10*side,2.82);shape.lineTo(.55*side,2.88);shape.lineTo(1.06*side,3.10);shape.lineTo(.92*side,2.65);shape.lineTo(1.04*side,2.04);shape.lineTo(.55*side,2.23);shape.lineTo(.1*side,2.22);shape.closePath();
  matrix.makeTranslation(0,0,-.11);add(new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false,curveSegments:1}),matrix,0x9facba);
  // The broad silver cutting edge, dark socket and leather haft remain readable
  // at gameplay scale; this silhouette cannot be mistaken for a sword/laser.
  box(side*.91,2.56,.015,.12,.72,.25,0xe2eaf0);box(side*.43,2.55,.135,.32,.12,.035,0x566471);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();return g;
}
export function createRoAxeSwingArt({scene}){
 const root=new T.Group();root.name='ro-axe-descending-swing';scene.add(root);
 const weaponGeometry=axeGeometry(),weaponMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.35}),weapons=new T.InstancedMesh(weaponGeometry,weaponMaterial,8);weapons.name='ro-recognizable-axe-heads';weapons.count=0;weapons.frustumCulled=false;root.add(weapons);
 const capacity=8*32*3*6,positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*4),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(colors,4).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
 const material=new T.ShaderMaterial({vertexShader:'attribute vec4 color;varying vec4 vColor;void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec4 vColor;void main(){if(vColor.a<.006)discard;gl_FragColor=vColor;\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false}),ribbon=new T.Mesh(geometry,material);ribbon.name='ro-axe-120-degree-curved-ribbon';ribbon.frustumCulled=false;ribbon.renderOrder=4;root.add(ribbon);
 const dummy=new T.Object3D(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(),color=new T.Color();let active=0,culled=0,vertices=0,disposed=false;
 function point(frame,angle,radius){return[frame.x+Math.sin(frame.yaw)*Math.sin(angle)*radius,frame.y+Math.cos(angle)*radius,frame.z+Math.cos(frame.yaw)*Math.sin(angle)*radius];}
 function vertex(p,c,alpha){positions.set(p,vertices*3);color.setHex(c);colors.set([color.r,color.g,color.b,alpha],vertices*4);vertices++;}
 return{root,update(state,time,heightAt=()=>0,camera){if(disposed)return;vertices=0;active=0;culled=0;const units=new Map((state?.units||[]).map(u=>[u.id,u])),cull=!!camera?.projectionMatrix&&!!camera?.matrixWorldInverse;if(cull)frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(const event of (state?.effects||[]).filter(e=>roAxeSwingHandles(e,units.get(e.source))).slice(-8)){
   const frame=roAxeSwingFrame(event,time,heightAt,units.get(event.source));if(!frame)continue;
   if(camera?.position&&Math.hypot(frame.x-camera.position.x,frame.z-camera.position.z)>65){culled++;continue;}sphere.center.set(frame.x,frame.y,frame.z);sphere.radius=4;if(cull&&!frustum.intersectsSphere(sphere)){culled++;continue;}
   dummy.position.set(frame.x,frame.y,frame.z);dummy.rotation.set(frame.angle,frame.yaw,0,'YXZ');dummy.scale.setScalar(1);dummy.updateMatrix();weapons.setMatrixAt(active++,dummy.matrix);
   if(frame.sweep<=.015||frame.opacity<=0)continue;
   const start=Math.max(0,frame.angle-Math.PI*2/3),end=frame.angle,steps=32;
   for(let i=0;i<steps;i++){
    const u=i/steps,v=(i+1)/steps,a=start+(end-start)*u,b=start+(end-start)*v,widthA=.04+.61*Math.pow(u,.7),widthB=.04+.61*Math.pow(v,.7),opacity=frame.opacity*(.10+v*.80);
    for(let band=0;band<3;band++){
     const lo=[0,.72,.9][band],hi=[.72,.9,1][band],radius=2.85,qa=point(frame,a,radius-widthA+widthA*lo),qb=point(frame,b,radius-widthB+widthB*lo),qc=point(frame,b,radius-widthB+widthB*hi),qd=point(frame,a,radius-widthA+widthA*hi),tint=[0xa5baca,0xd3e3ed,0xf5f8ed][band];
     for(const q of [qa,qb,qc,qa,qc,qd])vertex(q,tint,opacity*(band===0?.55:band===1?.82:1));
    }
   }
  }
  weapons.count=active;if(active)weapons.instanceMatrix.needsUpdate=true;geometry.setDrawRange(0,vertices);if(vertices){geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;}
 },stats:()=>({active,culled,vertices,drawCalls:(active?1:0)+(vertices?1:0),disposed}),reset(){active=vertices=culled=weapons.count=0;geometry.setDrawRange(0,0);},dispose(){if(disposed)return;disposed=true;weapons.dispose();weaponGeometry.dispose();weaponMaterial.dispose();geometry.dispose();material.dispose();root.clear();root.removeFromParent();}};
}
