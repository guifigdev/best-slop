import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createDungeonWorld} from '../src/dungeon-world.js';
import {generateDungeonFloor} from '../shared/dungeon.js';
import {dungeonPanelMarkup,createDungeonUI} from '../src/dungeon-ui.js';
test('the dungeon renderer reuses finite instanced batches across floors, supports an empty lobby, and releases owned resources',()=>{
 const scene=new T.Scene(),sky=new T.Color(0x223344);scene.background=sky;const world=createDungeonWorld({scene});try{world.update({options:{mode:'dungeon'},dungeon:null},0);assert.equal(world.root.visible,true);for(let i=1;i<=5;i++){const map=generateDungeonFloor(44,i),objects=['chest','merchant','shrine','portal','corpse','gold','equipment','fragment'].map((type,n)=>({id:n+1,type,x:n*2,z:0,locked:false,rarity:'legendary'}));world.update({options:{mode:'dungeon'},dungeon:{map,objects,stage:'explore'}},i);assert.ok(world.root.children.length<=4);for(const mesh of world.root.children){assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok(mesh.geometry.attributes.position.count>0);}assert.deepEqual(world.pick({x:0,z:0}),{dungeonObject:1});}world.update({options:{mode:'tower'}},9);assert.equal(world.root.visible,false);assert.equal(scene.background,sky);}finally{world.dispose();}assert.equal(scene.children.length,0);
});
test('run summaries escape names, retain real objectives and team results, and never submit actions on render',()=>{
 const u={id:1,owner:'p',dungeonTeam:1},state={options:{mode:'dungeon'},phase:'wave',players:{p:1},units:[u],dungeon:{floor:8,limit:50,floorName:'Cripta',stage:'explore',gateOpen:false,kills:3,guardiansGoal:12,bossAlive:true,exitSeconds:null,teams:[{team:1,alive:1,eliminated:false,ready:false,kills:3,members:[{name:'<script>alert(1)</script>',alive:true}]}]}};const html=dungeonPanelMarkup(state,'p');assert.match(html,/Andar 8/);assert.match(html,/3 \/ 12/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);const calls=[],ui=createDungeonUI({getState:()=>state,getOwner:()=> 'p',send:c=>calls.push(c)});ui.render();assert.equal(calls.length,0);state.phase='preparation';assert.equal(ui.ready(),1);assert.deepEqual(calls[0],{type:'dgReady'});
});
