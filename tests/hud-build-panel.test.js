import test from 'node:test';
import assert from 'node:assert/strict';
import {createKodoUI} from '../src/kodo-ui.js';
import {createLegacyUI} from '../src/legacy-ui.js';
import {createCastleUI,castleBuildCommand,castleBuildCommandMarkup} from '../src/castle-ui.js';
import {useShortcuts} from '../src/shortcuts.js';

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
  state.options.mode='castlefight';hero.hero='knight';const castle=createCastleUI(base);assert.equal(castle.openPage('build'),true);assert.equal(castle.openPage('invalid'),false);castle.shortcut('build');assert.equal(env.events.at(-1)?.type,'hud-open-panel');assert.equal(env.events.at(-1)?.detail.page,'build');
 }finally{env.restore();}
});

test('Castle build is a real builder command with a hammer, not a spell on troops or dead characters',()=>{
 const hero={id:1,owner:'p',hero:'knight',alive:true},state={options:{mode:'castlefight'},phase:'preparation',players:{p:1},units:[hero]};
 assert.equal(castleBuildCommand(state,hero).hotkey,'B');const html=castleBuildCommandMarkup(state,hero);assert.match(html,/data-cf-action="build"/);assert.match(html,/Construir/);assert.match(html,/tag-command-icon/);assert.doesNotMatch(html,/cooldown|mana|data-slot/);
 for(const unit of [{...hero,castleUnit:true},{...hero,alive:false},{...hero,id:2},{...hero,hero:'unknown'}]){assert.equal(castleBuildCommand(state,unit),null);assert.equal(castleBuildCommandMarkup(state,unit),'');}
});
test('the Castle B command opens its catalog without issuing movement, spending mana or entering cast mode',()=>{
 const env=environment();try{
  const hero={id:1,owner:'p',hero:'knight',alive:true,mana:0},state={options:{mode:'castlefight'},players:{p:1},units:[hero]},sent=[],listeners=new Map(),ui=createCastleUI({getState:()=>state,getOwner:()=> 'p',send:c=>sent.push(c),view,toast(){}}),before=JSON.stringify(state);
  const shortcuts=useShortcuts({target:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)},context:()=>({playing:true,legacyKeys:ui.hotkeys()}),onAction:(action,value)=>ui.shortcut(action,value)});
  listeners.get('keydown')({key:'b',code:'KeyB',preventDefault(){}});assert.deepEqual(env.events.map(e=>e.detail.page),['build']);assert.deepEqual(sent,[]);assert.equal(ui.isBuilding(),false);assert.equal(JSON.stringify(state),before);shortcuts.destroy();
 }finally{env.restore();}
});
