import * as T from 'three';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roFireImpactHandles} from './ro-fire-impact-art.js';

export const RO_GROUND_AREA_BUDGET=Object.freeze({warnings:8,impacts:8,friendly:12,areas:28,triangles:32768,vertices:98304,grid:1.8,cache:40,drawCalls:1});
const B=RO_GROUND_AREA_BUDGET,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a)),finite=(v,f=0)=>Number.isFinite(v)?v:f;
const friendlyColors=Object.freeze({fire:0xf7a84f,ice:0x80dce8,water:0x80dce8,holy:0xf1de94,poison:0xaacb79,dark:0xb99cde,earth:0xc4a47a,wind:0x9ddcce,lightning:0xdedc92,physical:0xc6d4e0,arcane:0xb7a6dd});
export const roGroundAreaContains=(point,pattern)=>insideBossPattern(point,pattern);

export function roGroundAreaBounds(p){
 if(p.shape==='line'){const norm=Math.hypot(p.dx,p.dz)||1,dx=(p.dx||0)/norm,dz=(p.dz||0)/norm,a=(p.length||0)/(2*norm),b=(p.width||0)/(2*norm),ex=Math.abs(dx)*a+Math.abs(dz)*b,ez=Math.abs(dz)*a+Math.abs(dx)*b;return{minX:p.x-ex,maxX:p.x+ex,minZ:p.z-ez,maxZ:p.z+ez};}
 const r=Math.max(0,finite(p.radius));return{minX:p.x-r,maxX:p.x+r,minZ:p.z-r,maxZ:p.z+r};
}

/** Global subdivision follows the same diagonals as the 3.6 m terrain surface. */
export function roGroundAreaGrid(pattern,heightAt=()=>0,{grid=B.grid,offset=.055}={}){
 const b=roGroundAreaBounds(pattern),step=Math.max(B.grid,grid),minX=Math.floor(b.minX/step)*step,minZ=Math.floor(b.minZ/step)*step,maxX=Math.ceil(b.maxX/step)*step,maxZ=Math.ceil(b.maxZ/step)*step,nx=Math.max(1,Math.round((maxX-minX)/step)),nz=Math.max(1,Math.round((maxZ-minZ)/step)),positions=new Float32Array(nx*nz*18);let at=0;
 const point=(x,z)=>[x,finite(heightAt(x,z)) + offset,z],put=p=>{positions.set(p,at);at+=3;};
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){const x=minX+ix*step,z=minZ+iz*step,a=point(x,z),b=point(x+step,z),c=point(x,z+step),d=point(x+step,z+step);put(a);put(c);put(b);put(b);put(c);put(d);}
 return{positions,triangles:nx*nz*2,key:[minX,minZ,maxX,maxZ,step].join(':'),bounds:new T.Box3().setFromBufferAttribute(new T.BufferAttribute(positions,3))};
}

/** Bounds and color only; no client-side damage, timing or collision changes. */
export function roGroundAreas(state,time=state?.time||0){
 const b=state?.bonk;if(state?.options?.mode!=='bonk'||!b)return[];const elapsed=finite(b.elapsed),effects=state.effects||[],enemy=[];
 for(const w of (b.warnings||[]).slice(0,B.warnings)){
  if(!Number.isFinite(w.x)||!Number.isFinite(w.z)||!Number.isFinite(w.fireAt)||w.fireAt<elapsed)continue;
  const fx=effects.find(e=>e.type==='bossDanger'&&e.warningId===w.id),duration=Math.max(.1,finite(fx?.duration,2.4)),start=finite(w.start,w.fireAt-duration),progress=clamp((elapsed-start)/Math.max(.1,w.fireAt-start),0,1);
  enemy.push({...w,id:'warning:'+w.id,progress,opacity:.32+progress*.20,color:0xff583c,enemy:true});
 }
 const impacts=effects.filter(e=>e.bonk&&e.type==='bossImpact'&&time-e.time>=0&&time-e.time<(e.duration||.7)).slice(-B.impacts).map(e=>({...e,id:'impact:'+e.id,progress:1,opacity:.38*(1-clamp((time-e.time)/(e.duration||.7),0,1)),color:0xffac59,enemy:true}));
 const zones=(b.roSkillZones||[]).filter(z=>z.until>elapsed).slice(-B.friendly).map(z=>({...z,id:'zone:'+z.id,shape:'circle',progress:clamp((elapsed-(z.until-(z.weapon?.mechanics?.duration||6)))/Math.max(1,z.weapon?.mechanics?.duration||6),0,1),opacity:.09,color:friendlyColors[z.weapon?.element]||friendlyColors.arcane,enemy:false}));
 const pulses=effects.filter(e=>e.bonk&&e.type==='abilityPulse'&&!roFireImpactHandles(e)&&e.radius>=1.2&&time-e.time>=0&&time-e.time<(e.duration||.55)&&!zones.some(z=>e.skillKey&&z.key===e.skillKey&&Math.hypot(z.x-e.x,z.z-e.z)<2)).slice(-Math.max(0,B.friendly-zones.length)).map(e=>({...e,id:'spell:'+e.id,shape:'circle',progress:clamp((time-e.time)/(e.duration||.55),0,1),opacity:.11*(1-clamp((time-e.time)/(e.duration||.55),0,1)),color:friendlyColors[e.element||RO_SKILLS[e.skillKey]?.element]||friendlyColors.physical,enemy:false}));
 return [...enemy,...impacts,...zones,...pulses].slice(0,B.areas);
}

export function roGroundAreaHandles(event,state){return state?.options?.mode==='bonk'&&!!event?.bonk&&(['bossDanger','bossImpact'].includes(event.type)||event.type==='abilityPulse'&&event.radius>=1.2);}

const vertexShader=`attribute float areaIndex;varying vec2 vGround;varying float vArea;void main(){vGround=position.xz;vArea=areaIndex;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragmentShader=`uniform float areaTime;uniform vec4 areaOrigin[${B.areas}];uniform vec4 areaShape[${B.areas}];uniform vec4 areaStyle[${B.areas}];uniform vec3 areaColor[${B.areas}];varying vec2 vGround;varying float vArea;
void main(){int i=int(vArea+0.5);vec4 o=areaOrigin[i];vec4 s=areaShape[i];vec4 t=areaStyle[i];vec2 d=vGround-o.xy;float r=length(d);float edge=0.0;
if(s.x<0.5){if(r>o.z)discard;edge=o.z-r;}
else if(s.x<1.5){if(r>o.z||r<o.w)discard;edge=min(o.z-r,r-o.w);}
else if(s.x<2.5){float along=dot(d,s.yz);float side=abs(d.x*s.z-d.y*s.y);if(abs(along)>s.w*0.5||side>o.z*0.5)discard;edge=min(s.w*0.5-abs(along),o.z*0.5-side);}
else{float facing=r<0.01?1.0:dot(d,s.yz)/r;if(r>o.z||facing<t.z)discard;edge=min(o.z-r,abs(facing-t.z)*r);}
float shimmer=0.5+0.5*sin(vGround.x*0.78+vGround.y*1.04-areaTime*(3.0+t.x*2.0));float bands=0.5+0.5*sin(r*1.7-areaTime*4.0);float rim=1.0-smoothstep(0.02,0.34,edge);float pulse=0.88+0.12*sin(areaTime*(4.0+t.x*5.0));float a=t.w*(0.76+shimmer*0.16+bands*0.08)*pulse;vec3 color=areaColor[i]*(0.90+shimmer*0.12)+rim*vec3(0.18,0.12,0.06);gl_FragColor=vec4(color,clamp(a+rim*0.16,0.0,0.70));
#include <colorspace_fragment>
}`;

/** One transparent surface batch; shape masks preserve every safe hole/gap. */
export function createRoGroundAreaArt({parent,heightAt=()=>0}){
 const root=new T.Group();root.name='ro-filled-ground-areas';parent.add(root);const positions=new Float32Array(B.vertices*3),indices=new Float32Array(B.vertices),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('areaIndex',new T.BufferAttribute(indices,1).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
 const origin=Array.from({length:B.areas},()=>new T.Vector4()),shape=Array.from({length:B.areas},()=>new T.Vector4()),style=Array.from({length:B.areas},()=>new T.Vector4()),colors=Array.from({length:B.areas},()=>new T.Color());
 const material=new T.ShaderMaterial({uniforms:{areaTime:{value:0},areaOrigin:{value:origin},areaShape:{value:shape},areaStyle:{value:style},areaColor:{value:colors}},vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),mesh=new T.Mesh(geometry,material);mesh.name='ro-filled-area-surface';mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=2;root.add(mesh);
 const cache=new Map(),matrix=new T.Matrix4(),frustum=new T.Frustum();let areas=[],disposed=false,lastLayout='',visible=[],culled=0,triangles=0,time=0,lastCamera=null;
 function gridFor(area){const b=roGroundAreaBounds(area),coarse=Math.max(B.grid,Math.ceil(Math.sqrt(Math.max(1,(b.maxX-b.minX)*(b.maxZ-b.minZ))/4096)/B.grid)*B.grid),key=[Math.floor(b.minX/coarse)*coarse,Math.floor(b.minZ/coarse)*coarse,Math.ceil(b.maxX/coarse)*coarse,Math.ceil(b.maxZ/coarse)*coarse,coarse].join(':');let grid=cache.get(key);if(!grid){grid=roGroundAreaGrid(area,heightAt,{grid:coarse});cache.set(key,grid);if(cache.size>B.cache)cache.delete(cache.keys().next().value);}return grid;}
 function render(camera){
  const useFrustum=!!camera?.projectionMatrix&&!!camera?.matrixWorldInverse;if(useFrustum)frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));visible=[];culled=0;triangles=0;
  for(const area of areas){const grid=gridFor(area);if(useFrustum&&!frustum.intersectsBox(grid.bounds)){culled++;continue;}if(triangles+grid.triangles>B.triangles)continue;visible.push({area,grid});triangles+=grid.triangles;}
  const layout=visible.map(({area,grid})=>area.id+'@'+grid.key).join('|');if(layout!==lastLayout){let at=0;for(let i=0;i<visible.length;i++){const p=visible[i].grid.positions;positions.set(p,at*3);indices.fill(i,at,at+p.length/3);at+=p.length/3;}geometry.setDrawRange(0,at);geometry.attributes.position.needsUpdate=geometry.attributes.areaIndex.needsUpdate=true;lastLayout=layout;}
  for(let i=0;i<visible.length;i++){const a=visible[i].area,kind=a.shape==='ring'?1:a.shape==='line'?2:a.shape==='cone'?3:0;origin[i].set(a.x,a.z,kind===2?finite(a.width):finite(a.radius),finite(a.inner));shape[i].set(kind,finite(a.dx,0),finite(a.dz,1),finite(a.length));style[i].set(clamp(a.progress,0,1),a.enemy?1:0,Math.cos(finite(a.angle,Math.PI*.5)/2),clamp(a.opacity,0,.65));colors[i].setHex(a.color);}
  root.visible=visible.length>0;material.uniforms.areaTime.value=time;
 }
 return{root,update(state,nextTime=state?.time||0){if(disposed)return;time=finite(nextTime);areas=roGroundAreas(state,time);render(lastCamera);},cull(camera){if(!disposed){lastCamera=camera;render(camera);}},stats(){return{areas:areas.length,visible:visible.length,triangles,vertices:geometry.drawRange.count,drawCalls:visible.length?1:0,culled,cache:cache.size,disposed};},reset(){areas=[];visible=[];cache.clear();lastLayout='';triangles=0;geometry.setDrawRange(0,0);root.visible=false;},dispose(){if(disposed)return;disposed=true;cache.clear();areas=[];visible=[];triangles=0;geometry.setDrawRange(0,0);geometry.dispose();material.dispose();root.removeFromParent();root.clear();}};
}
