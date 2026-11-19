import {HEROES} from '../shared/catalog.js';
import {portrait} from './art.js';

const MODES=new Set(['campaign','tower','best','war']);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const amount=value=>Number.isFinite(value)?Math.max(0,value).toLocaleString('pt-BR',{maximumFractionDigits:0}):'—';
const gold=value=>Number.isFinite(value)?'+'+amount(value):'—';
export function formatWaveTime(seconds){if(!Number.isFinite(seconds)||seconds<0)return '—';const tenths=Math.round(seconds*10),minutes=Math.floor(tenths/600),rest=Math.floor(tenths%600/10),decimal=tenths%10;return minutes+':'+String(rest).padStart(2,'0')+','+decimal;}
export const waveResultKey=result=>result&&Array.isArray(result.rows)?[result.kind||'wave',result.id??[result.mode,result.wave,result.finishedAt].join('|')].join('|'):null;
export const waveResultTitle=result=>result?.label||((result?.kind==='bonus'?'Bônus da onda ':result?.mode==='tower'?'Andar ':'Onda ')+result?.wave);
export function waveRewardPolicyText(policy={}){
 if(typeof policy.description==='string')return policy.description;
 const parts=[];if(policy.ranking==='completion-time')parts.push('Posição pelo tempo; empates a '+Number(policy.timePrecision||.1).toLocaleString('pt-BR')+' s.');
 if(Number.isFinite(policy.performanceCap)&&Number.isFinite(policy.catchupCap))parts.push('Extras limitados a '+gold(policy.performanceCap)+' por desempenho e '+gold(policy.catchupCap)+' de recuperação.');
 if(policy.equalizationFraction>0)parts.push('A recuperação compensa '+Math.round(policy.equalizationFraction*100)+'% da diferença de desempenho e considera os prêmios anteriores.');
 if(policy.requiresContribution)parts.push('Extras exigem participação real.');return parts.join(' ')||'A recompensa base e os apoios de recuperação estão separados do bônus de desempenho.';
}
function statusOf(row){if(row.status==='unmeasured')return{key:'incomplete',label:'Sem tempo registrado'};const fell=row.status==='fallen-team-clear'||row.status==='fallen'||row.status==='dead'||row.survived===false||row.fallen===true||row.alive===false;return fell?{key:'fallen',label:row.completed?'Caiu · equipe concluiu':'Caiu'}:row.completed?{key:'completed',label:'Concluiu'}:{key:'incomplete',label:'Não concluiu'};}
function timeMarkup(row){return Number.isFinite(row.time)&&row.time>=0?`<time datetime="PT${row.time}S" aria-label="${row.time.toLocaleString('pt-BR',{maximumFractionDigits:1})} segundos">${formatWaveTime(row.time)}</time>`:'<span class="wr-no-time" aria-label="Sem tempo registrado">—</span>';}
function standingMarkup(result,standings,owner){if(result.mode==='tower'||!standings.length)return '';return `<section class="wr-ranking" aria-label="Classificação acumulada"><h4>Classificação acumulada</h4><ol>${standings.map((row,i)=>`<li ${row.owner===owner?'data-own="true"':''}><b>${i+1}º</b><span>${escape(row.name||'Equipe '+row.team)}</span><strong>${amount(row.score)} <small>pts</small></strong></li>`).join('')}</ol></section>`;}
export function waveResultsMarkup(result,{owner=null,standings=[],history=[]}={}){
 if(!result||!Array.isArray(result.rows)||!result.rows.length)return '<p class="wr-empty">O resultado aparece quando todos terminarem a onda.</p>';
 const teamTime=result.timeBasis==='team'||['war','tower'].includes(result.mode),cooperative=result.mode==='tower',title=waveResultTitle(result),policy=waveRewardPolicyText(result.policy);
 return `<header class="wr-header"><div><small>${result.kind==='bonus'?'RESULTADO DO BÔNUS':'RESULTADO DA '+(cooperative?'EXPEDIÇÃO':'ONDA')}</small><h3 id="wave-results-title">${escape(title)}</h3><p>${cooperative?'Tempo compartilhado da equipe.':teamTime?'Tempo por equipe, sem disputa entre aliados.':'Tempo de conclusão de todos os competidores.'}</p></div><button type="button" data-wave-close aria-label="Fechar resultado ${escape(title)}">×</button></header><div class="wr-table-scroll" tabindex="0" role="region" aria-label="Tempos e recompensas de todos os jogadores"><table class="wr-table"><caption class="wr-sr-only">${escape(title)} · ${teamTime?'tempo da equipe':'tempo individual'} e ouro recebido</caption><thead><tr>${cooperative?'':'<th scope="col">Pos.</th>'}<th scope="col">Herói</th><th scope="col">${teamTime?'Tempo da equipe':'Tempo'}</th><th scope="col">Vida</th><th scope="col">Recompensa</th></tr></thead><tbody>${result.rows.map(row=>{const status=statusOf(row),isOwn=row.owner===owner,avatar=Object.hasOwn(HEROES,row.hero)?portrait(row.hero):'',ratio=Number.isFinite(row.hpRatio)?Math.max(0,Math.min(1,row.hpRatio)):null;return `<tr ${isOwn?'data-own="true"':''}><td class="wr-place" ${cooperative?'hidden':''}>${Number.isFinite(row.rank)?row.rank+'º':'—'}</td><th scope="row"><div class="wr-identity">${avatar}<span><b>${escape(row.name||HEROES[row.hero]?.name||'Herói')}${isOwn?' <em>você</em>':''}</b>${teamTime?`<small>${cooperative?'Expedição cooperativa':'Equipe '+escape(row.team??'—')}</small>`:''}<small class="wr-status ${status.key}">${status.label}</small></span></div></th><td class="wr-time">${timeMarkup(row)}</td><td class="wr-life">${ratio===null?'—':Math.round(ratio*100)+'%'}<span aria-hidden="true"><i style="width:${ratio===null?0:ratio*100}%"></i></span></td><td class="wr-payment"><strong aria-label="Total recebido: ${amount(row.totalGold)} de ouro">◆ ${gold(row.totalGold)}</strong><dl><div><dt>Base</dt><dd>${gold(row.baseGold)}</dd></div><div><dt>Desempenho</dt><dd>${gold(row.performanceGold)}</dd></div><div ${row.catchupGold>0?'class="wr-catchup"':''}><dt>Recuperação</dt><dd>${gold(row.catchupGold)}</dd></div></dl></td></tr>`;}).join('')}</tbody></table></div><p class="wr-policy">${escape(policy)}</p>${standingMarkup(result,standings,owner)}${history.length>1?`<nav class="wr-history" aria-label="Resultados recentes">${[...history].sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0)).slice(0,5).map(previous=>`<button type="button" data-wave-history="${escape(waveResultKey(previous))}" aria-pressed="${waveResultKey(previous)===waveResultKey(result)}">${escape(waveResultTitle(previous))}</button>`).join('')}</nav>`:''}<footer class="wr-footer"><span>A partida continua. Reveja em <b>Competição</b>.</span><button type="button" data-wave-close>Voltar ao campo</button></footer>`;
}

// A nonmodal region: opening it never changes pause state, takes pointer input
// outside the panel, or steals keyboard focus from an ongoing battle.
export function createWaveResultsUI({host=document.body,onFocusGame=()=>{}}={}){
 const panel=document.createElement('section');panel.className='wave-results-panel';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','wave-results-title');host.append(panel);
 const live=document.createElement('div');live.className='wr-sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');host.append(live);
 let current=null,owner=null,seen=null,pending=null,opened=false,automatic=false,signature='',disposed=false,displayKey=null;
 const supported=snapshot=>MODES.has(snapshot?.options?.mode),resultOf=snapshot=>supported(snapshot)&&Array.isArray(snapshot.waveResults?.rows)&&snapshot.waveResults.rows.length?snapshot.waveResults:null;
 function render(){const result=(current?.roundResults||[]).find(result=>waveResultKey(result)===displayKey)||resultOf(current),key=JSON.stringify([result,current?.standings,current?.roundResults,owner]);if(key!==signature){signature=key;panel.innerHTML=waveResultsMarkup(result,{owner,standings:current?.standings||[],history:current?.roundResults||[]});}}
 function close({focusGame=false}={}){if(disposed)return;opened=false;automatic=false;panel.hidden=true;if(focusGame)onFocusGame();}
 function open(snapshot=current,player=owner,{focus=false,auto=false,result=null}={}){if(disposed||!resultOf(snapshot))return false;current=snapshot;owner=player;seen=waveResultKey(resultOf(snapshot));pending=null;displayKey=waveResultKey(result||resultOf(snapshot));opened=true;automatic=auto;render();panel.hidden=false;if(focus)panel.querySelector('[data-wave-close]')?.focus({preventScroll:true});return true;}
 panel.addEventListener('click',event=>{if(event.target.closest?.('[data-wave-close]'))close({focusGame:true});const button=event.target.closest?.('[data-wave-history]');if(button){const result=(current?.roundResults||[]).find(result=>waveResultKey(result)===button.dataset.waveHistory);if(result){open(current,owner,{result});panel.querySelector('[data-wave-history][aria-pressed="true"]')?.focus({preventScroll:true});}}});panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close({focusGame:true});}});
 return{
  open,close,isOpen:()=>opened&&!panel.hidden,
  update(snapshot,player,{suppressed=false}={}){
   if(disposed)return;current=snapshot;owner=player;if(!supported(snapshot)){close();pending=null;return;}
   const result=resultOf(snapshot),key=waveResultKey(result);if(key&&key!==seen){seen=key;pending=key;live.textContent='Resultado de '+waveResultTitle(result)+' disponível. Tempos e recompensas em Competição.';}
   const battle=['wave','bonus','final'].includes(snapshot.phase);if(automatic&&battle)close({focusGame:panel.contains(document.activeElement)});
   if(pending&&battle&&result&&snapshot.wave>result.wave)pending=null;
   if(pending&&!battle&&!suppressed){pending=null;open(snapshot,player,{auto:true});}
   if(opened){render();panel.hidden=suppressed;}
  },
  reset(){close();current=null;owner=null;seen=pending=null;signature='';displayKey=null;live.textContent='';},
  destroy(){if(disposed)return;disposed=true;panel.remove();live.remove();}
 };
}
