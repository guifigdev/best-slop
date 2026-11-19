import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {coliseumLayout,createColiseumArchitecture,COLISEUM_THEME_COLORS,arenaBoundaryPoints,arenaBoundaryRadius} from '../src/coliseum-architecture.js';
import {hazardDecorations,createHazardArt} from '../src/hazard-art.js';
import {createColiseum} from '../src/coliseum.js';
import {createBattlefield} from '../src/battlefield.js';

test('four true seating terraces, arcades and gates sit entirely outside the authoritative playable circle',()=>{
 const layout=coliseumLayout();assert.equal(layout.rows.length,4);assert.equal(layout.gates.length,4);assert.ok(layout.boxes.length>1000);assert.ok(layout.boxes.length<2500);assert.ok(layout.seats.length>=280);assert.equal(new Set(layout.seats.map(s=>s.row)).size,4);assert.equal(new Set(layout.seats.map(s=>s.species)).size,6);assert.ok(Math.max(...layout.boxes.map(b=>b.y+b.h/2))>=10);
 for(const b of layout.boxes){assert.ok([b.x,b.y,b.z,b.w,b.h,b.d,b.yaw].every(Number.isFinite));assert.ok(b.w>0&&b.h>0&&b.d>0);assert.ok(Math.hypot(b.x,b.z)-Math.hypot(b.w,b.d)/2>20.5,JSON.stringify(b));assert.ok(COLISEUM_THEME_COLORS.forest[b.role]);}
 for(const seat of layout.seats)assert.ok(Math.hypot(seat.x,seat.z)>27);for(let i=1;i<4;i++){assert.ok(layout.rows[i].y>layout.rows[i-1].y);assert.ok(layout.rows[i].rx>layout.rows[i-1].rx);}
});

test('the architecture is one instanced batch and five arena palettes recolor stone and banners independently',()=>{
 const art=createColiseumArchitecture();assert.equal(art.root.children.length,1);const mesh=art.root.children[0];assert.equal(mesh.isInstancedMesh,true);assert.equal(mesh.count,art.layout.boxes.length);const before=Array.from(mesh.instanceColor.array);art.setTheme('volcano');assert.notDeepEqual(Array.from(mesh.instanceColor.array),before);for(const theme of ['forest','volcano','glacier','tempest','moon']){art.setTheme(theme);assert.ok(Array.from(mesh.instanceColor.array).every(Number.isFinite));}art.dispose();assert.equal(art.root.parent,null);
});

test('lava, ice, water and frost have different surfaces while their visible footprint remains exactly the simulation radius',()=>{
 const art=createHazardArt({heightAt:(x,z)=>x+z}),zones=['lava','ice','water','frost'].map((type,i)=>({id:type,type,x:i*6,z:1,r:2.6}));art.update(zones,.1);assert.equal(art.zoneCount,4);const surfaces=art.root.children.filter(c=>c.geometry?.type==='CircleGeometry');assert.equal(surfaces.length,4);assert.equal(new Set(surfaces.map(s=>s.material.uniforms.uKind.value)).size,4);
 for(const surface of surfaces){const pos=surface.geometry.attributes.position;let max=0;for(let i=0;i<pos.count;i++)max=Math.max(max,Math.hypot(pos.getX(i),pos.getY(i)));assert.ok(Math.abs(max-2.6)<1e-6);assert.equal(surface.position.y,surface.position.x+surface.position.z+.055);assert.equal(surface.material.uniforms.uTime.value,0);}
 assert.ok(hazardDecorations(zones[0]).some(p=>p.role==='ember'));assert.ok(hazardDecorations(zones[0]).some(p=>p.role==='crust'));assert.ok(hazardDecorations(zones[3]).some(p=>p.role==='crystal'));for(const p of hazardDecorations(zones[0]).filter(p=>p.role==='crust'))assert.ok(Math.hypot(p.x,p.z)+Math.hypot(p.w,p.d)/2<2.6);
 art.update(zones,.2);assert.ok(surfaces.every(s=>s.material.uniforms.uTime.value===.125));art.dispose();
});

test('hazard changes and removal refresh geometry immediately without accumulating stale surfaces',()=>{
 const art=createHazardArt();art.update([{id:1,type:'lava',x:0,z:0,r:2}],0);const first=art.root.children.find(c=>c.geometry?.type==='CircleGeometry');art.update([{id:1,type:'ice',x:3,z:2,r:4}],0);const next=art.root.children.find(c=>c.geometry?.type==='CircleGeometry');assert.notEqual(next,first);assert.equal(art.zoneCount,1);assert.equal(next.geometry.parameters.radius,4);assert.equal(next.position.x,3);assert.equal(next.material.uniforms.uKind.value,1);art.update([],0);assert.equal(art.zoneCount,0);assert.equal(art.root.children.length,1);assert.equal(art.root.children[0].count,0);art.dispose();
});

test('coliseum crowd uses baked instanced poses and never leaks into Line Wars, Castle Fight or expanded battlefields',()=>{
 const scene=new T.Scene();scene.background=new T.Color();scene.fog=new T.Fog(0,1,100);const base=new T.BoxGeometry(),material=new T.MeshLambertMaterial(),tiles=new T.InstancedMesh(base,material,1600),environment=new T.Mesh(base,material),sun=new T.DirectionalLight();const art=createColiseum(scene,tiles,environment,sun,base,material);
 art.update({time:0,arena:'forest',effects:[],zones:[],options:{mode:'campaign'}},0);assert.equal(art.architecture.visible,true);assert.equal(art.audience.children.length,8);const body=art.audience.children[0],idle=Array.from(body.instanceMatrix.array);art.update({time:.01,arena:'forest',effects:[{id:1,type:'critical'}],zones:[],options:{mode:'campaign'}},10);assert.notDeepEqual(Array.from(body.instanceMatrix.array),idle);const cheer=Array.from(body.instanceMatrix.array);art.update({time:.04,arena:'forest',effects:[],zones:[],options:{mode:'campaign'}},40);assert.deepEqual(Array.from(body.instanceMatrix.array),cheer);
 for(const mode of ['linewars','castlefight']){art.update({time:1,arena:'volcano',options:{mode:'tower'}},1000);art.update({time:1,arena:'forest',options:{mode}},1000);assert.equal(sun.color.getHex(),0xffeccb,'switching games restores biome lighting');art.setExpanded(false);assert.equal(art.architecture.visible,false);assert.equal(art.audience.visible,false);assert.equal(art.hazards.visible,false);}
 art.update({time:2,arena:'forest',field:{seed:3},options:{mode:'war'}},2000);assert.equal(art.architecture.visible,false);art.update({time:3,arena:'forest',options:{mode:'tower'}},3000);art.setExpanded(false);assert.equal(art.architecture.visible,true);art.setExpanded(true);assert.equal(art.architecture.visible,false);art.dispose();base.dispose();material.dispose();
});

test('the ground border matches the rounded square movement boundary instead of suggesting a circular radius eighteen',()=>{
 const points=arenaBoundaryPoints();assert.equal(points.length,128);assert.equal(arenaBoundaryRadius(1,0),18);assert.equal(arenaBoundaryRadius(1,1),20.5);
 for(const point of points){assert.ok(Math.abs(point.x)<=18+1e-8);assert.ok(Math.abs(point.z)<=18+1e-8);assert.ok(Math.hypot(point.x,point.z)<=20.5+1e-8);assert.ok(Math.abs(Math.abs(point.x)-18)<1e-7||Math.abs(Math.abs(point.z)-18)<1e-7||Math.abs(Math.hypot(point.x,point.z)-20.5)<1e-7);const radius=arenaBoundaryRadius(point.x,point.z);assert.ok(Math.abs(Math.hypot(point.x,point.z)-radius)<1e-7);}
});

test('procedural war fields reuse the same hazard surfaces and remove them when returning to other modes',()=>{
 const scene=new T.Scene(),field=createBattlefield(scene);field.update({time:0,field:{seed:7},zones:[{id:1,type:'lava',x:4,z:2,r:3},{id:2,type:'water',x:-4,z:2,r:3}],obstacles:[],cells:[]});const hazards=scene.getObjectByName('arena-hazards');assert.ok(hazards?.visible);assert.equal(hazards.children.filter(c=>c.geometry?.type==='CircleGeometry').length,2);assert.ok(hazards.children.filter(c=>c.geometry?.type==='CircleGeometry').every(c=>c.material.isShaderMaterial));field.update({time:1,zones:[],obstacles:[],cells:[]});assert.equal(hazards.visible,false);assert.equal(hazards.children.length,1);
});
