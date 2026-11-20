import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {spawnDungeonSpecies,tickDungeonEncounters} from '../shared/dungeon-encounters.js';
import {dungeonRoomAt} from '../shared/dungeon.js';
import {unitSolidBlocked} from '../shared/unit-collision.js';

function setup(party=1){const g=new Game(51,{mode:'dungeon',dungeonPartySize:party});for(let i=0;i<party;i++)g.addPlayer('p'+i,'knight');for(const h of g.heroes())g.command(h.owner,{type:'dgReady'});const p=g.player('p0'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});g.dungeon.rooms[1].status='combat';g.dungeon.rooms[1].pending=0;g.dungeon.map.hazards=[];return{g,p,room};}
const hooks=g=>({roomAt:p=>dungeonRoomAt(g.dungeon.map,p),free:p=>p,extra:()=>null});

test('level-one solo monsters require several real hero hits, elites endure longer and every boss starts above 3500 HP',()=>{
 const{g,p,room}=setup();assert.ok(p.maxHp>=1000);assert.equal(p.inventory.length,0);for(const key of ['spider','snake','slime','scarab','archer','firemage']){const u=spawnDungeonSpecies(g,room,key,{x:p.x+7,z:p.z});assert.ok(u.maxHp>=200&&u.maxHp<=350,key+' normal HP');assert.ok(u.damage>=30&&u.damage<=60,key+' basic damage');assert.ok(Math.ceil(u.maxHp/(p.damage/(1+.06*u.armor)))>=4,key+' takes at least four base-kit attacks');}
 for(const key of ['worm','stonebeast','guardian']){const u=spawnDungeonSpecies(g,room,key,{x:p.x+8,z:p.z});assert.ok(u.maxHp>=600&&u.maxHp<=950);assert.equal(u.dungeonElite,true);const boss=spawnDungeonSpecies(g,room,key,{x:p.x+10,z:p.z},{boss:true});assert.ok(boss.maxHp>=3500);assert.ok(boss.size>u.size);assert.ok(boss.collisionRadius>u.collisionRadius);}
});

test('warned attacks threaten the real hero health pool, increase by elite/boss rank and still honor defense',()=>{
 const fractions=[];
 for(const [key,boss,expected]of [['spider',false,.24],['worm',false,.37],['guardian',true,.5]]){const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,key,{x:p.x-8,z:p.z},{boss});u.dungeonAbilityAt=0;const before=p.hp;g.time=.1;tickDungeonEncounters(g,.1,hooks(g));const warning=g.dungeon.telegraphs[0];assert.equal(warning.hpFraction,expected);g.time=warning.fireAt+.01;tickDungeonEncounters(g,.1,hooks(g));const loss=(before-p.hp)/p.maxHp;assert.ok(loss>.12&&loss<expected,'real starter defense mitigates a punishing tell');assert.ok(p.alive);fractions.push(loss);}
 assert.ok(fractions[0]<fractions[1]&&fractions[1]<fractions[2]);
 function fireLoss(extraDefense){const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,'firemage',{x:p.x-8,z:p.z});p.magicDefense+=extraDefense;u.dungeonAbilityAt=0;g.time=.1;tickDungeonEncounters(g,.1,hooks(g));const warning=g.dungeon.telegraphs[0],hp=p.hp;g.time=warning.fireAt+.01;tickDungeonEncounters(g,.1,hooks(g));return hp-p.hp;}
 assert.ok(fireLoss(100)<fireLoss(0)*.4,'magic defense remains valuable against percentage-based pre-defense damage');
});

test('basic attacks use fixed monster damage while announced environmental pulses use 10–12% before mitigation',()=>{
 const{g,p,room}=setup(),u=spawnDungeonSpecies(g,room,'archer',{x:p.x+7,z:p.z});g.random=()=>0;const hp=p.hp;g.attack(u,p);assert.ok(hp-p.hp>=25&&hp-p.hp<60,'ordinary arrows are fixed damage rather than percentage damage');
 g.units=[p];p.hp=p.maxHp;p.armor=0;p.magicDefense=0;const hazard={id:'test-spikes',room:1,type:'spikes',x:p.x,z:p.z,w:4,d:4,period:6,offset:0,telegraphSeconds:1,damage:18};g.dungeon.map.hazards=[hazard];g.time=1.1;tickDungeonEncounters(g,.1,hooks(g));assert.ok(Math.abs(p.hp/p.maxHp-.9)<.00001);assert.ok(p.alive);
});

test('party scaling increases total monster durability without making one warned hit lethal',()=>{
 const solo=setup(),party=setup(4),a=spawnDungeonSpecies(solo.g,solo.room,'spider',{x:solo.p.x+8,z:solo.p.z}),b=spawnDungeonSpecies(party.g,party.room,'spider',{x:party.p.x-8,z:party.p.z});assert.ok(b.maxHp>a.maxHp);assert.ok(b.maxHp<a.maxHp*2);assert.ok(party.g.dungeon.rooms[2].planned>solo.g.dungeon.rooms[2].planned);
 b.dungeonAbilityAt=0;party.g.time=.1;tickDungeonEncounters(party.g,.1,hooks(party.g));const w=party.g.dungeon.telegraphs[0];assert.equal(w.hpFraction,.24);party.g.time=w.fireAt+.1;tickDungeonEncounters(party.g,.1,hooks(party.g));assert.ok(party.p.alive&&party.p.hp>party.p.maxHp*.7);
});

test('the entrance has eight colliding camp props, clear central routes and no nests, keys or traps',()=>{
 const g=new Game(71,{mode:'dungeon',dungeonPartySize:4});g.addPlayer('p','knight');const room=g.dungeon.map.rooms[0],props=g.dungeon.map.props.filter(p=>p.room===0&&p.type!=='campfire'),fire=g.dungeon.map.props.find(p=>p.room===0&&p.type==='campfire');assert.equal(props.length,8);assert.equal(g.dungeon.map.hazards.filter(h=>h.room===0).length,0);
 for(const p of props){assert.ok(['barrel','crate','urn'].includes(p.type));assert.ok(!p.containsKey);assert.ok(Math.abs(p.x-room.x)>6&&Math.abs(p.z-room.z)>6,'center crossing remains open');assert.ok(Math.hypot(p.x-fire.x,p.z-fire.z)>4.5,'campfire and healing space remain open');assert.equal(unitSolidBlocked(g,{collisionRadius:.3},p),true,'preparation has the same prop collision as combat');}
});
