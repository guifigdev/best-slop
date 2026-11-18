import test from 'node:test';
import assert from 'node:assert/strict';
import {combatStatuses,negativeTint} from '../src/combat-status.js';

test('one active negative category gives a stable hue target',()=>{
 for(const [unit,key]of [[{dots:{burn:{until:12}}},'fire'],[{frostUntil:12},'frost'],[{dots:{poison:{until:12}}},'poison'],[{stun:.5},'stun']]){const tint=negativeTint(unit,10);assert.equal(tint.key,key);assert.ok(Number.isInteger(tint.color));assert.ok(tint.color>=0&&tint.color<=0xffffff);}
});
test('burn, lava and solar are one fire category',()=>{const u={dots:{burn:{until:12},lava:{until:14}},solarUntil:13};assert.equal(negativeTint(u,10).key,'fire');assert.equal(combatStatuses(u,10).filter(s=>s.key==='fire').length,1);});
test('frost sources and ability slow are one cold category',()=>{const u={frostUntil:12,dots:{frost:{until:14}},abilitySlowUntil:13};assert.equal(negativeTint(u,10).key,'frost');assert.equal(combatStatuses(u,10).filter(s=>s.key==='frost').length,1);});
test('two or more negative categories clear the body tint and preserve individual statuses',()=>{for(const u of [{dots:{burn:{until:12},poison:{until:12}}},{frostUntil:12,stun:1},{frostUntil:12,stun:1,dots:{burn:{until:12},poison:{until:12}}}]){assert.equal(negativeTint(u,10),null);assert.ok(combatStatuses(u,10).length>=2);}});
test('rage, shield and reflection do not count as negative effects',()=>{const positive={rageUntil:12,shieldUntil:12,shield:100,itemReflectUntil:12};assert.equal(negativeTint(positive,10),null);assert.equal(negativeTint({...positive,dots:{poison:{until:12}}},10).key,'poison');assert.equal(combatStatuses(positive,10).length,3);});
test('effects expire at their deadline and only remaining category tints the body',()=>{const u={frostUntil:11,dots:{burn:{until:10},poison:{until:12}}};assert.equal(negativeTint(u,10),null);assert.equal(negativeTint(u,11).key,'poison');assert.equal(negativeTint(u,12),null);assert.equal(negativeTint({stun:0},10),null);});
test('an active source remains after another source of the same category expires',()=>{assert.equal(negativeTint({dots:{burn:{until:9},lava:{until:11}},solarUntil:8},10).key,'fire');assert.equal(negativeTint({frostUntil:9,dots:{frost:{until:8}},abilitySlowUntil:11},10).key,'frost');});
test('hue calculation is read-only and absent effects are neutral',()=>{const u={dots:{burn:{until:12}},rageUntil:14},before=JSON.stringify(u);negativeTint(u,10);assert.equal(JSON.stringify(u),before);assert.equal(negativeTint({},10),null);assert.equal(negativeTint(null,10),null);});
