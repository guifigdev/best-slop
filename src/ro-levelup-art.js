import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original RO reference: the official GungHo beginner guide shows the white
// feathered angel opening above the player, with its flattened golden halo.
// https://ragnarokonline.gungho.jp/special/cp-enjoy-ro/img/bring/lv_img03L.jpg
// Geometry and shaders below are authored here; no original sprite is shipped.
export const RO_LEVELUP_ART_BUDGET=Object.freeze({effects:8,feathersPerEffect:46,glowsPerEffect:20,drawCalls:2,lights:0,duration:1.6});
export const roLevelUpVisualHandles=(event,state)=>event?.type==='levelup'&&(event.bonk===true||state?.options?.mode==='bonk');
const clamp=(value,low=0,high=1)=>Math.max(low,Math.min(high,value));
const smooth=value=>{value=clamp(value);return value*value*(3-2*value);};

export function roLevelUpPose(age){
 const p=clamp(age/RO_LEVELUP_ART_BUDGET.duration),opening=smooth(age/.42),fade=smooth((RO_LEVELUP_ART_BUDGET.duration-age)/.55)*smooth(age/.07);
 return {visible:age>=0&&age<RO_LEVELUP_ART_BUDGET.duration,opening,alpha:fade,lift:.20+age*.78,spread:.24+.76*opening,fold:(1-opening)*.65,flash:Math.exp(-Math.pow((age-.16)/.15,2))*.85,haloAlpha:fade*.95,progress:p};
}

function featherGeometry(){
 const shape=new T.Shape();shape.moveTo(0,0);for(const p of [[-.14,.13],[-.21,.40],[-.19,.69],[-.10,.91],[0,1],[.09,.85],[.15,.65],[.13,.47],[.055,.35],[.12,.34],[.055,.24],[.09,.22],[.035,.10]])shape.lineTo(...p);shape.closePath();
 const feather=new T.ExtrudeGeometry(shape,{depth:.045,steps:1,bevelEnabled:false,curveSegments:1}),shaft=new T.BoxGeometry(.018,.67,.025).toNonIndexed();shaft.translate(-.006,.42,.06);
 for(const [geometry,ridge]of [[feather,false],[shaft,true]]){const colors=new Float32Array(geometry.attributes.position.count*3),normal=geometry.attributes.normal;for(let i=0;i<normal.count;i++){const c=new T.Color(ridge?0xe8d9a7:normal.getZ(i)>.5?0xfffbed:normal.getZ(i)<-.5?0xc9d4d4:0xa8bec6);colors.set([c.r,c.g,c.b],i*3);}geometry.setAttribute('color',new T.BufferAttribute(colors,3));}
 const geometry=mergeGeometries([feather,shaft]);feather.dispose();shaft.dispose();geometry.computeBoundingSphere();return geometry;
}
const vertexShader=`attribute float roAlpha;varying float vAlpha;varying vec3 vTint;
void main(){vAlpha=roAlpha;vTint=color*instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`;
const featherFragment=`varying float vAlpha;varying vec3 vTint;void main(){if(vAlpha<.004)discard;gl_FragColor=vec4(vTint,vAlpha);#include <colorspace_fragment>}`.replace(';#include',';\n#include');
const glowVertex=`attribute float roAlpha;attribute float roKind;varying vec2 vUv;varying float vAlpha;varying float vKind;varying vec3 vTint;
void main(){vUv=uv;vAlpha=roAlpha;vKind=roKind;vTint=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`;
const glowFragment=`varying vec2 vUv;varying float vAlpha;varying float vKind;varying vec3 vTint;
void main(){vec2 p=vUv-.5;float d=length(p);float a=pow(1.-smoothstep(.015,.5,d),2.2);if(vKind>.5&&vKind<1.5)a=1.-smoothstep(.018,.058,abs(d-.35));else if(vKind>1.5)a=pow(max(0.,1.-abs(p.x)*2.),2.)*(1.-smoothstep(.15,.5,abs(p.y)));a*=vAlpha;if(a<.004)discard;gl_FragColor=vec4(vTint,a);\n#include <colorspace_fragment>\n}`;

export function createRoLevelUpArt({scene}={}){
 const featherGeo=featherGeometry(),glowGeo=new T.PlaneGeometry(1,1),featherMat=new T.ShaderMaterial({vertexColors:true,vertexShader,fragmentShader:featherFragment,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false}),glowMat=new T.ShaderMaterial({vertexShader:glowVertex,fragmentShader:glowFragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});
 const capacity=RO_LEVELUP_ART_BUDGET.effects,feathers=new T.InstancedMesh(featherGeo,featherMat,capacity*RO_LEVELUP_ART_BUDGET.feathersPerEffect),glows=new T.InstancedMesh(glowGeo,glowMat,capacity*RO_LEVELUP_ART_BUDGET.glowsPerEffect);
 for(const [mesh,name]of [[feathers,'ro-levelup-white-feathers'],[glows,'ro-levelup-golden-halo']]){mesh.name=name;mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=21;scene.add(mesh);}
 feathers.setColorAt(0,new T.Color(0xffffff));glows.setColorAt(0,new T.Color(0xffd36b));
 const featherAlpha=new T.InstancedBufferAttribute(new Float32Array(feathers.instanceMatrix.count),1).setUsage(T.DynamicDrawUsage),glowAlpha=new T.InstancedBufferAttribute(new Float32Array(glows.instanceMatrix.count),1).setUsage(T.DynamicDrawUsage),glowKind=new T.InstancedBufferAttribute(new Float32Array(glows.instanceMatrix.count),1).setUsage(T.DynamicDrawUsage);featherGeo.setAttribute('roAlpha',featherAlpha);glowGeo.setAttribute('roAlpha',glowAlpha);glowGeo.setAttribute('roKind',glowKind);
 const active=new Map(),seen=new Set(),dummy=new T.Object3D(),orientation=new T.Quaternion(),turn=new T.Quaternion(),axis=new T.Vector3(0,0,1),local=new T.Vector3(),origin=new T.Vector3(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(),tint=new T.Color();let world=null,lastSimulation=-Infinity,disposed=false,prime=false,visibleEffects=0;
 function reset(){active.clear();seen.clear();feathers.count=glows.count=visibleEffects=0;prime=true;}
 function place(mesh,alphaAttribute,x,y,z,w,h,d,angle,color,alpha,kind=0){if(mesh.count>=mesh.instanceMatrix.count)return;const i=mesh.count++;local.set(x,y,z).applyQuaternion(orientation);dummy.position.copy(origin).add(local);turn.setFromAxisAngle(axis,angle);dummy.quaternion.copy(orientation).multiply(turn);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,tint.setHex(color));alphaAttribute.setX(i,clamp(alpha));if(mesh===glows)glowKind.setX(i,kind);}
 return {feathers,glows,update(state,simulationTime=state?.time||0,heightAt=()=>0,camera,visualTime=performance.now()/1000,worldKey='shared'){
  feathers.count=glows.count=visibleEffects=0;if(disposed)return;
  const nextWorld=state?worldKey+':'+(state.options?.mode||'')+':'+(state.bonk?.map?.seed??'')+':'+(state.bonk?.routeIndex??''):null;
  if(world!==null&&nextWorld!==world||simulationTime<lastSimulation){reset();}world=nextWorld;lastSimulation=simulationTime;
  if(!state){active.clear();return;}const events=(state.effects||[]).filter(event=>roLevelUpVisualHandles(event,state));
  if(prime){for(const event of events)seen.add(event.id);prime=false;}
  for(const event of events){if(seen.has(event.id))continue;seen.add(event.id);if(![event.x,event.z,event.time].every(Number.isFinite)||simulationTime-event.time>RO_LEVELUP_ART_BUDGET.duration||event.time>simulationTime+.1)continue;
   if([...active.values()].some(entry=>(entry.event.source??entry.event.target)===(event.source??event.target)&&Math.abs(entry.event.time-event.time)<.01))continue;
   if(active.size>=capacity)active.delete(active.keys().next().value);active.set(event.id,{event,started:visualTime-Math.max(0,simulationTime-event.time)});
  }
  if(seen.size>2048){const retained=new Set(events.map(event=>event.id));for(const id of active.keys())retained.add(id);seen.clear();for(const id of retained)seen.add(id);}
  if(camera){camera.updateMatrixWorld();orientation.copy(camera.quaternion);frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));}else orientation.identity();
  for(const [id,entry]of active){const age=visualTime-entry.started,pose=roLevelUpPose(age);if(!pose.visible){active.delete(id);continue;}const event=entry.event,source=(state.units||[]).find(unit=>unit.id===(event.source??event.target)),scale=clamp(source?.size||1,.65,1.6),x=source?.x??event.x,z=source?.z??event.z,y=(heightAt(x,z)||0)+1.8*scale+pose.lift;
   origin.set(x,y,z);sphere.center.copy(origin);sphere.center.y+=scale;sphere.radius=3.8*scale;if(camera&&!frustum.intersectsSphere(sphere))continue;visibleEffects++;
   const feather=(x,y,length,width,angle,color=0xffffff,alpha=pose.alpha,z=.03)=>place(feathers,featherAlpha,x*scale,y*scale,z*scale,width*scale,length*scale,scale,angle,color,alpha);
   for(const side of [-1,1]){
    for(let i=10;i>=0;i--){const t=i/10,rootX=.18+t*.97,rootY=.24+Math.sin(t*Math.PI*.72)*.54,tipX=.42+t*1.86,tipY=1.92+Math.sin(t*Math.PI*.72)*.22-t*.55,dx=(tipX-rootX)*pose.spread,dy=tipY-rootY;feather(side*rootX*pose.spread,rootY,Math.hypot(dx,dy),.74-.12*t,-side*(Math.atan2(dx,dy)-pose.fold),0xffffff,pose.alpha,.01+i*.004);}
    for(let i=0;i<9;i++){const t=i/8;feather(side*(.17+t*1.10)*pose.spread,.32+Math.sin(t*Math.PI*.8)*.66,.62-t*.13,.57,-side*(.40+t*.65-pose.fold),0xfff7dd,pose.alpha,.12+i*.006);}
   }
   feather(0,.16,.83,.90,0,0xfff8df,pose.alpha,.18);feather(0,.94,.31,.85,0,0xfffdf0,pose.alpha,.18);
   const glow=(x,y,w,h,alpha,kind=0,color=0xffcf6a,z=.26)=>place(glows,glowAlpha,x*scale,y*scale,z*scale,w*scale,h*scale,1,0,color,alpha,kind);
   glow(0,1.48,.86,.27,pose.haloAlpha,1,0xffdd87);glow(0,.75,4.8,3.2,pose.flash*.32);glow(0,.2,1.4,4.8,pose.flash*.62,2);glow(0,1.47,1.18,.62,pose.alpha*.20);
   for(let i=0;i<14;i++){const a=i*2.399963,rad=(.4+(i%4)*.32)*(0.4+pose.progress*.7),cy=-1+((i*.17+age*.94)%2.8),size=.09+(i%3)*.045;glow(Math.cos(a)*rad,cy,size,size,pose.alpha*(.55+Math.sin(i+age*5)*.15),0,i%3?0xffd47e:0xfff7d6);}
  }
  for(const [mesh,alpha]of [[feathers,featherAlpha],[glows,glowAlpha]])if(mesh.count){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;alpha.needsUpdate=true;}if(glows.count)glowKind.needsUpdate=true;
 },reset,stats(){return {effects:active.size,visible:visibleEffects,feathers:feathers.count,glows:glows.count,drawCalls:Number(feathers.count>0)+Number(glows.count>0),lights:0};},dispose(){if(disposed)return;disposed=true;active.clear();seen.clear();for(const mesh of [feathers,glows]){mesh.removeFromParent();mesh.dispose();}featherGeo.dispose();glowGeo.dispose();featherMat.dispose();glowMat.dispose();}};
}
