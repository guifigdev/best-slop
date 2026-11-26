import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roBodyFragmentMaterial,roHitFragments,roDeathFragments,createRoBodyFragments,RO_BODY_FRAGMENT_BUDGET as B} from '../src/ro-body-fragments.js';
import {roMonsterDeathPose} from '../src/ro-monster-death.js';

test('visual hit fragments distinguish blood, Poring gel, Willow bark and non-flesh enemies without applying a status',()=>{
 const e={id:2,type:'damage',amount:5,target:1,time:1,x:3,z:4},hero={id:1,bonkHero:true},before=JSON.stringify(hero);assert.equal(roBodyFragmentMaterial(hero).kind,'blood');assert.equal(roBodyFragmentMaterial({ragnarokVisual:'poring'}).kind,'gel');assert.equal(roBodyFragmentMaterial({ragnarokVisual:'willow'}).kind,'bark');assert.equal(roBodyFragmentMaterial({ragnarokVisual:'golem'}).kind,'stone');assert.equal(roBodyFragmentMaterial({ragnarokVisual:'skeleton'}).kind,'bone');
 assert.ok(roHitFragments(e,hero,1.2,()=>2).every(p=>p[1]>2));assert.equal(roHitFragments({...e,amount:0},hero,1.2).length,0);assert.equal(roHitFragments({...e,miss:true},hero,1.2).length,0);assert.equal(roHitFragments(e,hero,1.8).length,0);assert.equal(JSON.stringify(hero),before);
});
test('monster voxel disintegration begins after the current death animation and preserves actual model colours',()=>{
 for(const key of ['poring','willow','mistress','orcwarrior']){const u={id:1,bonkEnemy:true,ragnarokVisual:key,alive:false,died:1,x:3,z:4,size:1},pose=roMonsterDeathPose(u,1),end=1+(pose?pose.duration+.2:.65);assert.equal(roDeathFragments(u,end-.01).length,0);const parts=roDeathFragments(u,end+.1,()=>2);assert.ok(parts.length>10&&parts.length<=64,key);assert.ok(new Set(parts.map(p=>p[6])).size>2);assert.ok(parts.every(p=>p[1]>=2));assert.equal(roDeathFragments(u,end+1).length,0);}
});
test('fragments survive a removed corpse snapshot, throttle repeated hit spam and use one bounded draw call',()=>{
 const scene=new T.Scene(),art=createRoBodyFragments({scene}),u={id:1,bonkEnemy:true,ragnarokVisual:'poring',alive:false,died:1,x:0,z:0,size:1},end=1+roMonsterDeathPose(u,1).duration+.2;
 try{art.update({units:[u],effects:[],options:{mode:'bonk'}},1.05);art.update({units:[],effects:[],options:{mode:'bonk'}},end+.1);assert.ok(art.stats().instances>0);assert.equal(art.stats().drawCalls,1);const hero={id:2,bonkHero:true},effects=Array.from({length:100},(_,i)=>({id:i,type:'damage',amount:1,target:2,time:end+.2+i*.00001,x:0,z:0}));art.update({units:[hero],effects,options:{mode:'bonk'}},end+.25);assert.equal(art.stats().hits,1);assert.ok(art.stats().instances<=B.instances);art.update({units:[],effects:[],options:{mode:'bonk'}},10);assert.equal(art.stats().instances,0);art.reset();assert.equal(art.stats().corpses,0);}finally{art.dispose();}assert.equal(scene.children.length,0);
});
