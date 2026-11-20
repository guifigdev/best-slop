import test from 'node:test';
import assert from 'node:assert/strict';
import {CASTLE_SUPPORT_BUILDINGS as PATCHES,CASTLE_SUPPORT_REFERENCE as REF,CASTLE_SUPPORT_SUMMONS as SUMMONS} from '../shared/castle-support-data.js';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {castleSupportEffectSupported} from '../shared/castle-support.js';

test('every previously blocked support building has an executable effect, source attribution and useful player description',()=>{
 assert.equal(Object.keys(PATCHES).length,31);
 for(const [key,patch]of Object.entries(PATCHES)){
  assert.ok(CASTLE_BUILDINGS[key],key);assert.equal(patch.playable,true);assert.ok(castleSupportEffectSupported(patch.castleEffect),key);
  assert.ok(patch.description.length>60);assert.equal(patch.castleEffect.description,patch.description);
  assert.ok(patch.supportReference.abilityIds.length);assert.ok(patch.supportReference.confirmed.length);assert.equal(patch.supportReference.rawId,CASTLE_BUILDINGS[key].rawId);
  assert.doesNotMatch(patch.description,/indisponível|não implementado/);
 }
});
test('Freezing Blast follows the executed spell override instead of its stale native tooltip',()=>{
 const e=PATCHES.north_h047.castleEffect;assert.equal(e.damage,300);assert.equal(e.damage,REF.chillingMushroom.damage);assert.notEqual(e.damage,REF.chillingMushroom.tooltipDamage);
 assert.equal(e.targetsGround,false);assert.equal(e.targetsAir,true);assert.equal(e.singleTarget,true);assert.equal(e.duration,5);assert.equal(e.interval,8);
 assert.ok(PATCHES.north_h047.supportReference.abilityIds.includes('A0AK'));assert.equal(PATCHES.human_h010.castleEffect.moveSpeed,0,'native haste does not invent a movement buff');
});
test('raised monsters use real inherited weapon profiles and stationary tentacles keep their native timed life',()=>{
 assert.equal(SUMMONS.u002.hp,275);assert.equal(SUMMONS.u002.damage,26.5);assert.equal(SUMMONS.n00D.targetsAir,true);assert.equal(SUMMONS.u002.targetsAir,false);
 assert.equal(SUMMONS.n01C.speed,0);assert.equal(SUMMONS.n01C.duration,9);assert.equal(SUMMONS.n01C.damage,21);
 assert.equal(PATCHES.undead_h01P.castleEffect.summons.length,3);assert.equal(PATCHES.undead_h056.castleEffect.summons.length,6);
 assert.equal(PATCHES.undead_h01P.castleEffect.general.rawId,'n00C');assert.equal(PATCHES.undead_h056.castleEffect.general.rawId,'n01M');
 for(const s of Object.values(SUMMONS))for(const field of ['hp','damage','armor','range','speed','interval'])assert.ok(Number.isFinite(s[field]),s.rawId+' '+field);
});
