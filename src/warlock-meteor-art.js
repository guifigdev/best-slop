import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createVoxelFire,VOXEL_FIRE_BUDGET} from './voxel-fire.js';
import {MOLTEN_LAVA_GLSL} from './lava-material.js';
import {WARLOCK_POLISH} from '../shared/warlock-polish.js';

export const WARLOCK_METEOR_BUDGET=Object.freeze({meteors:8,impacts:8,rocks:72,flames:2272,accents:640,drawCalls:3,lights:0});
const B=WARLOCK_METEOR_BUDGET,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fract=n=>n-Math.floor(n),point=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const hash=value=>{let n=2166136261;for(const c of String(value??0))n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0)*.0001;};
export function warlockMeteorPose(field,time){
 const fireAt=Number.isFinite(field.fireAt)?field.fireAt:time,start=Number.isFinite(field.warnStarted)?field.warnStarted:fireAt-WARLOCK_POLISH.meteor.warning,duration=Math.max(.01,fireAt-start),progress=clamp((time-start)/duration,0,1),radius=WARLOCK_POLISH.meteor.visualRadius,height=28-radius;
 return{x:field.x-6*(1-progress),y:radius+height*(1-progress*progress),z:field.z-3*(1-progress),progress,radius,tail:{x:-6,y:Math.max(14,2*height*progress),z:-3}};
}
export function createWarlockMeteorGeometry(){
 const core=new T.IcosahedronGeometry(1,2),p=core.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.09*Math.sin(x*5.3+z*3.8)+.055*Math.sin(y*7.1-x*2.7);p.setXYZ(i,x*r*.97,y*r*.93,z*r*1.05);}core.computeVertexNormals();
 const chunks=[core];for(const [x,y,z,scale]of [[-.67,.25,.15,.34],[.43,-.56,.25,.29],[.12,.36,-.7,.32]]){const lump=new T.IcosahedronGeometry(scale,1);lump.translate(x,y,z);chunks.push(lump);}const geometry=mergeGeometries(chunks);for(const chunk of chunks)chunk.dispose();geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

// Reproducible paused frames for the review UI; this fixture never runs Game or
// invents damage. The live route reads the actual warning and impact events.
export function warlockMeteorReviewSnapshot(time=0,{seed=41,x=0,z=0}={}){return{time,options:{mode:'warlock'},warlock:{arenaRadius:24,pillars:[],projectiles:[],fields:time<1?[{id:seed,source:seed,family:'meteor',x,z,radius:4.4,warnStarted:0,fireAt:1}]:[]},effects:time>=1&&time<1.9?[{id:'impact-'+seed,source:seed,type:'warlockMeteorImpact',x,z,time:1,duration:.9,radius:4.4}]:[]};}

export function createWarlockMeteorArt({parent}={}){
 const root=new T.Group();root.name='warlock-molten-meteors';root.visible=false;parent?.add(root);
 const geometry=createWarlockMeteorGeometry(),material=new T.ShaderMaterial({toneMapped:false,uniforms:{uTime:{value:0}},vertexShader:`varying vec3 meteorLocal;varying vec3 meteorNormal;
 void main(){meteorLocal=position;vec4 p=vec4(position,1.);vec3 n=normal;
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
 #endif
 meteorNormal=normalize(mat3(modelMatrix)*n);gl_Position=projectionMatrix*viewMatrix*modelMatrix*p;}`,fragmentShader:`varying vec3 meteorLocal;varying vec3 meteorNormal;uniform float uTime;
 ${MOLTEN_LAVA_GLSL}
 void main(){vec3 p=normalize(meteorLocal);vec2 sphere=vec2(atan(p.z,p.x)*3.2,asin(clamp(p.y,-1.,1.))*3.2);vec3 lava=pixelLavaColour(sphere,uTime);float lit=.53+.47*max(0.,dot(normalize(meteorNormal),normalize(vec3(-.4,1.,.3))));float molten=smoothstep(.3,.65,lava.r);float hot=pixelLavaNoise(sphere*1.3+vec2(7.,3.));vec3 heat=mix(vec3(.28,.035,.008),vec3(.95,.23,.025),smoothstep(.38,.75,hot));vec3 surface=mix(heat*lit,lava,max(molten,.35));gl_FragColor=vec4(surface,1.);}`});
 const hidden=new T.Group(),fire=createVoxelFire(hidden,{seed:742,smoke:false}),source=fire.root.children[0],particleMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,transparent:true,opacity:.94,depthWrite:false});
 const make=(name,g,m,count)=>{const mesh=new T.InstancedMesh(g,m,count);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);return mesh;};
 const rocks=make('warlock-meteor-falls',geometry,material,B.rocks),flames=make('warlock-meteor-fire-and-embers',source.geometry,source.material,B.flames),accents=make('warlock-meteor-warning',source.geometry,particleMaterial,B.accents),dummy=new T.Object3D(),matrix=new T.Matrix4(),transform=new T.Matrix4(),color=new T.Color(),up=new T.Vector3(0,1,0),tail=new T.Vector3(),orientation=new T.Quaternion();flames.renderOrder=3;accents.renderOrder=4;
 let disposed=false,meteorCount=0,impactCount=0,warningCount=0,impactParticles=0;
 const put=(mesh,x,y,z,w,h,d,hex=0xffffff,rx=0,ry=0,rz=0)=>{if(mesh.count>=mesh.instanceMatrix.count)return;dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(mesh.count,dummy.matrix);if(mesh!==rocks)mesh.setColorAt(mesh.count,color.setHex(hex));mesh.count++;};
 const plume=(x,y,z,w,h,d,quaternion,time,seed)=>{fire.update(time+seed);dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.quaternion.copy(quaternion);dummy.updateMatrix();transform.copy(dummy.matrix);for(let j=0;j<source.count;j++){source.getMatrixAt(j,matrix);matrix.premultiply(transform);flames.setMatrixAt(flames.count,matrix);source.getColorAt(j,color);flames.setColorAt(flames.count++,color);}};
 function clear(){rocks.count=flames.count=accents.count=meteorCount=impactCount=warningCount=impactParticles=0;root.visible=false;}
 return{root,rocks,flames,accents,reset:clear,update(snapshot,time=snapshot?.time||0){if(disposed)return;clear();if(snapshot?.options?.mode!=='warlock'||!snapshot.warlock||!Number.isFinite(time))return;const frame=Math.floor(time*8),t=frame/8,fields=(snapshot.warlock.fields||[]).filter(f=>f.family==='meteor'&&point(f)&&Number.isFinite(f.fireAt)&&time<f.fireAt&&time>=(f.warnStarted??f.fireAt-1)).slice(-B.meteors),impacts=(snapshot.effects||[]).filter(e=>e.type==='warlockMeteorImpact'&&point(e)&&Number.isFinite(e.time)&&time>=e.time&&time-e.time<(e.duration||.9)).slice(-B.impacts);material.uniforms.uTime.value=t;
  for(const field of fields){const p=warlockMeteorPose(field,time),seed=hash(field.id??field.source),r=p.radius;meteorCount++;put(rocks,p.x,p.y,p.z,r,r,r,0xffffff,seed+t*.55,seed+t*.7,seed+t*.27);tail.set(p.tail.x,p.tail.y,p.tail.z).normalize();orientation.setFromUnitVectors(up,tail);
   // Small approved voxel flames wrap the rock surface. The long turbulent
   // wake follows the opposite velocity, never an upright stack of big cubes.
   for(let i=0;i<12;i++){const y=1-(i+.5)/6,a=i*2.399963+seed,side=Math.sqrt(Math.max(0,1-y*y));plume(p.x+Math.cos(a)*side*r*.78,p.y+y*r*.78,p.z+Math.sin(a)*side*r*.78,r*.65,r*.35,r*.65,orientation,t,seed+i*.37);}
   for(let i=0;i<4;i++){const along=r*(.7+i*.87),swirl=Math.sin(t*4+seed+i)*r*.17,taper=1-i*.17;plume(p.x+tail.x*along+swirl,p.y+tail.y*along,p.z+tail.z*along+Math.cos(t*3+i)*r*.12,r*.72*taper,r*.38*taper,r*.72*taper,orientation,t,seed+4+i*.43);}
   for(let i=0;i<8;i++){const life=fract(t*.6+i*.618+seed),distance=r*(1+life*5),a=i*2.4+seed;put(flames,p.x+tail.x*distance+Math.sin(a)*life*r*.7,p.y+tail.y*distance,p.z+tail.z*distance+Math.cos(a)*life*r*.7,.06,.13,.06,life>.7?0xd6793a:0xffd68a,0,a);}
   for(let i=0;i<32;i++){const a=i*Math.PI/16,w=.12+.07*p.progress;put(accents,field.x+Math.cos(a)*field.radius,.22,field.z+Math.sin(a)*field.radius,w,.09,w,p.progress>.7?0xffa373:0xe7cb88,0,a);warningCount++;}
  }
  orientation.identity();for(const event of impacts){impactCount++;const p=clamp((time-event.time)/(event.duration||.9),0,1),radius=event.radius||4.4,seed=hash(event.id??event.source),fade=1-p;
   for(let i=0;i<8;i++){const a=i*2.39996+seed,spread=radius*p*(.45+(i%3)*.19),s=(.24+(i%3)*.13)*(1-p*.7);put(rocks,event.x+Math.cos(a)*spread,.2+s+Math.sin(p*Math.PI)*(1.7+(i%3)*.55),event.z+Math.sin(a)*spread,s,s*.8,s,0xffffff,t*2+a,t,a);}
   for(let i=0;i<6;i++){const a=i*Math.PI/3+seed,spread=radius*(.15+p*.47);plume(event.x+Math.cos(a)*spread,.13,event.z+Math.sin(a)*spread,(.45+radius*.16)*fade,(.35+fade*.5)*fade,(.45+radius*.16)*fade,orientation,t,seed+i*.51);}
   for(let i=0;i<12;i++){const a=i*2.399+seed,spread=radius*p*(.4+(i%3)*.2);put(flames,event.x+Math.cos(a)*spread,.3+Math.sin(p*Math.PI)*(1+(i%4)*.45),event.z+Math.sin(a)*spread,.07*fade,.15*fade,.07*fade,i%2?0xffd78e:0xe88b40,0,a);}
   for(let i=0;i<48;i++){const a=i*Math.PI/24,spread=radius*(.15+p*.85),s=(.16+(i%3)*.06)*fade;put(accents,event.x+Math.cos(a)*spread,.14+Math.sin(p*Math.PI)*.15,event.z+Math.sin(a)*spread,s,.055,s*.65,i%3?0xeab978:0xffe2a2,0,a);impactParticles++;}
  }
  for(const mesh of [rocks,flames,accents]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}root.visible=meteorCount+impactCount>0;
 },stats(){return{meteors:meteorCount,impacts:impactCount,rocks:rocks.count,flames:flames.count,warningParticles:warningCount,impactParticles,drawCalls:root.visible?root.children.filter(m=>m.count>0).length:0,lights:0};},dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();for(const mesh of [rocks,flames,accents])mesh.dispose();geometry.dispose();material.dispose();particleMaterial.dispose();fire.dispose();root.clear();}};
}
