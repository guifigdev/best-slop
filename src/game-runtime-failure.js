// Keep the actual exception available when an animation frame stops. No account
// data is included, and this diagnostic stays on the player's device.
export const GAME_RUNTIME_FAILURE_KEY='custom-hero-runtime-failure-v1';
export function gameRuntimeFailure(error,{stage='frame',state=null}={}){
 return {version:1,at:new Date().toISOString(),stage,mode:state?.options?.mode||null,
  time:Number.isFinite(state?.time)?state.time:null,region:state?.bonk?.map?.route?.key||state?.bonk?.map?.stageKey||null,
  message:String(error?.message||error||'Erro desconhecido').slice(0,2000),stack:String(error?.stack||'').slice(0,8000)};
}
export function showGameRuntimeFailure(error,context={},doc=document,win=window){
 const report=gameRuntimeFailure(error,context),text=JSON.stringify(report,null,2);
 try{win.localStorage.setItem(GAME_RUNTIME_FAILURE_KEY,text);}catch{/* A full save store must not hide the exception. */}
 win.console?.error('Game frame failed',report,error);
 if(doc.querySelector('[data-game-runtime-failure]'))return report;
 const panel=doc.createElement('section');panel.setAttribute('data-game-runtime-failure','');panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','game-runtime-failure-title');
 panel.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#071b18d9;padding:20px;color:#f7edce;font:14px/1.5 sans-serif';
 const card=doc.createElement('div');card.style.cssText='width:min(560px,100%);max-height:85vh;overflow:auto;background:#183c33;border:1px solid #ddbf75;border-radius:12px;padding:24px;box-sizing:border-box';
 const heading=doc.createElement('h2');heading.id='game-runtime-failure-title';heading.textContent='O jogo foi interrompido';
 const message=doc.createElement('p');message.textContent='Houve um erro durante a partida. Os detalhes abaixo ajudam a identificar a causa.';
 const details=doc.createElement('details'),summary=doc.createElement('summary'),code=doc.createElement('pre');summary.textContent='Ver erro';code.textContent=text;code.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';details.append(summary,code);
 const actions=doc.createElement('div');actions.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin-top:20px';
 const copy=doc.createElement('button');copy.textContent='Copiar erro';copy.onclick=async()=>{try{await win.navigator.clipboard.writeText(text);copy.textContent='Erro copiado';}catch{details.open=true;copy.textContent='Selecione e copie o erro acima';}};
 const reload=doc.createElement('button');reload.textContent='Recarregar jogo';reload.onclick=()=>win.location.reload();
 actions.append(copy,reload);card.append(heading,message,details,actions);panel.append(card);doc.body.append(panel);copy.focus();return report;
}
