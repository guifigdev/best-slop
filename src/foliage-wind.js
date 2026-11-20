import * as T from 'three';

// Apply only to a foliage batch. Trunks, collision and actor positions stay put.
export function createFoliageWindMaterial({strength=.18,speed=.7,minHeight=0,...options}={}){
 const material=new T.MeshLambertMaterial(options),time={value:0};
 material.userData.foliageWind={time,strength,speed};
 material.onBeforeCompile=shader=>{
  shader.uniforms.uFoliageTime=time;
  shader.vertexShader='uniform float uFoliageTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 windAnchor=vec3(0.0),windScale=vec3(1.0);
   #ifdef USE_INSTANCING
    windAnchor=instanceMatrix[3].xyz;
    windScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
   #endif
   float windPhase=uFoliageTime*${Number(speed).toFixed(4)}+windAnchor.x*.17+windAnchor.z*.11;
   float windTip=clamp(position.y+.5,0.0,1.0)*step(${Number(minHeight).toFixed(4)},windAnchor.y);
   transformed.x+=sin(windPhase)*${Number(strength).toFixed(4)}*windTip/max(.01,windScale.x);
   transformed.z+=cos(windPhase*.83)*${Number(strength*.6).toFixed(4)}*windTip/max(.01,windScale.z);
  `);
 };
 material.customProgramCacheKey=()=>`foliage-wind:${strength}:${speed}:${minHeight}`;return material;
}
export function updateFoliageWind(material,time){const wind=material?.userData?.foliageWind;if(wind)wind.time.value=Math.floor(time*8)/8;}
