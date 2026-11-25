import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoPoisonNovaArt,roPoisonNovaPose,RO_POISON_NOVA_BUDGET as B} from '../src/ro-poison-nova-art.js';
const event={id:1,source:1,bonk:true,type:'roAttack',skillKey:'asc_meteorassault',time:0,x:2,z:3,range:5};
test('Meteor Assault gas expands, billows upward and fades as true three-dimensional geometry',()=>{
 const scene=new T.Scene(),art=createRoPoisonNovaArt({scene}),state={worldSeed:1,options:{mode:'bonk'},effects:[event,{...event,id:2,type:'abilityPulse'}]};
 art.update(state,.15,()=>4);assert.equal(art.stats().casts,1);assert.equal(art.stats().instances,80);assert.equal(art.stats().planes,0);assert.equal(art.mesh.geometry.type,'IcosahedronGeometry');const a=roPoisonNovaPose(event,.15,0,2),b=roPoisonNovaPose(event,.8,0,2);assert.ok(Math.hypot(b.x-event.x,b.z-event.z)>Math.hypot(a.x-event.x,a.z-event.z));assert.ok(b.y>a.y);assert.ok(b.alpha<a.alpha);assert.ok(a.w>0&&a.h>0&&a.d>0);
 state.effects=[];art.update(state,1.1);assert.ok(art.stats().instances>0,'gas outlives the initial damage event');art.update(state,1.4);assert.equal(art.stats().instances,0);art.dispose();art.dispose();assert.equal(scene.children.length,0);
});
test('nova batching is bounded and resets on a rewind or world transition',()=>{
 const art=createRoPoisonNovaArt({scene:new T.Scene()}),state={options:{mode:'bonk'},effects:Array.from({length:40},(_,id)=>({...event,id,source:id}))};art.update(state,.3);assert.ok(art.stats().instances<=B.instances);assert.ok(art.stats().casts<=B.casts);state.effects=[];art.update(state,.1);assert.equal(art.stats().casts,0);art.dispose();
});
