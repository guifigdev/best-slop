import test from 'node:test';
import assert from 'node:assert/strict';
import {roSkillLibraryEntries,roSkillLibraryMarkup} from '../src/ro-skill-library.js';
import {createBonkUI,bonkUpgradeMarkup} from '../src/bonk-ui.js';
const unit={id:1,roTier:1,name:'Mercenário'},catalog=[
 {key:'envenom',name:'Envenom',tier:0,kind:'slash',description:'Corte com veneno.',skill:'poison'},
 {key:'sonicblow',name:'Sonic Blow',tier:1,kind:'slash',description:'Golpes concentrados.',skill:'cleave'},
 {key:'flee',name:'Esquiva avançada',tier:0,kind:'passive',description:'Melhora a esquiva permanentemente.',skill:'sprint'},
 {key:'rollingcutter',name:'Rolling Cutter',tier:2,kind:'pulse',description:'Cortes circulares.',skill:'whirlwind'},
 {key:'unsafe',name:'Nome <script>',tier:0,kind:'buff',description:'Descrição <img onerror=bad> \"',skill:'battlecry'}
],data={job:{name:'Mercenário'},lineage:{names:['Gatuno','Mercenário','Sicário','Sicário das Sombras']},weapons:[{key:'basic',level:1},{...catalog[1],level:2}],learnedSkills:[{...catalog[0],level:1},{...catalog[1],level:2},{...catalog[2],level:3}],skillCatalog:catalog};

test('catalogue preserves learned skills outside the four slots and filters by learned, passive, class and accented effect',()=>{
 const original=JSON.stringify(data),entries=roSkillLibraryEntries(data,unit);assert.equal(entries.length,5);assert.equal(entries[0].level,1);assert.equal(entries[0].equippedSlot,null);assert.equal(entries[1].equippedSlot,1);assert.equal(entries[3].available,true);assert.equal(roSkillLibraryEntries(data,unit,{filter:'learned'}).length,3);assert.equal(roSkillLibraryEntries(data,unit,{filter:'passive'})[0].key,'flee');assert.equal(roSkillLibraryEntries(data,unit,{filter:'tier1'})[0].key,'sonicblow');assert.equal(roSkillLibraryEntries(data,unit,{query:'esquiva avancada'})[0].key,'flee');assert.equal(roSkillLibraryEntries(data,unit,{filter:'available'}).length,5);assert.equal(JSON.stringify(data),original);
});

test('normal library has accessible search, fixed native attack explanation, explicit target slot and no free learning',()=>{
 const html=roSkillLibraryMarkup(data,unit,{slot:2});assert.match(html,/role="dialog" aria-modal="true"/);assert.match(html,/data-bk-skill-query/);assert.match(html,/data-bk-skill-filter/);assert.match(html,/data-bk-select-skill-slot/);assert.match(html,/3 aprendidas · 5 habilidades/);assert.match(html,/Passiva ativa/);assert.match(html,/não ocupam atalhos/);assert.match(html,/Envenom no atalho 2/);assert.doesNotMatch(html,/Disponível ao evoluir/);assert.doesNotMatch(html,/data-bk-learn-skill/);assert.match(html,/Nome &lt;script&gt;/);assert.match(html,/&lt;img onerror=bad&gt;/);assert.doesNotMatch(html,/<script>|<img onerror/);
});

test('library only consults and equips learned skills even if a level offer exists',()=>{
 const choosing={...data,offer:{id:7,choices:[]}},html=roSkillLibraryMarkup(choosing,unit);
 assert.match(html,/quatro ofertas sorteadas/);assert.doesNotMatch(html,/data-bk-learn-skill/);assert.doesNotMatch(bonkUpgradeMarkup(choosing.offer),/data-bk-skills|Escolher outra habilidade/);
});

test('library action pauses movement and only dispatches learned active skills to replaceable shortcuts',()=>{
 const sent=[],pauses=[],state={options:{mode:'bonk'},players:{p:1},units:[unit],bonk:{...data,stage:'playing'}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>sent.push(c),onInventory:value=>pauses.push(value)});
 ui.equipSkill('envenom',2);assert.equal(sent.length,0);ui.action('skills');ui.action('skill',0);assert.equal(sent.length,0);ui.equipSkill('envenom',0);ui.equipSkill('rollingcutter',2);ui.equipSkill('flee',2);ui.equipSkill('envenom',2);assert.deepEqual(sent,[{type:'bkEquipSkill',key:'envenom',slot:2}]);ui.action('skills');assert.deepEqual(pauses,[true,false]);ui.chooseSkill('sonicblow');assert.equal(sent.length,1);
});

test('library cannot be used to learn arbitrary skills during a level offer',()=>{
 const sent=[],state={options:{mode:'bonk'},players:{p:1},units:[unit],bonk:{...data,stage:'levelup',offer:{id:4,choices:[]}}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>sent.push(c)});
 ui.action('skills');ui.chooseSkill('sonicblow');ui.equipSkill('envenom',1);assert.deepEqual(sent,[]);
});

test('level offers retain all four complete choices without a free catalogue alternative',()=>{
 const html=bonkUpgradeMarkup({id:9,choices:Array.from({length:4},(_,i)=>({id:'choice-'+i,name:'Skill '+i,kind:'weapon',level:i+1,description:'Complete description '+i,skill:'cleave'}))});assert.equal((html.match(/data-bk-choice=/g)||[]).length,4);assert.match(html,/<kbd>4<\/kbd>/);assert.match(html,/Complete description 3/);assert.doesNotMatch(html,/data-bk-skills/);
});

test('a learned skill remains identified and equipable when new offers exclude it',()=>{
 const blocked={...data,skillCatalog:catalog.map(c=>({...c,available:false}))};
 const html=roSkillLibraryMarkup(blocked,unit,{slot:2});
 assert.match(html,/Aprendida · fora da barra/);assert.match(html,/Atalho 1/);assert.match(html,/data-bk-equip-skill="envenom"/);
 assert.match(html,/Indisponível nas melhorias atuais/);assert.doesNotMatch(html,/Limite de habilidades aprendidas alcançado/);
});
