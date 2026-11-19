import test from 'node:test';
import assert from 'node:assert/strict';
import {patchChildren} from '../src/snapshot-dom.js';

// Minimal DOM test double: exercises node identity/moves, not HTML parsing.
class Node {
 constructor(name,attributes={},children=[]){this.nodeType=name==='#text'?3:1;this.nodeName=name;this.attrs={...attributes};this.childNodes=[];this.parentNode=null;this.nodeValue=attributes.text||null;for(const child of children)this.insertBefore(child,null);}
 get attributes(){return Object.entries(this.attrs).map(([name,value])=>({name,value}));}
 hasAttribute(name){return Object.hasOwn(this.attrs,name);}
 getAttribute(name){return this.attrs[name]??null;}
 setAttribute(name,value){this.attrs[name]=value;}
 removeAttribute(name){delete this.attrs[name];}
 insertBefore(node,before){if(node.parentNode)node.parentNode.removeChild(node);const index=before?this.childNodes.indexOf(before):this.childNodes.length;this.childNodes.splice(index,0,node);node.parentNode=this;}
 removeChild(node){this.childNodes.splice(this.childNodes.indexOf(node),1);node.parentNode=null;}
 cloneNode(deep){return new Node(this.nodeName,this.attrs,deep?this.childNodes.map(n=>n.cloneNode(true)):[]);}
}
const keys=['data-cf-build','data-cf-action'];
const text=value=>new Node('#text',{text:value});
const button=(key,value,attributes={})=>new Node('BUTTON',{'data-cf-build':key,...attributes},[text(value)]);

test('HUD snapshots retain pressed buttons and their text nodes while costs and availability change',()=>{
 const current=button('factory','Faltam 20 de ouro',{disabled:''}),label=current.childNodes[0],handler=()=>{};current.onclick=handler;
 const root=new Node('DIV',{},[current]);
 for(let i=19;i>=0;i--){const next=new Node('DIV',{},[button('factory',i?'Faltam '+i+' de ouro':'Construir',i?{disabled:''}:{})]);patchChildren(root,next,keys);assert.equal(root.childNodes[0],current);assert.equal(current.childNodes[0],label);assert.equal(current.onclick,handler);}
 assert.equal(current.hasAttribute('disabled'),false);assert.equal(label.nodeValue,'Construir');
});
test('keyed controls move with their identity and obsolete choices are removed',()=>{
 const a=button('a','A'),b=button('b','B'),root=new Node('DIV',{},[a,b]);
 patchChildren(root,new Node('DIV',{},[button('b','B2'),button('c','C'),button('a','A2')]),keys);
 assert.equal(root.childNodes[0],b);assert.equal(root.childNodes[2],a);assert.equal(root.childNodes[1].getAttribute('data-cf-build'),'c');
 patchChildren(root,new Node('DIV',{},[button('b','B3')]),keys);assert.equal(root.childNodes.length,1);assert.equal(root.childNodes[0],b);assert.equal(a.parentNode,null);
});
test('disclosures retain player state and switching control identity does not reuse the wrong action',()=>{
 const details=new Node('DETAILS',{open:''},[new Node('SUMMARY',{},[text('Equipe')])]),old=button('a','A'),root=new Node('DIV',{},[details,old]);
 patchChildren(root,new Node('DIV',{},[new Node('DETAILS',{},[new Node('SUMMARY',{},[text('Equipes')])]),button('b','B')]),keys);
 assert.equal(root.childNodes[0],details);assert.equal(details.hasAttribute('open'),true);assert.notEqual(root.childNodes[1],old);assert.equal(old.parentNode,null);
});
