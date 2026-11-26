import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_WORLD_ROUTE} from '../shared/ro-world-route.js';
import {createRoCheckpoint,validateRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';

function fixture(index=6,defeated=false){
 const g=new Game(102,{mode:'bonk'});g.addPlayer('p','knight');const current=RO_WORLD_ROUTE[index],cleared=[RO_WORLD_ROUTE[3].key,RO_WORLD_ROUTE[1].key,RO_WORLD_ROUTE[0].key];if(defeated&&!cleared.includes(current.key))cleared.push(current.key);if(!defeated){const i=cleared.indexOf(current.key);if(i>=0)cleared.splice(i,1);}const visited=[RO_WORLD_ROUTE[0].key,RO_WORLD_ROUTE[3].key,RO_WORLD_ROUTE[1].key,...(cleared.includes(current.key)?[]:[current.key])];if(!visited.includes(current.key))visited.push(current.key);
 Object.assign(g.bonk,{activity:'adventure',routeVersion:2,routeIndex:index,routeBossDefeated:defeated,visitedStages:visited,clearedStages:cleared,totalElapsed:1729.5,floor:index+1});g.bonk.map={...g.bonk.map,stageKey:current.scene};const hero=g.player('p');hero.level=23;hero.attributePoints=17;hero.gold=984;hero.bonkPendingLevels=2;return g;
}

test('graph checkpoints round-trip arbitrary branch order and preserve the developed hero',()=>{
 for(const defeated of [false,true]){const g=fixture(6,defeated),cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.routeVersion,2);assert.equal(cp.floor,7);assert.equal(cp.routeIndex,6);assert.equal(cp.stageKey,RO_WORLD_ROUTE[6].scene);assert.equal(cp.totalElapsed,1729.5);assert.equal(cp.routeBossDefeated,defeated);assert.deepEqual(cp.clearedStages,g.bonk.clearedStages);assert.deepEqual(cp.visitedStages,g.bonk.visitedStages);assert.deepEqual(validateRoCheckpoint(cp),cp);assert.equal(cp.hero.level,23);assert.equal(cp.hero.gold,984);assert.equal(cp.hero.attributePoints,17);assert.equal(cp.hero.bonkPendingLevels,2);assert.deepEqual(cp.hero.roInventory,g.player('p').roInventory.map(i=>({...i,cards:[]})));const before=JSON.stringify(cp);const clean=validateRoCheckpoint(cp);clean.clearedStages.push(RO_WORLD_ROUTE[11].key);clean.visitedStages.push(RO_WORLD_ROUTE[11].key);assert.equal(JSON.stringify(cp),before,'validation returns owned arrays without mutating the source');}
});

test('graph saves reject duplicate, unknown, missing and mismatched region state without silently truncating',()=>{
 const cp=createRoCheckpoint(fixture());for(const mutate of [
  c=>c.clearedStages.push(c.clearedStages[0]),c=>c.visitedStages.push(c.visitedStages[0]),
  c=>c.clearedStages.push('unknown-region'),c=>c.visitedStages.push('unknown-region'),
  c=>c.clearedStages.push(17),c=>c.visitedStages.push({key:RO_WORLD_ROUTE[5].key}),
  c=>c.visitedStages=c.visitedStages.filter(key=>key!==RO_WORLD_ROUTE[c.routeIndex].key),
  c=>c.visitedStages=c.visitedStages.filter(key=>key!==c.clearedStages[0]),
  c=>c.routeBossDefeated=true,c=>c.clearedStages.push(RO_WORLD_ROUTE[c.routeIndex].key),
  c=>c.routeIndex=-1,c=>c.routeIndex=12,c=>c.routeIndex=2.5,c=>c.routeIndex='6',
  c=>c.floor=1,c=>c.stageKey=Object.keys({wrong:1})[0],
  c=>c.activity='tower',c=>c.routeVersion=3,c=>c.totalElapsed=Infinity,c=>c.totalElapsed=NaN,c=>c.totalElapsed=-1,
  c=>delete c.visitedStages,c=>c.visitedStages=[],c=>c.clearedStages='prontera'
 ]){const value=structuredClone(cp);mutate(value);assert.equal(validateRoCheckpoint(value),null,mutate.toString());}
});

test('a completed graph persists all twenty-two regions while current position may be any visited region',()=>{
 for(const index of [0,5,11]){const g=fixture(index,true);g.bonk.clearedStages=RO_WORLD_ROUTE.slice().reverse().map(r=>r.key);g.bonk.visitedStages=RO_WORLD_ROUTE.map(r=>r.key);g.bonk.stage='finished';const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.clearedStages.length,25);assert.equal(cp.floor,index+1);assert.equal(cp.routeBossDefeated,true);assert.deepEqual(cp.clearedStages,g.bonk.clearedStages);}
 // Visiting the last stable index is not proof that every branch was cleared.
 const cp=createRoCheckpoint(fixture(11,true));assert.ok(cp);assert.equal(cp.floor,12);assert.ok(cp.clearedStages.length<12);
});

test('legacy four-region and strict prefix v1 checkpoints retain their original validation contracts',()=>{
 const legacy=new Game(11,{mode:'bonk'});legacy.addPlayer('p','knight');const old=createRoCheckpoint(legacy);assert.ok(old);assert.equal(old.routeVersion,undefined);assert.deepEqual(validateRoCheckpoint(old),old);
 for(const index of [0,4,11])for(const defeated of [false,true]){const g=fixture(index,defeated);Object.assign(g.bonk,{routeVersion:1,clearedStages:RO_WORLD_ROUTE.slice(0,index+Number(defeated)).map(r=>r.key)});const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.routeVersion,1);assert.equal(cp.visitedStages,undefined);assert.deepEqual(validateRoCheckpoint(cp),cp);if(cp.clearedStages.length>1){const shuffled=structuredClone(cp);shuffled.clearedStages.reverse();assert.equal(validateRoCheckpoint(shuffled),null);}}
});

test('account progress can hold graph adventure and tower saves for one shared developed character',()=>{
 const graph=createRoCheckpoint(fixture(6,true)),towerGame=new Game(55,{mode:'bonk',bonkActivity:'tower'});towerGame.addPlayer('p','knight');const tower=createRoCheckpoint(towerGame);const progress={version:1,selectedCharacter:'hero1',characters:[{id:'hero1',name:'Aventureiro',lineage:graph.lineage,checkpoint:graph,checkpoints:{adventure:graph,tower},updatedAt:100}]};const result=validateRoProgress(progress);assert.ok(result);assert.equal(result.characters[0].checkpoint.routeVersion,2);assert.deepEqual(result.characters[0].checkpoints.adventure.visitedStages,graph.visitedStages);assert.equal(result.characters[0].checkpoints.tower.activity,'tower');assert.equal(result.characters[0].checkpoints.adventure.hero.level,23);
});
