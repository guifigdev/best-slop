import * as T from 'three';

// An authored 3D reinterpretation of Meteor Assault: eight radial lobes,
// billowing purple gas and an expanding low ring. No sprite extrusion/planes.
export const RO_POISON_NOVA_BUDGET=Object.freeze({casts:8,lobes:24,clumps:5,instances:960,duration:1.35,drawCalls:1});
const B=RO_POISON_NOVA_BUDGET,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const roPoisonNovaHandles=e=>e?.bonk&&e.skillKey==='asc_meteorassault'&&['roAttack','abilityPulse'].includes(e.type);
export function roPoisonNovaPose(event,age,lobe,clump){
 if(age<0||age>=B.duration)return null;
 const p=age/B.duration,a=lobe/B.lobes*Math.PI*2+(clump-2)*.075,radius=clamp(event.radius||event.range||2.5,.6,12),spread=radius*(.12+.72*(1-Math.pow(1-p,3))),phase=lobe*2.399+clump*1.73;
 const puff=radius*(.075+.035*Math.sin(phase)**2)*(.55+1.15*Math.sin(Math.min(1,p*1.4)*Math.PI/2)),edge=clump===0;
 return{x:event.x+Math.sin(a)*(spread+(clump-2)*puff*.37),z:event.z+Math.cos(a)*(spread+(clump-2)*puff*.37),y:.13+(edge?.06:.3+clump*.11)*radius*.35+p*radius*.23+Math.sin(phase+p*3)*puff*.13,w:puff*(edge?1.3:1),h:puff*(edge?.4:1+.3*Math.sin(phase)),d:puff*(edge?1.3:1),yaw:phase+p*.6,alpha:Math.min(1,p/.09)*Math.pow(1-p,1.15)*(edge?.20:.46),color:clump%3===0?0x9862b8:clump%3===1?0x713697:0xbf8cd0};
}
export function createRoPoisonNovaArt({scene}){
 const geometry=new T.IcosahedronGeometry(1,1),opacity=new T.InstancedBufferAttribute(new Float32Array(B.instances),1);geometry.setAttribute('cloudOpacity',opacity);
 const material=new T.MeshLambertMaterial({transparent:true,opacity:1,depthWrite:false,flatShading:true});material.onBeforeCompile=s=>{s.vertexShader='attribute float cloudOpacity;varying float vCloudOpacity;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCloudOpacity=cloudOpacity;');s.fragmentShader='varying float vCloudOpacity;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vCloudOpacity;');};material.customProgramCacheKey=()=> 'ro-poison-nova-3d-v1';
 const mesh=new T.InstancedMesh(geometry,material,B.instances);mesh.name='ro-poison-nova-clouds';mesh.count=0;mesh.visible=false;mesh.renderOrder=3;mesh.castShadow=mesh.receiveShadow=false;scene.add(mesh);
 const casts=new Map(),dummy=new T.Object3D(),color=new T.Color();let last=-Infinity,world='',disposed=false;
 const reset=()=>{casts.clear();mesh.count=0;mesh.visible=false;};
 return{mesh,update(state,time=state?.time||0,heightAt=()=>0){if(disposed)return;const next=[state?.options?.mode,state?.worldSeed,state?.bonk?.map?.seed,state?.bonk?.floor].join(':');if(next!==world||time<last)reset();world=next;last=time;
  const effects=state?.effects||[];for(const e of effects){if(!roPoisonNovaHandles(e)||![e.x,e.z,e.time].every(Number.isFinite)||time-e.time>=B.duration)continue;if(e.type==='abilityPulse'&&effects.some(o=>o.type==='roAttack'&&o.skillKey===e.skillKey&&o.source===e.source&&Math.abs(o.time-e.time)<.1))continue;const key=[e.source,e.id,e.time].join(':');if(!casts.has(key)){if(casts.size>=B.casts)casts.delete(casts.keys().next().value);casts.set(key,{...e,radius:e.type==='roAttack'?e.range||e.radius:e.radius});}}
  let at=0;for(const [key,e]of casts){const age=time-e.time;if(age>=B.duration){casts.delete(key);continue;}for(let lobe=0;lobe<B.lobes;lobe++)for(let clump=0;clump<B.clumps;clump++){const p=roPoisonNovaPose(e,age,lobe,clump);if(!p)continue;dummy.position.set(p.x,heightAt(p.x,p.z)+p.y,p.z);dummy.rotation.set(.12*Math.sin(lobe),p.yaw,.15*Math.cos(clump));dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();mesh.setMatrixAt(at,dummy.matrix);mesh.setColorAt(at,color.setHex(p.color));opacity.setX(at++,p.alpha);}}
  mesh.count=at;mesh.visible=at>0;if(at){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;opacity.needsUpdate=true;mesh.computeBoundingSphere();}
 },reset,stats:()=>({casts:casts.size,instances:mesh.count,drawCalls:mesh.visible?1:0,planes:0}),dispose(){if(disposed)return;disposed=true;reset();mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
