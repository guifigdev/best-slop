import {escapeHTML as esc} from './competition-ui.js';
export function constructionQueueState(state,actor,mode){
 const prefix=mode==='kodotag'?'kodoTag':'treeTag',buildings=state?.[prefix]?.buildings||[],pending=id=>buildings.find(b=>b.id===id&&b.alive&&b.workRemaining>0),active=actor?.[prefix+'Action']?.type==='build'&&pending(actor[prefix+'Action'].target),queue=[...new Set(actor?.[prefix+'BuildQueue']||[])].filter(pending),paused=!!actor?.[prefix+'BuildPaused']&&queue.length>0,count=queue.length+(active&&!queue.includes(active.id)?1:0),target=active||pending(queue[0]);
 const status=paused?'Fila pausada · '+count+' obra(s)':active?(actor[prefix+'Blocked']?'Sem acesso à borda da construção':(actor[prefix+'Working']||mode==='kodotag'&&actor.working)?'Construindo '+active.name:'Caminhando para a obra')+(queue.length?' · '+queue.length+' na fila':''):count?'Na fila · aguardando trabalhador':'';
 return {paused,count,status,target};
}
export function constructionQueueMarkup(state,actor,mode){const q=constructionQueueState(state,actor,mode);if(!q.count)return '';const attr=mode==='kodotag'?'data-kt-resume':'data-legacy-resume';return '<section class="legacy-hint construction-queue" aria-live="polite"><p>'+esc(q.status)+'</p>'+(q.paused?'<button '+attr+'="'+q.target.id+'">Retomar fila · '+q.count+' obra(s)</button>':'')+'</section>';}
