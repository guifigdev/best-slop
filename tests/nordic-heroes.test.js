import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../shared/catalog.js';
import {NORDIC_HERO_ART,nordicHeroSpec,nordicHeroPortrait,buildNordicHeroModel} from '../src/nordic-hero-art.js';

test('six Nordic heroes retain catalog identities and bounded independent voxel silhouettes shared by models and portraits',()=>{
 assert.deepEqual(Object.keys(NORDIC_HERO_ART),Object.keys(HEROES));assert.deepEqual(Object.values(NORDIC_HERO_ART).map(h=>h.name),['Thor','Hel','Skadi','Tyr','Odin','Loki']);const bodies=new Set(),avatars=new Set();
 for(const key of Object.keys(HEROES)){const before=JSON.stringify(HEROES[key]),parts=[],spec=buildNordicHeroModel(key,{},(_parent,...p)=>parts.push(p));assert.equal(spec,nordicHeroSpec(key));assert.ok(Object.isFrozen(spec));assert.equal(spec.theme,'nordic-hero');assert.deepEqual(parts,spec.parts);assert.ok(parts.length<=100);assert.equal(spec.legs.length,2);assert.equal(spec.wings.length,0);assert.ok(spec.eyeLine<spec.height);assert.ok(spec.height<=3.4);
  for(const p of [...parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])]){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(v=>v>0));assert.ok(p[6]>=0&&p[6]<=0xffffff);}
  const svg=nordicHeroPortrait(key);assert.match(svg,/class="army-portrait nordic-hero-portrait"/);assert.doesNotMatch(svg,/NaN|Infinity|undefined|<image|<script|href=/i);assert.equal(svg,nordicHeroPortrait(key));bodies.add(JSON.stringify(parts));avatars.add(svg);assert.equal(JSON.stringify(HEROES[key]),before,'art does not mutate gameplay');
 }assert.equal(bodies.size,6);assert.equal(avatars.size,6);
});

test('Nordic skin dispatch rejects unknown and prototype keys without taking over other games or animal NPCs',()=>{
 for(const key of ['__proto__','missing','constructor','ent','heretic',null,{}]){assert.equal(nordicHeroSpec(key),null);assert.equal(nordicHeroPortrait(key),'');assert.equal(buildNordicHeroModel(key,null,()=>assert.fail()),null);}
 for(const entry of Object.values(NORDIC_HERO_ART)){assert.deepEqual(Object.keys(entry),['name','title','description']);assert.ok(Object.isFrozen(entry));}
});
