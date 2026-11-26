import {roCompanionHome} from '../shared/ro-pet-companions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_SKILLS,roLineage,roSkillTier} from '../shared/ragnarok-jobs.js';
import {tickRoSkillEffects,roSkillModifiers} from '../shared/ro-skill-mechanics.js';
import {createRoCompanionArt,RO_COMPANION_ART_BUDGET,roCompanionParts} from '../src/ro-companion-art.js';
import {Game} from '../shared/simulation.js';
function arena(weapons={ht_falcon:1,ra_wugmastery:1}){const u={id:1,alive:true,bonkHero:true,x:0,z:0,facing:0,bonkBuild:{weapons:{basic:1,...weapons}}},enemy={id:3,alive:true,bonkEnemy:true,x:4,z:0,hp:10000},other={id:2,alive:true,bonkHero:true,x:0,z:5,bonkBuild:{weapons:{ht_falcon:1}}},g={units:[u,other,enemy],bonk:{elapsed:0,stage:'playing'},id:(()=>{let n=10;return()=>n++;})()},hits=[],api={nearby:(p,r)=>g.units.filter(e=>e.bonkEnemy&&e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<=r),segment:()=>true,blocked:p=>p.x>20,damage:(e,n)=>{e.hp-=n;hits.push({id:e.id,n});}};return{g,u,other,enemy,hits,api};}
test('learned training creates one persistent visible companion per species off the hotbar, follows and damages through the host',()=>{
 const{g,u,enemy,hits,api}=arena({ht_falcon:1,ra_wugmastery:1,rk_dragontraining:1,kn_riding:1});u.bonkSkillSlots=['basic'];
 for(let i=0;i<80;i++){g.bonk.elapsed=i*.1;tickRoSkillEffects(g,u,.1,api);}
 assert.equal(g.bonk.roSkillSummons.length,4);assert.deepEqual(new Set(g.bonk.roSkillSummons.map(p=>p.companion)),new Set(['falcon','worg','dragon','peco']));assert.ok(hits.length>4&&enemy.hp<10000);
 const ids=g.bonk.roSkillSummons.map(p=>p.id);g.units=[u];u.x=10;g.bonk.elapsed=3601;for(let i=0;i<40;i++)tickRoSkillEffects(g,u,.1,api);assert.deepEqual(g.bonk.roSkillSummons.map(p=>p.id),ids);assert.ok(g.bonk.roSkillSummons.every(p=>Math.hypot(p.x-u.x,p.z-u.z)<4));assert.deepEqual(roSkillModifiers(u),{});
});
test('companions respect walls, do not attack during offers, despawn for dead owners and remain isolated across online heroes',()=>{
 const{g,u,other,enemy,hits,api}=arena();tickRoSkillEffects(g,u,.1,api);tickRoSkillEffects(g,other,.1,api);assert.equal(g.bonk.roSkillSummons.length,3);const otherId=g.bonk.roSkillSummons.find(p=>p.source===2).id;hits.length=0;
 api.segment=(a,b)=>b.id!==enemy.id;for(let i=0;i<30;i++){g.bonk.elapsed=i;tickRoSkillEffects(g,u,.2,api);}assert.equal(hits.length,0);
 api.segment=()=>true;g.bonk.stage='levelup';g.bonk.elapsed=100;tickRoSkillEffects(g,u,100,api);assert.equal(hits.length,0);
 u.alive=false;tickRoSkillEffects(g,u,.1,api);assert.equal(g.bonk.roSkillSummons.length,1);assert.equal(g.bonk.roSkillSummons[0].id,otherId);delete other.bonkBuild.weapons.ht_falcon;tickRoSkillEffects(g,other,.1,api);assert.equal(g.bonk.roSkillSummons.length,0);
});
test('animal masteries increase only the corresponding companion damage and a large dt never catches up attack ticks',()=>{
 const a=arena({ht_falcon:1,ht_steelcrow:5,ra_wugmastery:1,ra_toothofwug:5});tickRoSkillEffects(a.g,a.u,.1,a.api);const pets=a.g.bonk.roSkillSummons;assert.equal(pets.find(p=>p.companion==='falcon').damage,7*1.3);assert.equal(pets.find(p=>p.companion==='worg').damage,11*1.3);assert.deepEqual(roSkillModifiers(a.u),{});
 for(const p of pets){p.x=3;p.z=0;}a.hits.length=0;a.g.bonk.elapsed=100;tickRoSkillEffects(a.g,a.u,100,a.api);assert.ok(a.hits.length<=2);
});
test('Peco has its real source identity, correct lineage tier and mounting identity and toggle description',()=>{
 assert.equal(RO_SKILLS.kn_riding.sourceId,63);for(const key of ['dragonknight','imperialguard']){assert.ok(roLineage(key).skills.includes('kn_riding'));assert.equal(roSkillTier(key,'kn_riding'),1);}assert.match(RO_SKILLS.kn_riding.description,/monta automaticamente/);assert.equal(RO_SKILLS.rk_dragontraining.kind,'mount');assert.equal(RO_SKILLS.ra_wugmastery.kind,'passive');assert.equal(RO_SKILLS.ra_wugrider.kind,'mount');assert.match(RO_SKILLS.ra_wugrider.description,/monta automaticamente/);
});
test('training reserves its persistent companion within the six-summon budget instead of disappearing behind temporary summons',()=>{const{g,u,api}=arena({ht_falcon:1});g.bonk.roSkillSummons=Array.from({length:6},(_,i)=>({id:50+i,source:u.id,key:'temporary',until:100,x:0,z:0,weapon:{mechanics:{}},at:100,range:10}));tickRoSkillEffects(g,u,.1,api);assert.equal(g.bonk.roSkillSummons.length,6);assert.equal(g.bonk.roSkillSummons.filter(p=>p.persistent).length,1);});
test('renderer reuses detailed RO animals and one bounded batch, culls offscreen, mutates no game state and frees owned resources',()=>{
 const{g,u,api}=arena({ht_falcon:1,ra_wugmastery:1,rk_dragontraining:1,kn_riding:1});tickRoSkillEffects(g,u,.1,api);const scene=new T.Scene(),borrowed=new T.MeshLambertMaterial({vertexColors:true}),art=createRoCompanionArt({scene,material:borrowed}),state={units:g.units,bonk:g.bonk,time:1},before=structuredClone(state),camera=new T.PerspectiveCamera(65,1,.1,100);camera.position.set(0,12,20);camera.lookAt(0,0,0);art.update(state,1,()=>2,camera);assert.equal(art.stats().visible,4);assert.equal(art.stats().drawCalls,1);assert.ok(art.mesh.count<4096);assert.deepEqual(state,before);assert.ok(roCompanionParts('worg').length>100&&roCompanionParts('dragon').length>180);const mesh=art.mesh,geo=mesh.geometry;
 for(let i=0;i<40;i++)state.bonk.roSkillSummons.push({...state.bonk.roSkillSummons[0],id:100+i});art.update(state,2,()=>0,camera);assert.ok(art.stats().visible<=RO_COMPANION_ART_BUDGET.visible);assert.ok(mesh.count<=4096);assert.equal(art.mesh,mesh);assert.equal(mesh.geometry,geo);
 for(const p of state.bonk.roSkillSummons){p.x=1000;p.z=1000;}art.update(state,3,()=>0,camera);assert.equal(mesh.count,0);let frees=0,borrowedFrees=0;geo.addEventListener('dispose',()=>frees++);borrowed.addEventListener('dispose',()=>borrowedFrees++);art.dispose();art.dispose();assert.equal(frees,1);assert.equal(borrowedFrees,0);assert.equal(scene.children.length,0);borrowed.dispose();
});
test('real online game host snapshots include persistent companions with stable identity for both players',()=>{
 const g=new Game(563,{mode:'bonk',bonkLineage:'windhawk',online:true});g.addPlayer('a','ranger');g.addPlayer('b','ranger');g.command('a',{type:'bkReady'});for(const player of ['a','b']){const u=g.player(player);u.bonkBuild.weapons.ht_falcon=1;u.bonkBuild.weapons.ra_wugmastery=1;u.bonkSkillSlots=['basic'];}g.bonk.stage='playing';g.bonk.spawnAt=1e9;g.tick(.1);assert.equal(g.bonk.roSkillSummons.length,4);for(const player of ['a','b']){const snapshot=g.snapshot(player);assert.equal(snapshot.bonk.roSkillSummons.length,4);assert.ok(snapshot.bonk.roSkillSummons.every(p=>p.persistent&&Number.isFinite(p.until)));}assert.equal(new Set(g.bonk.roSkillSummons.map(p=>p.id)).size,4);assert.equal(JSON.parse(JSON.stringify(g.snapshot('a'))).bonk.roSkillSummons.length,4);
});

test('walking companions keep a lateral escort lane instead of standing on the firing line',()=>{
 for(const facing of [0,.6,Math.PI])for(let i=0;i<4;i++){const u={x:4,z:7,facing},p=roCompanionHome(u,i),dx=p.x-u.x,dz=p.z-u.z;assert.ok(Math.abs(dx*Math.cos(facing)-dz*Math.sin(facing))>=2.59);assert.ok(dx*Math.sin(facing)+dz*Math.cos(facing)<0);assert.ok(Math.hypot(dx,dz)<4);}
 const {g,u,api}=arena({ra_wugmastery:1});g.units=[u];u.moving=true;u.bonkMove={dx:0,dz:1};for(let i=0;i<30;i++){u.z+=.2;u.facing=i%2?Math.PI:0;g.bonk.elapsed=i*.1;tickRoSkillEffects(g,u,.1,api);}const pet=g.bonk.roSkillSummons[0];assert.ok(Math.abs(pet.x-u.x)>2);assert.equal(pet.followFacing,0);
});
test('first-person rendering hides the viewed rider mount while retaining another players companion',()=>{
 const {g,u,api}=arena({ra_wugrider:1});tickRoSkillEffects(g,u,.1,api);const pet=g.bonk.roSkillSummons[0];pet.mounted=true;g.bonk.roSkillSummons.push({...pet,id:999,source:2,mounted:false,x:3});const art=createRoCompanionArt({scene:new T.Scene()});try{art.update({bonk:g.bonk,units:g.units},1,()=>0,null,{firstPersonOwner:u.id});assert.equal(art.stats().visible,1);assert.equal(art.stats().culled,1);}finally{art.dispose();}
});

test('Worg returns to its escort lane between bites and follows a walking owner even with enemies ahead',()=>{
 const {g,u,enemy,api}=arena({ra_wugmastery:1});tickRoSkillEffects(g,u,.1,api);const pet=g.bonk.roSkillSummons[0];pet.x=enemy.x-1;pet.z=enemy.z;pet.at=100;pet.attackAt=0;g.bonk.elapsed=1;const before=Math.hypot(pet.x-u.x,pet.z-u.z);tickRoSkillEffects(g,u,.2,api);assert.ok(pet.z<-.1,'returns toward the side and rear while its bite recovers');
 u.moving=true;u.bonkMove={dx:0,dz:1};pet.at=0;for(let i=0;i<20;i++){u.z+=.1;g.bonk.elapsed=2+i*.1;tickRoSkillEffects(g,u,.1,api);}assert.ok(Math.abs(pet.x-u.x)>2);assert.ok(pet.z<u.z);
});
