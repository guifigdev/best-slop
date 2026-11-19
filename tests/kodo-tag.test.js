import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {KodoTagMethods,kodoBuildCheck} from '../shared/kodo-tag.js';
import {KODO_TAG_REFERENCE as REF,KODO_TAG_RULES as R,KODO_TAG_BUILDINGS as B,KODO_TAG_UNITS as U,KODO_TAG_MAP as MAP,KODO_TAG_ITEMS as I} from '../shared/kodo-tag-catalog.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function setup(){const g=new Game(16,{mode:'kodotag'});Object.assign(g,KodoTagMethods);assert.equal(g.addPlayer('p','runner','Runner P'),true);assert.equal(g.addPlayer('q','runner','Runner Q'),true);assert.equal(g.initKodoTag(),true);return{g,p:g.player('p'),q:g.player('q')};}
function quiet(g){g.kodoTag.released=true;g.kodoTag.escalationIndex=R.escalation.length;g.kodoTag.obstacles=[];g.kodoTag.mines=[];g.kodoTag.navigationRevision++;}
function tick(g,sec){for(let t=0;t<sec-1e-9;t+=.05)g.tick(Math.min(.05,sec-t));}
function until(g,fn,limit=50){for(let t=0;t<limit&&!fn();t+=.05)g.tick(.05);assert.ok(fn(),'condition must complete through actual ticking');}
function build(g,p,key,x=10,z=8){p.gold=p.lumber=10000;p.x=8;p.z=8;assert.equal(g.command(p.owner,{type:'ktBuild',building:key,x,z}),true,g.commandFailureReason);const b=g.kodoTag.buildings.at(-1);until(g,()=>b.workRemaining===0,80);return b;}
function kodo(g,key='oC06',x=15,z=8){const d=U[key],u={...d,id:g.id(),unitKey:key,owner:'kodos',team:2,x,z,maxHp:d.hp,hp:d.hp,maxMana:0,mana:0,alive:true,kind:'kodo',kodoTagUnit:true,kodoTagKodo:true,cd:0,stun:0,order:'auto',inventory:[]};g.units.push(u);return u;}

test('classic v1.6 hash, native build menu, costs, fragile runners and separate worker identities are pinned',()=>{
 assert.equal(REF.author,'TinyTauren');assert.equal(REF.sha256,'8b3ed66313ae54d46002b8c059340f80248097f916196d37082892c9d3020635');assert.equal(REF.bytes,56595);assert.equal(Object.keys(B).length,8);assert.deepEqual(Object.keys(I),[]);assert.equal(U.uC13.hp,1);assert.equal(U.uC13.speed,300/128);assert.equal(B.hC08.cost,0);assert.equal(B.hC08.buildTime,1);assert.deepEqual(B.hC08.train,['hC19']);assert.equal(U.hC19.cost,300);assert.equal(U.hC19.buildTime,20);assert.equal(U.hC19.canBuild,false);assert.equal(U.oC06.hp,10000);near(U.oC06.damage,6);assert.equal(U.oC22.hp,20000);assert.equal(MAP.obstacles.length,18);assert.equal(MAP.minZ,-28);assert.equal(R.duration,1500);
});

test('a Runner walks to the construction before working and produces a separate peasant only after the native queue time',()=>{
 const {g,p}=setup();quiet(g);p.x=-10;p.z=8;p.gold=500;assert.equal(g.command('p',{type:'ktBuild',building:'hC08',x:10,z:8}),true);const b=g.kodoTag.buildings.at(-1);tick(g,.05);assert.equal(b.workRemaining,1);assert.equal(p.working,false);until(g,()=>b.workRemaining===0);assert.equal(p.working,false);assert.equal(p.gold,500);assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'hC19'}),true);assert.equal(p.gold,200);assert.deepEqual(b.productionQueue,['hC19']);tick(g,19.9);assert.equal(g.units.some(u=>u.kodoTagWorker),false);tick(g,.15);const w=g.units.find(u=>u.kodoTagWorker);assert.ok(w);assert.equal(w.hero,undefined);assert.equal(w.owner,'p');assert.equal(w.unitKey,'hC19');assert.equal(w.hp,10);assert.deepEqual(b.productionQueue,[]);
});

test('gold is gathered as a carried load and credited only on return to the owned Big Wall; explicit Stop stays stopped',()=>{
 const {g,p}=setup();quiet(g);const b=build(g,p,'hC08');p.gold=1000;assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'hC19'}),true);tick(g,20.1);const w=g.units.find(u=>u.kodoTagWorker);const mine={id:'mine-test',x:14,z:8,w:1.6,d:1.6,gold:100,remaining:100,alive:true};g.kodoTag.mines=[mine];g.kodoTag.navigationRevision++;assert.equal(g.command('p',{type:'ktGather',workerId:w.id,mineId:mine.id}),true);const gold=p.gold;until(g,()=>w.carrying?.amount>0);assert.equal(p.gold,gold);assert.equal(w.carrying.amount,10);assert.equal(mine.remaining,90);until(g,()=>p.gold>gold);assert.equal(p.gold,gold+10);assert.equal(g.command('p',{type:'ktStop',workerId:w.id}),true);const pos={x:w.x,z:w.z};tick(g,3);assert.deepEqual({x:w.x,z:w.z},pos);assert.equal(w.kodoTagAction,null);assert.equal(w.gathering,false);
});

test('ownership and native worker capabilities are enforced without charging failed builds or training',()=>{
 const {g,p,q}=setup();quiet(g);const b=build(g,p,'hC08');p.gold=300;assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'hC19'}),true);tick(g,20.1);const w=g.units.find(u=>u.kodoTagWorker);assert.equal(g.command('q',{type:'ktMove',workerId:w.id,x:0,z:0}),false);const gold=p.gold;assert.equal(g.command('p',{type:'ktBuild',workerId:w.id,building:'hC07',x:3,z:4}),false);assert.match(g.commandFailureReason,/Somente.*Runner/);assert.equal(p.gold,gold);assert.equal(kodoBuildCheck(g,w,'hC07',{x:3,z:4}).allowed,false);assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'oC22'}),false);assert.equal(g.command('p',{type:'ktUseItem',slot:0}),false);assert.equal(g.command('q',{type:'ktDemolish',buildingId:b.id}),false);assert.equal(q.gold,0);
});

test('Kodos reach a Big Wall from a diagonal instead of targeting blocked points inside its inflated collision box',()=>{
 const {g,p,q}=setup();quiet(g);const b=build(g,p,'hC08');p.x=q.x=-20;p.z=-20;q.z=-18;const mob=kodo(g,'oC06',b.x+Math.cos(Math.PI/8)*5,b.z+Math.sin(Math.PI/8)*5),start={x:mob.x,z:mob.z};until(g,()=>!b.alive,35);assert.ok(mob.attackAt>0);assert.ok(Math.hypot(mob.x-start.x,mob.z-start.z)>2);assert.equal(mob.kodoTagBlocked,false);const after={x:mob.x,z:mob.z};tick(g,2);assert.ok(Math.hypot(mob.x-after.x,mob.z-after.z)>1,'continues toward a live Runner after destroying the structure');
});

test('towers deal their native damage and killing a super Kodo spawns two babies and a timed replacement',()=>{
 const {g,p,q}=setup();quiet(g);const b=build(g,p,'oC16');p.x=q.x=-20;p.z=-20;q.z=-18;const mob=kodo(g,'oC06',13,8);tick(g,.05);near(mob.hp,9700);mob.alive=false;const boss=kodo(g,'oC22',13,8);boss.hp=1;b.cd=0;tick(g,.05);assert.equal(boss.alive,false);assert.equal(g.units.filter(u=>u.unitKey==='nspd'&&u.alive).length,2);const task=g.kodoTag.respawns.find(r=>r.unit==='oC22');near(task.at-g.kodoTag.elapsed,45);b.alive=false;for(const u of g.units.filter(u=>u.kodoTagKodo))u.alive=false;tick(g,44.9);assert.equal(g.units.filter(u=>u.unitKey==='oC22'&&u.alive).length,0);tick(g,.15);assert.equal(g.units.filter(u=>u.unitKey==='oC22'&&u.alive).length,1);
});

test('capture removes the owner base and workers, keeps earned resources and allows an ally to rescue at the central flag',()=>{
 const {g,p,q}=setup();quiet(g);const b=build(g,p,'hC08');p.gold=1000;assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'hC19'}),true);tick(g,20.1);const w=g.units.find(u=>u.kodoTagWorker);p.gold=123;p.x=10;p.z=6;q.x=-20;q.z=-20;kodo(g,'oC06',10,6.1);tick(g,.05);assert.equal(p.kodoTagCaptured,true);assert.equal(b.alive,false);assert.equal(w.alive,false);assert.equal(p.gold,123);assert.equal(g.phase,'wave');assert.equal(g.command('p',{type:'ktMove',x:4,z:4}),false);Object.assign(q,g.kodoTag.map.jail);tick(g,.05);assert.equal(p.kodoTagCaptured,false);assert.equal(p.hp,1);assert.equal(p.gold,123);assert.ok(Math.hypot(p.x-g.kodoTag.map.spawn.x,p.z-g.kodoTag.map.spawn.z)<3);
});

test('the native runner population supply reserves queued archer and tower food without limiting free walls',()=>{
 const {g,p}=setup();quiet(g);const b=build(g,p,'hC11');p.gold=10000;for(let i=0;i<5;i++)assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'hC12'}),true);assert.equal(g.command('p',{type:'ktTrain',buildingId:b.id,unit:'hC12'}),false);assert.match(g.commandFailureReason,/Alimento/);assert.equal(kodoBuildCheck(g,p,'hC07',{x:3,z:4}).allowed,true);assert.equal(kodoBuildCheck(g,p,'oC21',{x:3,z:4}).allowed,false);assert.equal(p.foodCap,10);
});

test('release, escalation, victory and snapshots use native times and exclude internal pathfinding caches',()=>{
 const {g}=setup();g.player('p').x=g.player('q').x=-20;g.player('p').z=-20;g.player('q').z=-18;tick(g,14.95);assert.equal(g.units.some(u=>u.kodoTagKodo),false);tick(g,.1);assert.equal(g.units.filter(u=>u.kodoTagKodo).length,2);const s=JSON.parse(JSON.stringify(g.snapshotKodoTag()));assert.equal(s.navigation,undefined);assert.equal(s.step,undefined);assert.equal(s.mines.length,16);assert.equal(s.obstacles.length,18);assert.equal(s.players.p.character,'runner');for(const u of g.units.filter(u=>u.kodoTagKodo))u.alive=false;g.kodoTag.elapsed=1499.95;g.kodoTag.escalationIndex=R.escalation.length;tick(g,.1);assert.equal(g.phase,'victory');assert.deepEqual(g.winningOwners,['p','q']);
});

test('four runners survive a real sixty-second simulation with navigating Kodos attacking and destroying their Big Walls',()=>{
 const g=new Game(16,{mode:'kodotag'});assert.equal(g.addPlayer('p','runner','Human'),true);g.addBots(3);assert.equal(g.initKodoTag(),true);tick(g,60);
 const kodos=g.units.filter(u=>u.kodoTagKodo);assert.equal(kodos.length,2);near(g.kodoTag.elapsed,60);assert.ok(kodos.every(u=>u.attackAt>0));assert.ok(kodos.some(u=>Math.hypot(u.x-MAP.jail.x,u.z-MAP.jail.z)>3));assert.ok(g.kodoTag.buildings.some(b=>!b.alive),'Kodos must actually break a bot depot');assert.ok(kodos.every(u=>u.kodoTagBlocked===false));assert.ok(g.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.z)));
});
