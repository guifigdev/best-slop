import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_MONSTER_BODY_RADII,roMonsterBodyRadius} from '../shared/ro-monster-footprints.js';
import {ragnarokMonsterSpec} from '../src/ragnarok-monster-art.js';
import {unitFootprintRadius} from '../shared/unit-footprint.js';
import {selectionFootprint} from '../src/unit-selection-footprint.js';
import {resolveUnitCollisions} from '../shared/unit-collision.js';
import {roEnemyTouchesHero} from '../shared/ro-contact-combat.js';
test('all 388 RO monster footprints cover their lower model and feet and selection uses that exact world radius',()=>{
 assert.ok(Object.keys(RO_MONSTER_BODY_RADII).length>=388);for(const [key,r]of Object.entries(RO_MONSTER_BODY_RADII)){const spec=ragnarokMonsterSpec(key),height=Math.max(...spec.parts.map(p=>p[1]+p[4]/2));for(const p of spec.parts.filter(p=>p[1]-p[4]/2<height*.55&&p[1]+p[4]/2>.08))assert.ok(Math.hypot(Math.abs(p[0])+p[3]/2,Math.abs(p[2])+p[5]/2)<=r+.00001,key);for(const size of [.8,1.25,2.3]){const u={bonkEnemy:true,ragnarokVisual:key,size,collisionRadius:roMonsterBodyRadius({ragnarokVisual:key,size})};assert.equal(unitFootprintRadius(u),u.collisionRadius);assert.ok(Math.abs(selectionFootprint(u,'bonk',size).localRadius*size-u.collisionRadius)<1e-9);}}
});
test('large MVP bodies collide across spatial buckets and contact agrees with separation; allied heroes still pass',()=>{
 const boss={id:1,bonkEnemy:true,alive:true,team:100,x:0,z:0,collisionRadius:3.5},hero={id:2,bonkHero:true,alive:true,team:1,x:4,z:0,collisionRadius:.6},g={units:[boss,hero],bounds:50,obstacles:[],time:1};resolveUnitCollisions(g,.05);assert.ok(Math.hypot(hero.x-boss.x,hero.z-boss.z)>=4.1-.001);assert.ok(roEnemyTouchesHero(boss,hero));const ally={...hero,id:3};g.units=[hero,ally];resolveUnitCollisions(g,.05);assert.equal(hero.x,ally.x);
});
