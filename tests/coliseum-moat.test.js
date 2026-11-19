import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createColiseumMoat,coliseumMoatLayout} from '../src/coliseum-moat.js';
import {arenaBoundaryRadius,coliseumLayout} from '../src/coliseum-architecture.js';
import {createColiseum} from '../src/coliseum.js';

test('molten channel stays outside the playable boundary and within the seating wall, with four gate crossings',()=>{
 const layout=coliseumMoatLayout(),arena=coliseumLayout();assert.equal(layout.inner.length,192);assert.equal(layout.outer.length,192);assert.equal(layout.bridges.length,4);
 for(const [i,p]of layout.inner.entries()){assert.ok(Math.hypot(p.x,p.z)>arenaBoundaryRadius(p.x,p.z)+1.09);const q=layout.outer[i];assert.ok(Math.hypot(q.x,q.z)>Math.hypot(p.x,p.z));assert.ok((q.x/arena.innerRx)**2+(q.z/arena.innerRz)**2<1);}
 for(const [i,b]of layout.bridges.entries()){assert.ok(b.width>=5.5);assert.ok(b.length>7);assert.ok(Math.abs(b.yaw-arena.gates[i].angle)<1e-8);}
});

test('moat uses two render batches and the shared eight-frame molten material, with upward faces and no stale allocations',()=>{
 const base=new T.BoxGeometry(),art=createColiseumMoat({base}),surface=art.root.getObjectByName('coliseum-moat-lava'),masonry=art.root.getObjectByName('coliseum-moat-basalt-and-bridges');assert.equal(art.root.children.length,2);assert.ok(surface.material.isShaderMaterial);assert.ok(masonry.isInstancedMesh);
 assert.ok(masonry.count<450);const normals=surface.geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>.99);
 const geometry=surface.geometry,material=surface.material;art.update(.1);assert.equal(material.uniforms.uTime.value,0);art.update(.2);assert.equal(material.uniforms.uTime.value,.125);art.update(3);assert.equal(material.uniforms.uTime.value,3);assert.equal(surface.geometry,geometry);
 let borrowed=0,ownGeometry=0,ownMaterial=0; base.addEventListener('dispose',()=>borrowed++);geometry.addEventListener('dispose',()=>ownGeometry++);material.addEventListener('dispose',()=>ownMaterial++);art.dispose();art.dispose();assert.equal(borrowed,0);assert.equal(ownGeometry,1);assert.equal(ownMaterial,1);base.dispose();
});

test('volcanic moat follows theme and expansion changes without altering authoritative hazards or other modes',()=>{
 const scene=new T.Scene(),base=new T.BoxGeometry(),material=new T.MeshLambertMaterial(),environment=new T.Mesh(base,material),tiles=new T.InstancedMesh(base,material,1600),sun=new T.DirectionalLight(),art=createColiseum(scene,tiles,environment,sun,base,material);
 const state={arena:'volcano',time:1,options:{mode:'campaign'},zones:[{type:'lava',x:0,z:8,r:2.2}],effects:[]},before=JSON.stringify(state);art.update(state,1000);assert.ok(art.moat.visible);assert.equal(JSON.stringify(state),before);assert.equal(art.hazards.children.filter(c=>c.geometry?.type==='CircleGeometry').length,1);
 for(const arena of ['forest','glacier','tempest','moon']){art.update({...state,arena});assert.equal(art.moat.visible,false);}
 art.update(state);assert.ok(art.moat.visible);art.setExpanded(true);assert.equal(art.moat.visible,false);art.setExpanded(false);assert.ok(art.moat.visible);
 for(const mode of ['castlefight','linewars']){art.update({...state,options:{mode}});assert.equal(art.moat.visible,false);}
 art.update(state);assert.ok(art.moat.visible);art.dispose();assert.equal(scene.getObjectByName('coliseum-lava-moat'),undefined);base.dispose();material.dispose();
});
