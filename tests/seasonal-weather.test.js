import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonalWeather,WEATHER_SEASONS,SEASONAL_WEATHER_RULES} from '../shared/seasonal-weather.js';
import {voxelClimateForState,voxelWeatherForState,createVoxelWeather} from '../src/voxel-weather.js';
import * as T from 'three';

test('seeded seasons produce genuine dry, cloud, rain and storm intervals instead of permanent precipitation',()=>{
 for(const seed of [1,17,'BOSQUE',98231]){
  const observed=new Set(),seasons=new Set();let dry=0;
  for(let time=0;time<1440;time++){const c=seasonalWeather({seed,time,biome:'forest'});observed.add(c.weather);seasons.add(c.season);if(!c.precipitation)dry++;assert.ok(c.sunlight>=.16&&c.sunlight<=1);assert.ok(c.cloudCover>=0&&c.cloudCover<=1);assert.ok(c.rayStrength>=0&&c.rayStrength<=1);}
  assert.deepEqual([...seasons].sort(),[...WEATHER_SEASONS].sort());assert.ok(dry/1440>.5);for(const weather of ['sunny','cloudy','rain','storm'])assert.ok(observed.has(weather),seed+': '+weather);
  for(let time=0;time<=SEASONAL_WEATHER_RULES.initialDrySeconds;time++)assert.equal(seasonalWeather({seed,time}).precipitation,0);
 }
});

test('wet and dry lighting transition continuously with clouds, and rain suppresses solar rays',()=>{
 let previous=seasonalWeather({seed:17,time:0}),clear=null,wet=null;
 for(let time=.1;time<350;time+=.1){const c=seasonalWeather({seed:17,time});assert.ok(Math.abs(c.cloudCover-previous.cloudCover)<.04);assert.ok(Math.abs(c.sunlight-previous.sunlight)<.04);assert.ok(Math.abs(c.precipitation-previous.precipitation)<.04);if(c.weather==='sunny')clear=c;if(c.precipitation>.99)wet=c;previous=c;}
 assert.ok(clear&&wet);assert.ok(wet.rayStrength<clear.rayStrength*.2);assert.ok(wet.sunlight<clear.sunlight);
});

test('cold biomes have intermittent snow, hot and dry regions retain dry periods, and indoor ambient effects remain',()=>{
 for(const biome of ['glacier','frost','snow-village','forest','forge','volcano','desert','coast','tempest']){
  let dry=0,wet=0;for(let time=0;time<720;time++){const c=voxelClimateForState({options:{mode:'campaign'},arena:biome,time,worldSeed:61});if(c.precipitation<=.01)dry++;else{wet++;assert.equal(c.cold?c.kind==='snow':['rain','storm'].includes(c.kind),true);}}
  assert.ok(dry>360,biome+': dry majority');assert.ok(wet>0,biome+': occasional precipitation');
 }
 for(const biome of ['crypt','cavern','void']){const c=voxelClimateForState({options:{mode:'dungeon'},dungeon:{biome},time:55});assert.equal(c.indoor,true);assert.equal(c.precipitation,0);assert.equal(c.kind,'mist');assert.equal(c.rayStrength,0);}
 const hot=voxelClimateForState({options:{mode:'warlock'},time:0});assert.equal(hot.kind,'sparks');assert.equal(hot.hot,true);assert.equal(hot.precipitation,0);
});

test('hot regions receive occasional showers every third front and retain sparks on their much longer dry periods',()=>{
 const wetFronts=new Set();let hotWet=0,grassWet=0,hotDry=0;
 for(let time=0;time<720;time++){
  const hot=voxelClimateForState({options:{mode:'warlock'},time,worldSeed:61}),grass=voxelClimateForState({options:{mode:'campaign'},arena:'forest',time,worldSeed:61});
  assert.equal(hot.ambientKind,'sparks');
  if(hot.precipitation>.01){hotWet++;wetFronts.add(hot.cycle);}else{hotDry++;assert.equal(hot.kind,'sparks');}
  if(grass.precipitation>.01)grassWet++;
 }
 assert.ok(hotWet>0);assert.ok(hotDry>600);assert.ok(hotWet<grassWet*.5);
 const fronts=[...wetFronts];for(let i=1;i<fronts.length;i++)assert.equal(fronts[i]-fronts[i-1],3);
});

test('local biome and seed resolve consistently in every game mode and regional map',()=>{
 for(const mode of ['campaign','tower','best','war','castlefight','linewars','treetag','kodotag','phasekiller','bonk','bloody','dungeon']){
  const state={options:{mode,seed:123},arena:'forest',time:50};assert.deepEqual(voxelClimateForState(structuredClone(state)),voxelClimateForState(state));assert.equal(voxelWeatherForState(state),voxelClimateForState(state).kind);
 }
 const dungeon={options:{mode:'dungeon'},time:50,dungeon:{map:{seed:782,rooms:[{x:0,z:0,w:10,d:10,biome:'forest'},{x:20,z:0,w:10,d:10,biome:'frost'}]}}};
 assert.equal(voxelClimateForState(dungeon,{x:0,z:0}).cold,false);assert.equal(voxelClimateForState(dungeon,{x:20,z:0}).cold,true);
 const regional={options:{mode:'bloody'},time:50};assert.equal(voxelClimateForState(regional,{x:0,z:174}).cold,true);assert.equal(voxelClimateForState(regional,{x:-174,z:0}).hot,true);assert.equal(voxelClimateForState(regional,{x:174,z:0}).biome,'forest');
 const ro={options:{mode:'bonk'},bonk:{map:{seed:782,stageKey:'glacier',biome:'forest'}},time:50};assert.equal(voxelClimateForState(ro).cold,true);ro.bonk.map.tower=true;assert.equal(voxelClimateForState(ro).indoor,true);assert.equal(voxelClimateForState(ro).precipitation,0);
 const a=Array.from({length:180},(_,time)=>voxelClimateForState({...dungeon,time})),b=Array.from({length:180},(_,time)=>voxelClimateForState({...dungeon,time,dungeon:{...dungeon.dungeon,map:{...dungeon.dungeon.map,seed:783}}}));assert.notDeepEqual(a,b,'different map seeds vary their weather fronts');
});

test('explicit weather and debug choices override the season without touching authority or consulting random clocks',()=>{
 const state={options:{mode:'treetag',seed:77},time:47,treeTag:{elapsed:47},units:[{id:1,hp:900}],weatherOverride:'clear'},before=JSON.stringify(state),random=Math.random,now=Date.now;
 try{Math.random=()=>{throw new Error('gameplay RNG must not be consulted');};Date.now=()=>{throw new Error('wall time must not be consulted');};const c=voxelClimateForState(state);assert.equal(c.kind,'none');assert.equal(c.source,'explicit');assert.equal(c.precipitation,0);assert.equal(JSON.stringify(state),before);assert.deepEqual(voxelClimateForState(state),c);}finally{Math.random=random;Date.now=now;}
 assert.equal(voxelClimateForState({...state,weatherOverride:undefined,options:{...state.options,weather:'rain'}}).kind,'rain');assert.equal(voxelClimateForState({...state,weatherOverride:undefined,debug:{weatherKind:'snow'}}).kind,'snow');assert.equal(voxelClimateForState(null).kind,'none');
 const paused={options:{mode:'campaign'},time:55};const climate=voxelClimateForState(paused);assert.deepEqual(voxelClimateForState({...paused,now:99999,clientTime:123000}),climate);
});

test('precipitation intensity fades existing particle batches without allocating objects or silencing ambient sparks',()=>{
 const weather=createVoxelWeather(new T.Scene());try{const geometries=weather.root.children.map(m=>m.geometry);weather.update(50,{kind:'rain',intensity:.25});assert.equal(weather.root.children[0].count,24);assert.equal(weather.root.children[1].count,3);weather.update(50,{kind:'rain',intensity:0});assert.equal(weather.root.children[0].count,0);weather.update(50,{kind:'snow',intensity:.5});assert.equal(weather.root.children[0].count,48);weather.update(50,{kind:'sparks',intensity:0});assert.equal(weather.root.children[0].count,96);assert.deepEqual(weather.root.children.map(m=>m.geometry),geometries);}finally{weather.dispose();}
});
