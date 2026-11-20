import test from 'node:test';
import assert from 'node:assert/strict';
import {ragnarokNatureExpansionSpec as spec,RAGNAROK_NATURE_EXPANSION_KINDS as keys} from '../src/ragnarok-nature-expansion-art.js';
import {RAGNAROK_NATURE_EXPANSION as refs} from '../shared/ragnarok-nature-expansion.js';
import {SKILLS} from '../shared/catalog.js';
const total=s=>s.parts.length+s.legs.length+s.wings.reduce((n,w)=>n+w.parts.length,0);
test('32 nature reconstructions are cached immutable finite authored rigs with distinct geometry',()=>{
 assert.equal(keys.length,32);assert.equal(new Set(keys).size,32);const shapes=new Set();
 for(const key of keys){const s=spec(key);assert.equal(spec(key),s);assert.equal(s.key,key);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts)&&Object.isFrozen(s.legs)&&Object.isFrozen(s.wings));assert.ok(total(s)>=70&&total(s)<500,key+' bounded geometry');
  for(const p of [...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...s.wings.flatMap(w=>w.parts)]){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite),key);assert.ok(p.slice(3,6).every(n=>n>0));assert.ok(p[6]>=0&&p[6]<=0xffffff);assert.ok(Object.isFrozen(p)||s.legs.length>0);}
  assert.ok(s.height>.5&&s.height<3);assert.ok(s.eyeLine>=0&&s.eyeLine<s.height);shapes.add(JSON.stringify([s.parts.map(p=>p.slice(0,6)),s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d]),s.wings.map(w=>w.parts.map(p=>p.slice(0,6)))]));
 }
 assert.equal(shapes.size,32,'even related source species have authored anatomical differences');for(const key of ['unknown','__proto__',null,undefined])assert.equal(spec(key),null);
});
test('reference anatomy remains identifiable across insect, plant and mammal families',()=>{
 for(const k of ['vitata','deniro','pierre'])assert.equal(spec(k).legs.length,6,k+' has six animated legs');
 assert.equal(spec('fabre').legs.length,10);assert.equal(spec('creamy').wings.length,2);assert.equal(spec('chonchon').wings.length,4);assert.equal(spec('steelchonchon').wings.length,4);
 assert.ok(spec('pupa').height>2);assert.equal(spec('pupa').legs.length,0);assert.equal(spec('flora').legs.length,0);assert.equal(spec('rafflesia').legs.length,0);
 assert.ok(spec('caramel').parts.length>spec('yoyo').parts.length+100,'porcupine carries a real quilled back');assert.ok(spec('bigfoot').height>spec('smokie').height);assert.ok(spec('pecopeco').height>spec('picky').height);
 assert.ok(spec('horn').parts.some(p=>p[2]>1.2),'horned beetle has a long raised frontal horn');assert.ok(spec('lunatic').parts.some(p=>p[1]>1.8),'rabbit has tall ears');
});
test('adapted identities retain real source IDs and valid bounded gameplay metadata',()=>{
 assert.equal(refs.length,32);assert.equal(new Set(refs.map(r=>r.id)).size,32);for(const r of refs){assert.ok(keys.includes(r.key));assert.ok(Number.isInteger(r.id)&&r.id>1000);assert.notEqual(r.name.toLowerCase(),r.sourceName.toLowerCase());assert.ok(SKILLS[r.skill],r.skill);assert.ok(r.unlockWave>=2&&r.unlockWave<=30);assert.ok(r.biomes.length>0);assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.biomes));}
 for(const k of ['pupa','flora','rafflesia'])assert.equal(refs.find(r=>r.key===k).stationary,true);
});
