import {CASTLE_BUILDINGS,CASTLE_UNITS} from '../shared/castle-catalog.js';
import {CASTLE_UNIT_CAP} from '../shared/castle-fight.js';
import {castleUnitPortrait} from './castle-unit-art.js';
import {escapeHTML as esc} from './competition-ui.js';

export function castleProductionStatus(cf,building,builders=[]){
 const definition=CASTLE_BUILDINGS[building?.pendingUpgrade||building?.key],unit=typeof definition?.unit==='string'?CASTLE_UNITS[definition.unit]:definition?.unit;
 if(!building?.alive||!unit)return null;
 const builder=builders.find(u=>u.owner===building.owner&&u.castleBuilder),worker=builder?.castleWorker;
 const queued=builder?.castleWorkQueue?.indexOf(building.id)??-1;
 const total=Math.max(.05,building.workTotal||definition.buildTime||1),constructing=building.workRemaining>0;
 const interval=building.spawnInterval||definition.spawnInterval||definition.spawnTime||20;
 const paused=building.productionPaused===true;
 const remaining=constructing?null:paused?Math.max(0,building.productionRemaining??interval):Math.max(0,(building.nextSpawn??cf.elapsed+interval)-cf.elapsed);
 const capped=(cf.units||[]).filter(u=>u.alive&&u.team===building.team).length>=CASTLE_UNIT_CAP;
 const blocked=!constructing&&!paused&&remaining===0;
 const label=constructing?worker?.target===building.id?(worker.state==='working'?'Construindo':worker.state==='blocked'?'Sem passagem para o construtor':'Construtor a caminho'):builder?.castleWorkPaused?'Construção pausada':`Aguardando construtor${queued>=0?' · posição '+(queued+1):''}`:paused?'Produção pausada':blocked?capped?'Produção aguardando espaço no exército':'Saída ocupada · aguardando passagem':'Produzindo';
 return {unit,label,constructing,paused,blocked,remaining,interval,progress:constructing?Math.max(0,Math.min(1,1-building.workRemaining/total)):Math.max(0,Math.min(1,1-remaining/interval))};
}
export function castleProductionPanel(cf,building,builders=[]){
 const status=castleProductionStatus(cf,building,builders);if(!status)return '';
 const {unit,remaining,interval,progress,label,constructing,paused}=status;
 return `<section class="cf-production" aria-label="Produção de ${esc(building.name)}"><div class="cf-production-heading">${castleUnitPortrait(unit)}<div><small>${esc(label)}</small><b>${esc(unit.name)}</b><span>${constructing?'A produção começa após a obra':paused?'Retome para iniciar o próximo ciclo':remaining>0?`Próxima unidade em ${Math.ceil(remaining)}s`:'Próxima unidade pronta'}</span></div></div><div class="cf-production-progress" role="progressbar" aria-label="${constructing?'Construção':'Produção'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress*100)}"><i style="width:${progress*100}%"></i></div><div class="cf-production-queue" aria-label="Ciclo de produção"><div class="current">${castleUnitPortrait(unit)}<small>${constructing?'Após a obra':paused?'Pausada':remaining>0?Math.ceil(remaining)+'s':'Pronta'}</small></div>${[1,2].map(i=>`<div>${castleUnitPortrait(unit)}<small>${constructing?'A seguir':paused?'Após retomar':Math.ceil(remaining+interval*i)+'s'}</small></div>`).join('')}<span title="Produção automática em ciclo">↻ ∞</span></div><p>Produção contínua · uma unidade a cada ${Number(interval.toFixed(1)).toLocaleString('pt-BR')}s. ${paused?'Produção interrompida até retomar.':constructing?'':'A próxima aguarda se a saída estiver bloqueada.'}</p></section>`;
}
