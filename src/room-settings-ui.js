import {MODES} from '../shared/modes.js';
import {escapeHTML as esc} from './competition-ui.js';
import {ARENAS} from '../shared/arenas.js';

const select=(label,key,values,current)=>`<label>${label}<select data-lobby-option="${key}">${values.map(([v,n])=>`<option value="${esc(v)}" ${String(v)===String(current)?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
export function roomSettingsMarkup(room){
 const o=room.options,disabled=!room.isHost||room.started;
 if(disabled)return `<p class="lobby-game-name">${esc(MODES[o.mode]?.name)} · regras do host</p>`;
 let settings=select('Jogo','mode',Object.entries(MODES).map(([k,v])=>[k,v.name]),o.mode);
 if(o.mode==='bonk')settings+=select('Expedição','bonkActivity',[['adventure','Exploração de Midgard'],['tower','Torre sem Fim']],o.bonkActivity)+select('Habilidades','bonkSkillMode',[['class','Somente a classe e evoluções'],['mixed','Misturar todas as classes']],o.bonkSkillMode);
 if(o.mode==='castlefight')settings+=select('Corredores','laneCount',[[1,'Um corredor'],[2,'Dois corredores']],o.laneCount);
 if(o.mode==='dungeon')settings+=select('Vagas','dungeonPartySize',[[1,'1 jogador'],[2,'2 jogadores'],[3,'3 jogadores'],[4,'4 jogadores']],o.dungeonPartySize)+select('Meta','dungeonLimit',[[0,'Sem fim'],[50,'50 andares']],o.dungeonLimit);
 if(o.mode==='tower')settings+=select('Meta','towerLimit',[[0,'Sem fim'],[50,'50 andares'],[100,'100 andares']],o.towerLimit);
 if(o.mode==='linewars')settings+=select('Formato','lineTeams',[[false,'Cada um por si'],[true,'Duplas 2 × 2']],o.lineTeams);
 if(o.mode==='bloody')settings+=select('Formato','bloodyTeams',[[false,'Cada um por si'],[true,'Equipes']],o.bloodyTeams);
 if(o.mode==='war')settings+=select('Heróis por equipe','teamSize',[[2,'2 heróis'],[5,'5 heróis']],o.teamSize)+select('Equipes','teamCount',[[2,'2'],[3,'3'],[4,'4'],[5,'5']],o.teamCount)+select('Confronto','clashEvery',[[5,'A cada 5 ondas'],[10,'A cada 10 ondas']],o.clashEvery);
 if(['campaign','tower','best','war','linewars'].includes(o.mode))settings+=select('Cenário','arena',Object.entries(ARENAS).map(([k,v])=>[k,v.name||k]),room.arena||'forest');
 return `<fieldset class="lobby-settings"><legend>Configuração do host</legend><div>${settings}</div><p>Trocar o jogo ou as regras reinicia a preparação e pede uma nova escolha de personagem.</p></fieldset>`;
}
