import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPhaseKillerUI,phaseKillerChatOverlayMarkup,phaseKillerChatLogMarkup} from '../src/phase-killer-ui.js';

function fixture({accepted=true,ghost=false,mana=100}={}){
 const classes=new Set(),elements=new Map(),sent=[],notes=[];let focused=0,blurred=0,gameFocused=0;
 const input={value:'',focus(){focused++;},blur(){blurred++;}},form={hidden:true,querySelector(){return{disabled:false};}},toggle={setAttribute(key,value){this[key]=value;}},close={};
 for(const [id,value]of [['pk-chat-input',input],['pk-chat-form',form],['pk-chat-toggle',toggle],['pk-chat-close',close]])elements.set(id,value);
 const world={append(child){child.parentNode=this;this.child=child;}},document={getElementById(id){return id==='world'?world:elements.get(id)||null;},createElement(){return{classList:{toggle(key,on){if(on)classes.add(key);else classes.delete(key);},remove(key){classes.delete(key);}},setAttribute(){},remove(){this.parentNode=null;}};}};
 const player={id:1,owner:'local',name:'Meu nome real',alive:true,pkGhost:ghost,mana,skills:[],inventory:[]},state={options:{mode:'phasekiller'},phase:'wave',players:{local:1},units:[player],phaseKiller:{messages:[],finished:false}};
 const previous=globalThis.document;globalThis.document=document;
 const ui=createPhaseKillerUI({send:c=>(sent.push(c),accepted),getState:()=>state,getOwner:()=> 'local',toast:m=>notes.push(m),view:{setInteraction(){},canvas:{focus(){gameFocused++;}}}});
 return{ui,input,form,toggle,world,sent,notes,classes,counts:()=>({focused,blurred,gameFocused}),key(key){let prevented=0,stopped=0;input.onkeydown({key,preventDefault(){prevented++;},stopPropagation(){stopped++;}});return{prevented,stopped};},restore(){if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}};
}
test('overlay chat is in the gameplay region and Enter opens, submits once, then returns focus to the game',()=>{
 const f=fixture();try{assert.equal(f.ui.isChatOpen(),false);f.ui.shortcut('legacySkill','chat');assert.equal(f.ui.isChatOpen(),true);assert.equal(f.form.hidden,false);assert.equal(f.world.child.id,'pk-overlay-chat');assert.ok(f.classes.has('is-open'));f.input.value='Estou perto da ponte';f.input.oninput();const event=f.key('Enter');assert.deepEqual(event,{prevented:1,stopped:1});assert.deepEqual(f.sent,[{type:'pkChat',text:'Estou perto da ponte'}]);assert.equal(f.ui.isChatOpen(),false);assert.equal(f.form.hidden,true);assert.equal(f.input.value,'');assert.equal(f.counts().gameFocused,1);}finally{f.restore();}
});
test('Escape closes without submitting and preserves a draft across the next Enter activation',()=>{
 const f=fixture();try{f.ui.openChat();f.input.value='Não revele meu caminho';f.input.oninput();f.key('Escape');assert.equal(f.ui.isChatOpen(),false);assert.equal(f.sent.length,0);assert.equal(f.form.hidden,true);f.ui.shortcut('legacySkill','chat');assert.equal(f.input.value,'Não revele meu caminho');assert.equal(f.ui.isChatOpen(),true);const event=f.key('q');assert.deepEqual(event,{prevented:0,stopped:1});assert.equal(f.sent.length,0);f.ui.shortcut('escape');assert.equal(f.ui.isChatOpen(),false);}finally{f.restore();}
});
test('a rejected message or a ghost without mana keeps the composer and its text intact',()=>{
 for(const options of [{accepted:false},{ghost:true,mana:0}]){const f=fixture(options);try{f.ui.openChat();f.input.value='Uma mensagem';f.input.oninput();f.key('Enter');assert.equal(f.ui.isChatOpen(),true);assert.equal(f.input.value,'Uma mensagem');if(options.ghost){assert.equal(f.sent.length,0);assert.match(f.notes.at(-1),/10 de mana/);}else assert.equal(f.sent.length,1);}finally{f.restore();}}
});
test('public chat names and ghost speech are rendered verbatim with escaping and no secret role metadata',()=>{
 const html=phaseKillerChatLogMarkup([{id:1,name:'Nome imitado',text:'Eu sou inocente <img onerror=x>',role:'killer'},{id:2,name:'Espírito',text:'f·la d·sto·cida',ghost:true}]);assert.match(html,/Nome imitado:/);assert.match(html,/&lt;img onerror=x&gt;/);assert.doesNotMatch(html,/<img|role=|killer/);assert.match(html,/class="ghost"/);assert.match(html,/f·la d·sto·cida/);const overlay=phaseKillerChatOverlayMarkup();assert.match(overlay,/pk-chat-form" hidden/);assert.match(overlay,/Enter envia · Esc fecha/);assert.doesNotMatch(overlay,/Vozes da aldeia|pk-chat-panel/);
});
test('the gameplay overlay has a transparent left-side surface, readable shadows and no old sidebar chat tab',()=>{
 const css=readFileSync(new URL('../src/phase-killer.css',import.meta.url),'utf8'),source=readFileSync(new URL('../src/phase-killer-ui.js',import.meta.url),'utf8');assert.match(css,/\.pk-overlay-chat\{position:absolute;left:20px/);assert.match(css,/text-shadow:/);assert.match(css,/background:transparent/);assert.doesNotMatch(source,/\['chat','Vozes|id="pk-chat-panel"/);
});
