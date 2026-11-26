import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_WORLD_ROUTE} from '../shared/ro-world-route.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {RO_ROUTE_PALETTES,roRouteSceneryParts} from '../src/ro-route-scenery.js';
import {createBonkWorld,bonkPaletteForMap} from '../src/bonk-world.js';

test('all twenty-five regional identities have bounded architecture, complete palettes and different silhouettes',()=>{
 const fingerprints=new Set();assert.deepEqual(Object.keys(RO_ROUTE_PALETTES).sort(),[...new Set(RO_WORLD_ROUTE.map(r=>r.style))].sort());
 for(const region of RO_WORLD_ROUTE){const p=RO_ROUTE_PALETTES[region.style],sets=[0,1,2,3].map(i=>roRouteSceneryParts(region.style,i,p));assert.ok(Object.isFrozen(p));assert.ok(sets.every(parts=>parts.length>10));for(const parts of sets)for(const part of parts){assert.ok(part.slice(0,7).every(Number.isFinite),region.key);assert.ok(part.slice(3,6).every(n=>n>0));assert.ok(Math.abs(part[0])+part[3]/2<9,region.key);assert.ok(Math.abs(part[2])+part[5]/2<10,region.key);}fingerprints.add(JSON.stringify(sets));}
 assert.equal(fingerprints.size,23);assert.equal(roRouteSceneryParts('unknown',0,{}),null);
});

test('route visuals keep the full boss footprint and main travel spine clear of tall scenery',()=>{
 const world=createBonkWorld({scene:new T.Scene()}),matrix=new T.Matrix4();
 try{for(const region of RO_WORLD_ROUTE){const map=generateBonkLevel(73,region.scene,region.habitat,region),state={options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[]}};world.update(state,1);const mesh=world.root.getObjectByName('bonk-landscape');assert.ok(mesh.count<=mesh.instanceMatrix.count);for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);const e=matrix.elements,x=e[12],z=e[14],h=Math.hypot(e[4],e[5],e[6]);if(h<1)continue;assert.ok(Math.hypot(x-region.bossArena.x,z-region.bossArena.z)>=region.bossArena.radius-1,region.key+': boss space');assert.ok(Math.abs(x)>7||Math.abs(z)>115,region.key+': central road');}}}finally{world.dispose();}
});

test('reusing a scene and seed for a different route region rebuilds its palette and side landmarks',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene});let previous=null;
 try{for(const key of ['prontera','payon-forest','juno','geffen','valhalla']){const region=RO_WORLD_ROUTE.find(r=>r.key===key),map=generateBonkLevel(74,region.scene,region.habitat,region);world.update({options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[]}},1);const floor=world.root.getObjectByName('bonk-organic-ground');assert.notEqual(floor,previous);previous=floor;assert.equal(scene.background.getHex(),bonkPaletteForMap(map).sky);assert.equal(world.root.children.filter(c=>c.userData.bonkTerrain).length,1);}
 const juno=RO_ROUTE_PALETTES['highland-observatory'],geffen=RO_ROUTE_PALETTES['mage-ruins'],pyramid=RO_ROUTE_PALETTES['sandstone-tomb'],gothic=RO_ROUTE_PALETTES.gothic;assert.notEqual(juno.soil,geffen.soil);assert.notEqual(pyramid.stone,gothic.stone);
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});
