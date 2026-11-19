import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {castleBuildAvailability} from '../shared/castle-build-rules.js';
import {castleBuildingCard} from '../src/castle-ui.js';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';

function setup(){const g=new Game(114,{mode:'castlefight'});g.addPlayer('p','knight');g.addPlayer('q','knight');g.initCastleFight();const p=g.player('p');p.gold=p.lumber=100000;return{g,p};}
function buildMany(g,p){
 const built=[];for(const x of [-47,-43,-39,-35,-31,-27])for(const z of [-20,-16,-12,-8]){
  assert.equal(g.command('p',{type:'cfBuild',building:'human_h000',x,z}),true,g.commandFailureReason);
  built.push(g.castleFight.buildings.at(-1));
 }
 return built;
}

test('authoritative build commands and purchase cards allow more than twelve structures, retaining costs and placement validation',()=>{
 const {g,p}=setup(),gold=p.gold,built=buildMany(g,p),def=CASTLE_BUILDINGS.human_h000;
 assert.equal(built.length,24);assert.equal(p.gold,gold-24*def.cost);
 const available=castleBuildAvailability(g,p,'human_h000');assert.equal(available.allowed,true);
 const html=castleBuildingCard('human_h000',def,p.gold,{state:g,hero:p});assert.doesNotMatch(html,/disabled|Limite de/);
 const before=p.gold;assert.equal(g.command('p',{type:'cfBuild',building:'human_h000',x:built[0].x,z:built[0].z}),false);assert.equal(p.gold,before);
 p.gold=0;assert.equal(castleBuildAvailability(g,p,'human_h000').code,'resources');
 const snap=JSON.parse(JSON.stringify(g.snapshot()));assert.equal(snap.castleFight.buildings.filter(b=>b.owner==='p').length,24);
});

test('all selected producers can pause and resume together beyond twelve, with deduplication and atomic ownership checks',()=>{
 const {g,p}=setup(),buildings=buildMany(g,p),cf=g.castleFight;
 for(const [i,b]of buildings.entries()){b.economyReady=true;b.workRemaining=0;b.readyAt=cf.elapsed;b.nextSpawn=cf.elapsed+i+1;b.productionPaused=false;}
 const ids=buildings.map(b=>b.id);
 assert.equal(g.command('p',{type:'cfProduction',buildingIds:[...ids,...ids],paused:true}),true);
 assert.ok(buildings.every(b=>b.productionPaused&&b.nextSpawn===null));
 assert.equal(g.command('p',{type:'cfProduction',buildingIds:[...ids,-100],paused:false}),false);
 assert.equal(g.command('q',{type:'cfProduction',buildingIds:ids,paused:false}),false);
 assert.ok(buildings.every(b=>b.productionPaused&&b.nextSpawn===null));
 assert.equal(g.command('p',{type:'cfProduction',buildingIds:ids,paused:false}),true);
 assert.ok(buildings.every(b=>!b.productionPaused&&b.nextSpawn===cf.elapsed+b.spawnInterval));
 assert.equal(new Set(buildings.map(b=>b.nextSpawn)).size,1);
});

test('Cheese is no longer capped by the removed general twelve-building restriction',()=>{
 const {g,p}=setup(),cf=g.castleFight;cf.elapsed=600;p.x=p.z=0;cf.players.p.legendarySlots=12;
 assert.equal(g.command('p',{type:'cfItem',item:'cheese'}),true);assert.equal(cf.players.p.legendarySlots,13);
});
