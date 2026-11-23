import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roFacetedSurfaceGeometry} from '../src/ro-faceted-surface.js';
import {createRoGeometryPresentation} from '../src/ro-faceted-geometry.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {createBonkCanopyGeometry} from '../src/bonk-tree-art.js';
import {generateBonkLevel,bonkHeightAt,bonkBlocked} from '../shared/bonk-level.js';

const snapshot=map=>({options:{mode:'bonk'},units:[{bonkHero:true,alive:true,x:0,z:23}],bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:map.landmarks}});
function finiteGeometry(g){for(const a of Object.values(g.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));const n=g.attributes.normal;for(let i=0;i<n.count;i++){const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));assert.ok(Math.abs(length-1)<1e-4);}}

test('a real height-field crease gains planar bevel bands without erasing source anchors or changing surface categories',()=>{
 const source=new T.BufferGeometry();source.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,2,2,1,0,2,1,0,0,0,2,2,0,2],3));source.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:18},(_,i)=>i%3===1?.6:.3),3));source.setAttribute('pixelTerrainKind',new T.Float32BufferAttribute([5,5,5,7,7,7],1));source.computeVertexNormals();const saved=[...source.attributes.position.array],g=roFacetedSurfaceGeometry(source,{chamfer:1});
 finiteGeometry(g);assert.ok(g.attributes.position.count>source.attributes.position.count);assert.deepEqual([...source.attributes.position.array],saved);const pointSet=new Set();for(let i=0;i<g.attributes.position.count;i++){const p=g.attributes.position;pointSet.add([p.getX(i),p.getY(i),p.getZ(i)].join(','));}for(let i=0;i<saved.length;i+=3)assert.ok(pointSet.has(saved.slice(i,i+3).join(',')));
 for(let i=0;i<g.attributes.pixelTerrainKind.count;i+=3){const kind=g.attributes.pixelTerrainKind.getX(i);assert.ok([5,7].includes(kind));assert.equal(g.attributes.pixelTerrainKind.getX(i+1),kind);assert.equal(g.attributes.pixelTerrainKind.getX(i+2),kind);}
 assert.equal(g.userData.roTerrainCells.reduce((n,c)=>n+c.indices.length,0),g.attributes.position.count);const gentle=roFacetedSurfaceGeometry(source,{chamfer:.25});assert.notDeepEqual(g.attributes.position.array,gentle.attributes.position.array);source.dispose();g.dispose();gentle.dispose();
});

test('Ragnarok ground actually changes at 100%, keeps the pixel material, recaptures culling and restores exactly in Blocks',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene}),map=generateBonkLevel(52,'grove'),state=snapshot(map),presentation=createRoGeometryPresentation({scene});
 try{world.update(state,1);const floor=world.root.getObjectByName('bonk-organic-ground'),source=floor.geometry,material=floor.material,saved=source.attributes.position.array.slice(),height=bonkHeightAt(map,7,12),blocked=bonkBlocked(map,{x:116,z:0});
  presentation.setOptions({terrainStyle:'faceted',chamfer:1});presentation.update(0);const faceted=floor.geometry;assert.notEqual(faceted,source);assert.equal(faceted.userData.facetedTerrain,true);assert.equal(floor.material,material);assert.ok(faceted.attributes.position.count>source.attributes.position.count*2);assert.equal(faceted.attributes.pixelTerrainKind.count,faceted.attributes.position.count);assert.ok(presentation.stats().skipped===0);assert.deepEqual(source.attributes.position.array,saved);assert.equal(bonkHeightAt(map,7,12),height);assert.equal(bonkBlocked(map,{x:116,z:0}),blocked);
  const camera=new T.PerspectiveCamera(65,16/9,.1,270);camera.position.set(0,25,35);camera.lookAt(0,8,0);camera.updateMatrixWorld();world.cull(camera);assert.ok(faceted.drawRange.count>0&&faceted.drawRange.count<faceted.attributes.position.count);for(let i=0;i<faceted.drawRange.count;i++)assert.ok(faceted.index.array[i]<faceted.attributes.position.count);
  presentation.update(101);assert.equal(floor.geometry,faceted);presentation.setOptions({terrainStyle:'blocks'});presentation.update(102);assert.equal(floor.geometry,source);assert.deepEqual(source.attributes.position.array,saved);world.cull(camera);assert.ok(source.drawRange.count>0&&source.drawRange.count<source.attributes.position.count);
 }finally{presentation.dispose();world.dispose();}
});

test('faceted foliage keeps the live wind instance attribute even when the source grows or updates its buffer',()=>{
 const scene=new T.Scene(),source=createBonkCanopyGeometry(),rootAttribute=new T.InstancedBufferAttribute(new Float32Array(8),4);source.setAttribute('foliageRoot',rootAttribute);const mesh=new T.InstancedMesh(source,new T.MeshLambertMaterial({vertexColors:true}),2);mesh.castShadow=true;scene.add(mesh);const presentation=createRoGeometryPresentation({scene});
 try{presentation.setOptions({terrainStyle:'faceted',chamfer:1});presentation.update(0);const first=mesh.geometry;assert.notEqual(first,source);assert.equal(first.attributes.foliageRoot,rootAttribute);assert.ok(first.attributes.position.count>source.attributes.position.count);rootAttribute.setXYZW(0,1,2,3,4);assert.equal(first.attributes.foliageRoot.getW(0),4);
  const grown=new T.InstancedBufferAttribute(new Float32Array(16),4);source.setAttribute('foliageRoot',grown);presentation.update(101);assert.equal(mesh.geometry,first);assert.equal(first.attributes.foliageRoot,grown);finiteGeometry(first);
 }finally{presentation.dispose();source.dispose();mesh.material.dispose();}
});

test('changing region while faceted removes the old terrain and releases both original and derived geometry',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene}),presentation=createRoGeometryPresentation({scene});let oldSourceDisposed=0,oldVariantDisposed=0;
 try{world.update(snapshot(generateBonkLevel(61,'grove')),1);const oldFloor=world.root.getObjectByName('bonk-organic-ground'),oldSource=oldFloor.geometry;oldSource.addEventListener('dispose',()=>oldSourceDisposed++);presentation.setOptions({terrainStyle:'faceted',chamfer:.75});presentation.update(0);oldFloor.geometry.addEventListener('dispose',()=>oldVariantDisposed++);
  world.update(snapshot(generateBonkLevel(62,'glacier')),2);assert.equal(oldSourceDisposed,1);presentation.update(101);assert.equal(oldVariantDisposed,1);assert.equal(world.stats().terrainMeshes,1);assert.notEqual(world.root.getObjectByName('bonk-organic-ground'),oldFloor);assert.equal(presentation.stats().skipped,0);
 }finally{presentation.dispose();world.dispose();}
});
