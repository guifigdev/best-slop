import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoVisualPreference,RO_VISUAL_STORAGE_KEY} from '../src/ro-world-atlas.js';
import {roVisualPanelMarkup} from '../src/ro-visual-panel.js';
import {createBonkUI} from '../src/bonk-ui.js';

test('normal characters and tower characters share persistent visual presets and adjustable ray strength',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},calls=[];let state={options:{mode:'bonk',bonkDebug:false,bonkActivity:'adventure'}};const p=createRoVisualPreference({getState:()=>state,storage,view:{setRoVisualOptions:value=>calls.push(value)}});assert.equal(p.intensity,.2);assert.equal(p.apply(),true);assert.equal(p.apply(),false);assert.deepEqual(calls,[{preset:'pixel',intensity:.2,terrainStyle:'blocks',chamfer:.5,outlines:true}]);assert.equal(p.choose('pixel'),'pixel');assert.equal(p.setIntensity(1.25),true);assert.equal(p.setIntensity(99),false);assert.equal(p.setIntensity(NaN),false);assert.equal(p.choose('__proto__'),null);assert.ok(values.has(RO_VISUAL_STORAGE_KEY));const restored=createRoVisualPreference({getState:()=>({options:{mode:'bonk',bonkActivity:'tower'}}),storage,view:{setRoVisualOptions:value=>calls.push(value)}});assert.equal(restored.preset,'pixel');assert.equal(restored.intensity,1.25);assert.equal(restored.apply(),true);assert.deepEqual(calls.at(-1),{preset:'pixel',intensity:1.25,terrainStyle:'blocks',chamfer:.5,outlines:true});p.reset();assert.equal(p.preset,'pixel');state={options:{mode:'campaign'}};assert.equal(p.choose('clean'),null);assert.equal(p.setIntensity(.5),false);assert.equal(p.apply(),false);
});

test('visual panel exposes only the four requested styles, terrain geometry and range controls',()=>{
 const html=roVisualPanelMarkup({preset:'chartogne',intensity:1.2});assert.match(html,/role="dialog" aria-modal="true"/);assert.match(html,/<option value="chartogne" selected>Chartogne-Taillet/);assert.equal((html.match(/<option /g)||[]).length,6);assert.match(html,/data-bk-visual-terrain/);assert.match(html,/data-bk-visual-chamfer/);assert.doesNotMatch(html,/value="(?:solar|clean|cinematic|toon|ink)"/);assert.match(html,/data-bk-visual-intensity/);assert.match(html,/max="1.5"/);assert.match(html,/120%/);assert.match(html,/olhando para o sol entre as árvores/);assert.match(html,/desaparecem quando ele sai da tela/);assert.match(html,/não alteram dano/);assert.doesNotMatch(html,/GM|debug/);
});

test('visual dialog pauses movement and returns without consuming a level-up offer or changing combat commands',()=>{
 const sent=[],pauses=[],state={options:{mode:'bonk'},players:{p:1},units:[{id:1}],bonk:{stage:'playing',weapons:[{key:'basic'}]}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:value=>sent.push(value),onInventory:value=>pauses.push(value)});ui.action('visual');ui.action('skill',0);ui.action('dash');assert.equal(sent.length,0);ui.action('visual');ui.action('skill',0);assert.deepEqual(sent,[{type:'bkCast',key:'basic'}]);assert.deepEqual(pauses,[true,false]);state.bonk.stage='levelup';state.bonk.offer={id:1,choices:[{id:'weapon:fireball'}]};ui.action('visual');ui.choose('weapon:fireball');assert.equal(sent.length,1,'number shortcuts cannot consume an offer behind Visual');ui.action('visual');assert.equal(state.bonk.offer.id,1);assert.equal(sent.length,1);
});

test('blocked browser storage and corrupted preferences safely retain default visual options',()=>{
 const blocked={getItem(){throw Error('storage denied');}},bad={getItem:()=>JSON.stringify({version:1,preset:'<script>',intensity:-1})};for(const storage of[blocked,bad]){const p=createRoVisualPreference({getState:()=>({options:{mode:'bonk'}}),storage});assert.equal(p.preset,'pixel');assert.equal(p.intensity,.2);assert.doesNotThrow(()=>p.choose('clean'));}
});


test('shared visual preference applies and persists across other games and before a match starts',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},calls=[];let state=null;
 const p=createRoVisualPreference({getState:()=>state,allModes:true,storage,view:{setRoVisualOptions:value=>calls.push(value)}});
 assert.equal(p.choose('smooth'),'smooth');assert.equal(p.setIntensity(.9),true);
 for(const mode of ['campaign','tower','best','war','linewars','castlefight','treetag','warlock','kodotag','phasekiller','bloody','dungeon','bonk']){state={options:{mode}};assert.equal(p.preset,'smooth');assert.equal(p.choose('pixel'),'pixel');assert.equal(p.choose('smooth'),'smooth');}
 const restored=createRoVisualPreference({getState:()=>state,allModes:true,storage});assert.equal(restored.preset,'smooth');assert.equal(restored.intensity,.9);assert.equal(calls.at(-1).preset,'smooth');
});

test('removed style preferences migrate once while terrain and geometric chamfer persist independently of the shader',()=>{
 for(const [oldPreset,expected]of [['solar','pixel'],['clean','smooth'],['cinematic','smooth'],['pixel','pixel']]){
  let saved=JSON.stringify({version:1,preset:oldPreset,intensity:.8}),calls=[];const storage={getItem:()=>saved,setItem:(_,value)=>saved=value},p=createRoVisualPreference({storage,allModes:true,view:{setRoVisualOptions:value=>calls.push(value)}});
  assert.equal(p.preset,expected);assert.equal(p.chamfer,.5);assert.equal(p.chooseTerrain('faceted'),'faceted');assert.equal(p.setChamfer(.8),true);assert.equal(p.choose('retro'),'retro');assert.equal(p.setChamfer(2),false);assert.equal(p.chooseTerrain('__proto__'),null);
  const restored=createRoVisualPreference({storage,allModes:true,view:{setRoVisualOptions:value=>calls.push(value)}});assert.equal(restored.terrainStyle,'faceted');assert.equal(restored.chamfer,.8);assert.equal(restored.preset,'retro');restored.apply();assert.deepEqual(calls.at(-1),{preset:'retro',intensity:.8,terrainStyle:'faceted',chamfer:.8,outlines:true});
 }
});

test('new installs use the approved pixel and ink combination at twenty percent while existing strength stays untouched',()=>{
 let saved=null;const storage={getItem:()=>saved,setItem:(_,value)=>saved=value},calls=[],p=createRoVisualPreference({storage,allModes:true,view:{setRoVisualOptions:value=>calls.push(value)}});assert.equal(p.preset,'pixel');assert.equal(p.intensity,.2);assert.equal(p.outlines,true);p.apply();assert.deepEqual(calls.at(-1),{preset:'pixel',intensity:.2,terrainStyle:'blocks',chamfer:.5,outlines:true});
 assert.equal(p.setOutlines(false),true);assert.equal(p.choose('chartogne'),'chartogne');const restored=createRoVisualPreference({storage,allModes:true});assert.equal(restored.outlines,false);assert.equal(restored.setOutlines('false'),false);assert.equal(restored.outlines,false);
 saved=JSON.stringify({version:1,preset:'pixel',intensity:1.15});const old=createRoVisualPreference({storage,allModes:true});assert.equal(old.intensity,1.15);assert.equal(old.outlines,true);const panel=roVisualPanelMarkup();assert.match(panel,/data-bk-visual-outlines checked/);assert.match(panel,/Contornos de tinta/);assert.match(panel,/data-ro-ray-value>20%/);
});
