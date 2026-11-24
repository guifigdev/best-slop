import './game-pause-menu.css';
export function createGamePauseMenu({getState,isOnline=()=>false,onPause,onResume,onVisual,onSettings,onResetLayout,onNewGame,document:doc=globalThis.document}={}){
 let root=null,previous=null;
 const close=()=>{if(!root)return false;root.remove();root=null;return true;};
 function resume(){close();onResume?.();previous?.focus?.({preventScroll:true});}
 function open(){if(root){resume();return;}previous=doc.activeElement;onPause?.();root=doc.createElement('div');root.id='game-pause-modal';root.className='game-pause-backdrop';root.innerHTML=`<section class="game-pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><span class="eyebrow">MENU DO JOGO</span><h2 id="pause-title">Uma pausa na aventura</h2><p>${isOnline()?'A sala online continua enquanto o menu está aberto.':'O jogo está pausado.'}</p><button class="primary" data-pause-action="resume">▶ Voltar ao jogo</button><div class="game-pause-options"><button data-pause-action="visual">☀ Visual e iluminação</button><button data-pause-action="settings">⚙ Configurações</button><button data-pause-action="layout">⤢ Restaurar posições da HUD</button><button data-pause-action="new">↪ Nova partida</button></div><small>Arraste as alças das barras para organizar sua interface.</small></section>`;doc.body.append(root);
  root.onclick=e=>{if(e.target===root){resume();return;}const action=e.target.closest('[data-pause-action]')?.dataset.pauseAction;if(!action)return;if(action==='resume')resume();else if(action==='layout'){onResetLayout?.();}else{close();if(action==='visual')onVisual?.();if(action==='settings')onSettings?.();if(action==='new')onNewGame?.();}};
  root.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();resume();}if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}}};root.querySelector('button').focus({preventScroll:true});
 }
 return{open,close,resume,isOpen:()=>!!root};
}
