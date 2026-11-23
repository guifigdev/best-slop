import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoLevelUpArt,roLevelUpPose,roLevelUpVisualHandles,RO_LEVELUP_ART_BUDGET} from '../src/ro-levelup-art.js';
import {Game} from '../shared/simulation.js';

const event=(id=1,source=7,time=10)=>({id,source,time,type:'levelup',bonk:true,x:0,z:0});
const state=(events=[event()])=>({time:10,options:{mode:'bonk'},bonk:{map:{seed:1},offer:{choices:[]},stage:'levelup'},effects:events,units:[{id:7,x:0,z:0,size:1}]});
test('the RO angel unfolds recognizable feathers and halo, fades, and preserves non-RO feedback',()=>{
 assert.equal(roLevelUpVisualHandles(event()),true);assert.equal(roLevelUpVisualHandles({type:'levelup'}),false);assert.equal(roLevelUpVisualHandles({type:'jobLevelup',bonk:true}),false);
 const first=roLevelUpPose(.1),open=roLevelUpPose(.5),last=roLevelUpPose(1.5);assert.ok(open.spread>first.spread*1.5);assert.ok(first.flash>open.flash);assert.ok(last.lift>open.lift);assert.ok(last.alpha<open.alpha);assert.equal(roLevelUpPose(1.6).visible,false);
});
test('cosmetic wall time animates and expires the angel while the real improvement offer freezes simulation time',()=>{
 const scene=new T.Scene(),art=createRoLevelUpArt({scene}),s=state(),before=structuredClone(s);art.update(s,10,()=>0,null,100);art.update(s,10,()=>0,null,100.5);const geometry=art.feathers.geometry,mesh=art.feathers;assert.equal(art.stats().effects,1);assert.equal(art.stats().drawCalls,2);assert.equal(art.feathers.count,42);assert.equal(art.glows.count,18);const matrix=new T.Matrix4();art.feathers.getMatrixAt(0,matrix);const first=matrix.elements.slice();
 art.update(s,10,()=>0,null,101.1);art.feathers.getMatrixAt(0,matrix);assert.notDeepEqual(matrix.elements,first);assert.equal(art.feathers,mesh);assert.equal(art.feathers.geometry,geometry);assert.deepEqual(s,before);art.update(s,10,()=>0,null,101.7);assert.equal(art.stats().effects,0);art.update(s,10,()=>0,null,105);assert.equal(art.stats().drawCalls,0);art.dispose();
});
test('late snapshots keep their existing age and cannot replay expired events; class/base duplicates coalesce',()=>{
 const scene=new T.Scene(),art=createRoLevelUpArt({scene}),s=state([event(1),{...event(2),job:'Bruxo'}]);art.update(s,10,()=>0,null,100);assert.equal(art.stats().effects,1);art.update(s,10,()=>0,null,102);assert.equal(art.stats().effects,0);
 const late=state([event(3,7,8)]);art.update(late,10,()=>0,null,104);assert.equal(art.stats().effects,0);late.effects=[event(4,7,9)];art.update(late,10,()=>0,null,105);assert.equal(art.stats().effects,1);art.update(late,10,()=>0,null,105.7);assert.equal(art.stats().effects,0);art.dispose();
});
test('at most eight effects share two bounded reused draws, camera culling and disposal free resources',()=>{
 const scene=new T.Scene(),art=createRoLevelUpArt({scene}),s=state(Array.from({length:30},(_,i)=>event(i,i)));art.update(s,10,()=>0,null,100);art.update(s,10,()=>0,null,100.4);assert.equal(art.stats().effects,8);assert.ok(art.feathers.count<=8*RO_LEVELUP_ART_BUDGET.feathersPerEffect);assert.ok(art.glows.count<=8*RO_LEVELUP_ART_BUDGET.glowsPerEffect);assert.equal(art.stats().lights,0);assert.equal(scene.children.length,2);
 const camera=new T.PerspectiveCamera(50,1,.1,50);camera.position.set(1000,5,1000);camera.lookAt(1000,0,990);art.update(s,10,()=>0,camera,100.6);assert.equal(art.stats().visible,0);assert.equal(art.feathers.count,0);assert.equal(art.glows.count,0);
 let disposed=0;for(const owned of [art.feathers.geometry,art.feathers.material,art.glows.geometry,art.glows.material])owned.addEventListener('dispose',()=>disposed++);art.dispose();art.dispose();assert.equal(disposed,4);assert.equal(scene.children.length,0);
});
test('world transitions and resets clear wings without replaying events carried in a paused snapshot',()=>{
 const scene=new T.Scene(),art=createRoLevelUpArt({scene}),s=state();art.update(s,10,()=>0,null,100);art.update(s,10,()=>0,null,100.4);assert.equal(art.stats().effects,1);s.bonk.map.seed=2;art.update(s,10,()=>0,null,100.5);assert.equal(art.stats().effects,0);s.effects.push(event(2,7,10));art.update(s,10,()=>0,null,100.6);assert.equal(art.stats().effects,1);art.reset();art.update(s,10,()=>0,null,100.7);assert.equal(art.stats().effects,0);art.dispose();
});
test('a real XP pickup emits one base-level angel and cosmetic expiration leaves the paused game unchanged',()=>{
 const g=new Game(738,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.ambientSeeded=true;u.bonkBuild.weapons={};g.effects=[];g.bonk.pickups.push({id:g.id(),type:'xp',value:100,age:0,x:u.x,z:u.z});g.tick(.05);const events=g.effects.filter(e=>e.type==='levelup'&&e.baseLevel);assert.equal(events.length,1);assert.equal(events[0].baseLevel,u.level);assert.ok(g.bonk.offer);const snapshot=g.snapshotFor('p'),before=JSON.stringify(snapshot),art=createRoLevelUpArt({scene:new T.Scene()});art.update(snapshot,g.time,()=>0,null,0);art.update(snapshot,g.time,()=>0,null,.5);assert.equal(art.stats().visible,1);art.update(snapshot,g.time,()=>0,null,2);assert.equal(art.stats().effects,0);assert.equal(JSON.stringify(snapshot),before);art.dispose();
});
