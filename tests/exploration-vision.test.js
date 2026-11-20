import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {createExplorationFog,dungeonFogGrid,softenVision} from '../src/exploration-fog.js';
import {treeTagVision,kodoTagVision,filterExplorationSnapshot} from '../shared/exploration-vision.js';
import {createKodoWorld} from '../src/kodo-world.js';

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
 fog.update(state,0);assert.equal(fog.uniforms.exploreActive.value,1);const shader={vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader,uniforms:{}};material.onBeforeCompile(shader,{});assert.match(shader.vertexShader,/instanceMatrix\*exploreVertex/);assert.match(shader.fragmentShader,/gl_FragColor.rgb\*=mix/);assert.equal(shader.uniforms.exploreMap,fog.uniforms.exploreMap);assert.deepEqual([...fog.uniforms.exploreMap.value.image.data],[...softenVision(state.treeTag.vision)]);assert.ok([...fog.uniforms.exploreMap.value.image.data].every(v=>v>0));const texture=fog.uniforms.exploreMap.value;fog.update(state,.4);assert.equal(fog.uniforms.exploreMap.value,texture);fog.update({options:{mode:'campaign'}},1);assert.equal(fog.uniforms.exploreActive.value,0);fog.dispose();assert.equal(material.onBeforeCompile,original);mesh.geometry.dispose();material.dispose();
});


test('Kodo remembers trees and enemy structures until their location is observed again',()=>{
 const g=new Game(9,{mode:'kodotag'});g.addPlayer('p','runner');g.initKodoTag();const u=g.player('p'),k=g.kodoTag;
 g.units=g.units.filter(a=>a.id===u.id);k.map={...k.map,obstacles:[]};k.obstacles=[];k.trees=[{id:'tree',x:5,z:0,w:.6,d:.6,alive:true,remaining:200}];u.x=0;u.z=0;g.time+=1;
 let v=kodoTagVision(g,'p');assert.equal(v.remembered.trees.find(t=>t.id==='tree').alive,true);
 k.buildings.push({id:'enemy-wall',x:4,z:4,w:1,d:1,team:9,alive:true,workRemaining:0});g.time+=1;v=kodoTagVision(g,'p');assert.ok(v.remembered.buildings.some(b=>b.id==='enemy-wall'));
 u.x=-50;u.z=-50;g.time+=1;kodoTagVision(g,'p');k.trees[0].alive=false;k.buildings[0].alive=false;k.buildings.push({id:'unseen',x:10,z:0,w:1,d:1,team:9,alive:true});g.time+=1;v=kodoTagVision(g,'p');
 assert.equal(v.remembered.trees.find(t=>t.id==='tree').alive,true,'unseen destruction stays at last seen state');assert.equal(v.remembered.buildings.find(b=>b.id==='enemy-wall').alive,true);assert.ok(!v.remembered.buildings.some(b=>b.id==='unseen'));
 u.x=0;u.z=0;g.time+=1;v=kodoTagVision(g,'p');assert.equal(v.remembered.trees.find(t=>t.id==='tree').alive,false);assert.equal(v.remembered.buildings.find(b=>b.id==='enemy-wall').alive,false);assert.ok(v.remembered.buildings.some(b=>b.id==='unseen'));
});

test('Kodo sight blocks behind cliffs while terrain fades gradually without revealing remote actors',()=>{
 const g=new Game(19,{mode:'kodotag'});g.addPlayer('p','runner');g.initKodoTag();const u=g.player('p'),k=g.kodoTag;g.units=g.units.filter(a=>a.id===u.id);u.x=0;u.z=0;k.trees=[];k.buildings=[];k.map={...k.map,obstacles:[{id:'ridge',x:6,z:0,w:2,d:16,alive:true}]};k.obstacles=k.map.obstacles;
 const enemy={id:987,team:9,x:11,z:0,alive:true};g.units.push(enemy);let v=kodoTagVision(g,'p');assert.ok(!v.unitIds.includes(enemy.id),'cliff occludes enemy inside nominal radius');enemy.z=18;enemy.x=0;g.time+=1;v=kodoTagVision(g,'p');assert.ok(v.unitIds.includes(enemy.id),'increased unobstructed sight radius');enemy.z=40;g.time+=1;v=kodoTagVision(g,'p');assert.ok(!v.unitIds.includes(enemy.id));const light=softenVision(v);assert.ok(Math.min(...light)>=68,'unknown terrain remains faintly visible');assert.ok([...light].some(n=>n>140&&n<240),'soft visibility boundary');
});

function sightFixture(){const hero={id:1,owner:'p',team:1,alive:true,x:0,z:0},g={time:1,player:()=>hero,units:[hero],kodoTag:{map:{minX:-50,maxX:50,minZ:-50,maxZ:50,obstacles:[]},trees:[],buildings:[],elapsed:1}};return{g,hero};}
test('large structures are observed through a visible near face and sight-producing structures do not self-occlude',()=>{
 const {g}=sightFixture();g.kodoTag.buildings=[{id:'enemy',team:2,x:8,z:0,w:8,d:8,alive:true,workRemaining:0}];let vision=kodoTagVision(g,'p');assert.ok(vision.buildingIds.includes('enemy'));assert.ok(vision.remembered.buildings.some(b=>b.id==='enemy'));
 g.kodoTag.buildings[0].team=1;g.kodoTag.buildings[0].type='tower';g.kodoTag.map.obstacles=[{id:'ridge',x:18,z:0,w:1.5,d:15}];g.units.push({id:2,team:2,x:15,z:0,alive:true},{id:3,team:2,x:22,z:0,alive:true});g.time++;vision=kodoTagVision(g,'p');assert.ok(vision.unitIds.includes(2));assert.ok(!vision.unitIds.includes(3),'a different ridge must still shadow the source');
});
test('a nearby opaque wall blocks actors rather than being skipped by the first two ray cells',()=>{
 const {g}=sightFixture();g.kodoTag.map.obstacles=[{id:'close-wall',x:1.4,z:0,w:.6,d:12}];g.units.push({id:2,team:2,x:4,z:0,alive:true});const vision=kodoTagVision(g,'p');assert.ok(!vision.unitIds.includes(2));
});
test('nested actors and effects cannot bypass vision, enemy queues are private, and allied data remains available',()=>{
 const {g,hero}=sightFixture(),hidden={id:90,team:2,owner:'enemy',x:40,z:40,alive:true,kodoTagKodo:true},visible={id:91,team:2,owner:'enemy',x:2,z:0,alive:true,kodoTagWorker:true};g.units.push(hidden,visible);const vision=kodoTagVision(g,'p'),state={units:g.units,effects:[],kodoTag:{map:g.kodoTag.map,kodos:[hidden],workers:[visible],buildings:[],navigationRevision:22,forestRevision:99,respawns:[{at:20}],projectiles:[{id:1,x:40,z:40},{id:2,x:2,z:0}],players:{p:{researching:{key:'own'},productionQueue:['own']},enemy:{owner:'enemy',researching:{key:'secret'},productionQueue:['secret'],researchLevels:{secret:4}}}}};
 const filtered=filterExplorationSnapshot(state,vision);assert.ok(filtered.units.some(u=>u.id===hero.id));assert.ok(!filtered.units.some(u=>u.id===90));assert.deepEqual(filtered.kodoTag.kodos,[]);assert.deepEqual(filtered.kodoTag.workers.map(u=>u.id),[91]);assert.deepEqual(filtered.kodoTag.projectiles.map(p=>p.id),[2]);assert.equal(filtered.kodoTag.navigationRevision,undefined);assert.equal(filtered.kodoTag.forestRevision,undefined);assert.equal(filtered.kodoTag.respawns,undefined);assert.deepEqual(filtered.kodoTag.players.p.productionQueue,['own']);assert.equal(filtered.kodoTag.players.p.researching.key,'own');assert.equal(filtered.kodoTag.players.enemy.productionQueue,undefined);assert.equal(filtered.kodoTag.players.enemy.researching,undefined);assert.equal(filtered.kodoTag.players.enemy.researchLevels,undefined);assert.equal(state.kodoTag.kodos.length,1,'filtering does not alter simulation data');
});
test('exploration fog refreshes equal cells when mode bounds change',()=>{
 const scene=new T.Scene(),fog=createExplorationFog(scene),vision={size:2,bounds:{minX:-2,maxX:2,minZ:-2,maxZ:2},cells:'0212'};try{fog.update({options:{mode:'treetag'},treeTag:{vision}},0);const old=fog.uniforms.exploreMap.value;fog.update({options:{mode:'kodotag'},kodoTag:{vision:{...vision,bounds:{minX:-50,maxX:50,minZ:-40,maxZ:40}}}},1);assert.notEqual(fog.uniforms.exploreMap.value,old);assert.deepEqual(fog.uniforms.exploreBounds.value.toArray(),[-50,-40,100,80]);}finally{fog.dispose();}
});
test('Kodo cliff rendering responds to remembered changes at equal array length and hides remembered dead geometry',()=>{
 const scene=new T.Scene(),world=createKodoWorld({scene}),obstacle={id:'ridge',x:3,z:4,w:3,d:2,h:3,alive:true},s={options:{mode:'kodotag'},units:[],kodoTag:{map:{minX:-10,maxX:10,minZ:-10,maxZ:10,jail:{x:0,z:0,r:2},obstacles:[]},jail:{x:0,z:0},obstacles:[obstacle],trees:[],mines:[],buildings:[]}};try{world.update(s);const mesh=world.root.getObjectByName('kodo-native-cliffs'),m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.equal(m.elements[12],3);obstacle.x=7;world.update(s);mesh.getMatrixAt(0,m);assert.equal(m.elements[12],7);obstacle.alive=false;world.update(s);assert.equal(mesh.count,0);}finally{world.dispose();}
});
