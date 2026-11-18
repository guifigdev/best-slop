import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeedback} from '../src/feedback.js';

function fixture(){
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.parentElement=null;this.className='';this.attributes={};this.style={setProperty(){}};this.dataset={};this.textContent='';this.offsetWidth=100;this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...names])].join(' ');},remove:(...names)=>{this.className=this.className.split(' ').filter(name=>!names.includes(name)).join(' ');},contains:name=>this.className.split(' ').includes(name)};}
  append(...elements){for(const element of elements){element.remove();element.parentElement=this;this.children.push(element);}}
  remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null;}}
  setAttribute(key,value){this.attributes[key]=String(value);}
  all(){return this.children.flatMap(child=>[child,...child.all()]);}
  querySelectorAll(selector){return this.all().filter(element=>selector.split(',').some(part=>part.trim().startsWith('.')&&element.classList.contains(part.trim().slice(1))));}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 }
 const body=new Element('body'),host=new Element('section'),wallet=new Element('div'),strong=new Element('strong'),gold=new Element('span');wallet.className='wallet';gold.id='gold';strong.append(gold);wallet.append(strong);body.append(wallet,host);
 const listeners=new Map(),doc={body,createElement:tag=>new Element(tag),getElementById:id=>body.all().find(element=>element.id===id)||null,querySelector:selector=>selector==='.wallet strong'?strong.parentElement?strong:null:body.querySelector(selector),querySelectorAll:selector=>body.querySelectorAll(selector),addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)};
 let now=0,serial=0;const jobs=new Map(),schedule=(fn,delay)=>{const id=++serial;jobs.set(id,{fn,due:now+delay});return id;},cancel=id=>jobs.delete(id);
 function advance(ms){const target=now+ms;for(;;){const next=[...jobs.entries()].filter(([,job])=>job.due<=target).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;now=next[1].due;jobs.delete(next[0]);next[1].fn();}now=target;}
 return{doc,host,wallet,strong,advance,schedule,cancel,jobs,listeners};
}
function withFeedback(run){const previous=globalThis.document,previousMotion=globalThis.matchMedia,f=fixture();globalThis.document=f.doc;globalThis.matchMedia=()=>({matches:true});const feedback=createFeedback({host:f.host,schedule:f.schedule,cancel:f.cancel});try{run(feedback,f);}finally{feedback.destroy();if(previous===undefined)delete globalThis.document;else globalThis.document=previous;if(previousMotion===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=previousMotion;}}

test('small repeated gold gains aggregate beside the wallet without toast cards or announcements',()=>withFeedback((feedback,f)=>{
 for(let i=0;i<12;i++)feedback.play({kind:'gold',amount:6});f.advance(599);assert.equal(f.strong.querySelector('.wallet-delta'),null);f.advance(1);
 const delta=f.strong.querySelector('.wallet-delta');assert.ok(delta);assert.equal(delta.textContent,'+72');assert.equal(delta.attributes['aria-hidden'],'true');assert.equal(f.host.querySelectorAll('.feedback-card').length,0);assert.equal(f.host.querySelector('.feedback-announcer').textContent,'');
 feedback.play({kind:'gold',amount:6});f.advance(600);assert.equal(f.strong.querySelectorAll('.wallet-delta').length,1);assert.equal(f.strong.querySelector('.wallet-delta'),delta);assert.equal(delta.textContent,'+78');f.advance(1000);assert.equal(f.strong.querySelector('.wallet-delta'),null);
}));
test('gold bounties do not displace a meaningful skill-upgrade notification',()=>withFeedback((feedback,f)=>{
 feedback.play({kind:'upgrade',title:'Martelo de Thor',detail:'Nível 1 → 2'});const card=f.host.querySelector('.feedback-card');assert.ok(card);for(let i=0;i<20;i++)feedback.play({kind:'gold',amount:6});f.advance(600);
 assert.equal(f.host.querySelectorAll('.feedback-card').length,1);assert.equal(f.host.querySelector('.feedback-card'),card);assert.ok(card.classList.contains('feedback-upgrade'));assert.equal(f.host.querySelector('.feedback-announcer').textContent,'Martelo de Thor. Nível 1 → 2');
}));
test('gold feedback stays silent without a wallet and ignores invalid gains',()=>withFeedback((feedback,f)=>{
 for(const amount of [Infinity,NaN,-6,0])feedback.play({kind:'gold',amount});assert.equal(f.jobs.size,0);f.strong.remove();feedback.play({kind:'gold',amount:100});f.advance(600);assert.equal(f.host.querySelectorAll('.feedback-card').length,0);assert.equal(f.host.querySelector('.feedback-announcer').textContent,'');
}));
test('feedback cleanup cancels pending batches and removes the compact delta',()=>withFeedback((feedback,f)=>{
 feedback.play({kind:'gold',amount:6});f.advance(600);assert.ok(f.strong.querySelector('.wallet-delta'));feedback.play({kind:'gold',amount:6});feedback.destroy();f.advance(5000);assert.equal(f.jobs.size,0);assert.equal(f.listeners.size,0);assert.equal(f.strong.querySelector('.wallet-delta'),null);
}));
