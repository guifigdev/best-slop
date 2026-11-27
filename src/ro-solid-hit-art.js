import * as T from 'three';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {unitBodyStrikePoint} from '../shared/unit-body-shape.js';

export const RO_SOLID_HIT_BUDGET=Object.freeze({hits:24,strokes:16,instances:1024,drawCalls:2,planes:0});
export function roSolidWeaponHandles(event,unit){
 if(event?.type!=='roAttack'||!unit?.bonkHero||event.attackKind!=='slash'||['gc_crossimpact','gc_counterslash'].includes(event.skillKey))return false;
 const p=roAttackProfile(event,unit);return ['blade','dagger','fist'].includes(p.family)&&!((!event.skillKey||event.skillKey==='basic')&&['daggerStreaks','katarCross'].includes(p.motion));
}
export function roHitSparkParts(event,time,target,source,heightAt=()=>0){
 const age=time-event.time;if(!target?.bonkEnemy||event.type!=='damage'||!(event.amount>0)||event.periodic||event.miss||age<0||age>=.24)return[];
 const p=age/.24,fade=Math.pow(1-p,1.4),contact=source?unitBodyStrikePoint(target,source):target,scale=event.critical?1.2:1,y=heightAt(target.x,target.z)+Math.min(2.6,Math.max(.55,(target.size||1)*.75))+(target.flying?target.altitude||1.5:0),yaw=source?Math.atan2(target.x-source.x,target.z-source.z):0,c=Math.cos(yaw),s=Math.sin(yaw),parts=[];
 // A small crossed star retains the original impact composition, but each
 // glint is an independent luminous 3D sliver that spreads and fades.
 for(const side of [-1,1])for(let j=0;j<5;j++){const q=(j-2)/2,r=q*(.18+p*.16)*scale,xx=r,yy=side*r*.85;parts.push([contact.x+c*xx,y+yy,contact.z-s*xx,.035*scale,.10*scale,.035*scale,event.critical?0xffe58d:0xfff4d4,fade,[c*.75,side*.66,-s*.75]]);}
 for(let i=0;i<6;i++){const a=i*2.39996+(Number(event.id)||1),r=(.09+age*1.8)*scale,sz=.025*scale;parts.push([contact.x+Math.sin(a)*r,y+Math.cos(a*1.3)*r,contact.z+Math.cos(a)*r*.55,sz,.055*scale,sz,i%2?0xffd59b:0xffffed,fade]);}
 return parts;
}
export function roWeaponStrokeParts(event,time,unit,heightAt=()=>0){
 if(!roSolidWeaponHandles(event,unit))return[];const profile=roAttackProfile(event,unit),age=time-event.time,p=age/profile.duration;
 if(profile.motion==='overhead'&&profile.family==='blade')return roSwordRibbonParts(event,age,unit,profile,heightAt);
 if(p<.12||p>.86)return[];const progress=(p-.12)/.42,reach=Math.min(event.range||2.1,Math.max(.8,Math.hypot((event.hitX??event.tx??unit.x)-unit.x,(event.hitZ??event.tz??unit.z+1)-unit.z))),yaw=event.direction??unit.facing??0,c=Math.cos(yaw),s=Math.sin(yaw),ground=heightAt(unit.x,unit.z)+(unit.bonkJumpHeight||0),parts=[],fade=Math.min(1,(.86-p)/.22);
 for(let j=0;j<14;j++){const q=(j+.5)/14;if(q>Math.min(1,progress))continue;const overhead=profile.motion==='overhead',thrust=profile.motion==='thrust',a=-1+q*2,x=overhead?Math.sin(q*Math.PI)*.06:thrust?0:Math.sin(a)*reach*.48,z=thrust?.3+q*reach:overhead?.35+q*reach:Math.cos(a)*reach,y=overhead?1.9-q*1.25:1.05+Math.sin(q*Math.PI)*.12;parts.push([unit.x+c*x+s*z,ground+y,unit.z-s*x+c*z,.035,.08,.14,0xe9f8ff,fade*(1-q*.25)]);}
 return parts;
}
function roSwordRibbonParts(event,age,unit,profile,heightAt){
 const motion=profile.duration,life=Math.max(.26,Math.min(.8,motion+.14));if(age<motion*.08||age>=life)return[];
 const x=event.x??unit.x,z=event.z??unit.z,reach=Math.min(profile.range,Math.max(1.55,Math.hypot((event.hitX??event.tx??x)-x,(event.hitZ??event.tz??z+1)-z))),radius=Math.max(.55,reach-.20),yaw=Number.isFinite(event.direction)?event.direction:Math.atan2((event.tx??x)-x,(event.tz??z+1)-z),s=Math.sin(yaw),c=Math.cos(yaw),ground=heightAt(x,z)+(unit.bonkJumpHeight||0),reveal=Math.min(1,(age-motion*.08)/(motion*.62)),fade=Math.min(1,(life-age)/.14),parts=[],segments=18;
 // A connected, volumetric crescent follows the overhead cut. The translucent
 // blue body and bright outer edge overlap their neighbors; no sprite planes.
 for(let j=0;j<segments;j++){
  const tilt=.32,verticalRadius=1.9;const q0=j/segments,q1=(j+1)/segments,q=(q0+q1)/2;if(q>reveal)continue;
  const angle=-.30+q*2.10,a0=-.30+q0*2.10,a1=-.30+q1*2.10,z0=.20+Math.sin(a0)*radius,z1=.20+Math.sin(a1)*radius,y0=1.3+Math.cos(a0)*verticalRadius*Math.cos(tilt),y1=1.3+Math.cos(a1)*verticalRadius*Math.cos(tilt),x0=Math.cos(a0)*verticalRadius*Math.sin(tilt),x1=Math.cos(a1)*verticalRadius*Math.sin(tilt),side=(x0+x1)/2,dx=x1-x0,along=(z0+z1)/2,y=(y0+y1)/2,dy=y1-y0,dz=z1-z0,length=Math.hypot(dy,dz)*1.12,taper=Math.pow(Math.max(.06,Math.sin(q*Math.PI)),.45),width=.075+.17*taper,alpha=fade*(.92-.16*q),tangent=[c*dx+s*dz,dy,-s*dx+c*dz],normal=[c*Math.cos(tilt),-Math.sin(tilt),-s*Math.cos(tilt)];
  parts.push([x+c*side+s*along,ground+y,z-s*side+c*along,.18,length,width,0x87c9f2,alpha*.68,tangent,normal]);
  const edge=width*.32;parts.push([x+c*side+s*(along+Math.sin(angle)*edge),ground+y+Math.cos(angle)*edge*.9,z-s*side+c*(along+Math.sin(angle)*edge),.10,length,.070,0xf0fbff,alpha,tangent,normal]);
 }
 return parts;
}
export function createRoSolidHitArt({scene}){
 const B=RO_SOLID_HIT_BUDGET,dummy=new T.Object3D(),color=new T.Color(),axis=new T.Vector3(0,1,0),direction=new T.Vector3(),normal=new T.Vector3(),radial=new T.Vector3(),basis=new T.Matrix4(),meshes=[],geometries=[],materials=[];let disposed=false;
 for(let i=0;i<2;i++){const g=new T.BoxGeometry(1,1,1);g.setAttribute('hitAlpha',new T.InstancedBufferAttribute(new Float32Array(B.instances),1));const m=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:T.CustomBlending,blendSrc:T.SrcAlphaFactor,blendDst:i?T.OneFactor:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor});m.onBeforeCompile=shader=>{shader.vertexShader='attribute float hitAlpha;varying float vHitAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHitAlpha=hitAlpha;');shader.fragmentShader='varying float vHitAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vHitAlpha;');};m.customProgramCacheKey=()=> 'organized-3d-hit-glints-sword-ribbon-v2';const mesh=new T.InstancedMesh(g,m,B.instances);mesh.name=i?'ro-hit-particle-glow':'ro-solid-weapon-and-hit-particles';mesh.frustumCulled=false;mesh.count=0;mesh.visible=false;mesh.renderOrder=6;scene.add(mesh);meshes.push(mesh);geometries.push(g);materials.push(m);}
 const put=(parts,glow=false)=>{for(const part of parts)for(let layer=0;layer<(glow?2:1);layer++){const [x,y,z,w,h,d,tint,alpha,rotation,side]=part,mesh=meshes[layer],i=mesh.count;if(i>=B.instances)break;dummy.position.set(x,y,z);if(side){direction.fromArray(rotation).normalize();normal.fromArray(side).normalize();radial.crossVectors(normal,direction).normalize();basis.makeBasis(normal,direction,radial);dummy.quaternion.setFromRotationMatrix(basis);}else if(rotation)dummy.quaternion.setFromUnitVectors(axis,direction.fromArray(rotation).normalize());else dummy.quaternion.identity();dummy.scale.set(w*(layer?2.4:1),h*(layer?1.25:1),d*(layer?2.4:1));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.setHex(tint));geometries[layer].attributes.hitAlpha.setX(i,alpha*(layer?.20:1));mesh.count++;}};
 return{update(state,time,heightAt=()=>0){if(disposed)return;for(const m of meshes)m.count=0;if(state?.options?.mode==='bonk'){const units=new Map((state.units||[]).map(u=>[u.id,u]));for(const e of (state.effects||[]).filter(e=>e.type==='damage'&&time>=e.time&&time-e.time<.24).slice(-B.hits))put(roHitSparkParts(e,time,units.get(e.target),units.get(e.source),heightAt),true);for(const e of (state.effects||[]).filter(e=>roSolidWeaponHandles(e,units.get(e.source))).slice(-B.strokes))put(roWeaponStrokeParts(e,time,units.get(e.source),heightAt));}for(let i=0;i<2;i++){const mesh=meshes[i];mesh.visible=mesh.count>0;if(mesh.count){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;geometries[i].attributes.hitAlpha.needsUpdate=true;}}},reset(){for(const m of meshes){m.count=0;m.visible=false;}},stats:()=>({particles:meshes[0].count,glows:meshes[1].count,drawCalls:meshes.filter(m=>m.count).length,planes:0}),dispose(){if(disposed)return;disposed=true;for(const m of meshes){m.removeFromParent();m.dispose();}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
