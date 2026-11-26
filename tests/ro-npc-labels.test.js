import test from 'node:test';import assert from 'node:assert/strict';
import {roNpcLabelEntries,RO_NPC_LABEL_BUDGET} from '../src/ro-npc-labels.js';
test('Ragnarok services expose the same readable name and function labels as the market, bounded to nearby NPCs',()=>{
 const s={options:{mode:'bonk'},bonk:{objects:[{id:'a',type:'kafra',x:1,z:0},{id:'b',type:'blacksmith',x:3,z:0},{id:'c',type:'equipmentShop',x:2,z:0},{id:'d',type:'potionShop',x:100,z:0},{id:'chest',type:'chest',x:0,z:0}]}};
 const entries=roNpcLabelEntries(s,{x:0,z:0});assert.deepEqual(entries.map(e=>e.labelName),['Kafra','Mercador','Ferreiro']);assert.equal(entries[0].labelRole,'Armazém da conta');assert.equal(entries[1].labelRole,'Equipamentos');
 assert.deepEqual(roNpcLabelEntries({...s,options:{mode:'warlock'}},{x:0,z:0}),[]);s.bonk.objects=Array.from({length:100},(_,i)=>({id:i,type:'healer',x:i*.1,z:0}));assert.equal(roNpcLabelEntries(s,{x:0,z:0}).length,RO_NPC_LABEL_BUDGET.labels);
});
