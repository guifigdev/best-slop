import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {castRoUtilitySkill,tickRoSkillEffects,resetRoSkillEffects} from '../shared/ro-skill-mechanics.js';
import {roMeteorStones} from '../shared/ro-meteor.js';
import {createRoMeteorArt,roMeteorPose,RO_METEOR_BUDGET as B} from '../src/ro-meteor-art.js';
import {roFireImpacts} from '../src/ro-fire-impact-art.js';
import {Game} from '../shared/simulation.js';
import {advanceRoJob} from '../shared/ragnarok-jobs.js';

const fall=(id=1,extra={})=>({id,type:'roMeteorFall',skillKey:'wz_meteor',source:1,showerId:'storm-'+id,x:0,z:0,radius:4,time:0,duration:.9,...extra});
test('meteor stones descend from above the trees to the exact terrain, with varied positions that agree across clients',()=>{
 const e=fall(),ground=(x,z)=>3+x*.1+z*.05,before=structuredClone(e),early=roMeteorPose(e,0,ground),late=roMeteorPose(e,.899,ground);
 assert.equal(early.length,3);assert.ok(early.every(p=>p.y>24&&p.size>=.9));
 for(const [i,p]of late.entries()){const target=roMeteorStones(e)[i];assert.ok(Math.abs(p.x-target.x)<.02);assert.ok(Math.abs(p.z-target.z)<.02);assert.ok(p.y<ground(target.x,target.z)+p.size+.1);assert.ok(p.y>=ground(target.x,target.z));assert.ok(early[i].y>p.y+20);assert.ok(Math.hypot(target.x-e.x,target.z-e.z)<e.radius);}
 assert.deepEqual(roMeteorStones(structuredClone(e)),roMeteorStones(e));assert.notDeepEqual(roMeteorStones(fall(2)),roMeteorStones(e));assert.deepEqual(e,before);assert.deepEqual(roMeteorPose(e,-1),[]);assert.deepEqual(roMeteorPose(e,.9),[]);
});

test('Meteor Storm spends its existing damage budget only as the five showers land, with no catch-up burst or pre-cast flames',()=>{
 const weapon=RO_SKILLS.wz_meteor,unit={id:1,x:0,z:0,alive:true,bonkBuild:{weapons:{wz_meteor:1}}},enemy={id:2,x:3,z:0,bonkEnemy:true,alive:true},blocked={id:3,x:3,z:1,bonkEnemy:true,alive:true},game={time:0,bonk:{elapsed:0,stage:'playing'},units:[unit,enemy,blocked],id:()=>9},events=[],hits=[];
 const api={segment:(a,b)=>b.id!==3,damage:(e,n)=>hits.push([e.id,n]),effect:(type,p,extra)=>events.push({id:events.length,type,x:p.x,z:p.z,time:game.time,...extra})};
 assert.equal(castRoUtilitySkill(game,unit,weapon,1,{area:1},api),true);const zone=game.bonk.roSkillZones[0];assert.equal(zone.ticks,5);assert.equal(events[0].type,'roMeteorFall');
 const land=()=>{game.time=game.bonk.elapsed;tickRoSkillEffects(game,unit,.05,api);};land();assert.equal(hits.length,0);game.bonk.elapsed=.89;land();assert.equal(hits.length,0);game.bonk.elapsed=.9;land();assert.equal(hits.length,1);assert.equal(events.find(e=>e.type==='roMeteorImpact').showerId,events[0].showerId);
 for(const at of [1.9,2.9,3.9,4.9]){game.bonk.elapsed=at;land();}
 assert.equal(hits.length,5);assert.ok(hits.every(([id])=>id===2));assert.ok(Math.abs(hits.reduce((n,h)=>n+h[1],0)-weapon.damage)<1e-8);assert.equal(events.filter(e=>e.type==='roMeteorImpact').length,5);assert.equal(events.filter(e=>e.type==='roMeteorFall').length,5);
 const s={bonk:{elapsed:.2,roSkillZones:[zone]},effects:[]};assert.deepEqual(roFireImpacts(s,.2),[],'meteor rain must not be drawn as a ground bonfire');
 game.bonk.elapsed=20;land();assert.equal(hits.length,5);resetRoSkillEffects(game,unit);assert.deepEqual(game.bonk.roSkillZones,[]);
});

test('a suspended meteor shower resumes with one impact rather than unloading its whole remaining damage budget',()=>{
 const unit={id:1,x:0,z:0,alive:true},enemy={id:2,x:1,z:0,bonkEnemy:true,alive:true},game={time:0,bonk:{elapsed:0,stage:'playing'},units:[unit,enemy],id:()=>1},hits=[];
 const api={damage:(e,n)=>hits.push(n)};castRoUtilitySkill(game,unit,RO_SKILLS.wz_meteor,1,{},api);game.bonk.elapsed=4;game.time=4;tickRoSkillEffects(game,unit,.1,api);assert.equal(hits.length,1);tickRoSkillEffects(game,unit,.1,api);assert.equal(hits.length,1);
});

test('the real manual cast releases a network-visible shower after conjuration and hurts the target at its first landing',()=>{
 const g=new Game(152,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,1);u.attributes.int=99;u.mana=2000;u.maxMana=2000;u.bonkBuild.weapons={basic:1,wz_meteor:1};u.bonkSkillSlots=['basic','wz_meteor'];u.bonkSkillAuto={basic:false,wz_meteor:false};g.units=g.units.filter(e=>!e.bonkEnemy);g.bonk.spawnAt=Infinity;g.bonk.ambientSeeded=true;for(const o of g.bonk.objectives)o.started=true;
 const enemy={id:g.id(),bonkEnemy:true,dungeonSpecies:'rat',alive:true,team:100,x:u.x+3,z:u.z,hp:1e6,maxHp:1e6,damage:0,speed:0,size:.8,collisionRadius:.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity};g.units.push(enemy);
 assert.equal(g.command('p',{type:'bkCast',key:'wz_meteor'}),true);let firstFall=null,firstImpact=null;
 for(let i=0;i<240&&!firstImpact;i++){g.tick(.05);firstFall??=g.effects.find(e=>e.type==='roMeteorFall');firstImpact??=g.effects.find(e=>e.type==='roMeteorImpact');if(!firstImpact)assert.equal(enemy.hp,enemy.maxHp,'no damage during conjuration or descent');}
 assert.ok(firstFall);assert.ok(firstImpact);assert.ok(firstImpact.time-firstFall.time>=.89);assert.ok(enemy.hp<enemy.maxHp);assert.equal(firstImpact.showerId,firstFall.showerId);const snapshot=JSON.parse(JSON.stringify(g.snapshotFor('p')));assert.ok(snapshot.effects.some(e=>e.type==='roMeteorImpact'&&e.source===u.id));
});

test('flaming rocks and impact debris use two bounded reusable batches, cull off-screen and release their own resources',()=>{
 const scene=new T.Scene(),art=createRoMeteorArt({scene}),s={effects:Array.from({length:50},(_,i)=>fall(i))},geometry=art.rocks.geometry;let disposed=0;geometry.addEventListener('dispose',()=>disposed++);
 try{art.update(s,.4,()=>2);assert.equal(art.stats().boulders,B.boulders);assert.equal(art.stats().flames,B.flames);assert.equal(art.stats().drawCalls,2);assert.equal(art.stats().smoke,0);assert.equal(scene.children.some(v=>v.isLight),false);assert.equal(art.rocks.geometry,geometry);
 const m=new T.Matrix4();for(const mesh of [art.rocks,art.flames])for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));}
 s.effects=[fall(1,{type:'roMeteorImpact',duration:.85})];art.update(s,.2,()=>7);assert.equal(art.stats().boulders,0);assert.equal(art.stats().debris,8);assert.equal(art.stats().flames,0);assert.equal(roFireImpacts(s,.2).length,1);
 const camera=new T.PerspectiveCamera(60,1,.1,10);camera.position.set(0,0,0);camera.lookAt(0,0,-1);camera.updateMatrixWorld();art.update({effects:[fall(1,{x:10000})]},.3,()=>0,camera);assert.equal(art.stats().drawCalls,0);
 art.update({effects:[]},2);assert.equal(art.stats().drawCalls,0);art.update(null,3);assert.equal(art.rocks.geometry,geometry);
 }finally{art.dispose();art.dispose();}assert.equal(disposed,1);assert.equal(scene.children.length,0);
});
