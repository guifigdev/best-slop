import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roSandEffectHandles,roSandParticles,createRoSandKickArt,RO_SAND_BUDGET as B} from '../src/ro-sand-kick-art.js';
import {createRoElementAreaArt} from '../src/ro-element-area-art.js';

const impacts=Array.from({length:7},(_,i)=>({id:100+i,type:'roSkillImpact',bonk:true,skillKey:'as_grimtooth',x:4,z:6+i,time:1}));
test('Grimtooth ground impacts always claim their cosmetic fallback, even while native textures are cold',()=>{
 const scene=new T.Scene(),art=createRoElementAreaArt({scene});
 try{for(const e of impacts){assert.ok(roSandEffectHandles(e));assert.ok(art.handles(e,{options:{mode:'bonk'}},1.1));}assert.equal(roSandEffectHandles({...impacts[0],type:'damage'}),false);assert.equal(roSandEffectHandles({...impacts[0],skillKey:'other'}),false);}finally{art.dispose();}
});
test('small sand clouds and flying grains follow each spike sample, expand and fade without camera-relative motion',()=>{
 const state={effects:impacts},height=(x,z)=>2+x*.02+z*.04,early=roSandParticles(state,1.12,height),late=roSandParticles(state,1.6,height);
 assert.equal(early.puffs.length,21);assert.equal(early.grains.length,56);
 for(const e of impacts)assert.ok(early.puffs.some(p=>Math.hypot(p.x-e.x,p.z-e.z)<.2));
 assert.ok(early.puffs.every((p,i)=>p.y>height(p.x,p.z)&&p.size<late.puffs[i].size&&p.opacity>late.puffs[i].opacity));
 assert.deepEqual(roSandParticles({...state,camera:{x:999,z:999}},1.12,height),early);assert.deepEqual(roSandParticles(state,1.91,height),{puffs:[],grains:[]});
});
test('mixed rapid sand casts and Grimtooth lines reuse two bounded batches and clear without leaks',()=>{
 const scene=new T.Scene(),art=createRoSandKickArt({scene}),effects=Array.from({length:200},(_,i)=>i%2?{...impacts[i%7],id:i}:{id:i,type:'roAttack',skillKey:'tf_sprinklesand',x:4,z:5,time:1,direction:0,range:4}),state={effects};
 try{for(let t=1.1;t<1.9;t+=.1){art.update(state,t,()=>0);assert.ok(art.stats().puffs<=B.puffs);assert.ok(art.stats().grains<=B.grains);assert.ok(art.stats().drawCalls<=2);assert.equal(scene.children.length,2);}art.update(state,3,()=>0);assert.equal(art.stats().drawCalls,0);}finally{art.dispose();}assert.equal(scene.children.length,0);
});
