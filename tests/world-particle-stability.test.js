import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {worldParticleGrid} from '../src/world-particle-grid.js';
import {createVoxelWeather,VOXEL_WEATHER_BUDGET} from '../src/voxel-weather.js';
import {createEnvironmentPackArt,ENVIRONMENT_PACK_BUDGET} from '../src/environment-pack-art.js';

const terrain=(x,z)=>4+x*.012+Math.sin(z*.04)*.3;
function instancesById(mesh){return new Map((mesh.userData.worldParticleIds||[]).map((id,i)=>[id,Array.from(mesh.instanceMatrix.array.slice(i*16,i*16+16))]));}
function retained(before,after){let count=0;for(const [id,matrix]of before)if(after.has(id)){assert.deepEqual(after.get(id),matrix,id+' remains at the same world position and pose');count++;}return count;}

test('negative and positive world grid cells retain their instance slots across one adjacent column',()=>{
 for(const x of [-10.1,-.1,9.9]){const before=worldParticleGrid({x,z:3}),after=worldParticleGrid({x:x+.2,z:3}),old=new Map(before.cells.map(c=>[c.x+':'+c.z,c.slot]));let overlap=0;for(const c of after.cells){const id=c.x+':'+c.z;if(old.has(id)){overlap++;assert.equal(c.slot,old.get(id));}}assert.equal(overlap,9);}
});

test('panning inside one cell never translates rain, storm, snow, mist, sparks or floating wind particles',()=>{
 for(const kind of ['rain','storm','snow','mist','sparks','wind']){const weather=createVoxelWeather(new T.Scene(),{seed:'world-fixed'});try{weather.update(17,{kind,center:{x:1.25,y:900,z:2.5},heightAt:terrain});const before=weather.root.children.map(m=>Array.from(m.instanceMatrix.array)),ids=weather.root.children.map(m=>[...(m.userData.worldParticleIds||[])]);weather.update(17,{kind,center:{x:7.5,y:-900,z:8.7},heightAt:terrain});for(const [i,m]of weather.root.children.entries()){assert.deepEqual(Array.from(m.instanceMatrix.array),before[i],kind+': world matrices unchanged');assert.deepEqual(m.userData.worldParticleIds||[],ids[i]);assert.ok(m.instanceMatrix.array.every(Number.isFinite));}assert.deepEqual(weather.root.position.toArray(),[0,0,0]);}finally{weather.dispose();}}
});

test('crossing a weather cell recycles only the departing edge; overlapping global IDs keep identical terrain poses',()=>{
 for(const kind of ['rain','snow','mist']){const weather=createVoxelWeather(new T.Scene(),{seed:123}),fresh=createVoxelWeather(new T.Scene(),{seed:123});try{weather.update(12,{kind,center:{x:9.9,z:3},heightAt:terrain});const before=weather.root.children.slice(0,2).map(instancesById);weather.update(12,{kind,center:{x:10.1,z:3},heightAt:terrain});fresh.update(12,{kind,center:{x:10.1,z:3},heightAt:terrain});for(const [i,m]of weather.root.children.slice(0,2).entries()){const after=instancesById(m);if(before[i].size)assert.equal(retained(before[i],after),before[i].size*.75,kind+': only one of four cell columns changes');assert.deepEqual(after,instancesById(fresh.root.children[i]),'same global particles regardless of camera history');assert.ok(m.count<=([VOXEL_WEATHER_BUDGET.particles,VOXEL_WEATHER_BUDGET.mist][i]));for(const matrix of after.values()){const x=matrix[12],y=matrix[13],z=matrix[14];assert.ok(y>=terrain(x,z)-.001);}}}finally{weather.dispose();fresh.dispose();}}
});

test('same-time camera drags preserve world-fixed insects, wisps, snow motes and authored falling leaves',()=>{
 for(const arena of ['forest','moon','glacier','volcano']){const art=createEnvironmentPackArt({scene:new T.Scene(),heightAt:terrain}),state={options:{mode:'campaign'},arena,seed:22,bounds:18};try{art.update(state,13,{target:{x:1.25,z:2.5}});const before=art.root.children.map(m=>Array.from(m.instanceMatrix.array)),builds=art.stats().rebuilds;art.update(state,13,{target:{x:7.5,z:8.7}});for(const [i,m]of art.root.children.entries())assert.deepEqual(Array.from(m.instanceMatrix.array),before[i],arena+': camera never shifts the field');assert.equal(art.stats().rebuilds,builds);assert.ok(art.stats().life<=ENVIRONMENT_PACK_BUDGET.life);assert.ok(art.stats().leaves<=ENVIRONMENT_PACK_BUDGET.leaves);}finally{art.dispose();}}
});

test('ambient life recycles one outer cell column and leaves retain emitter-specific paths when membership changes',()=>{
 const art=createEnvironmentPackArt({scene:new T.Scene(),heightAt:terrain}),fresh=createEnvironmentPackArt({scene:new T.Scene(),heightAt:terrain}),state={options:{mode:'campaign'},arena:'forest',seed:22,bounds:18};try{art.update(state,13,{target:{x:11.9,z:3}});const life=art.root.getObjectByName('environment-ambient-life'),leaves=art.root.getObjectByName('environment-falling-leaves'),beforeLife=instancesById(life),beforeLeaves=instancesById(leaves);assert.ok(beforeLeaves.size>0,'exercise real falling leaf paths');art.update(state,13,{target:{x:12.1,z:3}});assert.equal(retained(beforeLife,instancesById(life)),beforeLife.size*.75);assert.ok(retained(beforeLeaves,instancesById(leaves))>0);fresh.update(state,13,{target:{x:12.1,z:3}});assert.deepEqual(instancesById(life),instancesById(fresh.root.getObjectByName('environment-ambient-life')));assert.ok(life.instanceMatrix.array.every(Number.isFinite));assert.ok(leaves.instanceMatrix.array.every(Number.isFinite));}finally{art.dispose();fresh.dispose();}
});
