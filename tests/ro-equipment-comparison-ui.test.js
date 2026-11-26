import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoEquipment,initializeRoInventory} from '../shared/ragnarok-equipment.js';
import {roEquipmentComparisonMarkup} from '../src/ro-equipment-bag-ui.js';

test('equipment comparison headings and values use the same attribute/current/new column order',()=>{
 const u={id:'comparison',level:150,roTier:4};initializeRoInventory(u,'shadowcross');
 const item=createRoEquipment('knife','comparison-next'),html=roEquipmentComparisonMarkup(u,item,{slot:'weapon'}),header=html.match(/<header class="ro-comparison-heading">(.*?)<\/header>/s)?.[1];
 assert.ok(header);assert.match(header,/^<span>ATRIBUTO<\/span><span data-comparison-column="current">ATUAL/);assert.match(header,/<\/span><span data-comparison-column="new">NOVO<b>.+<\/b><\/span>$/);assert.equal((header.match(/<span/g)||[]).length,3);
 const rows=[...html.matchAll(/<div><dt>.*?<\/dt><dd>.*?<\/dd><dd(?: data-change="[^"]+")?>.*?<\/dd><\/div>/gs)];assert.ok(rows.length>0);
 u.roEquipment.weapon=null;const empty=roEquipmentComparisonMarkup(u,item,{slot:'weapon'});assert.match(empty,/data-comparison-column="current">ATUAL[^<]*<b>Espaço vazio<\/b>/);
});
