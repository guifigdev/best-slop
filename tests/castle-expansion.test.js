import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {castleBuildCheck} from '../shared/castle-build-rules.js';
import {CASTLE_BUILDINGS,castleDamageMultiplier} from '../shared/castle-catalog.js';
import {castlePassable,castleNavigationRadius,moveCastleUnit,castleSegmentClear} from '../shared/castle-navigation.js';
const setup=()=>{const g=new Game(319,{mode:'castlefight'});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();return{g,p:g.player('a')};};
test('preview, snapshot and authoritative build agree on exact missing resources and leave balances unchanged',()=>{
 const {g,p}=setup(),[key,b]=Object.entries(CASTLE_BUILDINGS).find(([,b])=>b.race==='human'&&b.cost===280&&!b.requiresBuilding&&b.playable);p.gold=270;p.lumber=10000;
 const command={type:'cfBuild',building:key,x:-32,z:9},before={gold:p.gold,wood:p.lumber};
 for(const state of [g,g.snapshot()])assert.equal(castleBuildCheck(state,p,key,command).reason,'Faltam 10 de ouro.');
 assert.equal(g.command('a',command),false);assert.equal(g.commandFailureReason,'Faltam 10 de ouro.');assert.equal(p.gold,before.gold);assert.equal(p.lumber,before.wood);assert.equal(g.castleFight.buildings.length,0);
 p.gold=b.cost;assert.equal(g.command('a',command),true);assert.equal(g.commandFailureReason,null);assert.equal(p.gold,0);
});
test('whole green base is buildable including lane alignment; obstacles and castle remain protected',()=>{
 const {g,p}=setup();p.gold=p.lumber=100000;const key='human_h000',cf=g.castleFight;
 for(const point of [{x:-32,z:-9},{x:-32,z:9},{x:-47,z:20},{x:-27,z:-20}]){assert.equal(castleBuildCheck(g,p,key,point).allowed,true);assert.equal(g.command('a',{type:'cfBuild',building:key,...point}),true);}
 assert.equal(castleBuildCheck(g,p,key,{x:-43,z:0}).code,'castle');assert.equal(castleBuildCheck(g,p,key,{x:32,z:0}).code,'territory');
 cf.obstacles.push({x:-37,z:19,w:1,d:1,scenery:true});assert.equal(castleBuildCheck(g,p,key,{x:-37,z:19}).reason,'Há uma árvore ou pedra neste espaço.');
});
test('both lane assignments spawn clear of the actual producer footprint',()=>{
 for(const team of [1,2])for(const lane of [0,1]){const {g,p}=setup();p.gold=p.lumber=100000;const owner=team===1?p:g.player('b');owner.gold=owner.lumber=100000;assert.equal(g.command(owner.owner,{type:'cfBuild',building:'human_h000',x:team===1?-32:32,z:lane===0?-9:9}),true);const b=g.castleFight.buildings.at(-1),u=g.castleSpawn(b);assert.ok(u);assert.equal(u.lane,lane);assert.ok(castlePassable(g.castleFight,u,castleNavigationRadius(u)));}
});
test('castle defense uses verified Guard Tower weapon as adaptation, attacks enemies and preserves builders',()=>{
 const {g,p}=setup(),cf=g.castleFight,c=cf.teams[0],weapon=CASTLE_BUILDINGS.human_h006.castleEffect;
 const enemy={id:g.id(),owner:'b',castleUnit:true,team:2,alive:true,x:c.x+4,z:0,size:1,hp:1000,maxHp:1000,armorType:'heavy',armor:5},ally={...enemy,id:g.id(),team:1,x:c.x+3};cf.units.push(enemy,ally);const hp=p.hp;
 g.castleDefenseTick(.1);const expected=weapon.damage*castleDamageMultiplier('pierce','heavy')/(1+.06*5);assert.ok(Math.abs(enemy.hp-(1000-expected))<1e-8);assert.equal(ally.hp,1000);assert.equal(p.hp,hp);assert.equal(c.defense.adapted,true);assert.ok(g.effects.some(e=>e.castleDefense));
 const after=enemy.hp;g.castleDefenseTick(.1);assert.equal(enemy.hp,after);cf.elapsed+=weapon.interval;g.castleDefenseTick(.1);assert.ok(enemy.hp<after);
 c.alive=false;const last=enemy.hp;cf.elapsed+=1;g.castleDefenseTick(.1);assert.equal(enemy.hp,last);
});

test('both ground lanes and the one-lane variant have a traversable route around scenery and the central shop',()=>{
 for(const lanes of [1,2]){const g=new Game(319,{mode:'castlefight',laneCount:lanes});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();const cf=g.castleFight;for(const lane of cf.map.lanes){const u={id:999,size:2.4,collisionRadius:1.1,alive:true,team:1,x:lane.left.x,z:lane.z,speed:5},goal={x:lane.right.x,z:lane.z};let arrived=false;for(let i=0;i<160&&!arrived;i++){const before={x:u.x,z:u.z};cf.elapsed+=.1;arrived=moveCastleUnit(cf,u,goal,.1);assert.ok(castlePassable(cf,u,1.1));assert.ok(castleSegmentClear(cf,before,u,1.1));}assert.ok(arrived,`${lanes} lanes / lane ${lane.id}`);}}
});
