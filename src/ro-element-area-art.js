import * as T from 'three';
import {roGroundAreas} from './ro-ground-area-art.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roFireImpactHandles} from './ro-fire-impact-art.js';

export const RO_ELEMENT_AREA_BUDGET=Object.freeze({areas:12,particles:16,instances:192,drawCalls:1});
const elements=['physical','fire','ice','holy','poison','dark','wind','lightning','water','earth','arcane'];
export function roElementAreaParticles(state,time,heightAt=()=>0){
 const areas=roGroundAreas(state,time).filter(a=>!a.enemy&&a.skillKey!=='lg_earthdrive');
 for(const e of state?.effects||[])if(e.bonk&&!roFireImpactHandles(e)&&['fireball','frostnova'].includes(e.type)&&e.radius>.5&&time-e.time>=0&&time-e.time<.65)areas.push({...e,element:e.element||(e.type==='fireball'?'fire':'ice')});
 const parts=[];for(const a of areas.slice(-12)){
  const element=a.element||a.weapon?.element||RO_SKILLS[a.skillKey]?.element||'physical',kind=Math.max(0,elements.indexOf(element));if(['fire','earth','physical'].includes(element))continue;
  const age=a.time===undefined?time:time-a.time,fade=a.time===undefined?.8:Math.min(1,(.75-age)*3),radius=a.radius||3;
  for(let i=0;i<16;i++){
   const theta=i*2.39996,life=(age*1.4+i*.173)%1,spread=radius*Math.sqrt((i+.5)/16)*.9,x=a.x+Math.sin(theta)*spread,z=a.z+Math.cos(theta)*spread,
    tall=['holy','lightning'].includes(element)?2.8:element==='fire'?1.7:element==='ice'||element==='water'?1.65:1.1;
   parts.push({x,y:heightAt(x,z)+tall*.5+(element==='poison'||element==='dark'?life*.9:0),z,width:element==='lightning'?.7:element==='holy'?.55:1.0,height:tall,kind,phase:life,opacity:fade});
  }
 }return parts;
}
const vertexShader=`attribute float areaKind;attribute float areaPhase;attribute float areaOpacity;varying vec2 vUv;varying float vKind;varying float vPhase;varying float vOpacity;void main(){vUv=uv;vKind=areaKind;vPhase=areaPhase;vOpacity=areaOpacity;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
const fragmentShader=`varying vec2 vUv;varying float vKind;varying float vPhase;varying float vOpacity;void main(){vec2 uv=floor(vUv*64.0)/64.0;float x=uv.x*2.0-1.0;float y=uv.y;float alpha=0.0;vec3 color=vec3(1.0);
if(vKind<1.5){float bend=sin(y*8.0-vPhase*6.28)*.17*y;float width=(1.0-y)*(.51+sin(y*11.0-vPhase*9.0)*.10);float shape=abs(x-bend)/max(.01,width);alpha=(1.0-smoothstep(.75,1.0,shape))*smoothstep(0.0,.1,y);color=mix(vec3(1.0,.20,.025),vec3(1.0,.70,.08),1.0-shape);if(shape<.32&&y<.55)color=vec3(1.0,.96,.64);}
else if(vKind<2.5||vKind>7.5&&vKind<8.5){float shape=abs(x)*.75+abs(y-.5)*1.4;alpha=1.0-smoothstep(.48,.52,shape);color=x<-.10?vec3(.38,.75,1.0):x>.1?vec3(.77,.97,1.0):vec3(.96,1.0,1.0);alpha*=.87;}
else if(vKind<3.5){alpha=pow(max(0.0,1.0-abs(x)*2.5),2.0)*sin(y*3.14159)*.85;color=vec3(1.0,.94,.65);if(abs(x)<.15&&abs(y-.65)<.19||abs(x)<.65&&abs(y-.67)<.035)alpha=1.0;}
else if(vKind<4.5){float r=length(vec2(x,(y-.5)*2.0));alpha=(1.0-smoothstep(.65,.72,r))*.65;color=mix(vec3(.39,.75,.24),vec3(.77,1.0,.43),smoothstep(.25,.65,r));}
else if(vKind<5.5){float r=length(vec2(x,(y-.5)*2.0));alpha=(1.0-smoothstep(.25,.8,r))*.72;color=vec3(.61,.32,.95);if(abs(r-.53)<.045)alpha=.90;}
else if(vKind<6.5){float arc=abs(length(vec2(x,y*2.0-1.0))-.7);alpha=(1.0-smoothstep(.025,.08,arc))*(1.0-y);color=vec3(.60,1.0,.89);}
else if(vKind<7.5){float bolt=sin(floor(y*7.0)*4.2+vPhase)*.36;float d=abs(x-bolt);alpha=1.0-smoothstep(.035,.12,d);color=d<.045?vec3(1.0,1.0,.92):vec3(.67,.72,1.0);}
else{float r=length(vec2(x,(y-.5)*2.0));alpha=(1.0-smoothstep(.08,.3,r))*.8;color=vec3(.87,.66,1.0);}
alpha*=vOpacity;if(alpha<.015)discard;gl_FragColor=vec4(color,alpha);
#include <colorspace_fragment>
}`;
export function createRoElementAreaArt({scene}){
 const geometry=new T.PlaneGeometry(1,1);for(const name of ['areaKind','areaPhase','areaOpacity'])geometry.setAttribute(name,new T.InstancedBufferAttribute(new Float32Array(192),1).setUsage(T.DynamicDrawUsage));
 const material=new T.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false}),mesh=new T.InstancedMesh(geometry,material,192),dummy=new T.Object3D();mesh.count=0;mesh.frustumCulled=false;mesh.name='ro-elemental-area-particles';scene.add(mesh);
 return{update(state,time,heightAt,camera){const parts=roElementAreaParticles(state,time,heightAt);for(const [i,p]of parts.entries()){dummy.position.set(p.x,p.y,p.z);dummy.quaternion.copy(camera.quaternion);dummy.scale.set(p.width,p.height,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);geometry.attributes.areaKind.setX(i,p.kind);geometry.attributes.areaPhase.setX(i,p.phase);geometry.attributes.areaOpacity.setX(i,p.opacity);}mesh.count=parts.length;if(parts.length){mesh.instanceMatrix.needsUpdate=true;for(const name of ['areaKind','areaPhase','areaOpacity'])geometry.attributes[name].needsUpdate=true;}},stats:()=>({instances:mesh.count,drawCalls:mesh.count?1:0})};
}
