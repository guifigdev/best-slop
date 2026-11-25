import {installFloatingWindow} from './floating-window.js';

const positionProperties=['position','left','top','right','bottom','transform'];
const attributeNames=['tabindex','title','aria-label'];
const ragnarokWindows=[
 ['.bonk-build.expanded[role="dialog"]','inventory',element=>element.classList.contains('ro-character-open')?'character':'inventory','.ro-character-attributes > header,.ro-bag-heading'],
 ['[data-ro-skill-library][role="dialog"]','skills',null,':scope > header'],
 ['.ro-ground-loot[role="dialog"]:not(.ro-town-window)','ground-item',null,':scope > header'],
 ['.ro-secret-shop[role="dialog"]','merchant',null,':scope > header'],
 ['.ro-atlas-dialog[role="dialog"]','atlas',null,':scope > header'],
];

// Only optional game windows are included. Preparation, level-up choices,
// results, pause/settings and the fixed tutorial are deliberately untouched.
export function gameWindowCandidates(doc,state){
 if(!state)return [];
 const windows=[],overlay=doc.querySelector('#overlay-modal > .info-modal');
 if(overlay){
  const type=overlay.querySelector('#equipment-panel')?'equipment':overlay.querySelector('#permanent-panel')?'runes':overlay.querySelector('#npc-shop-panel')?'npc':overlay.querySelector('#loot-panel')?'loot':null;
  const handle=overlay.querySelector(':scope > h2');if(type&&handle)windows.push({element:overlay,handle,type});
 }
 if(state.options?.mode==='bonk')for(const [selector,type,readType,handleSelector]of ragnarokWindows)for(const element of doc.querySelectorAll(selector)){
  const handle=element.querySelector(handleSelector);if(handle)windows.push({element,handle,type:readType?.(element)||type});
 }
 return windows;
}

export function installGameWindowDragging(doc=document,win=window,{getState=()=>null,getUserId=()=> 'local'}={}){
 const records=new Map();let destroyed=false,pending=null;
 const visible=element=>{
  if(!element.isConnected||!element.getClientRects().length)return false;
  for(let parent=element;parent;parent=parent.parentElement){if(parent.hidden||parent.inert||parent.classList.contains('hidden'))return false;const css=win.getComputedStyle(parent);if(css.display==='none'||css.visibility==='hidden')return false;}
  return true;
 };
 function decorate(record){
  const {element,handle}=record;element.classList.add('hud-game-window');element.style.setProperty('--game-window-width',record.width+'px');
  handle.classList.add('hud-window-drag-handle');handle.tabIndex=0;handle.title='Arraste a janela · use as setas para mover';handle.setAttribute('aria-label','Mover janela. Arraste ou use as setas.');
 }
 function dispose(record){
  record.controller.destroy();record.element.classList.remove('hud-game-window');
  if(record.originalWidth)record.element.style.setProperty('--game-window-width',record.originalWidth);else record.element.style.removeProperty('--game-window-width');
  for(const [name,value]of record.attributes)if(value===null)record.handle.removeAttribute(name);else record.handle.setAttribute(name,value);
 }
 function scan(){
  if(destroyed)return;
  const state=getState(),candidates=gameWindowCandidates(doc,state).filter(({element})=>visible(element)),live=new Map(candidates.map(candidate=>[candidate.element,candidate]));
  for(const [element,record]of records){const candidate=live.get(element);if(!candidate||candidate.handle!==record.handle||candidate.type!==record.type){dispose(record);records.delete(element);}}
  for(const candidate of candidates){
   const {element,handle,type}=candidate,identity=String(getUserId()||'local')+'\n'+(state.options?.mode||'classic')+'\n'+type;let record=records.get(element);
   if(!record){
    record={element,handle,type,identity,width:element.getBoundingClientRect().width,originalWidth:element.style.getPropertyValue('--game-window-width'),attributes:attributeNames.map(name=>[name,handle.getAttribute(name)]),position:null};
    decorate(record);
    record.controller=installFloatingWindow(doc,win,{element,handle,getScope:()=> (getState()?.options?.mode||'classic')+':window:'+type,getUserId,isOpen:()=>visible(element)});records.set(element,record);
   }else{
    // Snapshot patching owns the content and can strip presentation attributes.
    // Restore only our placement, leaving its nodes, values and handlers intact.
    if(record.identity!==identity){record.position=null;record.identity=identity;}
    else if(element.classList.contains('hud-window-positioned'))record.position=positionProperties.map(name=>[name,element.style.getPropertyValue(name),element.style.getPropertyPriority(name)]);
    else if(record.position){element.classList.add('hud-window-positioned');for(const [name,value,priority]of record.position)element.style.setProperty(name,value,priority);}
    decorate(record);record.controller.refresh();
   }
   if(element.classList.contains('hud-window-positioned'))record.position=positionProperties.map(name=>[name,element.style.getPropertyValue(name),element.style.getPropertyPriority(name)]);
  }
 }
 function refresh(){
  if(destroyed)return;scan();
  // hudShell updates before the mode renderer. A single post-render pass handles
  // its patch without observing (or reacting recursively to) style attributes.
  if(pending===null&&win.requestAnimationFrame)pending=win.requestAnimationFrame(()=>{pending=null;scan();});
 }
 refresh();
 return {refresh,reset(){for(const record of records.values()){record.position=null;record.controller.reset();}},destroy(){if(destroyed)return;destroyed=true;if(pending!==null)win.cancelAnimationFrame?.(pending);pending=null;for(const record of records.values())dispose(record);records.clear();}};
}
