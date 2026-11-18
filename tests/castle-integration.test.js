import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {capacity,modeOptions} from '../shared/modes.js';
import {CASTLE_RACES,CASTLE_BUILDINGS,CASTLE_LAYOUT} from '../shared/castle-catalog.js';
import {castleBuildingCard,castleCounters} from '../src/castle-ui.js';
import {sceneState} from '../src/scene-state.js';

test('Castle Fight is a third game and binds the reference race to the animal and preserves the selected lane count',()=>{
 const options=modeOptions({game:'castlefight',race:'mech',laneCount:1});assert.equal(options.game,'castlefight');assert.equal(options.mode,'castlefight');assert.equal(options.race,undefined);assert.equal(capacity(options),4);const g=new Game(991,options);g.addPlayer('me','mage');g.addBots(3);assert.deepEqual(g.player('me').skills,[]);assert.equal(g.command('me',{type:'ready'}),true);for(let i=0;i<100&&!g.castleFight;i++)g.tick(1/30);assert.ok(g.castleFight);assert.equal(g.castleFight.map.lanes.length,1);assert.equal(g.castleFight.players.me.race,'elf');assert.equal(new Set(Object.values(g.castleFight.players).map(p=>p.team)).size,2);
 assert.equal(g.command('me',{type:'attribute',attribute:'int'}),false);assert.equal(g.command('me',{type:'buy',skill:'bolt'}),false);assert.equal(g.command('me',{type:'attack',target:g.player('bot-0').id}),false);assert.equal(g.command('me',{type:'cast',slot:0,target:g.player('bot-0').id}),false);assert.equal(g.command('me',{type:'item',item:'blade'}),false);
});
test('Castle snapshot exposes automatic troops to the shared renderer without isolating the two teams',()=>{
 const g=new Game(992,{mode:'castlefight'});g.addPlayer('me');g.addBots(3);g.initCastleFight();for(let i=0;i<2400;i++)g.tick(1/30);const s=g.snapshot();assert.equal(s.castleFight.map.lanes.length,2);assert.ok(s.castleFight.buildings.some(b=>b.owner==='bot-0'));assert.ok(s.units.some(u=>u.castleUnit));assert.equal(s.units.filter(u=>u.hero).length,4);assert.ok(s.obstacles.some(o=>o.type==='scenery'));assert.equal(sceneState(s,'me').origin.x,0);assert.equal(sceneState(s,'bot-0').state.units.length,s.units.length);assert.ok(s.units.filter(u=>u.hero).every(u=>u.hp===u.maxHp&&u.skills.length===0));
});
test('building cards expose attack/armor counters and refuse unsupported reference structures',()=>{
 const entries=Object.entries(CASTLE_BUILDINGS),[key,b]=entries.find(([,b])=>b.unit&&b.race==='human'),html=castleBuildingCard(key,b,10000);assert.match(html,/data-cf-build=/);assert.match(html,/HP /);assert.match(html,/ATQ /);assert.match(castleCounters({attackType:'normal'}),/média/);const unsupported=entries.find(([,b])=>b.playable===false);if(unsupported)assert.match(castleBuildingCard(...unsupported,10000),/disabled/);assert.equal(Object.keys(CASTLE_RACES).length,10);
});
test('the playable Castle scene actually receives the extracted terrain and original tree/rock locations',()=>{
 const g=new Game(993,{mode:'castlefight'});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();const s=g.snapshot(),map=s.voxelMap;assert.equal(map.width,48);assert.equal(map.height,32);assert.equal(map.palette.length,9);assert.deepEqual(map.biomes,CASTLE_LAYOUT.terrain.biomes);assert.deepEqual(map.heights,CASTLE_LAYOUT.terrain.heights);assert.ok(s.obstacles.length>150);for(const prop of s.obstacles.filter(o=>o.scenery)){assert.ok(CASTLE_LAYOUT.doodads.some(d=>d.rawId===prop.nativeRawId&&d.x===prop.x&&d.z===prop.z));assert.ok(Math.hypot(prop.x,prop.z)>3);}assert.ok(Math.max(...map.heights)>2);
});
