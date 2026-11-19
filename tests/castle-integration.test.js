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
test('expanded Castle terrain preserves source provenance, flattens green bases and clears spawn lanes',()=>{
 const g=new Game(993,{mode:'castlefight'});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();const s=g.snapshot(),map=s.voxelMap,cf=s.castleFight;
 assert.equal(cf.map.width,104);assert.equal(cf.map.depth,56);assert.equal(map.width*map.tileSize,104);assert.equal(map.height*map.tileSize,56);assert.equal(map.palette.length,9);assert.equal(CASTLE_LAYOUT.terrain.width,48);
 for(let row=0;row<map.height;row++)for(let col=0;col<map.width;col++){const x=map.origin.x+(col+.5)*map.tileSize,z=map.origin.z+(row+.5)*map.tileSize,i=row*map.width+col;if(cf.map.buildZones.some(b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ)){assert.equal(map.biomes[i],2);assert.equal(map.heights[i],0);assert.equal(map.walkable[i],1);}}
 assert.ok(s.obstacles.length>10);for(const prop of s.obstacles.filter(o=>o.scenery)){assert.ok(CASTLE_LAYOUT.doodads.some(d=>d.rawId===prop.nativeRawId&&d.x===prop.nativeX&&d.z===prop.nativeZ));assert.ok(!cf.map.buildZones.some(b=>prop.x>b.minX&&prop.x<b.maxX&&prop.z>b.minZ&&prop.z<b.maxZ));assert.ok(!cf.map.lanes.some(l=>Math.abs(prop.z-l.z)<4.6&&Math.abs(prop.x)<25));}
 assert.ok(cf.map.lanes.every(l=>l.right.x-l.left.x>=46));
});
