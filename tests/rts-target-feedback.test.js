import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {previewContainsPoint,rtsTargetFeedbackPolicy,createRtsTargetFeedback,RTS_FEEDBACK_BUDGET as B} from '../src/rts-target-feedback.js';

const unit=(id,x,z,team=2,extra={})=>({id,x,z,team,hp:100,alive:true,size:1,...extra});
const snapshot=(extra={})=>({options:{mode:'campaign'},players:{1:1},units:[unit(1,0,0,1,{hero:'knight',owner:1,target:2}),unit(2,5,5),unit(3,7,5),unit(4,5,5,1,{owner:2}),unit(5,5,5,2,{alive:false}),unit(6,12,5)],...extra});
const frozen=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))frozen(v);}return value;};
test('an automatic attack uses its latest authoritative hit target and expires after attacking stops',()=>{
 const s=snapshot({time:10,effects:[{source:1,target:3,time:9.8,basicAttack:true}]});s.units[0].target=null;s.units[0].order='auto';assert.deepEqual([...rtsTargetFeedbackPolicy(s,1).attackIds],[3]);s.units[0].order='stop';assert.equal(rtsTargetFeedbackPolicy(s,1).attackIds.size,0);s.units[0].order='auto';s.time=20;assert.equal(rtsTargetFeedbackPolicy(s,1).attackIds.size,0);
});

test('circle, rotated rectangle, cone and corridor membership follows the drawn effect, including its boundary',()=>{
 const circle={type:'circle',x:5,z:5,radius:2};assert.ok(previewContainsPoint(circle,{x:7,z:5}));assert.ok(!previewContainsPoint(circle,{x:7.01,z:5}));
 const rect={type:'rect',x:0,z:0,width:2,depth:8,angle:Math.PI/2};assert.ok(previewContainsPoint(rect,{x:3,z:.9}));assert.ok(!previewContainsPoint(rect,{x:0,z:1.1}));
 const cone={type:'cone',x:0,z:0,radius:8,angle:Math.PI/2,halfAngle:.4};assert.ok(previewContainsPoint(cone,{x:5,z:1}));assert.ok(!previewContainsPoint(cone,{x:-5,z:0}));assert.ok(!previewContainsPoint(cone,{x:5,z:3}));assert.ok(!previewContainsPoint(cone,{x:9,z:0}));assert.ok(previewContainsPoint(cone,{x:0,z:0}));
 const corridor={type:'corridor',x:2,z:3,length:8,radius:1,angle:Math.PI/2,start:-.5,end:.8};assert.ok(previewContainsPoint(corridor,{x:10.7,z:3.9}));assert.ok(!previewContainsPoint(corridor,{x:1,z:3}));assert.ok(!previewContainsPoint(corridor,{x:6,z:4.1}));
 const radial={...corridor,radial:true,start:0,end:0};assert.ok(previewContainsPoint(radial,{x:9.8,z:3.7}));assert.ok(!previewContainsPoint(radial,{x:10.1,z:3}));assert.ok(!previewContainsPoint(radial,{x:7,z:4.2}));
 for(const shape of [null,{type:'circle',x:0,z:0,radius:NaN},{type:'circle',x:0,z:0,radius:-3},{type:'cone',x:0,z:0,radius:3,halfAngle:NaN},{type:'corridor',x:0,z:0,length:Infinity,radius:1}])assert.equal(previewContainsPoint(shape,{x:0,z:0}),false);
});

test('attack selection uses authoritative targets and preview highlights only living enemies inside actual effect shapes',()=>{
 const s=frozen(snapshot()),before=JSON.stringify(s),preview={sourceId:1,valid:true,shapes:[{type:'circle',x:0,z:0,radius:100,role:'range'},{type:'circle',x:5,z:5,radius:2,role:'effect'}]},policy=rtsTargetFeedbackPolicy(s,1,{preview,hoveredId:6});assert.deepEqual([...policy.attackIds],[2]);assert.deepEqual([...policy.aoeIds],[2,3]);assert.deepEqual([...policy.targetIds],[2,3]);assert.equal(JSON.stringify(s),before);
 const unselected=snapshot({units:[unit(1,0,0,1,{hero:'knight',owner:1,target:null}),unit(6,2,2)]});assert.equal(rtsTargetFeedbackPolicy(unselected,1,{hoveredId:6}).targetIds.size,0,'hover alone is never an attack order');assert.equal(rtsTargetFeedbackPolicy(s,1,{preview:{...preview,shapes:preview.shapes.slice(0,1)}}).aoeIds.size,0,'cast range is not AoE');assert.equal(rtsTargetFeedbackPolicy(s,1,{preview,isVisible:u=>u.id!==2}).targetIds.has(2),false,'fogged units remain hidden');
 assert.equal(rtsTargetFeedbackPolicy(snapshot({options:{mode:'bonk'}}),1,{preview}).enabled,false);assert.equal(rtsTargetFeedbackPolicy(null,1).enabled,false);
});

test('selected controlled units may contribute real attack targets; preview uses its explicit owned source',()=>{
 const units=[unit(1,0,0,1,{hero:'knight',owner:1,target:null}),unit(2,3,3),unit(3,8,8),unit(10,0,0,1,{owner:1,target:3}),unit(11,0,0,1,{owner:2,target:2})],s=snapshot({units});const p=rtsTargetFeedbackPolicy(s,1,{selectedIds:new Set([10,11]),preview:{sourceId:10,shapes:[{type:'circle',x:3,z:3,radius:1,role:'secondary'}]}});assert.deepEqual([...p.attackIds],[3]);assert.deepEqual([...p.aoeIds],[2]);assert.equal(p.sourceId,10);assert.equal(rtsTargetFeedbackPolicy(s,1,{preview:{sourceId:11,shapes:[{type:'circle',x:3,z:3,radius:1,role:'effect'}]}}).aoeIds.size,0);
});

test('pooled target rings, brackets and movement chevrons follow actors without mutating borrowed materials',()=>{
 const scene=new T.Scene(),feedback=createRtsTargetFeedback({scene}),borrowed=new T.MeshLambertMaterial({color:0x123456}),root=new T.Group();root.position.set(15,4,25);root.add(new T.Mesh(new T.BoxGeometry(),borrowed));const actors=new Map([[2,{root,modelHeight:3}],[3,{root:new T.Group(),modelHeight:2}]]),s=frozen(snapshot());
 try{feedback.mark({x:20,z:30},5);const p=feedback.update(s,1,5,{actors,heightAt:()=>4,camera:new T.PerspectiveCamera(),preview:{sourceId:1,shapes:[{type:'circle',x:5,z:5,radius:2,role:'effect'}]}});assert.ok(p.targetIds.has(2));assert.equal(feedback.ids(),p.targetIds);assert.ok(feedback.stats().moveVisible);assert.equal(feedback.root.children.length,B.drawCalls);assert.equal(feedback.stats().attackTargets,1);assert.equal(feedback.stats().areaTargets,2);assert.equal(borrowed.color.getHex(),0x123456);const ring=feedback.root.children[0],matrix=new T.Matrix4(),position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3();ring.getMatrixAt(0,matrix);matrix.decompose(position,quaternion,scale);assert.equal(position.x,15);assert.equal(position.z,25);const geometry=ring.geometry,buffer=ring.instanceMatrix.array;
  feedback.update(s,1,5.2,{actors,heightAt:()=>4});assert.equal(ring.geometry,geometry);assert.equal(ring.instanceMatrix.array,buffer);for(const m of feedback.root.children)assert.ok(m.instanceMatrix.array.every(Number.isFinite));feedback.update(s,1,7,{actors});assert.equal(feedback.stats().moveVisible,false);feedback.update(snapshot({options:{mode:'bonk'}}),1,7);assert.equal(feedback.root.visible,false);assert.equal(feedback.ids().size,0);feedback.reset();assert.ok(feedback.root.children.every(m=>m.count===0));assert.equal(feedback.mark({x:NaN,z:0},8),false);
 }finally{feedback.dispose();feedback.dispose();root.children[0].geometry.dispose();borrowed.dispose();}assert.equal(scene.children.length,0);
});

test('large battles remain within fixed budgets and dispose only owned resources once',()=>{
 const scene=new T.Scene(),feedback=createRtsTargetFeedback({scene}),units=[unit(1,0,0,1,{hero:'knight',owner:1,target:2}),...Array.from({length:1000},(_,i)=>unit(i+2,i%10,Math.floor(i/10)%10))],s=snapshot({units});let disposed=0;const geometries=new Set(feedback.root.children.map(m=>m.geometry)),materials=new Set(feedback.root.children.map(m=>m.material));for(const g of geometries)g.addEventListener('dispose',()=>disposed++);for(const m of materials)m.addEventListener('dispose',()=>disposed++);
 feedback.mark({x:0,z:0},1);feedback.update(s,1,1,{preview:{sourceId:1,shapes:[{type:'circle',x:0,z:0,radius:100,role:'effect'}]}});const stats=feedback.stats();assert.ok(stats.targets<=B.targets);assert.ok(stats.rings<=B.rings);assert.ok(stats.brackets<=B.brackets);assert.ok(stats.arrows<=B.arrows);assert.ok(stats.drawCalls<=B.drawCalls);feedback.dispose();feedback.dispose();assert.equal(disposed,5);feedback.update(s,1,2);assert.equal(scene.children.length,0);
});
