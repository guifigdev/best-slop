import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {RO_CARDS,createRoEquipment} from '../shared/ragnarok-equipment.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillManaCost} from '../shared/ro-skill-controls.js';
import {roEquipmentTargetMultiplier} from '../shared/ro-equipment-target-bonuses.js';
import {roCardEffects,roCardRaceValue} from '../shared/ro-card-effects.js';
import {RO_CARD_NATIVE} from '../shared/ro-card-native-data.js';
import {roCardEffectText} from '../src/ro-card-effect-text.js';
test('card scripts replace the generic scaled placeholders with characteristic bonuses and readable effects',()=>{
 assert.ok(Object.keys(RO_CARD_NATIVE).length>=300);
 assert.deepEqual(RO_CARDS.poring.stats,{luk:2,perfectEvasion:.01});assert.equal(RO_CARDS.towercard_4075.stats.armor,1);assert.equal(RO_CARDS.towercard_4075.statusResistance.stone,.2);
 assert.equal(RO_CARDS.towercard_4176.stats.critDamage,.1);assert.equal(RO_CARDS.towercard_4398.magicRaceDamage.angel,.1);assert.equal(RO_CARDS.towercard_4239.raceExperience.formless,.1);assert.equal(RO_CARDS.towercard_4239.raceResistance.formless,-.2);
 assert.match(roCardEffectText(RO_CARDS.towercard_4398),/Dano mágico contra Anjo \+10%/);assert.match(roCardEffectText(RO_CARDS.gtb),/Resistência a magia \+100%/);
 assert.equal(roCardEffects(RO_CARDS.towercard_4427,{roWeaponType:'sword'}).skillBonuses.KN_BOWLINGBASH.damage,.25);assert.deepEqual(roCardEffects(RO_CARDS.towercard_4427,{roWeaponType:'bow'}).stats,{});
});
function fixture(){const g=new Game(31,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];Object.assign(g.bonk,{spawnAt:Infinity,objectives:[],bossSpawned:true,pickups:[],routeVersion:0});u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));return{g,u};}
test('account cards apply actual skill, race and critical effects through equipped socketed gear',()=>{
 const {u}=fixture(),sword=createRoEquipment('sword','sword'),bow=createRoEquipment('bow','bow');u.roInventory.push(sword,bow);u.roEquipment.weapon=sword.id;u.roCardLoadout={weapon:'towercard_4427'};
 assert.equal(bonkStats(u).skillBonuses.KN_BOWLINGBASH.damage,.25);u.roEquipment.weapon=bow.id;assert.equal(bonkStats(u).skillBonuses.KN_BOWLINGBASH,undefined);
 u.roCardLoadout.weapon='towercard_4176';assert.ok(Math.abs(bonkStats(u).critDamage-1.9)<1e-9);assert.equal(roCardRaceValue(bonkStats(u).raceCritical,{roSourceId:1155,bonkBoss:true}),.07);
 const angel={roSourceId:1751,bonkBoss:true};assert.equal(roEquipmentTargetMultiplier(RO_CARDS.towercard_4398,angel,'magic'),1.1);
});
test('Golden Thief Bug prevents a real magical hit and actually doubles spell SP cost',()=>{
 const {g,u}=fixture(),shield=createRoEquipment('buckler','shield');u.roInventory.push(shield);u.roEquipment.offhand=shield.id;u.roCardLoadout={offhand:'gtb'};
 const stats=bonkStats(u);assert.equal(stats.magicDamageReduction,1);assert.equal(roSkillManaCost(RO_SKILLS.fireball,1,stats),50);u.bonkInvulnerableUntil=0;const hp=u.hp;
 g.bonk.warnings=[{id:999,source:998,x:u.x,z:u.z,shape:'circle',radius:3,damage:100,element:'fire',fireAt:0}];g.tick(.05);assert.equal(u.hp,hp);
});
