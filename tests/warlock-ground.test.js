import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {generateWarlockIslands,warlockSafeGround,warlockIslandScale,warlockNearestGround,WARLOCK_GROUND_RULES as R} from '../shared/warlock-ground.js';
import {createWarlockEnvironmentArt,WARLOCK_ENVIRONMENT_BUDGET as B} from '../src/warlock-environment-art.js';
import {createLegacyWorld} from '../src/legacy-world.js';
const setup=(seed=53)=>{const g=new Game(seed,{mode:'warlock'});g.addPlayer('p','warlock');g.addPlayer('q','heretic');g.initWarlock();g.startWarlockRound();for(const u of g.units){u.wlRegen=0;u.destination=null;u.wlVx=u.wlVz=0;}return{g,p:g.player('p'),q:g.player('q')};};

test('eight deterministic islands are real isolated ground inside map bounds and preserve spawn/pillar space',()=>{
 for(let seed=1;seed<=40;seed++){const islands=generateWarlockIslands(seed,2);assert.equal(islands.length,R.islands);assert.deepEqual(islands,generateWarlockIslands(seed,2));assert.notDeepEqual(islands,generateWarlockIslands(seed,3));for(const a of islands){assert.ok(Math.hypot(a.x,a.z)-Math.max(a.radiusX,a.radiusZ)>24);assert.ok(Math.abs(a.x)+a.radiusX<32&&Math.abs(a.z)+a.radiusZ<32);for(const p of [{x:-8,z:-2},{x:8,z:2},{x:0,z:12},{x:0,z:-12}])assert.ok(Math.hypot(a.x-p.x,a.z-p.z)>Math.max(a.radiusX,a.radiusZ)+1);for(const b of islands)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>Math.max(a.radiusX,a.radiusZ)+Math.max(b.radiusX,b.radiusZ)+.5);}}
});

test('safe-ground predicate includes islands, excludes their surrounding lava and shrinks/collapses islands with the arena',()=>{
 const war={arenaRadius:24,islands:generateWarlockIslands(91,1)},island=war.islands[0],rim={x:island.x+island.radiusX*.8,z:island.z};assert.ok(warlockSafeGround(war,{x:0,z:0}));assert.ok(warlockSafeGround(war,island,.47));assert.ok(warlockSafeGround(war,rim));assert.equal(warlockSafeGround(war,{x:island.x+island.radiusX+1,z:island.z}),false);assert.equal(warlockSafeGround(war,{x:26,z:0}),false);war.arenaRadius=20;assert.equal(warlockIslandScale(war),.5);assert.equal(warlockSafeGround(war,rim),false);assert.ok(warlockSafeGround(war,island,.47));war.arenaRadius=R.collapseRadius;assert.equal(warlockSafeGround(war,island),false);assert.equal(warlockIslandScale(war),0);
});

test('walking on an island prevents lava damage, while true lava ignites the public contact state without changing treads immunity',()=>{
 const {g,p}=setup(),island=g.warlock.islands[0];Object.assign(p,{x:island.x,z:island.z,hp:60});g.tick(.1);assert.equal(p.hp,60);assert.equal(p.wlLavaContactUntil,0);assert.ok(g.command('p',{type:'wlMove',x:island.x+.4,z:island.z}));g.tick(.2);assert.ok(p.x>island.x);assert.equal(p.hp,60);p.destination=null;p.x=island.x+island.radiusX+1;p.z=island.z;g.tick(.1);assert.ok(Math.abs(p.hp-59.1)<1e-6);assert.ok(p.wlLavaContactUntil>g.time);assert.equal(g.snapshot().units.find(u=>u.id===p.id).wlLavaContactUntil,p.wlLavaContactUntil);
 p.wlLavaUntil=g.time+5;const hp=p.hp;g.tick(.1);assert.equal(p.hp,hp);assert.ok(p.wlLavaContactUntil>g.time);assert.ok(p.wlLavaUntil>g.time+4,'contact state never overwrites lava-treads protection');Object.assign(p,{x:island.x,z:island.z});g.tick(.3);assert.ok(p.wlLavaContactUntil<g.time,'safe ground stops renewing burning');assert.equal(p.hp,hp);
});

test('rounds regenerate seeded ground without gameplay RNG, snapshots never jitter and collapsing islands restore lava damage',()=>{
 const {g,p}=setup(),initial=JSON.stringify(g.warlock.islands),seed=g.seed;for(let i=0;i<5;i++)g.tick(.1);assert.equal(JSON.stringify(g.snapshotWarlock().islands),initial);assert.equal(g.seed,seed);const old=g.warlock.islands[0];Object.assign(p,{x:old.x,z:old.z,hp:90});g.warlock.remaining=30;g.tick(.1);assert.equal(warlockIslandScale(g.warlock),0);assert.ok(p.hp<90);assert.ok(p.wlLavaContactUntil>g.time);g.finishWarlockRound();g.startWarlockRound();assert.notEqual(JSON.stringify(g.warlock.islands),initial);assert.equal(p.wlLavaContactUntil,0);assert.equal(g.warlock.arenaRadius,24);
});

test('actual teleport and knockback motion can land on island ground and resume safe play',()=>{
 const {g,p}=setup(),island=g.warlock.islands[0],length=Math.hypot(island.x,island.z),dx=island.x/length,dz=island.z/length;Object.assign(p,{x:dx*22,z:dz*22,hp:60});p.skills.push('S011');p.skillLevels.S011=1;p.cooldowns.S011=0;assert.ok(g.command('p',{type:'wlCast',skill:'S011',x:island.x,z:island.z}));assert.ok(Math.hypot(p.x-island.x,p.z-island.z)<1e-6);g.tick(.1);assert.equal(p.hp,60);assert.equal(p.wlLavaContactUntil,0);
 Object.assign(p,{x:island.x-dx*2.5,z:island.z-dz*2.5,wlVx:dx*12,wlVz:dz*12});g.tick(.2);assert.ok(warlockSafeGround(g.warlock,p));assert.ok(Math.hypot(p.x-island.x,p.z-island.z)<.3);assert.equal(p.hp,60);assert.equal(p.wlLavaContactUntil,0);
});

test('bot recovery targets the nearest actual ground, including a safe island, instead of blindly crossing lava to the center',()=>{
 const {g,p}=setup(),island=g.warlock.islands[0];Object.assign(p,{x:island.x+.3,z:island.z,bot:true,nextBot:-1});const goal=warlockNearestGround(g.warlock,p,1);assert.deepEqual(goal,{x:island.x,z:island.z});g.warlockBotThink(p);assert.ok(warlockSafeGround(g.warlock,p.destination,.47));assert.ok(Math.hypot(p.destination.x-island.x,p.destination.z-island.z)<1);g.warlock.arenaRadius=16;const collapsed=warlockNearestGround(g.warlock,p,1);assert.ok(Math.hypot(collapsed.x,collapsed.z)<=15.001);
});

test('island ground, low world-fixed voxel fire and sparse embers reuse three bounded draws and borrowed materials',()=>{
 const parent=new T.Group(),borrowed=new T.MeshLambertMaterial(),art=createWarlockEnvironmentArt({parent,groundMaterial:borrowed}),war={round:1,arenaRadius:24,islands:generateWarlockIslands(31,1)};let borrowedDisposed=0;borrowed.addEventListener('dispose',()=>borrowedDisposed++);try{art.update(war,4);const stats=art.stats();assert.equal(stats.islands,8);assert.equal(stats.drawCalls,3);assert.equal(stats.flames,B.flames);assert.equal(stats.embers,B.embers);assert.equal(stats.lights,0);assert.equal(art.root.children.length,3);const before=art.root.children.map(m=>({g:m.geometry,b:m.instanceMatrix.array,values:Array.from(m.instanceMatrix.array)}));art.update(war,4);for(const [i,m]of art.root.children.entries()){assert.equal(m.geometry,before[i].g);assert.equal(m.instanceMatrix.array,before[i].b);assert.deepEqual(Array.from(m.instanceMatrix.array),before[i].values);assert.ok(m.instanceMatrix.array.every(Number.isFinite));}
  const fire=art.root.getObjectByName('warlock-border-flames'),matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();for(let i=0;i<fire.count;i++){fire.getMatrixAt(i,matrix);matrix.decompose(p,q,s);assert.ok(p.y+s.y/2<1.1,'border flames remain below combat silhouettes');assert.ok(Math.abs(Math.hypot(p.x,p.z)-24)<1.5,'flames mark the actual arena edge');}war.arenaRadius=16;art.update(war,5);assert.equal(art.stats().islands,0);assert.equal(art.stats().ground,0);assert.ok(art.stats().flames<=B.flames);art.update(null,6);assert.equal(art.root.visible,false);art.reset();assert.equal(art.stats().flames,0);
 }finally{art.dispose();art.dispose();}assert.equal(parent.children.length,0);assert.equal(borrowedDisposed,0);borrowed.dispose();
});

test('legacy world integrates real island ground and hides fire with the Warlock world',()=>{
 const {g}=setup(),scene=new T.Scene(),view=createLegacyWorld({scene});try{view.update(g.snapshot(),g.time);assert.equal(view.root.getObjectByName('warlock-safe-islands').count,16);assert.equal(view.root.getObjectByName('warlock-border-flames').count,B.flames);view.update({options:{mode:'tower'},time:1},1);assert.equal(view.root.getObjectByName('warlock-lava-ground-and-fire').visible,false);}finally{view.dispose();}assert.equal(scene.children.length,0);
});
