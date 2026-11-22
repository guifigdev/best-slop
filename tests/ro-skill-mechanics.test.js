import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_SKILL_EFFECT_LIMITS,roSkillModifiers,applyRoSkillModifiers,roUtilitySkillReadiness,castRoUtilitySkill,applyRoSkillHit,roEnemySkillState,roAbsorbSkillDamage,applyRoSkillLifeSteal,tickRoSkillEffects,resetRoSkillEffects} from '../shared/ro-skill-mechanics.js';

function arena(){
 const unit={id:1,x:0,z:0,alive:true,hp:200,maxHp:300,mana:50,maxMana:100,bonkBuild:{weapons:{basic:1}}},enemy={id:2,x:3,z:0,alive:true,bonkEnemy:true,hp:1000,maxHp:1000,size:1},blocked={id:3,x:4,z:0,alive:true,bonkEnemy:true,hp:1000,maxHp:1000,size:1},events=[],hits=[];
 let id=4;const game={time:0,bonk:{elapsed:0,stage:'playing'},units:[unit,enemy,blocked],id:()=>id++,random:()=>0};
 const api={nearby:(p,r)=>game.units.filter(e=>e.bonkEnemy&&e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<=r),segment:(a,b)=>b.id!==3,blocked:p=>p.x>5,damage:(target,amount,element,secondary)=>{target.hp-=amount;if(target.hp<=0)target.alive=false;hits.push({target:target.id,amount,element,secondary});},effect:(type,point,extra)=>events.push({type,point:{x:point.x,z:point.z},...extra}),move:(target,dx,dz,dt,speed)=>{const d=Math.hypot(dx,dz)||1;target.x+=dx/d*dt*speed;target.z+=dz/d*dt*speed;}};
 return{game,unit,enemy,blocked,api,events,hits};
}
const skill=(kind,mechanics={},extra={})=>({key:'test-'+kind,name:kind,kind,element:'physical',damage:100,range:10,radius:4,skill:'abilityPulse',mechanics,...extra});

test('Heal restores health without a target, cleanses venom/web and does not spend SP itself',()=>{
 const{game,unit,api,events}=arena();game.units=[unit];unit.bonkPoisonTicks=3;unit.bonkWebUntil=5;
 const heal=skill('heal',{healPercent:.15,healFlat:10,cleanse:true});assert.equal(roUtilitySkillReadiness(game,unit,heal).ready,true);
 assert.equal(castRoUtilitySkill(game,unit,heal,1,{},api),true);assert.equal(unit.hp,255);assert.equal(unit.mana,50);assert.equal(unit.bonkPoisonTicks,0);assert.equal(unit.bonkWebUntil,0);assert.equal(events[0].type,'heal');
 unit.hp=unit.maxHp;unit.mana=unit.maxMana;assert.equal(roUtilitySkillReadiness(game,unit,heal).readyReason,'Vida e SP completos');assert.equal(castRoUtilitySkill(game,unit,heal,1,{},api),false);
});

test('mana recovery is useful at full health and limited by the actual SP capacity',()=>{
 const{game,unit,api}=arena();unit.hp=unit.maxHp;unit.mana=90;const recover=skill('heal',{manaPercent:.25});assert.equal(castRoUtilitySkill(game,unit,recover,1,{},api),true);assert.equal(unit.mana,100);
});

test('defensive buffs activate without a target, cannot refresh while active, and expire in encounter time',()=>{
 const{game,unit,api}=arena();game.units=[unit];const buff=skill('buff',{duration:5,modifiers:{armor:8,damageReduction:.15},shieldPercent:.2});
 assert.equal(castRoUtilitySkill(game,unit,buff,1,{},api),true);assert.equal(unit.roSkillShield.value,60);assert.equal(roUtilitySkillReadiness(game,unit,buff).reasonCode,'active');assert.equal(castRoUtilitySkill(game,unit,buff,1,{},api),false);
 assert.equal(roAbsorbSkillDamage(unit,100,0,{damageReduction:.15}),25);assert.equal(unit.roSkillShield.value,0);
 assert.equal(roSkillModifiers(unit,4).armor,8);assert.equal(roSkillModifiers(unit,5).armor,undefined);game.bonk.elapsed=5;tickRoSkillEffects(game,unit,.1,api);assert.equal(unit.roSkillBuffs.length,0);assert.equal(unit.roSkillShield,undefined);
 assert.equal(castRoUtilitySkill(game,unit,buff,1,{},api),true);
});

test('learned passives remain effective off the hotbar and all modifier totals have explicit caps',()=>{
 const unit={bonkBuild:{weapons:{swordmastery:8,guard:8}},bonkSkillSlots:['basic'],roSkillBuffs:[{key:'overload',until:10,modifiers:{damage:100,haste:100,evasion:100}}]},catalog={swordmastery:skill('passive',{modifiers:{damage:.1,accuracy:.04}}),guard:skill('passive',{modifiers:{damageReduction:1,armor:100}})};
 const mods=roSkillModifiers(unit,0,catalog);assert.equal(mods.damage,1.25);assert.equal(mods.haste,.85);assert.equal(mods.damageReduction,.4);assert.equal(mods.armor,45);assert.equal(mods.evasion,.22);
 const result=applyRoSkillModifiers({damage:2,haste:4,area:1,speed:8,maxHp:300,xp:1,magnet:3,crit:.8,evasion:.4,accuracy:.9,armor:5,magicDefense:5,regen:1,manaRegen:2,critDamage:1.8,amount:0},mods);
 assert.equal(result.damage,4.5);assert.equal(result.haste,5);assert.equal(result.evasion,.55);assert.equal(result.armor,50);assert.ok(result.accuracy<=.99);assert.equal(result.lifeSteal,0);
});

test('passives cannot be manually cast and ordinary weapons remain handled by the host attack implementation',()=>{
 const{game,unit,api}=arena();assert.equal(roUtilitySkillReadiness(game,unit,skill('passive')).reasonCode,'passive');assert.equal(castRoUtilitySkill(game,unit,skill('passive'),1,{},api),false);assert.equal(castRoUtilitySkill(game,unit,skill('slash'),1,{},api),null);
});

test('Fire Wall and traps budget total damage across pulses and do not hit through scenery',()=>{
 const{game,unit,enemy,blocked,api,hits}=arena(),wall=skill('zone',{duration:3,interval:1,radius:2,status:{burn:3}});assert.equal(castRoUtilitySkill(game,unit,wall,1,{},api),true);
 for(let i=0;i<3;i++){game.bonk.elapsed=i;tickRoSkillEffects(game,unit,.1,api);}
 assert.ok(Math.abs(enemy.hp-900)<1e-8);assert.equal(blocked.hp,1000);assert.equal(hits.length,3);assert.ok(enemy.bonkBurnUntil>2);
 game.bonk.elapsed=3;tickRoSkillEffects(game,unit,.1,api);assert.equal(game.bonk.roSkillZones.length,0);
});

test('persistent zone objects are capped, have no catch-up burst, and following auras track the hero',()=>{
 const{game,unit,enemy,api,hits}=arena();for(let i=0;i<30;i++)castRoUtilitySkill(game,unit,skill('zone',{duration:8,interval:.5,follow:true,radius:8},{key:'zone-'+i}),1,{},api);
 assert.equal(game.bonk.roSkillZones.length,RO_SKILL_EFFECT_LIMITS.zones);unit.x=2;game.bonk.elapsed=7;tickRoSkillEffects(game,unit,7,api);assert.ok(hits.length<=RO_SKILL_EFFECT_LIMITS.zones);assert.equal(game.bonk.roSkillZones[0].x,2);assert.ok(enemy.hp<1000);
});

test('a ranged summon attacks over time, respects sight and cannot be resummoned during its lifetime',()=>{
 const{game,unit,enemy,blocked,api,hits}=arena(),summon=skill('summon',{duration:4,interval:1,summonCount:2,ranged:true,radius:2});assert.equal(castRoUtilitySkill(game,unit,summon,1,{},api),true);assert.equal(game.bonk.roSkillSummons.length,2);assert.equal(castRoUtilitySkill(game,unit,summon,1,{},api),false);
 for(let i=0;i<4;i++){game.bonk.elapsed=i;tickRoSkillEffects(game,unit,.1,api);}assert.ok(Math.abs(enemy.hp-900)<1e-8);assert.equal(blocked.hp,1000);assert.equal(hits.length,8);game.bonk.elapsed=4;tickRoSkillEffects(game,unit,.1,api);assert.equal(game.bonk.roSkillSummons.length,0);
});

test('summons have a separate six-entity cap without increasing normal enemy population',()=>{
 const{game,unit,api}=arena();for(let i=0;i<10;i++)castRoUtilitySkill(game,unit,skill('summon',{summonCount:3,ranged:true},{key:'summon-'+i}),1,{},api);assert.equal(game.bonk.roSkillSummons.length,6);assert.equal(game.units.length,3);
});

test('Back Sliding and offensive dashes sample collisions and give only a short invulnerability window',()=>{
 const{game,unit,api}=arena(),dash=skill('dash',{dashDistance:9,radius:2});assert.equal(castRoUtilitySkill(game,unit,dash,1,{},api),true);assert.equal(unit.x,5);assert.equal(unit.z,0);assert.equal(unit.bonkInvulnerableUntil,.18);
 const retreat=arena();assert.equal(castRoUtilitySkill(retreat.game,retreat.unit,skill('dash',{dashDistance:4,retreat:true}),1,{},retreat.api),true);assert.equal(retreat.unit.x,-4);
});

test('stuns, roots, slows and armor breaks are distinct and bosses cannot be stunlocked',()=>{
 const{game,unit,enemy,api}=arena(),control=skill('pulse',{status:{stun:2,root:3,slow:.6,armorBreak:.3,blind:.2},duration:5});applyRoSkillHit(game,unit,enemy,control,1,api);let state=roEnemySkillState(enemy,0);assert.equal(state.stunned,true);assert.equal(state.rooted,true);assert.equal(state.speedMultiplier,0);assert.equal(state.damageMultiplier,.8);assert.equal(state.damageTakenMultiplier,1.3);
 game.bonk.elapsed=3.5;state=roEnemySkillState(enemy,3.5);assert.equal(state.stunned,false);assert.equal(state.rooted,false);assert.equal(state.speedMultiplier,.4);
 const boss={...enemy,id:8,bonkBoss:true,roSkillControlReadyAt:0};game.bonk.elapsed=0;applyRoSkillHit(game,unit,boss,control,8,api);assert.equal(boss.roSkillStunUntil,.2);assert.equal(boss.roSkillRootUntil,.3);game.bonk.elapsed=.1;applyRoSkillHit(game,unit,boss,control,8,api);assert.equal(boss.roSkillStunUntil,.2);assert.equal(roEnemySkillState(boss,.4).stunned,false);assert.ok(roEnemySkillState(boss,.4).speedMultiplier>=.75);
});

test('poison uses the existing strongest-DOT fields instead of stacking unlimited independent ticks',()=>{
 const{game,unit,enemy,api}=arena(),poison=skill('slash',{status:{poison:4}});applyRoSkillHit(game,unit,enemy,poison,1,api);applyRoSkillHit(game,unit,enemy,poison,1,api);assert.equal(enemy.bonkPoisonDamage,10);assert.equal(enemy.bonkPoisonUntil,4);assert.equal(Object.keys(enemy.dots).length,1);assert.equal(enemy.dots.poison.until,4);
});

test('Enchant Poison buffs really poison weapon hits and the proc expires with the enchantment',()=>{
 const{game,unit,enemy,api}=arena(),enchant=skill('buff',{duration:5,chance:.35,status:{poison:3},modifiers:{damage:.1}},{key:'test-enchant'});assert.equal(castRoUtilitySkill(game,unit,enchant,1,{},api),true);
 applyRoSkillHit(game,unit,enemy,skill('slash',{}, {key:'basic'}),1,api);assert.equal(enemy.bonkPoisonUntil,3);assert.equal(enemy.bonkPoisonDamage,10);
 game.bonk.elapsed=.2;applyRoSkillHit(game,unit,enemy,skill('slash',{}, {key:'basic'}),1,api);assert.equal(enemy.bonkPoisonUntil,3,'one-second proc gate prevents every area hit extending it');
 game.bonk.elapsed=1.2;applyRoSkillHit(game,unit,enemy,skill('slash',{}, {key:'basic'}),1,api);assert.equal(enemy.bonkPoisonUntil,4.2);
 game.bonk.elapsed=6;applyRoSkillHit(game,unit,enemy,skill('slash',{}, {key:'basic'}),1,api);assert.equal(enemy.bonkPoisonUntil,4.2,'expired enchantment cannot keep poisoning');
});

test('lifesteal and mitigation are bounded even under extreme damage inputs',()=>{
 const{unit}=arena();applyRoSkillLifeSteal(unit,1e8,{lifeSteal:.12});assert.equal(unit.hp,207.5);assert.equal(roAbsorbSkillDamage(unit,100,0,{damageReduction:100}),60);unit.alive=false;applyRoSkillLifeSteal(unit,1e8,{lifeSteal:.12});assert.equal(unit.hp,207.5);
});

test('reset removes every transient summon, zone, shield and buff while retaining learned skills',()=>{
 const{game,unit}=arena();unit.roSkillBuffs=[{key:'a',until:10}];unit.roSkillShield={value:100,until:10};game.bonk.roSkillZones=[{}];game.bonk.roSkillSummons=[{}];resetRoSkillEffects(game,unit);assert.equal(unit.roSkillShield,undefined);assert.deepEqual(unit.roSkillBuffs,[]);assert.deepEqual(game.bonk.roSkillZones,[]);assert.deepEqual(game.bonk.roSkillSummons,[]);assert.deepEqual(unit.bonkBuild.weapons,{basic:1});
});
