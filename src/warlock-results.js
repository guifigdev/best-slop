import {legacyCharacterPortrait} from './legacy-character-art.js';
import {escapeHTML as esc} from './competition-ui.js';
export function warlockRanking(state){
 const units=(state?.units||[]).filter(u=>u.warlockCharacter&&!u.wlGhost),rows=units.map(u=>({owner:u.owner,name:u.name,character:u.warlockCharacter,score:Number.isFinite(u.score)?u.score:0,seat:u.seat||0})).sort((a,b)=>b.score-a.score||a.seat-b.seat);let previous=null,rank=0;
 return rows.map((row,i)=>{if(row.score!==previous)rank=i+1;previous=row.score;return{...row,rank,winner:i===0||row.score===rows[0].score};});
}
export function warlockResultsMarkup(state,owner){
 const rows=warlockRanking(state),you=rows.find(r=>r.owner===owner),winners=rows.filter(r=>r.winner),title=you?.winner?(winners.length>1?'Vitória compartilhada!':'Você venceu!'):'Duelo encerrado';
 return `<div class="eyebrow">WARLOCK · CLASSIFICAÇÃO FINAL</div><h3>${title}</h3><p>${state.warlock?.round||0} rodadas disputadas · cada vitória de rodada vale 1 ponto.</p><table class="warlock-final-ranking"><caption>Pontuação de todos os jogadores</caption><thead><tr><th scope="col">Pos.</th><th scope="col">Jogador</th><th scope="col">Pontos</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.winner?'winner ':''}${r.owner===owner?'you':''}"><td>${r.rank}º</td><th scope="row"><span class="warlock-ranking-player">${legacyCharacterPortrait('warlock',r.character)}<span>${esc(r.name)}${r.owner===owner?'<small>Você</small>':''}${r.winner?'<small>Campeão'+(winners.length>1?' · empate':'')+'</small>':''}</span></span></th><td><strong>${r.score}</strong></td></tr>`).join('')}</tbody></table><button class="primary">Nova partida</button>`;
}
