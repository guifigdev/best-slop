import test from 'node:test';
import assert from 'node:assert/strict';
import {CASTLE_UNITS} from '../shared/castle-catalog.js';
import {KODO_TAG_UNITS} from '../shared/kodo-tag-catalog.js';
import {TREE_TAG_CHARACTERS} from '../shared/tree-tag-catalog.js';
import {ragnarokMonsterSpec} from '../src/ragnarok-monster-art.js';
import {castleUnitVisual,castleUnitPortrait,castleUnitModelKey,buildCastleUnitModel} from '../src/castle-unit-art.js';
import {tagCharacterSpec,tagCharacterPortrait,buildTagCharacter} from '../src/tag-character-art.js';
import {legacyCharacterSpec,legacyCharacterPortrait,buildLegacyCharacterModel} from '../src/legacy-character-art.js';

test('compatible Castle creatures share referenced sculptures and native identity without changing any combat fields',()=>{
 const before=JSON.stringify(CASTLE_UNITS);
 for(const [raw,reference]of [['n01X','golem'],['n024','golem'],['n01I','willow'],['n027','elderwillow'],['u001','whisper'],['n019','whisper'],['n00B','mummy'],['n01K','mummy'],['u007','mummy'],['n012','icetitan'],['n013','icetitan'],['n011','siroma']]){
  const visual=castleUnitVisual(raw),source=ragnarokMonsterSpec(reference),drawn=[];
  assert.equal(visual.ragnarokVisual,reference);assert.equal(visual.key,raw);assert.equal(visual.name,CASTLE_UNITS[raw].name.trim());if(visual.visualRank){assert.deepEqual(visual.parts.slice(0,source.parts.length),source.parts);assert.ok(visual.parts.length>source.parts.length,'an upgrade adds actual ornaments');}else assert.equal(visual.parts,source.parts);assert.equal(visual.legs,source.legs);assert.equal(visual.wings,source.wings);assert.ok(visual.height>=source.height);assert.equal(visual.vehicle,false);
  assert.equal(castleUnitModelKey({castleUnit:true,unitKey:raw}),`castle:${raw}`);assert.equal(buildCastleUnitModel({castleUnit:true,unitKey:raw},{},(_,...p)=>drawn.push(p)),visual);assert.deepEqual(drawn,visual.parts);assert.match(castleUnitPortrait(raw),/<polygon/);assert.equal(castleUnitPortrait(raw),castleUnitPortrait({unitKey:raw}));
 }
 assert.equal(JSON.stringify(CASTLE_UNITS),before);
 for(const raw of ['hfoo','hrif','h06Q','h06T','u005','n01F'])assert.equal(castleUnitVisual(raw).ragnarokVisual,undefined,'humans, casters and vehicles retain their appropriate bodies');
});
test('Kodo archers and Tree Ents reuse matching rigs and portraits, preserving native protagonists and rules',()=>{
 const before=JSON.stringify([KODO_TAG_UNITS,TREE_TAG_CHARACTERS]),archer=tagCharacterSpec('soldier:hC12'),tree=legacyCharacterSpec('tree:ent'),drawn=[];
 assert.equal(archer.parts,ragnarokMonsterSpec('archerskeleton').parts);assert.equal(archer.legs.length,2);assert.equal(tree.parts,ragnarokMonsterSpec('willow').parts);assert.equal(tree.legs.length,2);assert.equal(buildTagCharacter({kodoTagSoldier:true,unitKey:'hC12'},{},(_,...p)=>drawn.push(p)),archer);assert.deepEqual(drawn,archer.parts);
 const treeDraw=[];assert.equal(buildLegacyCharacterModel({treeTagCharacter:'ent'},{},(_,...p)=>treeDraw.push(p)),tree);assert.deepEqual(treeDraw,tree.parts);assert.match(tagCharacterPortrait('soldier:hC12'),/<polygon/);assert.match(legacyCharacterPortrait('treetag','ent'),/<polygon/);
 for(const raw of ['runner','kodo:oC06','worker:hC19','soldier:hC10','tree-worker:uC43'])assert.equal(tagCharacterSpec(raw).ragnarokVisual,undefined);
 for(const raw of ['tree:blaze','tree:pyra','tree:burnin','warlock:warlock'])assert.equal(legacyCharacterSpec(raw).ragnarokVisual,undefined);
 assert.equal(JSON.stringify([KODO_TAG_UNITS,TREE_TAG_CHARACTERS]),before);
});
