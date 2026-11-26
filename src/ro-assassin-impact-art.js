import * as T from 'three';
import {roSlamParts} from './ro-slam-art.js';

const keys=new Set(['gc_counterslash','gc_crossimpact','ws_meltdown']);
export const roAssassinImpactHandles=e=>keys.has(e?.skillKey)&&['roAttack','abilityPulse','roSkillImpact','battlecry'].includes(e.type);
export const RO_ASSASSIN_IMPACT_BUDGET=Object.freeze({casts:8,energy:1536,stones:256,drawCalls:2,planes:0});
const clamp=n=>Math.max(0,Math.min(1,n));
// The installed client's new_counter_slash contains violet/blue lightning,
// gold sparks and a low shock burst; new_crossimpact uses orange-white cuts.
// Reconstructed as lit fragments and volumetric streaks, never sprite planes.
export function roAssassinImpactParts(e,time,heightAt=()=>0){
 const shatter=e.skillKey==='ws_meltdown',age=time-e.time,counter=e.skillKey==='gc_counterslash',duration=counter?.85:.72;if(age<0||age>=duration)return{energy:[],stones:[]};
 const energy=[],stones=[],seed=Number(e.id)||0,r=Math.max(.5,e.range||e.radius||1),x=counter||shatter?e.x:(e.hitX??e.tx??e.x),z=counter||shatter?e.z:(e.hitZ??e.tz??e.z),ground=heightAt(x,z),fade=clamp((duration-age)/.25);
 const yaw=e.direction||0,c=Math.cos(yaw),s=Math.sin(yaw),point=a=>({x:x+a[0]*c+a[2]*s,y:ground+a[1],z:z-a[0]*s+a[2]*c});const line=(a,b,width,color,alpha=1)=>energy.push({from:point(a),to:point(b),width,color,alpha:alpha*fade});
 if(shatter){
  const burst=clamp(age/.32),out=1-clamp(age/.72);for(let i=0;i<24;i++){const a=i*2.39996,rad=.22+burst*.85,y=.75+Math.cos(a)*rad;line([Math.sin(a)*rad*.55,y,Math.cos(a)*.14],[Math.sin(a)*(rad+.14),y+.09,Math.cos(a)*.3],.035*out,i%3?0xf2cd79:0xa6bec8,out);}
 }else if(counter){
  stones.push(...roSlamParts({...e,radius:r,duration:.65},time,heightAt).filter((_,i)=>i<24||i>=64).map(p=>[p[0],p[1],p[2],p[3]*.6,p[4]*.6,p[5]*.6,...p.slice(6)]));
  for(let ray=0;ray<9;ray++){const a=ray*2.39996+seed*.12,rad=Math.min(r,.7+ray%3*.2),phase=Math.floor(age*18),color=ray%3===0?0xffdc79:ray%2?0xb882ed:0x9bbcff;let last=[Math.sin(a)*rad,.12,Math.cos(a)*rad];
   for(let j=1;j<=5;j++){const jitter=Math.sin(ray*19+j*7+phase)*.16,point=[Math.sin(a)*rad+Math.cos(a)*jitter,.12+j*.39,Math.cos(a)*rad-Math.sin(a)*jitter];line(last,point,.025+(j%2)*.012,color,.8);last=point;}
  }
  const burst=clamp(age/.20),out=1-clamp((age-.12)/.26);for(let i=0;i<18&&out>0;i++){const a=i*2.39996,rad=(.25+burst*r)*(.6+i%3*.16),y=.18+(i%4)*.19+Math.sin(burst*Math.PI)*.35;line([Math.sin(a)*rad*.7,y,Math.cos(a)*rad*.7],[Math.sin(a)*rad,y+.12,Math.cos(a)*rad],.045*out,i%3?0xffe3a0:0xc297eb,out);}
 }else{
  // Seven staggered slashes concentrated on the actual contacted body edge.
  for(let hit=0;hit<7;hit++){const t=age-hit*.065;if(t<0||t>.23)continue;const p=t/.23,angle=(hit%2?-.72:.72)+(hit%3-1)*.18,span=.75+.18*Math.sin(p*Math.PI),y=.65+(hit%3)*.22,localFade=Math.sin(Math.PI*p),c=Math.cos(angle),s=Math.sin(angle);
   for(let j=0;j<10;j++){const q=(j+.5)/10,xx=(q-.5)*span*2,yy=Math.sin(q*Math.PI)*.10;line([xx*c,y+xx*s+yy,-.04],[ (xx+span*.22)*c,y+(xx+span*.22)*s+yy,.04],.035+Math.sin(q*Math.PI)*.055,hit%2?0xffad60:0xffe1a0,localFade);}
   for(let j=0;j<5;j++){const a=j*2.4+hit,rad=.18+p*.6;line([Math.sin(a)*rad,y+Math.cos(a)*rad,0],[Math.sin(a)*(rad+.16),y+Math.cos(a)*(rad+.16),.05],.025,0xffefb3,localFade);}
  }
 }
 return{energy,stones};
}
export function createRoAssassinImpactArt({scene}){
 const B=RO_ASSASSIN_IMPACT_BUDGET,geometry=new T.BoxGeometry(1,1,1),energyGeo=geometry.clone(),opacity=new T.InstancedBufferAttribute(new Float32Array(B.energy),1);energyGeo.setAttribute('impactAlpha',opacity);
 const energyMat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false});energyMat.onBeforeCompile=s=>{s.vertexShader='attribute float impactAlpha;varying float vImpactAlpha;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvImpactAlpha=impactAlpha;');s.fragmentShader='varying float vImpactAlpha;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vImpactAlpha;');};energyMat.customProgramCacheKey=()=> 'ro-assassin-volumetric-impacts-v1';
 const stoneMat=new T.MeshLambertMaterial(),energy=new T.InstancedMesh(energyGeo,energyMat,B.energy),stones=new T.InstancedMesh(geometry,stoneMat,B.stones),dummy=new T.Object3D(),color=new T.Color(),direction=new T.Vector3(),axis=new T.Vector3(0,0,1);energy.name='ro-assassin-ki-and-cross-cuts';stones.name='ro-counter-slash-stones';for(const m of [energy,stones]){m.count=0;m.frustumCulled=false;scene.add(m);}let disposed=false;
 return{update(state,time,heightAt=()=>0){if(disposed)return;energy.count=stones.count=0;for(const e of (state?.effects||[]).filter(e=>(e.type==='roAttack'||e.skillKey==='ws_meltdown'&&['battlecry','abilityPulse','roSkillImpact'].includes(e.type))&&keys.has(e.skillKey)&&time>=e.time&&time-e.time<.85).slice(-B.casts)){const parts=roAssassinImpactParts(e,time,heightAt);for(const p of parts.energy){if(energy.count>=B.energy)break;direction.set(p.to.x-p.from.x,p.to.y-p.from.y,p.to.z-p.from.z);const length=direction.length();dummy.position.set((p.from.x+p.to.x)/2,(p.from.y+p.to.y)/2,(p.from.z+p.to.z)/2);dummy.quaternion.setFromUnitVectors(axis,direction.normalize());dummy.scale.set(p.width,p.width,length);dummy.updateMatrix();energy.setMatrixAt(energy.count,dummy.matrix);energy.setColorAt(energy.count,color.setHex(p.color));opacity.setX(energy.count++,p.alpha);}for(const [x,y,z,w,h,d,c,a]of parts.stones){if(stones.count>=B.stones)break;dummy.position.set(x,y,z);dummy.rotation.set(a*.3,a,a*.6);dummy.scale.set(w,h,d);dummy.updateMatrix();stones.setMatrixAt(stones.count,dummy.matrix);stones.setColorAt(stones.count++,color.setHex(c));}}for(const m of [energy,stones])if(m.count){m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}opacity.needsUpdate=true;},reset(){energy.count=stones.count=0;},stats:()=>({energy:energy.count,stones:stones.count,drawCalls:(energy.count?1:0)+(stones.count?1:0),planes:0}),dispose(){if(disposed)return;disposed=true;for(const m of [energy,stones]){m.removeFromParent();m.dispose();}geometry.dispose();energyGeo.dispose();energyMat.dispose();stoneMat.dispose();}};
}
