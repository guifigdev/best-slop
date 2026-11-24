import test from 'node:test';
import assert from 'node:assert/strict';
import {clampHudPosition,normalizeHudPosition,restoreHudPosition,createHudLayoutStore,installHudLayout} from '../src/hud-layout.js';

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
test('invalid or unavailable storage never prevents a player from arranging the HUD',()=>{
 for(const getItem of [()=>'{broken',()=>JSON.stringify({version:99,layouts:{}}),()=>JSON.stringify({version:1,layouts:{scope:'invalid'}})]){
  const store=createHudLayoutStore({getItem,setItem(){throw new Error('quota');}});assert.equal(store.get('scope','hero'),null);assert.equal(store.set('scope','hero',{x:.5,y:.5}),false);assert.deepEqual(store.get('scope','hero'),{x:.5,y:.5});
 }
});

// A geometry/event DOM double exercises the real pointer and keyboard controller.
class Surface {
 constructor(rect={left:0,top:0,width:200,height:100}){this.rect=rect;this.children=[];this.dataset={};this.isConnected=true;this.handlers=new Map();this.attrs=new Map();this.values=new Map();this.classes=new Set();this.classList={add:(...c)=>c.forEach(v=>this.classes.add(v)),remove:(...c)=>c.forEach(v=>this.classes.delete(v)),contains:c=>this.classes.has(c)};this.style={getPropertyValue:p=>this.values.get(p)?.value||'',getPropertyPriority:p=>this.values.get(p)?.priority||'',setProperty:(p,value,priority='')=>this.values.set(p,{value,priority}),removeProperty:p=>this.values.delete(p)};}
 set className(value){this.classes=new Set(value.split(/\s+/));}
 addEventListener(type,fn){const list=this.handlers.get(type)||[];list.push(fn);this.handlers.set(type,list);}
 removeEventListener(type,fn){this.handlers.set(type,(this.handlers.get(type)||[]).filter(f=>f!==fn));}
 fire(type,event={}){const e={type,button:0,isPrimary:true,pointerId:7,clientX:20,clientY:500,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...event};for(const fn of this.handlers.get(type)||[])fn(e);return e;}
 setAttribute(key,value){this.attrs.set(key,value);}
 getAttribute(key){return this.attrs.get(key)||null;}
 prepend(el){el.parent=this;this.children.unshift(el);}
 querySelector(){return this.children.find(e=>e.classList.contains('hud-drag-handle'))||null;}
 matches(selector){return selector==='.worldbottom .hero-card';}
 getBoundingClientRect(){const value=(prop,fallback)=>this.values.has(prop)?parseFloat(this.values.get(prop).value):fallback;return {left:value('left',this.rect.left),top:value('top',this.rect.top),width:Math.min(value('width',this.rect.width),value('max-width',Infinity)),height:Math.min(this.rect.height,value('max-height',Infinity))};}
 getClientRects(){return [this.getBoundingClientRect()];}
 setPointerCapture(){}
 releasePointerCapture(){}
 remove(){this.isConnected=false;this.parent.children=this.parent.children.filter(e=>e!==this);}
}
function fixture(storage=memory()){
 const hero=new Surface({left:14,top:500,width:200,height:100}),world=new Surface({left:0,top:48,width:800,height:600}),doc=new Surface(),win=new Surface();
 doc.body=new Surface();doc.getElementById=()=>world;doc.createElement=()=>new Surface();doc.querySelectorAll=()=>[];world.querySelectorAll=selector=>selector==='.worldbottom .hero-card'?[hero]:[];
 win.innerWidth=800;win.innerHeight=648;win.localStorage=storage;win.getComputedStyle=()=>({position:'static'});
 const state={options:{mode:'kodotag'}},ui=installHudLayout(doc,win,{world,getState:()=>state,getUserId:()=> 'alice'});
 return {hero,world,doc,win,state,ui,storage,handle:()=>hero.querySelector()};
}
test('only the explicit handle drags; touch release persists and reload restores clamped placement',()=>{
 const f=fixture();f.doc.fire('pointermove',{clientX:400});assert.equal(f.hero.style.getPropertyValue('position'),'');
 const down=f.handle().fire('pointerdown');assert.equal(down.defaultPrevented,true);assert.equal(down.propagationStopped,true);
 f.doc.fire('pointermove',{clientX:2000,clientY:-100});f.doc.fire('pointerup');
 const placed=f.hero.getBoundingClientRect();assert.equal(placed.left,594);assert.equal(placed.top,78);
 const reload=fixture(f.storage);assert.equal(reload.hero.getBoundingClientRect().left,placed.left);assert.equal(reload.hero.getBoundingClientRect().top,placed.top);
 reload.ui.reset();assert.equal(reload.hero.style.getPropertyValue('position'),'');assert.equal(reload.hero.getBoundingClientRect().left,14);
});
test('cancel and keyboard controls preserve game inputs and responsive profiles remain independent',()=>{
 const f=fixture();f.handle().fire('pointerdown');f.doc.fire('pointermove',{clientX:300});f.doc.fire('pointercancel');assert.equal(f.hero.style.getPropertyValue('position'),'');assert.equal(f.storage.values.size,0);
 const ordinary=f.handle().fire('keydown',{key:'q'});assert.equal(ordinary.propagationStopped,undefined);
 const key=f.handle().fire('keydown',{key:'ArrowRight'});assert.equal(key.propagationStopped,true);assert.equal(f.hero.getBoundingClientRect().left,22);
 f.win.innerWidth=360;f.world.rect.width=360;f.win.fire('resize');assert.equal(f.hero.style.getPropertyValue('position'),'');
 f.win.innerWidth=800;f.world.rect.width=800;f.win.fire('resize');assert.equal(f.hero.getBoundingClientRect().left,22);
 f.state.options.mode='bonk';f.ui.refresh();assert.equal(f.hero.style.getPropertyValue('position'),'');f.ui.destroy();assert.equal(f.hero.querySelector(),null);
});
