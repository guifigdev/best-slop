import * as T from 'three';

// Visual reference: guiduck/spinning-portfolio src/models/Sky/index.tsx:
// warm emissive sun + bloom + occluded GodRays. This authored world-space
// supplement uses one shared plane draw, not another composer or screen copy.
export const RO_SCATTERING_PLANE_BUDGET=Object.freeze({planes:4,mobilePlanes:2,drawCalls:1,triangles:8,renderTargets:0});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function roScatteringPlanePlan(state,{target={x:0,y:0,z:0},day=0,weatherStrength=1,intensity=.7,low=false}={}){
 const mode=state?.options?.mode,outdoor=['campaign','tower','best','war','linewars','castlefight'].includes(mode)||mode==='bonk'&&!state.bonk?.map?.tower&&!['payon','crypt','glacier'].includes(state.bonk?.map?.stageKey);
 if(!outdoor||state?.bonk?.map?.tower||!Number.isFinite(target?.x)||!Number.isFinite(target?.z)||!Number.isFinite(day)||!Number.isFinite(weatherStrength)||!Number.isFinite(intensity)||day<.12||weatherStrength<.55||intensity<=0)return[];
 const seed=Number(state?.bonk?.map?.seed||state?.worldSeed)||1,cx=Math.round(target.x/32),cz=Math.round(target.z/32),candidates=[],max=low?2:4;
 for(let ix=cx-1;ix<=cx+1;ix++)for(let iz=cz-1;iz<=cz+1;iz++){
  const key=ix*977+iz*739+seed*.017,x=ix*32+(hash(key)-.5)*17,z=iz*32+(hash(key+13)-.5)*17,distance=Math.hypot(x-target.x,z-target.z),fade=clamp((55-distance)/24,0,1);
  if(fade<=0)continue;candidates.push({id:ix+':'+iz,x,z,seed:hash(key+29),width:5+hash(key+37)*5,height:22+hash(key+53)*10,opacity:Math.min(.12,day*clamp(weatherStrength,0,1)*clamp(intensity,0,1.5)*.115)*(state.bonk?.warnings?.length ? .5 : 1)*fade,distance});
 }
 return candidates.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id)).slice(0,max);
}
const vertex=`uniform mat4 shaftShadowMatrix;attribute float shaftSeed;attribute float shaftOpacity;varying vec2 vShaftUv;varying vec3 vShaftWorld;varying vec4 vShaftShadow;varying float vShaftSeed;varying float vShaftOpacity;void main(){vShaftUv=uv;vShaftSeed=shaftSeed;vShaftOpacity=shaftOpacity;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);vShaftWorld=world.xyz;vShaftShadow=shaftShadowMatrix*world;gl_Position=projectionMatrix*viewMatrix*world;}`;
const fragment=`uniform float shaftTime;uniform vec3 shaftSun;uniform vec3 shaftColor;uniform sampler2D shaftShadowMap;uniform float shaftShadowEnabled;varying vec2 vShaftUv;varying vec3 vShaftWorld;varying vec4 vShaftShadow;varying float vShaftSeed;varying float vShaftOpacity;
#include <packing>
void main(){
 vec2 uv=vShaftUv;float x=uv.x*2.0-1.0;float side=pow(max(0.0,1.0-x*x),2.0),ends=smoothstep(0.0,.15,uv.y)*(1.0-smoothstep(.74,1.0,uv.y));
 // World-space modulation stays fixed when the camera turns. Only air drifts.
 float air=.76+.13*sin(dot(vShaftWorld.xz,vec2(.23,.31))+shaftTime*.075+vShaftSeed*6.28)+.09*sin(vShaftWorld.y*.43-shaftTime*.04);
 float narrow=exp(-pow((x+.36+vShaftSeed*.16)*6.0,2.0))*.34+exp(-pow((x-.28)*8.0,2.0))*.22;
 float cosine=dot(normalize(cameraPosition-vShaftWorld),normalize(shaftSun));float g=.58,phase=(1.0-g*g)/pow(max(.05,1.0+g*g-2.0*g*cosine),1.5);float scattering=.44+min(1.15,phase*.13);
 float lit=1.0;if(shaftShadowEnabled>.5){vec3 shadow=vShaftShadow.xyz/vShaftShadow.w;float inside=step(0.0,shadow.x)*step(shadow.x,1.0)*step(0.0,shadow.y)*step(shadow.y,1.0)*step(0.0,shadow.z)*step(shadow.z,1.0);lit=mix(1.0,step(shadow.z-.001,unpackRGBAToDepth(texture2D(shaftShadowMap,clamp(shadow.xy,.001,.999)))),inside);}
 float alpha=(side*.56+narrow)*ends*air*vShaftOpacity*scattering*lit;if(alpha<.0015)discard;gl_FragColor=vec4(shaftColor,alpha);
 #include <colorspace_fragment>
}`;
export function createRoScatteringPlane({scene}){
 const geometry=new T.PlaneGeometry(1,1),seed=new T.InstancedBufferAttribute(new Float32Array(4),1),opacity=new T.InstancedBufferAttribute(new Float32Array(4),1);geometry.setAttribute('shaftSeed',seed);geometry.setAttribute('shaftOpacity',opacity);
 const uniforms={shaftShadowMap:{value:null},shaftShadowEnabled:{value:0},shaftShadowMatrix:{value:new T.Matrix4()},shaftTime:{value:0},shaftSun:{value:new T.Vector3(.4,.8,.3)},shaftColor:{value:new T.Color(0xffd596)}},material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false,depthTest:true,toneMapped:false}),mesh=new T.InstancedMesh(geometry,material,4),dummy=new T.Object3D(),up=new T.Vector3(),right=new T.Vector3(),normal=new T.Vector3(),view=new T.Vector3(),basis=new T.Matrix4();
 mesh.name='ro-world-scattering-planes';mesh.count=0;mesh.visible=false;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=1;mesh.frustumCulled=true;scene.add(mesh);let disposed=false,last=[];
 return{mesh,update(state,time,camera,{target,day=0,weatherStrength=1,intensity=.7,low=false,sunDirection,sunColor,shadowLight,heightAt=()=>0,enabled=true}={}){
  if(disposed)return;last=enabled?roScatteringPlanePlan(state,{target,day,weatherStrength,intensity,low}):[];mesh.count=last.length;mesh.visible=!!last.length;if(!last.length)return;
  up.copy(sunDirection||uniforms.shaftSun.value);if(up.y<=.03){mesh.count=0;mesh.visible=false;return;}up.normalize();uniforms.shaftTime.value=Number.isFinite(time)?time:0;uniforms.shaftSun.value.copy(up);if(sunColor)uniforms.shaftColor.value.copy(sunColor);else uniforms.shaftColor.value.setHex(0xffd596);
  uniforms.shaftShadowEnabled.value=shadowLight?.castShadow&&shadowLight.shadow?.map?.texture?1:0;if(uniforms.shaftShadowEnabled.value){uniforms.shaftShadowMap.value=shadowLight.shadow.map.texture;uniforms.shaftShadowMatrix.value=shadowLight.shadow.matrix;}
  for(const [i,p]of last.entries()){
   dummy.position.set(p.x,heightAt(p.x,p.z)+.2,p.z).addScaledVector(up,p.height*.48);view.copy(camera.position).sub(dummy.position).normalize();right.crossVectors(up,view);if(right.lengthSq()<.001)right.set(1,0,0);right.normalize();normal.crossVectors(right,up).normalize();basis.makeBasis(right,up,normal);dummy.quaternion.setFromRotationMatrix(basis);dummy.scale.set(p.width,p.height,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);seed.setX(i,p.seed);opacity.setX(i,p.opacity);
  }
  mesh.instanceMatrix.needsUpdate=true;seed.needsUpdate=true;opacity.needsUpdate=true;mesh.computeBoundingSphere();
 },stats(){return{planes:mesh.visible?mesh.count:0,drawCalls:mesh.visible&&mesh.count?1:0,triangles:mesh.visible?mesh.count*2:0,renderTargets:0,anchors:last.map(p=>({id:p.id,x:p.x,z:p.z}))};},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
