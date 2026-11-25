import test from 'node:test';
import assert from 'node:assert/strict';
import {gameRuntimeFailure,showGameRuntimeFailure,GAME_RUNTIME_FAILURE_KEY} from '../src/game-runtime-failure.js';

test('runtime report includes the exact failure and stage with bounded local diagnostics, without player saves',()=>{
 const state={options:{mode:'bonk'},time:30,bonk:{map:{route:{key:'prontera'}}},account:{secret:'private'},units:[{name:'private'}]},error=new Error('Cannot update attack');
 const report=gameRuntimeFailure(error,{stage:'renderização',state});
 assert.equal(report.message,error.message);assert.equal(report.stage,'renderização');assert.equal(report.time,30);assert.equal(report.region,'prontera');assert.ok(report.stack.includes('Cannot update attack'));assert.ok(!JSON.stringify(report).includes('private'));
 const huge=gameRuntimeFailure({message:'x'.repeat(3000),stack:'y'.repeat(10000)});assert.equal(huge.message.length,2000);assert.equal(huge.stack.length,8000);
});
test('runtime dialog survives storage failure, displays text safely and offers a copyable error and reload',async()=>{
 const nodes=[],make=tag=>{const el={tag,children:[],attributes:{},style:{},setAttribute(k,v){this.attributes[k]=v;},append(...children){this.children.push(...children);},focus(){this.focused=true;}};nodes.push(el);return el;};
 const doc={createElement:make,body:make('body'),querySelector:()=>doc.body.children[0]||null};let copied=null,reloads=0,writes=0;
 const win={localStorage:{setItem(key){assert.equal(key,GAME_RUNTIME_FAILURE_KEY);writes++;throw Error('quota');}},console:{error(){}},navigator:{clipboard:{async writeText(text){copied=text;}}},location:{reload(){reloads++;}}};
 const error=new Error('<img src=x onerror=alert(1)>'),report=showGameRuntimeFailure(error,{stage:'interface'},doc,win);
 assert.equal(doc.body.children.length,1);assert.ok(nodes.find(n=>n.tag==='pre').textContent.includes(error.message));
 const copy=nodes.find(n=>n.textContent==='Copiar erro');assert.ok(copy.focused);await copy.onclick();assert.equal(JSON.parse(copied).message,report.message);
 nodes.find(n=>n.textContent==='Recarregar jogo').onclick();assert.equal(reloads,1);
 showGameRuntimeFailure(error,{},doc,win);assert.equal(doc.body.children.length,1);assert.equal(writes,2);
});
