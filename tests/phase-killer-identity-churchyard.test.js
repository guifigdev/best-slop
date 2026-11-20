import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {PHASE_PLAYER_COLORS} from '../shared/phase-killer.js';
import {PHASE_CEMETERY,PHASE_TOWN,PHASE_TOWN_HOUSE_RELOCATIONS} from '../shared/phase-killer-level.js';
import {PHASE_KILLER_MAP as MAP} from '../shared/phase-killer-catalog.js';
import {phaseKillerWorldObstacles,phaseKillerForestObstacles} from '../shared/phase-killer-world.js';
import {castlePassable,castleRouteAvailable,castleNavigationRadius} from '../shared/castle-navigation.js';
import {phaseGraveArt,phaseChurchyardArt} from '../src/phase-killer-scenery-art.js';
import {createPhaseKillerWorld} from '../src/phase-killer-world.js';
import {phaseKillerNavigation} from '../shared/phase-killer-navigation.js';

function game(){const g=new Game(92,{mode:'phasekiller'});for(let i=0;i<12;i++)g.addPlayer('p'+i,'townsperson','Morador secreto '+i);g.initPhaseKiller();return g;}
test('names are human-only in packets and stable colors survive transformation and return',()=>{
 const g=game();g.phaseKiller.assignAt=0;g.tick(.01);const killer=g.units.find(u=>u.pkRole==='killer'),watcher=g.units.find(u=>u.pkRole!=='killer');Object.assign(watcher,{x:killer.x+2,z:killer.z});
 assert.equal(g.snapshotFor(watcher.owner).units.find(u=>u.id===killer.id).name,killer.name);
 const color=killer.pkColor;assert.equal(g.command(killer.owner,{type:'pkCast',skill:'A002'}),true);
 for(const owner of [killer.owner,watcher.owner]){const publicKiller=g.snapshotFor(owner).units.find(u=>u.id===killer.id);assert.equal(publicKiller.pkHuman,false);assert.equal(publicKiller.pkDisplayName,null);assert.notEqual(publicKiller.name,killer.name);assert.equal(publicKiller.pkColor,color);}
 killer.cooldowns.A002=0;assert.equal(g.command(killer.owner,{type:'pkCast',skill:'A002'}),true);const human=g.snapshotFor(watcher.owner).units.find(u=>u.id===killer.id);assert.equal(human.pkHuman,true);assert.equal(human.pkDisplayName,killer.name);assert.equal(human.pkColor,color);
});
test('twelve arrivals have distinct colors and two metres of breathing room in free ground',()=>{
 const g=game(),people=g.units.filter(u=>u.pkCharacter),ctx={map:MAP.normal,buildings:phaseKillerWorldObstacles().filter(b=>b.dimension==='normal'),obstacles:phaseKillerForestObstacles('normal')};assert.equal(new Set(people.map(u=>u.pkColor)).size,12);assert.equal(PHASE_PLAYER_COLORS.length,12);
 for(const u of people){assert.ok(castlePassable(ctx,u,.3));for(const v of people.filter(v=>v.id>u.id))assert.ok(Math.hypot(u.x-v.x,u.z-v.z)>2.2);}
});
test('churchyard has varied accessible graves, an open church-facing gate and a separate front cross',()=>{
 const ctx={map:MAP.normal,buildings:phaseKillerWorldObstacles().filter(b=>b.dimension==='normal'),obstacles:phaseKillerForestObstacles('normal')},graves=ctx.buildings.filter(b=>b.phaseProp==='grave'),cross=ctx.buildings.find(b=>b.id===PHASE_CEMETERY.cross.id),palette={wall:0x888888};assert.equal(graves.length,12);assert.equal(new Set(graves.map(b=>b.style)).size,4);assert.ok(graves.every(g=>g.z>0));
 assert.ok(castleRouteAvailable(ctx,MAP.spawn,PHASE_CEMETERY.gate,.3));assert.ok(castlePassable(ctx,{x:PHASE_CEMETERY.gate.x-1.2,z:PHASE_CEMETERY.gate.z},.3));assert.ok(cross.x>PHASE_CEMETERY.gate.x&&cross.x<122);assert.ok(phaseChurchyardArt(cross,palette).parts.some(p=>p[3]>1));
 for(const grave of graves){const model=phaseGraveArt(grave,palette);assert.ok(model.parts.length>=5);assert.ok(castleRouteAvailable(ctx,PHASE_CEMETERY.gate,{x:grave.x+1,z:grave.z},.3));}
});
test('churchyard exchanges the two left cottage plots without moving the church or blocking the street',()=>{
 const buildings=phaseKillerWorldObstacles().filter(b=>b.dimension==='normal'),ctx={map:MAP.normal,buildings,obstacles:phaseKillerForestObstacles('normal')};
 assert.deepEqual({x:PHASE_CEMETERY.x,z:PHASE_CEMETERY.z},{x:73.2,z:4.55});
 for(const [id,point]of Object.entries(PHASE_TOWN_HOUSE_RELOCATIONS)){
  const house=buildings.find(b=>b.id===id);assert.ok(house,id+' retained');assert.deepEqual({x:house.x,z:house.z},point);
  assert.ok(Math.abs(house.x-103)+house.w/2<=8);assert.ok(Math.abs(house.z-7)+house.d/2<=4);
 }
 const church=buildings.find(b=>b.phaseProp==='church'),cross=buildings.find(b=>b.phaseProp==='cross');assert.equal(church.x,PHASE_TOWN.church.x);assert.equal(church.z,PHASE_TOWN.church.z);assert.equal(cross.x,118.4);assert.equal(cross.z,5.2);
 for(let x=PHASE_CEMETERY.gate.x;x<=92;x+=.4)assert.ok(castlePassable(ctx,{x,z:PHASE_CEMETERY.gate.z},.3),'east gate connects to the street');
 for(const grave of buildings.filter(b=>b.phaseProp==='grave'))assert.ok(!buildings.some(b=>b.phaseProp==='house'&&Math.abs(b.x-grave.x)<(b.w+grave.w)/2&&Math.abs(b.z-grave.z)<(b.d+grave.d)/2));
});
test('existing visitors and loot survive a relocated cottage plot without remaining inside its walls',()=>{
 const g=game(),p=g.phaseKiller,visitor=g.player('p0'),untouched=g.player('p1'),house=p.buildings.find(b=>b.id==='town-house-7-3');
 p.levelRevision=4;house.x=68.2;house.z=4.275;Object.assign(visitor,{x:98,z:6.725});const hp=visitor.hp,still={x:untouched.x,z:untouched.z};
 const loot=p.loot.find(l=>l.dimension==='normal');Object.assign(loot,{x:98,z:6.725});const item={id:loot.id,key:loot.key,charges:loot.charges},count=p.loot.length;
 assert.equal(g.migratePhaseKillerScale(),true);const nav=phaseKillerNavigation(g,'normal');assert.ok(castlePassable(nav,visitor,castleNavigationRadius(visitor)));assert.ok(castlePassable(nav,loot,.3));assert.equal(visitor.hp,hp);assert.deepEqual({x:untouched.x,z:untouched.z},still);assert.equal(p.loot.length,count);assert.deepEqual({id:loot.id,key:loot.key,charges:loot.charges},item);
 const after={x:visitor.x,z:visitor.z};assert.equal(g.migratePhaseKillerScale(),false);assert.deepEqual({x:visitor.x,z:visitor.z},after);
});
test('new and existing expeditions have discoverable loot near arrival without continuous respawns',()=>{
 const g=game();assert.equal(g.phaseKiller.loot.filter(l=>l.dimension==='normal').length,44);assert.ok(g.phaseKiller.loot.filter(l=>l.dimension==='normal'&&Math.hypot(l.x-MAP.spawn.x,l.z-MAP.spawn.z)<14).length>=4);
 g.phaseKiller.loot=g.phaseKiller.loot.slice(0,8);delete g.phaseKiller.lootRevision;g.tick(.01);assert.equal(g.phaseKiller.loot.length,90);g.phaseKiller.loot.pop();g.tick(.01);assert.equal(g.phaseKiller.loot.length,89,'collected loot is not recreated every tick');
});
test('stone details gain layered silhouettes and all ground loot has bounded visible signals',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene}),g=game();try{world.update(g.snapshotFor('p0'),1,'p0');const rocks=world.root.getObjectByName('phase-rocks'),stones=phaseKillerForestObstacles('normal').filter(o=>o.phaseProp==='rock'),signals=world.root.getObjectByName('phase-loot-signals');assert.ok(rocks.count>stones.length*10);assert.equal(signals.count,44*5);assert.ok(world.root.children.length<=19);const count=world.root.children.length;world.update(g.snapshotFor('p0'),2,'p0');assert.equal(world.root.children.length,count);}finally{world.dispose();}assert.equal(scene.children.length,0);
});
