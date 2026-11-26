import test from 'node:test';
import assert from 'node:assert/strict';
import {createMovementRollback,stepPredictedMotion,applyPredictedMove} from '../src/movement-rollback.js';
import {RO_CAST_MOVE_MULTIPLIER} from '../shared/ro-locomotion.js';
import {Game} from '../shared/simulation.js';
function classic(){return{options:{mode:'campaign'},phase:'wave',time:10,arena:'forest',bounds:50,players:{p:1},network:{movementReplay:1,ack:0},units:[{id:1,hero:'knight',alive:true,x:0,z:0,hp:99,mana:40,gold:700,speed:6,order:'stop',inventory:[{key:'mask'}],size:1},{id:2,alive:true,x:20,z:20}],obstacles:[],effects:[{id:1,type:'bolt'}]};}
test('movement starts before acknowledgement, then rolls back to server and replays only pending inputs',()=>{
 let clock=0;const r=createMovementRollback({now:()=>clock}),s=classic();r.receive(s,'p');r.sent(1,{type:'move',x:20,z:0});clock=100;const first=r.sample();assert.ok(first.units[0].x>.5);assert.equal(s.units[0].x,0);
 const next=structuredClone(s);next.time=10.05;next.units[0].x=.3;r.receive(next,'p');clock=150;assert.ok(r.sample().units[0].x>.5,'unacknowledged input is replayed over corrected base');assert.equal(r.stats().pending,1);
 next.network.ack=1;next.time=10.1;next.units[0].x=.6;next.units[0].destination={x:20,z:0};next.units[0].order='move';r.receive(next,'p');assert.equal(r.stats().pending,0);assert.ok(r.stats().rollbacks>=2);
});
test('prediction never mutates authoritative inventory, HP, effects, other players or source state',()=>{
 let clock=0;const s=classic(),before=JSON.stringify(s),r=createMovementRollback({now:()=>clock});r.receive(s,'p');r.sent(1,{type:'move',x:10,z:0});clock=100;const p=r.sample();assert.equal(JSON.stringify(s),before);assert.equal(p.units[0].hp,99);assert.equal(p.units[0].gold,700);assert.equal(p.units[0].inventory,s.units[0].inventory);assert.equal(p.effects,s.effects);assert.equal(p.units[1],s.units[1]);
});
test('stale snapshots, reconnects, phase changes and unsupported actions cannot replay old motion',()=>{
 let clock=0;const s=classic(),r=createMovementRollback({now:()=>clock});r.receive(s,'p');r.sent(1,{type:'move',x:10,z:0});clock=100;r.receive({...s,time:9},'p');assert.equal(r.sample().time,10);r.sent(2,{type:'cast',skill:'blink'});clock=150;assert.equal(r.sample(),s);r.receive({...s,phase:'preparation',network:{movementReplay:1,ack:2}},'p');assert.equal(r.stats().pending,0);r.reset();assert.equal(r.sample(),null);
});
test('walls remain solid, stale connections freeze, and legacy servers use no prediction',()=>{
 let clock=0;const s=classic();s.obstacles=[{x:1,z:0,w:.8,d:10}];const r=createMovementRollback({now:()=>clock});r.receive(s,'p');r.sent(1,{type:'move',x:20,z:0});clock=200;assert.ok(r.sample().units[0].x<.2);clock=700;assert.equal(r.sample(),s);const old={...s,network:undefined};r.receive(old,'p');assert.equal(r.sample(),old);assert.equal(r.stats().enabled,false);
});
test('Ragnarok replay uses the same locomotion and environmental speed as the real server',()=>{
 const g=new Game(71,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.routeVersion=0;g.bonk.spawnAt=Infinity;g.bonk.objectives=[];g.bonk.bossSpawned=true;g.bonk.pickups=[];u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));g.command('p',{type:'bkMove',dx:1,dz:0});const s=structuredClone(g.snapshotFor('p')),p=s.units.find(v=>v.id===s.players.p);
 for(let i=1;i<=6;i++){g.tick(1/30);stepPredictedMotion(s,p,s.time+i/30,1/30);}assert.ok(Math.abs(p.x-u.x)<1e-6);assert.ok(Math.abs(p.z-u.z)<1e-6);assert.equal(p.bonkJumpHeight,u.bonkJumpHeight);
});
test('Ragnarok menus and dead heroes stop prediction instead of inventing simulation ticks',()=>{
 const g=new Game(71,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const s=structuredClone(g.snapshotFor('p')),u=s.units[0],x=u.x;u.bonkMove={dx:1,dz:0};u.bonkMoveAt=s.bonk.elapsed;u.bonkOffer={choices:[]};stepPredictedMotion(s,u,s.time+.1,.1);assert.equal(u.x,x);u.bonkOffer=null;u.alive=false;stepPredictedMotion(s,u,s.time+.1,.1);assert.equal(u.x,x);
});

function castingFixture(){
 const g=new Game(71,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u,{id:999,bonkEnemy:true,alive:true,team:100,x:u.x,z:u.z-5,hp:1e8,maxHp:1e8,damage:0,speed:0,collisionRadius:.3,size:1,bonkNextAttack:Infinity,bonkNextSpecial:Infinity}];Object.assign(g.bonk,{routeVersion:0,spawnAt:Infinity,objectives:[],bossSpawned:true,pickups:[]});g.bonk.map.obstacles=[];g.bonk.map.walls=[];u.bonkBuild.weapons={basic:1,firebolt:1};u.bonkSkillSlots=['basic','firebolt'];u.bonkSkillAuto={basic:false,firebolt:false};u.mana=1000;
 return{g,u};
}
test('cast start, walking and cast completion use identical reduced movement on client and server',()=>{
 const {g,u}=castingFixture();g.command('p',{type:'bkMove',dx:1,dz:0});const s=structuredClone(g.snapshotFor('p')),p=s.units.find(v=>v.id===s.players.p),command={type:'bkCast',key:'firebolt',x:u.x,z:u.z-10},before=JSON.stringify(s),x=u.x;
 // Snapshot readiness may report no target; aimed projectile casts are allowed.
 assert.ok(applyPredictedMove(s,p,command,s.bonk.elapsed));assert.ok(g.command('p',command));assert.ok(u.roCasting);assert.ok(p.roCasting);
 for(let i=1;i<=6;i++){g.tick(1/30);stepPredictedMotion(s,p,s.time+i/30,1/30);assert.ok(Math.abs(p.x-u.x)<1e-6);}
 assert.ok(Math.abs(u.x-x-u.speed*.2*RO_CAST_MOVE_MULTIPLIER)<1e-6);
 assert.equal(g.bonk.projectiles.length,0);assert.ok(s.units[0].mana>0);assert.ok(before.includes('firebolt'));
 const castEnd=p.roCasting.finishAt;p.bonkMoveAt=castEnd;stepPredictedMotion(s,p,s.time+(castEnd-s.bonk.elapsed)+.01,.05);const old=p.x;stepPredictedMotion(s,p,s.time+(castEnd-s.bonk.elapsed)+.06,.05);assert.ok(Math.abs(p.x-old-p.speed*.05)<1e-6,'the client resumes full movement at the authoritative cast finish time');
});
test('repeated aim and skill inputs keep movement prediction alive without replaying combat or mutating source snapshots',()=>{
 const {g}=castingFixture(),s=g.snapshotFor('p');s.network={movementReplay:1,ack:0};let clock=0;const r=createMovementRollback({now:()=>clock}),before=JSON.stringify(s);r.receive(s,'p');r.sent(1,{type:'bkMove',dx:1,dz:0});
 r.sent(2,{type:'bkAim',active:true,x:10,z:0});r.sent(3,{type:'bkCast',key:'firebolt',x:10,z:0});clock=100;
 assert.equal(r.stats().blocked,false);assert.ok(r.sample().units[0].x>s.units[0].x);assert.equal(JSON.stringify(s),before);
 r.sent(4,{type:'bkAim',active:true,x:15,z:0});r.sent(5,{type:'bkCancelCast'});clock=150;assert.equal(r.stats().blocked,false);assert.ok(r.sample().units[0].x>s.units[0].x);assert.equal(JSON.stringify(s),before);
});
