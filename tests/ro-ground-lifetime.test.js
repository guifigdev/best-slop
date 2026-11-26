import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {roGroundLifetime,roGroundExpired,roGroundFade} from '../shared/ro-ground-lifetime.js';
import {createRoGroundItemArt,roGroundItemFrame,RO_GROUND_ITEM_BUDGET} from '../src/ro-ground-item-art.js';
test('server expires ground gear and consumables without granting loot; stale pickup commands fail',()=>{
 const g=new Game(29,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;u.bonkBuild.weapons={};
 const gear={id:g.id(),type:'equipment',item:createRoEquipment('knife','expiry'),x:u.x,z:u.z,age:179.95},pot={id:g.id(),type:'consumable',key:'potion',x:u.x+70,z:u.z,age:89.95};
 g.bonk.pickups=[gear,pot];g.tick(.1);assert.equal(g.bonk.pickups.length,0);assert.ok(!u.roInventory.some(i=>i.id==='expiry'));
 g.bonk.pickups=[{...gear,used:false,age:180}];assert.equal(g.command('p',{type:'bkPickup',pickup:gear.id}),false);
 assert.equal(roGroundLifetime({type:'xp'}),60);assert.equal(roGroundExpired({type:'equipment',age:179}),false);assert.equal(roGroundFade({type:'equipment',age:180}),0);
 assert.equal(roGroundLifetime({type:'chest'}),Infinity);
});
test('original ground icons use one atlas, bounded world-facing instances and gradual expiry',()=>{
 const parent=new T.Group(),texture=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1),art=createRoGroundItemArt({parent,heightAt:()=>2,loadTexture:()=>texture});
 const pickups=Array.from({length:200},(_,i)=>({id:i,type:'equipment',item:{key:i%2?'knife':'coat'},x:i/10,z:0,age:i%2?170:0}));
 const s={bonk:{pickups},units:[{bonkHero:true,x:0,z:0}]};art.update(s,1);const camera=new T.PerspectiveCamera();camera.position.set(0,10,10);camera.lookAt(0,0,0);art.cull(camera);
 assert.equal(art.stats().sprites,RO_GROUND_ITEM_BUDGET.items);assert.equal(art.stats().drawCalls,1);assert.ok(roGroundItemFrame({type:'consumable',key:'potion'}));
 const mesh=parent.children[0],m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.ok(new T.Vector3().setFromMatrixPosition(m).y>2.5);assert.ok(mesh.geometry.getAttribute('dropAlpha').getX(1)<1);
 s.bonk.pickups=pickups.map(p=>({...p,age:180}));art.update(s,1);assert.equal(art.stats().sprites,0);art.dispose();assert.equal(parent.children.length,0);
});
