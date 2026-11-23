import {generateBonkLevel} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';
import {bonkStats} from '../shared/bonk.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {roEnvironmentHazards} from '../shared/ro-environment-hazards.js';

function setup(online=false){const g=new Game(95,{mode:'bonk',bonkWorld:'dominion',online});g.addPlayer('p','knight');if(online)g.addPlayer('q','mage');g.command('p',{type:'bkReady'});g.units=g.units.filter(u=>u.bonkHero);g.bonk.spawnAt=Infinity;g.bonk.bossSpawned=true;g.bonk.objectives=[];g.bonk.pickups=[];for(const u of g.units)u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));const zone=roEnvironmentHazards(g.bonk.map)[0],u=g.player('p');assert.ok(zone);Object.assign(u,{x:zone.x,z:zone.z});return{g,u,zone};}
const step=(g,n)=>{for(let i=0;i<n;i++)g.tick(.05);};

test('real survivor ticks show a warning, deal bounded environmental damage and clear status after leaving',()=>{
 const{g,u}=setup(),hp=u.hp;step(g,20);let snapshot=g.snapshotBonk('p');assert.equal(snapshot.environmentZones.length,3);assert.equal(snapshot.environmentStatus.phase,'warning');assert.equal(u.hp,hp,'no damage before the warning ends');step(g,12);snapshot=g.snapshotBonk('p');assert.equal(snapshot.environmentStatus.phase,'active');assert.ok(u.hp<hp&&u.hp>hp*.9);Object.assign(u,g.bonk.map.spawn);const before=u.hp;step(g,25);assert.equal(g.snapshotBonk('p').environmentStatus,null);assert.ok(u.hp>=before,'leaving stops environmental damage');
});

test('online hazards affect the exposed player and their own snapshot, while level choices freeze exposure',()=>{
 const{g,u}=setup(true),ally=g.player('q');Object.assign(ally,g.bonk.map.spawn);const allyHp=ally.hp;step(g,32);assert.ok(u.hp<u.maxHp);assert.equal(ally.hp,allyHp);assert.equal(g.snapshotBonk('p').environmentStatus.phase,'active');assert.equal(g.snapshotBonk('q').environmentStatus,null);const exposure=u.roEnvironmentExposure.exposure,hp=u.hp;u.bonkOffer={id:'personal-choice',choices:[]};step(g,25);assert.equal(u.roEnvironmentExposure.exposure,exposure);assert.ok(u.hp>=hp,'no hazard damage during a personal choice');
});

test('fatal exposure follows the ordinary defeat flow instead of moving or attacking after death',()=>{
 const{g,u}=setup();u.hp=1;u.attributes.vit=1;u.bonkInvulnerableUntil=0;step(g,26);assert.equal(u.alive,false);assert.equal(g.bonk.stage,'finished');assert.equal(g.phase,'defeat');assert.equal(u.roEnvironmentExposure,undefined);assert.deepEqual(u.bonkMove,{dx:0,dz:0});
});


test('deep snow in the real simulation warns for three seconds, then chills, damages and slows movement',()=>{
 const{g,u}=setup(),region=roWorldRegion('ice-cavern'),map=generateBonkLevel(29,region.scene,region.habitat,region),zone=roEnvironmentHazards(map)[0];assert.ok(zone);g.bonk.map=map;g.bonk.routeVersion=0;g.bonk.bossUnlocked=false;Object.assign(u,{x:zone.x,z:zone.z});const hp=u.hp;step(g,50);assert.equal(g.snapshotBonk('p').environmentStatus.phase,'warning');assert.equal(u.hp,hp);step(g,15);assert.equal(g.snapshotBonk('p').environmentStatus.phase,'active');assert.ok(u.hp<hp);assert.ok(u.frostUntil>g.time);const from=u.x,speed=bonkStats(u).speed;g.command('p',{type:'bkMove',dx:1,dz:0});step(g,4);assert.ok(u.x-from>0&&u.x-from<speed*.2*.92,'cold scales actual movement, not only a HUD label');Object.assign(u,map.spawn);g.command('p',{type:'bkMove',dx:0,dz:0});step(g,1);assert.equal(g.snapshotBonk('p').environmentStatus,null);
});
