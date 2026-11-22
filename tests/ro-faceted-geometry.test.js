import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roFacetedBoxGeometry,roFacetedTerrainGeometry,roChamferAmount,createRoFacetedGeometryCache,createRoGeometryPresentation} from '../src/ro-faceted-geometry.js';
import {voxelShellGeometry} from '../src/voxel-shell.js';

function flatAndFinite(g){const p=g.attributes.position,n=g.attributes.normal;assert.equal(p.count,n.count);for(const a of Object.values(g.attributes))assert.ok([...a.array].every(Number.isFinite));for(let i=0;i<n.count;i+=3){const first=new T.Vector3().fromBufferAttribute(n,i);assert.ok(Math.abs(first.length()-1)<1e-5);for(let j=1;j<3;j++)assert.ok(first.distanceTo(new T.Vector3().fromBufferAttribute(n,i+j))<1e-6);const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),actual=new T.Vector3().crossVectors(b.sub(a),c.sub(a)).normalize();assert.ok(actual.dot(first)>.99999);}}

test('faceted boxes use real planar chamfers, keep their authored bounds and have no degenerate faces',()=>{
 for(const amount of [0,.05,.5,1]){const g=roFacetedBoxGeometry(2,3,4,amount);flatAndFinite(g);assert.deepEqual(g.boundingBox.min.toArray(),[-1,-1.5,-2]);assert.deepEqual(g.boundingBox.max.toArray(),[1,1.5,2]);assert.equal(g.attributes.position.count/3,amount?44:12);if(amount)assert.ok([...g.attributes.normal.array].some(n=>Math.abs(n)>.1&&Math.abs(n)<.9));g.dispose();}
 assert.throws(()=>roFacetedBoxGeometry(0,1,1),/positive/);assert.throws(()=>roFacetedBoxGeometry(1,Infinity,1),/positive/);assert.equal(roChamferAmount(4),1);assert.equal(roChamferAmount(-2),0);
});

test('shell presentation preserves voxel default and omits completely buried chamfered parts',()=>{
 const parts=[[0,0,0,4,4,4,0x445566],[0,0,0,1,1,1,0xffffff]],plain=voxelShellGeometry(parts),faceted=voxelShellGeometry(parts,{faceted:true,chamfer:.5});assert.equal(plain.attributes.position.count/3,12);assert.equal(faceted.attributes.position.count/3,44);assert.equal(plain.userData.roVoxelParts,parts);assert.ok(plain.userData.roVoxelFaces[1].every(v=>!v));assert.deepEqual(faceted.boundingBox.min.toArray(),[-2,-2,-2]);flatAndFinite(faceted);
 const joined=voxelShellGeometry([[-.5,0,0,1,1,1,0xffffff],[.5,0,0,1,1,1,0xffffff]],{faceted:true,chamfer:1});flatAndFinite(joined);assert.ok(joined.attributes.position.count/3<88);plain.dispose();faceted.dispose();joined.dispose();
});

test('the unit box cache is shared, quantized and bounded, and its owner can dispose every entry',()=>{
 const cache=createRoFacetedGeometryCache();assert.equal(cache.get('faceted',.5),cache.get('faceted',.501));for(let i=0;i<=100;i++)cache.get('faceted',i/100);assert.ok(cache.stats().entries<=21);assert.ok(cache.stats().bytes>0);let disposed=0;for(let i=0;i<=20;i++)cache.get('faceted',i/20).addEventListener('dispose',()=>disposed++);cache.dispose();assert.equal(disposed,21);assert.equal(cache.stats().entries,0);
});

test('stepped terrain chamfers exposed rims but leaves equal-height interior joins flat and sampling untouched',()=>{
 const heights=new Float32Array([1,1,2,1]),before=[...heights],g=roFacetedTerrainGeometry({columns:2,rows:2,cellSize:2,heights,base:-1,chamfer:.6});flatAndFinite(g);assert.deepEqual([...heights],before);assert.deepEqual(g.boundingBox.min.toArray(),[-1,-1,-1]);assert.deepEqual(g.boundingBox.max.toArray(),[3,2,3]);const zero=roFacetedTerrainGeometry({columns:2,rows:2,cellSize:2,heights,base:-1,chamfer:0});assert.ok(g.attributes.position.count>zero.attributes.position.count);assert.throws(()=>roFacetedTerrainGeometry({columns:2,rows:2,heights:[1]}),/Invalid/);g.dispose();zero.dispose();
});

test('presentation swaps shared boxes and baked actors without changing transforms, instances, colors or hitboxes, then restores them',()=>{
 const scene=new T.Scene(),source=new T.BoxGeometry(2,3,4),color=new Float32Array(source.attributes.position.count*3).fill(.25);source.setAttribute('color',new T.BufferAttribute(color,3));source.setAttribute('perInstance',new T.InstancedBufferAttribute(new Float32Array([7,8]),1));const mat=new T.MeshLambertMaterial({vertexColors:true}),a=new T.Mesh(source,mat),b=new T.InstancedMesh(source,mat,2);a.castShadow=b.castShadow=true;a.position.set(4,5,6);a.scale.set(2,1,3);b.setMatrixAt(0,new T.Matrix4().makeTranslation(1,2,3));scene.add(a,b);
 const fire=new T.Mesh(source,new T.MeshLambertMaterial({transparent:true}));fire.castShadow=true;scene.add(fire);const particle=new T.Mesh(source,mat);particle.castShadow=true;particle.name='voxel-fire-embers';scene.add(particle);
 const actorSource=voxelShellGeometry([[0,0,0,1,1,1,0x33ff66]]),actor=new T.Mesh(actorSource,mat);scene.add(actor);let originalDisposed=0;source.addEventListener('dispose',()=>originalDisposed++);
 const presentation=createRoGeometryPresentation({scene});presentation.setOptions({terrainStyle:'faceted',chamfer:.5});presentation.update(0);assert.equal(a.geometry,b.geometry);assert.notEqual(a.geometry,source);assert.notEqual(actor.geometry,actorSource);assert.equal(fire.geometry,source);assert.equal(particle.geometry,source);assert.equal(a.material,mat);assert.deepEqual(a.position.toArray(),[4,5,6]);assert.deepEqual(a.scale.toArray(),[2,1,3]);assert.ok([...a.geometry.attributes.color.array].every(v=>v===.25));assert.equal(a.geometry.attributes.perInstance,source.attributes.perInstance);assert.deepEqual([...b.instanceMatrix.array].slice(12,15),[1,2,3]);
 const old=a.geometry;let retired=0;old.addEventListener('dispose',()=>retired++);presentation.setOptions({terrainStyle:'faceted',chamfer:.75});presentation.update(1);assert.notEqual(a.geometry,old);assert.equal(retired,1);assert.equal(a.geometry,b.geometry);
 presentation.setOptions({terrainStyle:'blocks'});presentation.update(2);assert.equal(a.geometry,source);assert.equal(actor.geometry,actorSource);assert.equal(presentation.stats().geometries,0);assert.equal(originalDisposed,0);presentation.dispose();source.dispose();actorSource.dispose();mat.dispose();
});

test('new instanced scenery adopts the active style on the next throttled traversal and dispose restores shared resources',()=>{
 const scene=new T.Scene(),presentation=createRoGeometryPresentation({scene});presentation.setOptions({terrainStyle:'faceted',chamfer:.5});presentation.update(0);const source=new T.BoxGeometry(1,1,1),mesh=new T.InstancedMesh(source,new T.MeshLambertMaterial(),3);mesh.castShadow=true;scene.add(mesh);presentation.update(50);assert.equal(mesh.geometry,source);presentation.update(101);assert.notEqual(mesh.geometry,source);const style=mesh.geometry;let disposed=0;style.addEventListener('dispose',()=>disposed++);presentation.dispose();assert.equal(mesh.geometry,source);assert.equal(disposed,1);source.dispose();mesh.material.dispose();
});

test('one unsupported terrain source cannot interrupt the render loop or disable other faceted models',()=>{
 const scene=new T.Scene(),bad=new T.Mesh(new T.BoxGeometry(),new T.MeshLambertMaterial()),good=new T.Mesh(new T.BoxGeometry(),new T.MeshLambertMaterial());bad.userData.roTerrainGrid={columns:2,rows:2,heights:[]};bad.castShadow=good.castShadow=true;scene.add(bad,good);const original=bad.geometry,p=createRoGeometryPresentation({scene});p.setOptions({terrainStyle:'faceted'});assert.doesNotThrow(()=>p.update(0));assert.equal(bad.geometry,original);assert.equal(p.stats().skipped,1);assert.equal(p.stats().meshes,1);p.dispose();for(const m of [bad,good]){m.geometry.dispose();m.material.dispose();}
});
