import {roomCharacterChoices} from '../shared/room-characters.js';
import {portrait} from './art.js';
import {ragnarokJobPortrait} from './ragnarok-job-art.js';
import {escapeHTML as esc} from './competition-ui.js';
export function roomCharacterPickerMarkup(mode){
 return `<section class="room-character-picker" role="dialog" aria-modal="true" aria-label="Escolha seu personagem"><header><small>PARTIDA INICIADA · SEU PERSONAGEM</small><h2>Quem entra nesta aventura?</h2><p>Escolha seu personagem. O combate começa quando todos confirmarem.</p></header><div>${roomCharacterChoices(mode).map(c=>`<button type="button" data-room-hero="${esc(c.key)}">${mode==='bonk'?`<span class="room-hero-art">${ragnarokJobPortrait(c.job)}</span>`:['campaign','tower','best','war','dungeon','bloody','linewars'].includes(mode)?`<span class="room-hero-art">${portrait(c.hero)}</span>`:''}<b>${esc(c.name)}</b><span>${esc(c.description)}</span><strong>Jogar com ${esc(c.name)}</strong></button>`).join('')}</div></section>`;
}
