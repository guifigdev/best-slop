import test from 'node:test';
import assert from 'node:assert/strict';
import {CASTLE_BUILDINGS as B,CASTLE_UNITS as U} from '../shared/castle-catalog.js';
import {CASTLE_UPGRADE_REFERENCE as R,CASTLE_UPGRADE_EDGES as E,CASTLE_UPGRADE_PATHS as P} from '../shared/castle-upgrade-data.js';
import {castleUnitVisual as visual,castleUnitPortrait as portrait} from '../src/castle-unit-art.js';
import {Game} from '../shared/simulation.js';

test('all 51 native object/script upgrade edges have matching predecessor, costs, troop and a visibly evolved model',()=>{
 assert.equal(R.objectEdges,51);assert.equal(R.scriptEdges,51);assert.equal(R.catalogEdges,51);assert.deepEqual(R.missingEdges,[]);assert.equal(P.length,41);
 for(const e of E){assert.ok(B[e.source].upgradesTo.includes(e.target));assert.equal(B[e.target].requiresBuilding,e.source);assert.equal(B[e.target].cost,e.incrementalGold);assert.equal(B[e.target].unit,e.targetUnit);if(e.sourceUnit&&e.targetUnit){assert.ok(U[e.targetUnit]);assert.notDeepEqual(visual(e.sourceUnit).parts,visual(e.targetUnit).parts,e.targetName);assert.notEqual(portrait(e.sourceUnit),portrait(e.targetUnit));}}
});

test('Murloc Hut really evolves through Camp, Village and Fortress and produces each corresponding native troop',()=>{
 const g=new Game(114,{mode:'castlefight'});g.addPlayer('p','turtle');g.addPlayer('q','knight');g.initCastleFight();const p=g.player('p');p.gold=p.lumber=100000;
 const until=fn=>{for(let i=0;i<2200&&!fn();i++)g.tick(.05);assert.ok(fn());};
 assert.equal(g.command('p',{type:'cfBuild',building:'naga_h00H',x:-34,z:12}),true,g.commandFailureReason);const b=g.castleFight.buildings.at(-1);until(()=>b.economyReady);
 const units=[];for(const key of ['naga_h00H','naga_h020','naga_h021','naga_h022']){if(b.key!==key){assert.equal(g.command('p',{type:'cfUpgrade',buildingId:b.id,building:key}),true,g.commandFailureReason);until(()=>b.key===key);}const troop=g.castleSpawn(b);assert.ok(troop);assert.equal(troop.unitKey,B[key].unit);assert.equal(troop.maxHp,U[B[key].unit].hp);units.push(troop.unitKey);}
 assert.deepEqual(units,['n003','n00I','n00J','n00K']);assert.equal(new Set(units.map(k=>portrait(k))).size,4);
});
