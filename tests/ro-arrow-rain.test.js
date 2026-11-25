import {roSkillDamageBudget} from '../shared/ro-damage-formulas.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {castRoUtilitySkill,tickRoSkillEffects} from '../shared/ro-skill-mechanics.js';
import {isRoArrowRainSkill,roArrowRainArrows,RO_ARROW_RAIN_TIMING} from '../shared/ro-arrow-rain.js';
import {roArrowRainPose,roArrowRainVisualHandles,createRoArrowRainArt,RO_ARROW_RAIN_ART_BUDGET} from '../src/ro-arrow-rain-art.js';
import {roGroundAreas} from '../src/ro-ground-area-art.js';
import {Game} from '../shared/simulation.js';
function arena(){const u={id:1,x:0,z:0,alive:true,bonkHero:true,bonkBuild:{weapons:{basic:1}}},enemy={id:2,x:8,z:0,alive:true,bonkEnemy:true,hp:10000},wallEnemy={id:3,x:9,z:0,alive:true,bonkEnemy:true,hp:10000},g={time:0,units:[u,enemy,wallEnemy],bonk:{stage:'playing',elapsed:0},id:()=>10},events=[],hits=[],api={nearby:(p,r)=>g.units.filter(e=>e.bonkEnemy&&Math.hypot(e.x-p.x,e.z-p.z)<=r),segment:(a,b)=>b.id!==3,damage:(e,n)=>{e.hp-=n;hits.push({id:e.id,n});},effect:(type,p,extra)=>events.push({id:events.length,time:g.time,type,x:p.x,z:p.z,bonk:true,...extra})};return{g,u,enemy,wallEnemy,api,events,hits};}
test('Arrow Storm lands once in the target area after a visible fall and preserves its total damage',()=>{
 const{g,u,enemy,wallEnemy,api,events,hits}=arena(),w=RO_SKILLS.arrowstorm;assert.equal(w.kind,'zone');assert.equal(castRoUtilitySkill(g,u,w,1,{},api),true);assert.equal(events[0].type,'roArrowRainFall');assert.equal(events[0].x,enemy.x);assert.equal(g.bonk.roSkillZones[0].ticks,1);
 g.bonk.elapsed=RO_ARROW_RAIN_TIMING.fall-.01;g.time=g.bonk.elapsed;tickRoSkillEffects(g,u,.1,api);assert.equal(hits.length,0);
 g.bonk.elapsed=RO_ARROW_RAIN_TIMING.fall;g.time=g.bonk.elapsed;tickRoSkillEffects(g,u,.01,api);assert.equal(enemy.hp,10000-roSkillDamageBudget(w,1,u));assert.equal(wallEnemy.hp,10000);assert.equal(hits.length,1);assert.equal(events.at(-1).type,'roArrowRainImpact');
 g.bonk.elapsed=2;g.time=2;tickRoSkillEffects(g,u,100,api);assert.equal(hits.length,1);assert.equal(g.bonk.roSkillZones.length,0);
});
test('Shower is a smaller single volley while Severe Rainstorm retains twelve native volleys',()=>{
 for(const key of ['ac_shower','severerainstorm']){const{g,u,enemy,api,events}=arena(),w=RO_SKILLS[key];castRoUtilitySkill(g,u,w,1,{},api);const count=g.bonk.roSkillZones[0].ticks;assert.equal(count,key==='ac_shower'?1:12);for(let i=0;i<count;i++){g.bonk.elapsed=RO_ARROW_RAIN_TIMING.fall+i*(key==='ac_shower'?1:.3)+.00001;g.time=g.bonk.elapsed;tickRoSkillEffects(g,u,.1,api);}assert.ok(Math.abs(enemy.hp-(10000-roSkillDamageBudget(w,1,u)))<1e-8);assert.equal(events.filter(e=>e.type==='roArrowRainImpact').length,count);assert.equal(events.filter(e=>e.type==='roArrowRainFall').length,count);}
 assert.ok(RO_SKILLS.ac_shower.mechanics.radius<RO_SKILLS.arrowstorm.mechanics.radius);
});
test('shared samples and descending arrow geometry are deterministic, inside the damage disk and never restart in a late snapshot',()=>{
 const e={id:7,showerId:'zone7:1',type:'roArrowRainFall',x:8,z:4,time:5,duration:.55,skillKey:'arrowstorm',radius:4.8};const arrows=roArrowRainArrows(e);assert.equal(arrows.length,21);assert.deepEqual(arrows,roArrowRainArrows(e));assert.ok(arrows.every(a=>Math.hypot(a.x-e.x,a.z-e.z)<=e.radius));
 const high=roArrowRainPose(e,5.03,()=>2),low=roArrowRainPose(e,5.5,()=>2);assert.ok(high.every((a,i)=>a.y>low[i].y+10));assert.equal(roArrowRainPose(e,5.56).length,0);assert.equal(roArrowRainPose(e,4.9).length,0);
 for(const key of ['arrowstorm','ra_arrowstorm','ac_shower','severerainstorm','wm_severe_rainstorm']){assert.equal(isRoArrowRainSkill(key),true);assert.equal(roArrowRainVisualHandles({type:'roAttack',skillKey:key}),true);}assert.equal(isRoArrowRainSkill('doublestrafe'),false);
});
test('rain renderer and suppression preserve boss warnings, use a single reused bounded draw, cull and dispose safely',()=>{
 const scene=new T.Scene(),art=createRoArrowRainArt({scene}),events=Array.from({length:30},(_,i)=>({id:i,showerId:'z'+i,type:'roArrowRainFall',time:0,x:0,z:0,radius:5,duration:.55,skillKey:'arrowstorm'})),state={time:.2,effects:events,options:{mode:'bonk'},units:[],bonk:{elapsed:.2,roSkillZones:[{id:1,key:'arrowstorm',x:0,z:0,radius:5,until:2}],warnings:[{id:1,x:0,z:0,shape:'circle',radius:3,fireAt:2}]}};
 const before=structuredClone(state);art.update(state,.2,()=>0);assert.equal(art.stats().drawCalls,1);assert.ok(art.stats().showers<=8);assert.ok(art.mesh.count<=RO_ARROW_RAIN_ART_BUDGET.arrows);assert.deepEqual(state,before);const m=art.mesh,g=m.geometry;art.update(state,.4,()=>0);assert.equal(art.mesh,m);assert.equal(m.geometry,g);assert.equal(roGroundAreas(state,.2).length,1);assert.equal(roGroundAreas(state,.2)[0].enemy,true);
 const camera=new T.PerspectiveCamera(65,1,.1,50);camera.position.set(1000,10,1000);camera.lookAt(1000,0,990);art.update(state,.4,()=>0,camera);assert.equal(m.count,0);let freed=0;g.addEventListener('dispose',()=>freed++);art.dispose();art.dispose();assert.equal(freed,1);assert.equal(scene.children.length,0);
});
test('real command dispatcher pays SP and creates a falling ground volley without a linear projectile',()=>{
 const g=new Game(76,{mode:'bonk',bonkLineage:'windhawk'});g.addPlayer('p','ranger');g.command('p',{type:'bkReady'});const u=g.player('p');u.roTier=2;u.bonkBuild.weapons.arrowstorm=1;u.bonkSkillSlots=['basic','arrowstorm'];u.bonkSkillAuto={basic:false,arrowstorm:false};u.mana=1000;u.maxMana=1000;u.attributes.dex=200;u.attributes.int=200;g.bonk.spawnAt=1e9;g.bonk.map.obstacles=[];g.bonk.map.walls=[];const e={id:999,x:u.x+7,z:u.z,alive:true,bonkEnemy:true,hp:1e6,maxHp:1e6,damage:0,armor:0,size:1,bonkNextAttack:1e9};g.units=[u,e];assert.equal(g.command('p',{type:'bkCast',key:'arrowstorm'}),true);for(let i=0;i<60&&!g.effects.some(e=>e.type==='roArrowRainFall');i++)g.tick(.05);assert.ok(u.mana<1000);assert.ok(g.effects.some(e=>e.type==='roArrowRainFall'));assert.equal(g.bonk.projectiles.filter(p=>p.skillKey==='arrowstorm').length,0);assert.ok(g.bonk.roSkillZones.some(z=>z.key==='arrowstorm'));
});
