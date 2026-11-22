import * as T from 'three';
import {roDaylight} from './ro-atmosphere.js';

export const RO_NATURE_ART_BUDGET=Object.freeze({ambient:120,skills:192,drawCalls:2,lights:0});
const rand=n=>{const x=Math.sin(n*91.17+41.3)*43758.5453;return x-Math.floor(x);};
const clamp=v=>Math.max(0,Math.min(1,v));

// Positions belong to the trees. The camera only culls particles; it never
// supplies their origin or motion, so turning the camera cannot drag them.
export function roForestLights(map,emitters,time,night){
 if(map?.stageKey!=='grove'||!emitters?.length)return [];
 const parts=[],seed=map.seed||1;
 for(let i=0;i<RO_NATURE_ART_BUDGET.ambient;i++){
  const tree=emitters[Math.floor(rand(seed+i*7)*emitters.length)],phase=rand(seed+i*13)*Math.PI*2,fly=i<96;
  const brightness=fly?clamp(night)*(.4+.6*Math.pow(.5+.5*Math.sin(time*1.6+phase),2)):.16*(1-clamp(night)*.65);
  if(brightness<.02)continue;
  const radius=.6+rand(seed+i*17)*2,x=tree.x+Math.cos(time*.27+phase)*radius+Math.sin(time*.79+phase)*.22,z=tree.z+Math.sin(time*.22+phase)*radius+Math.cos(time*.67+phase)*.23;
  const y=.7+rand(seed+i*19)*2.8+Math.sin(time*.61+phase)*.35,size=fly?.12+brightness*.13:.10;
  parts.push({x,y,z,size,color:fly?(i%3?0xd9ef82:0x92e9ba):0xdce9bb,brightness});
 }
 return parts;
}

export function roNatureSpellParts(state,time=state?.time||0){
 const b=state?.bonk;if(!b)return[];const parts=[],add=p=>{if(parts.length<RO_NATURE_ART_BUDGET.skills)parts.push(p);};
 for(const summon of b.roSkillSummons||[]){
  if(summon.key!=='yggwisps'||summon.until<=b.elapsed)continue;
  for(let i=0;i<5;i++){const phase=time*2.2+Number(summon.id||0)*1.7-i*.15;add({x:summon.x+Math.sin(phase)*.32,y:1.3+Math.cos(phase*.7)*.27-i*.035,z:summon.z+Math.cos(phase)*.32,size:i?.14:.43,color:i?0x8cd9a9:0xe7f9a9,brightness:(1-i*.16)*.85});}
 }
 for(const zone of b.roSkillZones||[]){
  if(zone.key!=='payonpetals'||zone.until<=b.elapsed)continue;
  for(let i=0;i<28;i++){const phase=i*2.39996+time*1.7,radius=zone.radius*(.35+.65*(i%7)/6),height=.18+(i%5)*.23+Math.sin(phase)*.12;add({x:zone.x+Math.sin(phase)*radius,y:height,z:zone.z+Math.cos(phase)*radius,size:.18+(i%3)*.035,color:i%3?0xf0adc3:0xb4e5c7,brightness:.7});}
 }
 for(const event of state.effects||[]){
  const age=(state.time||0)-event.time;if(event.skillKey!=='lunardew'||age<0||age>.9)continue;
  for(let i=0;i<18;i++){const a=i*2.39996,phase=clamp(age/.9),radius=(.55+phase*1.4)*(i%2?.75:1);add({x:event.x+Math.sin(a)*radius,y:.3+(1-phase)*2.2+(i%3)*.16,z:event.z+Math.cos(a)*radius,size:.16,color:i%3?0xa9e9cc:0xe6f4bf,brightness:1-phase});}
 }
 return parts;
}

export function createRoNatureArt({parent,heightAt=()=>0}){
 const root=new T.Group();root.name='ro-nature-details';parent.add(root);const geometry=new T.PlaneGeometry(1,1),material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
  vertexShader:'varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=instanceColor;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);center.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));gl_Position=projectionMatrix*center;}',
  fragmentShader:'varying vec2 vUv;varying vec3 vColor;void main(){float d=length(vUv-.5)*2.;if(d>1.)discard;float a=exp(-d*d*5.)*(1.-smoothstep(.55,1.,d));gl_FragColor=vec4(vColor,a*.8);\n#include <colorspace_fragment>\n}'
 }),dummy=new T.Object3D(),color=new T.Color();
 const make=(name,count)=>{const mesh=new T.InstancedMesh(geometry,material,count);mesh.name=name;mesh.instanceColor=new T.InstancedBufferAttribute(new Float32Array(count*3),3);mesh.count=0;mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);return mesh;};
 const ambient=make('ro-fireflies-and-seeds',RO_NATURE_ART_BUDGET.ambient),skills=make('ro-nature-skill-lights',RO_NATURE_ART_BUDGET.skills);
 function put(mesh,parts,viewer){let count=0;for(const p of parts){if(viewer&&Math.hypot(p.x-viewer.x,p.z-viewer.z)>55)continue;dummy.position.set(p.x,heightAt(p.x,p.z)+p.y,p.z);dummy.scale.setScalar(p.size);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count,color.setHex(p.color).multiplyScalar(p.brightness));count++;}mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;if(count)mesh.computeBoundingSphere();}
 return {root,update(state,time,emitters){const viewer=state.units?.find(u=>u.bonkHero),night=1-roDaylight(state.bonk?.totalElapsed??time).day;put(ambient,roForestLights(state.bonk?.map,emitters,time,night),viewer);put(skills,roNatureSpellParts(state,time),viewer);},stats(){return{ambient:ambient.count,skills:skills.count,drawCalls:Number(ambient.count>0)+Number(skills.count>0),lights:0};},reset(){ambient.count=skills.count=0;},dispose(){root.removeFromParent();ambient.removeFromParent();skills.removeFromParent();ambient.dispose();skills.dispose();geometry.dispose();material.dispose();}};
}
