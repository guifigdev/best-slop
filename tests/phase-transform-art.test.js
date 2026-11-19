import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createPhaseTransformEffect,updatePhaseTransformEffect} from '../src/phase-transform-art.js';
import {releaseEffect} from '../src/effect-resources.js';

test('a transformation retains its previous public silhouette and follows the same participant',()=>{
 const base=new T.BoxGeometry(),event={type:'phaseTransform',time:4,x:3,z:5,source:7,from:'townsperson',to:'beast',duration:1.1},entry=createPhaseTransformEffect(event,base);
 assert.ok(entry.oldBody.children.length>5);assert.equal(entry.dust.count,18);let disposed=false;base.addEventListener('dispose',()=>disposed=true);
 for(const time of [4,4.3,4.9]){assert.equal(updatePhaseTransformEffect(entry,time,[{id:7,x:4,z:6}],.2),true);assert.equal(entry.group.position.x,4);assert.equal(entry.group.position.z,6);assert.ok([...entry.dust.instanceMatrix.array].every(Number.isFinite));assert.ok(entry.material.opacity>=0);}
 assert.equal(updatePhaseTransformEffect(entry,5.2),false);releaseEffect(entry);releaseEffect(entry);assert.equal(disposed,false);base.dispose();
 assert.equal(createPhaseTransformEffect({type:'avatar'},base),null);
});
