import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createLegacyWorld} from '../src/legacy-world.js';
import {TREE_TAG_BUILDINGS} from '../shared/tree-tag-catalog.js';

function treeState(){return{time:1,options:{mode:'treetag'},treeTag:{map:{width:94,depth:94,minX:-47,maxX:47,minZ:-47,maxZ:47,prison:{x:0,z:0,radius:2}},trees:[{id:1,x:-4,z:2,scale:1,alive:true},{id:2,x:7,z:4,kind:'pine',alive:true},{id:3,x:3,z:3,alive:false}],buildings:[{id:10,key:'eC09',x:0,z:8,w:2,d:2,alive:true,workProgress:.25}]}};}
const checkMatrices=mesh=>{const matrix=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));}};

test('Tree Tag forest uses two instanced tree batches, cached floor and matching footprint picking',()=>{
 const scene=new T.Scene(),view=createLegacyWorld({scene}),s=treeState();view.update(s,1);
 const forest=view.root.getObjectByName('tree-tag-forest');assert.equal(forest.children.length,2);assert.ok(forest.children.every(m=>m.isInstancedMesh));
 const trunks=view.root.getObjectByName('tree-tag-trunks'),leaves=view.root.getObjectByName('tree-tag-canopies'),floor=view.root.getObjectByName('tree-tag-ground');assert.equal(trunks.count,6);assert.equal(leaves.count,7);assert.ok(floor.count>2000);
 for(const mesh of [trunks,leaves,floor])checkMatrices(mesh);
 assert.deepEqual(view.pick({x:.99,z:8}),{legacyBuilding:10});assert.equal(view.pick({x:1.01,z:8}),null);assert.equal(view.pick({x:NaN,z:8}),null);
 const structure=view.root.getObjectByName('tree-tag-building-10');assert.ok(structure.children[0].scale.y<1);assert.equal(structure.children[1].visible,true);s.treeTag.buildings[0].workProgress=1;view.update(s,1.2);assert.equal(structure.children[0].scale.y,1);assert.equal(structure.children[1].visible,false);assert.equal(view.root.getObjectByName('tree-tag-ground'),floor);
 s.treeTag.trees[0].alive=false;view.update(s,2);assert.equal(trunks.count,3);s.treeTag.buildings[0].alive=false;view.update(s,3);assert.equal(view.pick({x:0,z:8}),null);
 view.dispose();view.dispose();assert.equal(scene.children.length,0);
});

test('all nineteen Tree Tag buildings receive different finite original voxel models',()=>{
 const scene=new T.Scene(),view=createLegacyWorld({scene}),s=treeState(),signatures=new Set();s.treeTag.buildings=Object.values(TREE_TAG_BUILDINGS).map((b,i)=>({id:i,key:b.key,x:i*3,z:8,w:b.w,d:b.d,alive:true,workProgress:1}));view.update(s,1);
 for(const b of s.treeTag.buildings){const mesh=view.root.getObjectByName('tree-tag-building-'+b.id).children[0],p=mesh.geometry.attributes.position.array,c=mesh.geometry.attributes.color.array;assert.ok([...p,...c].every(Number.isFinite));const signature=JSON.stringify([...p]);assert.equal(signatures.has(signature),false,b.key+' duplicated');signatures.add(signature);assert.ok(p.length<10000);}
 assert.equal(signatures.size,19);view.dispose();
});

test('Warlock has procedural cracked lava, radius-driven stone arena, physical pillars and distinct voxel missile families',()=>{
 const scene=new T.Scene(),view=createLegacyWorld({scene}),s={time:1,options:{mode:'warlock'},warlock:{arenaRadius:22,pillars:[{id:4,x:3,z:2,radius:.8,alive:true}],fields:[{id:1,key:'S018',family:'gravity',x:1,z:2,radius:3,until:5},{id:2,family:'burn',x:2,z:3,radius:2,until:5}],projectiles:[{id:3,key:'S000',family:'fireball',x:0,z:0,dx:1,dz:0,radius:.4},{id:4,key:'S004',family:'boomerang',x:1,z:0,dx:1,dz:0,radius:.5}]}};
 view.update(s,1);const lava=view.root.getObjectByName('warlock-lava'),floor=view.root.getObjectByName('warlock-arena-stone'),boundary=view.root.getObjectByName('warlock-arena-boundary'),shots=view.root.getObjectByName('warlock-missiles-fireball'),boomer=view.root.getObjectByName('warlock-missiles-boomerang');
 assert.ok(lava.material.isShaderMaterial);assert.match(lava.material.fragmentShader,/second-first/);assert.equal(lava.material.uniforms.uTime.value,1);assert.equal(boundary.scale.x,22);assert.ok(floor.count>700);assert.equal(shots.count,1);assert.equal(boomer.count,1);assert.notEqual(shots.geometry,boomer.geometry);assert.equal(view.root.getObjectByName('warlock-pillars').count,5);assert.equal(view.root.getObjectByName('warlock-field-rings').count,2);
 const count=floor.count;s.warlock.arenaRadius=15;s.warlock.projectiles=[];view.update(s,6);assert.ok(floor.count<count);assert.equal(boundary.scale.x,15);assert.equal(shots.count,0);assert.equal(view.root.getObjectByName('warlock-field-rings').count,0);assert.equal(view.pick({x:0,z:0}),null);
 const materials=new Set(),geometries=new Set();view.root.traverse(o=>{if(o.isMesh){materials.add(o.material);geometries.add(o.geometry);}});let disposed=0;for(const m of materials)m.addEventListener('dispose',()=>disposed++);view.dispose();assert.ok(disposed>=7);assert.equal(scene.children.length,0);
});


test('preparation renders both legacy worlds before their live simulation exists and restores borrowed scene environment',()=>{
 const scene=new T.Scene(),original=new T.Color(0xaac2b0);scene.background=original;scene.fog=new T.Fog(0xaac2b0,160,270);const view=createLegacyWorld({scene});
 view.update({options:{mode:'treetag'},treeTag:null,time:0},0);assert.equal(view.root.visible,true);assert.equal(view.root.getObjectByName('tree-tag-world').visible,true);assert.ok(view.root.getObjectByName('tree-tag-trunks').count>1000);assert.notEqual(scene.background,original);
 view.update({options:{mode:'warlock'},warlock:null,time:0},0);assert.equal(view.root.getObjectByName('warlock-world').visible,true);assert.ok(view.root.getObjectByName('warlock-arena-stone').count>700);assert.equal(scene.background.getHex(),0x2d1d1b);
 view.update({options:{mode:'campaign'},time:1},1);assert.equal(view.root.visible,false);assert.equal(scene.background,original);assert.equal(scene.fog.color.getHex(),0xaac2b0);view.dispose();
});


test('Tree Tag construction ghost uses authoritative placement checks and ash markers follow captured players',()=>{
 const scene=new T.Scene(),view=createLegacyWorld({scene}),s=treeState();s.phase='wave';s.units=[{id:7,owner:'p',treeTagCharacter:'ent',treeTagRole:'ent',alive:true,gold:10000,lumber:10000,x:0,z:0},{id:8,owner:'q',treeTagCharacter:'ent',treeTagCaptured:true,alive:true,x:.6,z:.6}];for(const tree of s.treeTag.trees){tree.w=.75;tree.d=.75;}
 view.setBuild('eC23','p');view.setCursor({x:20,z:20});view.update(s,1);const ghost=view.root.getObjectByName('tree-tag-build-ghost');assert.equal(ghost.visible,true);assert.equal(ghost.userData.allowed,true);assert.equal(ghost.scale.x,1.5);assert.equal(view.root.getObjectByName('tree-tag-captured-ashes').count,3);
 view.setCursor({x:-4,z:2});view.update(s,1.1);assert.equal(ghost.userData.allowed,false);assert.match(ghost.userData.reason,/ocupado/);view.setBuild(null);assert.equal(ghost.visible,false);s.units[1].treeTagCaptured=false;view.update(s,1.2);assert.equal(view.root.getObjectByName('tree-tag-captured-ashes').count,0);view.dispose();
});
