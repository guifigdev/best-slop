import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
function impact(skillKey){
 const g=new Game(71,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];Object.assign(g.bonk,{routeVersion:0,spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[],bossUnlocked:false});u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));
 const e={id:g.id(),bonkEnemy:true,alive:true,x:u.x+1,z:u.z,team:100,hp:999,maxHp:999,damage:1,speed:0,interval:1.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity,collisionRadius:.32,dungeonSpecies:'poring'};g.units.push(e);
 g.bonk.projectiles.push({id:g.id(),source:u.id,x:u.x,z:u.z,dx:1,dz:0,speed:20,damage:10,skillKey,skillLevel:1,remaining:10,range:10,element:'ice',radius:.38,pierce:3,hitIds:[],travelled:0});g.tick(.05);return{g,u,e};
}
test('a piercing spell emits its original skill identity at the actual hit and never repeats it on the same victim',()=>{
 const{g,u,e}=impact('coldbolt'),events=g.effects.filter(e=>e.type==='roSkillImpact');assert.equal(events.length,1);assert.equal(events[0].skillKey,'coldbolt');assert.equal(events[0].source,u.id);assert.equal(events[0].target,e.id);assert.equal(events[0].x,e.x);assert.ok(e.hp<999);g.tick(.05);assert.equal(g.effects.filter(e=>e.type==='roSkillImpact').length,1);
});
test('the native basic attack keeps its existing effect path',()=>{const{g}=impact('basic');assert.equal(g.effects.some(e=>e.type==='roSkillImpact'),false);});
