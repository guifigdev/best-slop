import test from 'node:test';import assert from 'node:assert/strict';
import {createVisualFluid} from '../src/visual-fluid.js';
import {createVoxelFluidSurface,VOXEL_FLUID_SURFACE_BUDGET as B} from '../src/voxel-fluid-surface.js';

test('touching fluid volumes share an exterior surface without internal transparent faces',()=>{
 const fluid=createVisualFluid(),surface=createVoxelFluidSurface();try{fluid.spawn({x:.065,y:1.105,z:.065});surface.rebuild(fluid);const one=surface.stats();fluid.spawn({x:.195,y:1.105,z:.065});surface.rebuild(fluid);const merged=surface.stats();assert.ok(merged.cells>one.cells);assert.ok(merged.faces<one.faces*2,'shared faces are removed');assert.ok(merged.faces>0);const positions=surface.geometry.attributes.position.array;assert.ok(Array.from(positions.subarray(0,merged.faces*18)).every(Number.isFinite));const normal=surface.geometry.attributes.normal.array;for(let i=0;i<merged.faces*18;i+=3)assert.equal(Math.hypot(normal[i],normal[i+1],normal[i+2]),1);assert.equal(surface.geometry.drawRange.count,merged.faces*6);surface.reset();assert.equal(surface.geometry.drawRange.count,0);}finally{surface.dispose();fluid.dispose();}
});

test('water surface rebuilds reuse bounded buffers, respect distance, and hand settled droplets to the basin layer',()=>{
 const fluid=createVisualFluid(),surface=createVoxelFluidSurface(),positions=surface.geometry.attributes.position.array;try{for(let i=0;i<512;i++)fluid.spawn({x:i*.30,y:2,z:0});surface.rebuild(fluid,{focus:{x:0,z:0},maxDistance:2});const near=surface.stats();surface.rebuild(fluid);assert.ok(surface.stats().cells>near.cells);assert.ok(surface.stats().cells<=B.cells);assert.ok(surface.stats().faces<=B.faces);assert.equal(surface.geometry.attributes.position.array,positions);surface.rebuild(fluid,{floorAt:()=>2});assert.equal(surface.stats().faces,0);}finally{surface.dispose();fluid.dispose();}
});
