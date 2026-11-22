import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {roAutoCommands,roMobileHUDMarkup,roMobilePanelMarkup} from '../src/ro-mobile-hud.js';
import {createBonkUI} from '../src/bonk-ui.js';

test('the mobile auto control switches the actual learned skills together and rejects pending level choices',()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');
 for(const c of roAutoCommands(g.snapshotBonk('p')))assert.equal(g.command('p',c),true);assert.ok(g.snapshotBonk('p').weapons.filter(Boolean).every(w=>w.auto===false));
 for(const c of roAutoCommands(g.snapshotBonk('p')))assert.equal(g.command('p',c),true);assert.ok(g.snapshotBonk('p').weapons.filter(Boolean).every(w=>w.auto===true));
 assert.deepEqual(roAutoCommands({...g.snapshotBonk('p'),offer:{id:'pending'}}),[]);assert.equal(u.alive,true);
});

test('mobile menus suspend manual movement and casting until closed, preserving existing commands',()=>{
 const state={options:{mode:'bonk'},players:{p:1},units:[{id:1,alive:true}],bonk:{stage:'playing',weapons:[{key:'basic',auto:true},{key:'bash',auto:true}]}},sent=[],panels=[];
 const ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>(sent.push(c),true),onInventory:v=>panels.push(v)});
 ui.action('hud');ui.action('skill',0);assert.equal(sent.length,0);assert.equal(panels.at(-1),true);ui.action('auto');assert.deepEqual(sent.map(c=>[c.type,c.enabled]),[['bkAutoSkill',false],['bkAutoSkill',false]]);
 ui.action('hud');ui.action('skill',0);assert.equal(sent.at(-1).type,'bkCast');assert.equal(panels.at(-1),false);ui.action('objective');ui.action('skill',1);assert.equal(sent.at(-1).key,'basic');ui.action('objective');ui.action('skill',1);assert.equal(sent.at(-1).key,'bash');
});

test('compact status exposes health, job, objective and accessible menu controls while details are disclosed on demand',()=>{
 const b={stage:'playing',job:{name:'Mago <teste>'},jobProgress:{level:4,cap:50},route:{name:'Prontera'},clearedStages:[],weapons:[{key:'basic',name:'Bola de fogo',auto:true}]},u={name:'Mago',level:3,hp:81,maxHp:100,mana:20,maxMana:50,roInventory:[]};
 const html=roMobileHUDMarkup(b,u);assert.match(html,/Vida 81 de 100/);assert.match(html,/Base 3 · Job 4/);assert.match(html,/Mago &lt;teste&gt;/);assert.match(html,/Mais opções da expedição/);assert.match(html,/data-bk-auto-all/);assert.equal(roMobilePanelMarkup(b,u,''),'');const menu=roMobilePanelMarkup(b,u,'more');assert.match(menu,/aria-modal="true"/);for(const key of ['save','visual','skills','job','build'])assert.match(menu,new RegExp('data-bk-'+key));assert.match(menu,/data-skill-info/);assert.match(roMobilePanelMarkup(b,u,'objective','<p>Derrote o MVP</p>'),/Derrote o MVP/);
});
