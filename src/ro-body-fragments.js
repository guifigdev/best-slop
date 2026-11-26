import * as T from 'three';
import {roMonsterProperties} from '../shared/ro-monster-properties.js';
import {ragnarokMonsterSpec} from './ragnarok-monster-art.js';
import {roMonsterDeathPose} from './ro-monster-death.js';

export const RO_BODY_FRAGMENT_BUDGET=Object.freeze({hits:24,corpses:12,instances:1152,drawCalls:1});
export function roBodyFragmentMaterial(unit){
 const key=unit.ragnarokVisual||'',race=roMonsterProperties(unit)?.race;
 if(unit.bonkHero)return{kind:'blood',colors:[0x9d2233,0xc43b46,0x7c2030]};
 if(/^(poring|drops|poporing|marin|angeling|deviling|ghostring|arcangeling|metaling|magmaring|stapo)$/.test(key))return{kind:'gel',colors:/poporing/.test(key)?[0x7bad4d,0xb5d980]:/marin/.test(key)?[0x8cd4e6,0xc1f5f3]:/drops|magmaring/.test(key)?[0xe8a04c,0xffd274]:[0xe994b9,0xf9bfd5]};
 if(/willow|woodengolem|dryad/.test(key))return{kind:'bark',colors:[0x705137,0xa18253,0xb99e69]};
 if(/skeleton|khalitzburg|anubis/.test(key))return{kind:'bone',colors:[0xb5b39a,0xe3d9b6]};
 if(/golem|mineral|obsidian|clock|alarm|mystcase|iceicle|icetitan/.test(key))return{kind:'stone',colors:/ice/.test(key)?[0x91d4df,0xd7f3f1]:[0x7f8179,0xa9a497]};
 if(/whisper|horong|nightmare|ghost/.test(key))return{kind:'ether',colors:[0xc1a3dc,0xa9d2e1]};
 if(race==='Planta')return{kind:'plant',colors:[0x719754,0xa0b872,0x8d704b]};
 if(race==='Inseto')return{kind:'ichor',colors:[0x77924c,0x9fbd64,0x6e6845]};
 return{kind:'blood',colors:[0x9d2233,0xc43b46,0x7c2030]};
}
export function roHitFragments(event,unit,time,heightAt=()=>0){
 const age=time-event.time;if(!(event.amount>0)||event.miss||age<0||age>=.65||!unit)return[];
 const m=roBodyFragmentMaterial(unit),size=unit.size||1,seed=Number(event.id)||0,parts=[],count=unit.bonkHero?9:6;
 for(let i=0;i<count;i++){const a=i*2.39996+seed*.37,speed=.7+(i%3)*.55,rad=age*speed,ground=heightAt(event.x,event.z),y=Math.max(ground+.045,ground+Math.min(1.6,size)*.75+(1.1+i%3*.35)*age-5.5*age*age),s=(m.kind==='gel'?.09:.055)*(1+(i%3)*.22)*Math.min(1,(.65-age)*6)*Math.min(1.5,size);parts.push([event.x+Math.sin(a)*rad,y,event.z+Math.cos(a)*rad,s,m.kind==='bark'?s*2.4:s,s,m.colors[i%m.colors.length],age*8+i]);}
 return parts;
}
const models=new Map();
export function roDeathFragments(unit,time,heightAt=()=>0){
 if(unit.alive!==false||!Number.isFinite(unit.died)||!unit.bonkEnemy)return[];const pose=roMonsterDeathPose(unit,time),start=unit.died+(pose?pose.duration+.2:.65),age=time-start;if(age<0||age>=.95)return[];
 const key=unit.ragnarokVisual;if(!models.has(key))models.set(key,ragnarokMonsterSpec(key));const spec=models.get(key);if(!spec)return[];
 const size=unit.size||1,yaw=unit.facing||0,c=Math.cos(yaw),s=Math.sin(yaw),tilt=pose?.tilt??1.4,ct=Math.cos(tilt),st=Math.sin(tilt),fade=Math.min(1,(.95-age)*4),parts=[];
 // Sample actual model blocks, preserving its palette and collapsed silhouette.
 const count=Math.min(64,spec.parts.length),stride=spec.parts.length/count;
 for(let i=0;i<count;i++){const p=spec.parts[Math.floor(i*stride)],a=i*2.39996+Number(unit.id||0),xx=(p[0]*ct-p[1]*st)*size,yy=Math.max(.08,(p[0]*st+p[1]*ct)*(pose?.scaleY||1)*size),zz=p[2]*size,rad=age*(.65+(i%5)*.18)*Math.sqrt(size),x=unit.x+xx*c+zz*s+Math.sin(a)*rad,z=unit.z-xx*s+zz*c+Math.cos(a)*rad,y=heightAt(x,z)+Math.max(.045,yy+(1.2+i%4*.25)*age-4.8*age*age),w=Math.min(.23,p[3])*.8*size*fade,h=Math.min(.23,p[4])*.8*size*fade,d=Math.min(.23,p[5])*.8*size*fade;parts.push([x,y,z,w,h,d,p[6],a+age*(i%2?4:-4)]);}
 return parts;
}
export function createRoBodyFragments({scene}){
 const B=RO_BODY_FRAGMENT_BUDGET,geometry=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial(),mesh=new T.InstancedMesh(geometry,material,B.instances),dummy=new T.Object3D(),color=new T.Color(),hits=new Map(),corpses=new Map(),lastHit=new Map();let world='',last=-Infinity,disposed=false;mesh.name='ro-blood-and-body-voxels';mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);
 const reset=()=>{mesh.count=0;hits.clear();corpses.clear();lastHit.clear();};
 return{update(state,time,heightAt=()=>0){if(disposed)return;const key=[state?.options?.mode,state?.bonk?.map?.seed,state?.bonk?.floor].join(':');if(key!==world||time<last)reset();world=key;last=time;const units=new Map((state?.units||[]).map(u=>[u.id,u]));
 for(const e of state?.effects||[]){const u=units.get(e.target);if(e.type!=='damage'||!(e.amount>0)||e.miss||!u||!(u.bonkHero||u.bonkEnemy)||time-e.time<0||time-e.time>=.65||hits.has(e.id)||(lastHit.get(u.id)??-Infinity)>e.time-.1)continue;hits.set(e.id,{event:{...e},unit:{...u}});lastHit.set(u.id,e.time);}
 for(const u of units.values())if(u.bonkEnemy&&u.alive===false&&Number.isFinite(u.died)&&time-u.died<3.4)corpses.set(u.id,{...u});
 while(hits.size>B.hits)hits.delete(hits.keys().next().value);while(corpses.size>B.corpses)corpses.delete(corpses.keys().next().value);let n=0;
 const put=parts=>{for(const [x,y,z,w,h,d,c,a]of parts){if(n>=B.instances)break;dummy.position.set(x,y,z);dummy.rotation.set(a,a*.6,a*.4);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n++,color.setHex(c));}};
 for(const [id,r]of hits){if(time-r.event.time>=.65){hits.delete(id);continue;}put(roHitFragments(r.event,r.unit,time,heightAt));}
 for(const [id,u]of corpses){if(time-u.died>=3.4){corpses.delete(id);continue;}put(roDeathFragments(u,time,heightAt));}for(const [id,t]of lastHit)if(time-t>2)lastHit.delete(id);
 mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
 },reset,stats:()=>({instances:mesh.count,hits:hits.size,corpses:corpses.size,drawCalls:mesh.count?1:0}),dispose(){if(disposed)return;disposed=true;reset();mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
