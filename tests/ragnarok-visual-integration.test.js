import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {spawnDungeonSpecies} from '../shared/dungeon-encounters.js';
import {monsterVisualReference,RAGNAROK_VOXEL_REFERENCES} from '../shared/monster-visual-references.js';
import {dungeonMonsterSpec,dungeonMonsterModelKey} from '../src/dungeon-monster-art.js';
import {ragnarokMonsterSpec} from '../src/ragnarok-monster-art.js';
import {bloodyUnitSpec,bloodyUnitParts} from '../src/bloody-unit-art.js';

test('real dungeon spawns carry the correct visual identity through the public unit snapshot',()=>{
 const g=new Game(71,{mode:'dungeon'});g.addPlayer('p','knight');g.command('p',{type:'dgReady'});
 for(const [species,biome,key]of [['cavebat','cavern','familiar'],['scarab','cavern','thiefbug'],['rat','forest','tarou'],['archer','crypt','archerskeleton'],['guardian','frost','icetitan'],['stonebeast','forge','salamander'],['firemage','forge','kasa'],['slime','void','poring'],['slime','frost','marin']]){
  const room={...g.dungeon.map.rooms[1],biome},u=spawnDungeonSpecies(g,room,species,{x:room.x,z:room.z});
  assert.equal(u.ragnarokVisual,key);assert.equal(u.name,RAGNAROK_VOXEL_REFERENCES[key].name);assert.equal(dungeonMonsterSpec(u).key,key);
  const packet=g.snapshot().units.find(v=>v.id===u.id);assert.ok(packet);assert.equal(dungeonMonsterModelKey(packet),`dungeon:${species}:${key}`);assert.equal(dungeonMonsterSpec(packet),ragnarokMonsterSpec(key));
 }
});
test('same species changes skin by actual biome and leaves other species and player heroes intact',()=>{
 assert.equal(monsterVisualReference('guardian','crypt'),null);
 assert.equal(monsterVisualReference('guardian','frost'),'icetitan');
 assert.notEqual(dungeonMonsterModelKey({dungeonSpecies:'guardian',dungeonBiome:'frost'}),dungeonMonsterModelKey({dungeonSpecies:'guardian',dungeonBiome:'crypt'}));
 assert.equal(ragnarokMonsterSpec({hero:'knight',dungeonSpecies:'rat'}),null);assert.equal(ragnarokMonsterSpec('__proto__'),null);assert.equal(monsterVisualReference('__proto__'),null);
 assert.equal(dungeonMonsterSpec('spider').legs.length,8,'web spiders retain their own anatomy');
});
test('Bonk enemies and Bloody fire armies reuse the actual sculptures, including their animation rigs',()=>{
 const g=new Game(12,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});for(let i=0;i<35;i++)g.tick(.1);
 const visible=g.snapshot().units.filter(u=>u.bonkEnemy);assert.ok(visible.length>0);
 for(const u of visible){assert.equal(u.ragnarokVisual,monsterVisualReference(u.dungeonSpecies,g.bonk.map.biome));if(u.ragnarokVisual)assert.equal(dungeonMonsterSpec(u).key,u.ragnarokVisual);}
 assert.equal(bloodyUnitSpec('berserkers').parts,ragnarokMonsterSpec('salamander').parts);
 assert.equal(bloodyUnitSpec('aircraft').wings,ragnarokMonsterSpec('kasa').wings);
 assert.ok(bloodyUnitParts('berserkers').length>100);
});


test('shared species caches distinguish alternate Line Wars skins and preserve hero and summon identity',async()=>{
 const {actorModelKey}=await import('../src/actor-identity.js');
 const {LINE_UNITS}=await import('../shared/line-units.js');
 const root=LINE_UNITS.runedryad,desert=LINE_UNITS.cryptbasilisk;
 assert.equal(root.kind,desert.kind,'two recipes share a legacy body identifier');
 const a={kind:root.kind,lineCreep:true,ragnarokVisual:root.ragnarokVisual},b={kind:desert.kind,lineCreep:true,ragnarokVisual:desert.ragnarokVisual};
 assert.notEqual(actorModelKey(a),actorModelKey(b));assert.notEqual(ragnarokMonsterSpec(a),ragnarokMonsterSpec(b));
 assert.equal(ragnarokMonsterSpec({summon:true,kind:'scarab'}),null,'runic summons retain their authored native model');
 assert.equal(ragnarokMonsterSpec({hero:'knight',ragnarokVisual:'mummy'}),null);
 for(const ref of Object.values(RAGNAROK_VOXEL_REFERENCES)){assert.notEqual(ref.name.toLowerCase(),ref.sourceName.toLowerCase());assert.ok(ragnarokMonsterSpec(ref.key));}
});
