import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameStore} from '../src/game-store.js';
import {createTypewriter} from '../src/typewriter.js';
import {useShortcuts} from '../src/shortcuts.js';

test('Enter is held for repeated Castle building without stealing dialog, modal or editable input',()=>{
 const target=new EventTarget(),actions=[];let context={playing:true,repeatBuild:true};const hook=useShortcuts({target,context:()=>context,onAction:(...a)=>actions.push(a)});
 const emit=(type,{editable=false,...props}={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,{key:'Enter',code:'Enter',repeat:false,...props});if(editable)Object.defineProperty(e,'target',{value:{matches:()=>true}});target.dispatchEvent(e);return e;};
 assert.equal(emit('keydown').defaultPrevented,true);assert.ok(hook.held.has('Enter'));emit('keydown',{repeat:true});assert.equal(actions.length,0);emit('keyup');assert.equal(hook.held.has('Enter'),false);
 emit('keydown');target.dispatchEvent(new Event('blur'));assert.equal(hook.held.size,0);
 context.dialog=true;emit('keydown');assert.deepEqual(actions,[['dialogNext']]);assert.equal(hook.held.has('Enter'),false);
 context={playing:true,repeatBuild:true,modal:true};emit('keydown');assert.equal(hook.held.size,0);
 context.modal=false;emit('keydown',{editable:true});assert.equal(hook.held.size,0);
 context.repeatBuild=false;assert.equal(emit('keydown').defaultPrevented,false);hook.destroy();
});
import {readHall,recordRun} from '../src/story.js';
test('client store exposes one session and notifies subscriptions consistently',()=>{const store=createGameStore(),seen=[];const stop=store.subscribe((s,n)=>seen.push([s.snapshot,n]));const snapshot={wave:9};store.state.snapshot=snapshot;assert.equal(store.getState().snapshot,snapshot);assert.equal(seen.length,1);assert.throws(()=>store.state.fake=2);stop();store.state.paused=true;assert.equal(seen.length,1);store.reset();assert.equal(store.state.snapshot,null);});
test('typewriter reveals Unicode gradually, supports fill-all and reduced motion',()=>{let now=0,count=0;const el={textContent:''},writer=createTypewriter({element:el,clock:()=>now,speed:2,onComplete:()=>count++});writer.start('A🦊B');now=1000;writer.update();assert.equal(el.textContent,'A🦊');assert.equal(writer.isComplete(),false);writer.reveal();assert.equal(el.textContent,'A🦊B');assert.equal(count,1);writer.reveal();assert.equal(count,1);const instant=createTypewriter({element:el,reducedMotion:true});instant.start('Texto');assert.equal(el.textContent,'Texto');});
test('shortcut hook respects dialogs, editable fields and modal context, and cleans up',()=>{const target=new EventTarget(),actions=[];let context={playing:true,dialog:false,modal:false};const hook=useShortcuts({target,context:()=>context,onAction:(...a)=>actions.push(a)});function press(key,code='',editable=false){const e=new Event('keydown',{cancelable:true});Object.assign(e,{key,code,repeat:false});if(editable)Object.defineProperty(e,'target',{value:{matches:()=>true}});target.dispatchEvent(e);}press('q');press('2');assert.deepEqual(actions,[['skill',0],['item',1]]);context.dialog=true;press('q');press(' ','Space');assert.deepEqual(actions.at(-1),['dialogNext']);context.dialog=false;context.modal=true;press('q');assert.equal(actions.length,3);context.modal=false;press('q','',true);assert.equal(actions.length,3);press('ArrowRight');assert.ok(hook.held.has('ArrowRight'));hook.destroy();press('q');assert.equal(actions.length,3);});
test('hall retains strongest runs and handles damaged local saves',()=>{const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},p={hero:'turtle',kills:2,level:1,skills:['thorns'],skillLevels:{thorns:3},totalAttributes:{vit:10},inventory:[]};for(let i=0;i<12;i++)recordRun(storage,{...p,kills:i},{phase:'defeat',wave:i});assert.equal(readHall(storage).length,10);recordRun(storage,p,{phase:'victory',wave:50});assert.equal(readHall(storage)[0].victory,true);assert.equal(readHall(storage)[0].skillLevels.thorns,3);data.set('custom-hero-hall-v2','broken');assert.deepEqual(readHall(storage),[]);});
