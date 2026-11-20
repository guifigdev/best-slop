import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS,CASTLE_UNITS,CASTLE_RACES} from '../shared/castle-catalog.js';
import {CASTLE_BUILDERS} from '../shared/castle-builders.js';
import {castleBuildAvailability,castleUpgradeAvailability} from '../shared/castle-build-rules.js';
import {castleSupportEffectSupported} from '../shared/castle-support.js';

test('every advertised race building has a real producer or implemented support effect',()=>{
 const offered=new Set(Object.values(CASTLE_RACES).flatMap(r=>r.allBuildings));
 assert.equal(offered.size,Object.keys(CASTLE_BUILDINGS).length);
 for(const key of offered){const b=CASTLE_BUILDINGS[key];assert.equal(b.playable,true,b.name);assert.ok(b.unit?CASTLE_UNITS[b.unit]:castleSupportEffectSupported(b.castleEffect),b.name+' has a simulation handler');assert.doesNotMatch(b.description,/não implementado|indisponível|nesta versão/i,b.name);}
});

test('all ten builders can access their entire catalog with legitimate prerequisites and sufficient resources',()=>{
 for(const [hero,profile]of Object.entries(CASTLE_BUILDERS)){
  const g=new Game(319,{mode:'castlefight'});g.addPlayer('p',hero);g.addPlayer('q','knight');g.initCastleFight();const p=g.player('p'),cf=g.castleFight;p.gold=p.lumber=100000;
  for(const key of CASTLE_RACES[profile.race].allBuildings){
   const b=CASTLE_BUILDINGS[key];cf.buildings=[];
   if(b.requiresBuilding){const prev=CASTLE_BUILDINGS[b.requiresBuilding],building={id:g.id(),key:prev.key,owner:p.owner,team:p.team,alive:true,economyReady:true,readyAt:0,workRemaining:0,x:-32,z:12,w:prev.footprint.w,d:prev.footprint.d};cf.buildings.push(building);const status=castleUpgradeAvailability(g,p,building,key);assert.equal(status.allowed,true,b.name+': '+status.reason);}
   else{const status=castleBuildAvailability(g,p,key);assert.equal(status.allowed,true,b.name+': '+status.reason);}
  }
 }
});

test('Chilling Mushroom is gated by real economy and race rules rather than a version lock',()=>{
 const g=new Game(319,{mode:'castlefight'});g.addPlayer('p','owl');g.addPlayer('q','knight');g.initCastleFight();const p=g.player('p'),b=CASTLE_BUILDINGS.north_h047;
 p.gold=190;p.lumber=349;assert.equal(castleBuildAvailability(g,p,b.key).code,'resources');p.lumber=350;assert.equal(castleBuildAvailability(g,p,b.key).allowed,true);assert.equal(castleBuildAvailability(g,g.player('q'),b.key).code,'race');
});
