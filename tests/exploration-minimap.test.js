import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {minimapProject,minimapUnproject,minimapCameraFootprint} from '../src/exploration-minimap.js';
test('the minimap preserves world proportions and cursor navigation never escapes the real map',()=>{
 const bounds={minX:-78,maxX:78,minZ:-80,maxZ:76};for(const p of [{x:0,z:0},{x:-78,z:-80},{x:78,z:76},{x:22,z:-17}]){const q=minimapProject(p,bounds,176,132),r=minimapUnproject(q,bounds,176,132);assert.ok(Math.hypot(p.x-r.x,p.z-r.z)<1e-8);}assert.deepEqual(minimapUnproject({x:-50,y:300},bounds,176,132),{x:-78,z:76});
});
test('the visible camera footprint is a local fraction of the expanded world instead of a fixed overview rectangle',()=>{
 const camera=new T.PerspectiveCamera(37,1.6,.1,1000);camera.position.set(15,32,22);camera.lookAt(0,0,0);camera.updateMatrixWorld();const points=minimapCameraFootprint(camera);assert.equal(points.length,4);assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));const span=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x));assert.ok(span>15&&span<75);camera.position.multiplyScalar(2);camera.lookAt(0,0,0);camera.updateMatrixWorld();const wide=minimapCameraFootprint(camera),wideSpan=Math.max(...wide.map(p=>p.x))-Math.min(...wide.map(p=>p.x));assert.ok(wideSpan>span*1.9);
});
