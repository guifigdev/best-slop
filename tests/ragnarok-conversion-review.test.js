import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {BonkMethods} from '../shared/bonk.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {roBasicAttack,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {saveRoCharacter,roAccountSelection} from '../src/ragnarok-account-ui.js';
Object.assign(Game.prototype,BonkMethods);
function setup(options={}){const g=new Game(492,{mode:'bonk',bonkLineage:'dragonknight',...options});assert.ok(g.addPlayer('review','knight'));return{g,u:g.player('review')};}
function isolate(g){g.units=g.units.filter(u=>u.bonkHero);g.bonk.objectives=[];g.bonk.spawnAt=1e9;g.random=()=>0;}
function burningBoss(g,u,extra={}){const e={id:g.id(),bonkEnemy:true,bonkBoss:true,dungeonSpecies:'ifrit',ragnarokVisual:'ifrit',ragnarokMvp:'ifrit',alive:true,team:100,x:u.x+12,z:u.z,hp:1,maxHp:1,damage:0,speed:0,size:2,collisionRadius:.8,bonkNextAttack:1e9,bonkNextSpecial:1e9,bonkBurnUntil:1000,bonkBurnDamage:100,bonkDotAt:0,interval:1.3,...extra};g.units.push(e);return e;}

test('New regions reset combat cooldowns when their elapsed clock restarts',()=>{
 const{g,u}=setup();g.command('review',{type:'bkReady'});isolate(g);g.bonk.stage='cleared';g.bonk.clearedStages=['grove'];g.bonk.elapsed=180;u.bonkWeaponAt={basic:180.5,bash:181};u.bonkDashReady=183;u.bonkDashUntil=179;u.bonkDashVector={dx:1,dz:0};
 assert.ok(g.command('review',{type:'bkNext',stageKey:'forge'}));assert.equal(g.bonk.elapsed,0);
 assert.ok(Object.values(u.bonkWeaponAt).every(at=>at<=1),'A previous region must not disable automatic attacks for several minutes');
 assert.ok((u.bonkDashReady||0)<=1,'A new region cannot inherit the old elapsed clock for dash cooldown');
 assert.ok((u.bonkDashUntil||0)<=0,'An old dash window cannot become active again after the clock resets');
});
test('A distant final MVP cannot strand its equipment when the floor closes',()=>{
 const{g,u}=setup();g.command('review',{type:'bkReady'});isolate(g);const before=u.roInventory.length;burningBoss(g,u);g.tick(.05);
 assert.equal(g.bonk.stage,'cleared');
 assert.ok(u.roInventory.length>before||(u.roUnclaimed?.length||0)>0,'MVP equipment must enter the bag or an explicit claim queue before movement is disabled');
 assert.equal(g.bonk.pickups.filter(p=>p.type==='equipment').length,0,'Closed floors cannot leave unreachable gear that the next stage deletes');
});
test('Saving during a level-up offer preserves every unchosen skill upgrade',()=>{
 const{g,u}=setup();g.command('review',{type:'bkReady'});isolate(g);g.bonk.pickups.push({id:g.id(),type:'xp',x:u.x,z:u.z,value:100,age:0});g.tick(.05);assert.equal(g.bonk.stage,'levelup');assert.ok(u.bonkPendingLevels>0);
 const pending=u.bonkPendingLevels,checkpoint=createRoCheckpoint(g);assert.ok(checkpoint);const next=setup();assert.ok(next.g.command('review',{type:'bkRestore',checkpoint,activity:'adventure',freshActivity:false}));
 assert.equal(next.u.bonkPendingLevels,pending,'A save cannot consume the XP but discard the associated weapon choices');assert.equal(next.g.bonk.stage,'levelup');
});
test('The tower does not clear after the first Beelzebub form while its true form is queued',()=>{
 const{g,u}=setup({bonkActivity:'tower'});g.command('review',{type:'bkReady'});isolate(g);g.bonk.floor=95;g.bonk.clearedStages=Array(94).fill('grove');g.bonk.towerQueue=[];g.bonk.towerSpawnAt=1e9;g.bonk.floorTotal=1;g.bonk.floorDefeated=0;
 burningBoss(g,u,{dungeonSpecies:'tower_1873',ragnarokVisual:'tower_1873',roSourceId:1873,roPhaseKey:'tower_1874'});g.tick(.05);
 assert.equal(g.bonk.stage,'playing');assert.ok(g.bonk.towerQueue.some(e=>e.key==='tower_1874'&&e.sourceId===1874));assert.equal(g.bonk.clearedStages.length,94);
});
test('Replacing a class weapon changes gear bonuses while preserving the characteristic class attack',()=>{
 const{g,u}=setup();const before=roBasicAttack(u),bow=createRoEquipment('bow','review-bow');u.roInventory.push(bow);assert.ok(g.command('review',{type:'bkEquip',itemId:bow.id,slot:'weapon'}));assert.deepEqual(roBasicAttack(u),before);
});
test('Tower transitions retain the developed job, while adventure regions unlock the next class',()=>{
 const{g,u}=setup({bonkActivity:'tower'});g.command('review',{type:'bkReady'});advanceRoJob(u,2);g.bonk.clearedStages=Array(24).fill('grove');g.bonk.stage='cleared';assert.ok(g.command('review',{type:'bkNext'}));assert.equal(u.roTier,2);
 g.bonk.activity='adventure';g.bonk.clearedStages=['grove','payon','crypt'];g.bonk.stage='cleared';assert.ok(g.command('review',{type:'bkNext',stageKey:'forge'}));assert.equal(u.roTier,3);
});
test('Separate activity entrances retain their floor positions and share the latest developed character',()=>{
 const{g,u}=setup();g.command('review',{type:'bkReady'});g.bonk.clearedStages=['grove'];g.bonk.map.stageKey='payon';u.level=8;const adventure=createRoCheckpoint(g);let progress=saveRoCharacter(null,{id:'both-activities',name:'Review',lineage:u.roLineage,checkpoint:adventure,updatedAt:1});
 const tower=structuredClone(adventure);tower.activity='tower';tower.floor=40;tower.clearedStages=Array(39).fill('grove');tower.hero.level=12;tower.hero.gold=1234;progress=saveRoCharacter(progress,{id:'both-activities',name:'Review',lineage:u.roLineage,checkpoint:tower,updatedAt:2});assert.ok(progress);
 const a=roAccountSelection({progress},{activity:'adventure',characterId:'both-activities',resume:true}),b=roAccountSelection({progress},{activity:'tower',characterId:'both-activities',resume:true});assert.equal(a.checkpoint.floor,2);assert.equal(b.checkpoint.floor,40);assert.equal(a.checkpoint.hero.level,12);assert.equal(a.checkpoint.hero.gold,1234);assert.equal(b.checkpoint.hero.level,12);
});
