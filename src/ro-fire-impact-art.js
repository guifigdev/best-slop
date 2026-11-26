import * as T from 'three';
import {createVoxelFire,VOXEL_FIRE_BUDGET} from './voxel-fire.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {isRoMeteorSkill} from '../shared/ro-meteor.js';

export const RO_FIRE_IMPACT_BUDGET=Object.freeze({impacts:12,sites:32,sitesPerImpact:8,partsPerSite:VOXEL_FIRE_BUDGET.flames+VOXEL_FIRE_BUDGET.embers,instances:544,drawCalls:1,smoke:0,maxRadius:12,maxDuration:1.1});
const B=RO_FIRE_IMPACT_BUDGET,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),element=e=>e?.element||RO_SKILLS[e?.skillKey]?.element,seed=value=>[...String(value)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,17)*.001;
export function roFireImpactHandles(event){
 if(event?.type==='fireball'&&!event.bonk&&event.impact!==true&&(event.phase==='launch'||event.phase==='travel'||event.projectile===true||Number.isFinite(event.tx)||Number.isFinite(event.tz)||event.from&&event.to))return false;
 if(['asc_meteorassault','mg_firewall'].includes(event?.skillKey))return false;
 return !!event&&(event.type==='roMeteorImpact'||event.type==='fireball'&&(!event.element||event.element==='fire')||event.type==='abilityPulse'&&event.radius>=1.2&&element(event)==='fire');
}
export function roFireImpacts(state,time=state?.time||0){
 if(!Number.isFinite(time))return[];const entries=[],effects=state?.effects||[];
 for(const e of effects){if(!roFireImpactHandles(e)||![e.x,e.z,e.time].every(Number.isFinite))continue;const duration=clamp(Number.isFinite(e.duration)?e.duration:.72,.35,B.maxDuration),age=time-e.time;if(age<0||age>=duration)continue;
  if(e.type==='abilityPulse'&&effects.some(other=>other.type==='fireball'&&Math.abs(other.time-e.time)<.1&&Math.hypot(other.x-e.x,other.z-e.z)<1))continue;
  entries.push({...e,key:'impact:'+e.id,time:e.time,duration,age,zone:false,radius:clamp(Number.isFinite(e.radius)?e.radius:2.5,.6,B.maxRadius)});
 }
 const elapsed=state?.bonk?.elapsed||0;for(const z of state?.bonk?.roSkillZones||[]){if(z.key==='mg_firewall'||z.weapon?.key==='mg_firewall'||isRoMeteorSkill(z.key)||(z.weapon?.element||RO_SKILLS[z.key]?.element)!=='fire'||z.until<=elapsed||![z.x,z.z].every(Number.isFinite))continue;entries.push({...z,key:'zone:'+z.id,time:time-1,duration:1,age:0,zone:true,radius:clamp(z.radius||3,.6,B.maxRadius)});}
 return entries.sort((a,b)=>Number(a.zone)-Number(b.zone)||b.time-a.time).slice(0,B.impacts);
}
export function createRoFireImpactArt({scene}){
 // One real campfire acts as the canonical flame animation source, kept outside
 // the scene. Its reference-counted resources stay alive until our disposal.
 const hidden=new T.Group();hidden.visible=false;const template=createVoxelFire(hidden,{seed:419,smoke:false}),sources=[template.root.getObjectByName('voxel-fire-flames'),template.root.getObjectByName('voxel-fire-embers')],geometry=sources[0].geometry.clone(),alpha=new T.InstancedBufferAttribute(new Float32Array(B.instances),1).setUsage(T.DynamicDrawUsage);geometry.setAttribute('fireOpacity',alpha);
 const material=sources[0].material.clone();material.opacity=1;material.onBeforeCompile=shader=>{shader.vertexShader='attribute float fireOpacity;varying float vFireOpacity;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFireOpacity=fireOpacity;');shader.fragmentShader='varying float vFireOpacity;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFireOpacity;');};material.customProgramCacheKey=()=> 'canonical-voxel-fire-impact-alpha-v1';
 const mesh=new T.InstancedMesh(geometry,material,B.instances);mesh.name='ro-volumetric-fire-impacts';mesh.count=0;mesh.visible=false;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=3;mesh.frustumCulled=true;scene.add(mesh);
 const slots=Array.from({length:B.impacts},()=>({key:null,event:null})),local=new T.Matrix4(),transform=new T.Matrix4(),world=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion(),axis=new T.Vector3(0,1,0),color=new T.Color(),projection=new T.Matrix4(),frustum=new T.Frustum(),bounds=new T.Sphere();let disposed=false,lastTime=-Infinity,lastWorld='',visibleImpacts=0,sites=0;
 const clear=()=>{for(const slot of slots){slot.key=null;slot.event=null;}mesh.count=0;mesh.visible=false;visibleImpacts=sites=0;};
 return{mesh,update(state,time=state?.time||0,heightAt=()=>0,camera){
  if(disposed)return;const worldKey=[state?.options?.mode,state?.bonk?.map?.seed,state?.bonk?.floor].join(':');if(worldKey!==lastWorld||time<lastTime)clear();lastWorld=worldKey;lastTime=time;
  const events=roFireImpacts(state,time),wanted=new Map(events.map(e=>[e.key,e]));for(const slot of slots){if(slot.key&&!wanted.has(slot.key)){slot.key=null;slot.event=null;}else if(slot.key)slot.event=wanted.get(slot.key);}for(const event of events)if(!slots.some(s=>s.key===event.key)){const slot=slots.find(s=>s.key===null);if(slot){slot.key=event.key;slot.event=event;}}
  const useFrustum=!!camera?.projectionMatrix&&!!camera?.matrixWorldInverse;if(useFrustum)frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));const active=slots.filter(s=>{if(!s.event)return false;const e=s.event;bounds.center.set(e.x,heightAt(e.x,e.z)+e.radius*.5,e.z);bounds.radius=e.radius*1.6+3;return !useFrustum||frustum.intersectsSphere(bounds);});
  let at=0;sites=0;visibleImpacts=active.length;const siteBase=active.length?Math.min(B.sitesPerImpact,Math.floor(B.sites/active.length)):0,spare=active.length?B.sites-siteBase*active.length:0;
  for(const [index,slot]of active.entries()){
   const e=slot.event,p=e.zone?0:clamp(e.age/e.duration,0,1),ease=1-Math.pow(1-p,3),fade=e.zone?.82:Math.min(1,p/.055)*Math.pow(1-p,.65),siteCount=Math.min(e.skillKey==='sm_magnum'||e.zone?8:4,siteBase+(index<spare?1:0)),phase=seed(slot.key);
   for(let site=0;site<siteCount;site++){
    const circular=e.skillKey==='sm_magnum',angle=phase+site*(circular?Math.PI*2/siteCount:2.39996),spread=circular?e.radius*ease*.66:site===0?0:e.zone?e.radius*Math.sqrt(site/Math.max(1,siteCount-1))*.72:e.radius*(.15+ease*.40),x=e.x+Math.sin(angle)*spread,z=e.z+Math.cos(angle)*spread,base=heightAt(x,z);
    // Coverage grows through separated plumes, never by stretching one cube
    // into an opaque orange wall at large skill radii.
    const width=Math.min(.85,e.radius*(circular?.26:e.zone?.40:.24+ease*.43)*(siteCount===1?1.5:.85)),height=Math.min(.72,e.radius*(e.zone?.24:.19+Math.sin(p*Math.PI)*.22));position.set(x,base+.04,z);rotation.setFromAxisAngle(axis,angle);scale.set(width,height,width);transform.compose(position,rotation,scale);
    template.update(time+phase*3+site*.47,{enabled:true,scale:1});for(const source of sources)for(let j=0;j<source.count;j++){source.getMatrixAt(j,local);world.multiplyMatrices(transform,local);mesh.setMatrixAt(at,world);source.getColorAt(j,color);mesh.setColorAt(at,color);alpha.setX(at++,fade);}
    sites++;
   }
  }
  mesh.count=at;mesh.visible=at>0;if(at){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;alpha.needsUpdate=true;mesh.computeBoundingSphere();}
 },stats(){return{impacts:visibleImpacts,pooled:slots.filter(s=>s.key!==null).length,poolCapacity:slots.length,sites,instances:mesh.count,drawCalls:mesh.visible?1:0,smoke:0,disposed};},reset(){clear();lastTime=-Infinity;lastWorld='';},dispose(){if(disposed)return;disposed=true;clear();mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();template.dispose();}};
}
