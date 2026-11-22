import test from 'node:test';
import assert from 'node:assert/strict';
import {ANIMAL_SCULPTURE_KINDS,animalSculptureSpec} from '../src/animal-sculptures.js';
import {detailedMonsterSpec,buildMonster} from '../src/monster-art.js';
import {armyPortrait} from '../src/army-art.js';
test('old animals and mythical beasts have distinct detailed bounded sculptures shared by gameplay and portraits',()=>{
 const kinds=[...ANIMAL_SCULPTURE_KINDS,'raven','griffin','chimera','dragon','sphinx','valkyrie','phoenix','frostwyrm','basilisk'],shapes=new Set();
 for(const kind of kinds){const spec=detailedMonsterSpec(kind),emitted=[];assert.equal(buildMonster(kind,{},(_body,...p)=>emitted.push(p)),spec);assert.deepEqual(emitted,spec.parts);assert.ok(Object.isFrozen(spec));assert.ok(spec.parts.length>=150&&spec.parts.length<1300,kind+':'+spec.parts.length);assert.ok(spec.eyeLine<spec.height);
  for(const p of [...spec.parts,...spec.wings.flatMap(w=>w.parts)]){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite),kind);assert.ok(p.slice(3,6).every(v=>v>0),kind);}
  const svg=armyPortrait(kind);assert.match(svg,/detailed-creature-portrait/);assert.doesNotMatch(svg,/NaN|Infinity|undefined|<image|<script/);assert.equal(armyPortrait(kind),svg);shapes.add(JSON.stringify(spec.parts));
 }
 assert.equal(shapes.size,kinds.length);assert.equal(animalSculptureSpec('__proto__'),null);assert.equal(detailedMonsterSpec('missing'),null);
});
