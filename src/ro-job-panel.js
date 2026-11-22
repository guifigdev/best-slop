import {escapeHTML as esc} from './competition-ui.js';
import {ragnarokJobPortrait} from './ragnarok-job-art.js';
export function roJobProgressMarkup(b,u){
 const p=b.jobProgress;if(!p)return '';const percent=p.level>=p.cap?100:Math.max(0,Math.min(100,p.xp/p.xpNeeded*100));
 return `<button class="ro-job-progress ${p.ready?'ready':''}" data-bk-job aria-label="Classe ${esc(b.job.name)}, nível de classe ${p.level} de ${p.cap}${p.ready?', evolução disponível':''}"><span>${esc(b.job.name)} · Job ${p.level}/${p.cap}</span><i><em style="width:${percent}%"></em></i><small>${p.ready?'Evoluir para '+esc(p.next.name)+' →':'Ver roupa e evolução'}</small></button>`;
}
export function roJobEvolutionMarkup(b,u){
 const p=b.jobProgress;if(!p)return '';const next=p.next;
 return `<section class="bonk-stage-card ro-job-evolution" role="dialog" aria-modal="true" aria-labelledby="ro-job-title"><small>BASE ${u.level} · CLASSE ${p.level}/${p.cap}</small><h2 id="ro-job-title">${p.ready?'Sua próxima classe':'Evolução de classe'}</h2><p>A experiência de base concede atributos e escolhas de build. A experiência de classe libera a próxima profissão e sua roupa.</p><div class="ro-job-outfits"><article>${ragnarokJobPortrait(b.job.key)}<b>${esc(b.job.name)}</b><small>Roupa atual</small></article>${next?`<span aria-hidden="true">→</span><article>${ragnarokJobPortrait(next.key)}<b>${esc(next.name)}</b><small>${p.ready?'Evolução disponível':'Libera em Job '+p.cap}</small></article>`:''}</div>${p.ready?`<button class="primary" data-bk-evolve>Escolher ${esc(next.name)}</button>`:`<p>${next?'Continue ganhando experiência de classe para evoluir.':'Você alcançou a quarta classe.'}</p>`}<button class="secondary" data-bk-job>Continuar com a classe atual</button></section>`;
}
