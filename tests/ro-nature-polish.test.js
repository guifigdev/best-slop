import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_LINEAGES,RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {RO_NATURE_SKILLS} from '../shared/ro-nature-skills.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {castRoUtilitySkill,tickRoSkillEffects} from '../shared/ro-skill-mechanics.js';
import {roForestLights,roNatureSpellParts,createRoNatureArt,RO_NATURE_ART_BUDGET} from '../src/ro-nature-art.js';

test('forest insects are tree anchored, deterministic, bounded, and fade out in daylight or other biomes',()=>{
 const map={seed:71,stageKey:'grove'},trees=[{x:20,z:30},{x:-30,z:10}];
 const night=roForestLights(map,trees,15,1),day=roForestLights(map,trees,15,0);
 assert.equal(night.length,120);assert.equal(day.length,24);assert.deepEqual(night,roForestLights(map,trees,15,1));
 assert.ok(night.every(p=>trees.some(t=>Math.hypot(p.x-t.x,p.z-t.z)<4)&&p.y>0&&p.y<4&&p.brightness>0&&p.size<.4));
 const later=roForestLights(map,trees,15.01,1);assert.ok(night.every((p,i)=>Math.hypot(p.x-later[i].x,p.z-later[i].z)<.1));
 assert.deepEqual(roForestLights({stageKey:'forge'},trees,15,1),[]);assert.deepEqual(roForestLights(map,[],15,1),[]);
});

test('three optional nature skills are offered to every lineage and execute distinct real mechanics',()=>{
 for(const lineage of Object.keys(RO_LINEAGES)){
  const pool=roSkillOfferPool({roLineage:lineage,roTier:0,bonkBuild:{weapons:{basic:1},tomes:{},relics:{}}});
  for(const key of Object.keys(RO_NATURE_SKILLS)){assert.ok(pool.some(c=>c.key===key));assert.equal(RO_SKILLS[key],RO_NATURE_SKILLS[key]);}
 }
 const unit={id:1,x:0,z:0,alive:true,hp:50,maxHp:100,mana:50,maxMana:100,bonkPoisonTicks:3,bonkWebUntil:5},enemy={id:3,bonkEnemy:true,alive:true,x:2,z:0,hp:1000};let serial=10;
 const g={bonk:{stage:'playing',elapsed:0},units:[unit,enemy],time:0,id:()=>serial++};const hits=[],fx=[],api={nearby:()=>[enemy],segment:()=>true,damage:(e,n)=>hits.push(n),effect:(type,p,extra)=>fx.push(extra)};
 assert.equal(castRoUtilitySkill(g,unit,RO_SKILLS.lunardew,1,{},api),true);assert.equal(unit.hp,60);assert.equal(unit.bonkPoisonTicks,0);assert.equal(unit.bonkWebUntil,0);
 assert.equal(castRoUtilitySkill(g,unit,RO_SKILLS.yggwisps,1,{},api),true);assert.equal(g.bonk.roSkillSummons.length,2);
 assert.equal(castRoUtilitySkill(g,unit,RO_SKILLS.payonpetals,1,{},api),true);assert.equal(g.bonk.roSkillZones[0].follow,true);tickRoSkillEffects(g,unit,.1,api);assert.ok(hits.length>=3);assert.ok(enemy.roSkillSlowUntil>0);assert.ok(fx.some(e=>e.skillKey==='lunardew'));
});

test('one teammate ticking cannot erase or cast another teammate summons or damage zones',()=>{
 const units=[{id:1,x:0,z:0,alive:true},{id:2,x:3,z:0,alive:true}],enemy={id:3,x:2,z:0,alive:true,bonkEnemy:true};let serial=10;
 const game={bonk:{stage:'playing',elapsed:0},units:[...units,enemy],id:()=>serial++},hits=[0,0];
 const api=i=>({nearby:()=>[enemy],segment:()=>true,damage:()=>hits[i]++,effect(){}});
 for(const [i,u]of units.entries())for(const key of ['yggwisps','payonpetals'])assert.equal(castRoUtilitySkill(game,u,RO_SKILLS[key],1,{},api(i)),true);
 tickRoSkillEffects(game,units[0],.1,api(0));assert.equal(game.bonk.roSkillZones.length,2);assert.equal(game.bonk.roSkillSummons.length,4);assert.equal(hits[1],0);
 tickRoSkillEffects(game,units[1],.1,api(1));assert.ok(hits[0]>0&&hits[1]>0);assert.equal(game.bonk.roSkillZones.length,2);assert.equal(game.bonk.roSkillSummons.length,4);
});

test('ambient and spell glows reuse two batches, create no lights, and release their GPU resources',()=>{
 const scene=new T.Scene(),art=createRoNatureArt({parent:scene,heightAt:()=>3}),state={time:.3,units:[{id:1,bonkHero:true,x:0,z:0}],bonk:{elapsed:.3,totalElapsed:480,map:{seed:71,stageKey:'grove'},roSkillZones:[{id:1,key:'payonpetals',x:0,z:0,radius:4.5,until:5}],roSkillSummons:[{id:2,key:'yggwisps',x:0,z:0,until:5}]},effects:[{id:3,time:0,skillKey:'lunardew',x:0,z:0}]};
 assert.ok(roNatureSpellParts(state,.3).length>30);art.update(state,.3,[{x:2,z:2}]);const meshes=[...art.root.children];assert.equal(meshes.length,2);assert.equal(art.stats().lights,0);assert.ok(art.stats().ambient<=RO_NATURE_ART_BUDGET.ambient);assert.ok(art.stats().skills<=RO_NATURE_ART_BUDGET.skills);assert.ok(meshes.every(m=>!m.castShadow&&!m.material.depthWrite));
 art.update(state,.4,[{x:2,z:2}]);assert.deepEqual(art.root.children,meshes);art.reset();assert.equal(art.stats().drawCalls,0);art.dispose();assert.equal(scene.children.length,0);
});
