import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoRefineFeedback,RO_REFINE_REVEAL_MS} from '../src/ro-refine-feedback.js';
import {roTownMarkup} from '../src/ro-town-ui.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
test('one native refine sequence plays three strikes, hides an early server result and reveals it exactly once while paused',()=>{
 let clock=0;const sounds=[],feedback=createRoRefineFeedback({now:()=>clock,onSound:k=>sounds.push(k)}),item=createRoEquipment('sword','s'),result={id:2,key:'sword',name:'Sword',from:0,to:1,outcome:'success'};
 assert.equal(feedback.begin(item,1),true);assert.equal(feedback.begin(item,1),false);
 for(const t of [0,120,300,620,1120,1600]){clock=t;const p=feedback.update(result);assert.equal(p.busy,true);const html=roTownMarkup({type:'blacksmith',safe:true},{gold:1000,roInventory:[item],roRefineResult:result},{refinePresentation:p});assert.ok(html.includes('O ferreiro está trabalhando'));assert.ok(!html.includes('Refino bem-sucedido'));}
 assert.deepEqual(sounds,['strike','strike','strike']);clock=RO_REFINE_REVEAL_MS;assert.equal(feedback.update(result).stage,'success');feedback.update(result);assert.deepEqual(sounds,['strike','strike','strike','success']);assert.equal(feedback.begin(item,2),true);
});
test('late server outcomes wait for acknowledgement, failures never play success, and closing clears a pending sequence',()=>{
 let clock=0;const sounds=[],feedback=createRoRefineFeedback({now:()=>clock,onSound:k=>sounds.push(k)});feedback.begin({key:'sword'},7);clock=3000;assert.equal(feedback.update({id:7}).busy,true);
 assert.equal(feedback.update({id:8,outcome:'broken'}).stage,'broken');assert.deepEqual(sounds,['strike','strike','strike','failure']);feedback.cancel();assert.equal(feedback.update({id:8}),null);
});
