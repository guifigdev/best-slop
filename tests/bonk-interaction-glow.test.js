import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bonkInteractionGlowSources,createBonkInteractionGlow,BONK_INTERACTION_GLOW_BUDGET as B} from '../src/bonk-interaction-art.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {generateBonkLevel} from '../shared/bonk-level.js';

test('usable altars and treasure emit luminous cues beyond the former twenty-metre cutoff',()=>{
 const data={nearestObject:'near',objects:[{id:'near',type:'shrine',x:3,z:0},{id:'far',type:'chest',x:32,z:0},{id:'used',type:'shrine',x:2,z:0,used:true},{id:'pot',type:'pot',x:1,z:0},{id:'outside',type:'chest',x:49,z:0}],pickups:[{id:'gear',type:'equipment',x:25,z:0,item:{key:'knife'}},{id:'taken',type:'equipment',x:1,z:0,used:true},{id:'xp',type:'xp',x:1,z:0}]},a=bonkInteractionGlowSources(data,{x:0,z:0});
 assert.deepEqual(a.map(o=>o.id),['near','far','gear']);assert.equal(a[0].near,true);assert.equal(a[1].near,false);assert.equal(a[2].glowSource,'equipment');
 assert.deepEqual(bonkInteractionGlowSources({...data,objects:data.objects.map(o=>({...o,used:true})),pickups:[]},{x:0,z:0}),[]);
});

test('one additive unlit batch shows radial halos, shafts and sparkles, with no point lights or opaque rings',()=>{
 const parent=new T.Group(),glow=createBonkInteractionGlow({parent,heightAt:()=>2}),data={nearestObject:'altar',objects:[{id:'altar',type:'shrine',x:0,z:0}],pickups:[{id:'gear',type:'equipment',x:2,z:0}]};glow.update(data,{x:0,z:0},1);
 const mesh=glow.root.getObjectByName('bonk-luminous-interactables');assert.equal(parent.children.length,1);assert.equal(glow.root.children.length,1);assert.equal(mesh.count,11);assert.equal(mesh.material.blending,T.AdditiveBlending);assert.equal(mesh.material.depthWrite,false);assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.toneMapped,false);assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,false);assert.ok(mesh.material.fragmentShader.includes('exp(-r*r*4.0)'));assert.ok(mesh.material.fragmentShader.includes('pow(max(0.0,1.0-abs(q.x)),5.0)'));assert.equal(mesh.geometry.getAttribute('glowKind').getX(0),0);assert.equal(mesh.geometry.getAttribute('glowKind').getX(1),1);assert.equal(mesh.geometry.getAttribute('glowKind').getX(5),3,'nearest altar has its own readable E glyph');
 const color=new T.Color();mesh.getColorAt(0,color);assert.equal(color.getHex(),0xffebbb);assert.equal(glow.stats().drawCalls,1);assert.equal(glow.stats().instances,11);glow.dispose();assert.equal(parent.children.length,0);
});

test('object and dropped-equipment budgets stay independent and picked/used objects stop glowing immediately',()=>{
 const glow=createBonkInteractionGlow({parent:new T.Group()}),objects=Array.from({length:40},(_,i)=>({id:'object-'+i,type:i%2?'shrine':'chest',x:i*.5,z:0})),pickups=Array.from({length:40},(_,i)=>({id:'item-'+i,type:'equipment',x:i*.4,z:2}));
 glow.update({objects,pickups},{x:0,z:0},0);assert.equal(glow.stats().sources,B.objects+B.equipment);assert.equal(glow.stats().instances,80);assert.ok(glow.stats().instances<B.instances);glow.update({objects:objects.map(o=>({...o,used:true})),pickups:[]},{x:0,z:0},1);assert.equal(glow.stats().instances,0);assert.equal(glow.stats().drawCalls,0);assert.equal(glow.root.visible,false);glow.dispose();
});

test('billboard halos are frustum culled and restore the exact cached batch when the camera returns',()=>{
 const glow=createBonkInteractionGlow({parent:new T.Group()}),camera=new T.PerspectiveCamera(50,1,.1,100);camera.position.set(0,5,15);camera.lookAt(0,1,0);camera.updateMatrixWorld();glow.update({objects:[{id:1,type:'shrine',x:0,z:0},{id:2,type:'chest',x:40,z:0}]},{x:0,z:0},1);const mesh=glow.root.children[0];glow.cull(camera);assert.equal(glow.stats().visible,1);assert.equal(glow.stats().culled,1);assert.equal(mesh.count,5);
 camera.lookAt(0,5,100);camera.updateMatrixWorld();glow.cull(camera);assert.equal(glow.stats().instances,0);camera.lookAt(0,1,0);camera.updateMatrixWorld();glow.cull(camera);assert.equal(glow.root.children[0],mesh);assert.equal(glow.stats().instances,5);glow.dispose();
});

test('glow animation updates existing buffers, uses finite transforms and releases all owned GPU resources once',()=>{
 const parent=new T.Group(),glow=createBonkInteractionGlow({parent}),data={objects:[{id:1,type:'chest',x:0,z:0}]};glow.update(data,{x:0,z:0},1);const mesh=glow.root.children[0],first=mesh.instanceMatrix.array.slice();glow.update(data,{x:0,z:0},2);assert.notDeepEqual(mesh.instanceMatrix.array,first);assert.equal(glow.root.children[0],mesh);assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));let geometry=0,material=0,instance=0;mesh.geometry.addEventListener('dispose',()=>geometry++);mesh.material.addEventListener('dispose',()=>material++);mesh.addEventListener('dispose',()=>instance++);glow.dispose();glow.dispose();assert.deepEqual([geometry,material,instance],[1,1,1]);assert.equal(glow.stats().disposed,true);glow.update(data,{x:0,z:0},3);assert.equal(parent.children.length,0);
});

test('the actual Bonk world includes the glow shader and removes it when an altar is consumed',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene}),map=generateBonkLevel(33,'grove'),state={options:{mode:'bonk'},units:[{bonkHero:true,alive:true,x:0,z:0}],bonk:{map,nearestObject:'altar',objects:[{id:'altar',type:'shrine',x:3,z:0}],pickups:[],projectiles:[],objectives:[]}};
 try{world.update(state,1);assert.equal(world.stats().interactionGlow.visible,1);assert.equal(world.stats().interactionGlow.instances,6);state.bonk.objects[0].used=true;world.update(state,2);assert.equal(world.stats().interactionGlow.instances,0);}finally{world.dispose();}assert.equal(scene.children.length,0);
});
