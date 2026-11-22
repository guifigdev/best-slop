import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {RO_SKILLS,roBasicAttack,attributeCost,attributePointsForLevel} from '../shared/ragnarok-jobs.js';
import {roSkillManaCost,roSkillStatus,roSkillCastTime} from '../shared/ro-skill-controls.js';
import {roAttributeBudget,roNaturalGrowth,roJobAttributeBonuses} from '../shared/ro-progression.js';
import {roStrongestTarget} from '../shared/ro-attack-shapes.js';
import {createLocalLobby} from '../shared/room-lobby.js';
import {voxelShellGeometry} from '../src/voxel-shell.js';
import {createRoCrowdBatches} from '../src/ro-crowd-batches.js';
import {roSlamParts,roEarthquakeParts} from '../src/ro-slam-art.js';
import {roElementAreaParticles} from '../src/ro-element-area-art.js';
import {debugModeEnabled} from '../src/debug-mode.js';
const setup=(lineage='meister')=>{const g=new Game(81,{mode:'bonk',bonkLineage:lineage});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.map.obstacles=[];g.obstacles=[];g.obstacleRevision++;g.bonk.spawnAt=1e9;u.x=u.z=0;u.mana=1000;u.attributes.dex=99;g.random=()=>.1;u.accuracy=1;return{g,u};};
const enemy=(g,x,z,extra={})=>{const e={id:g.id(),bonkEnemy:true,dungeonSpecies:'rat',alive:true,team:100,x,z,hp:1e5,maxHp:1e5,damage:0,speed:0,size:.8,collisionRadius:.3,bonkNextAttack:1e9,bonkNextSpecial:1e9,...extra};g.units.push(e);return e;};

test('axe damage occurs only inside the fixed impact circle after contact, including its sides',()=>{
 const {g,u}=setup();u.bonkBuild.weapons={basic:1};const front=enemy(g,0,2.8),side=enemy(g,2.2,2.6),back=enemy(g,0,-4.5),far=enemy(g,4.8,0);g.tick(.05);assert.equal(front.hp,1e5);assert.equal(side.hp,1e5);u.bonkSkillAuto={basic:false};for(let i=0;i<8;i++)g.tick(.05);assert.ok(front.hp<1e5);assert.ok(side.hp<1e5);assert.equal(back.hp,1e5);assert.equal(far.hp,1e5);const impact=g.effects.find(e=>e.type==='roAxeImpact');assert.ok(impact&&Math.abs(impact.z-2.6)<.2);assert.ok(roSlamParts(impact,impact.time+.2).some(p=>p[1]>.4));
});
test('debuff automatic aim selects the strongest in range and weakens a small circular group',()=>{
 const {g,u}=setup('cardinal');u.level=60;u.bonkBuild.weapons={ab_vituperatum:1};u.bonkSkillSlots=['ab_vituperatum',null,null,null];const weak=enemy(g,0,3,{maxHp:1000}),strong=enemy(g,0,12,{maxHp:3000,bonkElite:true}),neighbour=enemy(g,1.5,12,{maxHp:900});g.tick(.05);assert.ok(u.roCasting);for(let i=0;i<80;i++)g.tick(.05);assert.ok(strong.roSkillArmorBreak>0);assert.ok(neighbour.roSkillArmorBreak>0);assert.equal(weak.roSkillArmorBreak,undefined);assert.equal(g.bonk.projectiles.length,0);assert.ok(g.effects.some(e=>e.type==='abilityPulse'&&Math.abs(e.z-12)<.2));assert.ok(roStrongestTarget({bonkBoss:true},{bonkElite:true,maxHp:1e8},u)<0);
});
test('nonexplosive skill projectiles traverse a formation while basic shots stop',()=>{
 for(const basic of [false,true]){const {g,u}=setup('windhawk');u.bonkBuild.weapons=basic?{basic:1}:{doublestrafe:1};u.bonkSkillSlots=[basic?'basic':'doublestrafe',null,null,null];const targets=[4,6,8,10,12].map(z=>enemy(g,0,z));g.tick(.05);u.bonkSkillAuto={[basic?'basic':'doublestrafe']:false};for(let i=0;i<12;i++)g.tick(.05);const hit=targets.filter(e=>e.hp<1e5).length;assert.equal(hit,basic?1:5);}
});
test('Aegis Inferi is a surrounding earth impact with its own radial earthquake',()=>{
 const {g,u}=setup('imperialguard');u.bonkBuild.weapons={lg_earthdrive:1};u.bonkSkillSlots=['lg_earthdrive',null,null,null];const a=enemy(g,3,0),b=enemy(g,-3,0);g.tick(.05);assert.ok(u.roCasting);for(let i=0;i<25;i++)g.tick(.05);assert.ok(a.hp<1e5&&b.hp<1e5);const event=g.effects.find(e=>e.type==='roEarthquake');assert.ok(event);const parts=roEarthquakeParts(event,event.time+.35);assert.ok(parts.length>=60);assert.ok(parts.some(p=>p[0]<event.x)&&parts.some(p=>p[0]>event.x));assert.ok(parts.some(p=>p[1]>.4));
});
test('initial chest guarantees a real weapon, altars are free even for old map costs, full potion pouches never destroy drops',()=>{
 const {g,u}=setup();const start=g.bonk.objects.find(o=>o.id==='starting-chest');u.x=start.x;u.z=start.z;assert.ok(g.command('p',{type:'bkInteract',object:start.id}));assert.equal(g.bonk.lastLoot.equipment[0].slot,'weapon');
 const altar=g.bonk.objects.find(o=>o.type==='shrine');u.x=altar.x;u.z=altar.z;altar.cost=500;u.gold=0;assert.ok(g.command('p',{type:'bkInteract',object:altar.id}));assert.ok(g.bonk.offer);g.bonk.offer=null;g.bonk.stage='playing';u.bonkBuild.weapons={};u.consumables=[{key:'potion',charges:3},{key:'manapot',charges:3}];const drop={id:g.id(),type:'consumable',key:'potion',x:u.x,z:u.z,age:0};g.bonk.pickups=[drop];g.tick(.05);assert.ok(g.bonk.pickups.includes(drop));assert.equal(g.snapshotBonk().nearbyConsumable.canCarry,false);assert.equal(g.command('p',{type:'bkCollect',pickup:drop.id}),false);u.consumables[0].charges=2;assert.ok(g.command('p',{type:'bkCollect',pickup:drop.id}));assert.equal(u.consumables[0].charges,3);assert.equal(g.bonk.pickups.length,0);
});
test('Renewal status point budget, costs, job bonuses and natural class gains are numerical rather than a flat six HP per level',()=>{
 assert.equal(roAttributeBudget(1),48);assert.equal(roAttributeBudget(99),1273);assert.equal(attributePointsForLevel(2),3);assert.equal(attributePointsForLevel(6),4);assert.equal(attributeCost(1),2);assert.equal(attributeCost(10),2);assert.equal(attributeCost(11),3);
 assert.equal(roJobAttributeBonuses('swordsman',2).str,1);const attrs={str:5,agi:5,vit:5,int:5,dex:5,luk:5},a=roNaturalGrowth({level:1,roTier:0,roLineage:'archmage'},['mage'],attrs),b=roNaturalGrowth({level:2,roTier:0,roLineage:'archmage'},['mage'],attrs);assert.equal(b.baseHp-a.baseHp,6);assert.ok(b.baseSp>a.baseSp);assert.equal(b.hit-a.hit,1);assert.equal(b.flee-a.flee,1);
 const {u}=setup('archmage');assert.ok(roBasicAttack(u).cooldown>=1.6);assert.equal(roBasicAttack(u).radius,undefined);const before=bonkStats(u).haste;u.attributes.agi+=20;assert.ok(bonkStats(u).haste>before);
});
test('real SP costs drain mana, block unaffordable casts and leave the basic attack free',()=>{
 assert.equal(roSkillManaCost(RO_SKILLS.fireball),25);assert.equal(roSkillManaCost(RO_SKILLS.bash,1),8);assert.equal(roSkillManaCost(RO_SKILLS.bash,6),15);assert.equal(roSkillManaCost({key:'basic'}),0);const {g,u}=setup('archmage');u.bonkBuild.weapons={fireball:1};u.bonkSkillSlots=['fireball',null,null,null];u.mana=30;enemy(g,0,8);g.tick(.05);assert.ok(u.roCasting);for(let i=0;i<17;i++)g.tick(.05);assert.ok(u.mana<8);u.bonkWeaponAt.fireball=0;assert.equal(roSkillStatus(g,u,'fireball',bonkStats(u)).reasonCode,'mana');
});
test('shared enemy geometry drops buried faces and batches hundreds of bodies without rebuilding geometry',()=>{
 const geo=voxelShellGeometry([[0,0,0,1,1,1,0xffffff],[1,0,0,1,1,1,0xffffff],[0,0,0,.4,.4,.4,0xff0000]]);assert.equal(geo.userData.shellTriangles,20);assert.ok(geo.userData.sourceTriangles>geo.userData.shellTriangles);const scene=new T.Scene(),material=new T.MeshLambertMaterial(),batch=createRoCrowdBatches(scene),actors=Array.from({length:280},(_,i)=>{const root=new T.Group(),body=new T.Group();body.add(new T.Mesh(geo,material));root.add(body);root.position.x=i;return{root,body,legs:[]};});batch.update(actors);assert.equal(batch.stats().drawCalls,1);assert.equal(batch.stats().instances,280);batch.restore();assert.ok(actors.every(a=>a.body.children[0].visible));batch.update([]);assert.equal(batch.stats().drawCalls,0);
});
test('local waiting room selects the game before the character and does not silently launch Thor',()=>{
 const room=createLocalLobby({seed:55});assert.equal(room.started,false);assert.equal(room.snapshot().onlineRoom.players[0].heroChosen,false);assert.throws(()=>room.command({type:'roomStart'}),/personagem/);room.command({type:'roomSettings',settings:{options:{mode:'castlefight',laneCount:1}}});assert.equal(room.game.options.mode,'castlefight');room.command({type:'roomChooseHero',hero:'orc'});room.command({type:'roomBots',count:1});assert.equal(room.game.player('local').castleRace,'orc');assert.ok(room.command({type:'roomStart'}));assert.equal(room.game.options.laneCount,1);assert.equal(room.game.options.mode,'castlefight');
});
test('DEBUG URL opts in case-insensitively and elemental areas stay inside a fixed single-draw particle budget',()=>{
 for(const q of ['?DEBUG=TRUE','?debug=true','?Debug=True&x=1'])assert.equal(debugModeEnabled(q),true);for(const q of ['','?DEBUG=false','?debug=1'])assert.equal(debugModeEnabled(q),false);const s={options:{mode:'bonk'},bonk:{elapsed:1,roSkillZones:Array.from({length:40},(_,i)=>({id:i,x:0,z:0,until:10,radius:5,weapon:{element:'fire'}}))},effects:[]};const particles=roElementAreaParticles(s,1,()=>3);assert.ok(particles.length<=192);assert.ok(particles.every(p=>p.kind===1&&p.y>3));
});

test('DEX and INT shorten only variable casting, no damage or SP is applied until release and a dash interrupts cleanly',()=>{
 const skill=RO_SKILLS.fireball,base=roSkillCastTime(skill,1,{attributes:{dex:1,int:1}}),dex=roSkillCastTime(skill,1,{attributes:{dex:90,int:1}}),int=roSkillCastTime(skill,1,{attributes:{dex:1,int:90}});assert.ok(dex.total<base.total&&int.total<base.total);assert.equal(base.fixed,.2);assert.equal(dex.fixed,.2);assert.equal(roSkillCastTime({key:'basic'},1,{}).total,0);
 const {g,u}=setup('archmage');u.bonkBuild.weapons={fireball:1};u.bonkSkillSlots=['fireball',null,null,null];const e=enemy(g,0,7);u.mana=30;g.tick(.05);assert.ok(u.roCasting);assert.equal(e.hp,1e5);assert.equal(g.bonk.projectiles.length,0);assert.ok(u.mana>=30);assert.ok(g.command('p',{type:'bkDash'}));assert.equal(u.roCasting,undefined);assert.ok(u.mana>=30);
});
