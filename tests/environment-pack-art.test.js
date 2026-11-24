import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createEnvironmentPackArt,environmentProfile,environmentPlacement,environmentPropParts,ENVIRONMENT_PROP_THEMES,ENVIRONMENT_PACK_BUDGET as B} from '../src/environment-pack-art.js';
import {createVoxelWeather,voxelWeatherForState,voxelClimateForState,VOXEL_WEATHER_BUDGET} from '../src/voxel-weather.js';

const modes=['campaign','tower','best','war','linewars','castlefight','bonk','dungeon','bloody','phasekiller','treetag','kodotag','warlock'];
const frozen=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))frozen(v);}return value;};

test('the pack contains 36 authored silhouettes, with finite native voxel parts and grounded proportions',()=>{
 const shapes=new Set();for(const [theme,keys]of Object.entries(ENVIRONMENT_PROP_THEMES)){assert.equal(keys.length,6);for(const key of keys){const spec=environmentPropParts(key);assert.ok(spec);assert.ok(spec.solid.length>0,key);const parts=Object.values(spec).flat();assert.ok(parts.length>=5,key);assert.ok(parts.length<100,key);for(const p of parts){assert.equal(p.length,8,key);assert.ok(p.every(Number.isFinite),key);assert.ok(p.slice(3,6).every(v=>v>0),key);assert.ok(p[1]-p[4]/2>=-.14,key);assert.ok(p[1]+p[4]/2<5,key);}shapes.add(JSON.stringify(parts.map(p=>[...p.slice(0,6),p[7]])));assert.deepEqual(environmentPropParts(key),spec,key);}}assert.equal(shapes.size,36,'silhouettes differ in geometry, not only palette');assert.equal(environmentPropParts('unrecognized'),null);
});

test('all modes receive deterministic, visual-only placement beyond the playable rectangle',()=>{
 for(const mode of modes){const state=frozen({options:{mode},arena:'forest',seed:37,bounds:60,units:[{x:0,z:0}]});const before=JSON.stringify(state),props=environmentPlacement(state);assert.ok(props.length>0,mode);assert.ok(props.length<=B.props,mode);assert.deepEqual(props,environmentPlacement(state),mode);for(const p of props){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));if(mode!=='phasekiller'&&mode!=='castlefight')assert.ok(Math.abs(p.x)>64||Math.abs(p.z)>64,mode);}assert.equal(JSON.stringify(state),before,mode);}
 const custom={options:{mode:'linewars'},voxelMap:{width:200,height:120,tileSize:2,origin:{x:-250,z:-100}},arena:'tempest'};for(const p of environmentPlacement(custom))assert.ok(p.x< -254||p.x>154||p.z< -104||p.z>144,'custom map origin and tile extent');
});

test('dungeon props occupy room corners and understory stays inside authoritative solid footprints',()=>{
 const room={x:12,z:22,w:16,d:12,biome:'forge'},s=frozen({options:{mode:'dungeon'},dungeon:{map:{seed:19,rooms:[room]},biome:'forest'}}),props=environmentPlacement(s);assert.equal(props.length,2);for(const p of props){assert.equal(p.source,'room-corner');assert.ok(ENVIRONMENT_PROP_THEMES.ember.includes(p.key));assert.ok(Math.abs(p.x-room.x)>6&&Math.abs(p.z-room.z)>4);assert.ok(p.scale<=.32);}
 const obstacle={type:'rock',x:9,z:9,w:3,d:4,alive:true},out=environmentPlacement({options:{mode:'campaign'},obstacles:[obstacle,{...obstacle,type:'building'},{...obstacle,alive:false}]});const inside=out.filter(p=>p.source==='solid-footprint');assert.equal(inside.length,1);assert.ok(Math.abs(inside[0].x-9)+1.5*inside[0].scale<obstacle.w/2);assert.ok(Math.abs(inside[0].z-9)+1.5*inside[0].scale<obstacle.d/2);
});

test('batch resources stay cached, motion is sampled at eight poses, and every mode remains bounded',()=>{
 const scene=new T.Scene(),art=createEnvironmentPackArt({scene,heightAt:(x,z)=>2+Math.sin(x*.01)*.1});
 try{const state=frozen({options:{mode:'campaign'},arena:'forest',seed:22,bounds:18});art.update(state,4,{target:{x:0,z:0}});assert.equal(art.root.children.length,B.drawCalls);const mesh=art.root.getObjectByName('environment-wind-foliage'),geometry=mesh.geometry,matrices=mesh.instanceMatrix.array,leaf=art.root.getObjectByName('environment-falling-leaves'),life=art.root.getObjectByName('environment-ambient-life'),pose=Array.from(life.instanceMatrix.array),builds=art.stats().rebuilds;
  art.update(state,4.01,{target:{x:0,z:0}});assert.deepEqual(Array.from(life.instanceMatrix.array),pose);art.update(state,4.2,{target:{x:0,z:0}});assert.notDeepEqual(Array.from(life.instanceMatrix.array),pose);assert.equal(art.stats().rebuilds,builds);assert.equal(mesh.geometry,geometry);assert.equal(mesh.instanceMatrix.array,matrices);assert.ok(leaf.count>0);
  const shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};mesh.material.onBeforeCompile(shader);assert.match(shader.vertexShader,/foliageRoot/);assert.ok(shader.uniforms.uFoliageTime);assert.equal(geometry.attributes.foliageRoot.count,B.boxes);
  for(const mode of modes)for(const arena of ['forest','glacier','volcano','tempest','moon','coast']){art.update({options:{mode},arena,bounds:24},5,{target:{x:0,z:0}});const stats=art.stats();assert.ok(stats.props<=B.props);assert.ok(stats.boxes<=B.boxes);assert.ok(stats.leaves<=B.leaves);assert.ok(stats.life<=B.life);assert.ok(stats.drawCalls<=B.drawCalls);for(const m of art.root.children)for(let i=0;i<m.count*16;i++)assert.ok(Number.isFinite(m.instanceMatrix.array[i]),mode+': finite instance');}
  art.update(null,6);assert.equal(art.root.visible,false);art.reset();assert.equal(art.stats().props,0);assert.ok(art.root.children.every(m=>m.count===0));
 }finally{art.dispose();art.dispose();}assert.equal(scene.children.length,0);
});

test('weather selects local themes in every mode, supports rain/storm/wind and allocates no new scene objects',()=>{
 for(const mode of modes)assert.equal(voxelClimateForState({options:{mode},arena:'forest',time:0}).precipitation,0,mode+': opens dry');
 assert.equal(voxelWeatherForState(null),'none');assert.ok(Array.from({length:90},(_,time)=>voxelWeatherForState({options:{mode:'dungeon'},dungeon:{biome:'frost'},time})).includes('snow'));assert.equal(voxelWeatherForState({options:{mode:'campaign'},arena:'volcano'}),'sparks');assert.equal(environmentProfile({options:{mode:'campaign'},arena:'glacier'}).theme,'frost');
 const weather=createVoxelWeather(new T.Scene());try{const resources=weather.root.children.map(m=>m.geometry);for(const kind of ['rain','storm','wind','snow','mist','sparks']){weather.update(5,{kind,heightAt:()=>7,center:{x:8,z:9}});assert.equal(weather.root.children.length,3);const particle=weather.root.children[0];assert.ok(particle.count<=VOXEL_WEATHER_BUDGET.particles);assert.ok(particle.instanceMatrix.array.every(Number.isFinite));assert.deepEqual(weather.root.children.map(m=>m.geometry),resources);const before=Array.from(particle.instanceMatrix.array);weather.update(5,{kind,heightAt:()=>7,center:{x:8,z:9}});assert.deepEqual(Array.from(particle.instanceMatrix.array),before);if(kind==='rain'||kind==='storm'){const m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();particle.getMatrixAt(0,m);m.decompose(p,q,scale);assert.ok(scale.y>.6);assert.equal(weather.root.children[1].count,12);}}}finally{weather.dispose();}
});

test('living Kodo and Tree Tag trees emit nearby drifting leaves and cut trees stop emitting',()=>{
 for(const mode of ['kodotag','treetag']){const art=createEnvironmentPackArt({scene:new T.Scene(),heightAt:()=>3}),trees=Array.from({length:20},(_,i)=>({id:'tree-'+i,x:i%4,z:Math.floor(i/4),h:5,alive:true})),key=mode==='kodotag'?'kodoTag':'treeTag';try{const s={options:{mode},bounds:1000,[key]:{trees}};let peak=0;for(let t=0;t<25;t+=.5){art.update(s,t);peak=Math.max(peak,art.stats().leaves);}assert.ok(peak>0,mode);art.update({...s,[key]:{trees:trees.map(t=>({...t,alive:false}))}},26);assert.equal(art.stats().leaves,0,mode);}finally{art.dispose();}}
});
