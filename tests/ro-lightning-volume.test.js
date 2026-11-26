import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roLightningVolume} from '../src/ro-lightning-volume.js';
import {createRoMageSpellArt,roMageSpellParts} from '../src/ro-mage-spell-art.js';

test('lightning branches across all three axes with oriented solid white cores and wider additive blue halos',()=>{
 const a=roLightningVolume({x:4,z:6,base:2,height:8,time:1,seed:13}),b=roLightningVolume({x:4,z:6,base:2,height:8,time:1.2,seed:13});assert.equal(a.cubes.length,36);assert.equal(a.glows.length,24);assert.notDeepEqual(a.cubes,b.cubes);assert.ok(Math.max(...a.cubes.map(p=>p[1]))-Math.min(...a.cubes.map(p=>p[1]))>7);assert.ok(Math.max(...a.cubes.map(p=>p[0]))-Math.min(...a.cubes.map(p=>p[0]))>1);assert.ok(Math.max(...a.cubes.map(p=>p[2]))-Math.min(...a.cubes.map(p=>p[2]))>1);for(const p of a.glows){assert.ok(p[7]>0&&p[7]<1);assert.equal(p[8].length,3);assert.ok(Math.abs(Math.hypot(...p[8])-1)<1e-8);}for(let i=0;i<24;i++)assert.ok(a.glows[i][3]>a.cubes[i][3]);
});

test('both targeted Lightning Bolt and Thunderstorm render real 3D core/halo batches and preserve their damage state',()=>{
 const scene=new T.Scene(),art=createRoMageSpellArt({scene}),state={units:[{id:2,size:1,alive:true}],effects:[],bonk:{projectiles:[{id:1,roMageBolt:true,skillKey:'mg_lightningbolt',targetId:2,x:3,z:4,height:6,flightRemaining:.2}]}};try{const before=structuredClone(state);art.update(state,1,()=>2);assert.ok(art.stats().cubes>=36);assert.ok(art.stats().glows>=24);assert.equal(art.stats().planes,0);const halo=scene.getObjectByName('ro-lightning-additive-halos');assert.equal(halo.material.blendDst,T.OneFactor);assert.equal(halo.geometry.type,'BoxGeometry');assert.equal(halo.material.map,null);assert.deepEqual(state,before);const storm=roMageSpellParts({id:2,time:1,type:'multishot',skillKey:'mg_thunderstorm',radius:3.5,x:0,z:0},1.1);assert.ok(storm.cubes.length>=100);assert.ok(storm.glows.length>=70);assert.ok(storm.cubes.every(p=>p[1]>0));}finally{art.dispose();}assert.equal(scene.children.length,0);
});
