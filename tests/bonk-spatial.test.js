import test from 'node:test';
import assert from 'node:assert/strict';
import {createBonkSpatialIndex} from '../shared/bonk-spatial.js';

test('Bonk spatial queries match brute force at edges, negative coordinates, radii and ordering', () => {
 let seed = 318; const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
 const units = Array.from({length: 280}, (_, id) => ({id, x: random()*220-110, z: random()*220-110, alive: id%13!==0, bonkEnemy: id%7!==0, collisionRadius:.2+random()*2}));
 units.push({id: 280, x:-8, z:0, alive:true, bonkEnemy:true, collisionRadius:2});
 const index = createBonkSpatialIndex(units);
 for (let i=0;i<300;i++) {const p={x:random()*220-110,z:random()*220-110}, range=i%10===0?500:random()*28;
  for (const collisionRadii of [false,true]) {const expected=units.filter(u=>u.bonkEnemy&&u.alive&&Math.hypot(u.x-p.x,u.z-p.z)<=range+(collisionRadii?u.collisionRadius:0));
   assert.deepEqual(index.within(p,range,{collisionRadii}),expected);
   assert.equal(index.nearest(p,range,{collisionRadii}),expected.toSorted((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]||null);
  }
 }
 assert.ok(index.within({x:0,z:0},6,{collisionRadii:true}).some(u=>u.id===280));
});

test('Bonk index handles deaths immediately, movement on rebuild, ties, and bounded replacement', () => {
 const a={id:1,x:-1,z:0,alive:true,bonkEnemy:true},b={id:2,x:1,z:0,alive:true,bonkEnemy:true};
 const index=createBonkSpatialIndex([b,a]); assert.equal(index.nearest({x:0,z:0},2),b);
 b.alive=false; assert.equal(index.nearest({x:0,z:0},2),a);
 a.x=50; index.rebuild(); assert.deepEqual(index.within({x:0,z:0},2),[]);
 assert.deepEqual(index.within({x:50,z:0},0),[a]);
 assert.deepEqual(index.within({x:50,z:0},0,{exclude:a}),[]);
 for(let i=0;i<100;i++)index.rebuild([{...a,id:i}]);
 assert.equal(index.stats().units,1); assert.equal(index.stats().buckets,1);
 assert.deepEqual(index.within({x:0,z:0},NaN),[]);
 assert.throws(()=>createBonkSpatialIndex([],{cellSize:0}),RangeError);
});
