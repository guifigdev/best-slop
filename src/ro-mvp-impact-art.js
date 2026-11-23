import * as T from 'three';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {roMvpImpactKind,roMvpImpactDuration} from '../shared/ro-mvp-encounters.js';
import {roWarningMarks} from './ro-warning-footprints.js';

export const RO_MVP_IMPACT_ART_BUDGET=Object.freeze({events:12,anchors:48,lines:4096,glow:2048,shards:1024,drawCalls:3});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),noise=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
const handles=e=>!!e?.mvp&&['bossImpact','bossDanger'].includes(e.type)&&Number.isFinite(e.id)&&Number.isFinite(e.time)&&Number.isFinite(e.x)&&Number.isFinite(e.z);

// Every emitter belongs to the same circle/ring/line/sector used by the server.
// Sampling the visible section avoids scattering a handful of tiny particles
// over a 60m attack, where none would be visible from the player camera.
export function roMvpImpactAnchors(e,{visible=()=>true,limit=48}={}){
 const points=roWarningMarks(e,{spacing:2.6,limit:768,visible});
 if(!points.length){const a=Math.atan2(e.dx||0,e.dz??1),r=e.shape==='ring'?((e.inner||0)+(e.radius||4))*.5:0,p={x:e.x+Math.sin(a)*r,z:e.z+Math.cos(a)*r};if(insideBossPattern(p,e)&&visible(p))points.push(p);}
 return points.length<=limit?points:Array.from({length:limit},(_,i)=>points[Math.floor(i*points.length/limit)]);
}

export function createRoMvpImpactArt({scene}){
 const B=RO_MVP_IMPACT_ART_BUDGET,root=new T.Group();root.name='ro-mvp-elemental-impacts';root.userData.roNoFacet=true;scene.add(root);
 const cube=new T.BoxGeometry(1,1,1),crystal=new T.ConeGeometry(.5,1,4,1,false),lineMaterial=new T.MeshBasicMaterial({transparent:true,opacity:.92,depthWrite:false,toneMapped:false}),glowMaterial=new T.MeshBasicMaterial({transparent:true,opacity:.94,depthWrite:false,toneMapped:false}),shardMaterial=new T.MeshLambertMaterial({flatShading:true}),lines=new T.InstancedMesh(cube,lineMaterial,B.lines),glow=new T.InstancedMesh(cube,glowMaterial,B.glow),shards=new T.InstancedMesh(crystal,shardMaterial,B.shards),dummy=new T.Object3D(),color=new T.Color(),direction=new T.Vector3(),up=new T.Vector3(0,1,0),projection=new T.Matrix4(),frustum=new T.Frustum(),sphere=new T.Sphere(),records=new Map();
 const meshes=[lines,glow,shards];for(const [i,m]of meshes.entries()){m.name=['mvp-lightning-and-fractures','mvp-native-flames-and-embers','mvp-ice-spikes-and-rocks'][i];m.count=0;m.frustumCulled=false;m.castShadow=false;m.receiveShadow=false;root.add(m);}let disposed=false,world='',last=-Infinity,counts=[0,0,0],activeEvents=0,heightAt=()=>0,camera=null;
 function put(mesh,x,y,z,w,h,d,c,angle=0,tilt=0){const k=mesh===lines?0:mesh===glow?1:2,index=counts[k];if(index>=mesh.instanceMatrix.count)return;counts[k]++;dummy.position.set(x,y,z);dummy.rotation.set(tilt,angle,tilt*.45);dummy.scale.set(Math.max(.001,w),Math.max(.001,h),Math.max(.001,d));dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.setHex(c));}
 function line(a,b,width,c){const index=counts[0];if(index>=B.lines)return;counts[0]++;direction.set(b.x-a.x,b.y-a.y,b.z-a.z);const length=direction.length();dummy.position.set((a.x+b.x)*.5,(a.y+b.y)*.5,(a.z+b.z)*.5);dummy.quaternion.setFromUnitVectors(up,direction.normalize());dummy.scale.set(width,Math.max(.001,length),width);dummy.updateMatrix();lines.setMatrixAt(index,dummy.matrix);lines.setColorAt(index,color.setHex(c));}
 const visible=p=>{if(!camera)return true;sphere.center.set(p.x,heightAt(p.x,p.z)+3,p.z);sphere.radius=6;return frustum.intersectsSphere(sphere);};
 function impact(e,age){
  const kind=roMvpImpactKind(e),duration=roMvpImpactDuration(e),life=clamp(age/duration,0,1),fade=1-life,points=roMvpImpactAnchors(e,{visible,limit:kind==='lightning'?24:B.anchors}),seed=e.warningId??e.id;let j=0;
  for(const p of points){const i=j++,n=noise(seed+i),angle=i*2.399+n,y=heightAt(p.x,p.z)+.035,pulse=Math.sin(Math.PI*Math.min(1,life*1.6));
   if(kind==='blizzard'){
    const height=(2.7+n*2.9)*Math.min(1,age/.16)*Math.min(1,fade*3),width=.7+n*.65;put(shards,p.x,y+height*.5,p.z,width,height,width, i%3?0x91d4ed:0xd7f9ff,angle,.06*Math.sin(angle));put(glow,p.x,y+height*.8,p.z,.13,.38*fade+.02,.13,0xf0ffff,angle);
    for(let k=0;k<2;k++){const a=angle+k*2.3,r=age*(1.1+n),h=.35+Math.sin(life*Math.PI)*(1.4+k);put(shards,p.x+Math.sin(a)*r,y+h,p.z+Math.cos(a)*r,.15,.5*fade+.02,.18,0xc9f1ff,a,age*3);}
   }else if(kind==='lightning'||kind==='holy'){
    const flash=kind==='holy'?1:Math.pow(Math.max(0,Math.sin(age*31+i*.7)),.3),height=(7+n*5)*fade,tint=kind==='holy'?0xffe3a2:0x8dcaff;if(flash<.12)continue;
    let previous={x:p.x,y,z:p.z};for(let k=1;k<=6;k++){const t=k/6,next={x:p.x+Math.sin(k*3.1+n*9)*.8*fade,y:y+height*t,z:p.z+Math.cos(k*2.9+n*5)*.6*fade};line(previous,next,(kind==='holy'?.25:.19)*fade,tint);line(previous,next,.065*fade,0xffffed);previous=next;}for(let k=0;k<3;k++){const a=angle+k*2.1,r=age*2.5;put(glow,p.x+Math.sin(a)*r,y+.2+fade*.4,p.z+Math.cos(a)*r,.15*fade+.01,.3*fade+.01,.15*fade+.01,0xffefa3,a);}
   }else if(kind==='eruption'||kind==='meteor'){
    // Same rising, tapered voxel flames and amber/ivory cores as voxel-fire.js;
    // batched here across the entire MVP footprint rather than 3 draws per fire.
    for(let k=0;k<6;k++){const flameLife=(age*.9+k/6+n*.2)%1,taper=(1-flameLife)*fade,a=k*2.4+n*6.28,spread=.42+flameLife*.23,h=.4+flameLife*(3.8+n*1.7);put(glow,p.x+Math.sin(a+age*2)*spread,y+h,p.z+Math.cos(a+age*1.4)*spread,.2+taper*.82,(.4+taper*1.35)*fade,.2+taper*.76,k%3===0?0xffec9d:flameLife>.55?0xd86c2e:0xffb346,a);}
    for(let k=0;k<2;k++){const r=age*(1+n*2),a=angle+k*2;put(glow,p.x+Math.sin(a)*r,y+.7+life*(5+k),p.z+Math.cos(a)*r,.08,.2*fade+.01,.08,0xffd47a,a);}
    if(kind==='meteor'&&i%3===0)put(shards,p.x,y+.3+pulse*1.2,p.z,.8*fade+.05,.7*fade+.05,.8*fade+.05,0x765044,angle,life*3);
   }else if(kind==='quake'){
    const flight=Math.sin(life*Math.PI),h=.4+flight*(1.1+n*2.2),r=life*(.3+n*.7),moved={x:p.x+Math.sin(angle)*r,z:p.z+Math.cos(angle)*r},at=insideBossPattern(moved,e)?moved:p;put(shards,at.x,y+h,at.z,.7*fade+.1,(.9+n)*fade+.05,.8*fade+.1,i%3?0x8b7760:0xb2a085,angle,life*3);for(let k=0;k<3;k++){const a=angle+k*2.1,xx=p.x+Math.sin(a)*.85,zz=p.z+Math.cos(a)*.85;line({x:p.x,y:y+.02,z:p.z},{x:xx,y:heightAt(xx,zz)+.045,z:zz},.12*fade+.015,0x4b3b31);}
   }else if(kind==='scythe'){
    const r=.8+n*.7,sweep=life*Math.PI*1.25,a=angle+sweep,h=y+1.2+Math.sin(life*Math.PI)*2.2;for(let k=0;k<5;k++){const aa=a-k*.15,bb=aa-.15;line({x:p.x+Math.sin(aa)*r,y:h+k*.12,z:p.z+Math.cos(aa)*r},{x:p.x+Math.sin(bb)*r,y:h+(k+1)*.12,z:p.z+Math.cos(bb)*r},(.17-k*.025)*fade,k?0x9e79cb:0xf3e3ff);}if(i%2===0)put(shards,p.x,y+.3+Math.sin(life*Math.PI),p.z,.38,.6*fade+.05,.38,0x604370,angle,life);
   }else{
    const poison=kind==='poison',r=life*(1+n),h=y+.2+life*(2+n);put(glow,p.x+Math.sin(angle)*r,h,p.z+Math.cos(angle)*r,(.5+n*.5)*fade+.03,(.65+n)*fade+.02,(.5+n*.5)*fade+.03,poison?0x9cc960:0x8954b7,angle);put(shards,p.x,y+(.8+n)*fade,p.z,.45,(1.5+n*2)*fade,.45,poison?0x78954a:0x57396b,angle);
   }
  }
 }
 function meteorWarning(e,age){const duration=e.duration||2.3,t=clamp((age-(duration-.65))/.65,0,1);if(t<=0||!visible(e))return;const y=heightAt(e.x,e.z),h=y+.7+(1-t)*13;put(shards,e.x,h,e.z,1.5,1.8,1.5,0x795347,e.id,t*3);for(let i=0;i<8;i++)put(glow,e.x+Math.sin(i*2.4)*.6,h+.3+i*.32,e.z+Math.cos(i*2.4)*.6,.8-i*.06,1.1,.8-i*.06,i%3===0?0xffec9d:0xffa94b,i);}
 return{root,update(state,time=state?.time||0,sampleHeight=()=>0,nextCamera=null){
  if(disposed)return;heightAt=sampleHeight;camera=nextCamera;if(camera)frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));const key=state?.options?.mode+':'+(state?.bonk?.map?.seed??state?.dungeon?.map?.seed??'');if(key!==world||time<last){records.clear();world=key;}last=time;counts=[0,0,0];activeEvents=0;root.visible=!!state;
  for(const e of state?.effects||[])if(handles(e)&&(e.type==='bossImpact'||roMvpImpactKind(e)==='meteor'))records.set(e.id+':'+e.type,{...e});while(records.size>B.events)records.delete(records.keys().next().value);
  for(const [key,e]of records){const age=time-e.time,duration=e.type==='bossDanger'?e.duration||2.3:roMvpImpactDuration(e);if(age<0||age>duration){records.delete(key);continue;}if(e.type==='bossDanger'){const pending=state?.bonk?.warnings||state?.dungeon?.telegraphs||state?.bossWarnings;if(pending&&!pending.some(w=>w.id===e.warningId)){records.delete(key);continue;}meteorWarning(e,age);}else{activeEvents++;impact(e,age);}}
  for(const [i,m]of meshes.entries()){m.count=counts[i];m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 },stats(){return{events:records.size,activeEvents,lines:counts[0],glow:counts[1],shards:counts[2],drawCalls:counts.filter(Boolean).length,renderTargets:0};},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const m of meshes)m.dispose();cube.dispose();crystal.dispose();lineMaterial.dispose();glowMaterial.dispose();shardMaterial.dispose();records.clear();root.clear();}};
}
