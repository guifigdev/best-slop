import test from 'node:test';
import assert from 'node:assert/strict';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {CASTLE_SUPPORT_BUILDINGS} from '../shared/castle-support-data.js';
import {castleBuildingCard,castleBuildingTiming,supportDescription} from '../src/castle-ui.js';
import {buildingModelSpec,castleBuildingPortrait,createCastleBuildingArt} from '../src/castle-building-art.js';

test('every completed support card explains its real effect without promising a nonexistent production cycle',()=>{
 assert.equal(Object.keys(CASTLE_SUPPORT_BUILDINGS).length,31);
 for(const key of Object.keys(CASTLE_SUPPORT_BUILDINGS)){
  const b=CASTLE_BUILDINGS[key];assert.ok(b,key);assert.equal(b.playable,true,key);assert.ok(b.castleEffect.description.length>20,key);
  const card=castleBuildingCard(key,b,100000);assert.equal(supportDescription(b),b.castleEffect.description,key);
  assert.doesNotMatch(card,/indispon[ií]vel|ainda n[aã]o implementado|produ[cç][aã]o 0s/i,key);
  assert.match(card,/efeito automático após a conclusão/);assert.equal(castleBuildingTiming(b).includes('produção'),false);
 }
 const producer=Object.values(CASTLE_BUILDINGS).find(b=>b.unit);assert.match(castleBuildingTiming(producer),/produção \d/);
});

test('support inspection escapes descriptions and keeps real resource restrictions',()=>{
 const original=CASTLE_BUILDINGS.north_h047,b={...original,castleEffect:{...original.castleEffect,description:'Gelo <script>ruim</script> & neve'}},card=castleBuildingCard(b.key,b,100000);
 assert.match(card,/Gelo &lt;script&gt;ruim&lt;\/script&gt; &amp; neve/);assert.doesNotMatch(card,/<script>/);
 const state={phase:'wave',castleFight:{finished:false,players:{p:{race:b.race,legendarySlots:1}},buildings:[]}},hero={owner:'p',alive:true,castleBuilder:true,gold:0,lumber:0};
 const unavailable=castleBuildingCard(b.key,b,0,{state,hero});assert.match(unavailable,/disabled/);assert.match(unavailable,/Faltam/);assert.doesNotMatch(unavailable,/nesta versão/);
});

test('Chilling Mushroom has a broad icy cap, visible gills, icicles and a smaller fungus cluster',()=>{
 const spec=buildingModelSpec('north_h047'),parts=new Set(spec.boxes.map(b=>b.part));assert.equal(spec.family,'mushroom');
 for(const part of ['stem','mushroom-cap','frost-gills','icicle','small-stem','small-cap','frost-spore'])assert.ok(parts.has(part),part);
 const cap=spec.boxes.filter(b=>b.part==='mushroom-cap').sort((a,b)=>b.w-a.w)[0],stem=spec.boxes.find(b=>b.part==='stem');assert.ok(cap.w>stem.w*3);assert.ok(cap.y>stem.y);
 assert.equal(CASTLE_BUILDINGS.north_h047.visualProfile.label,'Defesa antiaérea glacial');
});

test('new support landmarks depict their functions through architecture rather than generic pedestals',()=>{
 const details={human_h010:'horn-bell',human_h05G:'heroic-figure',naga_h00N:'wave-crest',naga_h00I:'conversion-focus',chaos_h05I:'ruined-masonry',chaos_h01M:'void-core',chaos_h01F:'magma-channel',elf_h059:'scales-pan',elf_h00Z:'restoration-sigil',undead_h01Q:'decay-vent',orc_h02N:'serpent-fang',north_h048:'ice-reservoir',north_h03O:'world-freezer-core',corrupted_h04T:'eye-pupil',corrupted_h04R:'tentacle',nightelf_h07H:'protective-leaves',nightelf_h07I:'star-ray',mech_h06J:'shield-point',mech_h05R:'shield-arc'};
 for(const [key,part]of Object.entries(details))assert.ok(buildingModelSpec(key).boxes.some(box=>box.part===part),key+' '+part);
});

test('support portraits and world meshes share one finite model and release shared geometry after the last owner',()=>{
 for(const key of Object.keys(CASTLE_SUPPORT_BUILDINGS)){
  const spec=buildingModelSpec(key),a=createCastleBuildingArt(key),b=createCastleBuildingArt(key);let disposed=0;
  try{assert.equal(a.geometry,b.geometry);a.geometry.addEventListener('dispose',()=>disposed++);assert.equal(a.geometry.attributes.position.count,spec.boxes.length*36);assert.equal((castleBuildingPortrait(key).match(/<polygon /g)||[]).length,spec.boxes.length*3);assert.ok(spec.boxes.length<=64);assert.ok(Math.abs(a.geometry.boundingBox.max.y-spec.height)<1e-5);for(const box of spec.boxes){assert.ok(Math.abs(box.x)+box.w/2<=spec.footprint.w/2+1e-6);assert.ok(Math.abs(box.z)+box.d/2<=spec.footprint.d/2+1e-6);}}
  finally{a.userData.dispose();assert.equal(disposed,0);b.userData.dispose();assert.equal(disposed,1);}
 }
});
