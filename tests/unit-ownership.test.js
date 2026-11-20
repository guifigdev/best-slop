import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {tintOwnershipBar} from '../src/unit-ownership.js';
test('ownership colors distinguish armies without tinting every actor that shares the material',()=>{
 const material=new T.MeshLambertMaterial({vertexColors:true}),make=()=>{const g=new T.BoxGeometry();g.setAttribute('color',new T.BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));return new T.Mesh(g,material);},own=make(),ally=make(),enemy=make();
 for(const [mesh,color]of [[own,0x70e28e],[ally,0x75b9ff],[enemy,0xf07870]])tintOwnershipBar(mesh,color);assert.equal(material.color.getHex(),0xffffff);assert.notDeepEqual([...own.geometry.attributes.color.array],[...ally.geometry.attributes.color.array]);const version=own.geometry.attributes.color.version;tintOwnershipBar(own,0x70e28e);assert.equal(own.geometry.attributes.color.version,version);for(const m of [own,ally,enemy])m.geometry.dispose();material.dispose();
});
