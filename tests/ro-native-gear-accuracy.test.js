import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_EQUIPMENT,roEquipmentBonuses,createRoEquipment} from '../shared/ragnarok-equipment.js';
import {RO_EQUIPMENT_NATIVE} from '../shared/ro-equipment-native-data.js';
import {roNativeEquipment} from '../shared/ro-equipment-native.js';
import {roMonsterAccuracy,roHeroHitChance,roPhysicalHitChance} from '../shared/ro-hit-flee.js';
import {Game} from '../shared/simulation.js';
import {advanceRoJob} from '../shared/ragnarok-jobs.js';
import {roNativeEventRequests,roNativeEventPhases} from '../shared/ro-native-effect-policy.js';
import {RO_NATIVE_PRIMITIVE_MANIFEST} from '../src/ro-native-primitive-assets.js';

test('every equipment identity has native base facts; Scalpel and Snake Head retain their actual LATAM effects',()=>{
 for(const d of Object.values(RO_EQUIPMENT)){assert.ok(RO_EQUIPMENT_NATIVE[d.sourceId],d.key);assert.equal(d.nativeBase,true);}
 const scalpel=RO_EQUIPMENT.build_13027,snake=RO_EQUIPMENT.build_5388;
 assert.deepEqual(scalpel.stats,{attack:120});assert.deepEqual(scalpel.onHit,[{status:'bleeding',chance:.05}]);
 assert.deepEqual(snake.stats,{armor:2});assert.equal(snake.doubleAttackLevel,5);assert.deepEqual(snake.grantedSkills,{TF_DOUBLE:5});
 const item=createRoEquipment(snake.key,'snake'),u={roInventory:[item],roEquipment:{head:item.id}};assert.equal(roEquipmentBonuses(u).doubleAttackLevel,5);delete u.roEquipment.head;assert.equal(roEquipmentBonuses(u).doubleAttackLevel,0);
});

test('native arithmetic requires earned refinement and retains real skill and attribute conditions',()=>{
 const low=roNativeEquipment(22134,{level:100},{refine:12}),trained=roNativeEquipment(22134,{level:100,roSourceSkillLevels:{GC_WEAPONCRUSH:5,GC_WEAPONBLOCKING:5,GC_COUNTERSLASH:5,AS_POISONREACT:10}},{refine:12});
 assert.equal(low.skillBonuses.ASC_METEORASSAULT.damage,2);assert.equal(trained.skillBonuses.ASC_METEORASSAULT.damage,5);assert.equal(trained.stats.attackRate,.2);assert.equal(trained.skillBonuses.GC_HALLUCINATIONWALK.cooldownSeconds,25);
 assert.equal(roNativeEquipment(22134,{level:100}).skillBonuses.ASC_METEORASSAULT.damage,undefined);
 const fire=roNativeEquipment(1133);assert.equal(fire.weaponElement,'fire');assert.deepEqual(fire.onHit,[{skill:'MG_FIREBOLT',level:3,chance:.1}]);
});

test('Renewal accuracy actually compares HIT against each monster FLEE rather than a universal 99 percent roll',()=>{
 const baph=roMonsterAccuracy({roSourceId:1039});assert.equal(baph.flee,306);assert.equal(roHeroHitChance({hit:406},{roSourceId:1039}),1);assert.equal(roHeroHitChance({hit:386},{roSourceId:1039}),.8);assert.equal(roHeroHitChance({hit:180},{roSourceId:1039}),.05);assert.equal(roPhysicalHitChance(180,306,200),.74);
});

test('Scalpel bleeding and Snake Head Double Attack affect a real hit without inventing critical or agility bonuses',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');u.level=150;u.attributes.dex=99;u.bonkBuild.weapons={basic:1};u.roInventory=[];u.roEquipment={};
 for(const [slot,key]of [['weapon','build_13027'],['head','build_5388']]){const item=createRoEquipment(key,slot);u.roInventory.push(item);u.roEquipment[slot]=item.id;}
 const e={id:9001,bonkEnemy:true,alive:true,x:u.x,z:u.z+2,team:100,armor:0,roSourceId:999999,hp:100000,maxHp:100000,collisionRadius:.3,damage:0,speed:0};g.units=[u,e];g.bonk.map.obstacles=[];g.obstacles=[];g.effects=[];g.random=()=>.01;
 assert.ok(g.command('p',{type:'bkCast',key:'basic'}));const hit=g.effects.find(f=>f.type==='damage'&&f.target===e.id);
 assert.equal(hit.hits,2);assert.equal(hit.critical,false);assert.ok(e.roBleedUntil>g.bonk.elapsed);assert.equal(u.bonkBuild.weapons.tf_double,undefined,'item grants the effect without spending learned skill ranks');
});

test('Grimtooth erupts along a medium-range ground line and creates no travelling arrows',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,1);u.bonkBuild.weapons={basic:1,as_grimtooth:3};u.bonkSkillSlots=['basic','as_grimtooth'];u.bonkSkillAuto={basic:false,as_grimtooth:false};u.mana=500;
 const enemy=(id,x,z)=>({id,bonkEnemy:true,alive:true,x:u.x+x,z:u.z+z,team:100,roSourceId:999999,hp:10000,maxHp:10000,collisionRadius:.2,damage:0,speed:0});const a=enemy(9001,0,3),b=enemy(9002,0,4),outside=enemy(9003,3,3);g.units=[u,a,b,outside];g.bonk.map.obstacles=[];g.obstacles=g.bonk.map.obstacles;g.bonk.spawnAt=Infinity;g.effects=[];g.random=()=>.1;
 assert.ok(g.command('p',{type:'bkCast',key:'as_grimtooth'}));assert.equal(g.bonk.projectiles.length,0);assert.ok(a.hp<10000&&b.hp<10000);assert.equal(outside.hp,10000);const spikes=g.effects.filter(e=>e.type==='roSkillImpact');assert.equal(spikes.length,5);assert.ok(spikes.every(e=>e.skillKey==='as_grimtooth'&&e.x===u.x&&e.z>u.z&&e.z<=u.z+5));
 assert.deepEqual(roNativeEventPhases(g.effects.find(e=>e.type==='roAttack')),[],'the launch cannot create an extra spike at the victim');
 for(const event of spikes){const requests=roNativeEventRequests(event,u,RO_NATIVE_PRIMITIVE_MANIFEST,{types:['QuadHorn'],hasAsset:r=>!!RO_NATIVE_PRIMITIVE_MANIFEST.parts[r.primitiveId]});assert.equal(requests.length,3);assert.ok(requests.every(r=>r.x===event.x&&r.z===event.z&&r.anchor==='point'&&r.until===event.time+.7));}
});
