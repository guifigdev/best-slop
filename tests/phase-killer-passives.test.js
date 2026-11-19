import test from 'node:test';
import assert from 'node:assert/strict';
import {phaseKillerPassiveProfile as profile,phaseKillerResolveAttack as attack,phaseKillerMitigatePhysical as mitigate,phaseKillerInvisible as invisible} from '../shared/phase-killer-passives.js';

const u=extra=>({alive:true,damage:40,mana:50,range:1,skills:[],inventory:[],...extra});
const item=key=>({key,charges:0});
const near=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} ≠ ${b}`);

test('Power Strike uses the actual critical multiplier and flat proc, never doubles snapshot/item passives',()=>{
 const source=u({inventory:[item('I02M')],skills:['A04J'],pkEquipmentStats:{criticalChance:.25,criticalMultiplier:1.25,bonusDamage:5,evasion:.1}}),target=u();
 const critical=attack({source,target,random:()=>0});assert.equal(critical.critical,true);assert.equal(critical.damage,50);assert.equal(critical.magicBonusDamage,5);near(profile(source).evasion,.1);
 const regular=attack({source,target,random:()=>.9});assert.equal(regular.damage,40);assert.equal(regular.magicBonusDamage,0);
});

test('evasion cancels the attack and all attack effects rather than allowing lifesteal or cleave on a miss',()=>{
 const source=u({inventory:[item('I02D'),item('I02N')]}),target=u({inventory:[item('I02M')]});
 const result=attack({source,target,random:()=>0});assert.equal(result.miss,true);for(const key of ['damage','healingFactor','cleaveFactor','manaBurn','magicBonusDamage'])assert.equal(result[key],0);
 const hit=attack({source,target,random:()=>.99});assert.equal(hit.damage,40);assert.equal(hit.cleaveFactor,.5);assert.equal(hit.cleaveRadius,1.5625);near(hit.healingFactor,.35);
});

test('Hardened Skin honors native chance, blocked amount and residual floor without increasing small attacks',()=>{
 const target=u({inventory:[item('I00O')]});assert.equal(mitigate(target,20,()=>0),12);assert.equal(mitigate(target,5,()=>0),2);assert.equal(mitigate(target,1,()=>0),1);assert.equal(mitigate(target,20,()=>.9),20);
 const spare=u({inventory:[item('I00N'),item('I00O')]});near(profile(spare).blockChance,.4);assert.equal(profile(spare).blockAmount,6);assert.equal(mitigate(spare,20,()=>.5),20);
});

test('Rending Blow and melee aura lifesteal respect melee attacks while Energy Sphere lifesteal permits ranged',()=>{
 const melee=u({inventory:[item('I02D'),item('I034'),item('I02N')]});near(profile(melee).healingFactor,.68);assert.equal(profile(melee).cleaveFactor,.5);
 const ranged={...melee,range:6.25};near(profile(ranged).healingFactor,.33);assert.equal(profile(ranged).cleaveFactor,0);
 const snapshot=u({inventory:[item('I034')],pkEquipmentStats:{lifesteal:.33000001311302185}});near(profile(snapshot).healingFactor,.33);
});

test('Unnatural Strength procs the native bash and Staff of Energy uses its attached Mana Burn rather than unused Feedback',()=>{
 const result=attack({source:u({skills:['A05Y']}),target:u(),random:()=>0});assert.equal(result.bash,true);assert.equal(result.stunDuration,1);assert.equal(result.magicBonusDamage,5);assert.equal(result.damage,40);
 assert.equal(attack({source:u({skills:['A05Y']}),target:u(),random:()=>.9}).bash,false);
 const source=u({inventory:[item('I02E')]}),target=u({mana:3});assert.equal(attack({source,target,random:()=>0}).manaBurn,3);assert.equal(attack({source,target,random:()=>.9}).manaBurn,0);assert.equal(attack({source,target:u({mana:50}),random:()=>0}).manaBurn,7.5);
});

test('Creep only conceals idle nighttime units after its native fade; active invisibility is independent',()=>{
 const stalker=u({inventory:[item('I02X')],pkLastMoveAt:4,attackAt:2,castAt:1});assert.equal(invisible(stalker,4.9),false);assert.equal(invisible(stalker,5),true);assert.equal(invisible({...stalker,moving:true},10),false);assert.equal(invisible(stalker,10,{night:false}),false);
 assert.equal(invisible({...stalker,attackAt:9.5},10),false);assert.equal(invisible({...stalker,castAt:9.5},10),false);assert.equal(invisible(u({pkInvisibleUntil:12,moving:true}),10,{night:false}),true);assert.equal(invisible(u({pkInvisibleUntil:12,pkGhost:true}),10),false);
});

test('Staff of Death attaches the native five-second Cripple on its 50% orb proc and spare weapons do not apply it',()=>{
 const source=u({inventory:[item('I02C')]}),target=u();
 const debuff=attack({source,target,random:()=>0}).cripple;assert.equal(debuff.duration,5);near(debuff.moveSlow,.33);near(debuff.attackSlow,.25);near(debuff.damageReduction,.25);
 assert.equal(attack({source,target,random:()=>.9}).cripple,null);
 assert.equal(attack({source:u({inventory:[item('I02E'),item('I02C')]}),target,random:()=>0}).cripple,null);
 const evading=u({inventory:[item('I02M')]});assert.equal(attack({source,target:evading,random:()=>0}).cripple,null);
});

test('invalid amounts and inactive units produce finite zero packets without mutations',()=>{
 const source=u({skills:['A04J']}),target=u(),before=JSON.stringify([source,target]);for(const amount of [NaN,Infinity,-1])assert.equal(attack({source,target,amount}).damage,0);assert.equal(mitigate(target,NaN),0);assert.equal(attack({source:{...source,pkGhost:true},target}).damage,0);assert.equal(attack({source,target:{...target,alive:false}}).damage,0);assert.equal(JSON.stringify([source,target]),before);assert.equal(invisible(null,10),false);
});
