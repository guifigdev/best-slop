import test from 'node:test';
import assert from 'node:assert/strict';
import {bonkInteractionParts,BONK_INTERACTION_ART_BUDGET as B} from '../src/bonk-interaction-art.js';

test('interaction glints prioritise nearby usable objects, hide depleted objects and stay deterministic',()=>{
 const objects=Array.from({length:60},(_,i)=>({id:i,type:['chest','shrine','pot','campfire'][i%4],x:i<20?i*.6:100,z:0,fuel:10}));objects[0].used=true;objects[3].fuel=0;const data={objects,nearestObject:15},hero={x:0,z:0};let visible=0;for(const time of [0,.4,1,2,4,7,11]){const a=bonkInteractionParts(data,hero,time);assert.deepEqual(a,bonkInteractionParts(data,hero,time));assert.equal(a.objectIds[0],15);assert.ok(a.objectIds.length<=B.objects);assert.ok(!a.objectIds.includes(0)&&!a.objectIds.includes(3));assert.ok(a.objectIds.every(id=>objects[id].x<=20));assert.ok(a.parts.length<=B.parts);assert.ok(a.parts.every(p=>p.every(Number.isFinite)));visible=Math.max(visible,a.parts.length);}assert.ok(visible>60);assert.deepEqual(bonkInteractionParts(data,{x:1000,z:1000},2).parts,[]);
});

test('portal rings reveal only nearby cardinal gateways and reflect their authoritative open state',()=>{
 const gate={id:'east',x:101,z:0,direction:{x:1,z:0},width:18,open:false},hero={x:90,z:0};const a=bonkInteractionParts({objects:[]},hero,1,[gate]),b=bonkInteractionParts({objects:[]},hero,1,[{...gate,open:true}]);assert.deepEqual(a.gateIds,['east']);assert.equal(a.parts.length,b.parts.length);assert.notDeepEqual(a.parts.map(p=>p[6]),b.parts.map(p=>p[6]));assert.ok(a.parts.every(p=>Math.abs(p[0]-101)<1));assert.deepEqual(bonkInteractionParts({objects:[]},{x:0,z:0},1,[gate]).gateIds,[]);
});
