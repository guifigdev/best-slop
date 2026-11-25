import {clampHudPosition,normalizeHudPosition,restoreHudPosition} from './hud-layout.js';

// One live window keeps its existing content and handlers when its page changes.
export function installFloatingWindow(doc=document,win=window,{element,handle,getScope=()=> 'default',getUserId=()=> 'local',isOpen=()=>true,onStatus=()=>{}}={}){
 if(!element||!handle)return null;
 const properties=['position','left','top','right','bottom','transform'],original=properties.map(p=>[p,element.style.getPropertyValue(p),element.style.getPropertyPriority(p)]);
 let storage;try{storage=win.localStorage;}catch{}
 let active=null,identity='',user='',scope='',positions={},measurement='';
 const bounds=()=>({left:0,top:0,width:win.innerWidth,height:win.innerHeight});
 const size=()=>{const r=element.getBoundingClientRect();return {width:r.width,height:r.height};};
 const key=()=> 'custom-hero:floating-windows:v1:'+encodeURIComponent(user);
 const persist=(reset=false)=>{try{let latest={};try{const saved=JSON.parse(storage?.getItem(key())||'null');if(saved&&typeof saved==='object'&&!Array.isArray(saved))latest=saved;}catch{}if(reset)latest={};else latest[scope]=positions[scope];storage?.setItem(key(),JSON.stringify(latest));return !!storage;}catch{return false;}};
 const clear=()=>{for(const [p,value,priority]of original){if(value)element.style.setProperty(p,value,priority);else element.style.removeProperty(p);}element.classList.remove('hud-window-positioned');measurement='';};
 function place(position,normalized=false){
  element.classList.add('hud-window-positioned');for(const [p,value]of [['position','fixed'],['right','auto'],['bottom','auto'],['transform','none'],['left','0px'],['top','0px']])element.style.setProperty(p,value,'important');
  const origin=element.getBoundingClientRect(),dimensions={width:origin.width,height:origin.height},p=normalized?restoreHudPosition(position,dimensions,bounds()):clampHudPosition(position,dimensions,bounds());
  element.style.setProperty('left',(p.left-origin.left)+'px','important');element.style.setProperty('top',(p.top-origin.top)+'px','important');return p;
 }
 function save(){positions[scope]=normalizeHudPosition(element.getBoundingClientRect(),size(),bounds());onStatus(persist()?'Posição da janela salva.':'Posição da janela ajustada nesta sessão.');}
 function finish(cancel=false){if(!active)return;const drag=active;active=null;element.classList.remove('hud-window-dragging');if(cancel){if(drag.positioned)place(drag.origin);else clear();}else save();try{handle.releasePointerCapture(drag.pointerId);}catch{}}
 function refresh(){
  const nextUser=String(getUserId()||'local'),nextScope=String(getScope()||'default'),nextIdentity=nextUser+'\n'+nextScope;
  if(nextIdentity!==identity){finish(true);clear();identity=nextIdentity;scope=nextScope;if(nextUser!==user)positions={};user=nextUser;let saved;try{saved=JSON.parse(storage?.getItem(key())||'null');}catch{}if(saved&&typeof saved==='object'&&!Array.isArray(saved))positions=saved;}
  if(active||!isOpen())return;const dimensions=size();if(!dimensions.width||!dimensions.height)return;const nextMeasurement=[win.innerWidth,win.innerHeight,dimensions.width,dimensions.height].join(':');if(nextMeasurement===measurement)return;measurement=nextMeasurement;
  const saved=positions[scope];if(Number.isFinite(saved?.x)&&Number.isFinite(saved?.y))place(saved,true);else if(element.classList.contains('hud-window-positioned'))place(element.getBoundingClientRect());
 }
 const controls=target=>target!==handle&&!!target.closest?.('button,a,input,select,textarea,[role="button"]');
 const down=e=>{if(!isOpen()||controls(e.target)||e.button!==undefined&&e.button!==0||e.isPrimary===false)return;refresh();finish();e.preventDefault();e.stopPropagation();const r=element.getBoundingClientRect();active={pointerId:e.pointerId,x:e.clientX,y:e.clientY,origin:{left:r.left,top:r.top},positioned:element.classList.contains('hud-window-positioned')};place(active.origin);element.classList.add('hud-window-dragging');try{handle.setPointerCapture(e.pointerId);}catch{}};
 const move=e=>{if(!active||e.pointerId!==active.pointerId)return;e.preventDefault();e.stopPropagation();place({left:active.origin.left+e.clientX-active.x,top:active.origin.top+e.clientY-active.y});};
 const up=e=>{if(active&&e.pointerId===active.pointerId){e.stopPropagation();finish(e.type==='pointercancel');}};
 const lost=()=>finish(true),resize=()=>{finish();measurement='';refresh();};
 const keyboard=e=>{if(controls(e.target))return;if(e.key==='Escape'&&active){e.preventDefault();e.stopPropagation();finish(true);return;}if(!isOpen()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();refresh();const r=element.getBoundingClientRect(),step=e.shiftKey?24:8;place({left:r.left+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),top:r.top+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)});save();};
 handle.classList.add('hud-window-drag-handle');handle.tabIndex=0;handle.title='Arraste a janela · use as setas para mover';
 handle.addEventListener('pointerdown',down);handle.addEventListener('lostpointercapture',lost);handle.addEventListener('keydown',keyboard);doc.addEventListener('pointermove',move,{passive:false});doc.addEventListener('pointerup',up);doc.addEventListener('pointercancel',up);win.addEventListener('resize',resize);win.addEventListener('blur',lost);win.visualViewport?.addEventListener('resize',resize);refresh();
 return{refresh,cancel(){finish(true);},reset(){finish(true);positions={};persist(true);clear();refresh();},destroy(){finish(true);clear();handle.classList.remove('hud-window-drag-handle');handle.removeEventListener('pointerdown',down);handle.removeEventListener('lostpointercapture',lost);handle.removeEventListener('keydown',keyboard);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',up);win.removeEventListener('resize',resize);win.removeEventListener('blur',lost);win.visualViewport?.removeEventListener('resize',resize);}};
}
