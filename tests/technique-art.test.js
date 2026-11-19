import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createTechniqueEffect,updateTechniqueEffect} from '../src/technique-art.js';
import {releaseEffect} from '../src/effect-resources.js';
import {combatStatuses,negativeTint} from '../src/combat-status.js';

const context=()=>({time:0,units:[{id:'s',x:-4,z:2,size:1,alive:true,violentForce:{until:6},hurricane:{until:2}},{id:'t',x:5,z:3,size:1,alive:true,mana:100}],actors:new Map(),heightAt:()=>.2});
const effect=(type,extra={})=>createTechniqueEffect({id:type,type,source:'s',target:'t',x:-4,z:2,tx:5,tz:3,time:0,radius:4,...extra});
const matrix=(mesh,index=0)=>{const result=new T.Matrix4();mesh.getMatrixAt(index,result);return result;};

test('technique geometry uses at most two instanced draws and shared texture-free resources',()=>{
 const entries=['doubleattack','violentforce','hurricane','hurricanePulse','manabreak'].map(type=>effect(type));
 try{for(const entry of entries){assert.ok(entry.group.children.length<=2);for(const mesh of entry.group.children){assert.ok(mesh.isInstancedMesh);assert.equal(mesh.material,entries[0].mat);assert.equal(mesh.material.map,null);assert.ok(mesh.count<=48);}}assert.equal(createTechniqueEffect({type:'unknown'}),null);assert.equal(effect('hurricane',{radius:NaN}),null);}finally{entries.forEach(releaseEffect);}
});

test('double attack displays two staggered cuts at victim height with no state mutation',()=>{
 const ctx=context(),entry=effect('doubleattack'),before=JSON.stringify(ctx.units);
 try{updateTechniqueEffect(entry,ctx);assert.deepEqual(entry.group.children.map(m=>m.count),[12,0]);assert.equal(entry.group.position.x,5);assert.equal(entry.group.position.z,3);assert.equal(entry.group.position.y,1.5);ctx.time=.26;updateTechniqueEffect(entry,ctx);assert.deepEqual(entry.group.children.map(m=>m.count),[12,12]);ctx.time=.4;updateTechniqueEffect(entry,ctx);assert.deepEqual(entry.group.children.map(m=>m.count),[0,12]);ctx.time=.625;assert.equal(updateTechniqueEffect(entry,ctx),false);assert.equal(JSON.stringify(ctx.units),before);}finally{releaseEffect(entry);}
});

test('mana fragments leave the victim, including flying actors, without transferring mana',()=>{
 const ctx=context(),entry=effect('manabreak');ctx.units[1].flying=true;ctx.units[1].altitude=2;
 const before=JSON.stringify(ctx.units);
 try{updateTechniqueEffect(entry,ctx);assert.equal(entry.group.position.x,5);assert.equal(entry.group.position.y,3.5);const first=matrix(entry.group.children[0]).elements[13];ctx.time=.375;updateTechniqueEffect(entry,ctx);assert.ok(matrix(entry.group.children[0]).elements[13]>first);for(let i=0;i<18;i++){const m=matrix(entry.group.children[0],i).elements;assert.ok(Math.abs(m[12])<1&&Math.abs(m[14])<1);}assert.equal(JSON.stringify(ctx.units),before);}finally{releaseEffect(entry);}
});

test('hurricane follows current actor position while baked poses change only at 8Hz',()=>{
 const ctx=context(),entry=effect('hurricane');const root=new T.Group();root.position.set(1,2.2,3);ctx.actors.set('s',{root,eyeLine:1.3,modelHeight:2});
 try{updateTechniqueEffect(entry,ctx);const initial=matrix(entry.group.children[0]).toArray();assert.equal(entry.group.position.x,1);assert.equal(entry.group.position.y,.2);ctx.time=.1;root.position.x=7;updateTechniqueEffect(entry,ctx);assert.equal(entry.group.position.x,7);assert.deepEqual(matrix(entry.group.children[0]).toArray(),initial);ctx.time=.13;updateTechniqueEffect(entry,ctx);assert.notDeepEqual(matrix(entry.group.children[0]).toArray(),initial);
  const ring=entry.group.children[1],transform=matrix(ring),position=ring.geometry.attributes.position,p=new T.Vector3();let outer=0;for(let i=0;i<position.count;i++){p.fromBufferAttribute(position,i).applyMatrix4(transform);outer=Math.max(outer,Math.hypot(p.x,p.z));}assert.ok(Math.abs(outer-4)<1e-5);assert.equal(entry.group.userData.radius,4);
 }finally{releaseEffect(entry);}
});

test('persistent effects stop on authoritative expiration, death or cancellation',()=>{
 for(const type of ['violentforce','hurricane'])for(const stop of ['expire','dead','remove']){const ctx=context(),entry=effect(type);try{assert.equal(updateTechniqueEffect(entry,ctx),true);if(stop==='expire')ctx.time=type==='violentforce'?6:2;else if(stop==='dead')ctx.units[0].alive=false;else delete ctx.units[0][type==='violentforce'?'violentForce':'hurricane'];assert.equal(updateTechniqueEffect(entry,ctx),false);assert.equal(entry.group.visible,false);}finally{releaseEffect(entry);}}
});

test('violent force is a positive warm aura and never counts as a negative status',()=>{
 const ctx=context(),entry=effect('violentforce');
 try{assert.equal(updateTechniqueEffect(entry,ctx),true);ctx.time=5.9;assert.equal(updateTechniqueEffect(entry,ctx),true);assert.equal(negativeTint(ctx.units[0],ctx.time),null);assert.ok(combatStatuses(ctx.units[0],ctx.time).some(s=>s.key==='violentforce'));assert.equal(negativeTint({...ctx.units[0],frostUntil:8},ctx.time).key,'frost');const c=new T.Color();entry.group.children[0].getColorAt(0,c);assert.ok(c.r>c.g&&c.g>c.b);}finally{releaseEffect(entry);}
});

test('effect cleanup releases instance buffers and disposes shared GPU assets only after last user',()=>{
 const a=effect('doubleattack'),b=effect('manabreak');let geometry=0,material=0,instances=0;
 a.group.children[0].geometry.addEventListener('dispose',()=>geometry++);a.mat.addEventListener('dispose',()=>material++);for(const entry of [a,b])for(const mesh of entry.group.children)mesh.addEventListener('dispose',()=>instances++);
 releaseEffect(a);assert.equal(instances,2);assert.equal(geometry,0);assert.equal(material,0);releaseEffect(b);assert.equal(instances,4);assert.equal(geometry,1);assert.equal(material,1);releaseEffect(a);releaseEffect(b);assert.equal(instances,4);assert.equal(material,1);
});
