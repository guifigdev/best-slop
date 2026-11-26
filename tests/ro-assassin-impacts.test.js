import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_SKILLS,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {Game} from '../shared/simulation.js';
import {roSkillTargetRange} from '../shared/ro-skill-range.js';
import {createRoAssassinImpactArt,roAssassinImpactParts,roAssassinImpactHandles,RO_ASSASSIN_IMPACT_BUDGET as B} from '../src/ro-assassin-impact-art.js';
import {updateRoWeaponRig} from '../src/ro-weapon-rig.js';

const event=(key,extra={})=>({id:9,type:'roAttack',bonk:true,source:1,time:1,x:3,z:4,tx:3,tz:6,hitX:3,hitZ:5,skillKey:key,range:1,...extra});
test('Retaliation is a compact physical impact with gold sparks and violet/blue electricity rising around the caster',()=>{
 const e=event('gc_counterslash'),p=roAssassinImpactParts(e,1.15,()=>2);assert.ok(p.stones.length>20&&p.energy.length>40);assert.ok(p.energy.some(p=>p.color===0xffdc79));assert.ok(p.energy.some(p=>p.color===0xb882ed));assert.ok(p.energy.some(p=>p.color===0x9bbcff));assert.ok(p.energy.every(p=>p.from.y>=2&&p.to.y>=2));assert.ok(p.energy.some(p=>p.to.y>4));assert.ok(p.stones.every(p=>Math.hypot(p[0]-e.x,p[2]-e.z)<1.5));assert.deepEqual(roAssassinImpactParts(e,2),{energy:[],stones:[]});assert.equal(roSkillTargetRange(RO_SKILLS.gc_counterslash,{},1),1);assert.equal(roSkillTargetRange(RO_SKILLS.gc_counterslash,{},10),2);
});
test('Cross Impact cuts repeat at the contacted enemy edge, animate both arms and hit only one target',()=>{
 const e=event('gc_crossimpact'),early=roAssassinImpactParts(e,1.08),late=roAssassinImpactParts(e,1.45);assert.ok(early.energy.length&&late.energy.length);assert.notDeepEqual(early,late);assert.ok(early.energy.every(p=>Math.abs(p.from.z-e.hitZ)<.5));
 const rig={arms:['right','left'].map(key=>({key,pivot:[0,1,0],group:new T.Group()}))},u={id:1,bonkHero:true,alive:true};const first=updateRoWeaponRig(rig,u,[e],1.03),second=updateRoWeaponRig(rig,u,[e],1.07);assert.ok(first.active&&second.active);assert.notDeepEqual(first.arms,second.arms);
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const hero=g.player('p');advanceRoJob(hero,2);hero.bonkBuild.weapons={basic:1,gc_crossimpact:1};hero.mana=1000;g.bonk.map.obstacles=[];g.obstacles=[];g.random=()=>0;
 const enemy=(id,z)=>({id,bonkEnemy:true,alive:true,x:hero.x,z:hero.z+z,team:100,hp:10000,maxHp:10000,collisionRadius:.3,armor:0});const a=enemy(10,1.5),b=enemy(11,1.7);g.units=[hero,a,b];assert.ok(g.command('p',{type:'bkCast',key:'gc_crossimpact'}));assert.equal([a,b].filter(e=>e.hp<10000).length,1);const hit=g.effects.find(e=>e.type==='damage');assert.equal(hit.hits,7);
});
test('assassin impact render batches are bounded, terrain anchored and clear without native planes or fallback pulses',()=>{
 const scene=new T.Scene(),art=createRoAssassinImpactArt({scene});try{const effects=Array.from({length:30},(_,i)=>event(i%2?'gc_crossimpact':'gc_counterslash',{id:i}));art.update({effects},1.2,()=>3);assert.ok(art.stats().energy>0&&art.stats().energy<=B.energy);assert.ok(art.stats().stones<=B.stones);assert.ok(art.stats().drawCalls<=2);assert.equal(art.stats().planes,0);for(const type of ['roAttack','abilityPulse','roSkillImpact'])assert.ok(roAssassinImpactHandles({...effects[0],type}));art.update({effects},3);assert.equal(art.stats().energy,0);art.reset();assert.equal(art.stats().stones,0);}finally{art.dispose();}assert.equal(scene.children.length,0);
});
