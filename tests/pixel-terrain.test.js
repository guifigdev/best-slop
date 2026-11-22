import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {pixelTerrainAtlas,createPixelTerrainMaterial,PIXEL_TERRAIN_BUDGET as B,pixelTerrainForArena,pixelTerrainForRegion} from '../src/pixel-terrain.js';
import {createScenery,sceneryRenderParts} from '../src/scenery.js';
import {sceneryTreeArt} from '../src/scenery-tree-art.js';
import {sceneryObstacles} from '../shared/scenery.js';

test('pixel ground atlas is deterministic, small, varied and mipmapped for distant terrain',()=>{
 const a=pixelTerrainAtlas(),b=pixelTerrainAtlas();try{assert.deepEqual(a.image.data,b.image.data);assert.equal(a.image.width,128);assert.equal(a.image.data.length,65536);assert.equal(a.magFilter,T.NearestFilter);assert.equal(a.generateMipmaps,true);assert.equal(a.minFilter,T.LinearMipmapLinearFilter);assert.equal(B.extraDrawCalls,0);assert.equal(B.extraTriangles,0);assert.ok(B.textureBytesWithMipmaps<90000);const surfaces=[];for(let n=0;n<16;n++){const ox=n%4*32,oy=Math.floor(n/4)*32,colors=new Set();for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=((oy+y)*128+ox+x)*4;assert.equal(a.image.data[i+3],255);colors.add(a.image.data.slice(i,i+3).join(','));}assert.ok(colors.size>5);surfaces.push([...colors].join('|'));}assert.equal(new Set(surfaces).size,16);}finally{a.dispose();b.dispose();}
});

test('terrain shader preserves the lighting hook, handles instances and vertex biomes, and disposes its atlas once',()=>{
 const material=new T.MeshLambertMaterial(),light={value:1};material.onBeforeCompile=shader=>shader.uniforms.previousLight=light;
 const ground=createPixelTerrainMaterial({material,perVertexSurface:true}),shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>'};material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.previousLight,light);assert.equal(shader.uniforms.pixelTerrainAtlas.value,ground.texture);assert.match(shader.vertexShader,/instanceMatrix\*pixelTerrainPosition/);assert.match(shader.fragmentShader,/pixelTerrainSurfaceKind/);assert.match(shader.fragmentShader,/smoothstep\(38.0,95.0/);assert.equal(material.map,null,'no unused UV/map attribute dependency');
 ground.setSurface(pixelTerrainForArena('glacier'));assert.equal(shader.uniforms.pixelTerrainSurface.value,2);assert.equal(pixelTerrainForRegion('sands'),'sand');let count=0;ground.texture.addEventListener('dispose',()=>count++);ground.dispose();ground.dispose();assert.equal(count,1);
});

test('detailed trees keep authoritative footprints and use one cached batch; only canopy voxels sway',()=>{
 const scene=new T.Scene(),view=createScenery({scene}),entries=[{id:'p',kind:'pine',x:3,z:4},{id:'b',kind:'birch',x:-3,z:4},{id:'s',kind:'boulder',x:0,z:8}],before=sceneryObstacles(entries);
 try{for(const kind of ['pine','birch']){const art=sceneryTreeArt(kind);assert.equal(sceneryTreeArt(kind),art);assert.ok(art.parts.length>=70&&art.parts.length<=140);for(const p of art.parts)assert.ok(p.slice(0,6).every(Number.isFinite)&&p.slice(3,6).every(n=>n>0));}
 view.update(entries,{time:1});const mesh=scene.children[0].children[0],matrix=mesh.instanceMatrix.array.slice(),mask=mesh.geometry.attributes.foliageMask.array;assert.equal(scene.children[0].children.length,1);assert.equal(mesh.count,entries.reduce((n,e)=>n+sceneryRenderParts(e).length,0));assert.equal(mask.reduce((n,x)=>n+x,0),sceneryTreeArt('pine').leaves.length+sceneryTreeArt('birch').leaves.length);
 view.update(entries,{time:2});assert.equal(scene.children[0].children[0],mesh);assert.deepEqual(mesh.instanceMatrix.array,matrix);assert.equal(mesh.material.userData.foliageWind.time.value,2);assert.deepEqual(sceneryObstacles(entries),before);
 }finally{view.dispose();}assert.equal(scene.children.length,0);
});
