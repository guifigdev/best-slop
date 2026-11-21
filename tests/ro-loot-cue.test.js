import test from 'node:test';
import assert from 'node:assert/strict';
import {roLootCueMarkup} from '../src/ro-loot-cue.js';
test('chest receipts identify the equipment, relic and pending-inventory action without losing paused-time feedback',()=>{
 const loot={id:'chest:1',kind:'chest',at:10,equipment:[{name:'Main Gauche',key:'maingauche',pending:true}],relic:{name:'Espelho de prata',stacks:2},pending:true};
 const html=roLootCueMarkup(loot,12);assert.match(html,/BAÚ ABERTO/);assert.match(html,/Main Gauche/);assert.match(html,/item aguardando espaço/);assert.match(html,/Espelho de prata × 2/);assert.match(html,/Recolher item pendente/);assert.equal(roLootCueMarkup(loot,12),html);assert.equal(roLootCueMarkup(loot,16),'');assert.equal(roLootCueMarkup(loot,9),'');assert.equal(roLootCueMarkup(null,12),'');
 const escaped=roLootCueMarkup({at:0,name:'<script>',description:'"unsafe"'},1);assert.ok(!escaped.includes('<script>'));assert.match(escaped,/&lt;script&gt;/);assert.match(escaped,/Ver no inventário/);
});
