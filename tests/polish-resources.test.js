import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {releaseEffect} from '../src/effect-resources.js';
import {createWorldLandscape} from '../src/world-landscape.js';
import {createColiseum} from '../src/coliseum.js';

test('effect cleanup releases every instance buffer exactly once without disposing borrowed projectile resources',()=>{
 const scene=new T.Scene(),group=new T.Group(),nested=new T.Group(),geometry=new T.BoxGeometry(),sharedMaterial=new T.MeshBasicMaterial(),ownedMaterial=new T.MeshBasicMaterial();scene.add(group);group.add(nested);
 const counts={instances:0,sharedGeometry:0,sharedMaterial:0,ownedMaterial:0};geometry.addEventListener('dispose',()=>counts.sharedGeometry++);sharedMaterial.addEventListener('dispose',()=>counts.sharedMaterial++);ownedMaterial.addEventListener('dispose',()=>counts.ownedMaterial++);
 for(const parent of [group,nested]){const mesh=new T.InstancedMesh(geometry,ownedMaterial,4);mesh.addEventListener('dispose',()=>counts.instances++);parent.add(mesh);}
 group.add(new T.Mesh(geometry,sharedMaterial));
 const entry={group,owned:[ownedMaterial,ownedMaterial]};releaseEffect(entry);releaseEffect(entry);
 assert.equal(group.parent,null);assert.deepEqual(counts,{instances:2,sharedGeometry:0,sharedMaterial:0,ownedMaterial:1});geometry.dispose();sharedMaterial.dispose();
});

test('landscape palette stays neutral when another consumer tints the borrowed material, and its own clone is released once',()=>{
 const scene=new T.Scene(),base=new T.BoxGeometry(),material=new T.MeshLambertMaterial({color:0xf1c09b}),art=createWorldLandscape({scene,base,material});art.update({arena:'volcano'});
 const ground=scene.getObjectByName('world-landscape').children.find(mesh=>mesh.name==='landscape-ground'),ownMaterial=ground.material;assert.notEqual(ownMaterial,material);assert.equal(ownMaterial.color.getHex(),0xffffff);material.color.setHex(0xff0000);assert.equal(ownMaterial.color.getHex(),0xffffff);
 let releases=0;ownMaterial.addEventListener('dispose',()=>releases++);art.dispose();art.dispose();assert.equal(releases,1);assert.equal(material.color.getHex(),0xff0000);base.dispose();material.dispose();
});

test('coliseum theme tints only its environment clone and restores the borrowed material on disposal',()=>{
 const scene=new T.Scene(),base=new T.BoxGeometry(),material=new T.MeshLambertMaterial(),environment=new T.Mesh(base,material),tiles=new T.InstancedMesh(base,material,1600),sun=new T.DirectionalLight(),art=createColiseum(scene,tiles,environment,sun,base,material),copy=environment.material;
 assert.notEqual(copy,material);let releases=0;copy.addEventListener('dispose',()=>releases++);art.update({time:0,arena:'volcano',effects:[],zones:[],options:{mode:'campaign'}});
 assert.equal(material.color.getHex(),0xffffff);assert.notEqual(copy.color.getHex(),0xffffff);art.dispose();art.dispose();assert.equal(environment.material,material);assert.equal(releases,1);base.dispose();material.dispose();
});
