// Positions are fractions of the available travel, so a saved HUD survives resizing.
export const HUD_LAYOUT_VERSION=1;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function clampHudPosition(position,size,bounds,padding=6){
 const minX=bounds.left+padding,minY=bounds.top+padding;
 return {left:clamp(position.left,minX,Math.max(minX,bounds.left+bounds.width-size.width-padding)),top:clamp(position.top,minY,Math.max(minY,bounds.top+bounds.height-size.height-padding))};
}
export function normalizeHudPosition(position,size,bounds,padding=6){
 const p=clampHudPosition(position,size,bounds,padding);
 return {x:clamp((p.left-bounds.left-padding)/Math.max(1,bounds.width-size.width-padding*2),0,1),y:clamp((p.top-bounds.top-padding)/Math.max(1,bounds.height-size.height-padding*2),0,1)};
}
export function restoreHudPosition(position,size,bounds,padding=6){
 return clampHudPosition({left:bounds.left+padding+position.x*Math.max(0,bounds.width-size.width-padding*2),top:bounds.top+padding+position.y*Math.max(0,bounds.height-size.height-padding*2)},size,bounds,padding);
}
export function createHudLayoutStore(storage,user='local'){
 const key='custom-hero:hud-layout:v'+HUD_LAYOUT_VERSION+':'+encodeURIComponent(String(user||'local'));
 let data={version:HUD_LAYOUT_VERSION,layouts:{}};
 try{const saved=JSON.parse(storage?.getItem(key)||'null');if(saved?.version===HUD_LAYOUT_VERSION&&saved.layouts&&typeof saved.layouts==='object'&&!Array.isArray(saved.layouts))data=saved;}catch{}
 const persist=()=>{try{storage?.setItem(key,JSON.stringify(data));return !!storage;}catch{return false;}};
 return {
  get(scope,id){const p=data.layouts[scope]?.[id];return Number.isFinite(p?.x)&&Number.isFinite(p?.y)?{x:clamp(p.x,0,1),y:clamp(p.y,0,1)}:null;},
  set(scope,id,position){if(!data.layouts[scope]||typeof data.layouts[scope]!=='object'||Array.isArray(data.layouts[scope]))data.layouts[scope]={};data.layouts[scope][id]={x:position.x,y:position.y};return persist();},
  reset(){data={version:HUD_LAYOUT_VERSION,layouts:{}};return persist();},
 };
}

const BARS=[
 ['launcher','.hud-launcher','Atalhos'],['resources','.hud-resources','Recursos'],
 ['hero','.worldbottom .hero-card','Vida e mana'],['skills','.worldbottom .skilldock','Habilidades'],
 ['bag','.inventory-dock','Mochila'],['consumables','.consumable-dock','Consumíveis'],
 ['camera','.camera-tools','Câmera'],['map','.exploration-minimap','Minimapa'],
 ['players','#player-roster','Jogadores'],['room','.online-room-panel:not(.room-waiting)','Sala online'],
 ['objective','.worldhead > div:first-child','Objetivo'],['wave','.worldhead > .wavepill','Prova'],['quick-tools','.mobile-hud-tools','Mapa e mochila'],
 ['navigation','.line-camera-nav','Navegação'],['hero-status','.hero-status-strip','Estados do herói'],['narrator','.narrator-pill','Narrador'],
 ['tournament-navigation','.bt-map-nav','Navegação do torneio'],
 ['ro-player','.ro-mobile-player','Personagem'],['ro-menu','.ro-mobile-top nav','Expedição'],
 ['ro-vitals','.bonk-vitals','Vida e mana'],['ro-skills','.ro-skill-dock','Habilidades'],
 ['ro-objective','.ro-mobile-objective','Objetivo'],['ro-auto','.ro-mobile-auto','Ataque automático'],
 ['ro-top','.bonk-top','Expedição'],['ro-goals','.bonk-hud-content > .bonk-goals','Jornada'],
 ['ro-xp','.bonk-xp','Experiência'],['ro-job','.ro-job-progress','Classe'],
 ['ro-tools','.ro-mode-tools','Habilidades e visual'],['ro-environment','.ro-environment-status','Ambiente'],['ro-cast','.ro-cast-bar','Conjuração'],
 ['ro-build','.bonk-build:not(.expanded)','Equipamentos'],['ro-interact','.bonk-controls','Interação'],
 ['ro-joystick','.bonk-joystick','Movimento'],['ro-actions','.bonk-touch-actions','Ações'],
];

export function installHudLayout(doc=document,win=window,{world=doc.getElementById('world'),getState=()=>null,getUserId=()=> 'local',onStatus=()=>{}}={}){
 if(!world)return null;
 let storage;try{storage=win.localStorage;}catch{}
 let user=null,store=null,scope='',active=null,mutated=false;
 const records=new Map(),props=['position','left','top','right','bottom','transform','width','max-width','max-height','margin','z-index'];
 const bounds=()=>{const r=world.getBoundingClientRect(),left=Math.max(0,r.left),top=Math.max(0,r.top)+24;return {left,top,width:Math.max(32,Math.min(r.width,win.innerWidth-left)),height:Math.max(32,Math.min(r.height-24,win.innerHeight-top))};};
 const size=el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};};
 function clearPosition(record){for(const [prop,value,priority]of record.styles){if(value)record.el.style.setProperty(prop,value,priority);else record.el.style.removeProperty(prop);}record.el.classList.remove('hud-positioned');}
 function place(record,position,normalized=false){
  const el=record.el,b=bounds();el.classList.add('hud-positioned');
  el.style.setProperty('position','fixed','important');el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');el.style.setProperty('transform','none','important');
  // Freeze the natural width before detaching a flex/grid child from its parent.
  el.style.setProperty('width',record.width+'px','important');el.style.setProperty('max-width',Math.max(32,b.width-12)+'px','important');el.style.setProperty('max-height',Math.max(32,b.height-12)+'px','important');
  el.style.setProperty('margin','0','important');
  // Container queries/filters may establish a containing block for fixed
  // descendants. Measure that origin instead of assuming the viewport is it.
  el.style.setProperty('left','0px','important');el.style.setProperty('top','0px','important');
  const origin=el.getBoundingClientRect(),dimensions={width:origin.width,height:origin.height},p=normalized?restoreHudPosition(position,dimensions,b):clampHudPosition(position,dimensions,b);
  el.style.setProperty('left',(p.left-origin.left)+'px','important');el.style.setProperty('top',(p.top-origin.top)+'px','important');
  return p;
 }
 function restore(record){const p=store.get(scope,record.id);if(p&&record.el.getClientRects().length){if(!record.width)record.width=size(record.el).width;place(record,p,true);}}
 function save(record){const p=record.el.getBoundingClientRect();return store.set(scope,record.id,normalizeHudPosition(p,size(record.el),bounds()));}
 function finish(cancel=false){if(!active)return;const {record,origin,pointerId,handle,wasPositioned}=active;active=null;doc.body.classList.remove('hud-layout-dragging');record.el.classList.remove('hud-is-dragging');if(cancel){if(wasPositioned)place(record,origin);else clearPosition(record);}else onStatus(save(record)?'Posição salva neste navegador.':'Posição ajustada nesta sessão.');try{handle.releasePointerCapture(pointerId);}catch{}}
 function begin(event,record,handle){
  if(event.button!==undefined&&event.button!==0||event.isPrimary===false)return;
  event.preventDefault();event.stopPropagation();finish();
  const rect=record.el.getBoundingClientRect();record.width=rect.width;const origin={left:rect.left,top:rect.top};
  const wasPositioned=record.el.classList.contains('hud-positioned');place(record,origin);active={record,handle,pointerId:event.pointerId,x:event.clientX,y:event.clientY,origin,wasPositioned};
  record.el.classList.add('hud-is-dragging');doc.body.classList.add('hud-layout-dragging');try{handle.setPointerCapture(event.pointerId);}catch{}
 }
 function register(id,el,label,selector){
  let record=records.get(el);
  if(!record){record={id,el,label,selector,width:0,styles:props.map(p=>[p,el.style.getPropertyValue(p),el.style.getPropertyPriority(p)])};records.set(el,record);el.classList.add('hud-draggable');if(win.getComputedStyle(el).position==='static')el.classList.add('hud-static-origin');el.dataset.hudLayout=id;}
  if(![...el.children].some(c=>c.classList.contains('hud-drag-handle'))){
   // A span is valid inside the player/health buttons; never nest a button in a button.
   const handle=doc.createElement('span');handle.className='hud-drag-handle';handle.tabIndex=0;handle.setAttribute('role','button');handle.setAttribute('aria-label','Mover '+label+'. Use as setas para ajustar.');handle.title='Arraste para mover '+label+' · setas para ajustar';handle.innerHTML='<svg viewBox="0 0 20 12" aria-hidden="true"><path d="M5 3h1m4 0h1m4 0h1M5 9h1m4 0h1m4 0h1"/></svg>';
   handle.addEventListener('pointerdown',e=>begin(e,record,handle));handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
   handle.addEventListener('keydown',e=>{if(e.key==='Escape'){if(active){e.preventDefault();e.stopPropagation();finish(true);}return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))return;e.preventDefault();e.stopPropagation();if([' ','Enter'].includes(e.key)){onStatus('Use as setas para mover '+label+'.');return;}record.width=size(el).width;const r=el.getBoundingClientRect(),step=e.shiftKey?24:8;place(record,{left:r.left+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),top:r.top+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)});save(record);});
   el.prepend(handle);mutated=true;
  }
  return record;
 }
 function refresh(){
  const nextUser=String(getUserId()||'local'),b=bounds(),nextScope=(getState()?.options?.mode||'classic')+':'+(b.width<b.height?'portrait':b.width<=1024?'landscape':'desktop');
  const changed=nextUser!==user||nextScope!==scope;
  if(changed){finish();for(const r of records.values()){clearPosition(r);r.width=0;}user=nextUser;scope=nextScope;store=createHudLayoutStore(storage,user);}
  for(const [el,r]of records)if(!el.isConnected)records.delete(el);else if(r.selector&&!el.matches(r.selector)){if(active?.record===r)finish(true);clearPosition(r);el.querySelector(':scope > .hud-drag-handle')?.remove();el.classList.remove('hud-draggable','hud-static-origin');delete el.dataset.hudLayout;records.delete(el);}
  for(const [id,selector,label]of BARS)for(const el of world.querySelectorAll(selector)){if(!records.has(el)){const dimensions=size(el);if(dimensions.width<8||dimensions.height<4)continue;}const added=!records.has(el),r=register(id,el,label,selector);if((added||changed||!active)&&active?.record!==r)restore(r);}
  // Resources live in the topbar and can also be placed inside the game viewport.
  for(const el of doc.querySelectorAll('.hud-resources')){const r=register('resources',el,'Recursos','.hud-resources');if(active?.record!==r)restore(r);}
 }
 const move=e=>{if(!active||e.pointerId!==active.pointerId)return;e.preventDefault();const a=active;place(a.record,{left:a.origin.left+e.clientX-a.x,top:a.origin.top+e.clientY-a.y});};
 const up=e=>{if(active&&e.pointerId===active.pointerId)finish(e.type==='pointercancel');};
 const blur=()=>finish(true),resize=()=>{finish();for(const r of records.values()){clearPosition(r);r.width=0;}refresh();};
 doc.addEventListener('pointermove',move,{passive:false});doc.addEventListener('pointerup',up);doc.addEventListener('pointercancel',up);win.addEventListener('blur',blur);win.addEventListener('resize',resize);win.visualViewport?.addEventListener('resize',resize);
 let scheduled=false;
 const observer=win.MutationObserver?new win.MutationObserver(()=>{if(mutated){mutated=false;return;}if(scheduled)return;scheduled=true;win.requestAnimationFrame(()=>{scheduled=false;refresh();});}):null;
 observer?.observe(world,{childList:true,subtree:true});refresh();
 return {refresh,remeasure(el){const r=records.get(el);if(!r||active?.record===r)return;clearPosition(r);r.width=0;restore(r);},reset(){finish();store.reset();for(const r of records.values()){clearPosition(r);r.width=0;}onStatus('Posições padrão restauradas.');refresh();},destroy(){finish();observer?.disconnect();doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',up);win.removeEventListener('blur',blur);win.removeEventListener('resize',resize);win.visualViewport?.removeEventListener('resize',resize);for(const r of records.values()){clearPosition(r);r.el.querySelector(':scope > .hud-drag-handle')?.remove();r.el.classList.remove('hud-draggable','hud-static-origin');delete r.el.dataset.hudLayout;}}};
}
