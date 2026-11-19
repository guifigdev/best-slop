import test from 'node:test';
import assert from 'node:assert/strict';
import {installCompetitionMenu} from '../src/competition-ui.js';

// Minimal event fixture: the assertions exercise the menu's returned network
// options, persistence and party lock rather than duplicating mode rules.
class Element {
 constructor(dataset={}){this.dataset=dataset;this.disabled=false;this.hidden=false;this.checked=false;this.textContent='';this.attrs={};this.handlers={};this.classes=new Set();this.classList={toggle:(c,value)=>{if(value)this.classes.add(c);else this.classes.delete(c);},contains:c=>this.classes.has(c)};}
 setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){this.handlers[k]=fn;}insertAdjacentHTML(_where,html){this.html=(this.html||'')+html;}click(){if(!this.disabled)this.onclick?.();}replaceChildren(){this.html='';}before(){}set innerHTML(html){this.html=html;}get innerHTML(){return this.html||'';}
}
function fixture(){
 const ids=Object.fromEntries(['arena-select','start','online','start-title','war-options','tower-options','party-section','party-code','party-status','party-create','party-join','party-queue','party-leave','line-format-info','line-format','castle-lanes','castle-format-info','castle-options','line-options','dungeon-options','bloody-options','dungeon-party','dungeon-limit','dungeon-teams','bloody-format'].map(id=>[id,new Element()]));ids['start-title'].nextElementSibling=new Element();
 for(const [id,value]of [['team-size','2'],['team-count','5'],['clash-every','5'],['tower-limit','0']])ids[id]=Object.assign(new Element(),{value});
 const kinds=['survival','linewars','castlefight','treetag','warlock','kodotag','phasekiller','dungeon','bloody'].map(gameKind=>new Element({gameKind})),modes=['campaign','tower','best','war','linewars','castlefight','treetag','warlock','kodotag','phasekiller','dungeon','bloody'].map(gameMode=>new Element({gameMode})),picker=new Element(),grid=new Element(),root=new Element(),groups={'line-format':[Object.assign(new Element(),{value:'ffa',checked:true}),Object.assign(new Element(),{value:'teams'})],'castle-lanes':[Object.assign(new Element(),{value:'2',checked:true}),Object.assign(new Element(),{value:'1'})]};
 for(const [name,values]of Object.entries({'dungeon-party':['1','2','3','4'],'dungeon-limit':['50','0'],'dungeon-teams':['2','4','1'],'bloody-format':['ffa','teams']}))groups[name]=values.map((value,i)=>Object.assign(new Element(),{value,checked:i===values.length-1}));
 for(const [name,inputs]of Object.entries(groups)){const cards=inputs.map(input=>{const card=new Element();card.querySelector=()=>input;return card;});ids[name].querySelectorAll=()=>cards;}
 root.querySelector=selector=>{if(selector==='.game-picker')return picker;if(selector==='.mode-grid')return grid;const checked=selector.match(/input\[name="([^"]+)"\]:checked/);if(checked)return groups[checked[1]].find(radio=>radio.checked);const mode=selector.match(/data-game-mode="([^"]+)"/);if(mode)return modes.find(b=>b.dataset.gameMode===mode[1]);throw Error('Unexpected selector '+selector);};
 root.querySelectorAll=selector=>selector==='[data-game-mode]'?modes:selector==='[data-game-kind]'?kinds:selector==='.format-choices'?Object.keys(groups).map(name=>ids[name]):selector.startsWith('select,')?[...Object.values(groups).flat(),...modes,...kinds,...['team-size','team-count','clash-every','tower-limit','party-create','party-join','party-code'].map(id=>ids[id])]:[];
 return{ids,kinds,modes,root,groups,document:{createElement:()=>root,getElementById:id=>ids[id],querySelectorAll:()=>[]},select(group,value){for(const input of groups[group])input.checked=input.value===value;ids[group].onchange?.();ids[group].handlers.change?.();}};
}
test('native format cards preserve network options, defaults, cross-game choices and party locking',()=>{
 const f=fixture(),previous=globalThis.document;globalThis.document=f.document;
 try{
  const menu=installCompetitionMenu({connect(){},getSocket(){return null;}}),{kinds,modes,ids,select,groups}=f;
  assert.equal(menu.options().mode,'campaign');kinds[1].click();assert.equal(menu.options().mode,'linewars');assert.equal(menu.options().lineTeams,false);select('line-format','teams');assert.equal(menu.options().lineTeams,true);assert.equal(menu.options().teamSize,2);assert.equal(menu.options().teamCount,2);assert.match(ids['line-format-info'].textContent,/Duas equipes de dois/);
  kinds[2].click();assert.equal(menu.options().mode,'castlefight');assert.equal(menu.options().laneCount,2);select('castle-lanes','1');assert.equal(menu.options().laneCount,1);kinds[1].click();assert.equal(menu.options().lineTeams,true);kinds[2].click();assert.equal(menu.options().laneCount,1);kinds[0].click();modes.find(m=>m.dataset.gameMode==='best').click();assert.equal(menu.options().mode,'best');
  modes.find(m=>m.dataset.gameMode==='war').click();menu.renderParty({code:'TEST',host:'p',players:[{id:'p',hero:'knight'}],options:{teamSize:2,teamCount:2,clashEvery:5},queued:false},'p');assert.ok(Object.values(groups).flat().every(radio=>radio.disabled));menu.renderParty(null,'p');assert.ok(Object.values(groups).flat().every(radio=>!radio.disabled));kinds[2].click();assert.equal(menu.options().laneCount,1);
 }finally{globalThis.document=previous;}
});
test('both format groups expose native labelled radio choices with one default and complete descriptions',()=>{
 const f=fixture(),previous=globalThis.document;globalThis.document=f.document;
 try{
  installCompetitionMenu({connect(){},getSocket(){return null;}});const html=f.root.innerHTML;assert.equal(/<select[^>]+id="(?:line-format|castle-lanes)"/.test(html),false);
  for(const name of Object.keys(f.groups)){assert.match(html,new RegExp('<fieldset[^>]+id="'+name+'"'));const controls=[...html.matchAll(new RegExp('<input[^>]+name="'+name+'"[^>]*>','g'))].map(m=>m[0]);assert.equal(controls.length,f.groups[name].length);assert.equal(controls.filter(tag=>/\schecked(?:\s|>)/.test(tag)).length,1);for(const tag of controls){assert.match(tag,/type="radio"/);const title=tag.match(/aria-labelledby="([^"]+)"/)[1];assert.ok(html.includes('id="'+title+'"'));for(const description of tag.match(/aria-describedby="([^"]+)"/)[1].split(' '))assert.ok(html.includes('id="'+description+'"'));}}
 }finally{globalThis.document=previous;}
});


test('switching games notifies the character picker and a locked party cannot replace its roster',()=>{
 const f=fixture(),previous=globalThis.document;globalThis.document=f.document;
 try{
  const calls=[],menu=installCompetitionMenu({connect(){},getSocket(){return null;},onGameChange:kind=>calls.push(kind)});
  f.kinds[2].click();f.kinds[1].click();f.kinds[0].click();assert.deepEqual(calls,['castlefight','linewars','survival']);
  menu.renderParty({code:'TEST',host:'p',players:[{id:'p',hero:'knight'}],options:{teamSize:2,teamCount:2,clashEvery:5},queued:false},'p');
  f.kinds[2].onclick();assert.equal(calls.length,3);
 }finally{globalThis.document=previous;}
});


test('Tree Tag and Warlock cards select independent options and restore the existing survival choices',()=>{
 const f=fixture(),previous=globalThis.document;globalThis.document=f.document;
 try{const calls=[],menu=installCompetitionMenu({connect(){},getSocket(){return null;},onGameChange:k=>calls.push(k)});f.kinds[3].click();assert.equal(menu.options().mode,'treetag');assert.equal(f.ids['arena-select'].hidden,true);f.kinds[4].click();assert.equal(menu.options().mode,'warlock');assert.equal(f.ids['arena-select'].hidden,true);f.kinds[0].click();assert.equal(menu.options().mode,'campaign');assert.equal(f.ids['arena-select'].hidden,false);assert.deepEqual(calls,['treetag','warlock','survival']);}finally{globalThis.document=previous;}
});


test('Kodo Tag has a separate game card and keeps the native map out of Survival arena settings',()=>{const f=fixture(),old=globalThis.document;globalThis.document=f.document;try{const menu=installCompetitionMenu({connect(){},getSocket(){return null;}});f.kinds[5].click();assert.equal(menu.options().mode,'kodotag');assert.equal(menu.options().game,'kodotag');assert.equal(f.ids['arena-select'].hidden,true);f.kinds[0].click();assert.equal(menu.options().mode,'campaign');assert.equal(f.ids['arena-select'].hidden,false);}finally{globalThis.document=old;}});


test('Dungeon and Bloody cards submit the chosen party size, run limit and rival team format',()=>{
 const f=fixture(),old=globalThis.document;globalThis.document=f.document;
 try{
  const menu=installCompetitionMenu({connect(){},getSocket(){return null;}});
  f.kinds.find(b=>b.dataset.gameKind==='dungeon').click();
  assert.equal(menu.options().mode,'dungeon');assert.equal(menu.options().dungeonPartySize,4);assert.equal(menu.options().dungeonTeams,1);
  f.select('dungeon-party','2');f.select('dungeon-teams','4');f.select('dungeon-limit','50');
  assert.equal(menu.options().dungeonPartySize,2);assert.equal(menu.options().dungeonTeams,4);assert.equal(menu.options().dungeonPvp,true);assert.equal(menu.options().dungeonLimit,50);
  assert.equal(f.ids['arena-select'].hidden,true);assert.equal(f.ids['dungeon-options'].classList.contains('hidden'),false);
  f.kinds.find(b=>b.dataset.gameKind==='bloody').click();assert.equal(menu.options().mode,'bloody');assert.equal(menu.options().bloodyTeams,true);assert.equal(menu.options().teamSize,5);
  f.select('bloody-format','ffa');assert.equal(menu.options().bloodyTeams,false);assert.equal(f.ids['dungeon-options'].classList.contains('hidden'),true);
  f.kinds[0].click();assert.equal(menu.options().mode,'campaign');assert.equal(f.ids['arena-select'].hidden,false);
 }finally{globalThis.document=old;}
});
