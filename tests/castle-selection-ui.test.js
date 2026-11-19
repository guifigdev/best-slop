import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {createCastleUI} from '../src/castle-ui.js';
import {castleProductionControls,selectedCastleProducers} from '../src/castle-selection-ui.js';
import {castleProductionStatus} from '../src/castle-production-ui.js';
import {skillPreview} from '../src/skill-preview.js';
import {CASTLE_RESCUE_STRIKE} from '../shared/castle-fight.js';

test('double clicking forwards visible same-type selection and single click restores one primary',()=>{
 const g=new Game(7,{mode:'castlefight'});g.addPlayer('a','knight');g.addPlayer('b','raccoon');g.initCastleFight();
 const calls=[],view={setCastleBuild(){},setCastleSelection:ids=>calls.push(ids),setInspected(){},visibleCastleMatches:()=>[31,32]};
 const ui=createCastleUI({view,send:()=>true,getState:()=>g.snapshot(),getOwner:()=> 'a',toast(){},portrait(){},onEnd(){}});
 ui.point({point:{x:-40,z:0},building:31,button:0,doubleClick:true});assert.deepEqual(calls.at(-1),[31,32]);
 ui.point({point:{x:-40,z:0},building:32,button:0});assert.deepEqual(calls.at(-1),[32]);
 ui.point({point:{x:-40,z:0},unit:{id:31},building:32,button:0,doubleClick:true});assert.deepEqual(calls.at(-1),[31,32]);
});
test('production controls target living owned producers and expose paused state without a false blocked output',()=>{
 const key=Object.values(CASTLE_BUILDINGS).find(b=>b.playable&&b.unit).key;
 const buildings=[{id:1,owner:'a',alive:true,key,productionPaused:true,productionRemaining:7,spawnInterval:20,workRemaining:0},{id:2,owner:'a',alive:true,key,productionPaused:false},{id:3,owner:'b',alive:true,key},{id:4,owner:'a',alive:false,key}];
 const cf={buildings,units:[],elapsed:99};assert.deepEqual(selectedCastleProducers(cf,'a',[1,2,3,4,1]).map(b=>b.id),[1,2]);
 const markup=castleProductionControls(cf,'a',[1,2,3]);assert.match(markup,/2 construções selecionadas/);assert.match(markup,/1 pausada/);assert.doesNotMatch(markup,/data-cf-production="resume" disabled/);
 const status=castleProductionStatus(cf,buildings[0]);assert.equal(status.paused,true);assert.equal(status.remaining,7);assert.equal(status.blocked,false);assert.equal(status.label,'Produção pausada');
});
test('rescue aiming uses the effective builder range instead of generic spell range',()=>{
 const hero={hero:'knight',x:0,z:0,alive:true,mana:0,range:1.8};
 const skill={kind:'active',target:'ground',castRange:CASTLE_RESCUE_STRIKE.range,radius:CASTLE_RESCUE_STRIKE.radius,mana:0};
 const aim=x=>skillPreview({key:'cfRescueStrike',skill,hero,point:{x,z:0},mode:'aim',state:{phase:'wave',units:[]}});
 assert.equal(aim(3).valid,true);assert.equal(aim(CASTLE_RESCUE_STRIKE.range+1).valid,false);assert.ok(aim(3).shapes.some(s=>s.role==='range'&&s.radius===CASTLE_RESCUE_STRIKE.range));assert.ok(aim(3).shapes.some(s=>s.role==='effect'&&s.radius===CASTLE_RESCUE_STRIKE.radius));
});
