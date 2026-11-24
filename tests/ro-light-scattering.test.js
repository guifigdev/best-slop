import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_LIGHT_SCATTERING_BUDGET as B,roScatteringSize,roPixelGrid,createRoLightScattering} from '../src/ro-light-scattering.js';

function fixture({width=1200,height=800,pixelRatio=1,autoReset=true}={}){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(65,width/height,.1,1000);camera.position.set(0,2,10);camera.lookAt(0,2,0);camera.updateMatrixWorld();let target=null;const viewport=new T.Vector4(3,4,width-6,height-8),scissor=new T.Vector4(5,6,width-10,height-12),calls=[],renderer={autoClear:true,toneMapping:T.ACESFilmicToneMapping,toneMappingExposure:.98,outputColorSpace:T.SRGBColorSpace,xr:{isPresenting:false},extensions:{has:()=>true},capabilities:{maxSamples:4},info:{autoReset,render:{calls:0},reset(){this.render.calls=0;}},getDrawingBufferSize:v=>v.set(width,height),getSize:v=>v.set(width/pixelRatio,height/pixelRatio),getPixelRatio:()=>pixelRatio,getRenderTarget:()=>target,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0,getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(scissor),getScissorTest:()=>renderer.scissorTest,setViewport:v=>viewport.copy(v),setScissor:v=>scissor.copy(v),setScissorTest:value=>renderer.scissorTest=value,setRenderTarget:value=>{target=value;},clear(){calls.push({clear:true,target});},render(s,c){if(this.throwOnScene&&s===scene)throw Error('simulated GPU failure');if(this.info.autoReset)this.info.reset();this.info.render.calls+=s===scene?30:1;const material=s.children.find(child=>child.isMesh)?.material;calls.push({scene:s,camera:c,target,material});},scissorTest:true,resize(w,h){width=w;height=h;}};
 const effect=createRoLightScattering({renderer,scene,camera}),options={dt:.016,sunDirection:new T.Vector3(0,.13,-1).normalize(),sunColor:new T.Color(0xffdcad),day:1,preset:'solar'},state={options:{mode:'bonk'},bonk:{warnings:[]}};return{renderer,scene,camera,effect,options,state,calls,viewport,scissor};
}
const draws=f=>f.calls.filter(call=>call.scene),render=f=>f.effect.render(f.state,10,f.options);

test('pixel strength restores native detail at zero and the exact approved pixel grid at one without changing rays or ink',()=>{
 const f=fixture({width:1920,height:1080});try{
  const before=structuredClone(f.state),options={...f.options,preset:'pixel'};f.effect.render(f.state,1,options);const original=f.effect.stats(),originalGrid=draws(f).at(-1).material.uniforms.pixelGrid.value.toArray(),originalShader=draws(f).at(-1).material.fragmentShader,sceneTarget=draws(f)[0].target;
  assert.deepEqual(originalGrid,[640,360]);assert.equal(original.pixelStrength,1);assert.equal(original.msaa,2);
  f.calls.length=0;f.effect.render(f.state,1,{...options,pixelStrength:0});const sharp=f.effect.stats(),u=draws(f).at(-1).material.uniforms;assert.deepEqual(u.pixelGrid.value.toArray(),[0,0]);assert.equal(u.pixelStrength.value,0);assert.equal(u.smoothing.value,0);assert.equal(u.outlines.value,1);assert.equal(sharp.width,1920);assert.equal(sharp.height,1080);assert.ok(sharp.width>original.width);assert.equal(sharp.msaa,0);assert.equal(sharp.rayWidth,original.rayWidth);assert.equal(sharp.rayHeight,original.rayHeight);assert.equal(sharp.samples,original.samples);assert.equal(sharp.intensity,original.intensity);assert.equal(sharp.extraDrawCalls,original.extraDrawCalls);assert.equal(draws(f)[0].target,sceneTarget);assert.equal(draws(f).at(-1).material.fragmentShader,originalShader);
  f.calls.length=0;f.effect.render(f.state,1,{...options,pixelStrength:.5});const mid=f.effect.stats(),grid=draws(f).at(-1).material.uniforms.pixelGrid.value;assert.ok(grid.x>originalGrid[0]&&grid.x<mid.width);assert.ok(mid.width>=original.width&&mid.width<=sharp.width);
  f.calls.length=0;f.effect.render(f.state,1,{...options,pixelStrength:1});assert.deepEqual(draws(f).at(-1).material.uniforms.pixelGrid.value.toArray(),originalGrid);assert.equal(f.effect.stats().width,original.width);assert.equal(f.effect.stats().msaa,original.msaa);assert.deepEqual(f.state,before);
 }finally{f.effect.dispose();}
});

test('sharp pixel targets respect memory and ray budgets on large or narrow screens and the palette mix is limited to retro',()=>{
 for(const [width,height]of [[390,844],[1920,1080],[7680,4320],[20000,200],[200,20000]]){const f=fixture({width,height});try{for(const pixelStrength of [0,.1,.5,.9,1]){f.effect.render(f.state,1,{...f.options,preset:'pixel',pixelStrength});const report=f.effect.stats();assert.ok(report.width*report.height<=B.maxSharpColorPixels);assert.ok(report.rayWidth*report.rayHeight<=B.maxRayPixels);assert.ok(report.estimatedBytes<=B.maxEstimatedBytes);assert.ok(Math.max(report.width,report.height)<=B.maxSharpSide);}}finally{f.effect.dispose();}}
 const f=fixture();try{f.effect.render(f.state,1,{...f.options,preset:'retro',pixelStrength:.3});const u=draws(f).at(-1).material.uniforms,shader=draws(f).at(-1).material.fragmentShader;assert.equal(u.artStyle.value,1);assert.equal(u.pixelStrength.value,.3);assert.match(shader,/artStyle>0.5&&artStyle<1.5\?pixelStrength:1.0/);for(const preset of ['chartogne','smooth']){f.effect.render(f.state,1,{...f.options,preset,pixelStrength:0});assert.deepEqual(draws(f).at(-1).material.uniforms.pixelGrid.value.toArray(),[0,0]);}assert.deepEqual(roPixelGrid(1200,800,1200,800,NaN),[400,800/3]);assert.deepEqual(roPixelGrid(1200,800,1200,800,-10),[0,0]);}finally{f.effect.dispose();}
});

test('scattering renders the real scene once, uses its actual depth and adds exactly two fullscreen draws',()=>{
 const f=fixture();try{assert.equal(render(f),true);const list=draws(f),stats=f.effect.stats();assert.equal(list.filter(c=>c.scene===f.scene).length,1);assert.equal(list.length,3);assert.equal(stats.extraDrawCalls,2);assert.equal(stats.sceneDrawCalls,30);assert.equal(stats.renderTargets,2);assert.equal(stats.samples,24);assert.equal(stats.quality,'high');assert.equal(f.renderer.info.render.calls,32);assert.ok(f.renderer.info.autoReset);const [scene,ray,composite]=list;assert.ok(scene.target.depthTexture?.isDepthTexture);assert.ok(ray.material.uniforms.tDepth.value===scene.target.depthTexture);assert.ok(composite.material.uniforms.tDepth.value===scene.target.depthTexture);assert.ok(composite.material.uniforms.tScene.value===scene.target.texture);assert.ok(composite.material.uniforms.tRays.value===ray.target.texture);assert.equal(scene.target.texture.type,T.HalfFloatType);assert.equal(scene.target.texture.colorSpace,T.LinearSRGBColorSpace);assert.equal(scene.target.samples,2);assert.equal(ray.target.width,scene.target.width/2);assert.equal(ray.material.depthWrite,false);assert.equal(composite.material.toneMapped,true);assert.match(ray.material.fragmentShader,/texture2D\(tDepth,uv\)/);assert.match(ray.material.fragmentShader,/skyVisibility\(at\)/);assert.match(composite.material.fragmentShader,/#include <tonemapping_fragment>/);assert.match(composite.material.fragmentShader,/#include <colorspace_fragment>/);}finally{f.effect.dispose();}
});

test('targets are reused, resized within fixed pixel/memory caps and released exactly once on disposal',()=>{
 const f=fixture({width:7680,height:4320});render(f);const sceneTarget=draws(f)[0].target,rayTarget=draws(f)[1].target;try{let stats=f.effect.stats();assert.ok(stats.width*stats.height<=B.maxColorPixels);assert.ok(stats.rayWidth*stats.rayHeight<=B.maxRayPixels);assert.ok(Math.max(stats.width,stats.height)<=B.maxSide);assert.ok(stats.estimatedBytes<=B.maxEstimatedBytes);f.calls.length=0;render(f);assert.ok(draws(f)[0].target===sceneTarget&&draws(f)[1].target===rayTarget);f.renderer.resize(1600,900);render(f);assert.ok(draws(f).at(-3).target===sceneTarget);stats=f.effect.stats();assert.equal(sceneTarget.width,stats.width);assert.equal(sceneTarget.depthTexture.image.height,stats.height);assert.equal(rayTarget.width,stats.rayWidth);let a=0,b=0;sceneTarget.addEventListener('dispose',()=>a++);rayTarget.addEventListener('dispose',()=>b++);f.effect.dispose();f.effect.dispose();assert.equal(a,1);assert.equal(b,1);assert.equal(f.effect.stats().estimatedBytes,0);assert.equal(f.effect.stats().renderTargets,0);}finally{f.effect.dispose();}
});

test('solar bypasses without a render or renderer state change at night, behind the camera, offscreen or in clean mode',()=>{
 const f=fixture(),initial={autoClear:f.renderer.autoClear,toneMapping:f.renderer.toneMapping,exposure:f.renderer.toneMappingExposure,output:f.renderer.outputColorSpace,viewport:f.viewport.toArray(),scissor:f.scissor.toArray(),scissorTest:f.renderer.scissorTest};try{for(const options of [{...f.options,day:0},{...f.options,sunDirection:new T.Vector3(0,.1,1)},{...f.options,sunDirection:new T.Vector3(1,.1,-.1)},{...f.options,preset:'clean'}])assert.equal(f.effect.render(f.state,0,options),false);assert.equal(f.calls.length,0);assert.equal(f.effect.stats().renderTargets,0);assert.deepEqual({autoClear:f.renderer.autoClear,toneMapping:f.renderer.toneMapping,exposure:f.renderer.toneMappingExposure,output:f.renderer.outputColorSpace,viewport:f.viewport.toArray(),scissor:f.scissor.toArray(),scissorTest:f.renderer.scissorTest},initial);}finally{f.effect.dispose();}
});

test('dawn sunlight remains eligible and warnings reduce scattering without touching gameplay',()=>{
 const f=fixture();try{f.options.day=.28;f.options.sunDirection.set(0,0,-1);assert.equal(render(f),true);const dawn=f.effect.stats().intensity;assert.ok(dawn>0);const snapshot=structuredClone(f.state);Object.freeze(f.state.bonk.warnings);Object.freeze(f.state.bonk);Object.freeze(f.state);assert.equal(render(f),true);assert.deepEqual(f.state,snapshot);f.effect.render({options:{mode:'bonk'},bonk:{warnings:[{id:1}]}},0,f.options);assert.ok(f.effect.stats().intensity<dawn*.5);f.effect.render({options:{mode:'bonk'},bonk:{warnings:[1,2,3]}},0,f.options);assert.ok(f.effect.stats().intensity<dawn*.2);}finally{f.effect.dispose();}
});

test('small screens and sustained slow frames reduce sample count, MSAA and resolution without adding passes',()=>{
 const mobile=fixture({width:644,height:1200,pixelRatio:1.65});try{render(mobile);assert.equal(mobile.effect.stats().samples,12);assert.equal(mobile.effect.stats().quality,'low');assert.equal(mobile.effect.stats().msaa,0);assert.ok(mobile.effect.stats().width*mobile.effect.stats().height<=480000);}finally{mobile.effect.dispose();}const f=fixture();try{render(f);f.options.dt=.05;for(let i=0;i<100;i++)render(f);assert.equal(f.effect.stats().quality,'low');assert.equal(f.effect.stats().samples,12);f.options.dt=.016;for(let i=0;i<220;i++)render(f);assert.equal(f.effect.stats().quality,'high');assert.equal(f.effect.stats().samples,24);}finally{f.effect.dispose();}
});

test('pixel and cinematic presets still composite at night without fabricating sunlight or capturing the DOM',()=>{
 const f=fixture();try{for(const preset of ['pixel','cinematic']){f.calls.length=0;assert.equal(f.effect.render(f.state,0,{...f.options,preset,day:0}),true);assert.equal(draws(f).length,2);assert.equal(f.effect.stats().raysActive,false);assert.equal(f.effect.stats().extraDrawCalls,1);const material=draws(f).at(-1).material;assert.equal(material.uniforms.scattering.value,0);assert.equal(material.uniforms.halo.value,0);assert.equal(material.uniforms.pixelGrid.value.x,preset==='pixel'?400:0);assert.equal(material.uniforms.cinematic.value,preset==='cinematic'?1:0);assert.ok(draws(f)[0].scene===f.scene);}}finally{f.effect.dispose();}
});

test('renderer target, viewport, scissor, tone settings and info reset policy survive normal and failed passes',()=>{
 for(const fail of [false,true]){const f=fixture({autoReset:false}),external=new T.WebGLRenderTarget(30,30);f.renderer.setRenderTarget(external);const beforeViewport=f.viewport.toArray(),beforeScissor=f.scissor.toArray();f.renderer.throwOnScene=fail;try{assert.equal(render(f),!fail);assert.ok(f.renderer.getRenderTarget()===external);assert.deepEqual(f.viewport.toArray(),beforeViewport);assert.deepEqual(f.scissor.toArray(),beforeScissor);assert.equal(f.renderer.scissorTest,true);assert.equal(f.renderer.autoClear,true);assert.equal(f.renderer.toneMapping,T.ACESFilmicToneMapping);assert.equal(f.renderer.toneMappingExposure,.98);assert.equal(f.renderer.outputColorSpace,T.SRGBColorSpace);assert.equal(f.renderer.info.autoReset,false);if(fail){assert.equal(f.effect.stats().reason,'render-error');assert.equal(render(f),false);}}finally{f.effect.dispose();external.dispose();}}
});

test('render size selection remains finite and bounded across aspect ratios and quality levels',()=>{
 for(const [w,h]of [[390,844],[1920,1080],[10000,500],[500,10000],[1,1],[0,0]])for(const low of [false,true]){const size=roScatteringSize(w,h,low);assert.ok(Object.values(size).every(v=>Number.isInteger(v)&&v>0));assert.ok(size.width*size.height<=B.maxColorPixels);assert.ok(size.rayWidth*size.rayHeight<=B.maxRayPixels);assert.ok(Math.max(size.width,size.height)<=B.maxSide);}
});


test('solar shafts use a stronger configurable budget without extra render passes and zero strength removes the halo',()=>{
 const f=fixture();try{render(f);assert.equal(f.effect.stats().intensity,.2);f.effect.render(f.state,0,{...f.options,intensity:1.25});assert.equal(f.effect.stats().intensity,1.25);assert.equal(f.effect.stats().extraDrawCalls,2);f.effect.render(f.state,0,{...f.options,intensity:0});assert.equal(f.effect.stats().intensity,0);assert.equal(draws(f).at(-1).material.uniforms.halo.value,0);f.effect.render(f.state,0,{...f.options,intensity:10});assert.equal(f.effect.stats().intensity,1.5);}finally{f.effect.dispose();}
});


test('every game uses the shared compositor and edge smoothing adds no extra render pass at night',()=>{
 const f=fixture();try{
 for(const mode of ['campaign','tower','best','war','linewars','castlefight','treetag','warlock','kodotag','phasekiller','bloody','dungeon','bonk']){
  const state={options:{mode},bossWarnings:[{id:1}]},before=structuredClone(state);f.calls.length=0;
  assert.equal(f.effect.render(state,0,{...f.options,preset:'smooth',day:0}),true);assert.deepEqual(state,before);
  assert.equal(draws(f).length,2);const uniforms=draws(f).at(-1).material.uniforms;assert.equal(uniforms.smoothing.value,1);assert.equal(uniforms.scattering.value,0);assert.equal(uniforms.halo.value,0);assert.ok(uniforms.texelSize.value.x>0);assert.equal(f.effect.stats().extraDrawCalls,1);
 }
 f.calls.length=0;assert.equal(f.effect.render({options:{mode:'campaign'}},0,{...f.options,preset:'smooth'}),true);assert.equal(draws(f).length,3);assert.equal(f.effect.stats().extraDrawCalls,2);
 }finally{f.effect.dispose();}
});

test('top-down coliseum shafts sample the real sun shadow map within the existing two-pass budget and turn off at night',()=>{
 const f=fixture(),texture=new T.Texture(),light={castShadow:true,target:{position:new T.Vector3()},shadow:{map:{texture},matrix:new T.Matrix4()}};
 try{const options={...f.options,volumetric:true,shadowLight:light,sunDirection:new T.Vector3(0,1,1).normalize(),weatherStrength:.68};assert.equal(f.effect.render({options:{mode:'campaign'}},0,options),true);const calls=draws(f);assert.equal(calls.length,3);const uniforms=calls[1].material.uniforms;assert.equal(uniforms.tShadow.value,texture);assert.equal(uniforms.volumetric.value,1);assert.equal(uniforms.sampleCount.value,12);assert.equal(calls[2].material.uniforms.halo.value,0);assert.equal(f.effect.stats().extraDrawCalls,2);assert.ok(f.effect.stats().intensity<.7);assert.match(calls[1].material.fragmentShader,/unpackRGBAToDepth/);assert.match(calls[1].material.fragmentShader,/inverseProjection/);f.calls.length=0;assert.equal(f.effect.render({options:{mode:'campaign'}},0,{...options,day:0}),false);assert.equal(f.calls.length,0);
 }finally{f.effect.dispose();texture.dispose();}
});

test('atlas styles reuse the same scene depth and render targets while the original pixel grid stays unchanged',()=>{
 const f=fixture();try{
  const original=structuredClone(f.state);let target=null;
  for(const [preset,index]of [['pixel',0],['retro',1],['chartogne',2],['smooth',3]]){
   f.calls.length=0;assert.equal(f.effect.render(f.state,2,{...f.options,preset,day:0}),true);const list=draws(f),uniforms=list.at(-1).material.uniforms;
   assert.equal(list.length,2);assert.equal(f.effect.stats().renderTargets,2);assert.equal(f.effect.stats().extraDrawCalls,1);assert.equal(uniforms.artStyle.value,index);assert.equal(uniforms.pixelGrid.value.x,preset==='pixel'?400:0);
   assert.equal(uniforms.tDepth.value,list[0].target.depthTexture);assert.ok(uniforms.inverseProjection.value.equals(f.camera.projectionMatrixInverse));assert.ok(uniforms.cameraWorld.value.equals(f.camera.matrixWorld));if(target)assert.equal(list[0].target,target);target=list[0].target;
  }
  assert.deepEqual(f.state,original);
 }finally{f.effect.dispose();}
});


test('original pixel plus ink preserves the approved four-tap contour exactly and never changes SP or simulation state',()=>{
 const f=fixture();try{
  f.state.units=[{id:1,mana:42,maxMana:100,cooldowns:{fireball:2}}];const before=structuredClone(f.state);
  const ink=readFileSync(new URL('./fixtures/ro-ink-73261ea.glsl',import.meta.url),'utf8').trim();
  assert.equal(f.effect.render(f.state,2,{...f.options,preset:'pixel',intensity:.2,outlines:true}),true);
  const uniforms=draws(f).at(-1).material.uniforms,shader=draws(f).at(-1).material.fragmentShader;
  assert.equal(uniforms.outlines.value,1);assert.equal(uniforms.outlineStrength.value,1);assert.equal(uniforms.artStyle.value,0);assert.equal(uniforms.pixelGrid.value.x,400);assert.equal(uniforms.scattering.value,.2);
  assert.ok(shader.includes('if(outlines>0.5&&outlineStrength==1.0){'+ink+'}'));assert.ok(shader.indexOf(ink)<shader.indexOf('#include <tonemapping_fragment>'));assert.ok(shader.includes('if(artStyle<0.5)return c;'));
  const target=draws(f)[0].target;f.calls.length=0;f.effect.render(f.state,2,{...f.options,preset:'pixel',intensity:.2,outlines:false});assert.equal(draws(f).at(-1).material.uniforms.outlines.value,0);assert.equal(draws(f)[0].target,target);assert.deepEqual(f.state,before);assert.equal(f.effect.stats().renderTargets,2);
 }finally{f.effect.dispose();}
});


test('contour strength scales without additional passes and clamps invalid values to the approved baseline',()=>{
 const f=fixture();try{const before=structuredClone(f.state);for(const [value,expected] of [[0,0],[.5,.5],[1,1],[2,2],[3,2],[-1,0],[NaN,1]]){f.effect.render(f.state,1,{...f.options,outlineStrength:value});assert.equal(draws(f).at(-1).material.uniforms.outlineStrength.value,expected);assert.equal(f.effect.stats().extraDrawCalls,2);}assert.deepEqual(f.state,before);assert.match(draws(f).at(-1).material.fragmentShader,/min\(0.96,0.65\*outlineStrength\)/);}finally{f.effect.dispose();}
});
