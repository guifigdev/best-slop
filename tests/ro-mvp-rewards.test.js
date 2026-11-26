import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {awardRoMvpEquipment,roMvpEquipmentKey} from '../shared/ro-mvp-rewards.js';
import {createRoEquipment,roBagUsage} from '../shared/ragnarok-equipment.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {createRoMvpVictoryArt,roMvpVictoryVoxels} from '../src/ro-mvp-victory-art.js';
function fixture(){const g=new Game(133,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.random=()=>.999;return{g,u};}
test('a genuine MVP guarantees exactly one personal gear prize from its own table, directly into the bag',()=>{
 const {g,u}=fixture(),boss={id:333,bonkBoss:true,ragnarokVisual:'mistress'},before=u.roInventory.length;
 const prize=awardRoMvpEquipment(g,u,boss);assert.ok(prize.item);assert.equal(u.roInventory.length,before+1);assert.ok(u.roInventory.some(i=>i.id===prize.item.id));assert.equal(prize.pending,false);assert.equal(prize.item.key,roMvpEquipmentKey('mistress',()=>.999));assert.equal(awardRoMvpEquipment(g,u,boss),null);assert.equal(u.roInventory.length,before+1);
});
test('a full bag preserves the MVP prize through the existing pending-item save instead of destroying or auto-equipping it',()=>{
 const {g,u}=fixture();for(let i=0;roBagUsage(u)<30;i++)u.roInventory.push(createRoEquipment('knife','full-'+i));const worn=structuredClone(u.roEquipment),prize=awardRoMvpEquipment(g,u,{id:334,bonkBoss:true,ragnarokVisual:'mistress'});assert.equal(prize.pending,true);assert.ok(u.roUnclaimed.some(i=>i.id===prize.item.id));assert.deepEqual(u.roEquipment,worn);const saved=validateRoCheckpoint(createRoCheckpoint(g));assert.ok(saved.hero.roUnclaimed.some(i=>i.id===prize.item.id));
});
test('an actual MVP kill creates a Yggdrasil fruit pickup and the voxel celebration, without awarding twice',()=>{
 const {g,u}=fixture();g.options.bonkDebug=true;u.x=u.z=0;u.bonkBuild.weapons={basic:1};u.bonkSkillSlots=['basic'];u.bonkSkillAuto={basic:false};g.bonk.map.obstacles=[];g.units=[u,{id:999,bonkEnemy:true,bonkBoss:true,ragnarokVisual:'mistress',dungeonSpecies:'mistress',alive:true,team:100,x:0,z:1,hp:1,maxHp:1,collisionRadius:.3,size:1,damage:0,speed:0}];assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.equal(g.units[1].alive,false);assert.ok(g.bonk.pickups.some(p=>p.type==='consumable'&&p.key==='yggberry'));assert.equal(g.effects.filter(e=>e.type==='roMvpVictory').length,1);assert.ok(u.roInventory.some(i=>String(i.id).startsWith('mvp-')));
});
test('MVP cloud and embossed letters are actual 3D voxels in one bounded draw and expire even while game time is paused',()=>{
 const scene=new T.Scene(),art=createRoMvpVictoryArt({scene}),camera=new T.PerspectiveCamera();camera.position.set(0,8,15);camera.lookAt(0,2,0);camera.updateMatrixWorld();const state={options:{mode:'bonk'},time:10,bonk:{map:{seed:1}},units:[{id:1,x:0,z:0}],effects:[{id:1,type:'roMvpVictory',time:10,x:0,z:0,source:1}]};
 assert.ok(roMvpVictoryVoxels().length>150);art.update(state,10,()=>0,camera,10);art.update(state,10,()=>0,camera,10.5);assert.ok(art.stats().voxels>150);assert.equal(art.stats().drawCalls,1);assert.ok(scene.children.every(m=>m.isInstancedMesh&&!m.material.map));art.update(state,10,()=>0,camera,15);assert.equal(art.stats().voxels,0);art.dispose();assert.equal(scene.children.length,0);
});
