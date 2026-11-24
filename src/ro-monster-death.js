import * as T from 'three';
import {RO_NATIVE_DEATH_DATA} from './ro-native-death-data.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),gel=/^(poring|poporing|drops|marin|magmaring|angeling|deviling|ghostring|tower_1582)$/,wood=/^(willow|elderwillow|woodengolem|dryad)$/;
export function roMonsterDeathPose(unit,time){
 if(unit.alive!==false||!Number.isFinite(unit.died))return null;const key=unit.ragnarokVisual,clip=RO_NATIVE_DEATH_DATA.monsters[key];if(!clip)return null;
 const duration=clamp(clip.delay*clip.frames.length,.25,2.1),age=Math.max(0,time-unit.died),frame=clip.frames[Math.min(clip.frames.length-1,Math.floor(age/clip.delay))],phase=clamp(age/duration,0,1),burst=gel.test(key),splinter=wood.test(key),progress=clamp(phase*1.4,0,1),humanoid=clip.base[1]>clip.base[0]*1.05;
 return {age,duration,visible:age<duration+.2,burst,splinter,phase,
  scaleX:burst?1+Math.sin(clamp(age/.16,0,1)*Math.PI)*.35:clamp(1+(frame[0]-1)*.3,.65,1.35),
  scaleY:burst?Math.max(.16,1-age*4):humanoid?clamp(1-(1-frame[1])*.25,.7,1):clamp(frame[1],.3,1.1),
  tilt:burst||splinter?0:(/lunatic/.test(key)?Math.PI*progress:humanoid||key==='spore'||key==='poisonspore'?1.4*progress:.45*progress),
  y:burst?-.12*progress:-.15*progress,x:clamp(frame[2],-.6,.6)*.25,
  bodyVisible:age<duration+.2&&(!burst||age<.16)&&(!splinter||age<.22),
  debris:burst||splinter,
 };
}
export function applyRoMonsterDeathPose(actor,unit,time){const p=roMonsterDeathPose(unit,time);if(!p)return false;actor.body.visible=p.bodyVisible;actor.body.scale.set(p.scaleX,p.scaleY,1);actor.body.rotation.set(0,0,p.tilt);actor.body.position.set(p.x,p.y,0);for(const [i,leg]of actor.legs.entries()){leg.userData.roDeathRestY??=leg.position.y;leg.visible=p.bodyVisible;leg.rotation.x=0;leg.rotation.z=p.tilt*(i%2?1:-1);leg.position.y=Math.max(.06,leg.userData.roDeathRestY*(1-p.phase*.85));}for(const wing of actor.wings)wing.group.rotation.z=wing.side*(.1+p.phase*.7);return true;}
export function createRoDeathDebris({scene,heightAt=()=>0}={}){
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.IcosahedronGeometry(.5,0),mat=new T.MeshLambertMaterial({vertexColors:false}),chips=new T.InstancedMesh(cube,mat,256),drops=new T.InstancedMesh(sphere,mat,256),dummy=new T.Object3D(),color=new T.Color();chips.name='ro-native-death-splinters';drops.name='ro-native-death-droplets';for(const m of [chips,drops]){m.count=0;m.castShadow=false;m.frustumCulled=false;scene.add(m);}
 return {update(units,time){chips.count=drops.count=0;for(const u of units){if(chips.count+drops.count>=256)break;const p=roMonsterDeathPose(u,time);if(!p?.debris||p.age<.12||p.age>p.duration+.15)continue;const t=clamp((p.age-.12)/Math.max(.2,p.duration-.12),0,1),mesh=p.burst?drops:chips,size=(u.size||1);for(let i=0;i<8;i++){const a=i*2.39996+Number(u.id||0),r=(.18+t*1.4)*size,x=u.x+Math.sin(a)*r,z=u.z+Math.cos(a)*r,y=heightAt(x,z)+Math.max(.1,(1-t)*(.4+Math.sin(t*Math.PI)*1.4))*size,s=(p.burst?.24:.16)*(1-t*.8)*size;dummy.position.set(x,y,z);dummy.rotation.set(t*4+i,t*3+i,t*5+i);dummy.scale.set(s,p.burst?s:s*2.8,s);dummy.updateMatrix();mesh.setMatrixAt(mesh.count,dummy.matrix);mesh.setColorAt(mesh.count++,color.setHex(p.splinter?i%2?0x876d49:0xb29461:u.ragnarokVisual==='drops'?0xe9b551:u.ragnarokVisual==='poporing'?0x9acb73:u.ragnarokVisual==='marin'?0x91d3e9:i%2?0xf4b7c7:0xd78ca8));}}
  for(const m of [chips,drops]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 },dispose(){for(const m of [chips,drops]){m.removeFromParent();m.dispose();}cube.dispose();sphere.dispose();mat.dispose();}};
}
