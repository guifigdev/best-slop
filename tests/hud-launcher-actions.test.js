import test from 'node:test';
import assert from 'node:assert/strict';
import {hudLauncherActions} from '../src/rts-hud.js';
const actions=(mode,u={alive:true})=>hudLauncherActions({options:{mode}},u).map(a=>a.action);
test('build is offered only in construction games, never in Custom Hero or Ragnarok',()=>{
 for(const mode of ['campaign','tower','best','war','linewars','dungeon','bonk','bloody','warlock','phasekiller'])assert.ok(!actions(mode).includes('build'),mode);
 for(const mode of ['castlefight','treetag','kodotag'])assert.ok(actions(mode).includes('build'),mode);
});
test('roles and capture state remove unavailable building actions',()=>{
 assert.ok(!actions('treetag',{alive:true,treeTagRole:'infernal'}).includes('build'));
 assert.ok(!actions('treetag',{alive:true,treeTagRole:'ent',treeTagCaptured:true}).includes('build'));
 assert.ok(!actions('kodotag',{alive:true,kodoTagCaptured:true}).includes('build'));
 assert.ok(!actions('kodotag',{alive:false}).includes('build'));
});
test('modes without item inventory hide the bag while equipment games keep access even when empty',()=>{
 for(const mode of ['kodotag','bloody'])assert.ok(!actions(mode).includes('inventory'));
 for(const mode of ['campaign','tower','best','war','linewars','bonk','dungeon','castlefight','treetag','warlock','phasekiller'])assert.ok(actions(mode).includes('inventory'),mode);
 assert.deepEqual(hudLauncherActions(null,null),[]);assert.deepEqual(hudLauncherActions({options:{mode:'campaign'}},null),[]);
 assert.equal(hudLauncherActions({options:{mode:'bloody'}},{alive:true})[0].label,'Exército');
});
