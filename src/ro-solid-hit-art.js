import {roMeleeTipPoint} from './ro-melee-motion.js';
import * as T from 'three';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {unitBodyStrikePoint} from '../shared/unit-body-shape.js';

export const RO_SOLID_HIT_BUDGET=Object.freeze({hits:24,strokes:16,instances:1024,drawCalls:2,planes:0});
export function roSolidWeaponHandles(event,unit){
 if(event?.type!=='roAttack'||!unit?.bonkHero||event.attackKind!=='slash'||['gc_crossimpact','gc_counterslash'].includes(event.skillKey))return false;
 const p=roAttackProfile(event,unit);return (['blade','dagger','fist'].includes(p.family)||p.family==='impact'&&['overhead','axeSlam'].includes(p.motion))&&!((!event.skillKey||event.skillKey==='basic')&&['daggerStreaks','katarCross'].includes(p.motion));
}
export function roHitSparkParts(event,time,target,source,heightAt=()=>0){
 const age=time-event.time;if(!target?.bonkEnemy||event.type!=='damage'||!(event.amount>0)||event.periodic||event.miss||age<0||age>=.24)return[];
 const p=age/.24,fade=Math.pow(1-p,1.4),contact=source?unitBodyStrikePoint(target,source):target,scale=event.critical?1.2:1,y=heightAt(target.x,target.z)+Math.min(2.6,Math.max(.55,(target.size||1)*.75))+(target.flying?target.altitude||1.5:0),yaw=source?Math.atan2(target.x-source.x,target.z-source.z):0,c=Math.cos(yaw),s=Math.sin(yaw),parts=[];
 // Sparse metal glints leave the contact point; no fixed X or screen decal.
 for(let i=0;i<16;i++){const a=i*2.39996+(Number(event.id)||1),r=(.035+age*1.7)*scale,sz=(i%3===0?.026:.016)*scale,dx=Math.sin(a),dy=Math.cos(a*1.7),dz=Math.cos(a);parts.push([contact.x+dx*r,y+dy*r,contact.z+dz*r*.55,sz,sz*(i%3===0?2.2:1),sz,i%4===0?0xffd59b:0xffefcb,fade*(i%3===0?.65:.42)]);}
 return parts;
}
export function roWeaponStrokeParts(event,time,unit,heightAt=()=>0){
 if(!roSolidWeaponHandles(event,unit))return[];const profile=roAttackProfile(event,unit),age=time-event.time,p=age/profile.duration;
 if(['overhead','thrust','axeSlam'].includes(profile.motion))return roSwordRibbonParts(event,age,unit,profile,heightAt);
 if(p<.12||p>.86)return[];const progress=(p-.12)/.42,reach=Math.min(event.range||2.1,Math.max(.8,Math.hypot((event.hitX??event.tx??unit.x)-unit.x,(event.hitZ??event.tz??unit.z+1)-unit.z))),yaw=event.direction??unit.facing??0,c=Math.cos(yaw),s=Math.sin(yaw),ground=heightAt(unit.x,unit.z)+(unit.bonkJumpHeight||0),parts=[],fade=Math.min(1,(.86-p)/.22);
 for(let j=0;j<14;j++){const q=(j+.5)/14;if(q>Math.min(1,progress))continue;const overhead=profile.motion==='overhead',thrust=profile.motion==='thrust',a=-1+q*2,x=overhead?Math.sin(q*Math.PI)*.06:thrust?0:Math.sin(a)*reach*.48,z=thrust?.3+q*reach:overhead?.35+q*reach:Math.cos(a)*reach,y=overhead?1.9-q*1.25:1.05+Math.sin(q*Math.PI)*.12;parts.push([unit.x+c*x+s*z,ground+y,unit.z-s*x+c*z,.035,.08,.14,0xe9f8ff,fade*(1-q*.25)]);}
 return parts;
}
function roSwordRibbonParts(event,age,unit,profile,heightAt){
 const motion=profile.duration,tail=.13;if(age<motion*.20||age>motion*.68+tail)return[];
 const x=event.x??unit.x,z=event.z??unit.z,yaw=Number.isFinite(event.direction)?event.direction:unit.facing||0,s=Math.sin(yaw),c=Math.cos(yaw),ground=heightAt(x,z)+(unit.bonkJumpHeight||0),kind=profile.weaponType||(['thrust'].includes(profile.motion)?'spear':profile.motion==='axeSlam'?'axe':'sword'),parts=[];
 // A short afterimage of the actual tip path, using the very same two joints
 // as the held weapon. It never grows to a target's distance or a ground ring.
 for(let j=0;j<18;j++){
  const t0=motion*(.20+j/18*.48),t1=motion*(.20+(j+1)/18*.48);if(t1>age||age-t1>=tail)continue;
  const p0=roMeleeTipPoint(unit,t0,motion,kind),p1=roMeleeTipPoint(unit,t1,motion,kind),side=(p0[0]+p1[0])/2,y=(p0[1]+p1[1])/2,along=(p0[2]+p1[2])/2,dx=p1[0]-p0[0],dy=p1[1]-p0[1],dz=p1[2]-p0[2],length=Math.hypot(dx,dy,dz)*1.10;if(length<.0001)continue;
  const tangent=[c*dx+s*dz,dy,-s*dx+c*dz],normal=[c*side+s*along,0,-s*side+c*along],fade=Math.pow(1-(age-t1)/tail,1.6),width=kind==='spear'?.035:.095;
  let dot=normal.reduce((n,v,i)=>n+v*tangent[i],0)/Math.max(1e-12,tangent.reduce((n,v)=>n+v*v,0));for(let i=0;i<3;i++)normal[i]-=tangent[i]*dot;if(Math.hypot(...normal)<.0001){normal.splice(0,3,0,1,0);dot=tangent[1]/Math.max(1e-12,tangent.reduce((n,v)=>n+v*v,0));for(let i=0;i<3;i++)normal[i]-=tangent[i]*dot;}
  parts.push([x+c*side+s*along,ground+y,z-s*side+c*along,width,length,.035,0xb4ced6,fade*.48,tangent,normal]);
  parts.push([x+c*side+s*along,ground+y+.015,z-s*side+c*along,width*.30,length,.019,0xf0e7cb,fade*.68,tangent,normal]);
 }
 return parts;
}

export function createRoSolidHitArt({scene}){
 const B=RO_SOLID_HIT_BUDGET,dummy=new T.Object3D(),color=new T.Color(),axis=new T.Vector3(0,1,0),direction=new T.Vector3(),normal=new T.Vector3(),radial=new T.Vector3(),basis=new T.Matrix4(),meshes=[],geometries=[],materials=[];let disposed=false;
 for(let i=0;i<2;i++){const g=new T.BoxGeometry(1,1,1);g.setAttribute('hitAlpha',new T.InstancedBufferAttribute(new Float32Array(B.instances),1));const m=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:T.CustomBlending,blendSrc:T.SrcAlphaFactor,blendDst:i?T.OneFactor:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor});m.onBeforeCompile=shader=>{shader.vertexShader='attribute float hitAlpha;varying float vHitAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHitAlpha=hitAlpha;');shader.fragmentShader='varying float vHitAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vHitAlpha;');};m.customProgramCacheKey=()=> 'physical-weapon-tip-trails-v3';const mesh=new T.InstancedMesh(g,m,B.instances);mesh.name=i?'ro-hit-particle-glow':'ro-solid-weapon-and-hit-particles';mesh.frustumCulled=false;mesh.count=0;mesh.visible=false;mesh.renderOrder=6;scene.add(mesh);meshes.push(mesh);geometries.push(g);materials.push(m);}
 const put=(parts,glow=false)=>{for(const part of parts)for(let layer=0;layer<(glow?2:1);layer++){const [x,y,z,w,h,d,tint,alpha,rotation,side]=part,mesh=meshes[layer],i=mesh.count;if(i>=B.instances)break;dummy.position.set(x,y,z);if(side){direction.fromArray(rotation).normalize();normal.fromArray(side).normalize();normal.addScaledVector(direction,-normal.dot(direction)).normalize();if(normal.lengthSq()<.01)normal.set(0,1,0).addScaledVector(direction,-direction.y).normalize();radial.crossVectors(normal,direction).normalize();basis.makeBasis(normal,direction,radial);dummy.quaternion.setFromRotationMatrix(basis);}else if(rotation)dummy.quaternion.setFromUnitVectors(axis,direction.fromArray(rotation).normalize());else dummy.quaternion.identity();dummy.scale.set(w*(layer?2.4:1),h*(layer?1.25:1),d*(layer?2.4:1));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.setHex(tint));geometries[layer].attributes.hitAlpha.setX(i,alpha*(layer?.20:1));mesh.count++;}};
 return{update(state,time,heightAt=()=>0){if(disposed)return;for(const m of meshes)m.count=0;if(state?.options?.mode==='bonk'){const units=new Map((state.units||[]).map(u=>[u.id,u]));for(const e of (state.effects||[]).filter(e=>e.type==='damage'&&time>=e.time&&time-e.time<.24).slice(-B.hits))put(roHitSparkParts(e,time,units.get(e.target),units.get(e.source),heightAt),true);for(const e of (state.effects||[]).filter(e=>roSolidWeaponHandles(e,units.get(e.source))).slice(-B.strokes))put(roWeaponStrokeParts(e,time,units.get(e.source),heightAt));}for(let i=0;i<2;i++){const mesh=meshes[i];mesh.visible=mesh.count>0;if(mesh.count){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;geometries[i].attributes.hitAlpha.needsUpdate=true;}}},reset(){for(const m of meshes){m.count=0;m.visible=false;}},stats:()=>({particles:meshes[0].count,glows:meshes[1].count,drawCalls:meshes.filter(m=>m.count).length,planes:0}),dispose(){if(disposed)return;disposed=true;for(const m of meshes){m.removeFromParent();m.dispose();}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
