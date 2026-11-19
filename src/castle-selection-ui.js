import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
export function selectedCastleProducers(cf,owner,ids){
 const selection=new Set(ids);
 return (cf?.buildings||[]).filter(b=>selection.has(b.id)&&b.alive&&b.owner===owner&&CASTLE_BUILDINGS[b.key]?.unit);
}
export function castleProductionControls(cf,owner,ids){
 const producers=selectedCastleProducers(cf,owner,ids);if(!producers.length)return '';
 const paused=producers.filter(b=>b.productionPaused).length;
 return `<div class="cf-production-controls"><small>${producers.length===1?'Produção desta construção':producers.length+' construções selecionadas'} · ${paused} pausada${paused===1?'':'s'}</small><button data-cf-production="pause" ${paused===producers.length?'disabled':''}>Ⅱ Pausar produção</button><button data-cf-production="resume" ${paused?'':'disabled'}>▶ Retomar e sincronizar</button><small>Retomar inicia um novo ciclo completo nas selecionadas. Prédios iguais passam a produzir juntos.</small></div>`;
}
