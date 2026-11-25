import test from 'node:test';
import assert from 'node:assert/strict';
import {patchChildren} from '../src/snapshot-dom.js';

// Minimal DOM test double: exercises node identity/moves, not HTML parsing.
class Node {
 constructor(name,attributes={},children=[]){this.nodeType=name==='#text'?3:1;this.nodeName=name;this.attrs={...attributes};this.childNodes=[];this.parentNode=null;this.nodeValue=attributes.text||null;for(const child of children)this.insertBefore(child,null);}
 get attributes(){return Object.entries(this.attrs).map(([name,value])=>({name,value}));}
 get classList(){const node=this;return {contains:value=>(node.attrs.class||'').split(/\s+/).includes(value),add(value){node.attrs.class=[...new Set((node.attrs.class||'').split(/\s+/).filter(Boolean).concat(value))].join(' ');},[Symbol.iterator]:function*(){yield* (node.attrs.class||'').split(/\s+/).filter(Boolean);}};}
 get style(){const node=this,entries=()=>Object.fromEntries((node.attrs.style||'').split(';').filter(s=>s.includes(':')).map(s=>{const [key,...value]=s.split(':');return [key.trim(),value.join(':').trim()];}));return {getPropertyValue:key=>(entries()[key]||'').replace(/\s*!important$/,''),getPropertyPriority:key=>entries()[key]?.endsWith('!important')?'important':'',setProperty(key,value,priority){const next=entries();next[key]=value+(priority?' !'+priority:'');node.attrs.style=Object.entries(next).map(([k,v])=>k+':'+v).join(';');}};}
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

test('right and left hand buttons for the same item retain independent identities during live snapshots',()=>{
 const make=slot=>new Node('BUTTON',{'data-bk-equip':'knife','data-bk-slot':slot},[text(slot)]),right=make('weapon'),left=make('offhand'),root=new Node('DIV',{},[right,left]);
 for(let i=0;i<20;i++){patchChildren(root,new Node('DIV',{},[make('weapon'),make('offhand')]),['data-bk-equip']);assert.equal(root.childNodes[0],right);assert.equal(root.childNodes[1],left);assert.equal(left.getAttribute('data-bk-slot'),'offhand');}
});

test('independently mounted account selectors survive room updates without being detached',()=>{
 const selector=new Node('SELECT',{'data-ro-character':''},[new Node('OPTION',{value:'saved'},[text('Mago')])]),account=new Node('DIV',{'data-ui-key':'account','data-ui-preserve':''},[selector]),root=new Node('DIV',{},[account,text('1 jogador')]);
 for(let i=2;i<20;i++)patchChildren(root,new Node('DIV',{},[new Node('DIV',{'data-ui-key':'account','data-ui-preserve':''}),text(i+' jogadores')]));
 assert.equal(root.childNodes[0],account);assert.equal(account.childNodes[0],selector);assert.equal(selector.parentNode,account);assert.equal(selector.childNodes[0].childNodes[0].nodeValue,'Mago');
});

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

test('live snapshots preserve player layout, handle identity and skill buttons while game values update',()=>{
 const handle=new Node('SPAN',{class:'hud-drag-handle'}),cast=button('spell','Usar'),panel=new Node('SECTION',{'data-ui-key':'skills','data-hud-layout':'ro-skills',class:'ro-skill-dock hud-draggable hud-positioned',style:'position:fixed !important;left:120px !important;top:88px !important;width:230px !important'},[handle,cast]),root=new Node('DIV',{},[panel]);
 for(let i=1;i<=8;i++){
  patchChildren(root,new Node('DIV',{},[new Node('SECTION',{'data-ui-key':'skills',class:'ro-skill-dock cooling',style:'opacity:.8'},[button('spell','Recarga '+i)])]),['data-ui-key','data-cf-build']);
  assert.equal(root.childNodes[0],panel);assert.equal(panel.childNodes[0],handle);assert.equal(panel.childNodes[1],cast);assert.equal(panel.getAttribute('data-hud-layout'),'ro-skills');assert.equal(panel.classList.contains('hud-positioned'),true);assert.equal(panel.classList.contains('cooling'),true);assert.equal(panel.style.getPropertyValue('left'),'120px');assert.equal(panel.style.getPropertyPriority('left'),'important');assert.equal(panel.style.getPropertyValue('opacity'),'.8');
 }
 assert.equal(cast.childNodes[0].nodeValue,'Recarga 8');
});
