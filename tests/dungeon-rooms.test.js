import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {generateDungeonFloor,dungeonRoomAt,dungeonWalkable} from '../shared/dungeon.js';
import {DUNGEON_RULES as R} from '../shared/dungeon-catalog.js';
import {unitSolidBlocked,unitSegmentClear} from '../shared/unit-collision.js';
import {skillAt} from '../shared/catalog.js';

function create({players=4,party=4,teams=1,seed=947}={}){const g=new Game(seed,{mode:'dungeon',dungeonPartySize:party,dungeonTeams:teams});for(let i=0;i<players;i++)assert.ok(g.addPlayer('p'+i,['knight','mage','ranger','fenrir'][i%4]));return g;}
function start(g){for(const p of g.heroes())assert.ok(g.command(p.owner,{type:'dgReady'}));assert.equal(g.phase,'wave');}
function defeatRoom(g,id,p=g.player('p0')){const state=g.dungeon.rooms[id];while(state.status==='combat'){const enemies=g.units.filter(u=>u.dungeonEnemy&&u.dungeonRoom===id&&u.alive);assert.ok(enemies.length);for(const u of enemies){u.alive=false;u.hp=0;g.dungeonLoot(u,p);}}}

test('expanded deterministic rooms fit four heroes and hordes; corridors are five cells wide',()=>{
 for(let seed=1;seed<=12;seed++){const map=generateDungeonFloor(seed,seed);assert.equal(map.width,85);for(const room of map.rooms){assert.ok(room.w>=25.5&&room.d>=25.5);for(const dx of [-3,3])for(const dz of [-3,3])assert.ok(dungeonWalkable(map,{x:room.x+dx,z:room.z+dz},.8));}for(const door of map.doors)assert.ok(Math.max(door.w,door.d)>=R.cellSize*5);assert.ok(map.doors.length>=16);}
});

test('preparation and the first active floor use identical authoritative geometry and body-safe positions',()=>{
 const g=create(),map=g.dungeon.map,seed=map.seed,obstacles=JSON.stringify(g.obstacles);assert.equal(g.phase,'preparation');assert.equal(g.dungeon.stage,'lobby');assert.equal(g.bounds,map.bounds);
 for(const h of g.heroes()){assert.equal(unitSolidBlocked(g,h,h),false);assert.equal(h.cell,undefined);}
 const before=g.snapshotFor('p0');assert.equal(before.dungeon.map.seed,seed);assert.deepEqual(before.dungeon.visibility.discoveredRooms,[0]);
 start(g);assert.equal(g.dungeon.map.seed,seed);assert.equal(JSON.stringify(g.obstacles.filter(o=>!o.dungeonObject)),obstacles);assert.equal(g.units.filter(u=>u.dungeonEnemy).length,0,'unvisited room hordes consume no AI or collision bodies');
 for(const h of g.heroes())assert.equal(unitSolidBlocked(g,h,h),false);
});

test('entering a combat room seals every door, gathers all four party members and preserves solid collision',()=>{
 const g=create();start(g);const p=g.player('p0'),room=g.dungeon.map.rooms[1],doors=g.dungeon.map.doors.filter(d=>d.room===1);for(const door of doors)assert.equal(unitSolidBlocked(g,{collisionRadius:.2},door),false);
 Object.assign(p,{x:room.x-room.w/2+.1,z:room.z});g.tickDungeon(.01);assert.equal(g.dungeon.rooms[1].status,'combat');
 for(const h of g.heroes()){assert.equal(dungeonRoomAt(g.dungeon.map,h),1);assert.equal(unitSolidBlocked(g,h,h),false,'the first arrival and companions remain outside the new door footprint');}
 for(const door of doors)assert.equal(unitSolidBlocked(g,{collisionRadius:.2},door),true);assert.equal(g.snapshotDungeon('p0').doors.filter(d=>d.room===1).every(d=>d.locked),true);
 const enemies=g.units.filter(u=>u.dungeonEnemy&&u.alive);assert.equal(enemies.length,R.roomWaveSize);assert.ok(enemies.every(u=>u.dungeonRoom===1));assert.ok(g.dungeon.rooms[1].pending>0);
 p.skills=['blink'];const exit=g.dungeon.map.rooms[0];assert.equal(g.dungeonCastValid(p,skillAt('blink',1),{slot:0,x:exit.x,z:exit.z}),false);assert.match(g.commandFailureReason,/seladas/);
 const door=doors[0],inside={x:door.x+(door.side==='east'?-2:door.side==='west'?2:0),z:door.z+(door.side==='south'?-2:door.side==='north'?2:0)},outside={x:door.x*2-inside.x,z:door.z*2-inside.z};assert.equal(unitSegmentClear(g,{collisionRadius:.3},inside,outside),false);
});

test('room treasure cannot open until every wave is defeated; then only its doors reopen',()=>{
 const g=create();start(g);const p=g.player('p0'),chest=g.dungeon.objects.find(o=>o.type==='chest'&&o.room===1);Object.assign(p,{x:chest.x+2,z:chest.z});g.tickDungeon(.01);const gold=p.gold;assert.equal(g.command(p.owner,{type:'dgInteract',object:chest.id}),false);assert.equal(chest.used,false);assert.equal(p.gold,gold);
 const initial=g.units.filter(u=>u.dungeonEnemy&&u.alive);for(const u of initial){u.alive=false;u.hp=0;g.dungeonLoot(u,p);}assert.equal(g.dungeon.rooms[1].status,'combat','queued reinforcements keep the seal closed');assert.ok(g.units.some(u=>u.dungeonEnemy&&u.alive));assert.equal(g.command(p.owner,{type:'dgInteract',object:chest.id}),false);
 defeatRoom(g,1);assert.equal(g.dungeon.rooms[1].pending,0);assert.equal(g.dungeon.rooms[1].status,'cleared');assert.equal(chest.locked,false);for(const door of g.dungeon.map.doors.filter(d=>d.room===1))assert.equal(unitSolidBlocked(g,{collisionRadius:.2},door),false);
 Object.assign(p,{x:chest.x+2,z:chest.z});assert.equal(g.command(p.owner,{type:'dgInteract',object:chest.id}),true);assert.equal(chest.used,true);assert.equal(g.dungeon.gateOpen,false,'a room victory never skips the rest of the floor');
});

test('lazy hordes have an active cap and room counts scale with party size and depth',()=>{
 const solo=create({players:1,party:1}),party=create();start(solo);start(party);assert.ok(party.dungeon.rooms[1].planned>solo.dungeon.rooms[1].planned);const low=party.dungeon.rooms[1].planned;party.dungeon.floor=29;party.spawnDungeonFloor();assert.ok(party.dungeon.rooms[1].planned>low);
 const p=party.player('p0');for(const room of party.dungeon.rooms.filter(r=>r.status==='unvisited'))party.activateDungeonRoom(room.id,p);assert.ok(party.units.filter(u=>u.dungeonEnemy&&u.alive).length<=R.maxActiveEnemies);assert.ok(party.dungeon.rooms.some(r=>r.pending>0));assert.equal(party.dungeon.guardiansGoal,party.dungeon.rooms.reduce((n,r)=>n+r.planned,0));
});

test('team snapshots hide undiscovered enemies, distant loot and another team merchant discovery',()=>{
 const g=create({players:2,party:1,teams:2});start(g);const p=g.player('p0'),q=g.player('p1');g.activateDungeonRoom(1,p);const enemy=g.units.find(u=>u.dungeonEnemy),forP=g.snapshotFor(p.owner),forQ=g.snapshotFor(q.owner);assert.ok(forP.units.some(u=>u.id===enemy.id));assert.ok(!forQ.units.some(u=>u.id===enemy.id));assert.ok(forP.dungeon.visibility.discoveredRooms.includes(1));assert.ok(!forQ.dungeon.visibility.discoveredRooms.includes(1));
 const merchant=g.dungeon.objects.find(o=>o.type==='merchant');merchant.revealed=true;merchant.revealedTeams=[p.team];Object.assign(p,{x:merchant.x,z:merchant.z});Object.assign(q,{x:merchant.x,z:merchant.z});assert.ok(g.snapshotDungeon(p.owner).objects.some(o=>o.id===merchant.id));assert.ok(!g.snapshotDungeon(q.owner).objects.some(o=>o.id===merchant.id));
});

test('monster loot is less frequent while bosses retain guaranteed equipment, technique and original rarity rolls',()=>{
 const g=create({players:1});start(g);const p=g.player('p0');g.random=()=>.15;let gear=0,fragments=0;
 for(let i=0;i<100;i++){const before=g.dungeon.objects.length;g.dungeonLoot({id:g.id(),alive:false,dungeonEnemy:true,x:p.x,z:p.z},p);const items=g.dungeon.objects.slice(before);gear+=items.filter(o=>o.type==='equipment').length;fragments+=items.filter(o=>o.type==='fragment').length;}assert.equal(gear,0);assert.equal(fragments,0);
 for(const [roll,rarity]of [[.5,'epic'],[.99,'legendary']]){g.random=()=>roll;const before=g.dungeon.objects.length;g.dungeonLoot({id:g.id(),alive:false,dungeonEnemy:true,dungeonBoss:true,x:p.x,z:p.z},p);const items=g.dungeon.objects.slice(before);assert.equal(items.find(o=>o.type==='equipment').rarity,rarity);assert.ok(items.some(o=>o.type==='fragment'));}
});

test('floor entrance and descent use explicit stair or cave semantics instead of an unexplained portal',()=>{
 const g=create({players:1});start(g);assert.ok(['stairs','cave'].includes(g.dungeon.map.entrance.appearance));const descent=g.dungeon.objects.find(o=>o.type==='portal');assert.equal(descent.appearance,g.dungeon.map.exit.appearance);assert.equal(descent.room,8);assert.ok(descent.locked);
});

test('chests, merchant stalls and shrines collide, while object approach reaches a free interaction point',()=>{
 const g=create({players:1});start(g);const p=g.player('p0'),chest=g.dungeon.objects.find(o=>o.type==='chest'&&o.room===1);g.activateDungeonRoom(1,p);defeatRoom(g,1);
 for(const o of g.dungeon.objects.filter(o=>['chest','merchant','shrine'].includes(o.type)))assert.equal(unitSolidBlocked(g,{collisionRadius:.3},o),true,o.type+' has a physical body');
 Object.assign(p,{x:chest.x+6,z:chest.z});assert.ok(g.command(p.owner,{type:'dgInteract',object:chest.id}));assert.equal(unitSolidBlocked(g,p,p.destination),false);assert.ok(Math.hypot(p.destination.x-chest.x,p.destination.z-chest.z)>1);
 for(let i=0;i<120&&!chest.used;i++)g.tick(.05);assert.equal(chest.used,true);assert.equal(p.dungeonPending,null);assert.equal(g.obstacles.some(o=>o.dungeonObject===chest.id),false);
});

test('AI party members pursue enemies inside their sealed room instead of walking back toward cleared rooms',()=>{
 const g=create({players:1});start(g);const p=g.player('p0');p.bot=true;g.activateDungeonRoom(1,p);p.nextDungeonBotAt=0;g.dungeonBotThink(p);assert.equal(p.order,'attackMove');const target=g.units.find(u=>u.id===p.target);assert.ok(target?.dungeonEnemy);assert.equal(target.dungeonRoom,1);assert.equal(dungeonRoomAt(g.dungeon.map,p.destination),1);
});
