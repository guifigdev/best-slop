import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyCharacterModelKey,legacyCharacterSpec,buildLegacyCharacterModel,legacyCharacterPortrait} from '../src/legacy-character-art.js';
const tree=['ent','blaze','pyra','burnin'],mages=['warlock','heretic','occultist','inquisitor'];

test('Tree Tag treants, three infernals and four robed Warlocks have independent original voxel bodies',()=>{
 const bodies=new Set(),portraits=new Set();
 for(const [mode,keys,field]of [['tree',tree,'treeTagCharacter'],['warlock',mages,'warlockCharacter']])for(const kind of keys){
  const unit={[field]:kind},key=mode+':'+kind,parts=[];assert.equal(legacyCharacterModelKey(unit),key);const spec=buildLegacyCharacterModel(unit,{},(_body,...p)=>parts.push(p));
  assert.equal(spec,legacyCharacterSpec(key));assert.ok(Object.isFrozen(spec));assert.deepEqual(parts,spec.parts);assert.equal(spec.legs.length,2);assert.equal(spec.wings.length,0);assert.ok(parts.length<=80);
  for(const p of [...parts,...spec.legs.map(l=>[l.x,l.y,l.z,l.w,l.h,l.d,l.color])]){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(n=>n>0));}
  const svg=legacyCharacterPortrait(mode,kind);assert.ok(svg.startsWith('<svg'));assert.match(svg,/class="army-portrait legacy-character-portrait"/);assert.doesNotMatch(svg,/NaN|undefined|Infinity|<image|<script|href=/i);assert.equal(legacyCharacterPortrait(mode==='tree'?'treetag':mode,kind),svg);assert.equal(legacyCharacterPortrait(mode,kind),svg);
  bodies.add(JSON.stringify(parts));portraits.add(svg);
 }
 assert.equal(bodies.size,8);assert.equal(portraits.size,8);assert.ok(legacyCharacterSpec('tree:blaze').height>legacyCharacterSpec('tree:ent').height);
});

test('the legacy renderer dispatch leaves all existing heroes and unknown choices to their original model systems',()=>{
 for(const unit of [{hero:'knight'},{hero:'mage'},{castleBuilderKey:'orc'},{treeTagCharacter:'__proto__'},{treeTagCharacter:'missing'},{warlockCharacter:'ent'},{}]){
  assert.equal(legacyCharacterModelKey(unit),null);assert.equal(buildLegacyCharacterModel(unit,null,()=>assert.fail()),null);
 }
 for(const key of ['tree:missing','warlock:__proto__','castle:ent',null])assert.equal(legacyCharacterSpec(key),null);
 assert.equal(legacyCharacterPortrait('unknown','warlock'),'');
});
