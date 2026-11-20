import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createPhaseKillerWorld,PHASE_LIGHT_BUDGET,PHASE_NIGHT_LIGHTING} from '../src/phase-killer-world.js';
import {phaseHouseArt,phaseTreeArt} from '../src/phase-killer-scenery-art.js';
import {phaseKillerSpec} from '../src/phase-killer-art.js';
import {PHASE_TERRAIN_DATA as NATIVE_TERRAIN} from '../shared/phase-killer-terrain-data.js';
import {cameraBounds,cameraDestination} from '../src/camera-navigation.js';
import {PHASE_KILLER_MAP as MAP} from '../shared/phase-killer-catalog.js';
import {phaseKillerWorldObstacles,phaseKillerForestObstacles,phaseKillerPaths,phaseKillerTile,PHASE_WORLD_PROVENANCE,phaseKillerWorldPoint,phaseKillerNativePoint} from '../shared/phase-killer-world.js';
import {castlePassable,castleSegmentClear} from '../shared/castle-navigation.js';
test('empty online lobby builds a finite village instead of throwing in mergeGeometries and halting the game loop',()=>{
 const scene=new T.Scene();scene.background=new T.Color(0x112233);const initial=scene.background,world=createPhaseKillerWorld({scene});
 try{for(const [i,dimension]of ['normal','aether','omni','normal'].entries()){
  world.update({options:{mode:'phasekiller'},phaseKiller:{dimension,buildings:[],loot:[],corpses:[],fields:[]}},i+1);assert.equal(world.root.visible,true);
  for(const mesh of world.root.children.filter(o=>o.isInstancedMesh)){assert.ok(mesh.geometry);assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok(mesh.geometry.attributes.position.count>0);}
 }world.update({options:{mode:'tower'}},8);assert.equal(world.root.visible,false);assert.equal(scene.background,initial);}
 finally{world.dispose();}assert.equal(scene.children.length,0);
});
test('Phase camera bounds follow the current dimension and center on the controlled citizen',()=>{
 for(const dimension of ['normal','aether','omni']){const z=MAP[dimension].minZ+5,state={options:{mode:'phasekiller'},phaseKiller:{dimension},players:{p:1},units:[{id:1,x:12,z}]};assert.deepEqual(cameraBounds(state),MAP[dimension]);assert.deepEqual(cameraDestination(state,'p'),{x:12,z,distance:42});}
});

test('destructible Phase objects have finite voxel bodies and can be picked independently of loot',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene}),fields=['barricades','torchPlace','bonfirePlace','storageCube','dynamite','netTrap'].map((family,i)=>({id:80+i,family,x:i*3,z:0,hp:100,maxHp:150,w:1,d:1}));
 try{world.update({options:{mode:'phasekiller'},phaseKiller:{dimension:'normal',buildings:[],fields}},1);for(const f of fields)assert.deepEqual(world.pick(f),{pkField:f.id});for(const mesh of world.root.children.filter(o=>o.isInstancedMesh))assert.ok(mesh.count<=mesh.instanceMatrix.count);}
 finally{world.dispose();}
});

test('night lighting selects real nearby lanterns with a fixed shadow budget and ground pools without adding lights per post',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene}),state={options:{mode:'phasekiller'},players:{me:1},units:[{id:1,x:15.875,z:-7.75}],phaseKiller:{dimension:'normal',fields:[]}},focus=phaseKillerWorldPoint({x:36.75,z:-10.25});
 try{
  world.update(state,1,'me',focus);const lights=world.root.getObjectByName('phase-local-lights').children,pools=world.root.getObjectByName('phase-light-pools');
  assert.equal(lights.length,PHASE_LIGHT_BUDGET.pointLights);assert.equal(lights.filter(l=>l.castShadow).length,1);assert.ok(lights.every(l=>l.isPointLight&&l.shadow.mapSize.width===256));
  assert.ok(lights.some(l=>l.visible&&l.intensity>10&&Math.hypot(l.position.x-focus.x,l.position.z-focus.z)<1));assert.ok(pools.count>35&&pools.count<=PHASE_LIGHT_BUDGET.pools);assert.equal(pools.material.depthWrite,false);assert.ok(pools.material.vertexShader.includes('instanceMatrix*p'));
  const first=lights.filter(l=>l.visible).map(l=>l.userData.sourceId);world.update(state,2,'me',phaseKillerWorldPoint({x:60.25,z:-29.25}));assert.notDeepEqual(lights.filter(l=>l.visible).map(l=>l.userData.sourceId),first,'camera focus reallocates the same lights toward another street');
  state.phaseKiller.fields=Array.from({length:200},(_,id)=>({id,family:'torchPlace',x:15+id*.01,z:-7.5,hp:100,until:100}));world.update(state,3,'me',{x:15,z:-7.5});assert.equal(lights.length,4);assert.ok(pools.count<=128);assert.ok(lights.some(l=>l.userData.sourceId?.startsWith('field-')));
  state.phaseKiller.dimension='omni';state.phaseKiller.fields=[];world.update(state,4,'me',{x:20,z:120});assert.ok(lights.every(l=>!l.visible&&l.intensity===0),'the lantern-free realm does not retain lights from the village');
  assert.ok(PHASE_NIGHT_LIGHTING.hemisphereIntensity>=.8&&PHASE_NIGHT_LIGHTING.exposure>=1,'moon fill keeps unlit routes legible');
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});

test('old stone and timber houses and varied tree crowns retain their authoritative ground footprints',()=>{
 const c={wall:0xaaaaaa,roof:0x556677,wood:0x65513f,accent:0xe2b66d},houses=phaseKillerWorldObstacles().filter(b=>b.phaseProp==='house'),variants=new Set(),heights=new Set();
 for(const b of houses){const model=phaseHouseArt(b,c);variants.add(model.variant);heights.add(model.height);assert.ok(model.windows.length>=2);assert.ok(model.parts.length>20);
  for(const [x,y,z,w,h,d]of model.parts)if(y-h/2<.35){assert.ok(Math.abs(x-b.x)+w/2<=b.w/2+.2);assert.ok(Math.abs(z-b.z)+d/2<=b.d/2+.2,'door trim stays close to the existing facade');}
 }
 assert.ok(variants.size>=3&&heights.size>=3);
 const trees=phaseKillerForestObstacles('normal').filter(p=>p.phaseProp==='tree'),silhouettes=new Map();for(const p of trees){const model=phaseTreeArt(p,'normal',c);silhouettes.set(model.variant,model);for(const part of model.parts)assert.ok(part[1]-part[4]/2>1.2,'overhanging foliage and branches leave walking space above the solid trunk');}
 assert.equal(silhouettes.size,4);assert.ok(new Set([...silhouettes.values()].map(model=>model.height)).size>=3);
});

test('the enlarged Phase world scales coordinates and terrain spacing while native records and human geometry retain their units',()=>{
 assert.equal(MAP.worldScale,2);assert.equal(MAP.normal.maxX-MAP.normal.minX,212);assert.equal(MAP.normal.maxZ-MAP.normal.minZ,90);assert.equal(MAP.layerOffset,128);
 assert.equal(MAP.nativeReference.normal.maxX-MAP.nativeReference.normal.minX,106);assert.equal(MAP.nativeReference.layerOffset,64);
 assert.deepEqual(phaseKillerNativePoint(MAP.spawn),MAP.nativeReference.spawn);assert.deepEqual(phaseKillerWorldPoint(MAP.nativeReference.gateway),MAP.gateway);
 for(const dimension of ['normal','aether','omni']){
  const path=phaseKillerPaths(dimension)[0];assert.equal(path[0].x,-62);assert.equal(path[0].z,-56+['normal','aether','omni'].indexOf(dimension)*128);
 }
 const nativePoint={x:32,z:-15},worldPoint=phaseKillerWorldPoint(nativePoint),ix=Math.floor(nativePoint.x-NATIVE_TERRAIN.origin[0]),iz=Math.floor(NATIVE_TERRAIN.origin[1]-nativePoint.z);
 assert.equal(phaseKillerTile(worldPoint.x,worldPoint.z).texture,NATIVE_TERRAIN.textures[Number.parseInt(NATIVE_TERRAIN.tiles[iz*NATIVE_TERRAIN.width+ix],16)]);
 const c={wall:0xaaaaaa,roof:0x556677,wood:0x65513f,accent:0xe2b66d},citizen=phaseKillerSpec('townsperson'),width=Math.max(...citizen.parts.map(p=>p[0]+p[3]/2))-Math.min(...citizen.parts.map(p=>p[0]-p[3]/2));
 assert.equal(citizen.height,2.55);
 for(const b of phaseKillerWorldObstacles().filter(b=>b.phaseProp==='house')){
  if(!b.browserAdaptation){assert.equal(b.x,b.nativeX*2);assert.equal(b.z,b.nativeZ*2);}const model=phaseHouseArt(b,c);assert.ok(model.facadeWidth>=4*width);assert.ok(model.doorHeight>=citizen.height*1.4);assert.ok(model.height>=citizen.height*1.7);
  const foundation=model.parts[0];assert.ok(Math.abs(foundation[3]-b.w)<1e-8);assert.ok(Math.abs(foundation[5]-b.d)<1e-8,'visual foundation and collision footprint are equal after facade rotation');
 }
 assert.equal(NATIVE_TERRAIN.width,129);assert.equal(NATIVE_TERRAIN.height,193);assert.equal(PHASE_WORLD_PROVENANCE.worldScale,2);
});

test('local light resources are reused and shadow render targets and pool resources are released exactly once',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene}),state={options:{mode:'phasekiller'},phaseKiller:{dimension:'normal'},players:{p:1},units:[{id:1,x:32,z:-15}]};
 try{
  world.update(state,1,'p');const lights=[...world.root.getObjectByName('phase-local-lights').children],pools=world.root.getObjectByName('phase-light-pools');
  let releases=0;const target=new T.WebGLRenderTarget(16,16);target.addEventListener('dispose',()=>releases++);lights[0].shadow.map=target;pools.geometry.addEventListener('dispose',()=>releases++);pools.material.addEventListener('dispose',()=>releases++);
  for(let i=2;i<20;i++)world.update(state,i/3,'p',{x:32+i*.1,z:-15});assert.deepEqual(world.root.getObjectByName('phase-local-lights').children,lights);assert.equal(world.root.getObjectByName('phase-light-pools'),pools);
  world.update({options:{mode:'tower'}},7);assert.ok(lights.every(l=>!l.visible&&l.intensity===0));world.dispose();world.dispose();assert.equal(releases,3);assert.equal(scene.children.length,0);
 }finally{world.dispose();}
});

test('native forest colliders leave complete walking corridors, role spawn and dimensional gateways accessible',()=>{
 assert.equal(PHASE_WORLD_PROVENANCE.nativeDoodads,6555);
 assert.equal(PHASE_WORLD_PROVENANCE.hashes['war3map.w3e'],'4bb8889159c6801ac9ceab16806a08e8add086aa6d1ecb86b84ebbb5320297bd');
 const buildings=phaseKillerWorldObstacles();assert.ok(buildings.some(b=>b.rawId==='VSvb'&&b.nativeX===32&&b.nativeZ===-15&&b.x===64&&b.z===-30));
 for(const [i,dimension]of ['normal','aether','omni'].entries()){
  const forest=phaseKillerForestObstacles(dimension),context={map:MAP[dimension],buildings:buildings.filter(b=>b.dimension===dimension),obstacles:forest};
  assert.ok(forest.length>900&&forest.length<2000);assert.equal(forest,phaseKillerForestObstacles(dimension));
  assert.ok(castlePassable(context,{x:MAP.spawn.x,z:MAP.spawn.z+i*MAP.layerOffset},.3));
  assert.ok(castlePassable(context,{x:MAP.gateway.x,z:MAP.gateway.z-MAP.layerOffset+i*MAP.layerOffset},.3));
  for(const path of phaseKillerPaths(dimension))for(let j=1;j<path.length;j++)assert.ok(castleSegmentClear(context,path[j-1],path[j],.3),dimension+' arterial route must remain open');
  for(const obstacle of [forest[0],forest[Math.floor(forest.length/2)],forest.at(-1)])assert.equal(castlePassable(context,obstacle,.3),false,'a visible solid trunk/rock must block movement');
 }
 const textures=new Set();for(let x=MAP.normal.minX+5;x<MAP.normal.maxX-5;x+=10)for(let z=MAP.normal.minZ+5;z<MAP.normal.maxZ-5;z+=10)textures.add(phaseKillerTile(x,z).texture);assert.ok(textures.size>=5,'terrain follows painted native zones rather than a uniform checkerboard');
});

test('forest meshes match collision footprints and realm switching keeps draw calls and geometry bounded',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene});
 try{for(const [i,dimension]of ['normal','aether','omni','normal','omni'].entries()){
  world.update({options:{mode:'phasekiller'},phaseKiller:{dimension,buildings:[]},players:{me:1},units:[{id:1,x:MAP.spawn.x,z:MAP.spawn.z+['normal','aether','omni'].indexOf(dimension)*MAP.layerOffset}]},i+1,'me');
  assert.ok(world.root.children.length<=19,'town, forest and three campfires use bounded root batches');
  const trunks=world.root.getObjectByName('phase-trunks'),trees=phaseKillerForestObstacles(dimension).filter(o=>o.phaseProp==='tree');assert.equal(trunks.count,trees.length);
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
  for(const index of [0,Math.floor(trees.length/2),trees.length-1]){trunks.getMatrixAt(index,matrix);matrix.decompose(position,rotation,scale);assert.ok(Math.abs(position.x-trees[index].x)<.0001);assert.ok(Math.abs(position.z-trees[index].z)<.0001);assert.ok(Math.abs(scale.x-trees[index].w)<.0001);assert.ok(Math.abs(scale.z-trees[index].d)<.0001);}
  const material=world.root.getObjectByName('phase-trees').material,shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.phaseCanopy.value,1);assert.ok(shader.fragmentShader.includes('canopyDistance'));assert.ok(shader.vertexShader.includes('instanceMatrix*phaseWorld'));assert.ok(!shader.fragmentShader.includes('#include <opaque_fragment>\n#include <opaque_fragment>'));
  assert.ok(shader.uniforms.phaseObserver.value.x<1e4,'controlled player anchors the canopy visibility shader');
 }}finally{world.dispose();}assert.equal(scene.children.length,0);
});
