import test from 'node:test';
import assert from 'node:assert/strict';
import {unitInspectionAllowed,inspectedUnitSkills,unitInspectorMarkup,clampUnitInspectorPosition,createUnitInspector} from '../src/unit-inspector.js';
import {WARLOCK_SKILLS} from '../shared/warlock-catalog.js';

const player={id:1,owner:'p',team:1,name:'Guardião',x:0,z:0,hp:90,maxHp:100,skills:['cleave'],skillLevels:{cleave:1}},enemy={id:2,owner:'e',team:2,name:'Lobo',x:4,z:0,hp:42,maxHp:60,damage:12};
const stateFor=(mode='campaign')=>({options:{mode},players:{p:1,e:2},units:[structuredClone(player),structuredClone(enemy)],time:10,treeTag:{elapsed:10,trees:[]}});
test('unit inspection obeys authoritative team vision and stops exposing enemies outside fog',()=>{
 const state=stateFor('treetag');assert.equal(unitInspectionAllowed(state,'p',state.units[1]),true);
 state.units[1].x=40;assert.equal(unitInspectionAllowed(state,'p',state.units[1]),false);
 state.units[1].team=1;assert.equal(unitInspectionAllowed(state,'p',state.units[1]),true);
 state.units[1].team=2;state.treeTag.vision={unitIds:[1]};assert.equal(unitInspectionAllowed(state,'p',state.units[1]),false);state.treeTag.vision.unitIds.push(2);assert.equal(unitInspectionAllowed(state,'p',state.units[1]),true);
 state.options.mode='kodotag';assert.equal(unitInspectionAllowed(state,'p',state.units[1]),true);state.treeTag.vision.unitIds=[1];assert.equal(unitInspectionAllowed(state,'p',state.units[1]),false);
 assert.equal(unitInspectionAllowed(state,'p',{id:99,owner:'p'}),false);
});
test('compact inspection shows available data and actual weaknesses without supplying absent attributes or defenses',()=>{
 const state=stateFor(),unit={...enemy,name:'Lobo <script>',resistances:{fire:-.25,ice:.5},attributes:{str:14,agi:7},skills:[]};const html=unitInspectorMarkup(state,unit,'p');
 assert.match(html,/Lobo &lt;script&gt;/);assert.match(html,/Vulnerável a Fogo <b>25%/);assert.match(html,/Resiste a Gelo <b>50%/);assert.match(html,/<dt>FOR<\/dt><dd>14/);assert.match(html,/42 \/ 60/);assert.doesNotMatch(html,/Defesa física|Defesa mágica|Crítico|Nível/);
 const sparse=unitInspectorMarkup(state,{id:5,name:'Criatura',skills:[]},'p');assert.doesNotMatch(sparse,/Atributos|Fraquezas|Terrestre|Físico|Defesa/);assert.match(sparse,/Nenhuma habilidade informada/);
});
test('Castle weaknesses follow the combat matrix and mode skills use their actual catalog or RO loadout',()=>{
 const state=stateFor('castlefight'),unit={...enemy,castleUnit:true,attackType:'normal',armorType:'light',skills:[]};assert.match(unitInspectorMarkup(state,unit,'p'),/dano perfurante <b>\+75%/);
 state.options.mode='warlock';unit.skills=['S000'];unit.skillLevels={S000:3};assert.equal(inspectedUnitSkills(state,unit,'p')[0].name,WARLOCK_SKILLS.S000.name);assert.equal(inspectedUnitSkills(state,unit,'p')[0].rank,3);
 state.options.mode='bonk';state.bonk={weapons:[{key:'ro-test',name:'Chama ancestral',level:4,description:'Uma chama real.',manaCost:12}]};const skills=inspectedUnitSkills(state,state.units[0],'p');assert.equal(skills[0].name,'Chama ancestral');assert.equal(skills[0].rank,4);assert.equal(skills[0].mana,12);
});
test('Phase Killer inspection never discloses another inhabitant hidden role, powers or attributes',()=>{
 const state=stateFor('phasekiller'),unit={...enemy,name:'Habitante',pkRole:'killer',skills:['A014'],attributes:{str:999},pkDisguise:'p'};const html=unitInspectorMarkup(state,unit,'p');assert.equal(inspectedUnitSkills(state,unit,'p'),null);assert.match(html,/Habilidades não públicas/);assert.doesNotMatch(html,/A014|killer|999|Inimigo|Atributos/);
});
test('floating inspection clamps to the viewport while keeping the header reachable',()=>{
 assert.deepEqual(clampUnitInspectorPosition({left:-900,top:-100},{width:292,height:320},{width:360,height:640}),{left:8,top:56});
 assert.deepEqual(clampUnitInspectorPosition({left:900,top:900},{width:292,height:320},{width:360,height:640}),{left:60,top:312});
});

class Node {
 constructor(doc,name='DIV'){this.doc=doc;this.nodeName=name;this.children=[];this.handlers=new Map();this.attrs={};this.style={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
 set className(value){this.classes=new Set(value.split(/\s+/));}
 set innerHTML(value){this.html=value;if(value.includes('data-unit-inspector-close')){this.drag=new Node(this.doc,'BUTTON');this.content=new Node(this.doc);this.close=new Node(this.doc,'BUTTON');}}
 get innerHTML(){return this.html||'';}
 querySelector(selector){return selector==='.unit-inspector-drag'?this.drag:selector==='.unit-inspector-content'?this.content:selector==='[data-unit-inspector-close]'?this.close:null;}
 setAttribute(key,value){this.attrs[key]=value;}
 append(node){this.children.push(node);node.parent=this;}
 remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
 getBoundingClientRect(){return {left:parseFloat(this.style.left??450),top:parseFloat(this.style.top??88),width:Math.min(336,this.doc.defaultView.innerWidth-16),height:Math.min(400,this.doc.defaultView.innerHeight-72)};}
 addEventListener(key,fn){const list=this.handlers.get(key)||[];list.push(fn);this.handlers.set(key,list);}
 removeEventListener(key,fn){this.handlers.set(key,(this.handlers.get(key)||[]).filter(f=>f!==fn));}
 fire(type,extra={}){const event={type,pointerId:1,button:0,clientX:450,clientY:88,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...extra};for(const fn of this.handlers.get(type)||[])fn(event);return event;}
 setPointerCapture(id){this.capture=id;}
 releasePointerCapture(){this.capture=null;}
}
function fixture(){const doc=new Node(null,'DOCUMENT');doc.doc=doc;doc.body=new Node(doc,'BODY');doc.createElement=name=>new Node(doc,name);const win=new Node(doc,'WINDOW');win.innerWidth=800;win.innerHeight=600;doc.defaultView=win;const state=stateFor();return {doc,win,state,ui:createUnitInspector({getState:()=>state,getOwner:()=> 'p',document:doc}),panel:()=>doc.body.children[0]};}
test('the nonmodal inspector updates targets, retains dragged position and closes on fog loss without mutating gameplay',()=>{
 const f=fixture(),before=JSON.stringify(f.state);assert.equal(f.ui.open(2),true);let panel=f.panel();assert.equal(panel.attrs.role,'dialog');assert.equal(panel.attrs['aria-modal'],'false');assert.match(panel.content.innerHTML,/Lobo/);
 panel.drag.fire('pointerdown');assert.equal(panel.drag.capture,1);panel.drag.fire('pointermove',{clientX:200,clientY:120});panel.drag.fire('pointerup');const left=panel.style.left,top=panel.style.top;
 assert.equal(f.ui.open(1),true);assert.equal(f.panel(),panel);assert.equal(panel.style.left,left);assert.equal(panel.style.top,top);assert.match(panel.content.innerHTML,/Guardião/);assert.equal(JSON.stringify(f.state),before);
 f.state.units[0].hp=65;f.ui.update();assert.match(panel.content.innerHTML,/65 \/ 100/);
 f.ui.open(2);f.state.options.mode='treetag';f.state.treeTag.vision={unitIds:[1]};f.ui.update();assert.equal(f.ui.isOpen(),false);assert.equal(f.doc.body.children.length,0);f.ui.destroy();
});
test('inspector keyboard movement and cancellation do not trigger map actions; Escape closes the panel',()=>{
 const f=fixture();f.ui.open(2);const panel=f.panel(),original=panel.getBoundingClientRect();const key=panel.drag.fire('keydown',{key:'ArrowLeft'});assert.equal(key.propagationStopped,true);assert.equal(parseFloat(panel.style.left),original.left-8);
 const moved=panel.style.left;panel.drag.fire('pointerdown');panel.drag.fire('pointermove',{clientX:0,clientY:0});panel.drag.fire('pointercancel');assert.equal(panel.style.left,moved);
 assert.equal(panel.drag.fire('keydown',{key:'q'}).defaultPrevented,undefined);const escape=f.doc.fire('keydown',{key:'Escape'});assert.equal(escape.defaultPrevented,true);assert.equal(f.ui.isOpen(),false);f.ui.destroy();
});
