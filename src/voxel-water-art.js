import * as T from 'three';

// Rounded cubes retain the voxel silhouette while their curved edges catch
// moving highlights. No image sprites, transmission buffers or extra lights.
export function createWaterVoxelGeometry(){
 const g=new T.BoxGeometry(1,1,1,3,3,3),p=g.attributes.position,n=g.attributes.normal,core=new T.Vector3(),delta=new T.Vector3(),v=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);core.copy(v).clampScalar(-.34,.34);delta.copy(v).sub(core).normalize();v.copy(core).addScaledVector(delta,.16);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,delta.x,delta.y,delta.z);}g.computeBoundingBox();g.computeBoundingSphere();g.userData.waterVoxel=true;return g;
}

export function installWaterVoxelShader(material){
 const previous=material.onBeforeCompile,clock={value:0};material.userData.waterClock=clock;
 material.onBeforeCompile=shader=>{previous?.(shader);shader.uniforms.uFluidTime=clock;
  shader.vertexShader='uniform float uFluidTime;varying vec3 vFluidWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   transformed+=normal*sin(uFluidTime*2.4+position.x*5.0+position.z*4.0)*.018;`);
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 fluidPosition=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    fluidPosition=instanceMatrix*fluidPosition;
   #endif
   vFluidWorld=(modelMatrix*fluidPosition).xyz;`);
  shader.fragmentShader='uniform float uFluidTime;varying vec3 vFluidWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   float fluidFresnel=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
   float fluidWave=sin(vFluidWorld.x*5.2+vFluidWorld.z*3.7-uFluidTime*2.1)*sin(vFluidWorld.z*4.3-vFluidWorld.x*2.6+uFluidTime*1.7);
   float fluidCrest=smoothstep(.76,.99,fluidWave);
   outgoingLight=mix(outgoingLight,vec3(.20,.64,.91),.20)+vec3(.33,.65,.84)*fluidFresnel*.35+fluidCrest*vec3(.13,.23,.27);
   diffuseColor.a*=.74+fluidFresnel*.26;
   #include <opaque_fragment>`);
 };material.customProgramCacheKey=()=> 'rounded-translucent-voxel-water-v1';return material;
}

// Scenery replacements must match the model that the world actually draws.
export function waterFountainSources(state,focus,maxDistance=65){
 const map=state?.bonk?.map;if(!map)return[];const list=[];
 if(map.town)list.push({id:'town-fountain',x:map.town.x,z:map.town.z,scale:.7});
 for(const o of map.decorations||[]){let model=o.model;if(o.type==='scenery'&&map.route?.style==='pastoral')model=['prontera-house','prontera-fountain','prontera-gate','prontera-house'][Number(o.id?.split('-').at(-1))%4];else if(o.type==='scenery'&&map.route?.style)continue;
  if(model==='prontera-fountain')list.push({id:o.id,x:o.x,z:o.z,scale:1});
 }
 return list.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)&&(!focus||Math.hypot(p.x-focus.x,p.z-focus.z)<maxDistance)).sort((a,b)=>focus?Math.hypot(a.x-focus.x,a.z-focus.z)-Math.hypot(b.x-focus.x,b.z-focus.z):0).slice(0,2);
}

export function fountainWaterTiles(fountain,time,heightAt=()=>0){
 const {x,z,scale:s=1}=fountain,base=heightAt(x,z),parts=[],tile=.40*s;
 for(let iz=-6;iz<=6;iz++)for(let ix=-6;ix<=6;ix++){if(Math.hypot(ix,iz)>6)continue;const xx=x+ix*tile,zz=z+iz*tile,r=Math.hypot(ix,iz)*tile;
  if(r<.55*s)continue;const wave=Math.sin(time*2.4+ix*.8+iz*.6)*.025*s;parts.push([xx,base+1.12*s+wave,zz,tile*1.07,.11*s,tile*1.07,0x429ed0,.72]);
 }
 return parts;
}
