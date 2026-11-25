const actions={campaign:['ready','Iniciar próxima prova'],tower:['ready','Iniciar próximo andar'],best:['ready','Iniciar próxima prova'],war:['ready','Iniciar próxima prova'],castlefight:['ready','Iniciar Castle Fight'],treetag:['ttReady','Iniciar Tree Tag'],kodotag:['ktReady','Iniciar Kodo Tag'],phasekiller:['pkReady','Estou pronto'],dungeon:['dgReady','Iniciar expedição'],bloody:['btReady','Enviar meu exército'],bonk:['bkReady','Iniciar expedição'],warlock:['wlReady','Pronto para lutar']};
export function preparationAction(state,unit){
 if(!state||!unit)return null;
 const mode=state.options?.mode,entry=Object.hasOwn(actions,mode)?actions[mode]:null,room=state.onlineRoom;
 if(!entry||room&&(['waiting','selecting'].includes(room.stage)||room.started===false&&room.stage!=='recruiting'))return null;
 if(mode==='warlock'){if(state.warlock?.phase!=='shop'||(state.time||0)<(state.warlock.resultUntil||0))return null;}
 else if(state.phase!=='preparation')return null;
 if(mode==='bonk'&&(state.bonk?.stage!=='preparation'||room&&room.isHost!==true))return null;
 const emptyArmy=mode==='bloody'&&!unit.btRoster?.length,disabled=!!unit.ready||emptyArmy;
 return {command:{type:entry[0]},label:unit.ready?'Pronto · aguardando':emptyArmy?'Recrute um grupo para iniciar':entry[1],disabled};
}

export function expeditionTimerReadyMarkup(state,unit){
 const action=preparationAction(state,unit);if(action?.command.type!=='bkReady')return '';
 return `<button type="button" class="hud-ready-button ro-timer-ready" data-bk-ready ${action.disabled?'disabled':''}>${action.label}</button>`;
}

export function expeditionPreparationClockMarkup(state,unit){
 const elapsed=Math.max(0,Math.floor(state?.bonk?.elapsed||0)),clock=Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0'),action=expeditionTimerReadyMarkup(state,unit);
 return `<div class="ro-preparation-clock" data-ro-preparation-clock><small>TEMPO DA EXPEDIÇÃO</small><b>${clock}</b>${action||'<p>Aguarde o host iniciar a expedição.</p>'}</div>`;
}
