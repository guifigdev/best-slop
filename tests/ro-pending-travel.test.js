import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';
import {validateRoAccountProgress} from '../server/ro-accounts.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';

function start(world='dominion'){
 const original=new Game(304,{mode:'bonk',bonkWorld:world,bonkLineage:'dragonknight'});original.addPlayer('p','knight');original.command('p',{type:'bkReady'});
 const cp=createRoCheckpoint(original);cp.routeIndex=1;cp.floor=2;cp.stageKey='grove';cp.clearedStages=['prontera'];cp.routeBossDefeated=false;if(world==='dominion')cp.visitedStages=['prontera','payon-forest'];
 const g=new Game(305,{mode:'bonk',bonkWorld:world,bonkLineage:'dragonknight'});g.addPlayer('p','knight');assert.ok(g.command('p',{type:'bkRestore',checkpoint:cp}));return g;
}
function bags(u,count=2){u.roInventory=Array.from({length:48},(_,i)=>createRoEquipment('knife','bag-'+i));u.roEquipment={};u.roUnclaimed=Array.from({length:count},(_,i)=>createRoEquipment('boots','pending-'+i));u.level=150;u.xp=0;u.attributes.dex=99;u.bonkSkillAuto={basic:false,bash:false};}
function defeatMvp(g){const u=g.player('p');u.x=g.bonk.route.bossArena.x+1;u.z=g.bonk.route.bossArena.z;g.units=[u];g.tick(.05);const boss=g.units.find(e=>e.bonkBoss&&e.alive);assert.ok(boss);boss.hp=.01;g.units=[u,boss];g.random=()=>.001;u.bonkWeaponAt={};assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.equal(boss.alive,false);assert.equal(g.bonk.routeBossDefeated,true);assert.ok(g.bonk.clearedStages.includes('payon-forest'));return u;}
const allIds=u=>[...u.roInventory,...u.roUnclaimed].map(i=>i.id).sort();
function cross(g){const u=g.player('p');if(g.bonk.routeVersion===2){const gate=g.bonk.exitGates.find(g=>g.nextKey==='payon-cave');assert.ok(gate.open);u.x=gate.x+gate.direction.x*3;u.z=gate.z+gate.direction.z*3;g.command('p',{type:'bkMove',dx:gate.direction.x,dz:gate.direction.z});}else{assert.ok(g.bonk.exitGate.open);u.x=g.bonk.exitGate.x;u.z=g.bonk.exitGate.z-3;g.command('p',{type:'bkMove',dx:0,dz:-1});}g.tick(.05);assert.equal(g.bonk.route.key,'payon-cave');}

test('a real Payon MVP death and portal crossing preserve full bags plus pending gear through checkpoint/account/restore and claim exactly once',()=>{
 for(const world of ['dominion','midgard']){
  const g=start(world),u=g.player('p');bags(u);g.bonk.pickups=[{id:700,type:'equipment',item:createRoEquipment('coat','salvaged-coat'),x:20,z:20,age:0}];defeatMvp(g);assert.equal(u.roInventory.length,48);assert.ok(u.roUnclaimed.some(i=>i.id==='salvaged-coat'));const expected=allIds(u),pendingCount=u.roUnclaimed.length;assert.ok(pendingCount>=3);assert.equal(new Set(expected).size,expected.length);
  cross(g);assert.deepEqual(allIds(u),expected);assert.equal(u.roUnclaimed.length,pendingCount);const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.hero.roUnclaimed.length,pendingCount);const progress={version:1,characters:[{id:'saved',name:'Viajante',lineage:u.roLineage,checkpoint:cp,updatedAt:1}],selectedCharacter:'saved'};assert.ok(validateRoProgress(progress));assert.ok(validateRoAccountProgress(progress));
  const restored=new Game(930,{mode:'bonk',bonkWorld:world,bonkLineage:u.roLineage});restored.addPlayer('p','knight');assert.ok(restored.command('p',{type:'bkRestore',checkpoint:cp}));const next=restored.player('p');assert.deepEqual(allIds(next),expected);assert.equal(next.roInventory.length,48);const pending=next.roUnclaimed[0];assert.equal(restored.command('p',{type:'bkClaim',itemId:pending.id}),false);const removed=next.roInventory.pop();assert.ok(restored.command('p',{type:'bkClaim',itemId:pending.id}));assert.equal(restored.command('p',{type:'bkClaim',itemId:pending.id}),false);assert.equal(next.roUnclaimed.length,pendingCount-1);assert.equal(next.roInventory.filter(i=>i.id===pending.id).length,1);assert.deepEqual(allIds(next),expected.filter(id=>id!==removed.id));assert.ok(createRoCheckpoint(restored));
 }
});

test('MVP salvage never exceeds the existing 48/128 limits and full pending storage still permits travel',()=>{
 const g=start(),u=g.player('p');bags(u,128);const expected=allIds(u);g.bonk.pickups=[{id:701,type:'equipment',item:createRoEquipment('coat','overflow-on-ground'),x:20,z:20,age:0}];defeatMvp(g);assert.equal(u.roUnclaimed.length,128);assert.deepEqual(allIds(u),expected);assert.ok(g.bonk.pickups.some(p=>p.item?.id==='overflow-on-ground'),'unowned overflow remains on the floor rather than corrupting saved storage');assert.ok(createRoCheckpoint(g));cross(g);assert.deepEqual(allIds(u),expected);assert.equal(u.roUnclaimed.length,128);assert.ok(createRoCheckpoint(g));
});

test('Tower floor advancement carries pending equipment without demanding inventory cleanup',()=>{
 const g=new Game(440,{mode:'bonk',bonkActivity:'tower'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');bags(u,2);const expected=allIds(u);g.bonk.towerQueue=[];g.units=[u];g.tick(.05);assert.equal(g.bonk.stage,'cleared');assert.ok(g.command('p',{type:'bkNext'}));assert.equal(g.bonk.floor,2);assert.deepEqual(allIds(u),expected);assert.ok(createRoCheckpoint(g));
});
