import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {createLegacyUI,legacyHelpMarkup} from '../src/legacy-ui.js';
import {legacyCharacterModelKey} from '../src/legacy-character-art.js';
function ui(g){const commands=[],controller=createLegacyUI({send:c=>{commands.push(c);return g.command('p',c)},getState:()=>g.snapshot(),getOwner:()=> 'p',view:{setLegacyBuild(){},setInteraction(){},mark(){}},toast(){}});return{controller,commands};}

test('native games start through the actual Game commands and serialize isolated snapshots for online clients',()=>{
 for(const [mode,key,field,prefix]of [['treetag','ent','treeTag','tt'],['warlock','warlock','warlock','wl']]){const g=new Game(1,{mode});assert.equal(g.addPlayer('p',key),true);g.addBots(3);assert.equal(g.command('p',{type:prefix+'Ready'}),true);for(const u of g.heroes().filter(u=>u.owner!=='p'))g.command(u.owner,{type:prefix+'Ready'});g.tick(.05);const s=JSON.parse(JSON.stringify(g.snapshot()));assert.equal(s.options.mode,mode);assert.ok(s[field]);assert.equal(s.phase,'wave');assert.equal(s.units.filter(u=>u.hero).length,4);assert.equal(s.castleFight,undefined);assert.deepEqual(s.skillOwners,{});assert.ok(s.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.z)));}
});

test('Warlock targeting preview follows native fireball reach and purchased range mastery',()=>{
 const g=new Game(102,{mode:'warlock'});g.addPlayer('p','warlock');g.addPlayer('q','heretic');g.initWarlock();assert.equal(g.command('p',{type:'wlBuy',mastery:'range'}),true);for(const owner of ['p','q'])g.command(owner,{type:'wlReady'});const {controller}=ui(g);controller.shortcut('legacySkill','S000');const preview=controller.skillPreview();assert.equal(preview.key,'S000');assert.equal(preview.skill.previewShape,'line');assert.equal(preview.skill.radius,25/64);assert.ok(Math.abs(preview.skill.distance-1000/64*1.12)<1e-8);assert.equal(controller.hotkeys().G,'S000');assert.match(legacyHelpMarkup('warlock'),/11 rounds|11 round|11/);
});

test('Tree Tag sentry inventory waits for a ground click and submits the chosen location',()=>{
 const g=new Game(513,{mode:'treetag'});g.addPlayer('p','blaze');g.addPlayer('q','ent');g.initTreeTag();for(let i=0;i<301;i++)g.tick(.1);const p=g.player('p');p.mana=300;const {controller,commands}=ui(g);controller.shortcut('item',0);assert.equal(commands.length,0);controller.point({point:{x:4,z:0},button:0});assert.equal(commands[0].type,'ttUseItem');assert.equal(commands[0].x,4);assert.equal(commands[0].z,0);
});

test('Tree Tag summons share the original tree or infernal mesh family rather than an unrelated animal',()=>{assert.equal(legacyCharacterModelKey({treeTagSummon:true,kind:'treant'}),'tree:ent');assert.equal(legacyCharacterModelKey({treeTagSummon:true,kind:'infernal'}),'tree:blaze');});
