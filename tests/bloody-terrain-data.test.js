import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOODY_TERRAIN_DATA as data } from '../shared/bloody-terrain-data.js';

test('pinned native Bloody reference preserves complete terrain and pathing sizes', () => {
  assert.equal(data.width, 97);
  assert.equal(data.height, 97);
  for (const key of ['tiles', 'relief', 'water', 'heights']) assert.equal(data[key].length, 97 * 97);
  assert.match(data.tiles, /^[0-9a-c]+$/);
  assert.match(data.water, /^[01]+$/);
  assert.ok(data.water.includes('0') && data.water.includes('1'));
  assert.equal(data.pathing.flags.length, data.pathing.width * data.pathing.height * 2);
  assert.equal(data.pathing.width, 384);
  assert.equal(data.pathing.step, 0.25);
  assert.equal(data.provenance.nativePlayers, 8);
  assert.match(data.provenance.mapSha256, /^[a-f0-9]{64}$/);
});

test('original private plots and cardinal staging anchors survive coordinate conversion', () => {
  assert.equal(data.starts.length, 8);
  for (const name of ['Red', 'Blue', 'Teal', 'Purple', 'Yellow', 'Orange', 'Green', 'Pink']) {
    const r = data.regions[name];
    assert.ok(r.minX < r.maxX && r.minZ < r.maxZ, name);
    assert.ok(data.starts.some(p => p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ), name);
  }
  assert.equal(data.regions.Frontrank_1a.x, -3.5);
  assert.equal(data.regions.Frontrank_1a.z, 30);
  assert.equal(data.regions.Frontrank_3a.z, -30);
  assert.equal(data.placements.length, 437);
  assert.ok(data.placements.every(p => Number.isFinite(p.x) && Number.isFinite(p.z) && p.scale > 0));
  assert.ok(data.placements.some(p => p.rawId === 'Volc'));
  assert.ok(data.placements.some(p => p.rawId === 'ATtr'));
});
