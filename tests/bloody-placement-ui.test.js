import test from 'node:test';
import assert from 'node:assert/strict';
import {createBloodyTournamentUI} from '../src/bloody-tournament-ui.js';
test('recruitment waits for terrain confirmation, shift repeats and cancellation never buys a unit',()=>{
 const sent=[],previews=[],state={options:{mode:'bloody'},players:{p:1},units:[{id:1,owner:'p',btRoster:[{id:4,key:'shieldwall'}]}],bloodyTournament:{stage:'preparation'}},ui=createBloodyTournamentUI({getState:()=>state,getOwner:()=> 'p',send:c=>(sent.push(c),true),view:{setBloodyBuild:key=>previews.push(key)}});
 ui.recruit('shieldwall');assert.equal(sent.length,0);assert.equal(previews.at(-1),'shieldwall');ui.point({point:{x:30,z:40},button:0,shiftKey:true});assert.deepEqual(sent.at(-1),{type:'btBuy',unitKey:'shieldwall',x:30,z:40});assert.equal(ui.isBuilding(),true);ui.point({point:{x:32,z:44},button:0});assert.equal(sent.length,2);assert.equal(ui.isBuilding(),false);assert.equal(previews.at(-1),null);
 ui.recruit('hunters');ui.shortcut('escape');assert.equal(sent.length,2);ui.recruit('hunters');ui.point({point:{x:0,z:0},button:2});assert.equal(sent.length,2);
 ui.point({point:{x:30,z:40},bloodyEntry:4,bloodyOwner:'p',button:0});assert.equal(ui.isBuilding(),false);assert.equal(sent.length,2);ui.point({point:{x:34,z:42},button:2});assert.deepEqual(sent.at(-1),{type:'btPlace',entryId:4,x:34,z:42});
});
test('a rejected terrain purchase retains its preview and never masquerades as a successful recruitment',()=>{
 const messages=[],ui=createBloodyTournamentUI({getState:()=>({options:{mode:'bloody'},units:[],bloodyTournament:{stage:'preparation'}}),getOwner:()=> 'p',send:()=>false,toast:t=>messages.push(t)});ui.recruit('shieldwall');ui.point({point:{x:0,z:0},button:0});assert.equal(ui.isBuilding(),true);assert.ok(!messages.some(m=>m==='Grupo recrutado e posicionado.'));
});
