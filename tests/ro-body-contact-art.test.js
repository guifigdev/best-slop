import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {roBasicAttack} from '../shared/ragnarok-jobs.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {unitBodyHull,unitBodyContact,unitBodyGap} from '../shared/unit-body-shape.js';
import {roMonsterBodyRadius} from '../shared/ro-monster-footprints.js';
import {roEnemyTouchesHero} from '../shared/ro-contact-combat.js';
import {resolveUnitCollisions} from '../shared/unit-collision.js';
import {roBodySelectionGeometry} from '../src/ro-body-selection-art.js';
import {roCaveRockGeometry} from '../src/ro-cave-rock-geometry.js';

test('MVP contact, physical separation and selection follow the lower body instead of empty enclosing-circle corners',()=>{
 const boss={id:1,bonkEnemy:true,alive:true,ragnarokVisual:'mistress',size:2.3,x:0,z:0,facing:0,team:100};boss.collisionRadius=roMonsterBodyRadius(boss);
 const hull=unitBodyHull(boss),right=Math.max(...hull.map(p=>p.z)),hero={id:2,bonkHero:true,alive:true,x:0,z:boss.collisionRadius+.4,collisionRadius:.45,team:1};assert.ok(right<boss.collisionRadius-.1);
 assert.equal(roEnemyTouchesHero(boss,hero),false);const x=hero.z;resolveUnitCollisions({units:[boss,hero],bounds:50,obstacles:[],time:1},.05);assert.equal(hero.z,x);
 hero.z=right+.44;assert.ok(roEnemyTouchesHero(boss,hero));resolveUnitCollisions({units:[boss,hero],bounds:50,obstacles:[],time:2},.05);assert.ok(unitBodyContact(boss,hero).depth<.001);assert.ok(roEnemyTouchesHero(boss,hero));
 const before=unitBodyGap(boss,{x:2,z:0});boss.facing=Math.PI/2;assert.notEqual(unitBodyGap(boss,{x:2,z:0}),before);
 const geometry=roBodySelectionGeometry(boss),a=geometry.attributes.position;assert.equal(a.count,hull.length*6);for(let i=0;i<a.count;i+=6){assert.ok(Math.abs(a.getX(i)*boss.collisionRadius-hull[i/6].x)<1e-6);assert.ok(Math.abs(-a.getY(i)*boss.collisionRadius-hull[i/6].z)<1e-6);}geometry.dispose();
});

test('equipped melee weapons use visible reach and a basic dagger cannot damage a distant body',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');u.roInventory=[];u.roEquipment={};
 for(const [key,max]of [['knife',1.4],['build_1287',1.1]]){const item=createRoEquipment(key,key);u.roInventory=[item];u.roEquipment.weapon=item.id;assert.equal(roBasicAttack(u).range,max);}
 u.roInventory=[createRoEquipment('knife','knife')];u.roEquipment.weapon='knife';const enemy={id:9001,bonkEnemy:true,alive:true,x:u.x,z:u.z+2,team:100,hp:10000,maxHp:10000,collisionRadius:.3,armor:0};g.units=[u,enemy];g.bonk.map.obstacles=[];g.obstacles=[];assert.equal(g.command('p',{type:'bkCast',key:'basic'}),false);assert.equal(enemy.hp,10000);enemy.z=u.z+1.5;g.random=()=>0;assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.ok(enemy.hp<10000);
});

test('cavern walls are closed faceted rock volumes with fine low relief and no collision-free protrusions',()=>{
 const g=roCaveRockGeometry(),p=g.attributes.position,n=g.attributes.normal,normals=new Set();let low=0;for(let i=0;i<p.count;i++){assert.ok(Math.abs(p.getX(i))<=.5&&Math.abs(p.getZ(i))<=.5);assert.ok(p.getY(i)>=-.5&&p.getY(i)<=.5);if(p.getY(i)<-.4)low++;normals.add([n.getX(i),n.getY(i),n.getZ(i)].map(v=>v.toFixed(2)).join(','));}assert.ok(normals.size>100);assert.ok(low>300);assert.ok(p.count<3200);g.dispose();
});
