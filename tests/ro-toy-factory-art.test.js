import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_TOY_FACTORY_ART_BUDGET as B,RO_TOY_FACTORY_KINDS,roToyFactoryKind,roToyFactoryParts} from '../src/ro-toy-factory-art.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';

test('toy replacements have eight distinct detailed identities and stay inside each unchanged rotated source footprint',()=>{
 const route=roWorldRegion('toy-factory'),map=generateBonkLevel(815,route.scene,route.habitat,route),seen=new Set(),signatures=new Set();
 for(const [index,o]of map.decorations.entries()){const before=JSON.stringify(o),art=roToyFactoryParts(o,index);if(!art)continue;seen.add(art.kind);assert.equal(roToyFactoryParts(o,index),art);assert.ok(Object.isFrozen(art)&&Object.isFrozen(art.parts[0]));assert.ok(art.parts.length>=20&&art.parts.length<=B.smallParts);for(const [x,y,z,w,h,d,c,angle,lit]of art.parts){assert.ok([x,y,z,w,h,d,c,angle].every(Number.isFinite));assert.ok(w>0&&h>0&&d>0);assert.equal(typeof lit,'boolean');const yaw=o.yaw||0,xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=z*Math.cos(yaw)-x*Math.sin(yaw),ex=(Math.abs(Math.cos(angle+yaw))*w+Math.abs(Math.sin(angle+yaw))*d)*.5,ez=(Math.abs(Math.sin(angle+yaw))*w+Math.abs(Math.cos(angle+yaw))*d)*.5;assert.ok(Math.abs(xx)+ex<=o.w*.5+.000001,o.id+' x');assert.ok(Math.abs(zz)+ez<=o.d*.5+.000001,o.id+' z');assert.ok(y-h*.5>=-.000001&&y+h*.5<=o.h+.000001,o.id+' height');}assert.equal(JSON.stringify(o),before);signatures.add(art.kind+':'+art.parts.length);}
 assert.deepEqual(seen,new Set(RO_TOY_FACTORY_KINDS));assert.ok(signatures.size>=8);assert.equal(roToyFactoryParts({id:'tree',type:'tree',w:1,d:1,h:6}),null);assert.equal(roToyFactoryKind({type:'regional-prop',model:'mine-wagon'}),'train');assert.equal(roToyFactoryKind({type:'regional-prop',model:'toy-factory'}),null,'retain the existing colorful assembly hall');
});

test('distant toy silhouettes remain low detail and finite without new materials or lights',()=>{
 for(let index=0;index<100;index++){const o={id:'horizon:'+index,type:'boulder',w:5,d:4,h:3+index%5},art=roToyFactoryParts(o,index,{distant:true});assert.ok(art.parts.length<=B.distantParts);assert.ok(art.parts.every(p=>p.slice(0,8).every(Number.isFinite)&&p[8]===false));}assert.equal(B.extraDrawCalls,0);
});

test('the actual toy factory replaces generic rocks in existing batches while preserving colliders, terrain and other regions',()=>{
 const route=roWorldRegion('toy-factory'),map=generateBonkLevel(815,route.scene,route.habitat,route),scene=new T.Scene(),world=createBonkWorld({scene}),source=JSON.stringify(map),colliders=map.obstacles,state={options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[]},units:[]};try{
  world.update(state,0);const architecture=world.root.getObjectByName('bonk-landscape'),models=architecture.userData.toyFactoryModels;assert.equal(Object.keys(models).length,8);assert.ok(models.santa>=3&&models.train>30&&models['gift-pile']>100&&models.gingerbread>30);assert.ok(Object.values(models).reduce((a,b)=>a+b,0)>350);assert.ok(architecture.count<=architecture.instanceMatrix.count);assert.ok(architecture.count<24000,'detailed toys plus the far skyline fit the original30k batch');const children=[...world.root.children];for(let t=1;t<5;t++)world.update(state,t);assert.deepEqual(world.root.children,children);assert.equal(map.obstacles,colliders);assert.equal(JSON.stringify(map),source);const normal=generateBonkLevel(19,'grove');world.update({...state,bonk:{...state.bonk,map:normal,objects:normal.objects}},10);assert.deepEqual(architecture.userData.toyFactoryModels,{});assert.ok(world.root.getObjectByName('bonk-foliage').count>0,'other regions keep their original art');
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});
