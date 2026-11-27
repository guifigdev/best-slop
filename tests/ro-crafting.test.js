import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_CRAFT_RECIPES,RO_MATERIALS,roAddMaterial,roLearnRecipe,roCraftWeapon,roCraftMonsterLoot,roOreNodes,roStartMining,roTickMining,validateRoCrafting} from '../shared/ro-crafting.js';
import {RO_EQUIPMENT,createRoEquipment,roBagUsage} from '../shared/ragnarok-equipment.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {roTownServiceCommand} from '../shared/ro-town-services.js';
import {roCraftingMarkup} from '../src/ro-crafting-ui.js';
import {roOreVeinParts,roMiningToolParts,createRoMiningArt,RO_MINING_ART_BUDGET} from '../src/ro-mining-art.js';
import * as T from 'three';
function fixture(){const g=new Game(71,{mode:'bonk',bonkWorld:'dominion'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.bossUnlocked=false;g.bonk.objectives=[];g.bonk.map.obstacles=[];u.bonkSkillAuto={basic:false};return{g,u};}
test('every weapon has a level-gated recipe with specific monster sources and a small closed material vocabulary',()=>{
 assert.equal(Object.keys(RO_CRAFT_RECIPES).length,Object.values(RO_EQUIPMENT).filter(d=>d.slot==='weapon').length);
 for(const r of Object.values(RO_CRAFT_RECIPES)){assert.ok(r.monsters.length>=2);assert.ok(r.level>=1);assert.ok(r.price>0);for(const [key,n]of Object.entries(r.materials)){assert.ok(RO_MATERIALS[key]);assert.ok(Number.isInteger(n)&&n>0);}}
 assert.equal(validateRoCrafting({version:1,revision:0,recipes:['forged'],materials:{}}),null);assert.equal(validateRoCrafting({version:1,revision:0,recipes:[],materials:{ironOre:Infinity}}),null);
});
test('fabrication spends one exact material set, requires a learned recipe, level, room and a safe nearby smith',()=>{
 const {g,u}=fixture(),r=RO_CRAFT_RECIPES.sword;u.gold=10000;u.level=150;for(const k of Object.keys(RO_MATERIALS))roAddMaterial(u,k,100);
 const before=structuredClone(u.roCrafting);assert.equal(roCraftWeapon(g,u,r.key),false);assert.deepEqual(u.roCrafting,before);roLearnRecipe(u,r.key);
 const smith={id:'smith',type:'blacksmith',x:u.x,z:u.z,name:'Ferreiro'};g.bonk.objects=[smith];u.roTownService=smith.id;const stock=structuredClone(u.roCrafting.materials),gold=u.gold,count=u.roInventory.length;
 assert.equal(roTownServiceCommand(g,u,{type:'bkTownCraft',key:r.key}),true);assert.equal(u.roInventory.length,count+1);assert.equal(u.gold,gold-r.price);for(const [k,n]of Object.entries(r.materials))assert.equal(u.roCrafting.materials[k],stock[k]-n);
 const saved=JSON.stringify(u.roCrafting),paid=u.gold;smith.x+=20;assert.equal(roTownServiceCommand(g,u,{type:'bkTownCraft',key:r.key}),false);assert.equal(JSON.stringify(u.roCrafting),saved);assert.equal(u.gold,paid);
 while(roBagUsage(u)<30)u.roInventory.push(createRoEquipment('knife','full:'+u.roInventory.length));assert.equal(roCraftWeapon(g,u,r.key),false);assert.equal(JSON.stringify(u.roCrafting),saved);assert.equal(u.gold,paid);
});
test('specific monsters supply materials and rare physical blueprints, without perturbing the combat RNG or flooding world drops',()=>{
 const {g,u}=fixture();let calls=0;g.random=()=>{calls++;return .5;};const enemy={id:99,level:100,ragnarokVisual:'willow',x:u.x+1,z:u.z};
 const result=roCraftMonsterLoot(g,u,enemy,{random:()=>0});assert.equal(result.material,'wood');assert.equal(u.roCrafting.materials.wood,1);assert.ok(result.recipe);assert.equal(g.bonk.pickups.filter(p=>p.type==='recipe').length,1);assert.equal(g.bonk.pickups.filter(p=>p.type==='material').length,0);assert.equal(calls,0);
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.hero.roCrafting.materials.wood,1);
 roCraftMonsterLoot(g,u,{...enemy,id:100});assert.equal(calls,0,'craft rewards have their own deterministic random stream');
 const blueprint=g.bonk.pickups.find(p=>p.type==='recipe');blueprint.x=u.x;blueprint.z=u.z;g.tick(.05);assert.ok(u.roCrafting.recipes.includes(blueprint.key));assert.ok(!g.bonk.pickups.includes(blueprint));
});
test('ore requires a nearby uninterrupted channel, gives bounded charges once and persists with the character',()=>{
 const {g,u}=fixture(),node={id:'ore',type:'oreVein',x:u.x,z:u.z+1.5,material:'ironOre',charges:3,used:false};g.bonk.objects=[node];
 assert.equal(roStartMining(g,u,{...node,z:u.z+4}),false);assert.equal(g.command('p',{type:'bkInteract',object:node.id}),true);assert.ok(u.roMining);
 for(let i=0;i<20;i++)g.tick(.1);assert.equal(u.roMining,undefined);assert.equal(u.roCrafting.materials.ironOre,3);assert.equal(node.charges,2);g.tick(.1);assert.equal(u.roCrafting.materials.ironOre,3);
 assert.equal(roStartMining(g,u,node),true);u.bonkMove={dx:1,dz:0};roTickMining(g,u);assert.equal(u.roMining,undefined);assert.equal(node.charges,2);
 u.bonkMove={dx:0,dz:0};roStartMining(g,u,node);u.hitAt=123;roTickMining(g,u);assert.equal(u.roMining,undefined);assert.equal(node.charges,2);
 roLearnRecipe(u,'sword');const cp=createRoCheckpoint(g);assert.deepEqual(validateRoCheckpoint(cp).hero.roCrafting,u.roCrafting);
 assert.ok(roOreNodes({...g.bonk.map,enclosed:true}).length<=5);assert.deepEqual(roOreNodes({...g.bonk.map,enclosed:false,biome:'forest',tower:null}),[]);
});
test('mining and recipe art are finite three-dimensional geometry within one draw call and the forge UI explains costs and sources',()=>{
 const {g,u}=fixture(),node={id:'ore',type:'oreVein',x:0,z:0,material:'crystal',charges:3};u.roMining={started:0,finishAt:1.8};u.facing=.4;
 for(const p of [...roOreVeinParts(node,0),...roMiningToolParts(u,.4)]){assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(v=>v>0));}
 const scene=new T.Scene(),art=createRoMiningArt({scene});g.bonk.objects=[node];try{art.update(g.snapshotFor('p'),.4);assert.ok(art.stats().instances>0&&art.stats().instances<=RO_MINING_ART_BUDGET.instances);assert.equal(art.stats().drawCalls,1);assert.equal(art.stats().planes,0);}finally{art.dispose();}assert.equal(scene.children.length,0);
 roLearnRecipe(u,'sword');const html=roCraftingMarkup(u);assert.ok(html.includes('Minério de ferro'));assert.ok(html.includes('Fabricar'));assert.ok(html.includes('Onde encontrar'));assert.ok(html.includes('data-bk-town-craft="sword"'));
});
