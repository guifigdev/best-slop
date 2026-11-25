import * as T from 'three';

export const RO_SAND_BUDGET=Object.freeze({casts:8,puffs:80,grains:224,duration:1.15,drawCalls:2});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** A low, forward fan of thrown sand, anchored to the cast position. */
export function roSandParticles(state,time,heightAt=()=>0){
 const puffs=[],grains=[];
 for(const e of (state?.effects||[]).filter(e=>e.type==='roAttack'&&e.skillKey==='tf_sprinklesand').slice(-RO_SAND_BUDGET.casts)){
  const age=time-e.time;if(age<0||age>=RO_SAND_BUDGET.duration)continue;
  const yaw=Number.isFinite(e.direction)?e.direction:Math.atan2((e.tx??e.x)-e.x,(e.tz??e.z)-e.z),s=Math.sin(yaw),c=Math.cos(yaw),p=age/RO_SAND_BUDGET.duration,fade=Math.min(1,age/.07)*(1-p)**1.4,reach=clamp(e.range||4,2,5);
  for(let i=0;i<10;i++){
   const spread=Math.sin(i*12.9898)*(.12+p*.85),along=.4+reach*(.12+((i*7)%10)/10*.5)*(1-Math.exp(-age*6)),x=e.x+s*along+c*spread,z=e.z+c*along-s*spread;
   puffs.push({x,y:heightAt(x,z)+.2+(i%3)*.18+p*.65,z,size:.35+p*1.6,opacity:fade*.48,phase:i*.7});
  }
  for(let i=0;i<28;i++){
   const a=yaw+Math.sin(i*7.3)*.55,speed=3+(i%7)*.6,flight=Math.max(0,(1.4+(i%4)*.28)*age-3*age*age),x=e.x+Math.sin(a)*(.5+speed*age),z=e.z+Math.cos(a)*(.5+speed*age);
   grains.push({x,y:heightAt(x,z)+.06+flight,z,size:(.045+(i%3)*.018)*Math.min(1,(1-p)*4),yaw:a+age*4,color:i%3===0?0xe4c994:i%3===1?0xb78c55:0x826241});
  }
 }
 return{puffs,grains};
}
export function createRoSandKickArt({scene}){
 const puffGeometry=new T.PlaneGeometry(1,1),opacity=new T.InstancedBufferAttribute(new Float32Array(80),1),phase=new T.InstancedBufferAttribute(new Float32Array(80),1);
 puffGeometry.setAttribute('puffAlpha',opacity);puffGeometry.setAttribute('puffPhase',phase);
 const puffMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide,vertexShader:'attribute float puffAlpha;attribute float puffPhase;varying vec2 uvP;varying float alphaP;varying float phaseP;void main(){uvP=uv;alphaP=puffAlpha;phaseP=puffPhase;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 uvP;varying float alphaP;varying float phaseP;void main(){vec2 p=floor(uvP*16.)/16.*2.-1.;float r=length(p);float edge=.72+.1*sin(p.x*13.+phaseP)*sin(p.y*9.-phaseP);float a=(1.-smoothstep(edge-.22,edge,r))*alphaP;if(a<.01)discard;gl_FragColor=vec4(mix(vec3(.52,.38,.22),vec3(.83,.71,.49),uvP.y),a);\n#include <colorspace_fragment>\n}'}),puffs=new T.InstancedMesh(puffGeometry,puffMaterial,80),grainGeometry=new T.BoxGeometry(1,1,1),grainMaterial=new T.MeshLambertMaterial(),grains=new T.InstancedMesh(grainGeometry,grainMaterial,224),dummy=new T.Object3D(),color=new T.Color();
 puffs.name='ro-sand-dust';grains.name='ro-sand-grains';puffs.frustumCulled=grains.frustumCulled=false;puffs.count=grains.count=0;scene.add(puffs,grains);let disposed=false;
 return{update(state,time,heightAt,camera){if(disposed)return;const parts=roSandParticles(state,time,heightAt);for(const[i,p]of parts.puffs.entries()){dummy.position.set(p.x,p.y,p.z);dummy.quaternion.copy(camera?.quaternion||new T.Quaternion());dummy.scale.set(p.size,p.size*.7,1);dummy.updateMatrix();puffs.setMatrixAt(i,dummy.matrix);opacity.setX(i,p.opacity);phase.setX(i,p.phase);}puffs.count=parts.puffs.length;for(const[i,p]of parts.grains.entries()){dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.yaw,p.yaw,.5);dummy.scale.set(p.size,p.size*.7,p.size*1.4);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);grains.setColorAt(i,color.setHex(p.color));}grains.count=parts.grains.length;if(puffs.count){puffs.instanceMatrix.needsUpdate=true;opacity.needsUpdate=phase.needsUpdate=true;}if(grains.count){grains.instanceMatrix.needsUpdate=true;grains.instanceColor.needsUpdate=true;}},stats:()=>({puffs:puffs.count,grains:grains.count,drawCalls:Number(puffs.count>0)+Number(grains.count>0)}),reset(){puffs.count=grains.count=0;},dispose(){if(disposed)return;disposed=true;puffs.removeFromParent();grains.removeFromParent();puffs.dispose();grains.dispose();puffGeometry.dispose();puffMaterial.dispose();grainGeometry.dispose();grainMaterial.dispose();}};
}
