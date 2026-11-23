import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_NATIVE_EFFECT_MANIFEST as manifest} from '../src/ro-native-effect-assets.js';
import {roNativeEffectRows,roNativeSkillPolicy,roNativeEventPhases,roNativeEventRequests,roNativeRequestsForState} from '../shared/ro-native-effect-policy.js';

const unit={id:7,x:12,z:14,bonkHero:true},target={id:8,x:17,z:20,bonkEnemy:true};
const event=(key,extra={})=>({id:31,type:'roAttack',skillKey:key,source:7,target:8,x:12,z:14,tx:17,tz:20,time:10,bonk:true,...extra});
test('RO source IDs resolve independently from effect IDs and aliases use the imported skill map',()=>{
 assert.equal(roNativeSkillPolicy('BS_HAMMERFALL',manifest).key,'hammerfall');assert.equal(roNativeSkillPolicy(110,manifest).key,'hammerfall');assert.equal(roNativeSkillPolicy('ro_meteor',manifest).key,'wz_meteor');assert.equal(roNativeEffectRows('hammerfall','cast',manifest)[0].effectId,102);assert.equal(roNativeSkillPolicy('basic',manifest),null);
});
test('HammerFall uses original crashearth timeline once and never requests the camera-quad FUNC',()=>{
 const requests=roNativeEventRequests(event('hammerfall',{attackKind:'pulse'}),unit,manifest);assert.equal(requests.length,1);assert.equal(requests[0].file,'crashearth');assert.equal(requests[0].effectId,102);assert.equal(requests[0].anchor,'source');assert.equal(requests[0].x,12);assert.equal(roNativeEventRequests(event('hammerfall',{type:'abilityPulse',attackKind:'pulse'}),unit,manifest).length,0);assert.equal(requests[0].part.type,'STR');
});
test('a pulse with a whole-animation cast reuses the admitted launch clip rather than adding a generic floor effect',()=>{
 const launch=event('hammerfall',{attackKind:'pulse'}),pulse=event('hammerfall',{id:32,type:'abilityPulse',target:undefined,attackKind:'pulse'}),state={effects:[launch,pulse]},a=roNativeEventRequests(launch,unit,manifest,{state}),b=roNativeEventRequests(pulse,unit,manifest,{state});assert.deepEqual(b,a);assert.equal(b[0].file,'crashearth');
});
test('each %d group chooses exactly one available variant deterministically without gameplay randomness',()=>{
 for(const key of ['wz_meteor','al_pneuma'])for(let i=0;i<20;i++){const phase=key==='wz_meteor'?'cast':'ground',a=roNativeEffectRows(key,phase,manifest,{variantSeed:i}),b=roNativeEffectRows(key,phase,manifest,{variantSeed:i});assert.equal(a.length,1);assert.deepEqual(a,b);assert.ok(manifest.effects[a[0].file]);}
});
test('projectile launches cannot render an impact at the target before the projectile arrives',()=>{
 assert.deepEqual(roNativeEventPhases(event('mg_fireball',{attackKind:'projectile'}),{kind:'projectile'}),['cast']);const synthetic={skills:{shot:{phases:{cast:[],hit:[{type:'STR',file:'hit'}]}}},effects:{hit:{duration:1}}};assert.deepEqual(roNativeEventRequests(event('shot',{attackKind:'projectile'}),unit,synthetic),[]);assert.equal(roNativeEventRequests(event('shot',{type:'fireball',target:undefined,x:17,z:20,radius:3}),unit,synthetic)[0].x,17);
});
test('target-side cast rows such as Lightning Bolt appear at contact, never on the mage or prematurely on its target',()=>{
 const launch=event('mg_lightningbolt',{attackKind:'projectile'});assert.equal(roNativeEventRequests(launch,unit,manifest).length,0);const r=roNativeEventRequests(event('mg_lightningbolt',{type:'roSkillImpact',x:17,z:20,radius:0}),unit,manifest,{state:{units:[unit,target]}});assert.ok(r.some(v=>v.file==='lightning'));assert.ok(r.every(v=>v.x===17&&v.z===20&&v.anchor==='target'));assert.equal(r.filter(v=>v.file.startsWith('windhit')).length,1);
});
test('a per-victim status echo and explicit projectile contact share one clip rather than double-playing the same original hit',()=>{
 const hit=event('firebolt',{id:71,type:'roSkillImpact',x:17,z:20,radius:0}),status=event('firebolt',{id:72,type:'fireball',x:17,z:20,radius:1,duration:.3}),state={effects:[status,hit]};assert.deepEqual(roNativeEventRequests(status,unit,manifest,{state}),roNativeEventRequests(hit,unit,manifest,{state}));assert.equal(roNativeEventRequests(hit,unit,manifest,{state}).length,1);
});
test('physical Bash trail stays independent from native contact effects; basic and enemy attacks are untouched',()=>{
 const synthetic={skills:{bash:{sourceId:5,phases:{hit:[{type:'STR',file:'hit',attachedEntity:true}]}}},effects:{hit:{duration:1}}},r=roNativeEventRequests(event('bash',{attackKind:'slash'}),unit,synthetic,{state:{units:[unit,target]}})[0];assert.equal(r.anchor,'target');assert.equal(r.targetId,8);assert.equal(r.x,17);assert.equal(r.preserveAttackTrail,true);assert.equal(roNativeEventRequests(event('basic'),unit,synthetic).length,0);assert.equal(roNativeEventRequests(event('bash'),target,synthetic).length,0);assert.equal(roNativeEventRequests(event('bash',{type:'bossImpact'}),unit,synthetic).length,0);
});
test('utility-only skill events reach their original animation without a roAttack event',()=>{
 const r=roNativeEventRequests(event('al_pneuma',{type:'devotion',target:7}),unit,manifest);assert.equal(r.length,1);assert.match(r[0].file,/pneuma/);assert.equal(r[0].x,12);assert.equal(r[0].z,14);
});
test('per-victim burn/slow echoes cannot spawn cast/ground fields for every monster',()=>{
 const synthetic={skills:{field:{phases:{cast:[{type:'STR',file:'cast'}],hit:[{type:'STR',file:'hit'}],ground:[{type:'STR',file:'ground'}]}}},effects:{cast:{},hit:{},ground:{}}};const r=roNativeEventRequests(event('field',{type:'frostnova',radius:1,target:8}),unit,synthetic);assert.deepEqual(r.map(v=>v.phase),['hit']);
});
test('persistent field uses stable zone birth, world/encounter time offset and an unchanged loop between ticks',()=>{
 const zone={id:96,key:'wz_quagmire',source:7,x:30,z:35,until:15,weapon:{mechanics:{duration:5}}};const state={time:110,bonk:{elapsed:10,roSkillZones:[zone]},units:[unit,target]},a=roNativeRequestsForState(state,manifest);assert.equal(a.length,1);assert.equal(a[0].file,'quagmire');assert.equal(a[0].time,110);assert.equal(a[0].until,115);assert.equal(a[0].zoneId,96);assert.equal(a[0].groupId,'zone:96');assert.equal(a[0].anchor,'point');assert.equal(a[0].loop,true);const b=roNativeRequestsForState({...state,time:111,bonk:{...state.bonk,elapsed:11}},manifest);assert.equal(b[0].time,a[0].time);assert.equal(b[0].dedupeKey,a[0].dedupeKey);assert.deepEqual(roNativeEventRequests(event('wz_quagmire',{type:'abilityPulse',x:30,z:35,target:undefined}),unit,manifest,{state}),[]);assert.equal(roNativeRequestsForState({...state,bonk:{...state.bonk,elapsed:15}},manifest).length,0);
});
test('cast-column whole-field STRs anchor to the actual zone and traps/meteor do not become looping summons',()=>{
 const zones=['wz_vermilion','wz_meteor','ht_blastmine','hammerfall'].map((key,i)=>({id:i,key,source:7,x:30,z:35,until:15,weapon:{mechanics:{duration:5}}})),r=roNativeRequestsForState({time:10,bonk:{elapsed:10,roSkillZones:zones},units:[unit]},manifest);assert.deepEqual(r.map(v=>v.skillKey),['wz_vermilion']);assert.equal(r[0].file,'lord');assert.equal(r[0].x,30);
});
test('native primitive rows reuse phase/anchor policy while retaining distinct original descriptor parts',()=>{
 const synthetic={skills:{bash:{sourceId:5,phases:{hit:[{type:'2D',primitiveId:'a',file:'lens1'},{type:'2D',primitiveId:'b',file:'lens1'}]}}},parts:{a:{},b:{}}},r=roNativeEventRequests(event('bash',{attackKind:'slash'}),unit,synthetic,{types:['2D','CYLINDER','3D'],hasAsset:row=>!!synthetic.parts[row.primitiveId]});assert.equal(r.length,2);assert.deepEqual(r.map(v=>v.file),['a','b']);assert.equal(r[0].part.primitiveId,'a');
});
test('long-lived utility primitives end with the authoritative buff; STR one-shots retain their own original duration',()=>{
 const synthetic={skills:{al_angelus:{sourceId:33,sourceAegis:'AL_ANGELUS',phases:{cast:[{type:'CYLINDER',primitiveId:'barrier',duration:50000},{type:'STR',file:'wings'}]}}},parts:{barrier:{}},effects:{wings:{duration:1.2}}},u={...unit,roSkillBuffs:[{key:'AL_ANGELUS',until:18}]},state={time:110,bonk:{elapsed:10}},e=event('al_angelus',{type:'battlecry',target:7}),options={state,types:['STR','CYLINDER'],hasAsset:row=>row.type==='STR'?!!synthetic.effects[row.file]:!!synthetic.parts[row.primitiveId]},r=roNativeEventRequests(e,u,synthetic,options);assert.equal(r.find(v=>v.file==='barrier').until,118);assert.equal(r.find(v=>v.file==='wings').until,undefined);const expired=roNativeEventRequests(e,{...u,roSkillBuffs:[{key:'al_angelus',until:9}]},synthetic,options);assert.equal(expired.find(v=>v.file==='barrier').until,undefined);
});
