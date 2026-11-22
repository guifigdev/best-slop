import test from 'node:test';
import assert from 'node:assert/strict';
import {RAGNAROK_VOXEL_REFERENCES as refs} from '../shared/monster-visual-references.js';
import {RO_HABITATS,RO_HABITAT_BY_KEY,MONSTER_HABITATS,monsterHabitats,habitatSpecies} from '../shared/ragnarok-habitats.js';
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};

test('every388 concrete Ragnarok sculpture has a curated ecological domain, tier and source identity',()=>{
 assert.equal(Object.keys(refs).length,388);assert.deepEqual(Object.keys(MONSTER_HABITATS).sort(),Object.keys(refs).sort());assert.equal(RO_HABITATS.length,10);frozen(MONSTER_HABITATS);frozen(RO_HABITATS);
 for(const [key,m]of Object.entries(MONSTER_HABITATS)){
  assert.equal(m.key,key);assert.equal(m.sourceId,refs[key].id);assert.equal(m.sourceName,refs[key].sourceName);assert.equal(m.curated,true);assert.ok(m.ecologyRule&&m.provenance);
  assert.ok(m.habitats.length>0&&m.habitats.length<=3);assert.equal(m.primary,m.habitats[0]);for(const h of m.habitats)assert.ok(RO_HABITAT_BY_KEY[h]);
  assert.ok([1,2,3].includes(m.tier));assert.ok(['swarm','skirmisher','ranged','heavy','caster','flyer'].includes(m.role),key+': '+m.role);assert.equal(m.bossOnly,m.bossKind!==null);assert.ok([null,'mvp','miniboss'].includes(m.bossKind));
 }
 assert.deepEqual(new Set(RO_HABITATS.map(h=>h.scene)),new Set(['grove','payon','forge','glacier','sands','coast','crypt','geffen']));
});

test('explicit player ecology requests override broad legacy combat-biome tags',()=>{
 assert.deepEqual(monsterHabitats('poring').habitats,['meadow','forest']);
 assert.deepEqual(monsterHabitats('spore').habitats,['forest']);assert.deepEqual(monsterHabitats('poporing').habitats,['cave']);assert.deepEqual(monsterHabitats('tarou').habitats,['cave']);
 assert.deepEqual(monsterHabitats('imp').habitats,['firecave']);
 for(const key of ['icetitan','tower_1777','gazeti','siroma'])assert.deepEqual(monsterHabitats(key).habitats,['icecave']);
 for(const key of ['mystcase','chepet','cookie','cruiser']){
  assert.deepEqual(monsterHabitats(key).habitats,['arcane','ruins']);
  assert.ok(!habitatSpecies('icecave').includes(key),'enchanted factory toys do not become ice-cave wildlife: '+key);
 }
 for(const key of ['snowier','siroma','gazeti','icetitan','tower_1777','marin','iceicle','tower_1243','tower_1515','freezer'])assert.ok(habitatSpecies('icecave').includes(key),'glacial native remains available: '+key);
 assert.ok(monsterHabitats('stormyknight').habitats.includes('icecave'),'Stormy Knight has glacial storm physiology, unlike ordinary toys');
 for(const key of ['hydra','marina','merman','swordfish'])assert.equal(monsterHabitats(key).primary,'coast');
 assert.ok(!monsterHabitats('minorous').habitats.includes('firecave'),'Sphinx minotaurs are not assigned volcanic habitat only because their element is fire');
 for(const key of ['hatii','tower_1515','marin'])assert.ok(!habitatSpecies('forest').includes(key),'winter creatures do not enter generic temperate forest pools');
 assert.equal(monsterHabitats('rat'),monsterHabitats('tarou'));assert.equal(monsterHabitats('cavebat'),monsterHabitats('familiar'));assert.equal(monsterHabitats('slime'),monsterHabitats('poring'));
 for(const bad of ['__proto__','constructor','unclassified_monster',null,undefined,12])assert.equal(monsterHabitats(bad),null);
});

test('native encounter pools progress cumulatively by tier and never insert bosses or generic aliases into ordinary waves',()=>{
 for(const h of RO_HABITATS){
  const early=habitatSpecies(h.key,{tier:1}),mid=habitatSpecies(h.key,{tier:2}),late=habitatSpecies(h.key),bosses=habitatSpecies(h.key,{bosses:true});
  assert.ok(early.length&&mid.length&&late.length&&bosses.length,h.key);assert.equal(early,habitatSpecies(h.key,{tier:1}));assert.ok(Object.isFrozen(early));
  for(const key of early)assert.ok(mid.includes(key));for(const key of mid)assert.ok(late.includes(key));
  for(const key of late){const m=monsterHabitats(key);assert.ok(Object.hasOwn(refs,key));assert.ok(m.habitats.includes(h.key));assert.equal(m.bossOnly,false);}
  for(const key of bosses){const m=monsterHabitats(key);assert.ok(m.habitats.includes(h.key));assert.equal(m.bossOnly,true);assert.ok(!late.includes(key));}
  assert.ok(early.every(key=>monsterHabitats(key).tier===1));assert.ok(mid.every(key=>monsterHabitats(key).tier<=2));
 }
 assert.equal(monsterHabitats('angeling').bossKind,'miniboss');assert.equal(monsterHabitats('tower_1090').bossKind,'miniboss');assert.equal(monsterHabitats('ifrit').bossKind,'mvp');
 assert.ok(habitatSpecies('meadow',{bosses:true}).every(key=>monsterHabitats(key).bossKind==='miniboss'),'the meadow does not invent a Ragnarok MVP');
 assert.ok(!habitatSpecies('firecave',{tier:1}).includes('salamander'));assert.ok(habitatSpecies('firecave',{tier:3}).includes('salamander'));
 assert.deepEqual(habitatSpecies('unknown'),[]);assert.deepEqual(habitatSpecies('__proto__'),[]);assert.equal(habitatSpecies('cave',{tier:NaN}),habitatSpecies('cave'));
});
