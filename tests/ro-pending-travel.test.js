import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';
import {validateRoAccountProgress} from '../server/ro-accounts.js';
import {createRoEquipment,roMigrateBag,roBagUsage} from '../shared/ragnarok-equipment.js';

function start(world='dominion'){
 const original=new Game(304,{mode:'bonk',bonkWorld:world,bonkLineage:'dragonknight'});original.addPlayer('p','knight');original.command('p',{type:'bkReady'});
 const cp=createRoCheckpoint(original);cp.routeIndex=1;cp.floor=2;cp.stageKey='grove';cp.clearedStages=['prontera'];cp.routeBossDefeated=false;if(world==='dominion')cp.visitedStages=['prontera','payon-forest'];
 const g=new Game(305,{mode:'bonk',bonkWorld:world,bonkLineage:'dragonknight'});g.addPlayer('p','knight');assert.ok(g.command('p',{type:'bkRestore',checkpoint:cp}));return g;
}
function bags(u,count=2){u.roInventory=Array.from({length:48},(_,i)=>createRoEquipment('knife','bag-'+i));u.roEquipment={};u.roUnclaimed=Array.from({length:count},(_,i)=>createRoEquipment('boots','pending-'+i));delete u.roBagVersion;roMigrateBag(u);u.level=150;u.xp=0;u.attributes.dex=99;u.bonkSkillAuto={basic:false,bash:false};}
function defeatMvp(g){const u=g.player('p');u.x=g.bonk.route.bossArena.x+1;u.z=g.bonk.route.bossArena.z;g.units=[u];g.tick(.05);const boss=g.units.find(e=>e.bonkBoss&&e.alive);assert.ok(boss);boss.hp=.01;g.units=[u,boss];g.random=()=>.001;u.bonkWeaponAt={};assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.equal(boss.alive,false);assert.equal(g.bonk.routeBossDefeated,true);assert.ok(g.bonk.clearedStages.includes('payon-forest'));return u;}
const allIds=u=>[...u.roInventory,...u.roUnclaimed].map(i=>i.id).sort();
function cross(g){const u=g.player('p');if(g.bonk.routeVersion===2){const gate=g.bonk.exitGates.find(g=>g.nextKey==='payon-cave');assert.ok(gate.open);u.x=gate.x+gate.direction.x*3;u.z=gate.z+gate.direction.z*3;g.command('p',{type:'bkMove',dx:gate.direction.x,dz:gate.direction.z});}else{assert.ok(g.bonk.exitGate.open);u.x=g.bonk.exitGate.x;u.z=g.bonk.exitGate.z-3;g.command('p',{type:'bkMove',dx:0,dz:-1});}g.tick(.05);assert.equal(g.bonk.route.key,'payon-cave');}

test('MVP death leaves new loot on the ground while owned gear and legacy save storage survive portals and restore',()=>{
 for(const world of ['dominion','midgard']){
  const g=start(world),u=g.player('p');bags(u);g.bonk.pickups=[{id:700,type:'equipment',item:createRoEquipment('coat','manual-coat'),x:20,z:20,age:0}];const expected=allIds(u),pendingCount=u.roUnclaimed.length;defeatMvp(g);assert.equal(roBagUsage(u),30);assert.ok(!u.roInventory.some(i=>i.id==='manual-coat'));assert.ok(g.bonk.pickups.some(p=>p.item?.id==='manual-coat'));assert.equal(u.roUnclaimed.length,pendingCount);
  cross(g);assert.deepEqual(allIds(u),expected);const cp=createRoCheckpoint(g);assert.ok(cp);const progress={version:1,characters:[{id:'saved',name:'Viajante',lineage:u.roLineage,checkpoint:cp,updatedAt:1}],selectedCharacter:'saved'};assert.ok(validateRoProgress(progress));assert.ok(validateRoAccountProgress(progress));
  const restored=new Game(930,{mode:'bonk',bonkWorld:world,bonkLineage:u.roLineage});restored.addPlayer('p','knight');assert.ok(restored.command('p',{type:'bkRestore',checkpoint:cp}));const next=restored.player('p');assert.deepEqual(allIds(next),expected);const pending=next.roUnclaimed[0];assert.equal(restored.command('p',{type:'bkClaim',itemId:pending.id}),false);const drop=next.roInventory[0];assert.ok(restored.command('p',{type:'bkDrop',itemId:drop.id}));assert.ok(restored.command('p',{type:'bkClaim',itemId:pending.id}));assert.equal(restored.command('p',{type:'bkClaim',itemId:pending.id}),false);assert.equal(roBagUsage(next),30);assert.equal(next.roUnclaimed.length,pendingCount-1);assert.ok(createRoCheckpoint(restored));
 }
});

test('Tower floor advancement carries pending equipment without demanding inventory cleanup',()=>{
 const g=new Game(440,{mode:'bonk',bonkActivity:'tower'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');bags(u,2);const expected=allIds(u);g.bonk.towerQueue=[];g.units=[u];g.tick(.05);assert.equal(g.bonk.stage,'cleared');assert.ok(g.command('p',{type:'bkNext'}));assert.equal(g.bonk.floor,2);assert.deepEqual(allIds(u),expected);assert.ok(createRoCheckpoint(g));
});
