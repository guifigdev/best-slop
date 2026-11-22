import * as T from 'three';

// Apply only to a foliage batch. Trunks, collision and actor positions stay put.
export function createFoliageWindMaterial({strength=.18,speed=.7,minHeight=0,coherent=false,occlusionFocus=false,masked=false,...options}={}){
 const material=new T.MeshLambertMaterial(options),time={value:0};
 material.userData.foliageWind={time,strength,speed};
 const focus={value:new T.Vector3()},occlusion={value:1};if(occlusionFocus)material.userData.foliageOcclusion={focus,enabled:occlusion,radius:2.2};
 material.onBeforeCompile=shader=>{
  shader.uniforms.uFoliageTime=time;
  if(occlusionFocus){shader.uniforms.foliageFocus=focus;shader.uniforms.foliageOcclusion=occlusion;shader.vertexShader='varying vec3 foliageWorldPosition;\n'+shader.vertexShader;shader.fragmentShader='varying vec3 foliageWorldPosition;uniform vec3 foliageFocus;uniform float foliageOcclusion;\n'+shader.fragmentShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 leafWorld=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
     leafWorld=instanceMatrix*leafWorld;
    #endif
    foliageWorldPosition=(modelMatrix*leafWorld).xyz;
    #include <project_vertex>`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec3 leafCamera=foliageWorldPosition-cameraPosition;vec3 focusLine=foliageFocus-cameraPosition;float focusLength=max(0.01,length(focusLine));vec3 focusDirection=focusLine/focusLength;float alongFocus=dot(leafCamera,focusDirection);float focusSide=length(leafCamera-focusDirection*alongFocus);float closeFade=1.0-smoothstep(1.8,3.8,length(leafCamera));float focusFade=(1.0-smoothstep(1.45,2.4,focusSide))*step(0.0,alongFocus)*(1.0-smoothstep(focusLength-0.6,focusLength+0.6,alongFocus));float leafFade=max(closeFade,focusFade)*foliageOcclusion;if(leafFade>0.985)discard;float leafDither=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(0.06711056,0.00583715))));if(leafDither<leafFade)discard;
    #include <opaque_fragment>`);
  }
  shader.vertexShader='uniform float uFoliageTime;\n'+(masked?'attribute float foliageMask;\n':'')+(coherent?'attribute vec4 foliageRoot;\n':'')+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 windAnchor=vec3(0.0),windScale=vec3(1.0);
   #ifdef USE_INSTANCING
    windAnchor=instanceMatrix[3].xyz;
    windScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
   #endif
   float windPhase=uFoliageTime*${Number(speed).toFixed(4)}+${coherent?'foliageRoot.x*.17+foliageRoot.y*.11':'windAnchor.x*.17+windAnchor.z*.11'};
   float windTip=${coherent?'clamp((windAnchor.y+position.y*windScale.y-foliageRoot.z)/max(1.0,foliageRoot.w),.12,1.0)':'clamp(position.y+.5,0.0,1.0)'}*step(${Number(minHeight).toFixed(4)},windAnchor.y);
   ${masked?'windTip*=foliageMask;':''}
   transformed.x+=sin(windPhase)*${Number(strength).toFixed(4)}*windTip/max(.01,windScale.x);
   transformed.z+=cos(windPhase*.83)*${Number(strength*.6).toFixed(4)}*windTip/max(.01,windScale.z);
  `);
 };
 material.customProgramCacheKey=()=>`foliage-wind:${strength}:${speed}:${minHeight}:${coherent}:${occlusionFocus}:${masked}`;return material;
}
export function updateFoliageWind(material,time){const wind=material?.userData?.foliageWind;if(wind)wind.time.value=Math.floor(time*8)/8;}
