import {roTownNpcParts} from '../src/ro-town-art.js';
import {RO_TOWN_NPC_MODELS} from '../src/ro-town-npc-models.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {createRoEquipment,roBagUsage,roEquipmentBonuses} from '../shared/ragnarok-equipment.js';
import {roKafraTransfer,validateRoWarehouse,RO_KAFRA_CAPACITY} from '../shared/ro-kafra.js';
import {createRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';
import {saveRoCharacter,mergeRoProgress} from '../src/ragnarok-account-ui.js';
import {RO_TOWN_SERVICE_TYPES,roTownServiceSnapshot} from '../shared/ro-town-services.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';
import {roSandParticles,RO_SAND_BUDGET} from '../src/ro-sand-kick-art.js';
import {roEquipmentBagMarkup} from '../src/ro-equipment-bag-ui.js';

const setup=()=>{const g=new Game(17,{mode:'bonk',bonkWorld:'dominion'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;u.gold=10000;return{g,u};};
const open=(g,u,type)=>{const o=g.bonk.objects.find(o=>o.type===type);assert.ok(o);u.x=o.x;u.z=o.z;assert.ok(g.command('p',{type:'bkTownOpen',object:o.id}));return o;};
test('Kafra moves one real copy atomically, keeps enchants/refinement and refuses equipped or overflowing transfers',()=>{
 const item={...createRoEquipment('knife','bag'),refine:3,enchants:{damage:2}},u={roInventory:[item],roEquipment:{}};assert.ok(roKafraTransfer(u,'deposit','bag',{id:()=>1}).ok);assert.equal(u.roInventory.length,0);assert.equal(u.roWarehouse.items.length,1);assert.equal(u.roWarehouse.revision,1);assert.ok(roKafraTransfer(u,'withdraw','kafra:1').ok);assert.equal(u.roInventory[0].refine,3);assert.deepEqual(u.roInventory[0].enchants,{damage:2});assert.equal(u.roWarehouse.revision,2);
 u.roEquipment.weapon=u.roInventory[0].id;const before=JSON.stringify(u);assert.equal(roKafraTransfer(u,'deposit',u.roInventory[0].id).ok,false);assert.equal(JSON.stringify(u),before);
 u.roEquipment={};u.roWarehouse={version:1,revision:2,items:Array.from({length:RO_KAFRA_CAPACITY},(_,i)=>createRoEquipment('knife','stored'+i))};const full=JSON.stringify(u);assert.equal(roKafraTransfer(u,'deposit',u.roInventory[0].id).ok,false);assert.equal(JSON.stringify(u),full);
});
test('account progress keeps one shared warehouse across different characters and activity saves',()=>{
 const {g,u}=setup();u.roInventory.push(createRoEquipment('knife','gift'));assert.ok(roKafraTransfer(u,'deposit','gift',{id:()=>1}).ok);let p=saveRoCharacter(null,{id:'first',lineage:'dragonknight',checkpoint:createRoCheckpoint(g),warehouse:u.roWarehouse});assert.ok(p);const newer=structuredClone(p);newer.warehouse.revision++;newer.warehouse.items=[];const merged=mergeRoProgress(p,newer);assert.equal(merged.warehouse.revision,2);assert.equal(merged.warehouse.items.length,0);p=saveRoCharacter(merged,{id:'second',lineage:'dragonknight',checkpoint:createRoCheckpoint(g)});assert.equal(validateRoProgress(p).warehouse.revision,2);assert.equal(validateRoWarehouse({...p.warehouse,revision:-1}),null);
});
test('region services use real shop stock, debit exactly once and reject remote or unsafe commands',()=>{
 const {g,u}=setup();assert.equal(g.bonk.objects.filter(o=>RO_TOWN_SERVICE_TYPES.includes(o.type)).length,5);open(g,u,'equipmentShop');const stock=roTownServiceSnapshot(g,u).stock;assert.ok(stock.length>=4);const offer=stock[0],gold=u.gold,bag=roBagUsage(u);assert.ok(g.command('p',{type:'bkTownBuy',key:offer.key}));assert.equal(u.gold,gold-offer.price);assert.equal(roBagUsage(u),bag+1);const before=JSON.stringify(u);assert.equal(g.command('p',{type:'bkTownBuy',key:'forged'}),false);assert.equal(JSON.stringify(u),before);u.x+=20;assert.equal(g.command('p',{type:'bkTownBuy',key:offer.key}),false);open(g,u,'potionShop');g.units.push({id:99,bonkEnemy:true,alive:true,x:u.x,z:u.z});assert.equal(g.command('p',{type:'bkTownBuy',key:'potion'}),false);
});
test('optional refines split a stack without losing copies and preserve full skill bonuses at +0',()=>{
 const {g,u}=setup(),item=createRoEquipment('build_5899','ribbon');u.roInventory.push({...item,quantity:2});open(g,u,'blacksmith');const before=roEquipmentBonuses({...u,roEquipment:{head:'ribbon'}}).skillBonuses.RK_WINDCUTTER.cooldownSeconds;assert.equal(before,1.8);assert.ok(g.command('p',{type:'bkTownRefine',item:'ribbon'}));const refined=u.roInventory.find(i=>i.id==='ribbon');assert.equal(refined.refine,1);assert.equal(u.roInventory.filter(i=>i.key===item.key).length,2);assert.equal(roEquipmentBonuses({...u,roEquipment:{head:'ribbon'}}).skillBonuses.RK_WINDCUTTER.cooldownSeconds,before);
});
test('cave walls carve open routes and object pockets; snowy villages remain outdoors',()=>{
 for(const key of ['payon-cave','ice-cavern','thor-volcano']){const route=roWorldRegion(key,17),map=generateBonkLevel(17,route.scene,route.habitat,route);assert.ok(map.enclosed?.cellCount>50,key);for(const o of [map.spawn,...map.objects])assert.ok(!map.obstacles.filter(w=>w.type==='cave-wall').some(w=>Math.abs(o.x-w.x)<w.w/2+.5&&Math.abs(o.z-w.z)<w.d/2+.5),key+' '+o.id);for(const path of map.paths)for(let i=0;i<=30;i++){const p={x:path.from.x+(path.to.x-path.from.x)*i/30,z:path.from.z+(path.to.z-path.from.z)*i/30};assert.ok(!map.obstacles.filter(w=>w.type==='cave-wall').some(w=>Math.abs(p.x-w.x)<w.w/2+1&&Math.abs(p.z-w.z)<w.d/2+1));}}
 const route=roWorldRegion('lutie',17);assert.equal(generateBonkLevel(17,route.scene,route.habitat,route).enclosed,undefined);
});
test('Sand Attack produces a bounded forward dust fan, stays world fixed and fades completely',()=>{
 const state={effects:Array.from({length:20},(_,i)=>({id:i,type:'roAttack',skillKey:'tf_sprinklesand',time:1,x:4,z:5,direction:0,range:4}))},parts=roSandParticles(state,1.2,()=>2);assert.equal(parts.puffs.length,RO_SAND_BUDGET.puffs);assert.equal(parts.grains.length,RO_SAND_BUDGET.grains);assert.ok(parts.puffs.every(p=>p.z>5&&p.opacity>0&&p.y>2));assert.deepEqual(roSandParticles({...state,camera:{x:999}},1.2,()=>2),parts);assert.deepEqual(roSandParticles(state,2.2),{puffs:[],grains:[]});
});
test('real equipment cells use original client sprites; empty slots retain silhouettes',()=>{
 const item=createRoEquipment('knife','knife'),html=roEquipmentBagMarkup({roInventory:[item],roEquipment:{}});assert.match(html,/data-ro-item-icon="1201"/);assert.match(html,/ro-equipment-icons\/1201\.png/);assert.match(html,/data-bag-cell="29"/);
});


test('Town NPCs retain five distinct original sprite silhouettes as finite cached solid voxel models',()=>{
 const silhouettes=new Set();for(const type of RO_TOWN_SERVICE_TYPES){const body=RO_TOWN_NPC_MODELS[type],parts=roTownNpcParts({type});assert.ok(body.length>800&&parts.length<1700);assert.equal(parts,roTownNpcParts({type}),'static NPC geometry is cached');assert.ok(parts.every(p=>p.slice(0,7).every(Number.isFinite)&&p.slice(3,6).every(n=>n>0)));assert.ok(Math.abs(Math.max(...body.map(p=>p[1]+p[4]/2))-2.5)<.001);silhouettes.add(JSON.stringify(body));}assert.equal(silhouettes.size,5);assert.deepEqual(roTownNpcParts({type:'chest'}),[]);
});
