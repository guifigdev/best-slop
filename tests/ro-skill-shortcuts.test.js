import test from 'node:test';
import assert from 'node:assert/strict';
import {useShortcuts} from '../src/shortcuts.js';

test('Ragnarok manual skill keys keep level choices, editable fields and held-key repeats safe',()=>{
 const handlers={},events=[],context={bonk:true,playing:true},target={addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name]},input=useShortcuts({target,context:()=>context,onAction:(...event)=>events.push(event)});
 const press=(key,extra={})=>handlers.keydown({key,code:'Digit'+key,preventDefault(){},target:{matches:()=>false},...extra});
 for(const key of ['1','2','3','4'])press(key);assert.deepEqual(events,[['bonkSkill',1],['bonkSkill',2],['bonkSkill',3],['bonkSkill',4]]);
 events.length=0;context.bonkOffer={choices:[{id:'a'},{id:'b'},{id:'c'}]};press('2');press('4');assert.deepEqual(events,[['bonkChoice','b']]);
 events.length=0;delete context.bonkOffer;press('2',{repeat:true});press('2',{target:{matches:()=>true}});context.modal=true;press('2');assert.deepEqual(events,[]);input.destroy();assert.equal(Object.keys(handlers).length,0);
});
