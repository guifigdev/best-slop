import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoEffectVoxels} from '../src/ro-effect-voxels.js';
import {Game} from '../shared/simulation.js';
import {RO_SKILLS,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {roAssassinImpactParts} from '../src/ro-assassin-impact-art.js';
import {applyRoSkillHit} from '../shared/ro-skill-mechanics.js';

test('opaque black sprite backgrounds never become voxel rectangles when frames switch between normal and additive blending',()=>{
 const scene=new T.Scene(),art=createRoEffectVoxels(scene),rgba=[255,255,255,255],quad=[[0,0,0],[2,0,0],[2,2,0],[0,2,0]],texture={x:0,y:0,w:2,h:2},atlas=Uint8Array.from([0,0,0,255,255,160,210,255,0,0,0,0,255,255,255,255]);
 try{for(const additive of [false,true,false,true]){art.begin();const count=art.add(quad,texture,atlas,2,rgba,{budget:4,additive});art.end();assert.equal(count,2);const mesh=scene.children.find(m=>m.count);assert.equal(mesh.count,2);for(let i=0;i<mesh.count;i++){const c=new T.Color();mesh.getColorAt(i,c);assert.ok(Math.max(c.r,c.g,c.b)>.1);}}}finally{art.dispose();}assert.equal(scene.children.length,0);
});
test('Shattering Strike is a visible weapon buff with no cast damage; its proc weakens the struck enemy without launching a projectile',()=>{
 const g=new Game(71,{mode:'bonk',bonkLineage:'meister'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,1);u.level=60;u.bonkBuild.weapons={basic:1,ws_meltdown:1};u.mana=1000;g.random=()=>0;g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.objectives=[];g.bonk.bossSpawned=true;assert.equal(RO_SKILLS.ws_meltdown.kind,'buff');assert.ok(g.command('p',{type:'bkCast',key:'ws_meltdown'}));for(let i=0;i<200&&!u.roSkillBuffs?.some(b=>b.key==='ws_meltdown');i++)g.tick(.1);const buff=u.roSkillBuffs.find(b=>b.key==='ws_meltdown');assert.ok(buff);assert.ok(Math.abs(buff.until-g.bonk.elapsed-15)<.11);assert.equal(g.bonk.projectiles.length,0);assert.ok(!g.effects.some(e=>e.type==='damage'));const activation=g.effects.find(e=>e.type==='battlecry'&&e.skillKey==='ws_meltdown');assert.ok(activation);assert.ok(roAssassinImpactParts(activation,g.time+.2).energy.length>10);
 const e={id:900,alive:true,bonkEnemy:true,x:u.x,z:u.z+1,hp:1000,maxHp:1000};applyRoSkillHit(g,u,e,{key:'basic'},1,{stats:{attributes:{}},effect:(type,target,extra)=>g.fx(type,target.x,target.z,extra)});assert.ok(e.roSkillArmorBreak>0);assert.equal(e.hp,1000);
});
