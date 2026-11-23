import {MODES} from '../shared/modes.js';
import {LOBBY_GAMES,lobbyGameKey} from '../shared/lobby-catalog.js';
import {escapeHTML as esc} from './competition-ui.js';
import {gameIcon} from './game-icons.js';

const choices=(label,key,items,current,disabled)=>`<fieldset class="lobby-rule-group"><legend>${label}</legend><div class="lobby-rule-cards">${items.map(([value,name,description])=>`<button type="button" data-lobby-option="${key}" data-lobby-value="${esc(value)}" aria-pressed="${String(current)===String(value)}" ${disabled?'disabled':''}><b>${esc(name)}</b>${description?`<span>${esc(description)}</span>`:''}</button>`).join('')}</div></fieldset>`;
export function roomSettingsMarkup(room){
 const o=room.options,gameKey=lobbyGameKey(o),disabled=!room.isHost||room.stage&&room.stage!=='waiting'||room.started;
 const games=disabled?LOBBY_GAMES.filter(g=>g.key===gameKey):LOBBY_GAMES;
 let html=`<section class="lobby-game-section"><header><small>JOGO DA SALA</small><h3>${disabled?'Regras do host':'O que vamos jogar?'}</h3></header><div class="lobby-game-cards">${games.map(g=>`<button type="button" data-room-game="${g.key}" aria-pressed="${gameKey===g.key}" ${disabled?'disabled':''}>${gameIcon(g.key)}<span><small>${esc(g.tag)}</small><b>${esc(g.name)}</b><em>${esc(g.description)}</em></span></button>`).join('')}</div></section>`;
 if(gameKey==='survival')html+=choices('Modo de Custom Hero','mode',[
  ['campaign','Clássico','50 ondas e uma grande final.'],['tower','Cooperativo','Ondas sem fim; a equipe enfrenta os chefes.'],['best','Best of All','Provas e pontuação individuais.'],['war','Guerra de equipes','Provas em grupo e confrontos entre equipes.']
 ],o.mode,disabled)+'<p class="lobby-progress-note">Os cenários mudam conforme a expedição avança, a cada dez ondas.</p>';
 if(o.mode==='bonk')html+=choices('Expedição de Ragnarok','bonkActivity',[
  ['adventure','Aventura de Midgard','Explore regiões e evolua em grupo.'],['tower','Torre sem Fim · Ragnarok','Combate survivor nos andares da torre.']
 ],o.bonkActivity,disabled)+choices('Habilidades oferecidas','bonkSkillMode',[
  ['class','Somente minha classe','Habilidades da classe e suas evoluções.'],['mixed','Todas as classes','Combine habilidades de qualquer linhagem.']
 ],o.bonkSkillMode,disabled);
 if(o.mode==='castlefight')html+=choices('Campo de batalha','laneCount',[[2,'Dois corredores','Duas frentes para os exércitos.'],[1,'Um corredor','Uma frente central de combate.']],o.laneCount,disabled);
 if(o.mode==='dungeon')html+=choices('Tamanho do grupo','dungeonPartySize',[[1,'Solo'],[2,'Dupla'],[3,'Trio'],[4,'Quarteto']],o.dungeonPartySize,disabled)+choices('Meta da expedição','dungeonLimit',[[0,'Sem fim'],[50,'50 andares']],o.dungeonLimit,disabled);
 if(o.mode==='tower')html+=choices('Meta cooperativa','towerLimit',[[0,'Sem fim'],[50,'50 ondas'],[100,'100 ondas']],o.towerLimit,disabled);
 if(o.mode==='linewars')html+=choices('Formato','lineTeams',[[false,'Cada um por si'],[true,'Duplas · 2 × 2']],o.lineTeams,disabled);
 if(o.mode==='bloody')html+=choices('Formato','bloodyTeams',[[false,'Cada um por si'],[true,'Equipes']],o.bloodyTeams,disabled);
 if(o.mode==='war')html+=choices('Heróis por equipe','teamSize',[[2,'2 heróis'],[5,'5 heróis']],o.teamSize,disabled)+choices('Número de equipes','teamCount',[[2,'2 equipes'],[3,'3 equipes'],[4,'4 equipes'],[5,'5 equipes']],o.teamCount,disabled)+choices('Confrontos entre equipes','clashEvery',[[5,'A cada 5 ondas'],[10,'A cada 10 ondas']],o.clashEvery,disabled);
 return `<div class="lobby-settings" aria-label="${disabled?'Configuração da sala':'Configuração do host'}">${html}</div>`;
}
