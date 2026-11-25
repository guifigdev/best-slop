import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {generateBonkLevel,bonkBlocked,bonkHeightAt} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';
import {roTownServices} from '../shared/ro-town-services.js';
import {RO_TRADE_HUBS} from '../shared/ro-region-services.js';
import {createRoCaveArt} from '../src/ro-cave-art.js';
import {roTownVillageParts} from '../src/ro-town-village-art.js';

const level=key=>{const r=roWorldRegion(key,617);return generateBonkLevel(617,r.scene,r.habitat,r);};
test('trade villages are restricted to seven hubs with scattered accessible services and solid house footprints',()=>{
 assert.equal(Object.keys(RO_TRADE_HUBS).length,7);
 for(const key of ['payon-cave','thor-volcano','glast-heim','ice-cavern']){const map=level(key);assert.deepEqual(roTownServices(map),[]);assert.equal(map.town,undefined);}
 const map=level('prontera'),services=roTownServices(map);assert.equal(services.length,5);
 for(const a of services){assert.equal(bonkBlocked(map,a,.3),false,a.type);for(const b of services)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>5);}
 const houses=map.obstacles.filter(o=>o.type==='town-building');assert.equal(houses.length,4);assert.ok(houses.every(h=>bonkBlocked(map,h,.3)));
 const parts=roTownVillageParts(map,{stone:0x888888,wood:0x665544,dark:0x333333});assert.ok(parts.length>1000&&parts.length<2450);
});
test('cave walls extend beyond the view and reuse six local lights near wall torches and volcanic fire sources',()=>{
 for(const key of ['payon-cave','thor-volcano']){const map=level(key),parent=new T.Group(),art=createRoCaveArt({parent});
  try{art.update(map,(x,z)=>bonkHeightAt(map,x,z),1);const mesh=parent.getObjectByName('ro-cave-walls-and-vault');assert.ok(mesh);const matrix=new T.Matrix4();mesh.getMatrixAt(1,matrix);const position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();matrix.decompose(position,rotation,scale);assert.ok(scale.y>80,'no visible short rock cap');
   const camera=new T.PerspectiveCamera();camera.position.set(0,25,20);const hero=key==='thor-volcano'?map.decorations.find(d=>d.domain==='volcano'):map.spawn;art.cutaway(camera,hero);
   assert.equal(art.stats().activeLights,6);assert.equal(art.stats().wallTorches,40);assert.equal(parent.children.filter(c=>c.isPointLight).length,6);
   if(key==='thor-volcano')assert.ok(art.fireSources().some(p=>Math.hypot(p.x-hero.x,p.z-hero.z)<.01),'visible volcano flames actually illuminate and scatter');
   const children=parent.children.slice();art.update(map,(x,z)=>bonkHeightAt(map,x,z),2);assert.deepEqual(parent.children,children);
  }finally{art.dispose();}assert.equal(parent.children.length,0);
 }
});
