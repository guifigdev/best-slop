import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createPhaseKillerWorld} from '../src/phase-killer-world.js';
import {cameraBounds,cameraDestination} from '../src/camera-navigation.js';
import {PHASE_KILLER_MAP as MAP} from '../shared/phase-killer-catalog.js';
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
