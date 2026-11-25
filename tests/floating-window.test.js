import test from 'node:test';
import assert from 'node:assert/strict';
import {installFloatingWindow} from '../src/floating-window.js';

class Surface {
 constructor(rect={left:200,top:160,width:320,height:240}){this.rect=rect;this.values=new Map();this.handlers=new Map();const classes=new Set();this.classList={add:(...v)=>v.forEach(c=>classes.add(c)),remove:(...v)=>v.forEach(c=>classes.delete(c)),contains:c=>classes.has(c)};this.style={getPropertyValue:p=>this.values.get(p)?.value||'',getPropertyPriority:p=>this.values.get(p)?.priority||'',setProperty:(p,value,priority)=>this.values.set(p,{value,priority}),removeProperty:p=>this.values.delete(p)};}
 addEventListener(type,fn){this.handlers.set(type,[...(this.handlers.get(type)||[]),fn]);}
 removeEventListener(type,fn){this.handlers.set(type,(this.handlers.get(type)||[]).filter(f=>f!==fn));}
 fire(type,event={}){const e={type,target:this,button:0,isPrimary:true,pointerId:3,clientX:200,clientY:160,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...event};for(const fn of this.handlers.get(type)||[])fn(e);return e;}
 closest(){return null;}
 getBoundingClientRect(){return {...this.rect,left:this.values.has('left')?parseFloat(this.values.get('left').value):this.rect.left,top:this.values.has('top')?parseFloat(this.values.get('top').value):this.rect.top};}
 setPointerCapture(){}
 releasePointerCapture(){}
}
const memory=()=>{const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),values};};
function fixture(storage=memory()){
 const doc=new Surface(),win=new Surface(),element=new Surface(),handle=new Surface(),state={scope:'campaign:attributes',user:'alice',open:true};win.innerWidth=1000;win.innerHeight=700;win.localStorage=storage;
 const ui=installFloatingWindow(doc,win,{element,handle,getScope:()=>state.scope,getUserId:()=>state.user,isOpen:()=>state.open});return{doc,win,element,handle,state,ui,storage};
}
function nearRect(actual,expected){for(const key of ['left','top','width','height'])assert.ok(Math.abs(actual[key]-expected[key])<1e-6,key+': '+actual[key]+' != '+expected[key]);}
function drag(f,x,y){f.handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:x,clientY:y});f.doc.fire('pointerup');}

test('a title drag moves only its live window, clamps to the viewport and persists across reload',()=>{
 const f=fixture();f.element.content={authoritative:true};const content=f.element.content;
 const down=f.handle.fire('pointerdown');assert.equal(down.defaultPrevented,true);f.doc.fire('pointermove',{clientX:2000,clientY:-500});f.doc.fire('pointerup');const r=f.element.getBoundingClientRect();assert.equal(r.left,674);assert.equal(r.top,6);assert.equal(f.element.content,content);
 const reload=fixture(f.storage);assert.equal(reload.element.getBoundingClientRect().left,674);assert.equal(reload.element.getBoundingClientRect().top,6);f.ui.destroy();reload.ui.destroy();
});

test('pages, game modes and players retain independent positions without stale data or duplicate windows',()=>{
 const f=fixture();drag(f,400,250);const attributes=f.element.getBoundingClientRect();f.state.scope='campaign:skills';f.ui.refresh();assert.equal(f.element.style.getPropertyValue('left'),'');drag(f,100,300);const skills=f.element.getBoundingClientRect();
 f.state.scope='campaign:attributes';f.ui.refresh();nearRect(f.element.getBoundingClientRect(),attributes);f.state.scope='warlock:skills';f.ui.refresh();assert.equal(f.element.style.getPropertyValue('left'),'');f.state.scope='campaign:skills';f.ui.refresh();nearRect(f.element.getBoundingClientRect(),skills);
 f.state.user='bob';f.ui.refresh();assert.equal(f.element.style.getPropertyValue('left'),'');f.state.user='alice';f.ui.refresh();nearRect(f.element.getBoundingClientRect(),skills);f.ui.destroy();
});

test('resize keeps a saved window reachable and resetting clears all pages for this player',()=>{
 const f=fixture();drag(f,2000,2000);f.win.innerWidth=400;f.win.innerHeight=320;f.win.fire('resize');const r=f.element.getBoundingClientRect();assert.equal(r.left,74);assert.equal(r.top,74);
 f.state.scope='campaign:skills';f.ui.refresh();drag(f,220,180);f.ui.reset();assert.equal(f.element.style.getPropertyValue('left'),'');f.state.scope='campaign:attributes';f.ui.refresh();assert.equal(f.element.style.getPropertyValue('left'),'');const reload=fixture(f.storage);assert.equal(reload.element.style.getPropertyValue('left'),'');reload.state.scope='campaign:skills';reload.ui.refresh();assert.equal(reload.element.style.getPropertyValue('left'),'');reload.ui.destroy();f.ui.destroy();
});

test('close buttons and ordinary keys retain their input; title arrows move and Escape cancels a drag',()=>{
 const f=fixture(),close={closest:()=>true};assert.equal(f.handle.fire('pointerdown',{target:close}).defaultPrevented,undefined);assert.equal(f.handle.fire('keydown',{target:close,key:'ArrowRight'}).defaultPrevented,undefined);assert.equal(f.handle.fire('keydown',{key:'q'}).stopped,undefined);
 const key=f.handle.fire('keydown',{key:'ArrowRight'});assert.equal(key.stopped,true);assert.equal(f.element.getBoundingClientRect().left,208);f.handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:800});const escape=f.handle.fire('keydown',{key:'Escape'});assert.equal(escape.stopped,true);assert.equal(f.element.getBoundingClientRect().left,208);assert.equal(f.element.classList.contains('hud-window-dragging'),false);
 f.state.open=false;assert.equal(f.handle.fire('pointerdown').defaultPrevented,undefined);f.ui.destroy();assert.equal(f.handle.handlers.get('pointerdown').length,0);
});

test('multiple live windows merge their persisted pages instead of overwriting each other',()=>{
 const storage=memory(),a=fixture(storage),b=fixture(storage);b.state.scope='warlock:inventory';b.ui.refresh();drag(a,250,200);drag(b,500,300);a.handle.fire('keydown',{key:'ArrowDown'});
 const stored=JSON.parse([...storage.values.values()][0]);assert.deepEqual(Object.keys(stored).sort(),['campaign:attributes','warlock:inventory']);a.ui.destroy();b.ui.destroy();
});

test('blocked storage still allows dragging, cancellation and session page placement',()=>{
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},f=fixture(storage);drag(f,350,250);const r=f.element.getBoundingClientRect();f.state.scope='campaign:skills';f.ui.refresh();f.state.scope='campaign:attributes';f.ui.refresh();nearRect(f.element.getBoundingClientRect(),r);
 f.handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:900});f.doc.fire('pointercancel');nearRect(f.element.getBoundingClientRect(),r);f.ui.destroy();
});
