import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {DungeonMethods,generateDungeonFloor,dungeonWalkable,dungeonRoomAt} from '../shared/dungeon.js';
import {ITEMS,SKILLS,skillAt} from '../shared/catalog.js';
import {unitSolidBlocked} from '../shared/unit-collision.js';
Object.assign(Game.prototype,DungeonMethods);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup({players=1,party=4,teams=1,pvp=false,limit=0,seed=423}={}){
 const g=new Game(seed,{mode:'tower'});Object.assign(g.options,{mode:'dungeon',dungeonPartySize:party,dungeonTeams:teams,dungeonPvp:pvp,dungeonLimit:limit});
 for(let i=0;i<players;i++){assert.equal(g.addPlayer('p'+i,['knight','mage','ranger','fenrir'][i%4]),true);g.setupDungeonPlayer(g.player('p'+i));}
 assert.equal(g.spawnDungeonFloor(),true);g.activateDungeonRoom(1,g.player('p0'));g.monsterLoot=(u,source)=>g.dungeonLoot(u,source);return{g,p:g.player('p0'),q:g.player('p1'),d:g.dungeon};
}
function clear(g,p=g.player('p0')){for(const state of g.dungeon.rooms){if(state.status==='unvisited')g.activateDungeonRoom(state.id,p);while(state.status==='combat'){const alive=g.units.filter(u=>u.dungeonEnemy&&u.alive&&u.dungeonRoom===state.id);assert.ok(alive.length);for(const enemy of alive){enemy.alive=false;enemy.hp=0;g.dungeonLoot(enemy,p);}}}g.tickDungeon(.01);}
function add(g,type,extra={}){const o={id:g.id(),type,x:g.player('p0').x,z:g.player('p0').z,used:false,revealed:true,...extra};g.dungeon.objects.push(o);return o;}

test('procedural floors are deterministic, vary with depth and seed, and connect every room through walkable corridors',()=>{
 for(let seed=1;seed<=8;seed++){const map=generateDungeonFloor(seed,4),same=generateDungeonFloor(seed,4);assert.deepEqual(map,same);assert.notDeepEqual(map.tiles,generateDungeonFloor(seed,5).tiles);assert.notDeepEqual(map.tiles,generateDungeonFloor(seed+100,4).tiles);const start=map.rooms[0].cz*map.width+map.rooms[0].cx,seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++){const at=queue[i],x=at%map.width,z=Math.floor(at/map.width);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,n=zz*map.width+xx;if(xx>=0&&zz>=0&&xx<map.width&&zz<map.height&&map.tiles[n]&&!seen.has(n)){seen.add(n);queue.push(n);}}}for(const room of map.rooms)assert.ok(seen.has(room.cz*map.width+room.cx));assert.equal(seen.size,map.tiles.filter(Boolean).length);assert.ok(map.rooms.some(r=>r.courtyard));assert.ok(map.obstacles.length<500);assert.equal(dungeonWalkable(map,map.start),true);assert.equal(dungeonWalkable(map,{x:999,z:0}),false);}
});
test('the shared floor clears private trial coordinates, assigns parties, keeps spawn bodies free and scales enemies by depth',()=>{
 const{g,p,q,d}=setup({players:4,party:2,teams:2});assert.equal(p.team,q.team);assert.notEqual(p.team,g.player('p2').team);for(const h of g.heroes()){assert.equal(h.cell,undefined);assert.equal(h.challenge,undefined);assert.equal(unitSolidBlocked(g,h,h),false);assert.equal(h.gold,80);}const first=g.units.filter(u=>u.dungeonEnemy),hp=first.find(u=>!u.dungeonBoss).monsterBase.hp;assert.equal(first.length,8,'first-floor two-player cohort is deliberately smaller');assert.ok(d.rooms[1].pending>0);assert.ok(d.rooms[8].pending>0);d.floor=14;g.spawnDungeonFloor();assert.equal(d.floor,15);g.activateDungeonRoom(1,p);assert.ok(g.units.find(u=>u.dungeonEnemy&&!u.dungeonBoss).monsterBase.hp>hp*2);assert.ok(g.units.filter(u=>u.dungeonEnemy).length<=46);
});
test('cooperative parties cannot damage each other and optional PvPvE changes only cross-team hero targeting',()=>{
 const{g,p,q}=setup({players:2,party:1,teams:2});assert.equal(g.dungeonCanTarget(p,q),false);const monster=g.units.find(u=>u.dungeonEnemy);assert.equal(g.dungeonCanTarget(p,monster),true);assert.equal(g.dungeonCanTarget(monster,p),true);g.dungeon.pvp=true;assert.equal(g.dungeonCanTarget(p,q),true);q.team=p.team;assert.equal(g.dungeonCanTarget(p,q),false);
});
test('every equipment definition is reachable from the boss table and every boss also drops a technique fragment',()=>{
 const{g,p}=setup(),pool=Object.entries(ITEMS).filter(([,i])=>!i.consumable&&!i.xp&&!i.attributeTome&&(i.slotType||i.stats||i.attributes)).map(([k])=>k),found=new Set();for(let i=0;i<pool.length;i++){g.random=()=>Math.min(.999999,(i+.1)/pool.length);const t={id:g.id(),alive:false,hp:0,x:p.x,z:p.z,dungeonEnemy:true,dungeonBoss:true,team:100};const before=g.dungeon.objects.length;g.dungeonLoot(t,p);const drops=g.dungeon.objects.slice(before);found.add(drops.find(o=>o.type==='equipment').key);assert.ok(drops.some(o=>o.type==='fragment'&&SKILLS[o.skill]));const after=g.dungeon.objects.length;assert.equal(g.dungeonLoot(t,p),null);assert.equal(g.dungeon.objects.length,after);}assert.deepEqual([...found].sort(),pool.sort());
});
test('equipment and fragments are claimed once by the owning team and never create a client-supplied item',()=>{
 const{g,p,q}=setup({players:2,party:1,teams:2}),gear=add(g,'equipment',{key:'runesword',level:2,team:p.team,rarity:'rare'});q.x=p.x;q.z=p.z;assert.equal(g.dungeonCommand(q,{type:'dgPickup',object:gear.id,item:'helblade'}),false);assert.equal(g.dungeonCommand(p,{type:'dgPickup',object:gear.id,item:'helblade'}),true);assert.equal(p.inventory[0].key,'runesword');assert.equal(p.inventory[0].level,2);assert.equal(g.dungeonCommand(p,{type:'dgPickup',object:gear.id}),false);const fragment=add(g,'fragment',{skill:'bolt',team:p.team,rarity:'rare'});assert.equal(g.dungeonCommand(p,{type:'dgPickup',object:fragment.id}),true);assert.ok(p.skills.includes('bolt'));assert.equal(p.skillOrigins.bolt,'loot');
});
test('approaching an object respects later manual movement and opens a chest only on arrival',()=>{
 const{g,p}=setup();clear(g);const chest=add(g,'chest',{x:g.dungeon.map.rooms[1].x,z:g.dungeon.map.rooms[1].z});const gold=p.gold;assert.equal(g.dungeonCommand(p,{type:'dgInteract',object:chest.id}),true);assert.equal(chest.used,false);assert.equal(p.gold,gold);p.destination={x:p.x-5,z:p.z};p.order='move';g.tickDungeon(.1);assert.equal(p.dungeonPending,null);assert.equal(chest.used,false);Object.assign(p,{x:chest.x,z:chest.z});assert.equal(g.dungeonCommand(p,{type:'dgInteract',object:chest.id}),true);assert.equal(chest.used,true);assert.ok(p.gold>gold);assert.ok(g.dungeon.objects.some(o=>o.type==='equipment'));
});
test('secret merchant discovery, finite stock and inventory capacity are server authoritative',()=>{
 const{g,p}=setup(),market=g.dungeon.objects.find(o=>o.type==='merchant');assert.equal(market.revealed,false);assert.equal(g.dungeonCommand(p,{type:'dgBuy',object:market.id,offer:market.stock[0].id}),false);Object.assign(p,{x:market.x+2.2,z:market.z,gold:100000});g.tickDungeon(.01);assert.equal(market.revealed,true);const offer=market.stock[0],before=p.gold;assert.equal(g.dungeonCommand(p,{type:'dgBuy',object:market.id,offer:offer.id,price:0}),true);assert.equal(p.gold,before-offer.price);assert.equal(offer.stock,0);assert.equal(g.dungeonCommand(p,{type:'dgBuy',object:market.id,offer:offer.id}),false);p.inventory=Array(6).fill({key:'runesword',level:1});assert.equal(g.dungeonCommand(p,{type:'dgBuy',object:market.id,offer:market.stock[1].id}),false);assert.equal(market.stock[1].stock,1);
});
test('a teammate rescue costs gold only after the uninterrupted three-second action completes',()=>{
 const{g,p,q}=setup({players:2});p.gold=500;q.alive=false;q.hp=0;Object.assign(q,{x:p.x+.8,z:p.z});g.dungeonLoot(q,null);const before=p.gold;assert.equal(g.dungeonCommand(p,{type:'dgRevive',owner:q.owner}),true);p.order='move';p.destination={x:p.x+2,z:p.z};g.time+=3.1;g.tickDungeon(.1);assert.equal(q.alive,false);assert.equal(p.gold,before);p.destination=null;assert.equal(g.dungeonCommand(p,{type:'dgRevive',owner:q.owner}),true);g.time+=3.1;g.tickDungeon(.1);assert.equal(q.alive,true);assert.ok(q.hp>0&&q.hp<q.maxHp);assert.equal(p.gold,before-28);assert.ok(g.dungeon.objects.filter(o=>o.type==='corpse').every(o=>o.used));
});
test('PvP defeat releases a bounded amount of resources and two carried items exactly once',()=>{
 const{g,p,q}=setup({players:2,party:1,teams:2,pvp:true});q.gold=1000;q.inventory=[{key:'runesword',level:2},{key:'helblade',level:1},{key:'moonbow',level:3}];q.alive=false;q.hp=0;const start=g.dungeon.objects.length;g.dungeonLoot(q,p);const loot=g.dungeon.objects.slice(start);assert.equal(q.gold,650);assert.equal(loot.filter(o=>o.type==='equipment').length,2);assert.equal(loot.find(o=>o.type==='gold').amount,350);assert.ok(loot.filter(o=>o.type==='equipment').every(o=>o.team===0));g.dungeonLoot(q,p);assert.equal(g.dungeon.objects.length,start+loot.length);assert.equal(q.hp,0);
});
test('a cleared floor unlocks the exit and gathering the party advances to an independently generated floor',()=>{
 const{g,p,q,d}=setup({players:2});const seed=d.map.seed;clear(g);assert.equal(d.gateOpen,true);const portal=d.objects.find(o=>o.type==='portal');Object.assign(p,{x:portal.x,z:portal.z});Object.assign(q,{x:portal.x+10,z:portal.z});assert.equal(g.dungeonCommand(p,{type:'dgExit',object:portal.id}),false);Object.assign(q,{x:portal.x+1,z:portal.z});assert.equal(g.dungeonCommand(p,{type:'dgExit',object:portal.id}),true);assert.equal(g.phase,'intermission');assert.equal(g.timer,7);g.spawnDungeonFloor();assert.equal(d.floor,2);assert.notEqual(d.map.seed,seed);assert.equal(d.gateOpen,false);assert.equal(g.dungeonCommand(p,{type:'dgExit',object:portal.id}),false);
});
test('multiple teams have a bounded exit vote and a fifty-floor run ends in a real shared hero clash',()=>{
 const{g,p,q,d}=setup({players:2,party:1,teams:2,limit:50});d.floor=50;clear(g);const portal=d.objects.find(o=>o.type==='portal');Object.assign(p,{x:portal.x,z:portal.z});assert.equal(g.dungeonCommand(p,{type:'dgExit',object:portal.id}),true);assert.equal(g.phase,'wave');g.time+=45.1;g.tickDungeon(.01);assert.equal(d.stage,'clashCountdown');g.spawnDungeonFloor();assert.equal(g.phase,'final');assert.equal(d.stage,'clash');assert.equal(g.obstacles.length,0);assert.equal(g.dungeonCanTarget(p,q),true);q.alive=false;g.checkDungeonClash(.1);assert.equal(g.phase,'victory');assert.deepEqual(g.winningOwners,[p.owner]);
});
test('single-team fifty floors finish cooperatively while the complete loss of a party ends the endless run',()=>{
 const{g,p,d}=setup({limit:50});d.floor=50;clear(g);const portal=d.objects.find(o=>o.type==='portal');Object.assign(p,{x:portal.x,z:portal.z});g.dungeonCommand(p,{type:'dgExit',object:portal.id});g.spawnDungeonFloor();assert.equal(g.phase,'victory');const endless=setup();endless.p.alive=false;endless.p.hp=0;endless.g.tickDungeon(.1);assert.equal(endless.g.phase,'defeat');assert.equal(endless.g.dungeon.floor,1);
});

test('integrated Game commands, authoritative XP, snapshots and automatic floor transition use Dungeon rather than coliseum rules',()=>{
 const g=new Game(916,{mode:'dungeon',dungeonPartySize:2,dungeonTeams:2,dungeonPvp:true});assert.equal(g.options.mode,'dungeon');for(let i=0;i<3;i++)assert.equal(g.addPlayer('live'+i,['knight','mage','ranger'][i]),true);
 assert.equal(g.command('live0',{type:'dgReady'}),true);assert.equal(g.phase,'preparation');assert.equal(g.command('live1',{type:'dgReady'}),true);assert.equal(g.command('live2',{type:'dgReady'}),true);assert.equal(g.phase,'wave');assert.equal(g.snapshot().dungeon.floor,1);g.activateDungeonRoom(1,g.player('live0'));
 const p=g.player('live0'),ally=g.player('live1'),rival=g.player('live2'),enemy=g.units.find(u=>u.dungeonEnemy&&!u.dungeonBoss);for(const [i,u]of [p,ally,rival].entries()){u.x=enemy.x+i;u.z=enemy.z;u.order='stop';u.cd=999;}
 const gold=p.gold,xp=p.xp,allyXp=ally.xp,rivalXp=rival.xp;g.hit(enemy,enemy.maxHp*100,p,true,false,false,true);assert.equal(enemy.alive,false);assert.equal(p.gold-gold,2);assert.ok(p.xp>xp);assert.ok(ally.xp>allyXp);assert.equal(rival.xp,rivalXp);
 clear(g,p);const portal=g.dungeon.objects.find(o=>o.type==='portal');for(const u of g.heroes()){u.x=portal.x;u.z=portal.z;u.order='stop';}assert.equal(g.command('live0',{type:'dgExit',object:portal.id}),true);assert.equal(g.command('live2',{type:'dgExit',object:portal.id}),true);assert.equal(g.phase,'intermission');g.tick(7.1);assert.equal(g.phase,'wave');assert.equal(g.dungeon.floor,2);assert.equal(g.snapshot().dungeon.floor,2);
});

test('line-of-sight follows solid room geometry, while hostile monster summons remain dangerous in cooperative play',()=>{
 const{g,p,q}=setup({players:2,party:1,teams:2});g.obstacles=[{x:0,z:0,w:1,d:8}];g.obstacleRevision++;Object.assign(p,{x:-2,z:0});Object.assign(q,{x:2,z:0});assert.equal(g.dungeonAttackReady(p,q),false);p.z=q.z=8;assert.equal(g.dungeonAttackReady(p,q),true);
 const hostile={id:987,alive:true,summon:true,owner:'npc-1',team:100};assert.equal(g.dungeonCanTarget(hostile,p),true);const pet={...hostile,id:988,owner:p.owner,team:p.team};assert.equal(g.dungeonCanTarget(pet,q),false);g.dungeon.pvp=true;assert.equal(g.dungeonCanTarget(pet,q),true);
});

test('walls block offensive spell targeting while deliberate relocation and self buffs remain available',()=>{
 const{g,p,q}=setup({players:2,party:1,teams:2,pvp:true});g.obstacles=[{x:0,z:0,w:1,d:8}];g.obstacleRevision++;Object.assign(p,{x:-2,z:0,skills:['bolt','blink','shield']});Object.assign(q,{x:2,z:0});assert.equal(g.dungeonCastValid(p,skillAt('bolt',1),{slot:0},q),false);assert.match(g.commandFailureReason,/paredes/);assert.equal(g.dungeonCastValid(p,skillAt('blink',1),{slot:1,x:3,z:0},null),true);assert.equal(g.dungeonCastValid(p,skillAt('shield',1),{slot:2},null),true);p.z=q.z=8;assert.equal(g.dungeonCastValid(p,skillAt('bolt',1),{slot:0},q),true);
});

test('enchanted weapon drops retain their effect on pickup and drop, while common fragments never downgrade an existing legendary technique',()=>{
 const{g,p}=setup();const weapon=add(g,'equipment',{key:'runesword',level:3,enchantment:'fire',rarity:'epic'});assert.equal(g.dungeonCommand(p,{type:'dgPickup',object:weapon.id}),true);assert.equal(p.inventory[0].enchantment,'fire');assert.ok(p.enchantments.fire);assert.equal(g.dungeonCommand(p,{type:'dgDrop',slot:0}),true);const dropped=g.dungeon.objects.at(-1);assert.equal(dropped.enchantment,'fire');assert.equal(dropped.team,0);
 p.level=20;p.skills.push('bolt');p.skillLevels.bolt=1;p.skillRarities={bolt:'legendary'};const fragment=add(g,'fragment',{skill:'bolt',rarity:'common'});assert.equal(g.dungeonCommand(p,{type:'dgPickup',object:fragment.id}),true);assert.equal(p.skillLevels.bolt,2);assert.equal(p.skillRarities.bolt,'legendary');assert.equal(p.autoSkills.bolt,true);
});

test('AI companions can finish a teammate rescue and still cast their real abilities during the final clash',()=>{
 const{g,p,q}=setup({players:2});q.bot=true;q.gold=500;g.units=g.units.filter(u=>u.hero);p.alive=false;p.hp=0;Object.assign(q,{x:p.x+.8,z:p.z,nextDungeonBotAt:0});g.tickDungeon(.1);assert.equal(g.dungeon.revivals.length,1);g.time+=3.1;g.tickDungeon(.1);assert.equal(p.alive,true);assert.equal(q.gold,472);
 q.team=q.dungeonTeam=2;g.dungeon.stage='clash';g.dungeon.finalStarted=g.time;g.phase='final';g.obstacles=[];g.obstacleRevision++;Object.assign(p,{x:0,z:0,hp:1000,maxHp:1000});Object.assign(q,{x:0,z:2,skills:['bolt'],skillLevels:{bolt:1},mana:1000,nextDungeonBotAt:0,cooldowns:{}});const hp=p.hp;g.tickDungeon(.1);assert.ok(p.hp<hp);assert.ok(q.cooldowns.bolt>0);
});
