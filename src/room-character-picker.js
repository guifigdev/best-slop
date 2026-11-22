import {roomCharacterChoices} from '../shared/room-characters.js';
import {portrait} from './art.js';
import {escapeHTML as esc} from './competition-ui.js';
export function roomCharacterPickerMarkup(mode){
 return `<section class="room-character-picker" role="dialog" aria-modal="true" aria-label="Escolha seu personagem"><header><small>ANTES DA PARTIDA</small><h2>Escolha seu personagem</h2><p>Cada jogador confirma o próprio personagem. O host inicia quando todos terminarem.</p></header><div>${roomCharacterChoices(mode).map(c=>`<button type="button" data-room-hero="${esc(c.key)}">${['campaign','tower','best','war','dungeon','bloody','linewars'].includes(mode)?`<span class="room-hero-art">${portrait(c.hero)}</span>`:''}<b>${esc(c.name)}</b><span>${esc(c.description)}</span><strong>Escolher ${esc(c.name)}</strong></button>`).join('')}</div></section>`;
}
