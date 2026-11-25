import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {roCriticalStagger,RO_CRITICAL_STAGGER as B} from '../shared/ro-critical-stagger.js';
import {roEnemySkillState} from '../shared/ro-skill-mechanics.js';
import {tickRoNativeEnemyBehavior} from '../shared/ro-native-enemy-behavior.js';

test('physical critical hits briefly stagger ordinary monsters and MVPs, with a recovery interval',()=>{
 for(const boss of [false,true]){const enemy={bonkEnemy:true,bonkBoss:boss,alive:true,hp:100,x:1,z:0},source={x:0,z:0};assert.ok(roCriticalStagger(enemy,source,5,12));assert.equal(enemy.roHitReaction.at,12);assert.equal(enemy.roCritStaggerUntil,5+B.duration);assert.ok(roEnemySkillState(enemy,5.05).stunned);assert.equal(roCriticalStagger(enemy,source,5.1,12.1),false);assert.equal(enemy.roCritStaggerUntil,5+B.duration);assert.equal(roEnemySkillState(enemy,5.2).stunned,false);assert.ok(roCriticalStagger(enemy,source,5.6,12.6));}
});
test('a critical stagger delays a native cast without deleting its skill or permanently locking it',()=>{
 const e={id:2,roSourceId:1156,alive:true,hp:100,bonkEnemy:true,x:0,z:0,roCritStaggerUntil:5.14,roNativeCast:{target:1,until:5.05}},hero={id:1,alive:true,x:1,z:0,bonkJumpHeight:0},g={time:12,units:[e],bonk:{elapsed:5}};tickRoNativeEnemyBehavior(g,e,[hero]);assert.ok(e.roNativeCast);g.bonk.elapsed=5.2;tickRoNativeEnemyBehavior(g,e,[hero]);assert.equal(e.roNativeCast,undefined);assert.ok(hero.roAgilityDownUntil>5.2);
});
test('a real critical basic attack invokes the authoritative stagger on an MVP',()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),enemy=g.units.find(e=>e.bonkEnemy),weapon=createRoEquipment('katar','critical-test');u.roInventory.push(weapon);u.roEquipment.weapon=weapon.id;g.random=()=>0;Object.assign(enemy,{hp:1e6,maxHp:1e6,x:u.x+1,z:u.z,bonkBoss:true});g.units=[u,enemy];g.effects=[];assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.ok(g.effects.some(e=>e.type==='damage'&&e.critical));assert.ok(enemy.roCritStaggerUntil>g.bonk.elapsed);
});
