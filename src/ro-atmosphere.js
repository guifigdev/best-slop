import * as T from 'three';

export const RO_ATMOSPHERE_BUDGET=Object.freeze({drawCalls:2,rays:6,renderTargets:0,cycleSeconds:720});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
export function roDaylight(seconds=0){
 const angle=(Math.max(0,seconds)/720+.08)*Math.PI*2,altitude=Math.sin(angle),day=smooth(-.15,.28,altitude),twilight=1-smooth(.04,.45,Math.abs(altitude));
 return {angle,day,twilight,hour:(6+angle/(Math.PI*2)*24)%24,hemisphere:1.05+day*.85,direct:.68+day*1.62,exposure:.93+day*.05};
}

// Analytic environment response: no scene copies, transmission pass or screen
// distortion. Reflected/refracted sky light subtly colors edges and bright metal.
export function createRoActorLighting(){
 const materials=new WeakSet(),uniforms={roEnvEnabled:{value:0},roSky:{value:new T.Color(0x9fc6dc)},roGround:{value:new T.Color(0x849265)},roSun:{value:new T.Color(0xffdfad)},roSunDirection:{value:new T.Vector3(-.5,.7,.4)}};
 return {uniforms,coat(material){if(!material||materials.has(material))return material;materials.add(material);const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey?.call(material)||'';
  material.onBeforeCompile=(shader,renderer)=>{previous?.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);shader.vertexShader='varying vec3 roWorldNormal;varying vec3 roWorldPosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvec4 roVertex=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nroVertex=instanceMatrix*roVertex;\n#endif\nroWorldPosition=(modelMatrix*roVertex).xyz;roWorldNormal=inverseTransformDirection(transformedNormal,viewMatrix);');
   shader.fragmentShader='uniform float roEnvEnabled;uniform vec3 roSky;uniform vec3 roGround;uniform vec3 roSun;uniform vec3 roSunDirection;varying vec3 roWorldNormal;varying vec3 roWorldPosition;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`if(roEnvEnabled>0.5){vec3 roN=normalize(roWorldNormal);vec3 roV=normalize(cameraPosition-roWorldPosition);vec3 roR=reflect(-roV,roN);vec3 roT=refract(-roV,roN,0.76);float roF=pow(1.0-max(dot(roN,roV),0.0),3.0);vec3 roReflection=mix(roGround,roSky,clamp(roR.y*0.5+0.5,0.0,1.0));vec3 roRefraction=mix(roGround,roSky,clamp(roT.y*0.5+0.5,0.0,1.0));float roMetal=smoothstep(0.25,0.8,dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)));float roSpec=pow(max(dot(roR,roSunDirection),0.0),22.0);outgoingLight+=roEnvEnabled*(roReflection*roF*0.18+roRefraction*0.025+roSun*roSpec*roMetal*0.15); }\n#include <opaque_fragment>`);
  };material.customProgramCacheKey=()=> previousKey+'|ro-analytic-environment-v1';material.needsUpdate=true;return material;
 }};
}

const skyVertex='varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const skyFragment=`uniform vec3 topColor;uniform vec3 horizonColor;uniform vec3 sunDirection;uniform float day;varying vec3 skyDirection;void main(){vec3 d=normalize(skyDirection);float up=smoothstep(-0.08,0.72,d.y);vec3 color=mix(horizonColor,topColor,up);float solar=dot(d,sunDirection);float lunar=dot(d,-sunDirection);color+=vec3(1.0,0.76,0.40)*(smoothstep(0.99945,0.99985,solar)*0.9+pow(max(solar,0.0),220.0)*0.13)*day;color+=vec3(0.75,0.85,1.0)*(smoothstep(0.99965,0.99988,lunar)*0.8+pow(max(lunar,0.0),700.0)*0.05)*(1.0-day);vec3 cell=floor(d*230.0);float star=step(0.9985,fract(sin(dot(cell,vec3(12.9,78.2,35.6)))*43758.54));color+=star*(1.0-day)*smoothstep(0.12,0.5,d.y)*0.25;gl_FragColor=vec4(color,1.0);\n#include <colorspace_fragment>\n}`;
const rayVertex='varying vec2 vRayUv;void main(){vRayUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}';
const rayFragment='uniform vec3 rayColor;uniform float rayStrength;varying vec2 vRayUv;void main(){float sides=pow(max(0.0,1.0-abs(vRayUv.x*2.0-1.0)),2.0);float ends=smoothstep(0.0,0.15,vRayUv.y)*(1.0-smoothstep(0.65,1.0,vRayUv.y));float alpha=sides*ends*rayStrength;if(alpha<0.002)discard;gl_FragColor=vec4(rayColor,alpha);\n#include <colorspace_fragment>\n}';

export function createRoAtmosphere({scene,sun,skyLight,actorLighting}){
 const root=new T.Group();root.name='ro-day-and-night';root.visible=false;scene.add(root);
 const uniforms={topColor:{value:new T.Color()},horizonColor:{value:new T.Color()},sunDirection:{value:new T.Vector3()},day:{value:1}};
 const sky=new T.Mesh(new T.SphereGeometry(780,24,12),new T.ShaderMaterial({uniforms,vertexShader:skyVertex,fragmentShader:skyFragment,side:T.BackSide,depthWrite:false,depthTest:false,toneMapped:false}));sky.name='ro-analytic-sky';sky.frustumCulled=false;sky.renderOrder=-1000;root.add(sky);
 const rayUniforms={rayColor:{value:new T.Color(0xffdb9e)},rayStrength:{value:.045}},rayMaterial=new T.ShaderMaterial({uniforms:rayUniforms,vertexShader:rayVertex,fragmentShader:rayFragment,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false});
 const rays=new T.InstancedMesh(new T.PlaneGeometry(1,1),rayMaterial,6);rays.name='ro-soft-light-shafts';rays.frustumCulled=true;rays.count=0;rays.renderOrder=1;root.add(rays);
 const dummy=new T.Object3D(),topDay=new T.Color(0x709fb8),topNight=new T.Color(0x303f62),horizonDay=new T.Color(0xbcc9a4),horizonNight=new T.Color(0x637477),sunDay=new T.Color(0xffe1b3),sunNight=new T.Color(0xb4c6f0),horizon=new T.Color();let disposed=false,smoothedMs=16,slowFrames=0,active=false,last=null;
 const rayFrustum=new T.Frustum(),rayProjection=new T.Matrix4(),raySphere=new T.Sphere();
 return {root,update(state,time,camera,{target,dt=.016,renderer,palette}={}){
  if(disposed)return;active=state?.options?.mode==='bonk';root.visible=active;if(actorLighting)actorLighting.uniforms.roEnvEnabled.value=active?1:0;if(!active){rays.count=0;return;}
  const phase=roDaylight(state.bonk?.totalElapsed??time),direction=uniforms.sunDirection.value.set(Math.cos(phase.angle),Math.sin(phase.angle),.35*Math.sin(phase.angle)).normalize();last=phase;
  if(palette)horizonDay.setHex(palette.sky);uniforms.day.value=phase.day;uniforms.topColor.value.copy(topNight).lerp(topDay,phase.day);horizon.copy(horizonNight).lerp(horizonDay,phase.day).lerp(sunDay,phase.twilight*.16);uniforms.horizonColor.value.copy(horizon);sky.position.copy(camera.position);
  // Keep a readable floor at midnight. Underground biomes retain neutral fill.
  skyLight.intensity=phase.hemisphere;skyLight.color.copy(sunNight).lerp(sunDay,phase.day);skyLight.groundColor.setHex(0x74836b);
  const lightDirection=direction.y>=0?direction:direction.clone().negate(),center=target||camera.position;sun.position.set(center.x+lightDirection.x*65,center.y+Math.max(.2,lightDirection.y)*65,center.z+lightDirection.z*65);sun.target.position.copy(center);sun.color.copy(sunNight).lerp(sunDay,phase.day);sun.intensity=phase.direct;
  if(renderer)renderer.toneMappingExposure=phase.exposure;if(scene.fog){scene.fog.color.copy(horizon);scene.fog.near=85;scene.fog.far=245;}
  if(actorLighting){const u=actorLighting.uniforms;u.roSky.value.copy(uniforms.topColor.value);u.roGround.value.copy(horizon).multiplyScalar(.7);u.roSun.value.copy(sun.color);u.roSunDirection.value.copy(lightDirection);}
  smoothedMs=smoothedMs*.97+Math.max(0,dt)*1000*.03;slowFrames=smoothedMs>28?Math.min(150,slowFrames+1):Math.max(0,slowFrames-1);const low=slowFrames>90,warning=!!state.bonk?.warnings?.length;rayUniforms.rayStrength.value=(warning?.018:.047)*phase.day;rayUniforms.rayColor.value.copy(sun.color);const rayCount=low||phase.day<.15?0:6;rays.count=0;rayFrustum.setFromProjectionMatrix(rayProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(let i=0;i<rayCount;i++){const x=center.x+Math.sin(i*2.399)*25,z=center.z+Math.cos(i*2.399)*25;dummy.position.set(x-lightDirection.x*9,center.y+15+i%3*3,z-lightDirection.z*9);dummy.rotation.set(0,Math.atan2(camera.position.x-x,camera.position.z-z),-.25-lightDirection.x*.35);dummy.scale.set(2+i%3,36+i%2*8,1);raySphere.center.copy(dummy.position);raySphere.radius=Math.hypot(dummy.scale.x,dummy.scale.y)*.5;if(!rayFrustum.intersectsSphere(raySphere))continue;dummy.updateMatrix();rays.setMatrixAt(rays.count++,dummy.matrix);}rays.instanceMatrix.needsUpdate=true;rays.computeBoundingSphere();
 },stats(){return {active,phase:last,rays:rays.count,drawCalls:active?1+(rays.count?1:0):0,renderTargets:0};},dispose(){if(disposed)return;disposed=true;if(actorLighting)actorLighting.uniforms.roEnvEnabled.value=0;sky.geometry.dispose();sky.material.dispose();rays.dispose();rays.geometry.dispose();rayMaterial.dispose();root.clear();root.removeFromParent();}};
}
