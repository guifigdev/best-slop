import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS} from '../shared/catalog.js';
import {RAGNAROK_DARK_EXPANSION as refs} from '../shared/ragnarok-dark-expansion.js';
import {ragnarokDarkExpansionSpec as spec,RAGNAROK_DARK_EXPANSION_KINDS as kinds} from '../src/ragnarok-dark-expansion-art.js';

test('thirty-two dark and elemental sprite reconstructions are immutable, unique, bounded and correctly named',()=>{
 assert.equal(refs.length,32);assert.equal(kinds.length,32);assert.equal(new Set(refs.map(r=>r.id)).size,32);const signatures=new Set();
 for(const r of refs){
  const m=spec(r.key),all=[...m.parts,...m.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...m.wings.flatMap(w=>w.parts)];
  assert.equal(m,spec(r.key));assert.ok(Object.isFrozen(m)&&Object.isFrozen(m.parts)&&Object.isFrozen(m.legs));assert.equal(m.key,r.key);
  assert.ok(all.length>=45&&all.length<=500,r.key+': '+all.length);assert.ok(m.height>1&&m.height<4);assert.ok(m.eyeLine>0&&m.eyeLine<m.height);assert.ok(Number.isFinite(m.fur));
  for(const p of all){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite),r.key);for(const size of p.slice(3,6))assert.ok(size>0,r.key);assert.ok(Number.isInteger(p[6])&&p[6]>=0&&p[6]<=0xffffff);}
  assert.notEqual(r.name.toLowerCase(),r.sourceName.toLowerCase());assert.ok(SKILLS[r.skill],r.key+': '+r.skill);assert.ok(r.unlockWave>=2&&r.unlockWave<=40);assert.ok(r.biomes.length&&Object.isFrozen(r.biomes));
  signatures.add(JSON.stringify(all));
 }
 assert.equal(signatures.size,32);assert.equal(spec('__proto__'),null);assert.equal(spec('poring'),null);assert.equal(spec(undefined),null);
});

test('skeletal ranks, mounted knight, marine creatures and spirits retain their anatomical signatures',()=>{
 assert.equal(spec('skeleton').legs.length,2);assert.equal(spec('orcskeleton').legs.length,2);
 assert.equal(spec('abyssknight').legs.length,6,'horse four legs and rider two legs share the rig');assert.ok(spec('abyssknight').height>spec('raydric').height+.5);
 assert.equal(spec('nightmare').legs.length,4);assert.equal(spec('ninetails').legs.length,4);assert.equal(spec('galion').legs.length,4);
 for(const k of ['marse','swordfish','obeaune','iceicle','horong','penomena']){assert.equal(spec(k).legs.length,0,k);assert.equal(spec(k).motion,'float');}
 assert.equal(spec('marionette').motion,'float');assert.ok(spec('marionette').parts.some(p=>p[1]>2.9&&p[3]>1),'wooden puppet control cross remains above the doll');
 for(const k of ['imp','deviruchi']){assert.equal(spec(k).wings.length,2);for(const w of spec(k).wings)assert.ok(w.parts.length>=5&&w.pivot.every(Number.isFinite));}
 assert.equal(spec('iceicle').parts.length,50,'five tapered crystals each use nine levels and a pointed cap');
 assert.ok(spec('magmaring').flames.length>=7);assert.ok(spec('horong').flames.length>0);assert.ok(spec('imp').flames.length>0);
 const bounds=k=>Math.max(...spec(k).parts.map(p=>p[2]+p[5]/2));assert.ok(bounds('swordfish')>1.7,'extended tapered sword bill is part of the body');
 assert.ok(spec('ninetails').parts.filter(p=>p[2]<-.9).length>60,'nine separate tails fan behind the fox');
});
