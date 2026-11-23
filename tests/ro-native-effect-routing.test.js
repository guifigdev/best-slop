import test from 'node:test';
import assert from 'node:assert/strict';
import {roNativePrefetchKeys,roNativePrefetchFiles,roNativeLegacyState,roNativeBuffDeadlines} from '../src/ro-native-effect-routing.js';

test('prefetch selects equipped original STR files without fetching every learned skill',()=>{
 const state={options:{mode:'bonk'},units:[{id:1,bonkHero:true,bonkBuild:{weapons:{basic:1,hammerfall:1,stormgust:1}},bonkSkillSlots:['basic','hammerfall']}]},manifest={skills:{hammerfall:{phases:{cast:[{type:'STR',file:'crashearth'},{type:'STR',file:'crashearth'}]}},stormgust:{phases:{ground:[{type:'STR',file:'stormgust'}]}}},effects:{crashearth:{},stormgust:{}}};
 assert.deepEqual(roNativePrefetchFiles(state,manifest),['crashearth']);assert.deepEqual(roNativePrefetchFiles({...state,options:{mode:'castlefight'}},manifest),[]);
});
test('native routing removes only reserved friendly cosmetics and preserves enemy warning masks',()=>{
 const effects=[{id:1,bonk:true,type:'abilityPulse',source:7,skillKey:'hammerfall'},{id:2,bonk:true,type:'bossDanger'},{id:3,bonk:true,type:'bossImpact'},{id:4,type:'heal'},{id:5,bonk:true,type:'fireball',skillKey:'fireball'}],state={options:{mode:'bonk'},units:[{id:7}],bonk:{roSkillZones:[]},effects},native={handles:(event,source)=>event.id===1&&source.id===7};
 const result=roNativeLegacyState(state,native);assert.deepEqual(result.effects.map(e=>e.id),[2,3,4,5]);assert.equal(state.effects.length,5);assert.equal(roNativeLegacyState(state,{handles:()=>false}),state);
});
test('a fully reserved native zone replaces its old fill and repeated tick pulse without mutating the simulation',()=>{
 const zone={id:8,key:'stormgust',x:2,z:3,until:12},state={options:{mode:'bonk'},bonk:{roSkillZones:[zone,{...zone,id:9,key:'poison'}]},effects:[{id:1,type:'abilityPulse',bonk:true,skillKey:'stormgust',x:2,z:3},{id:2,type:'abilityPulse',bonk:true,skillKey:'stormgust',x:20,z:30}]},native={handles:()=>false,handlesZone:id=>id===8};
 const before=JSON.stringify(state),result=roNativeLegacyState(state,native);assert.deepEqual(result.bonk.roSkillZones.map(z=>z.id),[9]);assert.deepEqual(result.effects.map(e=>e.id),[2]);assert.equal(JSON.stringify(state),before);
});
test('a native impact can accompany the approved sword trail without replacing its attack animation',()=>{
 const event={id:1,type:'roAttack',bonk:true,skillKey:'bash'},state={options:{mode:'bonk'},effects:[event]},native={handles:()=>true};
 assert.equal(roNativeLegacyState(state,native,{preserveAttackTrail:e=>e.type==='roAttack'}),state);
});
test('a complete native area cast replaces its redundant generic pulse but not a later projectile impact',()=>{
 const cast={id:1,type:'roAttack',bonk:true,skillKey:'hammerfall',source:7,attackKind:'pulse',time:1},pulse={id:2,type:'abilityPulse',bonk:true,skillKey:'hammerfall',source:7,time:1},projectile={id:3,type:'fireball',bonk:true,skillKey:'fireball',source:7,time:1},state={options:{mode:'bonk'},effects:[cast,pulse,projectile]},native={handles:e=>e.id===1};
 assert.deepEqual(roNativeLegacyState(state,native).effects.map(e=>e.id),[3]);
});
test('long original support visuals stop at the real buff expiry while short one-shots retain their own duration',()=>{
 const state={time:100,bonk:{elapsed:5}},unit={roSkillBuffs:[{key:'al_pneuma',until:13}]},long={file:'pneuma1',skillKey:'al_pneuma',time:100},short={...long,file:'short'},assets={pneuma1:{duration:10.3},short:{duration:1.2}};
 const result=roNativeBuffDeadlines([long,short],unit,state,assets);assert.equal(result[0].until,108);assert.equal(result[1],short);assert.equal(long.until,undefined);
});
test('the four displayed upgrade choices warm new animations before selection without downloading every stored ability',()=>{
 const state={options:{mode:'bonk'},units:[{bonkHero:true,bonkBuild:{weapons:{basic:1,hammerfall:1,stormgust:1}},bonkSkillSlots:['basic','hammerfall']}],bonk:{offer:{choices:[{kind:'weapon',key:'al_pneuma'},{kind:'tome',key:'damage'},{kind:'weapon',key:'basic'}]}}};
 assert.deepEqual(roNativePrefetchKeys(state),['hammerfall','al_pneuma']);
});
