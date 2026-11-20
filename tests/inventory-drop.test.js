import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';

test('dropping upgraded gear removes its bonuses and picking it back preserves the whole item',()=>{
 const g=new Game(24,{mode:'tower'});g.addPlayer('p','knight');const u=g.player('p'),entry={key:'runesword',level:4,charges:1,invested:950,enchantment:'fire',rarity:'epic',permanentEnchant:{key:'might',rarity:'rare',seed:12}};u.inventory=[structuredClone(entry)];g.refresh(u);const damage=u.damage;
 assert.equal(g.command('p',{type:'dropItem',slot:0}),true);assert.equal(u.inventory[0],null);assert.ok(u.damage<damage);assert.equal(g.drops.length,1);const d=g.drops[0];assert.equal(d.dropped,true);assert.deepEqual(d.entry,entry);assert.equal(g.command('p',{type:'dropItem',slot:0}),false);assert.equal(g.command('p',{type:'claimLoot',dropId:d.id,item:'helblade'}),true);assert.deepEqual(u.inventory[0],entry);assert.equal(g.drops.length,0);assert.equal(u.damage,damage);assert.equal(g.command('p',{type:'claimLoot',dropId:d.id}),false);
});

test('dropping consumables preserves charges and rejects bad slots/dead players',()=>{
 const g=new Game(25,{mode:'tower'});g.addPlayer('p','knight');const u=g.player('p');u.inventory=[{key:'xpbook',charges:2,xpValue:125,rarity:'rare'}];assert.equal(g.command('p',{type:'dropItem',slot:-1}),false);assert.equal(g.command('p',{type:'dropItem',slot:'0'}),false);assert.equal(g.command('p',{type:'dropItem',slot:0}),true);assert.equal(g.command('p',{type:'claimLoot',dropId:g.drops[0].id}),true);assert.equal(u.inventory[0].charges,2);assert.equal(u.inventory[0].xpValue,125);u.alive=false;assert.equal(g.command('p',{type:'dropItem',slot:0}),false);
});

test('remote dropped equipment requires walking to it rather than granting it from another map position',()=>{
 const g=new Game(26,{mode:'tower'});g.addPlayer('p','knight');const u=g.player('p');u.inventory=[{key:'runesword',level:2,charges:1}];g.command('p',{type:'dropItem',slot:0});const d=g.drops[0];u.x=d.x+10;assert.equal(g.command('p',{type:'claimLoot',dropId:d.id}),true);assert.equal(u.inventory[0],null);assert.equal(u.pendingDropId,d.id);assert.deepEqual(u.destination,{x:d.x,z:d.z});u.x=d.x;g.tick(.05);assert.equal(u.inventory[0].level,2);assert.equal(g.drops.length,0);
});

test('Phase Killer drops and retrieves charged equipment without stripping custom state',()=>{
 const g=new Game(27,{mode:'phasekiller'});g.addPlayer('p','townsperson');g.addPlayer('q','townsperson');g.initPhaseKiller();const u=g.player('p'),entry={key:'I01N',charges:2,quality:'relic'};u.inventory=[structuredClone(entry)];assert.equal(g.command('p',{type:'pkDrop',slot:0}),true);const d=g.phaseKiller.loot.at(-1);assert.equal(g.command('p',{type:'pkPickup',lootId:d.id}),true);assert.deepEqual(u.inventory[0],entry);assert.equal(g.command('p',{type:'pkPickup',lootId:d.id}),false);
});


test('Phase woodland bonfires recover nearby living players gradually without healing remote or ethereal actors',async()=>{
 const {PHASE_CAMPFIRES}=await import('../shared/phase-killer-world.js');const g=new Game(28,{mode:'phasekiller'});g.addPlayer('p','townsperson');g.addPlayer('q','townsperson');g.initPhaseKiller();const u=g.player('p'),q=g.player('q'),c=PHASE_CAMPFIRES[0];Object.assign(u,{x:c.x,z:c.z,hp:100,pkDimension:'normal',order:'stop'});Object.assign(q,{x:110,z:-20,hp:100,pkDimension:'normal',order:'stop'});const before=q.hp;g.tick(.1);assert.ok(u.hp>100);assert.equal(u.pkNearCampfire,c.id);assert.equal(q.pkNearCampfire,null);assert.ok(u.hp-100>q.hp-before);u.pkDimension='aether';g.tick(.1);assert.equal(u.pkNearCampfire,null);assert.ok(g.snapshotFor('p').phaseKiller.campfires.length===3);
});
