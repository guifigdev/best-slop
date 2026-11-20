import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createKodoWorld,kodoCliffSpec,kodoBuildingSpec} from '../src/kodo-world.js';
import {KODO_TAG_MAP as MAP,KODO_TAG_MINES as MINES,KODO_TAG_FOREST as FOREST,KODO_TAG_BUILDINGS as B} from '../shared/kodo-tag-catalog.js';

test('stone cliff meshes retain authoritative footprints, grey rock faces and grassy caps',()=>{
 for(const obstacle of MAP.obstacles){const parts=kodoCliffSpec(obstacle);assert.ok(parts.length>=7);assert.equal(parts[0][3],obstacle.w);assert.equal(parts[0][5],obstacle.d);assert.notEqual(parts[0][6],parts[2][6]);for(const [x,y,z,w,h,d]of parts){assert.ok([x,y,z,w,h,d].every(Number.isFinite));assert.ok(w>0&&h>0&&d>0);assert.ok(x-w/2>=obstacle.x-obstacle.w/2-1e-8&&x+w/2<=obstacle.x+obstacle.w/2+1e-8);assert.ok(z-d/2>=obstacle.z-obstacle.d/2-1e-8&&z+d/2<=obstacle.z+obstacle.d/2+1e-8);}}
});

test('building foundations and connecting wall beams match placement dimensions without scaling their models',()=>{
 for(const [key,d]of Object.entries(B)){const parts=kodoBuildingSpec(key),foundation=parts[0];assert.equal(foundation[3],d.w);assert.equal(foundation[5],d.d);if(['hC07','hC09'].includes(key))assert.ok(parts.slice(1).some(p=>p[3]===d.w),'wall crossbeams reach the neighboring footprint');}
});

test('large map ground, cliffs, collectible forest and mines use bounded reusable instance batches',()=>{
 const scene=new T.Scene(),world=createKodoWorld({scene}),snapshot={options:{mode:'kodotag'},units:[],kodoTag:{map:MAP,obstacles:MAP.obstacles,mines:MINES,trees:FOREST,buildings:[]}};
 try{world.update(snapshot);assert.equal(world.root.visible,true);for(const mesh of world.root.children.filter(o=>o.isInstancedMesh)){assert.ok(mesh.count<=mesh.instanceMatrix.count);for(let i=0;i<Math.min(4,mesh.count);i++){const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));}}
  const ground=world.root.children.find(o=>o.name==='kodo-ground'),cliffs=world.root.children.find(o=>o.name==='kodo-native-cliffs'),trees=world.root.children.find(o=>o.name==='kodo-resource-forest');assert.ok(ground.count>9000);assert.equal(cliffs.count,MAP.obstacles.flatMap(kodoCliffSpec).length);assert.equal(trees.count,FOREST.length*3);const batches=world.root.children.length;world.update(snapshot);assert.equal(world.root.children.length,batches);assert.equal(world.root.children.find(o=>o.name==='kodo-native-cliffs'),cliffs);
  snapshot.kodoTag={...snapshot.kodoTag,trees:FOREST.slice(1),mines:MINES.slice(1)};world.update(snapshot);assert.equal(trees.count,(FOREST.length-1)*3);assert.deepEqual(world.pick(MINES[1]),{kodoMine:MINES[1].id});assert.deepEqual(world.pick(FOREST[1]),{kodoTree:FOREST[1].id});world.update({options:{mode:'campaign'}});assert.equal(world.root.visible,false);
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});

test('Big Wall, barracks and towers have tall architecture and human-sized doors while footprints remain unchanged',()=>{
 for(const key of ['hC08','hC11','oC16','oC20','oC21']){const parts=kodoBuildingSpec(key),height=Math.max(...parts.map(p=>p[1]+p[4]/2));assert.ok(height>=3.5&&height<=5,key+' architecture stands above the Runner');assert.equal(parts[0][3],B[key].w);assert.equal(parts[0][5],B[key].d);if(['hC08','hC11'].includes(key))assert.ok(parts.some(p=>p[3]===.85&&p[4]===2),'door opening fits a character');}
});
