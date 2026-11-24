import test from 'node:test';
import assert from 'node:assert/strict';
import {createKodoUI} from '../src/kodo-ui.js';
import {createLegacyUI} from '../src/legacy-ui.js';
import {createCastleUI} from '../src/castle-ui.js';

function environment(){
 const events=[],old=globalThis.document;
 globalThis.document={getElementById:()=>null,defaultView:{CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}}},dispatchEvent:event=>events.push(event)};
 return {events,restore(){if(old===undefined)delete globalThis.document;else globalThis.document=old;}};
}
const view={setKodoBuild(){},setLegacyBuild(){},setCastleBuild(){},setInteraction(){},setLegacyUnitSelection(){},setLegacySelection(){},setKodoSelection(){},setInspected(){}};
test('Kodo build shortcut requests the construction drawer while incompatible workers retain their commands',()=>{
 const env=environment();try{
  const hero={id:1,owner:'p',alive:true,kodoTagCharacter:'runner'},worker={id:2,owner:'p',alive:true,kodoTagUnit:true,kodoTagWorker:true,unitKey:'hC19'},state={options:{mode:'kodotag'},players:{p:1},units:[hero,worker],kodoTag:{buildings:[]}},messages=[];
  const ui=createKodoUI({getState:()=>state,getOwner:()=> 'p',send:()=>true,view,toast:m=>messages.push(m)});
  ui.shortcut('build');assert.deepEqual(env.events.map(e=>[e.type,e.detail.page]),[['hud-open-panel','build']]);assert.equal(ui.isBuilding(),false);
  ui.point({point:{x:0,z:0},unit:worker,button:0});ui.shortcut('build');assert.equal(env.events.length,1);assert.match(messages.at(-1),/não pode construir/);
  assert.equal(ui.openPage('build'),true);assert.equal(ui.hotkeys().B,'command:build');assert.equal(env.events.length,1);assert.equal(ui.openPage('invalid'),false);
 }finally{env.restore();}
});
test('Tree Tag and Castle Fight expose build pages and notify the shared drawer from shortcuts',()=>{
 const env=environment();try{
  const hero={id:1,owner:'p',alive:true,treeTagCharacter:'ent',treeTagRole:'ent'},state={options:{mode:'treetag'},players:{p:1},units:[hero],treeTag:{buildings:[]}},base={getState:()=>state,getOwner:()=> 'p',send:()=>true,view,toast(){}};
  const legacy=createLegacyUI(base);assert.equal(legacy.openPage('build'),true);assert.equal(legacy.openPage('inventory'),true);assert.equal(legacy.openPage('invalid'),false);
  legacy.shortcut('build');assert.equal(env.events.at(-1)?.detail.page,'build');
  const castle=createCastleUI(base);assert.equal(castle.openPage('build'),true);assert.equal(castle.openPage('invalid'),false);castle.shortcut('build');assert.equal(env.events.at(-1)?.type,'hud-open-panel');assert.equal(env.events.at(-1)?.detail.page,'build');
 }finally{env.restore();}
});
