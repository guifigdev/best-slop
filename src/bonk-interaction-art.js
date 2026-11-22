import * as T from 'three';
import {bonkGateFrame} from './bonk-gates.js';
export const BONK_INTERACTION_ART_BUDGET=Object.freeze({objects:8,distance:20,gateDistance:26,parts:320});
const hash=value=>{let n=0;for(const c of String(value))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;};

// A nearby treasure reads as a treasure without flooding the whole map in icons.
// All output goes into the existing rune/glint batch, with no per-object meshes.
export function bonkInteractionParts(data,hero,time,gates=[]){
 const B=BONK_INTERACTION_ART_BUDGET,parts=[],objectIds=[],gateIds=[],put=(x,y,z,w,h,d,c,a=0)=>{if(parts.length<B.parts)parts.push([x,y,z,w,h,d,c,a]);},objects=(data?.objects||[]).filter(o=>!o.used&&['chest','shrine','pot','campfire'].includes(o.type)&&Number.isFinite(o.x)&&Number.isFinite(o.z)&&(o.type!=='campfire'||(o.fuel??1)>0)&&Math.hypot(o.x-hero.x,o.z-hero.z)<=B.distance).sort((a,b)=>Number(b.id===data.nearestObject)-Number(a.id===data.nearestObject)||Math.hypot(a.x-hero.x,a.z-hero.z)-Math.hypot(b.x-hero.x,b.z-hero.z)).slice(0,B.objects);
 for(const o of objects){objectIds.push(o.id);const c=o.type==='chest'?0xf5d18b:o.type==='shrine'?0xace0dc:o.type==='pot'?0xc6b589:0xb6da96,phase=(time*.4+(hash(o.id)%101)*.013)%1,ring=o.type==='campfire'?28:o.type==='shrine'?10:o.type==='chest'?8:6,r=o.type==='campfire'?o.radius||3.5:o.type==='shrine'?1.1:o.type==='chest'?.85:.52;
  for(let j=0;j<ring;j++){const a=j*Math.PI*2/ring;put(o.x+Math.sin(a)*r,.055,o.z+Math.cos(a)*r,o.type==='campfire'?.045:.075,.028,o.type==='campfire'?.26:.18,c,-a);}
  if(o.type!=='campfire'&&phase<.48){const count=o.type==='shrine'?3:o.type==='chest'?2:1;for(let j=0;j<count;j++){const a=time*.7+j*Math.PI*2/count,up=(phase/.48+j*.31)%1,x=o.x+Math.sin(a)*r*.7,z=o.z+Math.cos(a)*r*.6,y=(o.type==='shrine'?1.35:.7)+up*.6,size=.045+Math.sin(up*Math.PI)*.035;put(x,y,z,size*3,size,.045,c,a);put(x,y,z,size,size*3,.045,c,a);}}
 }
 for(const gate of gates){if(Math.hypot(gate.x-hero.x,gate.z-hero.z)>B.gateDistance)continue;gateIds.push(gate.id);const frame=bonkGateFrame(gate),c=gate.open?0x84dcca:gate.lockedBy==='final'?0xb1a1d6:0xe2be7c,r=(gate.width||18)*.42;for(let j=0;j<18;j++){const a=j*Math.PI/9,q=frame.point(Math.cos(a)*r,.45);put(q.x,3.5+Math.sin(a)*3.25,q.z,.13,.2,.13,c,frame.angle+a);}for(let j=0;j<4;j++){const a=time*.65+j*Math.PI/2,q=frame.point(Math.cos(a)*r*.85,.48);put(q.x,3.5+Math.sin(a)*2.8,q.z,.06,.1,.06,c,a);}}
 return{parts,objectIds,gateIds};
}

export const BONK_INTERACTION_GLOW_BUDGET=Object.freeze({objects:8,equipment:8,distance:48,equipmentDistance:36,instances:96,drawCalls:1});
const glowVertex=`attribute float glowKind;attribute float glowPhase;varying vec2 vUv;varying vec3 vGlow;varying float vKind;varying float vPhase;void main(){vec4 center=modelViewMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);vec2 scale=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));vec4 p=center+vec4(position.xy*scale,0.0,0.0);vUv=uv;vGlow=instanceColor;vKind=glowKind;vPhase=glowPhase;gl_Position=projectionMatrix*p;}`;
const glowFragment=`uniform float glowTime;varying vec2 vUv;varying vec3 vGlow;varying float vKind;varying float vPhase;
void main(){vec2 q=vUv*2.0-1.0;float pulse=0.90+0.10*sin(glowTime*2.4+vPhase);float a=0.0;
if(vKind<0.5){float r=length(q);a=(exp(-r*r*4.0)*0.64+pow(max(0.0,1.0-r),3.0)*0.40)*(1.0-smoothstep(0.80,1.0,r));}
else if(vKind<1.5){float core=pow(max(0.0,1.0-abs(q.x)),5.0);float vertical=smoothstep(-1.0,-0.85,q.y)*pow(max(0.0,1.0-vUv.y),0.8);a=core*vertical*0.46;}
else if(vKind<2.5){float vertical=pow(max(0.0,1.0-abs(q.x)*5.0),2.0)*pow(max(0.0,1.0-abs(q.y)),1.8);float horizontal=pow(max(0.0,1.0-abs(q.y)*5.0),2.0)*pow(max(0.0,1.0-abs(q.x)),1.8);a=max(vertical,horizontal)*0.95;}
else{vec2 p=vUv;float stem=step(0.26,p.x)*step(p.x,0.39)*step(0.19,p.y)*step(p.y,0.81);float arm=step(0.34,p.x)*step(p.x,0.73)*max(max(step(abs(p.y-0.25),0.06),step(abs(p.y-0.5),0.06)),step(abs(p.y-0.75),0.06));float border=pow(max(0.0,1.0-length(q)),2.0)*0.22;a=max(stem,arm)*0.98+border;}
a*=pulse;if(a<0.005)discard;gl_FragColor=vec4(vGlow,a);
#include <colorspace_fragment>
}`;

/** A real luminous aura around the model. No opaque rings or scene lights. */
export function bonkInteractionGlowSources(data,hero){
 const B=BONK_INTERACTION_GLOW_BUDGET,valid=p=>!p.used&&Number.isFinite(p.x)&&Number.isFinite(p.z),distance=p=>Math.hypot(p.x-hero.x,p.z-hero.z);
 const objects=(data?.objects||[]).filter(o=>valid(o)&&['chest','shrine'].includes(o.type)&&distance(o)<=B.distance).sort((a,b)=>Number(b.id===data.nearestObject)-Number(a.id===data.nearestObject)||distance(a)-distance(b)).slice(0,B.objects).map(o=>({...o,glowSource:'object',distance:distance(o),near:o.id===data.nearestObject&&distance(o)<=4.8}));
 const equipment=(data?.pickups||[]).filter(p=>valid(p)&&p.type==='equipment'&&distance(p)<=B.equipmentDistance).sort((a,b)=>distance(a)-distance(b)).slice(0,B.equipment).map(p=>({...p,glowSource:'equipment',distance:distance(p),near:false}));
 return [...objects,...equipment];
}

export function createBonkInteractionGlow({parent,heightAt=()=>0}){
 const B=BONK_INTERACTION_GLOW_BUDGET,root=new T.Group();root.name='bonk-interaction-glow';parent.add(root);
 const geometry=new T.PlaneGeometry(1,1),kinds=new T.InstancedBufferAttribute(new Float32Array(B.instances),1),phases=new T.InstancedBufferAttribute(new Float32Array(B.instances),1);kinds.setUsage(T.DynamicDrawUsage);phases.setUsage(T.DynamicDrawUsage);geometry.setAttribute('glowKind',kinds);geometry.setAttribute('glowPhase',phases);
 const material=new T.ShaderMaterial({uniforms:{glowTime:{value:0}},vertexShader:glowVertex,fragmentShader:glowFragment,transparent:true,blending:T.AdditiveBlending,depthWrite:false,depthTest:true,toneMapped:false,side:T.DoubleSide});
 const mesh=new T.InstancedMesh(geometry,material,B.instances);mesh.name='bonk-luminous-interactables';mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=5;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);
 const dummy=new T.Object3D(),tint=new T.Color(),sphere=new T.Sphere(),matrix=new T.Matrix4(),frustum=new T.Frustum();let sources=[],time=0,disposed=false,culled=0,ids=[],lastCamera=null;
 function render(camera){
  let count=0;culled=0;ids=[];const useFrustum=!!camera?.projectionMatrix&&!!camera?.matrixWorldInverse;if(useFrustum)frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const put=(x,y,z,w,h,color,kind,phase)=>{if(count>=B.instances)return;dummy.position.set(x,y,z);dummy.scale.set(w,h,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count,tint.setHex(color));kinds.setX(count,kind);phases.setX(count,phase);count++;};
  for(const o of sources){
   const ground=heightAt(o.x,o.z)||0,equipment=o.glowSource==='equipment',shrine=o.type==='shrine',center=equipment?.66:shrine?1.75:.80,phase=(hash(o.id)%997)*.031;
   sphere.center.set(o.x,ground+center+1.1,o.z);sphere.radius=3.4;if(useFrustum&&!frustum.intersectsSphere(sphere)){culled++;continue;}ids.push(o.id);
   const pulse=1+Math.sin(time*1.7+phase)*.05,halo=(equipment?2.0:shrine?3.35:2.85)*pulse,color=equipment?0xffe6a2:shrine?0xffebbb:0xffdb91;
   put(o.x,ground+center,o.z,halo,halo,color,0,phase);
   put(o.x,ground+center+1.15,o.z,equipment?.65:.82,equipment?2.9:3.7,color,1,phase);
   for(let j=0;j<3;j++){const life=(time*.32+j/3+phase*.13)%1,a=phase+j*2.4+time*.25,r=equipment?.34:.48;put(o.x+Math.sin(a)*r,ground+center-.12+life*(equipment?1.8:2.3),o.z+Math.cos(a)*r,.26,.26,0xfff2cf,2,phase+j);}
   if(o.near)put(o.x,ground+center+2.15,o.z,.5,.5,0xfff3d6,3,phase);
  }
  mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;kinds.needsUpdate=phases.needsUpdate=true;root.visible=count>0;
 }
 return{root,update(data,hero,nextTime=0){if(disposed)return;time=Number.isFinite(nextTime)?nextTime:0;material.uniforms.glowTime.value=time;sources=bonkInteractionGlowSources(data,hero||{x:0,z:0});render(lastCamera);},cull(camera){if(!disposed){lastCamera=camera;render(camera);}},stats(){return{sources:sources.length,visible:ids.length,instances:mesh.count,drawCalls:mesh.count?1:0,culled,ids:[...ids],disposed};},dispose(){if(disposed)return;disposed=true;sources=[];ids=[];mesh.count=0;mesh.dispose();geometry.dispose();material.dispose();root.removeFromParent();root.clear();}};
}
