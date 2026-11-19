import test from 'node:test';
import assert from 'node:assert/strict';
import {TREE_TAG_BUILDINGS,TREE_TAG_WORKERS,TREE_TAG_UNITS} from '../shared/tree-tag-catalog.js';
import {treeTrainedModelKey,treeTrainedSpec,buildTreeTrainedModel,treeTrainedPortrait,treeTrainedDescription} from '../src/tree-trained-art.js';
const trained=[...new Set(Object.values(TREE_TAG_BUILDINGS).flatMap(b=>b.train))].filter(raw=>!Object.hasOwn(TREE_TAG_WORKERS,raw));

test('all eight trained combat units have distinct, finite voxel models and portraits from the same descriptor',()=>{
 assert.equal(trained.length,8);const shapes=new Set(),before=JSON.stringify(TREE_TAG_UNITS);
 for(const raw of trained){const unit={treeTagTrained:true,treeTagSummon:true,rawId:raw},key=treeTrainedModelKey(unit),spec=treeTrainedSpec(key),drawn=[];assert.equal(key,'tree-trained:'+raw);assert.equal(treeTrainedSpec(raw),spec);assert.equal(buildTreeTrainedModel(unit,{},(_body,...p)=>drawn.push(p)),spec);assert.deepEqual(drawn,spec.parts);assert.ok(spec.parts.length>8&&spec.parts.length<90);assert.ok(spec.parts.every(p=>p.length===7&&p.every(Number.isFinite)&&p.slice(3,6).every(v=>v>0)));assert.ok(spec.legs.every(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color].every(Number.isFinite)));const shape=JSON.stringify(spec.parts);assert.equal(shapes.has(shape),false,raw);shapes.add(shape);assert.match(treeTrainedPortrait(raw),/<svg/);assert.equal(treeTrainedPortrait(unit),treeTrainedPortrait(raw));assert.doesNotMatch(treeTrainedPortrait(raw),/NaN|undefined/);assert.ok(treeTrainedDescription(raw).length>45);assert.equal(treeTrainedDescription(unit),treeTrainedDescription(raw));}
 assert.equal(JSON.stringify(TREE_TAG_UNITS),before);
});
test('vehicles and elementals do not inherit humanoid legs; unrelated units remain in their own renderer',()=>{
 for(const raw of ['eC28','eC34']){assert.equal(treeTrainedSpec(raw).legs.length,0);assert.equal(treeTrainedSpec(raw).motion,'vehicle');}
 for(const raw of ['h004','h005']){assert.equal(treeTrainedSpec(raw).legs.length,0);assert.equal(treeTrainedSpec(raw).motion,'float');}
 for(const raw of ['eC26','eC27','eC48','EC29'])assert.equal(treeTrainedSpec(raw).legs.length,2);
 for(const unit of [{rawId:'eC26'},{treeTagTrained:true,treeTagSummon:true,treeTagWorker:true,rawId:'uC43'},{castleUnit:true,rawId:'h004'},{kodoTagSoldier:true,rawId:'hC12'}]){assert.equal(treeTrainedModelKey(unit),null);assert.equal(buildTreeTrainedModel(unit,{},()=>{throw Error('unexpected draw');}),null);}
 for(const key of ['constructor','__proto__','unknown',null]){assert.equal(treeTrainedSpec(key),null);assert.equal(treeTrainedPortrait(key),'');assert.equal(treeTrainedDescription(key),'');}
});
