import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createPhaseKillerWorld} from '../src/phase-killer-world.js';
import {cameraBounds,cameraDestination} from '../src/camera-navigation.js';
import {PHASE_KILLER_MAP as MAP} from '../shared/phase-killer-catalog.js';
import {phaseKillerWorldObstacles,phaseKillerForestObstacles,phaseKillerPaths,phaseKillerTile,PHASE_WORLD_PROVENANCE} from '../shared/phase-killer-world.js';
import {castlePassable,castleSegmentClear} from '../shared/castle-navigation.js';
test('empty online lobby builds a finite village instead of throwing in mergeGeometries and halting the game loop',()=>{
 const scene=new T.Scene();scene.background=new T.Color(0x112233);const initial=scene.background,world=createPhaseKillerWorld({scene});
 try{for(const [i,dimension]of ['normal','aether','omni','normal'].entries()){
  world.update({options:{mode:'phasekiller'},phaseKiller:{dimension,buildings:[],loot:[],corpses:[],fields:[]}},i+1);assert.equal(world.root.visible,true);
  for(const mesh of world.root.children){assert.ok(mesh.geometry);assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok(mesh.geometry.attributes.position.count>0);}
 }world.update({options:{mode:'tower'}},8);assert.equal(world.root.visible,false);assert.equal(scene.background,initial);}
 finally{world.dispose();}assert.equal(scene.children.length,0);
});
test('Phase camera bounds follow the current dimension and center on the controlled citizen',()=>{
 for(const dimension of ['normal','aether','omni']){const z=MAP[dimension].minZ+5,state={options:{mode:'phasekiller'},phaseKiller:{dimension},players:{p:1},units:[{id:1,x:12,z}]};assert.deepEqual(cameraBounds(state),MAP[dimension]);assert.deepEqual(cameraDestination(state,'p'),{x:12,z,distance:47});}
});

test('destructible Phase objects have finite voxel bodies and can be picked independently of loot',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene}),fields=['barricades','torchPlace','bonfirePlace','storageCube','dynamite','netTrap'].map((family,i)=>({id:80+i,family,x:i*3,z:0,hp:100,maxHp:150,w:1,d:1}));
 try{world.update({options:{mode:'phasekiller'},phaseKiller:{dimension:'normal',buildings:[],fields}},1);for(const f of fields)assert.deepEqual(world.pick(f),{pkField:f.id});for(const mesh of world.root.children)assert.ok(mesh.count<=mesh.instanceMatrix.count);}
 finally{world.dispose();}
});

test('native forest colliders leave complete walking corridors, role spawn and dimensional gateways accessible',()=>{
 assert.equal(PHASE_WORLD_PROVENANCE.nativeDoodads,6555);
 assert.equal(PHASE_WORLD_PROVENANCE.hashes['war3map.w3e'],'4bb8889159c6801ac9ceab16806a08e8add086aa6d1ecb86b84ebbb5320297bd');
 const buildings=phaseKillerWorldObstacles();assert.ok(buildings.some(b=>b.rawId==='VSvb'&&b.x===32&&b.z===-15));
 for(const [i,dimension]of ['normal','aether','omni'].entries()){
  const forest=phaseKillerForestObstacles(dimension),context={map:MAP[dimension],buildings:buildings.filter(b=>b.dimension===dimension),obstacles:forest};
  assert.ok(forest.length>900&&forest.length<2000);assert.equal(forest,phaseKillerForestObstacles(dimension));
  assert.ok(castlePassable(context,{x:MAP.spawn.x,z:MAP.spawn.z+i*64},.3));
  assert.ok(castlePassable(context,{x:33,z:-33+i*64},.3));
  for(const path of phaseKillerPaths(dimension))for(let j=1;j<path.length;j++)assert.ok(castleSegmentClear(context,path[j-1],path[j],.3),dimension+' arterial route must remain open');
  for(const obstacle of [forest[0],forest[Math.floor(forest.length/2)],forest.at(-1)])assert.equal(castlePassable(context,obstacle,.3),false,'a visible solid trunk/rock must block movement');
 }
 const textures=new Set();for(let x=-30;x<65;x+=5)for(let z=-35;z<5;z+=5)textures.add(phaseKillerTile(x,z).texture);assert.ok(textures.size>=5,'terrain follows painted native zones rather than a uniform checkerboard');
});

test('forest meshes match collision footprints and realm switching keeps draw calls and geometry bounded',()=>{
 const scene=new T.Scene(),world=createPhaseKillerWorld({scene});
 try{for(const [i,dimension]of ['normal','aether','omni','normal','omni'].entries()){
  world.update({options:{mode:'phasekiller'},phaseKiller:{dimension,buildings:[]},players:{me:1},units:[{id:1,x:15.875,z:-7.75+i%3*64}]},i+1,'me');
  assert.ok(world.root.children.length<=16,'thousands of props share bounded instance batches');
  const trunks=world.root.getObjectByName('phase-trunks'),trees=phaseKillerForestObstacles(dimension).filter(o=>o.phaseProp==='tree');assert.equal(trunks.count,trees.length);
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
  for(const index of [0,Math.floor(trees.length/2),trees.length-1]){trunks.getMatrixAt(index,matrix);matrix.decompose(position,rotation,scale);assert.ok(Math.abs(position.x-trees[index].x)<.0001);assert.ok(Math.abs(position.z-trees[index].z)<.0001);assert.ok(Math.abs(scale.x-trees[index].w)<.0001);assert.ok(Math.abs(scale.z-trees[index].d)<.0001);}
  const material=world.root.getObjectByName('phase-trees').material,shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.phaseCanopy.value,1);assert.ok(shader.fragmentShader.includes('canopyDistance'));assert.ok(shader.vertexShader.includes('instanceMatrix*phaseWorld'));assert.ok(!shader.fragmentShader.includes('#include <opaque_fragment>\n#include <opaque_fragment>'));
  assert.ok(shader.uniforms.phaseObserver.value.x<1e4,'controlled player anchors the canopy visibility shader');
 }}finally{world.dispose();}assert.equal(scene.children.length,0);
});
