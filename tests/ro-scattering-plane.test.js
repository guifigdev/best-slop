import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createRoScatteringPlane,roScatteringPlanePlan,RO_SCATTERING_PLANE_BUDGET as B} from '../src/ro-scattering-plane.js';
import {createRoAtmosphere} from '../src/ro-atmosphere.js';
const state={options:{mode:'bonk'},worldSeed:100,bonk:{map:{seed:100,stageKey:'grove'},warnings:[],totalElapsed:122.4}};
test('world scattering anchors stay fixed when the hero or camera moves within their cells and fit the mobile budget',()=>{
 const a=roScatteringPlanePlan(state,{day:1,target:{x:0,z:0}}),b=roScatteringPlanePlan(state,{day:1,target:{x:1,z:1}});assert.equal(a.length,B.planes);assert.equal(roScatteringPlanePlan(state,{day:1,low:true}).length,B.mobilePlanes);assert.equal(B.renderTargets,0);assert.equal(B.drawCalls,1);
 for(const anchor of a){const common=b.find(p=>p.id===anchor.id);assert.ok(common);assert.equal(anchor.x,common.x);assert.equal(anchor.z,common.z);assert.ok(anchor.opacity>0&&anchor.opacity<=.085);}
 const warning=roScatteringPlanePlan({...state,bonk:{...state.bonk,warnings:[{radius:4}]}},{day:1});assert.ok(warning.every((p,i)=>p.opacity===a[i].opacity*.5));
});
test('shafts disappear at night, in strong rain, inside the tower and underground, without touching gameplay',()=>{
 const before=JSON.stringify(state);for(const options of [{day:0},{day:1,weatherStrength:.4},{day:1,intensity:0},{day:NaN},{day:1,target:{x:NaN,z:0}}])assert.deepEqual(roScatteringPlanePlan(state,options),[]);
 for(const map of [{stageKey:'crypt'},{stageKey:'payon'},{stageKey:'grove',tower:{floor:1}}])assert.deepEqual(roScatteringPlanePlan({...state,bonk:{...state.bonk,map}},{day:1}),[]);
 assert.deepEqual(roScatteringPlanePlan({options:{mode:'dungeon'}},{day:1}),[]);assert.equal(JSON.stringify(state),before);
});
test('the reusable plane draw uses depth-tested additive light, finite solar-aligned transforms and no screen texture',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(60,1,.1,200),art=createRoScatteringPlane({scene}),sun=new T.Vector3(.4,.8,.3).normalize(),matrix=new T.Matrix4();camera.position.set(0,10,22);camera.lookAt(0,2,0);camera.updateMatrixWorld();
 try{for(let i=0;i<50;i++){camera.position.set(Math.sin(i)*22,10,Math.cos(i)*22);art.update(state,i,camera,{day:1,target:new T.Vector3(0,3,0),sunDirection:sun,heightAt:()=>3});assert.ok(art.stats().planes<=4);assert.ok(art.stats().triangles<=B.triangles);for(let j=0;j<art.mesh.count;j++){art.mesh.getMatrixAt(j,matrix);assert.ok(matrix.elements.every(Number.isFinite));}}assert.equal(scene.children.length,1);assert.equal(art.mesh.material.depthWrite,false);assert.equal(art.mesh.material.depthTest,true);assert.equal(art.mesh.material.blending,T.AdditiveBlending);assert.doesNotMatch(art.mesh.material.fragmentShader,/tScene|gl_FragCoord/);assert.match(art.mesh.material.fragmentShader,/unpackRGBAToDepth/);assert.match(art.mesh.material.fragmentShader,/vShaftWorld\.xz/);art.update(state,60,camera,{day:1,enabled:false});assert.equal(art.stats().drawCalls,0);}finally{art.dispose();}
 assert.equal(scene.children.length,0);
});
test('disposing the light planes releases only their owned resources once',()=>{
 const scene=new T.Scene(),light=new T.DirectionalLight();scene.add(light);const art=createRoScatteringPlane({scene});let geometry=0,material=0,mesh=0;art.mesh.geometry.addEventListener('dispose',()=>geometry++);art.mesh.material.addEventListener('dispose',()=>material++);art.mesh.addEventListener('dispose',()=>mesh++);art.dispose();art.dispose();assert.deepEqual([geometry,material,mesh],[1,1,1]);assert.deepEqual(scene.children,[light]);
});
test('the light planes borrow the existing solar shadow map and matrix, so a roof can block the haze without a new pass',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),art=createRoScatteringPlane({scene}),light=new T.DirectionalLight();light.castShadow=true;const borrowedTexture=new T.Texture(),matrix=light.shadow.matrix;light.shadow.map={texture:borrowedTexture};camera.position.set(0,10,20);let disposed=0;borrowedTexture.addEventListener('dispose',()=>disposed++);
 art.update(state,1,camera,{day:1,shadowLight:light});assert.equal(art.mesh.material.uniforms.shaftShadowEnabled.value,1);assert.equal(art.mesh.material.uniforms.shaftShadowMap.value,borrowedTexture);assert.equal(art.mesh.material.uniforms.shaftShadowMatrix.value,matrix);matrix.elements[12]=17;assert.equal(art.mesh.material.uniforms.shaftShadowMatrix.value.elements[12],17);art.dispose();assert.equal(disposed,0);borrowedTexture.dispose();
});
test('the solar disk has an emissive core and restrained halo while strong rain hides its glare without adding a render target',()=>{
 const scene=new T.Scene(),sun=new T.DirectionalLight(),skyLight=new T.HemisphereLight(),camera=new T.PerspectiveCamera(),atmosphere=createRoAtmosphere({scene,sun,skyLight});camera.position.set(0,10,22);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 try{atmosphere.update(state,122.4,camera,{weatherStrength:1});const sky=atmosphere.root.children[0];assert.match(sky.material.fragmentShader,/solarCore/);assert.match(sky.material.fragmentShader,/solarHalo/);assert.equal(sky.material.uniforms.solarVisibility.value,1);assert.equal(atmosphere.stats().renderTargets,0);atmosphere.update(state,123,camera,{weatherStrength:.4});assert.equal(sky.material.uniforms.solarVisibility.value,0);assert.equal(atmosphere.stats().rays,0);assert.equal(atmosphere.root.children.length,2);}finally{atmosphere.dispose();}
});
