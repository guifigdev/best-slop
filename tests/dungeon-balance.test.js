import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {spawnDungeonSpecies,tickDungeonEncounters} from '../shared/dungeon-encounters.js';
import {dungeonRoomAt} from '../shared/dungeon.js';
import {unitSolidBlocked} from '../shared/unit-collision.js';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {HEROES} from '../shared/catalog.js';
import {runDungeonOpening} from './dungeon-playtest.js';

function setup(party=1,kind='knight'){const g=new Game(51,{mode:'dungeon',dungeonPartySize:party});for(let i=0;i<party;i++)g.addPlayer('p'+i,i?['mage','ranger','turtle'][i-1]:kind);for(const h of g.heroes())g.command(h.owner,{type:'dgReady'});const p=g.player('p0'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});g.dungeon.rooms[1].status='combat';g.dungeon.rooms[1].pending=0;g.dungeon.map.hazards=[];return{g,p,room};}
const hooks=g=>({roomAt:p=>dungeonRoomAt(g.dungeon.map,p),free:p=>p,extra:()=>null});

test('level-one solo monsters require several real hero hits, elites endure longer and every boss starts above 3500 HP',()=>{
 const{g,p,room}=setup();assert.equal(p.maxHp,1103);assert.equal(p.inventory.length,0);g.random=()=>.5;for(const key of ['spider','snake','slime','scarab','archer','firemage']){const u=spawnDungeonSpecies(g,room,key,{x:p.x+7,z:p.z});assert.ok(u.maxHp>=200&&u.maxHp<=350,key+' normal HP');let hits=0;while(u.alive&&hits<30){g.attack(p,u);hits++;}assert.ok(hits>=4&&hits<=9,key+' takes several actual base-kit attacks');}
 for(const key of ['worm','stonebeast','guardian']){const u=spawnDungeonSpecies(g,room,key,{x:p.x+8,z:p.z});assert.ok(u.maxHp>=600&&u.maxHp<=950);assert.equal(u.dungeonElite,true);const boss=spawnDungeonSpecies(g,room,key,{x:p.x+10,z:p.z},{boss:true});assert.ok(boss.maxHp>=3500);assert.ok(boss.size>u.size);assert.ok(boss.collisionRadius>u.collisionRadius);}
});

function warningHit(key,{kind='knight',boss=false,party=1,change=()=>{}}={}){const f=setup(party,kind),{g,p,room}=f;change(p,g);p.hp=p.maxHp;const u=spawnDungeonSpecies(g,room,key,{x:p.x-8,z:p.z},{boss});u.dungeonAbilityAt=0;g.time=.1;tickDungeonEncounters(g,.1,hooks(g));const warning=g.dungeon.telegraphs[0],hp=p.hp;assert.ok(warning,key+' has a tell');g.time=warning.fireAt-.01;tickDungeonEncounters(g,.1,hooks(g));assert.equal(p.hp,hp,'no damage before the advertised deadline');g.time=warning.fireAt+.01;tickDungeonEncounters(g,.1,hooks(g));return{...f,u,warning,loss:hp-p.hp,fraction:(hp-p.hp)/p.maxHp};}

// Previous tests demanded max-HP fractions. Fixed pre-defense damage is now
// intentional: buying VIT/HP must improve survival rather than strengthen foes.
test('all normal floor-one areas leave every real starter far from a two-hit death',()=>{
 for(const kind of Object.keys(HEROES))for(const key of ['spider','snake','slime','cavebat','archer','firemage']){const {p,loss,fraction}=warningHit(key,{kind});assert.ok(loss>0,key);assert.ok(fraction<.14,kind+' / '+key+' should be a recoverable mistake');assert.ok(p.alive);}
 const normal=warningHit('spider'),elite=warningHit('worm'),boss=warningHit('guardian',{boss:true});assert.ok(normal.loss<elite.loss&&elite.loss<boss.loss);
});
test('floor-one bosses remain dangerous but two missed tells cannot kill any full-health starter',()=>{
 for(const kind of Object.keys(HEROES))for(const key of ['worm','guardian','stonebeast','broodmother']){const {g,p,u,warning,loss,fraction}=warningHit(key,{kind,boss:true});assert.ok(fraction>.08&&fraction<.42,kind+' / '+key);g.hit(p,warning.damage,u,warning.element!=='physical',false,false,false,warning.element==='physical'?null:warning.element);assert.ok(p.alive&&p.hp>0,kind+' survives two boss mistakes');assert.ok(loss>0);}
});
test('VIT/HP improves effective survival, physical armor and MDEF mitigate their actual damage categories',()=>{
 const base=warningHit('firemage'),extraHP=warningHit('firemage',{change:p=>{p.maxHp*=2;p.hp=p.maxHp;}});assert.equal(extraHP.warning.damage,base.warning.damage);assert.ok(Math.abs(extraHP.loss-base.loss)<1e-8);assert.ok(extraHP.fraction<base.fraction*.51);
 const vitality=warningHit('firemage',{change:(p,g)=>{p.attributes.vit+=20;g.refresh(p);}});assert.ok(vitality.p.maxHp>base.p.maxHp*1.5);assert.ok(vitality.fraction<base.fraction*.6);
 const physical=warningHit('spider'),armor=warningHit('spider',{change:p=>p.armor+=30}),wrongPhysical=warningHit('spider',{change:p=>p.magicDefense+=100}),magic=warningHit('firemage',{change:p=>p.magicDefense+=100}),wrongMagic=warningHit('firemage',{change:p=>p.armor+=100});assert.ok(armor.loss<physical.loss*.5);assert.equal(wrongPhysical.loss,physical.loss);assert.ok(magic.loss<base.loss*.4);assert.equal(wrongMagic.loss,base.loss);
});

test('ordinary arrows and environmental spikes have fixed damage, respect armor and never scale up with victim HP',()=>{
 const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,'archer',{x:p.x+7,z:p.z});g.random=()=>.5;const hp=p.hp;g.attack(u,p);assert.ok(hp-p.hp>10&&hp-p.hp<30,'ordinary arrow remains small compared with 1103 starter HP');
 function spike({armor=0,extraHP=false,type='spikes'}={}){const{g,p}=setup();g.units=[p];if(extraHP)p.maxHp*=2;p.hp=p.maxHp;p.armor=armor;p.magicDefense=0;const hazard={id:'test-spikes',room:1,type,x:p.x,z:p.z,w:4,d:4,period:6,offset:0,telegraphSeconds:1,damage:18};g.dungeon.map.hazards=[hazard];const hp=p.hp;g.time=1.1;tickDungeonEncounters(g,.1,hooks(g));return hp-p.hp;}
 assert.equal(spike(),spike({extraHP:true}));assert.ok(spike()<80);assert.ok(spike({armor:30})<spike()*.4);assert.equal(spike({type:'embers'}),spike({type:'embers',armor:100}),'embers use MDEF rather than physical armor');
});

test('party scaling increases total monster durability without making one warned hit lethal',()=>{
 const solo=setup(),party=setup(4),a=spawnDungeonSpecies(solo.g,solo.room,'spider',{x:solo.p.x+8,z:solo.p.z}),b=spawnDungeonSpecies(party.g,party.room,'spider',{x:party.p.x-8,z:party.p.z});assert.ok(b.maxHp>a.maxHp);assert.ok(b.maxHp<a.maxHp*2);assert.ok(party.g.dungeon.rooms[2].planned>solo.g.dungeon.rooms[2].planned);
 const soloHit=warningHit('spider'),partyHit=warningHit('spider',{party:4});assert.equal(partyHit.warning.damage,soloHit.warning.damage);assert.ok(partyHit.p.alive&&partyHit.p.hp>partyHit.p.maxHp*.85);
});

test('real movement can escape a normal warning after a human reaction delay, even on the slowest starter',()=>{
 const{g,p,room}=setup(1,'turtle'),enemy=spawnDungeonSpecies(g,room,'spider',{x:p.x-8,z:p.z});enemy.dungeonAbilityAt=0;g.time=.1;tickDungeonEncounters(g,.1,hooks(g));const w=g.dungeon.telegraphs[0];assert.ok(insideBossPattern(p,w));g.command(p.owner,{type:'move',x:p.x,z:p.z+7});const hp=p.hp;g.time+=.35;while(g.time<w.fireAt+.05)g.tick(.05);assert.equal(insideBossPattern(p,w),false);assert.equal(p.hp,hp,'the announced area was avoided using actual movement commands');
});

test('a seeded first room honors solo/party tell budgets and spaces successive warnings without synchronized bursts',()=>{
 for(const party of [1,4]){const g=new Game(51,{mode:'dungeon',dungeonPartySize:party});for(let i=0;i<party;i++)g.addPlayer('p'+i,['knight','mage','ranger','turtle'][i]);for(const h of g.heroes())g.command(h.owner,{type:'dgReady'});const p=g.player('p0'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});assert.equal(g.activateDungeonRoom(1,p),true);const seen=new Set(),starts=[];let max=0;while(g.time<8&&p.alive){g.tick(.05);max=Math.max(max,g.dungeon.telegraphs.length);for(const w of g.dungeon.telegraphs)if(!seen.has(w.id)){seen.add(w.id);starts.push(w.start);}}
  assert.ok(starts.length>=2,'exercise real spawned species rather than manufactured warnings');assert.ok(max<=(party===1?1:2));for(let i=1;i<starts.length;i++)assert.ok(starts[i]-starts[i-1]>=2.49,'introductory normal tells leave a real recovery window');assert.ok(g.heroes().some(h=>h.alive),'a normal first-room opening cannot instantly erase the party');
 }
});

test('every starter can clear the actual first chamber using six legal points, real attacks and imperfect reaction time',()=>{
 for(const kind of Object.keys(HEROES)){const result=runDungeonOpening({kind,allocation:kind==='raccoon'?'defense':'balanced'}),p=result.g.player('p0');assert.equal(result.cleared,true,kind+' can learn and finish the opening');assert.equal(result.survivors,1,kind);assert.ok(result.time>10&&result.time<95,kind+' room has a bounded playable duration');assert.deepEqual(result.budgets,[{starting:6,spent:6}]);assert.ok(result.dodges>0,kind+' used actual delayed movement');assert.ok(p.hp>0&&p.dungeonKills===8);assert.ok(result.maxAlive<=6,'no manufactured battle swarm');}
});
test('a four-player opening preserves real build/loot progression and all players have a fair chance to survive',()=>{
 const result=runDungeonOpening({party:4});assert.equal(result.cleared,true);assert.equal(result.survivors,4);assert.ok(result.time>10&&result.time<70);assert.ok(result.dodges>=4&&result.casts>0);assert.ok(result.pickups>0,'only server-generated drops can strengthen this party');assert.ok(result.maxAlive<=12);assert.ok(result.budgets.every(b=>b.starting===6&&b.spent===6));assert.equal(result.g.dungeon.guardiansGoal,result.g.dungeon.rooms.reduce((sum,r)=>sum+r.planned,0));
});

test('the entrance has furnished colliding camp groups, clear central routes and no nests, keys or traps',()=>{
 const g=new Game(71,{mode:'dungeon',dungeonPartySize:4});g.addPlayer('p','knight');const room=g.dungeon.map.rooms[0],props=g.dungeon.map.props.filter(p=>p.room===0&&p.type!=='campfire'),fire=g.dungeon.map.props.find(p=>p.room===0&&p.type==='campfire');assert.equal(props.length,24);assert.equal(g.dungeon.map.hazards.filter(h=>h.room===0).length,0);
 for(const p of props){assert.ok(['barrel','crate','urn','supplies','bedroll','shelf','rock'].includes(p.type));assert.ok(!p.containsKey);assert.ok(Math.abs(p.x-room.x)>6&&Math.abs(p.z-room.z)>6,'center crossing remains open');assert.ok(Math.hypot(p.x-fire.x,p.z-fire.z)>4.5,'campfire and healing space remain open');assert.equal(unitSolidBlocked(g,{collisionRadius:.3},p),true,'preparation has the same prop collision as combat');}
});
