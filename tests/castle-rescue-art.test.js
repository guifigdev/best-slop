import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCastleRescueEffect,updateCastleRescueEffect} from '../src/castle-rescue-art.js';
import {releaseEffect} from '../src/effect-resources.js';

test('Rescue Strike warning uses the real radius and expires independently of boss warnings',()=>{
 const base=new T.BoxGeometry(),event={type:'castleRescueWarning',radius:2.734375,duration:.35,time:10,x:2,z:4},entry=createCastleRescueEffect(event,base);assert.equal(entry.group.children.length,2);assert.equal(entry.group.children[0].geometry.parameters.radius,event.radius);assert.equal(entry.group.children[1].geometry.parameters.outerRadius,event.radius);assert.equal(updateCastleRescueEffect(entry,10.34,3),true);assert.equal(entry.group.position.y,3.12);assert.equal(updateCastleRescueEffect(entry,10.36,3),false);releaseEffect(entry);base.dispose();
});
test('Rescue Strike renders one instanced burst plus its exact contour and releases its own resources',()=>{
 const base=new T.BoxGeometry(),entry=createCastleRescueEffect({type:'castleRescueStrike',radius:2.7,time:0,x:0,z:0},base);assert.equal(entry.group.children.length,2);assert.equal(entry.group.children[0].isInstancedMesh,true);assert.equal(entry.group.children[0].count,24);assert.equal(entry.group.children[1].geometry.parameters.outerRadius,2.7);assert.equal(updateCastleRescueEffect(entry,.3),true);assert.ok([...entry.group.children[0].instanceMatrix.array].every(Number.isFinite));assert.equal(updateCastleRescueEffect(entry,.66),false);let disposed=0;entry.group.children[0].addEventListener('dispose',()=>disposed++);releaseEffect(entry);assert.equal(disposed,1);base.dispose();assert.equal(createCastleRescueEffect({type:'bossDanger'},base),null);
});
