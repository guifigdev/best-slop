import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisualFluid,VISUAL_FLUID_BUDGET as B} from '../src/visual-fluid.js';

test('neighbor density and pressure separate a dense packet while conserving its center of mass',()=>{
 const fluid=createVisualFluid({gravity:0,viscosity:0,restDensity:.2}),a=fluid.spawn({x:0,y:1,z:0}),b=fluid.spawn({x:.08,y:1,z:0}),isolated=fluid.spawn({x:5,y:1,z:0});fluid.step();assert.ok(fluid.data.density[a]>0);assert.equal(fluid.data.density[isolated],0);assert.ok(fluid.data.x[b]-fluid.data.x[a]>.08,'pressure actually changes neighbor trajectories');assert.ok(Math.abs((fluid.data.x[a]+fluid.data.x[b])*.5-.04)<.00001);assert.ok(fluid.stats().pairs>=1);fluid.dispose();
});
test('viscosity transfers velocity between neighboring particles instead of using independent ballistic paths',()=>{
 const fluid=createVisualFluid({gravity:0,pressure:0,nearPressure:0,viscosity:.2}),a=fluid.spawn({x:0,y:1,z:0,vx:1}),b=fluid.spawn({x:.20,y:1,z:0,vx:-1});fluid.step();assert.ok(fluid.data.vx[a]<.99);assert.ok(fluid.data.vx[b]>-.99);assert.ok(Math.abs(fluid.data.vx[a]+fluid.data.vx[b])<.00001);fluid.dispose();
});
test('droplets collide with the real height field and rectangular obstacles and generate foam at contact',()=>{
 const fluid=createVisualFluid(),a=fluid.spawn({x:3,y:.09,z:0,vy:-4}),b=fluid.spawn({x:.2,y:1,z:.1});fluid.step(()=>0,[{x:0,z:0,w:1,d:1,h:3}]);assert.ok(fluid.data.y[a]>=.069);assert.ok(fluid.data.foam[a]>.1);assert.ok(Math.abs(fluid.data.x[b])>=.569||Math.abs(fluid.data.z[b])>=.569);assert.ok(fluid.stats().collisions>=2);fluid.dispose();
});
test('the pool, fixed time step and catch-up work remain bounded; rewind and long gaps clear obsolete water',()=>{
 const fluid=createVisualFluid();for(let i=0;i<900;i++)fluid.spawn({x:i*.04,y:2,z:0});assert.equal(fluid.active.length,B.particles);assert.ok(fluid.stats().droppedParticles>0);fluid.advance(0);fluid.advance(.3);assert.equal(fluid.stats().steps,B.substeps);assert.ok(fluid.stats().droppedTime>0);fluid.advance(2);assert.equal(fluid.active.length,0);assert.ok(fluid.spawn({x:0,y:2,z:0})>=0);fluid.advance(1);assert.equal(fluid.active.length,0);fluid.dispose();
});
test('seeded packet state is reproducible and all coupled particles stay finite at peak capacity',()=>{
 function run(){const fluid=createVisualFluid();for(let i=0;i<512;i++)fluid.spawn({x:(i%16)*.11,y:1+Math.floor(i/256)*.12,z:Math.floor(i/16)%16*.11,vx:.4,life:3});for(let i=0;i<20;i++)fluid.step();for(const id of fluid.active)for(const k of ['x','y','z','vx','vy','vz','density'])assert.ok(Number.isFinite(fluid.data[k][id]));return fluid;}
 const a=run(),b=run();for(const k of ['x','y','z','vx','vy','vz','density'])assert.deepEqual(a.data[k],b.data[k]);assert.ok(a.stats().cells<=B.particles);a.dispose();b.dispose();
});

test('30 Hz and 60 Hz display updates advance the same deterministic 60 Hz coupled simulation',()=>{
 function run(hz){const f=createVisualFluid();for(let i=0;i<30;i++)f.spawn({x:(i%5)*.12,y:1+Math.floor(i/5)*.08,z:0,vx:.4,life:3});f.advance(0);for(let i=1;i<=hz;i++)f.advance(i/hz);return f;}
 const a=run(30),b=run(60);assert.equal(a.stats().steps,60);assert.equal(b.stats().steps,60);for(const k of ['x','y','z','vx','vy','vz'])assert.deepEqual(a.data[k],b.data[k]);a.dispose();b.dispose();
});
