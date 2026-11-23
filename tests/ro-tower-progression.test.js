import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {planRoTowerFloor} from '../shared/ragnarok-tower.js';
import {roTowerXpReward} from '../shared/ro-tower-progression.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';

const baseProgress=amount=>{let level=1,xp=amount;while(xp>=10+level*7+Math.floor(level*level*.45)){xp-=10+level*7+Math.floor(level*level*.45);level++;}return{level,xp};};
function setup(activity='tower'){
 const g=new Game(71,{mode:'bonk',bonkActivity:activity,bonkLineage:'dragonknight'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.options.bonkDebug=true;
 Object.assign(u,{x:0,z:0,bonkSkillAuto:Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]))});
 g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.towerSpawnAt=Infinity;g.bonk.towerQueue=[{key:'poring',count:1}];g.bonk.objects=[];g.bonk.objectives=[];g.bonk.pickups=[];g.bonk.projectiles=[];g.bonk.map.obstacles=[];return{g,u};
}
function kill(g,u,count,{boss=false}={}){
 for(let i=0;i<count;i++){
  const e={id:g.id(),x:.4,z:0,alive:true,bonkEnemy:true,bonkBoss:boss,ragnarokVisual:'poring',hp:1,maxHp:1,size:.7,collisionRadius:.32,armor:0,damage:0,speed:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity};g.units.push(e);
  g.bonk.projectiles.push({id:g.id(),source:u.id,x:0,z:0,dx:1,dz:0,speed:50,remaining:2,travelled:0,damage:100,element:'fire',radius:.1,pierce:1,hitIds:[]});
 }
 g.tick(.01);
}

test('tower XP bands are bounded and elite/MVP rewards no longer dump adventure-sized XP bursts',()=>{
 for(const [floor,band]of [[1,1],[25,1],[26,2],[50,2],[51,3],[75,3],[76,4],[100,4],[101,4],[999,4],[-2,1]]){
  assert.equal(roTowerXpReward({},floor),band);assert.equal(roTowerXpReward({bonkElite:true},floor),4*band);assert.equal(roTowerXpReward({bonkGuardian:0},floor),8*band);assert.equal(roTowerXpReward({bonkBoss:true},floor),18*band);
 }
 assert.equal(roTowerXpReward({bonkBoss:true,bonkElite:true},5),18);
 assert.equal(roTowerXpReward({},NaN),1);
});

test('source rosters prove one base improvement on floor 1 instead of three, with measured early progression',()=>{
 let oldTotal=0,newTotal=0;
 for(let floor=1;floor<=5;floor++)for(const m of planRoTowerFloor(floor)){oldTotal+=(m.boss?160:3)*m.count;newTotal+=roTowerXpReward({bonkBoss:m.boss},floor)*m.count;}
 const first=planRoTowerFloor(1).reduce((n,m)=>n+roTowerXpReward({bonkBoss:m.boss},1)*m.count,0);
 assert.equal(first,36);assert.deepEqual(baseProgress(first),{level:2,xp:19});assert.deepEqual(baseProgress(108),{level:4,xp:31});
 assert.equal(oldTotal,709);assert.equal(newTotal,201);assert.deepEqual(baseProgress(oldTotal),{level:11,xp:54});assert.deepEqual(baseProgress(newTotal),{level:6,xp:23});
});

test('real kill/pickup pipeline awards 14 tower XP without a base offer, but preserves adventure XP',()=>{
 for(const activity of ['tower','adventure']){const{g,u}=setup(activity);kill(g,u,14);assert.equal(u.kills,14);assert.equal(g.bonk.xpTotal,activity==='tower'?14:42);assert.equal(u.level,activity==='tower'?1:3);assert.equal(u.bonkPendingLevels,activity==='tower'?0:2);assert.equal(u.roJobLevel,activity==='tower'?2:3);assert.equal(g.bonk.stage,activity==='tower'?'playing':'levelup');}
});

test('clearing the first real roster in one burst creates only one pending base improvement',()=>{
 const{g,u}=setup();kill(g,u,36);assert.equal(u.kills,36);assert.equal(u.level,2);assert.equal(u.xp,19);assert.equal(u.bonkPendingLevels,1);assert.equal(g.bonk.stage,'levelup');assert.ok(g.bonk.offer);assert.equal(g.bonk.offer.choices.length,4);
});

test('tower uses ordinary character XP bonuses and the smaller reward also reaches class XP',()=>{
 const{g,u}=setup(),weapon=u.roInventory.find(i=>i.id===u.roEquipment.weapon);weapon.enchants={xp:8};const multiplier=bonkStats(u).xp;assert.ok(multiplier>1);kill(g,u,1);assert.ok(Math.abs(u.xp-multiplier)<1e-8);assert.ok(Math.abs(u.roJobXp-multiplier)<1e-8);
 const next=setup();kill(next.g,next.u,1,{boss:true});assert.equal(next.g.bonk.xpTotal,18);assert.equal(next.u.level,2);assert.equal(next.u.xp,1);assert.equal(next.u.roJobLevel,2);assert.equal(next.u.roJobXp,5);
});

test('moving an adventure character into tower keeps base/class progress and does not mistake new kills for new levels',()=>{
 const{g,u}=setup('adventure');g.options.bonkDebug=false;u.level=9;u.xp=3;u.roJobLevel=3;u.roJobXp=4;const checkpoint=createRoCheckpoint(g);g.bonk.stage='preparation';assert.ok(g.command('p',{type:'bkRestore',checkpoint,activity:'tower',freshActivity:true}));
 assert.equal(u.level,9);assert.equal(u.xp,3);assert.equal(u.roJobLevel,3);assert.equal(u.roJobXp,4);assert.equal(g.bonk.floor,1);assert.equal(g.bonk.activity,'tower');
 g.options.bonkDebug=true;u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));Object.assign(u,{x:0,z:0});g.units=[u];g.bonk.towerQueue=[{key:'poring'}];g.bonk.towerSpawnAt=Infinity;g.bonk.map.obstacles=[];g.bonk.objects=[];kill(g,u,14);
 assert.equal(u.level,9);assert.equal(u.xp,17);assert.equal(u.bonkPendingLevels,0);assert.equal(u.kills,14);assert.equal(g.bonk.stage,'playing');
});
