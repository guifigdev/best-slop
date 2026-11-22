import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {CASTLE_RACES,CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {castleKeepSpec,createCastleKeepArt} from '../src/castle-keep-art.js';
import {buildingModelSpec} from '../src/castle-building-models.js';

test('all ten keeps are taller landmark castles with complete defensive architecture inside the unchanged footprint',()=>{
 const shapes=new Set();for(const race of Object.keys(CASTLE_RACES)){
  const spec=castleKeepSpec({w:3,d:5,race,team:1});assert.ok(Object.isFrozen(spec)&&Object.isFrozen(spec.boxes));assert.ok(spec.height>=5&&spec.height<5.7);assert.ok(spec.boxes.length<500);
  shapes.add(JSON.stringify(spec.boxes.map(({x,y,z,w,h,d})=>[x,y,z,w,h,d])));
  for(const b of spec.boxes){assert.ok([b.x,b.y,b.z,b.w,b.h,b.d,b.color].every(Number.isFinite));assert.ok(b.w>0&&b.h>0&&b.d>0);assert.ok(Math.abs(b.x)+b.w/2<=1.5+1e-6,race+' width');assert.ok(Math.abs(b.z)+b.d/2<=2.5+1e-6,race+' depth');assert.ok(b.y-b.h/2>=0);}
  for(const part of ['great-hall','gate-recess','gate-arch','gate-voussoir','portcullis','ashlar-brick','tower-crenel','sloped-roof','royal-standard'])assert.ok(spec.boxes.some(b=>b.part===part),race+' lacks '+part);
  assert.equal(spec,castleKeepSpec({w:3,d:5,race,team:1}));
 }assert.equal(shapes.size,10,'races retain distinct architectural silhouettes');
});

test('heraldry identifies teams without recoloring every masonry block',()=>{
 const a=castleKeepSpec({race:'human',team:1}),b=castleKeepSpec({race:'human',team:2});assert.equal(a.boxes.find(b=>b.part==='ashlar-brick').color,b.boxes.find(b=>b.part==='ashlar-brick').color);assert.notEqual(a.boxes.find(b=>b.part==='royal-standard').color,b.boxes.find(b=>b.part==='royal-standard').color);
});

test('keep uses one cached shadow-casting mesh with bounded triangles and releases borrowed geometry only after the last instance',()=>{
 const a=createCastleKeepArt({race:'human'}),b=createCastleKeepArt({race:'human'}),c=createCastleKeepArt({race:'orc'});let geometry=0,material=0;a.geometry.addEventListener('dispose',()=>geometry++);a.material.addEventListener('dispose',()=>material++);assert.equal(a.geometry,b.geometry);assert.notEqual(a.geometry,c.geometry);assert.equal(a.material,c.material);assert.ok(a.castShadow&&a.receiveShadow);assert.equal(a.children.length,0);assert.ok(a.geometry.attributes.position.count/3<6000);assert.ok(a.geometry.boundingSphere);assert.equal(a.geometry.groups.length,0);a.userData.dispose();assert.equal(geometry,0);b.userData.dispose();assert.equal(geometry,1);assert.equal(material,0);c.userData.dispose();assert.equal(material,1);a.userData.dispose();assert.equal(material,1);
});

test('production facades add actual window frames, masonry and industrial vents rather than a new cube texture',()=>{
 const all=Object.keys(CASTLE_BUILDINGS).map(key=>buildingModelSpec(key)),domestic=all.filter(s=>s.boxes.some(b=>b.part==='window-frame')),mechanical=all.filter(s=>s.boxes.some(b=>b.part==='vent-slat'));assert.ok(domestic.length>=15);assert.ok(mechanical.length>=7);for(const spec of domestic){assert.ok(spec.boxes.some(b=>b.part==='window-glass'));assert.ok(spec.boxes.some(b=>b.part==='window-mullion'));}assert.ok(all.every(s=>s.boxes.length<=64));
});
