import test from 'node:test';
import assert from 'node:assert/strict';
import {actorModelKey} from '../src/actor-identity.js';
test('ordinary Nordic heroes and generic monsters cannot share cached body geometry',()=>{const units=[{hero:'knight'},{hero:'mage'},{hero:'ranger'},{hero:'fenrir'},{kind:'wolf'},{kind:'boar'},{kind:'knight'}],keys=units.map(actorModelKey);assert.equal(new Set(keys).size,units.length);assert.ok(keys.every(k=>k&&!k.includes('null')));assert.equal(actorModelKey({hero:'knight',id:99}),keys[0]);assert.notEqual(actorModelKey({hero:'fenrir'}),keys[0]);});
test('Dungeon species retain their own model identity independently of unrelated kind aliases',()=>{assert.equal(actorModelKey({dungeonSpecies:'spider',kind:'wolf'}),'dungeon:spider');assert.notEqual(actorModelKey({dungeonSpecies:'worm'}),actorModelKey({dungeonSpecies:'spider'}));});
