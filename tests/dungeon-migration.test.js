import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {ensureDungeonState} from '../shared/dungeon.js';

function oldCheckpoint({removeRooms=false}={}){
 const g=new Game(511,{mode:'dungeon',dungeonPartySize:1});g.addPlayer('p','knight');g.command('p',{type:'dgReady'});const p=g.player('p');g.activateDungeonRoom(1,p);
 const raw=JSON.parse(JSON.stringify(g)),d=raw.dungeon;
 d.floor=7;d.seed=511;d.kills=11;d.map={...d.map,width:85,height:85,bounds:63.75,tileSize:1.5,tiles:Array(85*85).fill(1),walls:[],decor:[],obstacles:[],rooms:Array.from({length:9},(_,id)=>({id,x:(id%3-1)*42,z:(Math.floor(id/3)-1)*42,cx:14+id%3*28,cz:14+Math.floor(id/3)*28,rx:8,rz:8,w:25.5,d:25.5})),start:{x:-42,z:-42},exit:{x:42,z:42}};
 for(const k of ['props','hazards','doors','transitions'])delete d.map[k];for(const k of ['keysByTeam','telegraphs','hazardCycles','partySize','stateVersion'])delete d[k];d.objects=d.objects.filter(o=>!['prop','campfire','key'].includes(o.type));for(const o of d.objects){delete o.requiresKey;delete o.keyLocked;delete o.revealedTeams;if(o.type==='portal'){o.x=42;o.z=42;}}
 raw.bounds=63.75;raw.obstacles=[];raw.units=raw.units.filter(u=>u.hero||u.dungeonEnemy).slice(0,3);for(const u of raw.units){if(u.hero){u.x=-42;u.z=-42;u.hp=777;u.gold=1234;u.score=99;u.inventory=[{key:'runesword',level:3,charges:4,invested:2121,permanentEnchant:{id:'keen_edge',rarity:'common',seed:12}}];}else{u.x=0;u.z=-42;u.order='stop';u.cd=999;u.dungeonRoom=1;}}d.rooms=d.map.rooms.map(r=>({id:r.id,status:r.id===1?'combat':'cleared',pending:0,planned:0}));d.guardiansGoal=d.kills+raw.units.filter(u=>u.dungeonEnemy).length;
 if(removeRooms){delete d.rooms;delete d.discovery;for(const u of raw.units)delete u.dungeonRoom;}
 const restored=new Game(raw.worldSeed,raw.options);for(const [k,v]of Object.entries(raw))if(typeof restored[k]!=='function')restored[k]=v;return restored;
}

test('JSON checkpoints from the 85-cell Dungeon hydrate, snapshot, tick and accept commands without resetting progress',()=>{
 const g=oldCheckpoint(),p=g.player('p'),originalMap=g.dungeon.map,seed=g.dungeon.seed,inventory=structuredClone(p.inventory);assert.equal(Object.hasOwn(g,'unitTerrainBlocked'),false);
 assert.doesNotThrow(()=>g.snapshotFor(p.owner));assert.equal(g.dungeon.map,originalMap);assert.equal(g.dungeon.map.width,85);assert.equal(g.dungeon.floor,7);assert.equal(g.dungeon.seed,seed);assert.equal(p.hp,777);assert.equal(p.gold,1234);assert.equal(p.score,99);assert.deepEqual(p.inventory,inventory);assert.equal(typeof g.unitTerrainBlocked,'function');assert.equal(Object.hasOwn(g,'unitTerrainBlocked'),true);assert.deepEqual(g.dungeon.map.hazards,[]);assert.deepEqual(g.dungeon.map.props,[]);assert.deepEqual(g.dungeon.keysByTeam,{});
 assert.doesNotThrow(()=>g.tick(.1));assert.equal(g.dungeon.floor,7);assert.equal(g.dungeon.map,originalMap);assert.ok(g.command(p.owner,{type:'dgDrop',slot:0}));const item=g.dungeon.objects.at(-1);assert.equal(item.charges,4);assert.deepEqual(item.permanentEnchant,inventory[0].permanentEnchant);assert.ok(g.command(p.owner,{type:'dgPickup',object:item.id}));assert.equal(p.inventory[0].invested,2121);
 assert.ok(g.spawnDungeonFloor());assert.equal(g.dungeon.floor,8);assert.equal(g.dungeon.map.width,133);assert.ok(g.dungeon.map.hazards.length);assert.ok(g.dungeon.objects.some(o=>o.type==='campfire'));assert.equal(p.gold,1234);assert.equal(p.score,99);
});

test('older roomless snapshots reconstruct remaining objectives and permit clearing instead of fabricating new waves',()=>{
 const g=oldCheckpoint({removeRooms:true}),p=g.player('p'),live=g.units.filter(u=>u.dungeonEnemy);assert.doesNotThrow(()=>g.snapshotDungeon(p.owner));assert.equal(g.dungeon.guardiansGoal,11+live.length);assert.equal(g.dungeon.rooms[1].status,'combat');assert.equal(g.dungeon.rooms[1].pending,0);assert.ok(live.every(u=>u.dungeonRoom===1));
 for(const u of live){u.alive=false;u.hp=0;g.dungeonLoot(u,p);}g.tickDungeon(.1);assert.equal(g.dungeon.rooms[1].status,'cleared');assert.equal(g.dungeon.gateOpen,true);assert.equal(g.dungeon.floor,7);
});

test('migration is idempotent and clears an orphaned enemy cast when a JSON checkpoint lacks its pending tell',()=>{
 const g=oldCheckpoint(),u=g.units.find(u=>u.dungeonEnemy);u.dungeonCasting=988;u.dungeonBurrowed=true;u.noCollision=true;u.order='stop';ensureDungeonState(g);assert.equal(u.dungeonCasting,null);assert.equal(u.dungeonBurrowed,false);assert.equal(u.noCollision,false);assert.equal(u.order,'auto');const saved=JSON.stringify(g.dungeon);ensureDungeonState(g);assert.equal(JSON.stringify(g.dungeon),saved);
});
