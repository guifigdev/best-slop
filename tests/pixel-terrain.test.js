import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {pixelTerrainAtlas,createPixelTerrainMaterial,PIXEL_TERRAIN_BUDGET as B,pixelTerrainForArena,pixelTerrainForRegion,pixelTerrainForPalette,pixelTerrainSurfaceIndex} from '../src/pixel-terrain.js';
import {buildVoxelTerrain} from '../src/voxel-terrain.js';
import {castleMap,CASTLE_TERRAIN_PALETTE} from '../shared/castle-map.js';
import {createMoltenLavaMaterial,MOLTEN_LAVA_GLSL} from '../src/lava-material.js';
import {createScenery,sceneryRenderParts} from '../src/scenery.js';
import {sceneryTreeArt} from '../src/scenery-tree-art.js';
import {sceneryObstacles} from '../shared/scenery.js';

test('pixel ground atlas is deterministic, small, varied and mipmapped for distant terrain',()=>{
 const a=pixelTerrainAtlas(),b=pixelTerrainAtlas();try{assert.deepEqual(a.image.data,b.image.data);assert.equal(a.image.width,128);assert.equal(a.image.data.length,65536);assert.equal(a.magFilter,T.NearestFilter);assert.equal(a.generateMipmaps,true);assert.equal(a.minFilter,T.LinearMipmapLinearFilter);assert.equal(B.extraDrawCalls,0);assert.equal(B.extraTriangles,0);assert.ok(B.textureBytesWithMipmaps<90000);const surfaces=[];for(let n=0;n<16;n++){const ox=n%4*32,oy=Math.floor(n/4)*32,colors=new Set();for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=((oy+y)*128+ox+x)*4;assert.equal(a.image.data[i+3],255);colors.add(a.image.data.slice(i,i+3).join(','));}assert.ok(colors.size>5);surfaces.push([...colors].join('|'));}assert.equal(new Set(surfaces).size,16);}finally{a.dispose();b.dispose();}
});

test('terrain shader preserves the lighting hook, handles instances and vertex biomes, and disposes its atlas once',()=>{
 const material=new T.MeshLambertMaterial(),light={value:1};material.onBeforeCompile=shader=>shader.uniforms.previousLight=light;
 const ground=createPixelTerrainMaterial({material,perVertexSurface:true}),shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>'};material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.previousLight,light);assert.equal(shader.uniforms.pixelTerrainAtlas.value,ground.texture);assert.match(shader.vertexShader,/instanceMatrix\*pixelTerrainPosition/);assert.match(shader.vertexShader,/flat varying float pixelTerrainSurfaceKind/);assert.match(shader.fragmentShader,/flat varying float pixelTerrainSurfaceKind/);assert.match(shader.fragmentShader,/pixelTerrainSurfaceKind/);assert.match(shader.fragmentShader,/smoothstep\(38.0,95.0/);assert.equal(material.map,null,'no unused UV/map attribute dependency');
 ground.setSurface(pixelTerrainForArena('glacier'));assert.equal(shader.uniforms.pixelTerrainSurface.value,2);assert.equal(pixelTerrainForRegion('sands'),'sand');let count=0;ground.texture.addEventListener('dispose',()=>count++);ground.dispose();ground.dispose();assert.equal(count,1);
});

test('detailed trees keep authoritative footprints and use one cached batch; only canopy voxels sway',()=>{
 const scene=new T.Scene(),view=createScenery({scene}),entries=[{id:'p',kind:'pine',x:3,z:4},{id:'b',kind:'birch',x:-3,z:4},{id:'s',kind:'boulder',x:0,z:8}],before=sceneryObstacles(entries);
 try{for(const kind of ['pine','birch']){const art=sceneryTreeArt(kind);assert.equal(sceneryTreeArt(kind),art);assert.ok(art.parts.length>=70&&art.parts.length<=140);for(const p of art.parts)assert.ok(p.slice(0,6).every(Number.isFinite)&&p.slice(3,6).every(n=>n>0));}
 view.update(entries,{time:1});const mesh=scene.children[0].children[0],matrix=mesh.instanceMatrix.array.slice(),mask=mesh.geometry.attributes.foliageMask.array;assert.equal(scene.children[0].children.length,1);assert.equal(mesh.count,entries.reduce((n,e)=>n+sceneryRenderParts(e).length,0));assert.equal(mask.reduce((n,x)=>n+x,0),sceneryTreeArt('pine').leaves.length+sceneryTreeArt('birch').leaves.length);
 view.update(entries,{time:2});assert.equal(scene.children[0].children[0],mesh);assert.deepEqual(mesh.instanceMatrix.array,matrix);assert.equal(mesh.material.userData.foliageWind.time.value,2);assert.deepEqual(sceneryObstacles(entries),before);
 }finally{view.dispose();}assert.equal(scene.children.length,0);
});

test('all floor materials share one atlas until the final owner releases it, preserving existing material maps and world normals',()=>{
 const map=new T.Texture(),a=createPixelTerrainMaterial({material:new T.MeshLambertMaterial({map}),surface:'grass'}),b=createPixelTerrainMaterial({surface:'basalt'});assert.equal(a.texture,b.texture);assert.equal(a.material.map,map);const shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};a.material.onBeforeCompile(shader);assert.match(shader.vertexShader,/inverseTransformDirection\(transformedNormal,viewMatrix\)/);assert.match(shader.fragmentShader,/#include <map_fragment>/);assert.equal(shader.uniforms.pixelTerrainSurface.value,5);let released=0;a.texture.addEventListener('dispose',()=>released++);a.dispose();a.dispose();assert.equal(released,0);b.dispose();assert.equal(released,1);map.dispose();
});

test('native Castle Fight/editor ground uses per-instance surface detail without recoloring tiles or texturing props',()=>{
 const palette=[{id:'grass',color:'#778855'},{id:'dirt-ashenvale',color:'#997744'},{id:'rock',color:'#777777'},{id:'water',color:'#5577aa'}],input={version:1,width:8,height:8,tileSize:1,palette,biomes:Array.from({length:64},(_,i)=>i%4),heights:Array(64).fill(0)},world=buildVoxelTerrain(input,{decorations:false}),tiles=world.children[0],kinds=tiles.geometry.attributes.pixelTerrainKind;
 try{assert.equal(world.children.length,1);assert.equal(tiles.count,64);assert.equal(tiles.receiveShadow,true);assert.ok(kinds.isInstancedBufferAttribute);assert.equal(kinds.count,64);assert.deepEqual([...kinds.array.slice(0,4)],[5,7,4,-1]);assert.equal(tiles.material.userData.pixelTerrain.perVertexSurface,true);for(let i=0;i<4;i++){const expected=new T.Color(palette[i].color).multiplyScalar(.97+(i*13%5)*.012),actual=new T.Color();tiles.getColorAt(i,actual);assert.ok(Math.abs(expected.r-actual.r)<.00001);assert.ok(Math.abs(expected.g-actual.g)<.00001);assert.ok(Math.abs(expected.b-actual.b)<.00001);}assert.equal(pixelTerrainForPalette('frost'),'ice');assert.equal(pixelTerrainSurfaceIndex(pixelTerrainForPalette('lava')),8);}
 finally{world.userData.dispose();world.userData.dispose();}
});

test('actual Castle W3E material IDs keep grass fields organic and reserve masonry for stone roads and courtyards',()=>{
 assert.deepEqual(CASTLE_TERRAIN_PALETTE.map(p=>pixelTerrainForPalette(p)),['earth','earth','grass','slate','grass','grass','earth','earth','stone']);const map=castleMap(),world=buildVoxelTerrain(map.terrain,{decorations:false}),kinds=world.children[0].geometry.attributes.pixelTerrainKind.array;
 try{for(let i=0;i<map.terrain.biomes.length;i++){const id=map.terrain.palette[map.terrain.biomes[i]].id;if(['agrs','agrd','avin'].includes(id))assert.equal(kinds[i],5,id);if(id==='vstp')assert.equal(kinds[i],0,id);}assert.ok([...kinds].filter(v=>v===5).length>1000);assert.equal(pixelTerrainForPalette({id:'unknown',color:'#7a9955'}),'grass');assert.equal(pixelTerrainForArena('forest'),'grass');}
 finally{world.userData.dispose();}
});

test('organic grass and fractured ice have no long masonry joints; stone retains laid paving',()=>{
 const atlas=pixelTerrainAtlas(),data=atlas.image.data;function longestRun(kind){let longest=0;const ox=kind*2%4*32,oy=Math.floor(kind*2/4)*32;for(let y=0;y<32;y++){let run=0,previous='';for(let x=0;x<32;x++){const at=((oy+y)*128+ox+x)*4,key=[...data.slice(at,at+3)].join(',');run=key===previous?run+1:1;previous=key;longest=Math.max(longest,run);}}return longest;}
 try{assert.ok(longestRun(0)>=7,'stone has horizontal mortar/stone edges');assert.ok(longestRun(5)<7,'grass has scattered tufts, no masonry rows');assert.ok(longestRun(2)<10,'ice has short irregular fracture branches');assert.ok(longestRun(7)<7,'earth is granular with winding ruts');}finally{atlas.dispose();}
});

test('real molten planes and lava terrain use the same pixel crust and emissive vein shader',()=>{
 const molten=createMoltenLavaMaterial(),terrain=createPixelTerrainMaterial({surface:'lava'}),shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};try{terrain.material.onBeforeCompile(shader);assert.equal(shader.uniforms.pixelTerrainSurface.value,8);assert.match(shader.fragmentShader,/totalEmissiveRadiance\+=pixelLavaColour/);assert.ok(shader.fragmentShader.includes(MOLTEN_LAVA_GLSL));assert.ok(molten.fragmentShader.includes(MOLTEN_LAVA_GLSL));assert.match(molten.fragmentShader,/crustPixel/);assert.match(molten.fragmentShader,/second-first/);assert.equal(molten.toneMapped,false);assert.equal(molten.transparent,false);}finally{molten.dispose();terrain.dispose();}
});
