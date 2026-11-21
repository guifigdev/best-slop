import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roWorldRegion,roWorldGates} from '../shared/ro-world-route.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {bonkWorldGates,bonkGateFrame,bonkGateParts,bonkGatePreview} from '../src/bonk-gates.js';
import {createBonkWorld,bonkPaletteForMap} from '../src/bonk-world.js';

test('cardinal gates rotate their threshold, pillars and corridor walls around their own outward axis',()=>{
 for(const direction of [{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}]){const gate={id:'test',x:direction.x*101,z:direction.z*101,direction,width:18,open:false},frame=bonkGateFrame(gate),p={stone:0xaaaaaa,dark:0x555555},closed=bonkGateParts(gate,p),open=bonkGateParts({...gate,open:true},p);assert.ok(closed.length>open.length);assert.ok(closed.length<180);const sill=closed.find(part=>part[4]===.08&&part[3]===18);assert.ok(sill);const m=new T.Matrix4().makeRotationY(sill[7]),side=new T.Vector3(1,0,0).transformDirection(m);assert.ok(Math.abs(side.dot(new T.Vector3(frame.forward.x,0,frame.forward.z)))<1e-8);for(const part of closed){assert.ok(part.slice(0,8).every(Number.isFinite));const delta={x:part[0]-gate.x,z:part[2]-gate.z},along=delta.x*direction.x+delta.z*direction.z;assert.ok(along>=-6&&along<=12);}}
});

test('the volcano hub previews green east, desert west and highlands north, without painting every exit north',()=>{
 const region=roWorldRegion('thor-volcano'),gates=roWorldGates(region,[],[]),normalized=bonkWorldGates({bonk:{exitGates:gates}},{route:region}),cases=[[180,0,'glast-heim'],[-180,0,'morroc'],[0,-180,'juno']];assert.equal(gates.length,3);
 for(const [x,z,key]of cases){const preview=bonkGatePreview(normalized,x,z);assert.equal(preview[0].gate.nextKey,key);assert.ok(preview[0].weight>.8);}
 assert.equal(bonkGatePreview(normalized,0,180).length,0,'an unconnected south edge keeps its own volcanic biome');assert.equal(bonkGatePreview(normalized,0,0).length,0,'the central arena retains its biome');
});

test('all graph gates render, opening one updates only its barrier and camera culling remains bounded',()=>{
 const region=roWorldRegion('thor-volcano'),map=generateBonkLevel(73,region.scene,region.habitat,region);map.paths=region.spokes;const state={options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[],exitGates:roWorldGates(region,[],[])}};const scene=new T.Scene(),world=createBonkWorld({scene});
 try{world.update(state,1);const floor=world.root.getObjectByName('bonk-organic-ground'),closed=world.stats().gates;assert.equal(closed.length,3);assert.deepEqual(new Set(closed.map(g=>g.nextKey)),new Set(region.neighborKeys));assert.ok(closed.every(g=>!g.open));const count=world.root.getObjectByName('bonk-interactables').count;
  state.bonk.exitGates=state.bonk.exitGates.map((g,i)=>i===0?{...g,open:true}:g);world.update(state,2);assert.equal(world.root.getObjectByName('bonk-organic-ground'),floor,'barrier state never rebuilds the surrounding map');assert.equal(world.root.getObjectByName('bonk-interactables').count,count-7);assert.equal(world.stats().gates.filter(g=>g.open).length,1);
  const camera=new T.PerspectiveCamera(65,16/9,.1,270);for(const gate of state.bonk.exitGates){camera.position.set(gate.x*.88,15,gate.z*.88);camera.lookAt(gate.x*2,8,gate.z*2);camera.updateMatrixWorld();world.cull(camera);assert.ok(world.stats().visibleTriangles>0);assert.ok(world.stats().visibleInstances<world.stats().sourceInstances);for(const mesh of world.root.children.filter(c=>c.isInstancedMesh))assert.ok(mesh.count<=mesh.instanceMatrix.count);}
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});

test('graph destination metadata changes invalidate terrain while v1 single-gate saves still render',()=>{
 const region=roWorldRegion('prontera'),map=generateBonkLevel(74,region.scene,region.habitat,region),state={options:{mode:'bonk'},bonk:{map,objects:[],pickups:[],projectiles:[],objectives:[],exitGates:roWorldGates(region,[],[])}};const world=createBonkWorld({scene:new T.Scene()});
 try{world.update(state,1);const before=world.root.getObjectByName('bonk-organic-ground');state.bonk.exitGates=state.bonk.exitGates.map(g=>({...g,nextScene:'glacier',nextRoute:{key:'ice',style:'glacial'}}));world.update(state,2);assert.notEqual(world.root.getObjectByName('bonk-organic-ground'),before);delete state.bonk.exitGates;map.route={...region,gates:undefined};state.bonk.exitGate={id:'legacy',x:0,z:-101,width:18,open:true,nextScene:'payon'};world.update(state,3);assert.equal(world.stats().gates.length,1);assert.equal(world.stats().gates[0].id,'legacy');assert.equal(world.stats().gates[0].open,true);assert.ok(bonkPaletteForMap(map));}finally{world.dispose();}
});

test('fireballs reuse the volumetric flame palette at eight frames per second inside the existing four-instance shot budget',()=>{
 const map=generateBonkLevel(75,'forge'),state={options:{mode:'bonk'},bonk:{map,objects:[],pickups:[],objectives:[],projectiles:[{id:7,x:0,z:0,dx:1,dz:0,element:'fire'}]}},world=createBonkWorld({scene:new T.Scene()}),m=new T.Matrix4(),c=new T.Color();
 try{world.update(state,1.01);const mesh=world.root.getObjectByName('bonk-shots'),first=[];assert.equal(mesh.count,4);for(let i=0;i<4;i++){mesh.getMatrixAt(i,m);first.push(m.toArray());mesh.getColorAt(i,c);assert.ok([0xffec9d,0xffb346,0xd86c2e].includes(c.getHex()));}world.update(state,1.07);for(let i=0;i<4;i++){mesh.getMatrixAt(i,m);assert.deepEqual(m.toArray(),first[i]);}world.update(state,1.15);mesh.getMatrixAt(1,m);assert.notDeepEqual(m.toArray(),first[1]);assert.equal(mesh.count,4);}finally{world.dispose();}
});
