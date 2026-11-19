import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS,CASTLE_UNITS} from '../shared/castle-catalog.js';
import {castleWeaponFor,castleTargetSummary} from '../shared/castle-weapons.js';
import {castleProductionStatus,castleProductionPanel} from '../src/castle-production-ui.js';
import {advanceCastleRoute} from '../shared/castle-marching.js';

function setup(){const g=new Game(112,{mode:'castlefight'});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();g.castleDefenseTick=()=>{};g.player('a').gold=g.player('a').lumber=10000;return g;}
function advance(g,t){for(let i=0;i<Math.ceil(t*20);i++)g.tick(.05);}
function build(g,x=-30,z=18){assert.equal(g.command('a',{type:'cfBuild',building:'human_h000',x,z}),true);return g.castleFight.buildings.at(-1);}
function until(g,condition){for(let i=0;i<3000&&!condition();i++)g.tick(.05);assert.ok(condition());}

test('a builder must walk to the site and work over the native duration before income and production unlock',()=>{
 const g=setup(),p=g.player('a'),b=build(g);assert.equal(b.readyAt,null);assert.equal(b.economyReady,false);assert.equal(b.workProgress,0);assert.equal(b.hp,b.maxHp*.1);
 const born={x:p.x,z:p.z};advance(g,.2);assert.ok(Math.hypot(p.x-born.x,p.z-born.z)>0);assert.equal(b.workProgress,0);assert.equal(g.castleFight.units.length,0);
 until(g,()=>p.castleWorking);assert.equal(p.castleWorker.target,b.id);assert.ok(Math.hypot(p.x-b.x,p.z-b.z)<4);assert.ok(b.workProgress>0&&b.workProgress<1);assert.equal(b.economyReady,false);
 until(g,()=>b.economyReady);assert.ok(b.completedAt-b.workStartedAt>=CASTLE_BUILDINGS[b.key].buildTime-.05);assert.equal(b.workProgress,1);assert.ok(Math.abs(b.hp-b.maxHp)<1e-6);assert.ok(b.nextSpawn>b.completedAt);
 until(g,()=>g.castleFight.units.length>0);const unit=g.castleFight.units[0];assert.equal(unit.building,b.id);assert.ok(Math.hypot(unit.x-b.x,unit.z-b.z)<3.1);
});

test('repeated placement queues actual worker orders; stopping pauses work and continuing resumes it',()=>{
 const g=setup(),p=g.player('a'),a=build(g,-31,18),b=build(g,-38,18);assert.deepEqual(p.castleWorkQueue,[a.id,b.id]);until(g,()=>a.workProgress>.15);const first=a.workProgress;
 assert.equal(g.command('a',{type:'cfStop'}),true);advance(g,3);assert.equal(a.workProgress,first);assert.equal(b.workProgress,0);
 assert.equal(g.command('a',{type:'cfResume',buildingId:a.id}),true);until(g,()=>a.economyReady);assert.equal(b.economyReady,false);until(g,()=>b.economyReady);assert.ok(b.workStartedAt>=a.completedAt);
});

test('automatic repair is enabled by default, costs resources, reaches the target, and cannot repair enemies or dead structures',()=>{
 const g=setup(),p=g.player('a'),b=build(g,-32,0);until(g,()=>b.economyReady);assert.equal(p.castleAutoRepair,true);b.hp-=100;const before=b.hp,gold=p.gold;advance(g,1);assert.ok(b.hp>before);assert.ok(p.gold<gold);
 assert.equal(g.command('a',{type:'cfAutoRepair',enabled:false}),true);const hp=b.hp;advance(g,1);assert.equal(b.hp,hp);
 const enemy=g.castleFight.teams.find(t=>t.team===2);assert.equal(g.command('a',{type:'cfRepair',buildingId:enemy.id}),false);
 assert.equal(g.command('a',{type:'cfRepair',buildingId:b.id}),true);advance(g,1);assert.ok(b.hp>hp);b.alive=false;assert.equal(g.command('a',{type:'cfRepair',buildingId:b.id}),false);
});

test('production panel shows progress, future recurring births and truthful obstruction/cap states for a selected producer',()=>{
 const g=setup(),b=build(g),cf=g.castleFight;let status=castleProductionStatus(cf,b,g.heroes());assert.equal(status.constructing,true);assert.match(status.label,/Aguardando/);
 until(g,()=>b.economyReady);status=castleProductionStatus(cf,b,g.heroes());assert.equal(status.remaining,b.nextSpawn-cf.elapsed);assert.equal(status.progress,0);assert.match(castleProductionPanel(cf,b,g.heroes()),/Produção contínua/);assert.match(castleProductionPanel(cf,b,g.heroes()),/Ciclo de produção/);
 cf.elapsed=b.nextSpawn;status=castleProductionStatus(cf,b,g.heroes());assert.equal(status.blocked,true);assert.match(status.label,/Saída ocupada/);
 cf.units=Array.from({length:60},()=>({alive:true,team:b.team}));assert.match(castleProductionStatus(cf,b).label,/espaço no exército/);b.alive=false;assert.equal(castleProductionStatus(cf,b),null);
});

test('map target masks distinguish ground-only, air-only creep attacks, dual structure weapons, and disabled attacks',()=>{
 const ground={flying:false},air={flying:true},building={castleStructure:true};
 const footman=CASTLE_UNITS.hfoo,sniper=CASTLE_UNITS.hrif,marksman=CASTLE_UNITS.h05C,rotor=CASTLE_UNITS.h06Q;
 assert.ok(castleWeaponFor(footman,ground));assert.equal(castleWeaponFor(footman,air),null);assert.ok(castleWeaponFor(sniper,air));assert.equal(castleWeaponFor(marksman,ground),null);assert.equal(castleWeaponFor(marksman,air).slot,1);assert.equal(castleWeaponFor(marksman,building).slot,2);assert.equal(castleWeaponFor(rotor,ground),null);assert.equal(castleWeaponFor(CASTLE_UNITS.n01U,ground),null);assert.match(castleTargetSummary(marksman),/voadoras, estruturas/);
 const tower=Object.values(CASTLE_BUILDINGS).find(b=>b.rawId==='o000').castleEffect;assert.equal(castleWeaponFor(tower,air).damage,70);assert.equal(castleWeaponFor(tower,ground).damage,22.5);
});

test('troops dispersed beside either lane exit advance after a skirmish instead of returning to the gate center',()=>{
 for(const team of [1,2])for(const lane of [0,1]){
  const g=setup(),cf=g.castleFight,d=team===1?1:-1,b={id:901,key:'human_h000',team,owner:team===1?'a':'b',lane,x:-d*32,z:cf.map.lanes[lane].z,w:2.5,d:2.5,spawnCount:0};
  const u=g.castleSpawn(b);Object.assign(u,{x:d*22.8,z:cf.map.lanes[lane].z+(lane===1?6:-6),pathIndex:1});assert.equal(advanceCastleRoute(cf,u),true);assert.equal(u.pathIndex,2);
  const x=u.x;advance(g,5);assert.ok(d*(u.x-x)>1,'continues toward the castle instead of back to the narrow exit');assert.equal(u.pathIndex,2);
 }
});


test('placing a foundation beside or underneath the builder does not trap the builder before work can start',()=>{
 for(const x of [-37,-38,-39]){const g=setup(),b=build(g,x,0);until(g,()=>b.economyReady);assert.equal(b.workProgress,1);assert.ok(g.player('a').castleWorkApproach.point);}
});

test('explicit repair reaches a friendly castle even with automatic repair disabled',()=>{
 const g=setup(),p=g.player('a'),castle=g.castleFight.teams.find(t=>t.team===p.team);castle.hp=castle.maxHp-300;
 assert.equal(g.command('a',{type:'cfAutoRepair',enabled:false}),true);assert.equal(g.command('a',{type:'cfRepair',buildingId:castle.id}),true);until(g,()=>p.castleWorking);const before=castle.hp;advance(g,.5);assert.ok(castle.hp>before);assert.equal(p.castleWorker.target,castle.id);
});
