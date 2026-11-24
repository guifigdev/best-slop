import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clampHudPosition,normalizeHudPosition,restoreHudPosition,createHudLayoutStore,installHudLayout,hudMinimapAvailable} from '../src/hud-layout.js';

const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),values};};
test('saved positions scale with viewport travel and clamp oversized panels to reachable edges',()=>{
 const bounds={left:10,top:48,width:900,height:600},size={width:200,height:100},p={left:350,top:290};
 const normalized=normalizeHudPosition(p,size,bounds);assert.deepEqual(restoreHudPosition(normalized,size,bounds),p);
 const narrow={left:0,top:44,width:320,height:430},restored=restoreHudPosition(normalized,size,narrow);
 assert.ok(restored.left>=6&&restored.left+size.width<=314);assert.ok(restored.top>=50&&restored.top+size.height<=468);
 assert.deepEqual(clampHudPosition({left:-100,top:900},{width:1000,height:800},narrow),{left:6,top:50});
});
test('layout persistence isolates accounts, modes and orientations; reset affects the current account',()=>{
 const storage=memory(),a=createHudLayoutStore(storage,'alice'),b=createHudLayoutStore(storage,'bob');
 a.set('kodotag:portrait','skills',{x:.8,y:.2});a.set('kodotag:landscape','skills',{x:.1,y:.9});
 assert.deepEqual(createHudLayoutStore(storage,'alice').get('kodotag:portrait','skills'),{x:.8,y:.2});
 assert.deepEqual(a.get('kodotag:landscape','skills'),{x:.1,y:.9});assert.equal(a.get('bonk:portrait','skills'),null);assert.equal(b.get('kodotag:portrait','skills'),null);
 b.set('kodotag:portrait','skills',{x:.3,y:.4});a.reset();assert.equal(a.get('kodotag:portrait','skills'),null);assert.deepEqual(createHudLayoutStore(storage,'bob').get('kodotag:portrait','skills'),{x:.3,y:.4});
});
test('retired character, narrator and header positions migrate without resetting other saved bars',()=>{
 const storage=memory(),key='custom-hero:hud-layout:v1:alice',obsolete=Object.fromEntries(['hero','ro-player','ro-vitals','resources','narrator'].map(id=>[id,{x:.8,y:.7}]));
 storage.setItem(key,JSON.stringify({version:1,layouts:{'kodotag:portrait':{...obsolete,skills:{x:.2,y:.4}},'bonk:desktop':{...obsolete,bag:{x:.6,y:.3}}}}));
 const store=createHudLayoutStore(storage,'alice'),saved=JSON.parse(storage.getItem(key));
 for(const id of Object.keys(obsolete)){assert.equal(store.get('kodotag:portrait',id),null);assert.equal(saved.layouts['bonk:desktop'][id],undefined);}
 assert.deepEqual(store.get('kodotag:portrait','skills'),{x:.2,y:.4});assert.deepEqual(store.get('bonk:desktop','bag'),{x:.6,y:.3});
});
test('invalid or unavailable storage never prevents a player from arranging the HUD',()=>{
 for(const getItem of [()=>'{broken',()=>JSON.stringify({version:99,layouts:{}}),()=>JSON.stringify({version:1,layouts:{scope:'invalid'}})]){
  const store=createHudLayoutStore({getItem,setItem(){throw new Error('quota');}});assert.equal(store.get('scope','skills'),null);assert.equal(store.set('scope','skills',{x:.5,y:.5}),false);assert.deepEqual(store.get('scope','skills'),{x:.5,y:.5});
 }
});

// A geometry/event DOM double exercises the real pointer and keyboard controller.
class Surface {
 constructor(rect={left:0,top:0,width:200,height:100}){this.rect=rect;this.nodeName='DIV';this.textContent='HUD';this.children=[];this.dataset={};this.isConnected=true;this.handlers=new Map();this.attrs=new Map();this.values=new Map();this.classes=new Set();this.classList={add:(...c)=>c.forEach(v=>this.classes.add(v)),remove:(...c)=>c.forEach(v=>this.classes.delete(v)),contains:c=>this.classes.has(c)};this.style={getPropertyValue:p=>this.values.get(p)?.value||'',getPropertyPriority:p=>this.values.get(p)?.priority||'',setProperty:(p,value,priority='')=>this.values.set(p,{value,priority}),removeProperty:p=>this.values.delete(p)};}
 set className(value){this.classes=new Set(value.split(/\s+/));}
 addEventListener(type,fn){const list=this.handlers.get(type)||[];list.push(fn);this.handlers.set(type,list);}
 removeEventListener(type,fn){this.handlers.set(type,(this.handlers.get(type)||[]).filter(f=>f!==fn));}
 fire(type,event={}){const e={type,button:0,isPrimary:true,pointerId:7,clientX:20,clientY:500,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...event};for(const fn of this.handlers.get(type)||[])fn(e);return e;}
 setAttribute(key,value){this.attrs.set(key,value);}
 getAttribute(key){return this.attrs.get(key)||null;}
 prepend(el){el.parent=this;el.parentElement=this;this.children.unshift(el);}
 querySelector(selector){return this.children.find(e=>selector===':scope > summary'?e.nodeName==='SUMMARY':e.classList.contains('hud-drag-handle'))||null;}
 querySelectorAll(selector){return selector==='button'?this.children.filter(e=>e.nodeName==='BUTTON'):[];}
 matches(selector){return selector===this.selector;}
 getBoundingClientRect(){const value=(prop,fallback)=>this.values.has(prop)?parseFloat(this.values.get(prop).value):fallback;return {left:value('left',this.rect.left),top:value('top',this.rect.top),width:Math.min(value('width',this.rect.width),value('max-width',Infinity)),height:Math.min(this.rect.height,value('max-height',Infinity))};}
 getClientRects(){return [this.getBoundingClientRect()];}
 setPointerCapture(){}
 releasePointerCapture(){}
 remove(){this.isConnected=false;this.parent.children=this.parent.children.filter(e=>e!==this);}
}
function fixture(storage=memory(),fixed=[],selector='.camera-tools',{rect={},prepare=()=>{}}={}){
 const bar=new Surface({left:14,top:500,width:200,height:100,...rect}),world=new Surface({left:0,top:48,width:800,height:600}),doc=new Surface(),win=new Surface();
 doc.body=new Surface();doc.getElementById=()=>world;doc.createElement=()=>new Surface();doc.querySelectorAll=()=>fixed;bar.selector=selector;world.querySelectorAll=query=>query===selector?[bar]:[];
 win.innerWidth=800;win.innerHeight=648;win.localStorage=storage;win.getComputedStyle=el=>({position:'static',display:'block',visibility:'visible',...el.css});
 const state={options:{mode:'kodotag'}};prepare({bar,world,doc,win,state});const ui=installHudLayout(doc,win,{world,getState:()=>state,getUserId:()=> 'alice'});
 return {bar,world,doc,win,state,ui,storage,handle:()=>bar.querySelector()};
}
test('only the explicit handle drags; touch release persists and reload restores clamped placement',()=>{
 const f=fixture();f.doc.fire('pointermove',{clientX:400});assert.equal(f.bar.style.getPropertyValue('position'),'');
 const down=f.handle().fire('pointerdown');assert.equal(down.defaultPrevented,true);assert.equal(down.propagationStopped,true);
 f.doc.fire('pointermove',{clientX:2000,clientY:-100});f.doc.fire('pointerup');
 const placed=f.bar.getBoundingClientRect();assert.equal(placed.left,594);assert.equal(placed.top,78);
 const reload=fixture(f.storage);assert.equal(reload.bar.getBoundingClientRect().left,placed.left);assert.equal(reload.bar.getBoundingClientRect().top,placed.top);
 reload.ui.reset();assert.equal(reload.bar.style.getPropertyValue('position'),'');assert.equal(reload.bar.getBoundingClientRect().left,14);
});
test('cancel and keyboard controls preserve game inputs and responsive profiles remain independent',()=>{
 const f=fixture();f.handle().fire('pointerdown');f.doc.fire('pointermove',{clientX:300});f.doc.fire('pointercancel');assert.equal(f.bar.style.getPropertyValue('position'),'');assert.equal(f.storage.values.size,0);
 const ordinary=f.handle().fire('keydown',{key:'q'});assert.equal(ordinary.propagationStopped,undefined);
 const key=f.handle().fire('keydown',{key:'ArrowRight'});assert.equal(key.propagationStopped,true);assert.equal(f.bar.getBoundingClientRect().left,22);
 f.win.innerWidth=360;f.world.rect.width=360;f.win.fire('resize');assert.equal(f.bar.style.getPropertyValue('position'),'');
 f.win.innerWidth=800;f.world.rect.width=800;f.win.fire('resize');assert.equal(f.bar.getBoundingClientRect().left,22);
 f.state.options.mode='bonk';f.ui.refresh();assert.equal(f.bar.style.getPropertyValue('position'),'');f.ui.destroy();assert.equal(f.bar.querySelector(),null);
});

test('a live stale resource bar returns to the header and loses all drag-owned styling',()=>{
 const resources=new Surface(),handle=new Surface();resources.dataset.hudLayout='resources';resources.classList.add('hud-draggable','hud-positioned');handle.classList.add('hud-drag-handle');resources.prepend(handle);resources.style.setProperty('position','fixed','important');resources.style.setProperty('left','500px','important');
 const f=fixture(memory(),[resources]);assert.equal(resources.style.getPropertyValue('position'),'');assert.equal(resources.style.getPropertyValue('left'),'');assert.equal(resources.dataset.hudLayout,undefined);assert.equal(resources.querySelector(),null);assert.equal(resources.classList.contains('hud-draggable'),false);f.ui.destroy();
});
test('empty bars have no handle and compact handles enter the tab order only while editing',()=>{
 const f=fixture();f.bar.textContent='';f.ui.refresh();assert.equal(f.handle().hidden,true);assert.equal(f.handle().tabIndex,-1);
 f.bar.textContent='Camera';f.doc.body.classList.add('hud-compact');f.ui.refresh();assert.equal(f.handle().hidden,false);assert.equal(f.handle().tabIndex,-1);
 f.handle().fire('pointerdown',{pointerType:'touch'});f.doc.fire('pointermove',{clientX:250});assert.equal(f.bar.classList.contains('hud-positioned'),false);
 f.doc.body.classList.add('hud-layout-editing');f.ui.refresh();assert.equal(f.handle().tabIndex,0);f.handle().fire('pointerdown',{pointerType:'touch'});f.doc.fire('pointermove',{clientX:250});f.doc.fire('pointerup');assert.equal(f.bar.classList.contains('hud-positioned'),true);f.ui.destroy();
});
test('hidden-only content and lost capture cannot leave an empty outlined HUD strip',()=>{
 const f=fixture(),handle=f.handle();handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:200});handle.fire('lostpointercapture');assert.equal(f.bar.classList.contains('hud-is-dragging'),false);assert.equal(f.bar.classList.contains('hud-positioned'),false);
 const progress=new Surface();progress.css={visibility:'hidden'};progress.setAttribute('role','progressbar');f.bar.prepend(progress);f.ui.refresh();assert.equal(f.handle().hidden,true);assert.equal(f.handle().tabIndex,-1);f.ui.destroy();
});
test('local room dragging belongs to the visible summary and leaves ordinary disclosure clicks alone',()=>{
 const f=fixture(memory(),[],'.online-room-panel:not(.room-waiting)');f.bar.nodeName='DETAILS';const summary=new Surface();summary.nodeName='SUMMARY';f.bar.prepend(summary);f.ui.refresh();
 const handle=summary.querySelector();assert.ok(handle);assert.equal(f.bar.children.filter(c=>c.classList.contains('hud-drag-handle')).length,0);
 const click=handle.fire('click');assert.equal(click.defaultPrevented,true);assert.equal(click.propagationStopped,true);
 assert.equal(summary.fire('click').defaultPrevented,undefined);handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:200});f.doc.fire('pointerup');assert.equal(f.bar.classList.contains('hud-positioned'),true);f.ui.destroy();
});
test('map shortcut rejects stale classic and hidden parent minimaps while allowing compact disclosure',()=>{
 const minimap=new Surface(),parent=new Surface();parent.prepend(minimap);const win={getComputedStyle:el=>({display:'block',visibility:'visible',...el.css})};
 assert.equal(hudMinimapAvailable({options:{mode:'campaign'}},minimap,win),false);assert.equal(hudMinimapAvailable({options:{mode:'bonk'}},minimap,win),false);
 const state={options:{mode:'kodotag'}};assert.equal(hudMinimapAvailable(state,minimap,win),true);parent.css={display:'none'};assert.equal(hudMinimapAvailable(state,minimap,win,{compact:true}),false);
 parent.css={};minimap.css={display:'none'};assert.equal(hudMinimapAvailable(state,minimap,win),false);assert.equal(hudMinimapAvailable(state,minimap,win,{compact:true}),true);minimap.hidden=true;assert.equal(hudMinimapAvailable(state,minimap,win,{compact:true}),false);
});

test('an oversized inventory measurement stays bounded through dragging, keyboard movement and saved layout reload',()=>{
 const f=fixture(memory(),[],'.inventory-dock',{rect:{width:1450,height:950}});try{f.handle().fire('pointerdown');f.doc.fire('pointermove',{clientX:500,clientY:300});f.doc.fire('pointerup');assert.equal(f.bar.getBoundingClientRect().width,290);assert.equal(f.bar.style.getPropertyValue('max-width'),'290px');assert.equal(f.bar.style.getPropertyValue('min-width'),'0px');assert.ok(f.bar.getBoundingClientRect().left+290<=794);
  f.handle().fire('keydown',{key:'ArrowRight'});assert.equal(f.bar.getBoundingClientRect().width,290);const saved=JSON.parse([...f.storage.values.values()][0]);assert.deepEqual(Object.keys(saved.layouts['kodotag:landscape'].bag).sort(),['x','y'],'storage never preserves a contaminated width');
  const reloaded=fixture(f.storage,[],'.inventory-dock',{rect:{width:1450,height:950}});try{assert.equal(reloaded.bar.getBoundingClientRect().width,290);assert.equal(reloaded.bar.style.getPropertyValue('max-width'),'290px');reloaded.win.fire('resize');assert.equal(reloaded.bar.getBoundingClientRect().width,290);}finally{reloaded.ui.destroy();}
 }finally{f.ui.destroy();}
});

test('saved inventory migration discards stale drag styles and preserves the natural slot dock width',()=>{
 const storage=memory();createHudLayoutStore(storage,'alice').set('kodotag:landscape','bag',{x:.8,y:.3});const f=fixture(storage,[],'.inventory-dock',{rect:{width:168,height:140},prepare:({bar})=>{bar.classList.add('hud-positioned','hud-is-dragging');for(const [property,value]of Object.entries({position:'fixed',width:'1450px','min-width':'1450px','max-width':'1800px',left:'700px',top:'100px'}))bar.style.setProperty(property,value,'important');}});
 try{assert.equal(f.bar.getBoundingClientRect().width,168);assert.equal(f.bar.style.getPropertyValue('width'),'168px');assert.equal(f.bar.classList.contains('hud-is-dragging'),false);f.ui.reset();assert.equal(f.bar.style.getPropertyValue('width'),'');assert.equal(f.bar.style.getPropertyValue('min-width'),'');assert.equal(f.bar.getBoundingClientRect().width,168);}finally{f.ui.destroy();}
});

test('inventory layouts fit narrow viewports after resize and retain independent compact placement',()=>{
 const storage=memory(),store=createHudLayoutStore(storage,'alice');for(const scope of ['kodotag:landscape','kodotag:portrait'])store.set(scope,'bag',{x:1,y:.5});const f=fixture(storage,[],'.inventory-dock',{rect:{width:1450,height:140}});
 try{assert.equal(f.bar.getBoundingClientRect().width,290);f.win.innerWidth=250;f.world.rect.width=250;f.doc.body.classList.add('hud-compact');f.win.fire('resize');assert.equal(f.bar.getBoundingClientRect().width,238);assert.equal(f.bar.style.getPropertyValue('max-width'),'238px');assert.ok(f.bar.getBoundingClientRect().left+238<=244);f.doc.body.classList.add('hud-layout-editing');f.ui.refresh();f.handle().fire('pointerdown',{pointerType:'touch'});f.doc.fire('pointermove',{clientX:300});f.doc.fire('pointerup');assert.equal(f.bar.getBoundingClientRect().width,238);f.win.innerWidth=800;f.world.rect.width=800;f.win.fire('resize');assert.equal(f.bar.getBoundingClientRect().width,290);}finally{f.ui.destroy();}
});

test('inventory slot and SVG safety limits apply independently of floating panel measurements',()=>{
 const css=readFileSync(new URL('../src/hud-layout.css',import.meta.url),'utf8');assert.match(css,/body\.hud-revamp \.inventory-dock\.inventory-panel\{[^}]*min-width:0;max-width:290px/);assert.match(css,/body\.hud-revamp \.inventory-dock \.inventory-slot\{[^}]*max-width:72px;max-height:72px/);assert.match(css,/body\.hud-revamp \.inventory-dock \.inventory-slot>svg\{[^}]*max-width:64px;max-height:64px/);
});
