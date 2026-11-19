import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {heroesShareArena,controlBlockReason} from '../src/player-control.js';
import {createLaneFocus} from '../src/lane-focus.js';
test('watching another finalist keeps movement addressed to the living local hero',()=>{
 const g=new Game(42,{mode:'campaign'});g.addPlayer('me','fenrir');g.addPlayer('rival','mage');g.startFinal();const focus=createLaneFocus(),p=g.player('me'),other=g.player('rival');assert.equal(focus.select(g.snapshot(),'rival'),true);assert.equal(heroesShareArena(g.snapshot(),'me',focus.owner(g.snapshot(),'me')),true);assert.equal(controlBlockReason(p,{spectating:true,sharedArena:true,phase:'final'}),'');
 const target={x:-12,z:0},rivalBefore={x:other.x,z:other.z,order:other.order};assert.equal(g.command('me',{type:'move',...target}),true);assert.deepEqual(p.destination,target);assert.equal(p.order,'move');assert.deepEqual({x:other.x,z:other.z,order:other.order},rivalBefore);assert.equal(focus.owner(g.snapshot(),'me'),'rival');
});
test('isolated trials never reuse a rival arena point, while allied occupants of the same cell share coordinates',()=>{
 const g=new Game(8,{mode:'best'});g.addPlayer('me','fenrir');g.addPlayer('rival','mage');const state=g.snapshot();assert.equal(heroesShareArena(state,'me','rival'),false);assert.match(controlBlockReason(g.player('me'),{spectating:true}),/outra arena/);g.player('rival').cell={...g.player('me').cell};assert.equal(heroesShareArena(g.snapshot(),'me','rival'),true);g.player('rival').cell=null;assert.equal(heroesShareArena(g.snapshot(),'me','rival'),false);assert.equal(heroesShareArena(state,'me','missing'),false);
});
test('a dead hero and a finished private wave remain blocked regardless of where the camera points',()=>{
 assert.match(controlBlockReason({alive:false},{sharedArena:true,spectating:true}),/derrotado/);assert.match(controlBlockReason({alive:true,stageDone:true},{sharedArena:true,spectating:true,phase:'wave'}),/Sua prova terminou/);
});
