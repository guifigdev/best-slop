import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createWarlockTethers} from '../src/warlock-tethers.js';

const state=()=>({time:1,options:{mode:'warlock'},units:[{id:1,x:0,z:0,alive:true,size:1},{id:2,x:6,z:0,alive:true,size:1}],warlock:{links:[{id:10,source:1,target:2,targetKind:'caster',mode:'hook'}],projectiles:[],pillars:[{id:3,x:3,z:5,radius:.8,alive:true}]}});
const matrices=mesh=>{const m=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));}};
const transform=(mesh,i=0)=>{const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();mesh.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);return{position,scale};};

test('persistent Hook draws a finite voxel tether whose endpoints follow both casters',()=>{
 const parent=new T.Group(),view=createWarlockTethers({parent}),s=state();view.update(s,1);const beams=view.root.getObjectByName('warlock-tether-beams'),chain=view.root.getObjectByName('warlock-tether-chain');assert.equal(view.root.visible,true);assert.equal(beams.count,1);assert.ok(chain.count>10);matrices(beams);matrices(chain);let t=transform(beams);assert.equal(t.position.x,3);assert.ok(Math.abs(t.position.y-1.6)<1e-5);assert.ok(Math.abs(t.scale.y-6)<1e-5);
 s.units[0].x=2;s.units[1].x=10;s.units[1].z=4;view.update(s,1.1);assert.equal(view.root.getObjectByName('warlock-tether-beams'),beams);t=transform(beams);assert.equal(t.position.x,6);assert.equal(t.position.z,2);assert.ok(Math.abs(t.scale.y-Math.hypot(8,4))<1e-5);matrices(view.root.getObjectByName('warlock-tether-chain'));s.warlock.links=[];view.update(s,1.2);assert.equal(view.root.visible,false);assert.equal(beams.count,0);assert.equal(view.root.getObjectByName('warlock-tether-chain').count,0);view.dispose();
});
test('the visible rope also follows a flying or returning hook and attaches to pillars',()=>{
 const parent=new T.Group(),view=createWarlockTethers({parent}),s=state();s.warlock.links=[{id:10,source:1,target:3,targetKind:'pillar'}];s.warlock.projectiles=[{id:11,family:'link',source:2,x:9,z:2,returning:false}];view.update(s,1);const beams=view.root.getObjectByName('warlock-tether-beams');assert.equal(beams.count,2);matrices(beams);const pillar=transform(beams,0);assert.equal(pillar.position.x,1.5);assert.equal(pillar.position.z,2.5);const flight=transform(beams,1);assert.equal(flight.position.x,7.5);assert.equal(flight.position.z,1);
 s.warlock.projectiles[0].returning=true;s.warlock.projectiles[0].x=7;view.update(s,1.3);assert.equal(transform(beams,1).position.x,6.5);s.warlock.pillars[0].alive=false;view.update(s,1.4);assert.equal(beams.count,1);s.units[1].alive=false;view.update(s,1.5);assert.equal(view.root.visible,false);view.dispose();
});
test('Control has a separate overhead mark and never invents a caster-to-caster tether',()=>{
 const parent=new T.Group(),view=createWarlockTethers({parent}),s=state();s.warlock.links=[];s.units[1].wlControl={source:1,orb:10,until:3};view.update(s,1);const markers=view.root.getObjectByName('warlock-control-markers');assert.equal(markers.count,4);assert.equal(view.root.getObjectByName('warlock-tether-beams').count,0);assert.equal(view.root.visible,true);matrices(markers);view.update(s,3);assert.equal(markers.count,0);assert.equal(view.root.visible,false);view.dispose();
});
test('batches grow when needed, hide outside Warlock, and release all owned resources exactly once',()=>{
 const parent=new T.Group(),view=createWarlockTethers({parent}),s=state();view.update(s,1);const first=view.root.getObjectByName('warlock-tether-beams');let retired=0;first.addEventListener('dispose',()=>retired++);s.warlock.links=Array.from({length:20},(_,i)=>({id:i,source:1,target:2,targetKind:'caster'}));view.update(s,2);const beams=view.root.getObjectByName('warlock-tether-beams');assert.notEqual(beams,first);assert.equal(retired,1);assert.equal(beams.count,20);for(const mesh of view.root.children)matrices(mesh);view.update({options:{mode:'treetag'}},3);assert.equal(view.root.visible,false);assert.equal(beams.count,0);
 const materials=new Set(view.root.children.map(m=>m.material)),geometry=beams.geometry;let geometryDisposed=0,materialDisposed=0;geometry.addEventListener('dispose',()=>geometryDisposed++);for(const mat of materials)mat.addEventListener('dispose',()=>materialDisposed++);view.dispose();view.dispose();assert.equal(parent.children.length,0);assert.equal(geometryDisposed,1);assert.equal(materialDisposed,3);
});
