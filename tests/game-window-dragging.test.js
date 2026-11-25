import test from 'node:test';
import assert from 'node:assert/strict';
import {installGameWindowDragging,gameWindowCandidates} from '../src/game-window-dragging.js';

class Surface {
 constructor(doc,rect={left:100,top:100,width:280,height:180}){this.ownerDocument=doc;this.rect=rect;this.isConnected=true;this.children=[];this.handlers=new Map();this.attributes=new Map();this.styles=new Map();this.selectors=new Map();const classes=new Set();this.classList={add:(...items)=>items.forEach(c=>classes.add(c)),remove:(...items)=>items.forEach(c=>classes.delete(c)),contains:c=>classes.has(c)};this.style={getPropertyValue:p=>this.styles.get(p)?.value||'',getPropertyPriority:p=>this.styles.get(p)?.priority||'',setProperty:(p,value,priority='')=>this.styles.set(p,{value,priority}),removeProperty:p=>this.styles.delete(p)};}
 addEventListener(type,fn){this.handlers.set(type,[...(this.handlers.get(type)||[]),fn]);}
 removeEventListener(type,fn){this.handlers.set(type,(this.handlers.get(type)||[]).filter(f=>f!==fn));}
 fire(type,event={}){const e={type,target:this,button:0,isPrimary:true,pointerId:3,clientX:100,clientY:100,preventDefault(){this.defaultPrevented=true;},stopPropagation(){},...event};for(const fn of this.handlers.get(type)||[])fn(e);return e;}
 append(el){el.parentElement=this;this.children.push(el);}
 querySelector(selector){return this.selectors.get(selector)||null;}
 querySelectorAll(selector){return this.selectors.get(selector)||[];}
 closest(){return null;}
 setAttribute(name,value){this.attributes.set(name,String(value));}
 getAttribute(name){return this.attributes.get(name)??null;}
 removeAttribute(name){this.attributes.delete(name);}
 set tabIndex(value){this.setAttribute('tabindex',value);}
 set title(value){this.setAttribute('title',value);}
 getBoundingClientRect(){const coordinate=(name,fallback)=>this.styles.has(name)?parseFloat(this.styles.get(name).value):fallback;return {...this.rect,left:coordinate('left',this.rect.left),top:coordinate('top',this.rect.top)};}
 getClientRects(){return this.isConnected?[this.getBoundingClientRect()]:[];}
 setPointerCapture(){}
 releasePointerCapture(){}
}
const selectors={bag:'.bonk-build.expanded[role="dialog"]',skills:'[data-ro-skill-library][role="dialog"]',item:'.ro-ground-loot[role="dialog"]:not(.ro-town-window)',merchant:'.ro-secret-shop[role="dialog"]',atlas:'.ro-atlas-dialog[role="dialog"]'};
function fixture(storage=new Map()){
 const doc=new Surface(),win=new Surface(),state={options:{mode:'campaign'}},frames=new Map();let id=0,user='alice';doc.body=new Surface(doc);win.innerWidth=800;win.innerHeight=600;win.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};win.getComputedStyle=el=>({display:el.display||'block',visibility:'visible'});win.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};win.cancelAnimationFrame=id=>frames.delete(id);win.MutationObserver=class{constructor(){throw Error('No attribute observer may be installed');}};
 function window(kind='equipment'){
  const element=new Surface(doc),handle=new Surface(doc);doc.body.append(element);element.append(handle);handle.setAttribute('tabindex','-1');handle.setAttribute('title','Original title');
  if(selectors[kind]){doc.selectors.set(selectors[kind],[element]);element.selectors.set(kind==='bag'?'.ro-character-attributes > header,.ro-bag-heading':':scope > header',handle);}
  else{doc.selectors.set('#overlay-modal > .info-modal',element);element.selectors.set(':scope > h2',handle);element.selectors.set('#'+({equipment:'equipment-panel',npc:'npc-shop-panel',runes:'permanent-panel',loot:'loot-panel'}[kind]||'unknown'),{});}
  return {element,handle};
 }
 const ui=installGameWindowDragging(doc,win,{getState:()=>state,getUserId:()=>user});
 return {doc,win,state,storage,ui,window,frames,setUser:next=>user=next,flush(){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn());}};
}
function drag(f,w,x=300,y=250){w.handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:x,clientY:y});f.doc.fire('pointerup');}

test('only real optional game windows are registered, without moving a backdrop or critical dialog',()=>{
 const f=fixture(),w=f.window('equipment'),content={items:true};w.element.content=content;f.ui.refresh();assert.equal(w.handle.handlers.get('pointerdown').length,1);assert.equal(w.element.content,content);assert.equal(f.doc.body.handlers.get('pointerdown'),undefined);
 const down=w.handle.fire('pointerdown');assert.equal(down.defaultPrevented,true);f.doc.fire('pointercancel');assert.equal(f.doc.body.style.getPropertyValue('position'),'');
 f.doc.selectors.set('#overlay-modal > .info-modal',null);f.window('unknown');f.ui.refresh();assert.equal(w.handle.handlers.get('pointerdown').length,0);assert.deepEqual(gameWindowCandidates(f.doc,f.state),[]);
 f.state.options.mode='bonk';const bag=f.window('bag'),skills=f.window('skills');assert.deepEqual(gameWindowCandidates(f.doc,f.state).map(c=>c.type),['inventory','skills']);f.ui.refresh();assert.equal(bag.handle.handlers.get('pointerdown').length,1);assert.equal(skills.handle.handlers.get('pointerdown').length,1);f.ui.destroy();
});

test('title dragging clamps and persists by mode, type and player; closed windows clean up',()=>{
 const f=fixture(),w=f.window('npc');f.ui.refresh();drag(f,w,2000,-500);assert.equal(w.element.getBoundingClientRect().left,514);assert.equal(w.element.getBoundingClientRect().top,6);
 const saved=JSON.parse([...f.storage.values()][0]);assert.ok(saved['campaign:window:npc']);w.element.isConnected=false;f.ui.refresh();assert.equal(w.handle.handlers.get('pointerdown').length,0);assert.equal(w.handle.getAttribute('tabindex'),'-1');assert.equal(w.handle.getAttribute('title'),'Original title');assert.equal(w.handle.getAttribute('aria-label'),null);
 const reopened=f.window('npc');f.ui.refresh();assert.equal(reopened.element.getBoundingClientRect().left,514);f.state.options.mode='tower';f.ui.refresh();assert.equal(reopened.element.style.getPropertyValue('left'),'');f.state.options.mode='campaign';f.ui.refresh();assert.equal(reopened.element.getBoundingClientRect().left,514);f.setUser('bob');f.ui.refresh();assert.equal(reopened.element.style.getPropertyValue('left'),'');f.setUser('alice');f.ui.refresh();assert.equal(reopened.element.getBoundingClientRect().left,514);f.ui.destroy();
});

test('post-render pass restores only drag presentation after a snapshot patch, without an observer loop',()=>{
 const f=fixture();f.state.options.mode='bonk';const w=f.window('skills');f.ui.refresh();f.flush();drag(f,w);f.ui.refresh();const position=w.element.style.getPropertyValue('left'),content={newSkillLevel:2};
 w.element.content=content;w.element.styles.clear();w.element.classList.remove('hud-window-positioned','hud-game-window');w.handle.classList.remove('hud-window-drag-handle');w.handle.removeAttribute('tabindex');f.flush();assert.equal(w.element.style.getPropertyValue('left'),position);assert.equal(w.element.content,content);assert.equal(w.handle.getAttribute('tabindex'),'0');assert.equal(w.handle.handlers.get('pointerdown').length,1);assert.equal(f.frames.size,0);
 for(let i=0;i<5;i++)f.ui.refresh();assert.equal(f.frames.size,1);f.flush();assert.equal(f.frames.size,0);f.ui.destroy();
});

test('Ragnarok page/handle replacements cancel the old lifecycle and restore independent bag/attribute positions',()=>{
 const f=fixture();f.state.options.mode='bonk';const w=f.window('bag');f.ui.refresh();drag(f,w,200,230);f.ui.refresh();const bagLeft=w.element.style.getPropertyValue('left'),old=w.handle,next=new Surface(f.doc);w.element.append(next);w.element.classList.add('ro-character-open');w.element.selectors.set('.ro-character-attributes > header,.ro-bag-heading',next);f.ui.refresh();assert.equal(old.handlers.get('pointerdown').length,0);assert.equal(next.handlers.get('pointerdown').length,1);assert.equal(w.element.style.getPropertyValue('left'),'');drag(f,{handle:next},450,260);
 w.element.classList.remove('ro-character-open');w.element.selectors.set('.ro-character-attributes > header,.ro-bag-heading',old);f.ui.refresh();assert.equal(w.element.style.getPropertyValue('left'),bagLeft);assert.equal(next.handlers.get('pointerdown').length,0);f.ui.destroy();
});

test('resize, close-during-drag, reset and destroy leave no global listeners or queued work',()=>{
 const f=fixture(),w=f.window('equipment');f.ui.refresh();drag(f,w,2000,2000);f.win.innerWidth=400;f.win.innerHeight=320;f.win.fire('resize');assert.equal(w.element.getBoundingClientRect().left,114);assert.equal(w.element.getBoundingClientRect().top,134);
 w.handle.fire('pointerdown');f.doc.fire('pointermove',{clientX:350});w.element.hidden=true;f.ui.refresh();assert.equal(w.element.classList.contains('hud-window-dragging'),false);assert.equal(w.handle.handlers.get('pointerdown').length,0);w.element.hidden=false;f.ui.refresh();f.ui.reset();assert.equal(w.element.style.getPropertyValue('left'),'');f.ui.destroy();assert.equal(f.frames.size,0);for(const type of ['pointermove','pointerup','pointercancel'])assert.equal(f.doc.handlers.get(type).length,0);assert.equal(f.win.handlers.get('resize').length,0);assert.equal(w.handle.getAttribute('tabindex'),'-1');f.ui.refresh();assert.equal(f.frames.size,0);
});
