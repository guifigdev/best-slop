import test from 'node:test';
import assert from 'node:assert/strict';
import {TREE_TAG_BUILDINGS as B} from '../shared/tree-tag-catalog.js';
import {treeBuildingInspectionMarkup as markup} from '../src/tree-building-inspection.js';
import {createLegacyUI} from '../src/legacy-ui.js';

const hero={id:1,owner:'p',team:1,name:'Ent local',treeTagRole:'ent',treeTagCharacter:'ent',gold:10000,lumber:10000},ally={id:2,owner:'q',team:1,name:'Ent aliado',treeTagRole:'ent',treeTagCharacter:'ent'},state={players:{p:1,q:2},options:{mode:'treetag'},units:[hero,ally],treeTag:{players:{},buildings:[]}},building=(key,owner='q')=>({...B[key],id:10,owner,team:1,alive:true,maxHp:B[key].hp,hp:B[key].hp/2,workRemaining:0,workProgress:1,productionQueue:[],trainRemaining:0});
test('an allied structure inspection shows its owner, health, armor and training without ownership actions',()=>{
 const b=building('e000');b.productionQueue=['e001','uC43'];b.trainRemaining=7;const html=markup(state,hero,hero,b);assert.match(html,/Construção aliada · Ent aliado/);assert.match(html,/Tree of Life/);assert.match(html,/Vida/);assert.match(html,/Armadura/);assert.match(html,/Fila de treinamento · 2/);assert.match(html,/7s restantes/);assert.match(html,/Advanced Builder/);assert.match(html,/data-legacy-repair="10"/);assert.doesNotMatch(html,/data-legacy-train|data-legacy-research|data-legacy-upgrade/);assert.match(html,/Somente o dono/);
});
test('own buildings retain training and upgrades while allied resource income remains inspectable',()=>{
 const own=markup(state,hero,hero,building('e000','p'));assert.match(own,/Sua construção/);assert.match(own,/data-legacy-train="e001"/);assert.match(own,/data-legacy-research/);const storage=markup(state,hero,hero,building('eC09'));assert.match(storage,/Renda a cada 5s/);assert.doesNotMatch(storage,/data-legacy-upgrade/);assert.match(markup(state,hero,hero,building('eC09','p')),/data-legacy-upgrade/);
 const enemy=markup(state,hero,hero,{...building('eC09'),team:2});assert.match(enemy,/Construção inimiga/);assert.doesNotMatch(enemy,/data-legacy-repair|data-legacy-upgrade/);
});
test('left clicking an allied building selects it without issuing movement, attack or ownership commands',()=>{
 const calls=[],commands=[],controller=createLegacyUI({getState:()=>state,getOwner:()=> 'p',send:c=>(commands.push(c),true),view:{setLegacyBuild(){},setInteraction(){},setLegacySelection:id=>calls.push(id),setInspected(){}},toast(){}});controller.point({point:{x:5,z:6},legacyBuilding:10,button:0});assert.deepEqual(calls,[10]);assert.deepEqual(commands,[]);controller.reset();assert.equal(calls.at(-1),null);
});
