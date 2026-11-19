import test from 'node:test';
import assert from 'node:assert/strict';
import {CASTLE_UNITS,CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {castleUnitVisual,castleUnitPortrait,castleUnitModelKey,castleUnitAnimation,castleBasicProjectile,buildCastleUnitModel} from '../src/castle-unit-art.js';

test('every native Castle Fight troop has finite original voxel geometry and a matching safe portrait',()=>{
 const before=JSON.stringify(CASTLE_UNITS),races=new Map(Object.values(CASTLE_BUILDINGS).filter(b=>b.unit).map(b=>[b.unit,b.race]));
 for(const [key,unit]of Object.entries(CASTLE_UNITS)){
  const visual=castleUnitVisual(key);assert.equal(visual.key,key);assert.equal(visual.name,unit.name.trim());assert.equal(visual.race,races.get(key));assert.ok(visual.parts.length>=8,key);
  const parts=[...visual.parts,...visual.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...visual.wings.flatMap(w=>w.parts),...visual.rotors.flatMap(r=>r.parts)];
  for(const part of parts){assert.ok(part.length===7&&part.every(Number.isFinite),key);assert.ok(part[3]>0&&part[4]>0&&part[5]>0,key);}
  for(const joint of [...visual.wings,...visual.rotors])assert.ok(joint.pivot.length===3&&joint.pivot.every(Number.isFinite));
  const svg=castleUnitPortrait(key);assert.ok(svg.startsWith('<svg '));assert.match(svg,/viewBox="0 0 96 80"/);assert.match(svg,/<polygon /);assert.doesNotMatch(svg,/<script|<image|href=|NaN|undefined|Infinity/i);assert.equal(castleUnitPortrait({unitKey:key}),svg);
 }
 assert.equal(JSON.stringify(CASTLE_UNITS),before,'visual generation cannot change native combat data');
 assert.equal(castleUnitVisual('__proto__'),null);assert.equal(castleUnitPortrait('<script>'), '');
});

test('aircraft and armored vehicles cannot inherit animal legs, silhouettes or shared bat caches',()=>{
 for(const key of ['h06Q','h06R']){const v=castleUnitVisual(key);assert.equal(v.family,'aircraft');assert.equal(v.rotors.length,2);assert.equal(v.legs.length,0);assert.equal(v.vehicle,true);assert.equal(v.projectileKind,'bullet');}
 for(const key of ['h06T','h06S','h098','h099']){const v=castleUnitVisual(key);assert.equal(v.family,'tank');assert.equal(v.legs.length,0);assert.equal(v.vehicle,true);}
 assert.notEqual(castleUnitModelKey({castleUnit:true,unitKey:'h06Q',kind:'bat'}),castleUnitModelKey({castleUnit:true,unitKey:'h06R',kind:'bat'}));
 assert.equal(castleUnitModelKey({hero:'owl',kind:'owl'}),'owl');assert.equal(castleUnitModelKey({kind:'bat'}),'bat');
 assert.notEqual(castleUnitPortrait('h06Q'),castleUnitPortrait('h06R'),'bomber payload differs from aircraft guns');
});

test('native names select readable equipment and bodies instead of race-wide animal substitutes',()=>{
 for(const [key,family,legs]of [['hfoo','warrior',2],['hrif','rifleman',2],['n022','archer',2],['u005','caster',2],['h01U','vampire',2],['n00B','zombie',2],['n008','demon',2],['n00S','naga',0],['n01X','golem',2],['n01P','hydra',4],['n007','dragon-turtle',4],['n001','winged-beast',4]]){const v=castleUnitVisual(key);assert.equal(v.family,family,key);assert.equal(v.legs.length,legs,key);}
 const emitted=[],body={};const profile=buildCastleUnitModel({unitKey:'h06Q'},body,(parent,...part)=>{assert.equal(parent,body);emitted.push(part);});assert.deepEqual(emitted,profile.parts);assert.equal(buildCastleUnitModel({unitKey:'missing'},body,()=>assert.fail()),null);
});

test('rotors advance in eight baked poses per second while tank bodies stay grounded',()=>{
 const air=castleUnitVisual('h06Q'),tank=castleUnitVisual('h06T');assert.equal(castleUnitAnimation(air,.13).rotor,castleUnitAnimation(air,.24).rotor);assert.notEqual(castleUnitAnimation(air,.24).rotor,castleUnitAnimation(air,.25).rotor);
 for(const t of [0,.1,.25,1,8.5]){const pose=castleUnitAnimation(tank,t,{moving:true});assert.equal(pose.bodyY,0);assert.equal(pose.tilt,0);}
});

test('only Castle basic shots receive weapon cosmetics, preserving explicit siege and item spells',()=>{
 const basic={basicAttack:true,castle:true,projectileKind:'sonic'},air={castleUnit:true,unitKey:'h06Q'};
 assert.equal(castleBasicProjectile(basic,air),'bullet');assert.equal(castleBasicProjectile({...basic,projectileKind:'shell'},{castleUnit:true,unitKey:'h06T'}),'siege');
 assert.equal(castleBasicProjectile({...basic,projectileKind:'siege'},air),null);assert.equal(castleBasicProjectile({...basic,skill:'blaststaff'},air),null);assert.equal(castleBasicProjectile({castle:true,projectileKind:'arcane'},air),null);assert.equal(castleBasicProjectile(basic,{kind:'bat'}),null);
});
