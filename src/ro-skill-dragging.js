// Delegation survives HUD snapshot patches. Desktop drag/drop, touch dragging
// and Alt+arrow keyboard moves all use the same authoritative equip command.
export function installRoSkillDragging(host,{onMove,enabled=()=>true}={}){
 let dragged=null,touch=null,over=null,suppressClick=false;
 const source=e=>e.target.closest?.('[data-bk-drag-skill]'),destination=e=>e.target.closest?.('[data-bk-drop-skill-slot]');
 const highlight=cell=>{over?.classList.remove('ro-skill-drop-target');over=cell;over?.classList.add('ro-skill-drop-target');};
 const clear=()=>{highlight(null);dragged=null;touch=null;host.classList.remove('ro-skill-dragging');};
 const moveTo=cell=>{const slot=Number(cell?.dataset.bkDropSkillSlot);if(dragged&&slot>=1&&slot<=12&&enabled()){onMove(dragged,slot);cell.focus?.({preventScroll:true});}};
 const start=e=>{const cell=source(e);if(!cell||!enabled())return;dragged=cell.dataset.bkDragSkill;host.classList.add('ro-skill-dragging');if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged);}};
 const dragOver=e=>{const cell=destination(e);if(!dragged||!cell||!enabled())return;e.preventDefault();highlight(cell);if(e.dataTransfer)e.dataTransfer.dropEffect='move';};
 const drop=e=>{if(!dragged)return;e.preventDefault();moveTo(destination(e));clear();};
 const down=e=>{if(e.button>0||e.isPrimary===false||!enabled())return;const cell=source(e);if(!cell)return;e.preventDefault();cell.focus?.({preventScroll:true});touch={id:e.pointerId,x:e.clientX,y:e.clientY,key:cell.dataset.bkDragSkill};host.setPointerCapture?.(e.pointerId);};
 const pointerMove=e=>{if(!touch||touch.id!==e.pointerId)return;if(!dragged&&Math.hypot(e.clientX-touch.x,e.clientY-touch.y)<8)return;e.preventDefault();dragged=touch.key;host.classList.add('ro-skill-dragging');highlight(host.ownerDocument.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-bk-drop-skill-slot]'));};
 const up=e=>{if(!touch||touch.id!==e.pointerId)return;if(dragged){moveTo(over);suppressClick=true;e.preventDefault();}host.releasePointerCapture?.(e.pointerId);clear();};
 const click=e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}};
 const keydown=e=>{if(!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key)||!enabled())return;const cell=source(e);if(!cell)return;const from=Number(cell.dataset.bkDropSkillSlot),to=from+(e.key==='ArrowLeft'?-1:1);if(to<1||to>12)return;e.preventDefault();onMove(cell.dataset.bkDragSkill,to);};
 const listeners=[['dragstart',start],['dragover',dragOver],['drop',drop],['dragend',clear],['pointerdown',down],['pointermove',pointerMove],['pointerup',up],['pointercancel',clear],['keydown',keydown],['click',click,true]];
 for(const [type,fn,capture]of listeners)host.addEventListener(type,fn,capture||false);
 return{destroy(){clear();for(const [type,fn,capture]of listeners)host.removeEventListener(type,fn,capture||false);}};
}
