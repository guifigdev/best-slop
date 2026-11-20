import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraBounds,cameraDestination} from '../src/camera-navigation.js';
import {createBloodyCamera} from '../src/bloody-camera.js';
import {modeOptions,capacity} from '../shared/modes.js';

const fixture=()=>({options:{mode:'bloody'},players:{me:1},units:[{id:1,x:22,z:-31}],bloodyTournament:{round:0,stage:'preparation',map:{minX:-62,maxX:62,minZ:-48,maxZ:48},formations:[{owner:'me',minX:17,maxX:27,minZ:-34,maxZ:-28}]}});
test('private preparation garden, central battlefield and complete map have distinct camera destinations',()=>{
 const state=fixture();assert.deepEqual(cameraDestination(state,'me','base'),{x:22,z:-31,distance:62});assert.deepEqual(cameraDestination(state,'me','battle'),{x:0,z:0,distance:65});const overview=cameraDestination(state,'me','overview');assert.equal(overview.x,0);assert.equal(overview.z,0);assert.ok(overview.distance>140);assert.deepEqual(cameraBounds(state),{minX:-66,maxX:66,minZ:-52,maxZ:52});
});
test('round transitions reveal the battlefield without overriding camera exploration on every snapshot',()=>{
 let state=fixture();const points=[],camera=createBloodyCamera({getState:()=>state,getOwner:()=> 'me',view:{focusPoint:p=>points.push(p)}});
 camera.update();assert.equal(camera.zone,'base');assert.equal(points.length,1);camera.focus('overview');for(let i=0;i<10;i++)camera.update();assert.equal(points.length,2);assert.equal(camera.zone,'overview');state.bloodyTournament.stage='battle';state.bloodyTournament.round=1;camera.update();assert.equal(camera.zone,'battle');assert.equal(points.length,3);assert.deepEqual(points.at(-1),{x:0,z:0,distance:65});state.bloodyTournament.stage='preparation';camera.update();assert.equal(camera.zone,'base');assert.equal(points.length,4);camera.reset();camera.update();assert.equal(points.length,5);
});
test('native individual format has eight private gardens and five versus five keeps ten commanders',()=>{
 assert.equal(capacity(modeOptions({mode:'bloody',bloodyTeams:false})),8);assert.equal(capacity(modeOptions({mode:'bloody',bloodyTeams:true,teamSize:5})),10);
});
