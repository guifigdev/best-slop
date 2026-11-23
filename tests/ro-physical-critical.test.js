import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
function shot(element,random){
 const g=new Game(46,{mode:'bonk',bonkLineage:'dragonknight'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.level=150;u.attributes.dex=130;u.x=0;u.z=0;u.bonkBuild={weapons:{basic:1},tomes:{},relics:{}};u.bonkSkillAuto={basic:false};
 const loadout={weapon:'build_21003',armor:'build_15038',garment:'build_2577',shoes:'build_470067',head:'build_5388',headMid:'build_5864',headLow:'build_5532',accessory:'criticalring',accessory2:'criticalring'};
 u.roInventory=[];u.roEquipment={};for(const [slot,key]of Object.entries(loadout)){const item=createRoEquipment(key,'critical-'+slot);if(slot==='weapon')item.enchants={crit:8};u.roInventory.push(item);u.roEquipment[slot]=item.id;}assert.equal(bonkStats(u).crit,.8,'stacked equipment and bound enchantments reach the actual critical cap');
 const e={id:g.id(),x:1,z:0,alive:true,bonkEnemy:true,hp:100000,maxHp:100000,size:1,armor:0,damage:0,speed:0,bonkNextAttack:1e9,bonkNextSpecial:1e9};g.units=[u,e];g.bonk.spawnAt=1e9;g.bonk.map.obstacles=[];g.bonk.map.walls=[];g.bonk.objectives=[];g.effects=[];g.bonk.pickups=[];g.bonk.projectiles=[{id:g.id(),source:u.id,x:0,z:0,dx:1,dz:0,speed:100,remaining:10,travelled:0,damage:100,element,radius:.1,pierce:1,hitIds:[]}];let rolls=0;g.random=()=>{rolls++;return random;};g.tick(.01);const event=g.effects.find(e=>e.type==='damage');assert.ok(event&&event.amount>0);return{damage:100000-e.hp,event,rolls};
}
test('only physical survivor damage rolls and multiplies critical hits despite maximum gear/enchantment critical chance',()=>{
 const hit=shot('physical',0),normal=shot('physical',.9);assert.equal(hit.event.critical,true);assert.equal(normal.event.critical,false);assert.ok(Math.abs(hit.damage/normal.damage-1.8)<1e-8);assert.equal(hit.rolls,1);assert.equal(normal.rolls,2,'normal physical hits retain their accuracy roll');
 for(const element of ['fire','lightning','ice','holy','wind','earth','poison','dark','arcane']){const low=shot(element,0),high=shot(element,.9);assert.equal(low.event.critical,false,element);assert.equal(high.event.critical,false,element);assert.equal(low.damage,high.damage,element+' damage must not receive a critical multiplier');assert.equal(low.rolls,0,element+' must not consume a critical RNG roll');assert.equal(high.rolls,0,element);}
});
