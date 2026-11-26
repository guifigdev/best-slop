import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {advanceRoJob} from '../shared/ragnarok-jobs.js';
import {BONK_WEAPONS} from '../shared/bonk-catalog.js';
import {roSkillStatus,roSkillCooldown,roSkillAuto,castRoSkill} from '../shared/ro-skill-controls.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';

function arena(){
 const g=new Game(152,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,2);u.bonkBuild.weapons={basic:1,rollingcutter:3};g.units=g.units.filter(e=>!e.bonkEnemy);g.bonk.spawnAt=Infinity;for(const o of g.bonk.objectives)o.started=true;
 const enemy={id:g.id(),bonkEnemy:true,dungeonSpecies:'rat',alive:true,team:100,x:u.x+2,z:u.z,hp:1e6,maxHp:1e6,damage:0,speed:0,size:.8,collisionRadius:.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity};g.units.push(enemy);return{g,u,enemy};
}
const cast=g=>g.command('p',{type:'bkCast',key:'rollingcutter'});

test('manual Rolling Cutter damages the actual target and shares SP/cooldown with AUTO',()=>{
 const{g,u,enemy}=arena();u.bonkBuild.tomes.haste=3;const startMana=u.mana,hp=enemy.hp,status=roSkillStatus(g,u,'rollingcutter',bonkStats(u));assert.equal(status.ready,true);assert.equal(status.manaCost,5);assert.ok(cast(g));assert.equal(u.mana,startMana-5);assert.ok(enemy.hp<hp);assert.equal(u.bonkWeaponAt.rollingcutter,g.bonk.elapsed+roSkillCooldown(BONK_WEAPONS.rollingcutter,3,bonkStats(u)));const after=enemy.hp,sp=u.mana,effects=g.effects.length;assert.equal(cast(g),false);assert.equal(enemy.hp,after);assert.equal(u.mana,sp);assert.equal(g.effects.length,effects);assert.match(g.commandFailureReason,/Pós-conjuração/i);
 const entry=g.snapshotBonk().weapons.find(w=>w.key==='rollingcutter');assert.equal(entry.auto,true);assert.equal(entry.ready,false);assert.equal(entry.reasonCode,'aftercast');assert.equal(entry.cooldownRemaining,0);assert.ok(entry.afterCastRemaining>0);assert.equal(entry.manaCost,5);
});

test('casting never bypasses missing SP, target, learned skill, life or paused offer',()=>{
 for(const [mutate,code]of [[({u})=>u.mana=0,'mana'],[({enemy,u})=>enemy.x=u.x+100,'target'],[({u})=>u.alive=false,'dead'],[({g})=>g.bonk.stage='preparation','paused'],[({g})=>g.paused=true,'paused'],[({g})=>{g.bonk.offer={choices:[]};g.bonk.stage='levelup';},'paused']]){const f=arena();mutate(f);const hp=f.enemy.hp,sp=f.u.mana;assert.equal(roSkillStatus(f.g,f.u,'rollingcutter',bonkStats(f.u)).reasonCode,code);assert.equal(cast(f.g),false);assert.equal(f.enemy.hp,hp);assert.equal(f.u.mana,sp);}
 const{g,u,enemy}=arena();assert.equal(g.command('p',{type:'bkCast',key:'eternalslash'}),false);u.mana=0;enemy.x=u.x+1.2;assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.ok(enemy.hp<enemy.maxHp);assert.equal(u.mana,0);
});

test('AUTO is on by default, per-skill toggles do not reset recast and offers freeze cooldown',()=>{
 const{g,u,enemy}=arena();assert.equal(roSkillAuto(u,'rollingcutter'),true);assert.ok(g.command('p',{type:'bkAutoSkill',key:'basic',enabled:false}));assert.ok(g.command('p',{type:'bkAutoSkill',key:'rollingcutter',enabled:false}));assert.equal(g.command('p',{type:'bkAutoSkill',key:'rollingcutter',enabled:'false'}),false);assert.equal(g.command('p',{type:'bkAutoSkill',key:'eternalslash',enabled:false}),false);g.tick(.05);assert.equal(enemy.hp,enemy.maxHp);assert.ok(cast(g));const until=u.bonkWeaponAt.rollingcutter;assert.ok(g.command('p',{type:'bkAutoSkill',key:'rollingcutter',enabled:true}));assert.equal(u.bonkWeaponAt.rollingcutter,until);g.bonk.stage='levelup';g.bonk.offer={id:1,choices:[]};const remaining=g.snapshotBonk().weapons[1].cooldownRemaining;for(let i=0;i<10;i++)g.tick(.1);assert.equal(g.snapshotBonk().weapons[1].cooldownRemaining,remaining);g.bonk.offer=null;g.bonk.stage='playing';const hp=enemy.hp;for(let i=0;i<25;i++)g.tick(.1);assert.ok(enemy.hp<hp,'reenabled AUTO uses same learned skill after recast');
});

test('individual AUTO preferences survive save/restore and invalid preferences are rejected',()=>{
 const{g,u}=arena();g.command('p',{type:'bkAutoSkill',key:'rollingcutter',enabled:false});const cp=createRoCheckpoint(g);assert.ok(cp);assert.deepEqual(cp.hero.bonkSkillAuto,{rollingcutter:false});const copy=validateRoCheckpoint(cp);copy.hero.bonkSkillAuto.rollingcutter=true;assert.equal(cp.hero.bonkSkillAuto.rollingcutter,false);const resumed=new Game(55,{mode:'bonk',bonkLineage:'shadowcross'});resumed.addPlayer('p','raccoon');assert.ok(resumed.command('p',{type:'bkRestore',checkpoint:cp}));assert.equal(resumed.snapshotBonk().weapons.find(w=>w.key==='rollingcutter').auto,false);
 for(const value of [null,[],{unknown:false},{eternalslash:false},{rollingcutter:0},{rollingcutter:'false'}]){const invalid=structuredClone(cp);invalid.hero.bonkSkillAuto=value;assert.equal(validateRoCheckpoint(invalid),null);}
 delete u.bonkSkillAuto;const legacy=createRoCheckpoint(g);assert.ok(legacy);assert.equal(Object.hasOwn(legacy.hero,'bonkSkillAuto'),false);assert.deepEqual(validateRoCheckpoint(legacy),legacy);
});

test('starting chest is immediately advertised and opens without movement, while range remains bounded',()=>{
 const{g,u}=arena(),chest=g.bonk.objects.find(o=>o.id==='starting-chest'),position=[u.x,u.z];assert.ok(Math.hypot(chest.x-u.x,chest.z-u.z)>4);assert.equal(g.snapshotBonk().nearestObject,chest.id);assert.ok(g.command('p',{type:'bkInteract',object:chest.id}));assert.deepEqual([u.x,u.z],position);assert.equal(g.bonk.lastLoot.equipment.length,1);assert.ok(g.bonk.lastLoot.relic);g.bonk.objects.push({id:'too-far',type:'pot',x:u.x+8.01,z:u.z,used:false});assert.equal(g.command('p',{type:'bkInteract',object:'too-far'}),false);
});

// Shared action locks still follow Ragnarok rules, without assigning recast to
// other skills or rendering the same timer in every slot.
test('casting writes only that skill cooldown, including a cast that finishes later',()=>{
 const {g,u}=arena();u.bonkBuild.weapons.asc_meteorassault=1;u.bonkSkillSlots=['basic','rollingcutter','asc_meteorassault'];
 const stats=bonkStats(u);u.bonkWeaponAt={basic:8};
 assert.ok(castRoSkill(g,u,'rollingcutter',stats,()=>true).ok);
 assert.deepEqual(Object.keys(u.bonkWeaponAt).sort(),['basic','rollingcutter']);
 const other=roSkillStatus(g,u,'asc_meteorassault',stats);assert.equal(other.cooldownRemaining,0);assert.equal(other.reasonCode,'aftercast');
 g.bonk.elapsed=Math.max(u.roAfterCastUntil,u.roSkillActionUntil)+.01;
 assert.ok(castRoSkill(g,u,'asc_meteorassault',stats,()=>true).ok);assert.ok(u.roCasting);
 assert.equal(roSkillStatus(g,u,'rollingcutter',stats).cooldownRemaining,0);
 assert.equal(Object.hasOwn(u.bonkWeaponAt,'asc_meteorassault'),false,'cast time does not overwrite cooldown maps');
});
