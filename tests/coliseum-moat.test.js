import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createColiseumMoat,coliseumMoatLayout,coliseumMoatDecorations,COLISEUM_MOAT_THEMES} from '../src/coliseum-moat.js';
import {arenaBoundaryRadius,coliseumLayout} from '../src/coliseum-architecture.js';
import {createColiseum} from '../src/coliseum.js';

test('molten channel stays outside the playable boundary and within the seating wall, with four gate crossings',()=>{
 const layout=coliseumMoatLayout(),arena=coliseumLayout();assert.equal(layout.inner.length,192);assert.equal(layout.outer.length,192);assert.equal(layout.bridges.length,4);
 for(const [i,p]of layout.inner.entries()){assert.ok(Math.hypot(p.x,p.z)>arenaBoundaryRadius(p.x,p.z)+1.09);const q=layout.outer[i];assert.ok(Math.hypot(q.x,q.z)>Math.hypot(p.x,p.z));assert.ok((q.x/arena.innerRx)**2+(q.z/arena.innerRz)**2<1);}
 for(const [i,b]of layout.bridges.entries()){assert.ok(b.width>=5.5);assert.ok(b.length>7);assert.ok(Math.abs(b.yaw-arena.gates[i].angle)<1e-8);}
});

test('lava retains two active render batches while other biomes reuse a third pooled detail batch',()=>{
 const base=new T.BoxGeometry(),art=createColiseumMoat({base}),surface=art.root.getObjectByName('coliseum-moat-lava'),masonry=art.root.getObjectByName('coliseum-moat-basalt-and-bridges');assert.equal(art.root.children.length,3);assert.equal(art.root.children.filter(m=>!m.isInstancedMesh||m.count>0).length,2);assert.ok(surface.material.isShaderMaterial);assert.ok(masonry.isInstancedMesh);
 assert.ok(masonry.count<450);const normals=surface.geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>.99);
 const geometry=surface.geometry,material=surface.material;art.update(.1);assert.equal(material.uniforms.uTime.value,0);art.update(.2);assert.equal(material.uniforms.uTime.value,.125);art.update(3);assert.equal(material.uniforms.uTime.value,3);assert.equal(surface.geometry,geometry);
 let borrowed=0,ownGeometry=0,ownMaterial=0; base.addEventListener('dispose',()=>borrowed++);geometry.addEventListener('dispose',()=>ownGeometry++);material.addEventListener('dispose',()=>ownMaterial++);art.dispose();art.dispose();assert.equal(borrowed,0);assert.equal(ownGeometry,1);assert.equal(ownMaterial,1);base.dispose();
});

test('each coliseum theme has its own channel and weather without altering authoritative hazards or other modes',()=>{
 const scene=new T.Scene(),base=new T.BoxGeometry(),material=new T.MeshLambertMaterial(),environment=new T.Mesh(base,material),tiles=new T.InstancedMesh(base,material,1600),sun=new T.DirectionalLight(),art=createColiseum(scene,tiles,environment,sun,base,material);
 const state={arena:'volcano',time:1,options:{mode:'campaign'},zones:[{type:'lava',x:0,z:8,r:2.2}],effects:[]},before=JSON.stringify(state);art.update(state,1000);assert.ok(art.moat.visible);assert.equal(JSON.stringify(state),before);assert.equal(art.hazards.children.filter(c=>c.geometry?.type==='CircleGeometry').length,1);
 for(const arena of ['forest','glacier','tempest','moon']){art.update({...state,arena});assert.equal(art.moat.visible,true);assert.equal(art.moat.userData.theme,arena);assert.equal(art.moat.userData.kind,COLISEUM_MOAT_THEMES[arena].kind);assert.equal(art.weather.visible,arena==='moon','initial dry front hides precipitation while moon mist remains ambient');}
 art.update({...state,arena:'forest',weatherOverride:'rain'});assert.equal(art.weather.visible,true);assert.ok(art.weather.children[0].count>0);art.update({...state,arena:'forest',weatherOverride:'none'});assert.equal(art.weather.visible,false);
 art.update(state);assert.ok(art.moat.visible);art.setExpanded(true);assert.equal(art.moat.visible,false);art.setExpanded(false);assert.ok(art.moat.visible);
 for(const mode of ['castlefight','linewars','treetag','warlock','kodotag']){art.update({...state,options:{mode}});assert.equal(art.moat.visible,false);assert.equal(art.weather.visible,false);}
 art.update(state);assert.ok(art.moat.visible);art.dispose();assert.equal(scene.getObjectByName('coliseum-lava-moat'),undefined);base.dispose();material.dispose();
});

test('all five biomes preserve the same channel, bridges and GPU allocations while swapping surface treatment',()=>{
 const art=createColiseumMoat(),surface=art.root.getObjectByName('coliseum-moat-lava'),lava=surface.material,geometry=surface.geometry,masonry=art.root.getObjectByName('coliseum-moat-basalt-and-bridges'),decorations=art.root.getObjectByName('coliseum-moat-biome-details'),baseline=Array.from(masonry.instanceColor.array),kinds=new Set(),palettes=new Set();let channel=null;
 for(const theme of ['forest','glacier','tempest','moon']){art.setTheme(theme);art.update(2.26);assert.equal(surface.geometry,geometry);assert.equal(art.layout.bridges.length,4);assert.equal(art.root.children.length,3);if(channel)assert.equal(surface.material,channel);else channel=surface.material;assert.equal(channel.uniforms.uTime.value,2.25);kinds.add(channel.uniforms.uKind.value);palettes.add(channel.uniforms.uDeep.value.getHex());assert.ok(decorations.count>20&&decorations.count<260);const matrix=new T.Matrix4();for(let i=0;i<decorations.count;i++){decorations.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));}assert.notDeepEqual(Array.from(masonry.instanceColor.array),baseline);}
 assert.equal(kinds.size,4);assert.equal(palettes.size,4);art.setTheme('volcano');assert.equal(surface.material,lava);assert.equal(decorations.count,0);assert.deepEqual(Array.from(masonry.instanceColor.array),baseline);art.dispose();
});

test('biome details remain decorative outside the unchanged movement boundary, including snow along every bridge',()=>{
 for(const theme of ['forest','glacier','tempest','moon'])for(const b of coliseumMoatDecorations(theme)){assert.ok([b.x,b.y,b.z,b.w,b.h,b.d,b.hex,b.yaw].every(Number.isFinite));assert.ok(b.w>0&&b.h>0&&b.d>0);const c=Math.cos(b.yaw),s=Math.sin(b.yaw);for(const dx of [-b.w/2,b.w/2])for(const dz of [-b.d/2,b.d/2]){const x=b.x+dx*c+dz*s,z=b.z-dx*s+dz*c;assert.ok(Math.hypot(x,z)>arenaBoundaryRadius(x,z),theme+' detail overlaps gameplay');}}
 const snow=coliseumMoatDecorations('glacier').filter(b=>b.h===.09);assert.equal(snow.length,8);assert.equal(new Set(snow.map(b=>b.yaw)).size,4);assert.deepEqual(coliseumMoatDecorations('volcano'),[]);
});
