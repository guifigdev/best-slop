import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {createExplorationFog,dungeonFogGrid} from '../src/exploration-fog.js';
import {treeTagVision} from '../shared/exploration-vision.js';

test('Tree Tag reveals allied sight, hides distant opponents and keeps explored terrain dim after leaving',()=>{
 const g=new Game(3,{mode:'treetag'});g.addPlayer('p','ent');g.addPlayer('q','blaze');g.initTreeTag();const p=g.player('p'),q=g.player('q');Object.assign(p,{x:-35,z:-35});Object.assign(q,{x:35,z:35});
 const first=g.snapshotFor('p');assert.ok(first.units.some(u=>u.id===p.id));assert.ok(!first.units.some(u=>u.id===q.id));const v=first.treeTag.vision;assert.ok(v.cells.includes('0'));assert.ok(v.cells.includes('2'));
 const index=Math.floor((p.z-v.bounds.minZ)/(v.bounds.maxZ-v.bounds.minZ)*v.size)*v.size+Math.floor((p.x-v.bounds.minX)/(v.bounds.maxX-v.bounds.minX)*v.size);assert.equal(v.cells[index],'2');
 Object.assign(p,{x:0,z:25});g.time+=1;const next=treeTagVision(g,'p');assert.equal(next.cells[index],'1');assert.ok(next.cells.includes('0'));
 Object.assign(q,{x:p.x+1,z:p.z});g.time+=1;assert.ok(g.snapshotFor('p').units.some(u=>u.id===q.id));
});

test('Dungeon preparation uses the authoritative map and only exposes the starting room before combat',()=>{
 const g=new Game(393,{mode:'dungeon',dungeonPartySize:1});g.addPlayer('p','knight');const s=g.snapshotFor('p');assert.ok(s.dungeon.map);const v=s.dungeon.visibility;assert.deepEqual(v.visibleRooms,[0]);const grid=dungeonFogGrid(s.dungeon.map,v),at=room=>{const m=s.dungeon.map,x=Math.round(room.x/m.tileSize+(m.width-1)/2),z=Math.round(room.z/m.tileSize+(m.height-1)/2);return grid.cells[z*grid.size+x];};assert.equal(at(s.dungeon.map.rooms[0]),255);assert.equal(at(s.dungeon.map.rooms[8]),0);
 const remembered=dungeonFogGrid(s.dungeon.map,{visibleRooms:[1],discoveredRooms:[0,1]});assert.ok(remembered.cells.includes(28));assert.ok(remembered.cells.includes(0));assert.ok(remembered.cells.includes(255));
});

test('one exploration texture shades instanced world positions, restores materials and disables itself outside exploration games',()=>{
 const scene=new T.Scene(),material=new T.MeshLambertMaterial(),mesh=new T.InstancedMesh(new T.BoxGeometry(),material,2);scene.add(mesh);const original=material.onBeforeCompile,fog=createExplorationFog(scene),state={options:{mode:'treetag'},treeTag:{vision:{size:2,bounds:{minX:-2,maxX:2,minZ:-2,maxZ:2},cells:'0212'}}};
 fog.update(state,0);assert.equal(fog.uniforms.exploreActive.value,1);const shader={vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader,uniforms:{}};material.onBeforeCompile(shader,{});assert.match(shader.vertexShader,/instanceMatrix\*exploreVertex/);assert.match(shader.fragmentShader,/gl_FragColor.rgb\*=mix/);assert.equal(shader.uniforms.exploreMap,fog.uniforms.exploreMap);assert.deepEqual([...fog.uniforms.exploreMap.value.image.data],[0,255,30,255]);const texture=fog.uniforms.exploreMap.value;fog.update(state,.4);assert.equal(fog.uniforms.exploreMap.value,texture);fog.update({options:{mode:'campaign'}},1);assert.equal(fog.uniforms.exploreActive.value,0);fog.dispose();assert.equal(material.onBeforeCompile,original);mesh.geometry.dispose();material.dispose();
});
