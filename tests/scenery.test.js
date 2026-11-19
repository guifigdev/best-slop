import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {SCENERY_ASSETS,generateScenery,sceneryObstacles} from '../shared/scenery.js';
import {createScenery} from '../src/scenery.js';
import {defaultLineWarsMap} from '../shared/maps/line-wars-map.js';
import {mapTileAt} from '../shared/voxel-map.js';
import {blocked,moveUnit} from '../shared/field.js';
import {ARENA_BOUNDS,ARENA_TILE_HALF,ARENA_ISLAND_SIZE} from '../shared/arena-size.js';

test('survival scenery is deterministic, varied and uses the playable area while respecting spawn and NPC clear areas',()=>{const a=generateScenery({seed:42}),b=generateScenery({seed:42}),c=generateScenery({seed:43});assert.deepEqual(a,b);assert.notDeepEqual(a,c);assert.equal(a.length,16);assert.ok(new Set(a.map(p=>p.kind)).size>=3);for(const p of a){assert.ok(Math.hypot(p.x,p.z)>4.2);const radius=Math.max(SCENERY_ASSETS[p.kind].collider.w,SCENERY_ASSETS[p.kind].collider.d)*p.scale/2;assert.ok(Math.max(Math.abs(p.x),Math.abs(p.z))+radius+1<18.0001);assert.ok(Math.hypot(p.x,p.z)+radius*Math.SQRT2+1<20.5001);assert.ok(!blocked({x:0,z:2},sceneryObstacles([p]),1.5));}});
test('caller keepClear zones are honored for reusable Castle layouts',()=>{const keepClear=[{x:6,z:4,r:3},{x:-5,z:4,w:5,d:5}],props=generateScenery({seed:71,mode:'castle',keepClear});for(const p of props){assert.ok(Math.hypot(p.x-6,p.z-4)>3.5);assert.ok(!(Math.abs(p.x+5)<3&&Math.abs(p.z-4)<3));}});
test('voxel asset dimensions and authoritative rotated footprints match',()=>{for(const [kind,asset]of Object.entries(SCENERY_ASSETS)){assert.ok(asset.parts.length>=4);for(const part of asset.parts){assert.equal(part.length,7);assert.ok(part.slice(3,6).every(n=>n>0));}const descriptor={id:kind,kind,x:1,z:2,scale:1.2,rotation:Math.PI/2},[collider]=sceneryObstacles([descriptor],{x:100,z:50});assert.equal(collider.x,101);assert.equal(collider.z,52);assert.equal(collider.w,asset.collider.d*1.2);assert.equal(collider.d,asset.collider.w*1.2);assert.equal(collider.type,'scenery');assert.equal(collider.kind,kind);assert.equal(collider.map,true);assert.ok(collider.id.endsWith('@100,50'));}});
test('scenery is a real movement obstruction rather than a cosmetic overlap',()=>{const obstacles=sceneryObstacles([{id:'rock',kind:'boulder',x:0,z:0,scale:1,rotation:0}]),u={x:-3,z:0,size:1};moveUnit({bounds:18,options:{mode:'tower'},obstacles},u,{x:3,z:0});assert.ok(u.x< -1);assert.equal(blocked(u,obstacles),false);});
test('Line Wars vegetation stays on walkable margins and clears both invasion centerlines',()=>{const map=defaultLineWarsMap(),props=generateScenery({seed:map.seed,mode:'linewars',map});assert.equal(props.length,26);for(const p of props){assert.equal(mapTileAt(map,p.x,p.z).walkable,1);assert.notEqual(mapTileAt(map,p.x,p.z).palette.id,'road');for(const b of map.markers.buildings)assert.ok(Math.hypot(p.x-b.x,p.z-b.z)>2);const obstacles=sceneryObstacles([p]);for(const route of map.markers.routes)for(let z=-43;z<=26;z++)assert.equal(blocked({x:route.spawn.x,z},obstacles,1.6),false);}});
test('scene renderer batches asset voxels and reuses the unchanged layout without extra meshes',()=>{const scene=new T.Scene(),renderer=createScenery({scene}),props=generateScenery({seed:42});renderer.update(props);const root=scene.children[0],mesh=root.children[0];assert.equal(root.children.length,1);assert.equal(mesh.isInstancedMesh,true);assert.equal(mesh.count,props.reduce((sum,p)=>sum+SCENERY_ASSETS[p.kind].parts.length,0));renderer.update(props);assert.equal(root.children[0],mesh);renderer.update(props,{visible:false});assert.equal(root.visible,false);renderer.update(props);assert.equal(root.visible,true);renderer.dispose();renderer.dispose();assert.equal(scene.children.length,0);});
test('the expanded Survival arena, ground and island remain nested consistently',()=>{assert.equal(ARENA_BOUNDS,18);assert.ok(ARENA_TILE_HALF>=ARENA_BOUNDS+2);assert.ok(ARENA_ISLAND_SIZE/2>ARENA_TILE_HALF);});

test('many seeds cover the outer battlefield and all quadrants instead of repeating a small central ring',()=>{
 const layouts=Array.from({length:100},(_,i)=>generateScenery({seed:i+1,count:10})),points=layouts.flat();assert.ok(layouts.every(p=>p.length===10));
 assert.ok(points.filter(p=>Math.hypot(p.x,p.z)>9).length>points.length*.65);
 for(const axis of ['x','z']){assert.ok(Math.min(...points.map(p=>p[axis]))<-14);assert.ok(Math.max(...points.map(p=>p[axis]))>14);}
 for(const sx of [-1,1])for(const sz of [-1,1])assert.ok(points.some(p=>Math.sign(p.x)===sx&&Math.sign(p.z)===sz&&Math.hypot(p.x,p.z)>12));
 for(const layout of layouts)for(let i=0;i<layout.length;i++)for(let j=i+1;j<layout.length;j++)assert.ok(Math.hypot(layout[i].x-layout[j].x,layout[i].z-layout[j].z)>=3.2498);
});
