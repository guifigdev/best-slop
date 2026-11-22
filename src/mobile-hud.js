// This layer only changes presentation. Commands still use the existing HUD
// controls, including the original ready button and all six inventory slots.
export function installMobileHUD(doc=document,win=window,{onMove}={}){
 const body=doc.body,side=doc.querySelector('.side'),world=doc.getElementById('world'),topbar=doc.querySelector('.topbar');
 if(!side||!world||!topbar)return;
 const media=win.matchMedia('(max-width: 1024px)'),button=(id,label,controls)=>{const el=doc.createElement('button');el.type='button';el.id=id;el.textContent=label;el.setAttribute('aria-expanded','false');if(controls)el.setAttribute('aria-controls',controls);return el;};
 side.id='game-panel';doc.getElementById('talk')?.setAttribute('aria-label','Conversar com Hugin');
 const panel=button('mobile-panel-toggle','Painel','game-panel');panel.className='mobile-panel-toggle';panel.innerHTML='<span>Painel</span><small class="mobile-wallet"></small><span class="mobile-panel-chevron" aria-hidden="true">⌃</span>';side.prepend(panel);
 const menu=button('mobile-menu-toggle','Menu','game-navigation');menu.className='mobile-menu-toggle';topbar.querySelector('.toplinks').id='game-navigation';topbar.append(menu);
 const tools=doc.createElement('div');tools.className='mobile-hud-tools';tools.setAttribute('aria-label','Painéis do jogo');
 const inventory=button('mobile-inventory-toggle','Mochila','inventory'),camera=button('mobile-camera-toggle','Visão'),map=button('mobile-map-toggle','Mapa');tools.append(inventory,camera,map);world.append(tools);
 const move=button('mobile-move-control','Mover');move.className='mobile-move-control';move.removeAttribute('aria-expanded');move.setAttribute('aria-label','Mover: toque no destino');move.addEventListener('click',()=>onMove?.());doc.querySelector('.skilldock').prepend(move);
 const start=doc.querySelector('.start-modal'),actions=start?.querySelector('.modal-actions');
 if(start&&actions){const scroll=doc.createElement('div');scroll.className='start-scroll';while(start.firstChild&&start.firstChild!==actions)scroll.append(start.firstChild);start.prepend(scroll);}
 const controls=[[panel,'mobile-panel-open'],[menu,'mobile-menu-open'],[inventory,'mobile-inventory-open'],[camera,'mobile-camera-open'],[map,'mobile-map-open']];
 const set=(el,cls,open)=>{body.classList.toggle(cls,open);el.setAttribute('aria-expanded',String(open));};
 for(const [el,cls]of controls)el.addEventListener('click',()=>{const open=!body.classList.contains(cls);if(el===inventory||el===map){set(inventory,'mobile-inventory-open',false);set(map,'mobile-map-open',false);}set(el,cls,open);});
 const refresh=()=>{const minimap=world.querySelector('.exploration-minimap');map.hidden=!minimap||minimap.hidden;const label='◆ '+(doc.getElementById('gold')?.textContent||'0'),wallet=panel.querySelector('.mobile-wallet');if(wallet.textContent!==label)wallet.textContent=label;};
 const sync=()=>{body.classList.toggle('mobile-ui',media.matches);for(const [el,cls]of controls)set(el,cls,false);refresh();};
 media.addEventListener('change',sync);sync();
 const observer=new MutationObserver(refresh),gold=doc.getElementById('gold');if(gold)observer.observe(gold,{childList:true,subtree:true,characterData:true});observer.observe(world,{childList:true});
 doc.querySelector('.toplinks').addEventListener('click',e=>{if(e.target.closest('button'))set(menu,'mobile-menu-open',false);});
 doc.addEventListener('pointerdown',e=>{if(!topbar.contains(e.target))set(menu,'mobile-menu-open',false);});
 doc.addEventListener('keydown',e=>{if(e.key!=='Escape'||!media.matches)return;for(const [el,cls]of [...controls].reverse())if(body.classList.contains(cls)){set(el,cls,false);el.focus();break;}});
 doc.getElementById('newgame')?.addEventListener('click',sync);
 const startModal=doc.getElementById('startmodal'),startObserver=new MutationObserver(()=>{if(startModal?.classList.contains('hidden'))for(const [el,cls]of controls)set(el,cls,false);});if(startModal)startObserver.observe(startModal,{attributes:true,attributeFilter:['class']});
 // A menu-selected target must become visible when the sidebar is folded.
 doc.addEventListener('click',e=>{if(!media.matches)return;if(e.target.closest('[data-tab]'))set(panel,'mobile-panel-open',true);});
 return{refresh,close(){for(const [el,cls]of controls)set(el,cls,false);}};
}
