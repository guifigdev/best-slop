import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createBonkVisibility} from '../src/bonk-visibility.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {generateBonkLevel,bonkBlocked,bonkHeightAt} from '../shared/bonk-level.js';
import {BONK_STAGES} from '../shared/bonk-catalog.js';

const cameraAt=(x=0,z=20,lookX=0,lookZ=0)=>{const c=new T.PerspectiveCamera(65,16/9,.1,270);c.position.set(x,12,z);c.lookAt(lookX,2,lookZ);c.updateMatrixWorld();return c;};
const snapshot=map=>({options:{mode:'bonk'},units:[{bonkHero:true,alive:true,x:0,z:23}],bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:map.landmarks}});

test('instance compaction rejects behind-camera geometry and restores cached transforms on a full camera turn',()=>{
 const v=createBonkVisibility({margin:0}),geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(geometry,material,3),m=new T.Matrix4(),c=new T.Color();
 for(const [i,z]of [-10,20,100].entries()){m.makeTranslation(0,2,z);mesh.setMatrixAt(i,m);mesh.setColorAt(i,c.setHex([0xff0000,0x00ff00,0x0000ff][i]));}mesh.count=3;v.capture(mesh,3);
 const camera=cameraAt(0,0,0,-10);v.update(camera);assert.equal(mesh.count,1);mesh.getMatrixAt(0,m);assert.equal(m.elements[14],-10);mesh.getColorAt(0,c);assert.equal(c.getHex(),0xff0000);
 camera.lookAt(0,2,100);camera.updateMatrixWorld();v.update(camera);assert.equal(mesh.count,2);const zs=[];for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);zs.push(m.elements[14]);}assert.deepEqual(zs,[20,100]);assert.equal(v.stats().sourceInstances,3);assert.equal(v.stats().visibleInstances,2);
 camera.lookAt(0,2,-10);camera.updateMatrixWorld();v.update(camera);mesh.getMatrixAt(0,m);assert.equal(mesh.count,1);assert.equal(m.elements[14],-10,'compaction never overwrites the source transforms');
 v.reset();mesh.dispose();geometry.dispose();material.dispose();
});

test('a partly visible large object stays rendered even when its center is beyond a side plane',()=>{
 const v=createBonkVisibility({margin:0}),geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(geometry,material,1),m=new T.Matrix4().compose(new T.Vector3(14,2,-15),new T.Quaternion(),new T.Vector3(15,4,4));mesh.setMatrixAt(0,m);mesh.count=1;v.capture(mesh,1);const c=new T.PerspectiveCamera(50,1,.1,100);c.position.set(0,2,0);c.lookAt(0,2,-20);c.updateMatrixWorld();v.update(c);assert.equal(mesh.count,1);v.reset();mesh.dispose();geometry.dispose();material.dispose();
});

test('a previously empty loot batch gains and preserves colors after camera compaction',()=>{
 const v=createBonkVisibility(),geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(geometry,material,2),m=new T.Matrix4(),color=new T.Color();mesh.count=0;v.capture(mesh,0);for(const [i,z]of [30,-10].entries()){mesh.setMatrixAt(i,m.makeTranslation(0,2,z));mesh.setColorAt(i,color.setHex(i?0xffcc55:0x55ffcc));}mesh.count=2;v.capture(mesh,2);const c=cameraAt(0,0,0,-20);v.update(c);assert.equal(mesh.count,1);mesh.getColorAt(0,color);assert.equal(color.getHex(),0xffcc55);v.reset();mesh.dispose();geometry.dispose();material.dispose();
});

test('native terrain continues beyond every physical boundary while actual collision bounds remain closed',()=>{
 for(const key of Object.keys(BONK_STAGES)){
  const map=generateBonkLevel(41,key),scene=new T.Scene(),world=createBonkWorld({scene});try{world.update(snapshot(map),1);const floor=world.root.getObjectByName('bonk-organic-ground'),p=floor.geometry.attributes.position;floor.geometry.computeBoundingBox();assert.ok(floor.geometry.boundingBox.min.x< -500&&floor.geometry.boundingBox.max.x>500);assert.ok(floor.geometry.boundingBox.min.z< -500&&floor.geometry.boundingBox.max.z>500);for(let i=0;i<p.count;i+=173)assert.ok(Math.abs(p.getY(i)-bonkHeightAt(map,p.getX(i),p.getZ(i)))<1e-4);assert.equal(bonkBlocked(map,{x:116,z:0}),true);assert.equal(bonkBlocked(map,{x:0,z:-116}),true);assert.ok(world.stats().visualHalfExtent>world.stats().physicalHalfExtent*4);
   for(const [x,z]of [[110,0],[-110,0],[0,110],[0,-110]]){const c=cameraAt(x,z,x*2,z*2);world.cull(c);assert.ok(floor.geometry.drawRange.count>0,'there is still actual terrain beyond the edge');assert.ok(world.stats().visibleInstances<world.stats().sourceInstances*.5);assert.ok(world.stats().visibleTriangles<world.stats().sourceTriangles*.5);}
  }finally{world.dispose();}assert.equal(scene.children.length,0);
 }
});

test('world source geometry survives camera turns, active loot updates, gate opening and region replacement',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene}),map=generateBonkLevel(51,'grove'),state=snapshot(map),camera=cameraAt();state.bonk.exitGate={x:0,z:-101,width:14,open:false,nextScene:'payon'};state.bonk.pickups=[{id:1,type:'gold',value:2,x:0,z:0},{id:2,type:'xp',value:3,x:0,z:100}];
 try{world.update(state,1);const source=world.root.getObjectByName('bonk-landscape').count,closed=world.root.getObjectByName('bonk-interactables').count;world.cull(camera);const visible=world.stats().visibleInstances;assert.ok(visible>0);assert.ok(world.stats().visibleInstances<world.stats().sourceInstances*.5);for(let i=0;i<12;i++){camera.position.set(Math.sin(i*.52)*22,12,Math.cos(i*.52)*22);camera.lookAt(0,2,0);camera.updateMatrixWorld();world.update(state,1+i*.1);world.cull(camera);assert.equal(world.root.getObjectByName('bonk-landscape').userData.visibilitySourceCount,source);for(const mesh of world.root.children.filter(c=>c.isInstancedMesh))assert.ok(mesh.count<=mesh.instanceMatrix.count);}
  state.bonk.exitGate.open=true;world.update(state,3);assert.ok(world.root.getObjectByName('bonk-interactables').count<closed,'opened passage removes the gate bars');world.cull(camera);assert.ok(world.stats().visibleInstances>0);
  const next=generateBonkLevel(66,'glacier');world.update(snapshot(next),4);world.cull(camera);assert.equal(world.stats().terrainMeshes,1,'replaced terrain does not leak into the visibility registry');assert.ok(world.root.children.length<=18);
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});
