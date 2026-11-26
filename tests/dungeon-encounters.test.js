import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {generateDungeonFloor,dungeonRoomAt,dungeonWalkable} from '../shared/dungeon.js';
import {dungeonFloorHeight} from '../shared/dungeon-design.js';
import {spawnDungeonSpecies,tickDungeonEncounters,dungeonHazardPhase} from '../shared/dungeon-encounters.js';
import {DUNGEON_SPECIES as SPECIES,DUNGEON_BIOMES as BIOMES,DUNGEON_RULES as R} from '../shared/dungeon-catalog.js';
import {navigation} from '../shared/field.js';
import {unitSolidBlocked} from '../shared/unit-collision.js';

function setup(){const g=new Game(841,{mode:'dungeon',dungeonPartySize:1});g.addPlayer('p','knight');g.command('p',{type:'dgReady'});const p=g.player('p'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});g.dungeon.map.hazards=[];g.dungeon.rooms[1].status='combat';g.dungeon.rooms[1].pending=0;return{g,p,room};}
function hooks(g){return{roomAt:p=>dungeonRoomAt(g.dungeon.map,p),free:p=>unitSolidBlocked(g,{collisionRadius:.3},p)?null:{x:p.x,z:p.z},extra:(id,key,p)=>{if(g.units.filter(u=>u.alive&&u.dungeonEnemy).length>=R.maxActiveEnemies)return null;g.dungeon.guardiansGoal++;return spawnDungeonSpecies(g,g.dungeon.map.rooms[id],key,p,{extra:true});}};}
function tick(g,dt=.1){g.time+=dt;tickDungeonEncounters(g,dt,hooks(g));}
function clearRoom(g,id,p){const state=g.dungeon.rooms[id];if(state.status==='unvisited')g.activateDungeonRoom(id,p);while(state.status==='combat'){const enemies=g.units.filter(u=>u.alive&&u.dungeonEnemy&&u.dungeonRoom===id);assert.ok(enemies.length);for(const e of enemies){e.alive=false;e.hp=0;g.dungeonLoot(e,p);}}}

test('large rooms have high ceilings, continuous floor elevation and biome transitions on real carved corridors',()=>{
 for(let floor=1;floor<8;floor++){const map=generateDungeonFloor(412,floor);assert.equal(map.width,133);assert.equal(new Set(map.rooms.map(r=>r.biome)).size,3);for(const r of map.rooms){assert.ok(r.w>=40.5&&r.w<=49.5&&r.d>=40.5&&r.d<=49.5);assert.ok(r.ceilingHeight>=9);assert.ok(BIOMES[r.biome]);assert.ok(BIOMES[r.biome].enemies.every(k=>SPECIES[k]));assert.ok(Math.abs(dungeonFloorHeight(map,r.x,r.z)-dungeonFloorHeight(map,r.x+.1,r.z))<.01);}for(const link of map.transitions){assert.notEqual(link.from,link.to);assert.equal(dungeonWalkable(map,link,.4),true);}}
});

test('expanded creatures retain distinct solo threats without borrowing generic animal profiles',()=>{
 const{g,room}=setup(),list=Object.keys(SPECIES).map((key,i)=>spawnDungeonSpecies(g,room,key,{x:room.x+(i%4)*3,z:room.z+Math.floor(i/4)*3}));assert.equal(list.length,392);
 for(const u of list){assert.equal(u.kind,'dungeon-'+u.dungeonSpecies);assert.equal(u.boss,false);assert.deepEqual(u.skills,[]);assert.ok(Number.isFinite(u.speed)&&u.speed>=0);assert.ok(u.maxHp>0&&u.damage>0);}
 const worm=list.find(u=>u.dungeonSpecies==='worm'),rat=list.find(u=>u.dungeonSpecies==='rat'),archer=list.find(u=>u.dungeonSpecies==='archer');assert.ok(worm.maxHp>rat.maxHp*4);assert.ok(worm.damage>rat.damage);assert.ok(rat.speed>worm.speed);assert.equal(archer.dungeonProjectile,'arrow');assert.ok(archer.range>=12);assert.ok(list.find(u=>u.dungeonSpecies==='cavebat').flying);
});

test('web strikes telegraph before damage, punish standing still and permit dodging',()=>{
 for(const dodge of [false,true]){const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,'spider',{x:p.x-8,z:p.z});u.dungeonAbilityAt=0;const hp=p.hp;tick(g);assert.equal(p.hp,hp);const w=g.dungeon.telegraphs[0];assert.ok(w&&g.effects.some(e=>e.type==='bossDanger'));g.time=w.fireAt-.01;tickDungeonEncounters(g,.01,hooks(g));assert.equal(p.hp,hp);if(dodge)p.z+=8;g.time=w.fireAt+.01;tickDungeonEncounters(g,.02,hooks(g));assert.equal(g.dungeon.telegraphs.length,0);assert.ok(g.effects.some(e=>e.type==='bossImpact'));if(dodge)assert.equal(p.hp,hp);else{assert.ok(p.hp<hp);assert.ok(p.abilitySlowUntil>g.time);}}
});

test('solid geometry prevents hostile tells and blocks a previously scheduled impact',()=>{
 const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,'firemage',{x:p.x-8,z:p.z});u.dungeonAbilityAt=0;tick(g);const w=g.dungeon.telegraphs[0];assert.ok(w);g.obstacles=[...g.obstacles,{x:p.x-4,z:p.z,w:1,d:8}];g.obstacleRevision++;const hp=p.hp;g.time=w.fireAt+.01;tickDungeonEncounters(g,.1,hooks(g));assert.equal(p.hp,hp);u.dungeonAbilityAt=0;tick(g);assert.equal(g.dungeon.telegraphs.length,0);
});

test('giant worms burrow untargetably, warn the emergence position and emerge where a dodged player was',()=>{
 const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,'worm',{x:p.x-10,z:p.z});u.dungeonAbilityAt=0;const origin={x:p.x,z:p.z},hp=p.hp;tick(g);assert.equal(u.dungeonBurrowed,true);assert.equal(g.dungeonCanTarget(p,u),false);const w=g.dungeon.telegraphs[0];assert.equal(w.skill,'burrow');p.z+=9;g.time=w.fireAt+.01;tickDungeonEncounters(g,.1,hooks(g));assert.equal(u.dungeonBurrowed,false);assert.ok(Math.hypot(u.x-origin.x,u.z-origin.z)<.1);assert.equal(p.hp,hp);assert.ok(g.dungeonCanTarget(p,u));u.dungeonAbilityAt=0;tick(g);assert.equal(g.dungeon.telegraphs[0].skill,'charge');assert.equal(g.dungeon.telegraphs[0].shape,'line');
});

test('periodic spikes warn and damage only their active phase, pits punish falls once and ice is authoritative',()=>{
 const{g,p,room}=setup(),spike={id:'spike',room:room.id,type:'spikes',x:p.x,z:p.z,w:4,d:4,period:6,offset:0,telegraphSeconds:1,damage:30};g.dungeon.map.hazards=[spike];const hp=p.hp;g.time=.2;tickDungeonEncounters(g,.1,hooks(g));assert.equal(p.hp,hp);assert.equal(dungeonHazardPhase(spike,g.time).phase,'warning');g.time=1.2;tickDungeonEncounters(g,.1,hooks(g));assert.ok(p.hp<hp);const after=p.hp;g.time=1.3;tickDungeonEncounters(g,.1,hooks(g));assert.equal(p.hp,after);
 const safe={x:p.x-6,z:p.z};p.dungeonLastSafe=safe;g.dungeon.map.hazards=[{...spike,id:'pit',type:'pit'}];g.time=3;tickDungeonEncounters(g,.1,hooks(g));assert.ok(p.hp<after);assert.deepEqual({x:p.x,z:p.z},safe);assert.ok(p.dungeonFallingUntil>g.time);const postFall=p.hp;tick(g);assert.equal(p.hp,postFall);
 g.dungeon.map.hazards=[{...spike,type:'ice',x:p.x,z:p.z}];assert.equal(g.dungeonIceAt(p),true);g.environment(p,.1);assert.equal(p.sliding,true);p.flying=true;assert.equal(g.dungeonIceAt(p),false);
});

test('egg nests hatch capped reinforcements counted by the floor and stop when broken',()=>{
 const{g}=setup(),nest=g.dungeon.objects.find(o=>o.propType==='eggNest');assert.ok(nest);g.dungeon.rooms[nest.room].status='combat';nest.hatchAt=0;const goal=g.dungeon.guardiansGoal;tick(g);assert.equal(nest.spawned,2);assert.equal(g.dungeon.guardiansGoal,goal+2);for(let i=0;i<5;i++)tick(g,10);assert.equal(nest.spawned,6);assert.equal(g.units.filter(u=>u.dungeonExtra).length,6);nest.used=true;tick(g,20);assert.equal(g.units.filter(u=>u.dungeonExtra).length,6);
});

test('every iron chest has a guaranteed reachable key hidden in a breakable object, consumed exactly once',()=>{
 const{g,p}=setup();g.dungeon.rooms[1].status='unvisited';g.dungeon.rooms[1].pending=g.dungeon.rooms[1].planned;clearRoom(g,1,p);clearRoom(g,3,p);const chest=g.dungeon.objects.find(o=>o.type==='chest'&&o.requiresKey),barrel=g.dungeon.objects.find(o=>o.type==='prop'&&o.containsKey);assert.ok(chest&&barrel);assert.equal(chest.requiresKey,barrel.keyId);Object.assign(p,{x:chest.x+2,z:chest.z});assert.equal(g.command(p.owner,{type:'dgInteract',object:chest.id}),false);assert.match(g.commandFailureReason,/chave/);
 Object.assign(p,{x:barrel.x+2,z:barrel.z});p.damage=1000;assert.ok(g.command(p.owner,{type:'dgInteract',object:barrel.id}));assert.ok(barrel.used);assert.equal(g.dungeon.map.props.find(o=>o.id===barrel.propId).alive,false);const key=g.dungeon.objects.find(o=>o.type==='key');assert.ok(key);Object.assign(p,{x:key.x,z:key.z});assert.ok(g.command(p.owner,{type:'dgPickup',object:key.id}));assert.equal(g.dungeon.keysByTeam[p.team][key.keyId],1);Object.assign(p,{x:chest.x+2,z:chest.z});assert.ok(g.command(p.owner,{type:'dgInteract',object:chest.id}));assert.equal(chest.used,true);assert.equal(g.dungeon.keysByTeam[p.team][key.keyId],0);assert.equal(g.command(p.owner,{type:'dgInteract',object:chest.id}),false);
});

test('campfires heal nearby injured heroes, consume finite fuel and suspend all healing during sealed combat',()=>{
 const{g,p}=setup(),fire=g.dungeon.objects.find(o=>o.type==='campfire'&&o.room===0);Object.assign(p,{x:fire.x,z:fire.z+2});p.hp=p.maxHp*.5;const hp=p.hp;tick(g,2);assert.ok(Math.abs(p.hp-hp-p.maxHp*.05)<.01);assert.equal(fire.fuel,43);assert.equal(fire.active,true);assert.equal(fire.healing,true);g.dungeon.rooms[0].status='combat';const before=p.hp;tick(g,3);assert.equal(p.hp,before);assert.equal(fire.fuel,43);assert.equal(fire.active,false);assert.match(fire.suspendedReason,/combate/);g.dungeon.rooms[0].status='cleared';fire.fuel=0;tick(g);assert.equal(fire.active,false);assert.equal(p.hp,before);
});

test('shared navigation crosses newly expanded rooms and corridors instead of rejecting the larger grid',()=>{
 const{g,p}=setup();for(const state of g.dungeon.rooms){state.status='cleared';state.pending=0;}g.units=[p];g.obstacles=g.dungeon.map.obstacles;g.obstacleRevision++;const target=g.dungeon.map.rooms[2];Object.assign(p,{x:g.dungeon.map.rooms[0].x,z:g.dungeon.map.rooms[0].z});const first=navigation(g,p,target);assert.ok(first,'the 199.5m floor has a route');assert.equal(unitSolidBlocked(g,p,first),false);assert.ok(g.command(p.owner,{type:'move',x:target.x,z:target.z}));for(let i=0;i<650&&Math.hypot(p.x-target.x,p.z-target.z)>.3;i++)g.tick(.1);assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.3,'real simulation movement traverses two rooms and both corridor links');
});

test('grounded enemies avoid pits while loot dropped beside walls or pits preserves every item field for an ally',()=>{
 const g=new Game(123,{mode:'dungeon',dungeonPartySize:2});g.addPlayer('p','knight');g.addPlayer('q','mage');g.command('p',{type:'dgReady'});g.command('q',{type:'dgReady'});const p=g.player('p'),q=g.player('q'),room=g.dungeon.map.rooms[0],pit={id:'test-pit',room:0,type:'pit',x:room.x+3,z:room.z+3,w:4,d:4,period:6};g.dungeon.map.hazards.push(pit);const enemy=spawnDungeonSpecies(g,room,'rat',{x:room.x-4,z:room.z});assert.equal(unitSolidBlocked(g,enemy,pit),true);enemy.flying=true;assert.equal(unitSolidBlocked(g,enemy,pit),false);enemy.alive=false;
 const record={key:'runesword',level:3,rarity:'legendary',charges:4,invested:2117,enchantment:'fire',permanentEnchant:{id:'keen_edge',rarity:'common',seed:23,roll:76,rolledAt:9}};
 for(const point of [{x:room.x+room.w/2-.55,z:room.z+room.d*.2},{x:pit.x-pit.w/2-.6,z:pit.z}]){Object.assign(p,point);p.inventory=[structuredClone(record)];g.refresh(p);assert.ok(g.command(p.owner,{type:'dgDrop',slot:0}));const o=g.dungeon.objects.at(-1);assert.equal(unitSolidBlocked(g,{collisionRadius:.6},o),false);assert.ok(Math.abs(o.x-pit.x)>=pit.w/2+.6||Math.abs(o.z-pit.z)>=pit.d/2+.6);Object.assign(q,{x:o.x,z:o.z});q.inventory=[];assert.ok(g.command(q.owner,{type:'dgPickup',object:o.id}));assert.deepEqual(q.inventory[0],record);assert.notEqual(q.inventory[0].permanentEnchant,o.permanentEnchant);}
});
