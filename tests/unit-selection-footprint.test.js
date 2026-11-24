import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {unitFootprintRadius} from '../shared/unit-footprint.js';
import {selectionFootprint} from '../src/unit-selection-footprint.js';
import {createHoverHighlight} from '../src/hover-highlight.js';
test('selection circles show the authoritative physical radius with visual scale applied exactly once',()=>{
 for(const mode of ['campaign','tower','linewars','castlefight','treetag','kodotag','phasekiller','bloody','dungeon','warlock','bonk'])for(const size of [.8,1,2.4]){
  const unit={size,collisionRadius:1.13},before=structuredClone(unit),visualScale=size*1.35,pose=selectionFootprint(unit,mode,visualScale);
  assert.equal(pose.radius,unitFootprintRadius(unit,{mode}));assert.ok(Math.abs(pose.localRadius*visualScale-1.13)<1e-10);assert.deepEqual(unit,before);
 }
});
test('hover selection outer edge follows the same local physical footprint without changing borrowed geometry',()=>{
 const root=new T.Group(),body=new T.Group(),geometry=new T.BoxGeometry(),material=new T.MeshLambertMaterial();root.add(body);body.add(new T.Mesh(geometry,material));const highlight=createHoverHighlight({root,body});root.scale.setScalar(2);highlight.update({visible:true,radius:.565});const ring=root.children.find(o=>o.isMesh&&o.geometry.type==='RingGeometry');assert.ok(ring);assert.equal(ring.scale.x,.565);assert.ok(Math.abs(ring.scale.x*root.scale.x-1.13)<1e-10);highlight.dispose();geometry.dispose();material.dispose();
});
