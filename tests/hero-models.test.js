import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHeroModel,HERO_VISUALS} from '../src/hero-models.js';
import {animalPortrait as portrait} from '../src/art.js';
import {armyPortrait,ARMY_PORTRAIT_KINDS} from '../src/army-art.js';
import {LINE_UNITS} from '../shared/line-units.js';

function model(kind){const parts=[],body={};const descriptor=buildHeroModel(kind,body,(parent,...part)=>{assert.equal(parent,body);parts.push(part);});return{descriptor,parts};}
test('six animal heroes have independent finite voxel bodies and suitable limb counts',()=>{
 for(const kind of ['knight','mage','ranger','turtle','owl','raccoon']){const {descriptor,parts}=model(kind);assert.ok(parts.length>=15,kind);assert.equal(descriptor.legs.length,['mage','owl'].includes(kind)?2:4,kind);assert.equal(descriptor.fur,HERO_VISUALS[kind].fur);assert.ok(descriptor.height>descriptor.eyeLine);for(const [x,y,z,w,h,d,color]of parts){assert.ok([x,y,z,w,h,d,color].every(Number.isFinite),kind);assert.ok(w>0&&h>0&&d>0,kind);}for(const wing of descriptor.wings){assert.ok([-1,1].includes(wing.side));assert.ok(wing.parts.every(part=>part.every(Number.isFinite)));}}
 assert.equal(buildHeroModel('griffin',{},()=>{}),null);
});
test('Vidar is a brown upright owl with facial discs and beak rather than a purple capybara muzzle',()=>{
 const {descriptor,parts}=model('owl');assert.equal(descriptor.fur,0xa68a65);assert.equal(descriptor.wings.length,2);assert.equal(descriptor.legs.length,2);
 const facialDiscs=parts.filter(([x,y,z,w,h,d,color])=>color===HERO_VISUALS.owl.face&&w>.4&&h>.45&&d<.1);assert.equal(facialDiscs.length,2);
 assert.ok(parts.some(([x,y,z,w,h,d,color])=>x===0&&color===HERO_VISUALS.owl.nose&&h>w));
 assert.ok(Math.max(...parts.map(([x,y,z,w,h,d])=>z+d/2))<1,'owl has a short beak instead of the mammalian snout extending past z=1');
 const capy=model('knight');assert.ok(Math.max(...capy.parts.map(([x,y,z,w,h,d])=>z+d/2))>1.4);
 assert.ok(parts.filter(part=>part[6]===descriptor.fur).every(part=>part[5]<1),'owl feathers form a compact upright body');
});
test('animal NPC portraits retain their 3D palette after the playable hero redesign',()=>{
 for(const [kind,visual]of Object.entries(HERO_VISUALS)){const svg=portrait(kind),hex=value=>'#'+value.toString(16).padStart(6,'0');assert.ok(svg.includes(hex(visual.fur)),kind);assert.ok(svg.includes(hex(visual.cloth)),kind);assert.equal(svg.includes('undefined'),false);}
 assert.equal(Object.isFrozen(HERO_VISUALS.owl),true);
});
test('every Line Wars recipe has an explicit animal preview, including flying mythical troops',()=>{
 for(const recipe of Object.values(LINE_UNITS)){assert.ok(ARMY_PORTRAIT_KINDS.includes(recipe.kind),recipe.kind);const svg=armyPortrait(recipe.kind);assert.ok(svg.startsWith('<svg'));assert.ok(svg.includes('aria-hidden="true"'));assert.equal(svg.includes('undefined'),false);assert.equal(svg.includes('<image'),false);}
 assert.notEqual(armyPortrait('griffin'),armyPortrait('frostwyrm'));assert.notEqual(armyPortrait('goblin'),armyPortrait('rhino'));assert.equal(armyPortrait('<script>'),armyPortrait('missing-kind'));
});
