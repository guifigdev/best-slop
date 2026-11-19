import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE_KILLER_SKILLS as SKILLS,PHASE_KILLER_ITEMS as ITEMS} from '../shared/phase-killer-catalog.js';
import {createPhaseKillerUI,phaseKillerAvailableSkills,phaseKillerActionBar,phaseKillerSkillStatus,phaseKillerSkillGridMarkup,phaseKillerSkillDetailMarkup,phaseKillerItemDetailMarkup} from '../src/phase-killer-ui.js';
import {PHASE_KILLER_SKILL_ILLUSTRATIONS} from '../src/phase-killer-art.js';

const unit=extra=>({id:1,owner:'me',pkCharacter:true,pkRole:'townsfolk',alive:true,mana:200,maxMana:200,hp:100,maxHp:100,skills:[],inventory:[],inventorySlots:2,cooldowns:{},...extra});
function fixture(extra={},sendResult=true){const u=unit(extra),s={options:{mode:'phasekiller'},phase:'wave',time:800,units:[u],players:{me:1},phaseKiller:{stage:'hunt',finished:false}},sent=[],messages=[];const ui=createPhaseKillerUI({send:c=>(sent.push(c),sendResult),getState:()=>s,getOwner:()=> 'me',view:{setInteraction(){},mark(){}},toast:m=>messages.push(m)});return {u,s,ui,sent,messages};}

test('native spellbooks expand into children while the seven-slot action bar keeps books rather than their actions',()=>{
 const u=unit({skills:['A05Z','A00E','A03O']});
 for(const key of SKILLS.A05Z.children)assert.ok(phaseKillerAvailableSkills(u).includes(key));
 assert.deepEqual(phaseKillerActionBar(u),['A05Z','A00E','A03O']);
 const root=phaseKillerSkillGridMarkup(u,{phase:'wave'}),group=phaseKillerSkillGridMarkup(u,{phase:'wave'},{group:'A05Z'});
 assert.match(root,/data-pk-skill="A05Z"/);assert.doesNotMatch(root,/data-pk-skill="A05C"/);assert.match(group,/data-pk-skill="A05C"/);
 const f=fixture({skills:['A05Z']});f.ui.shortcut('legacySkill','A05Z');assert.equal(f.sent.length,0);assert.equal(f.ui.skillPreview(),null);
 f.ui.shortcut('legacySkill','A05C');assert.equal(f.sent.length,0);assert.equal(f.ui.skillPreview().mode,'aim');
 f.ui.point({point:{x:1,z:2},button:0});assert.equal(f.sent.length,0);assert.match(f.messages.at(-1),/Selecione um alvo/);
 f.ui.point({point:{x:1,z:2},unit:{id:2},button:0});assert.deepEqual(f.sent.at(-1),{type:'pkCast',skill:'A05C',x:1,z:2,target:2});
});

test('cooldown is viewer snapshot remaining time and mana or exhausted item charges prevent casting',()=>{
 const f=fixture({skills:['A000'],cooldowns:{A000:2.1}});f.ui.shortcut('legacySkill','A000');assert.equal(f.sent.length,0);assert.match(f.messages.at(-1),/recarga/);assert.equal(phaseKillerSkillStatus(f.u,'A000').cooldown,2.1);
 f.u.cooldowns={};f.ui.shortcut('legacySkill','A000');assert.deepEqual(f.sent.at(-1),{type:'pkCast',skill:'A000'});
 const charged=Object.values(ITEMS).find(i=>i.charges>0&&i.skills.some(k=>SKILLS[k]?.kind==='active')),key=charged.skills.find(k=>SKILLS[k]?.kind==='active');
 const u=unit({inventory:[{key:charged.key,charges:0}]});assert.match(phaseKillerSkillStatus(u,key,{slot:0}).reason,/cargas/);
 const poor=unit({skills:['A05Z'],mana:0});assert.match(phaseKillerSkillStatus(poor,'A05C').reason,/Mana insuficiente/);
});

test('item-targeted spells keep their inventory slot and rejected commands preserve aiming',()=>{
 const f=fixture({inventory:[{key:'I00D',charges:1}]},false);f.ui.shortcut('legacySkill','A00Q');assert.equal(f.ui.skillPreview().key,'A00Q');
 f.ui.point({point:{x:3,z:4},button:0});assert.deepEqual(f.sent.at(-1),{type:'pkCast',skill:'A00Q',x:3,z:4,itemSlot:0});assert.equal(f.ui.skillPreview().mode,'aim');f.ui.cancel();assert.equal(f.ui.skillPreview(),null);
 assert.match(phaseKillerSkillStatus(unit({inventory:[{key:'I00D',charges:1},{key:'I002',charges:1}]}),'A00Q',{slot:1}).reason,/não pertence/);
});

test('equipment details have explicit equip, combine and drop actions, real charges and readable stats',()=>{
 const u=unit({inventory:[{key:'I000',charges:0},{key:'I002',charges:1}]});
 const armor=phaseKillerItemDetailMarkup(u,0,{phase:'wave'}),consumable=phaseKillerItemDetailMarkup(u,1,{phase:'wave'});
 assert.match(armor,/Equipar/);assert.match(armor,/data-pk-item-cast="A005"/);assert.match(armor,/data-pk-combine="0"/);assert.match(armor,/data-pk-drop="0"/);assert.match(armor,/Armadura/);assert.match(consumable,/1 carga\(s\)/);
 const f=fixture({inventory:u.inventory});f.ui.shortcut('legacySkill','A005');assert.deepEqual(f.sent.at(-1),{type:'pkCast',skill:'A005',itemSlot:0});
 const innate=Object.values(ITEMS).find(i=>i.innate);const text=phaseKillerItemDetailMarkup(unit({inventory:[{key:innate.key}]}),0,{phase:'wave'});assert.match(text,/data-pk-drop="0" disabled/);
});

test('private improvements expose actual rank and soul requirements; ghosts never acquire carried attack skills',()=>{
 const u=unit({pkRole:'killer',skills:['A014'],pkUpgrades:{attack:2},pkSouls:2});assert.match(phaseKillerSkillStatus(u,'A013').reason,/3 almas/);u.pkSouls=3;assert.equal(phaseKillerSkillStatus(u,'A013').disabled,false);assert.match(phaseKillerSkillDetailMarkup(u,'A013',{phase:'wave'}),/2 \/ 3/);u.pkUpgrades.attack=3;assert.match(phaseKillerSkillStatus(u,'A013').reason,/máximo/);
 const ghost=unit({pkGhost:true,skills:['A000','A01C','A05C'],inventory:[{key:'I00D',charges:1}]});assert.deepEqual(phaseKillerAvailableSkills(ghost),['A000','A01C']);assert.doesNotMatch(phaseKillerSkillGridMarkup(ghost,{phase:'wave'}),/A00Q|A05C/);assert.match(phaseKillerItemDetailMarkup({...ghost,inventory:[]},0,{phase:'wave'}),/Explore os baús/);
});

test('null/preparation snapshots, hovering and new attack illustrations are safe and complete',()=>{
 const ui=createPhaseKillerUI({send(){},getState:()=>null,getOwner:()=> 'me'});assert.doesNotThrow(()=>ui.render());assert.equal(ui.skillPreview(),null);assert.deepEqual(ui.hotkeys(),{M:'move',S:'stop',ENTER:'chat'});assert.doesNotThrow(()=>ui.point({point:{x:0,z:0},button:0}));
 const f=fixture({skills:['A05Z']});f.s.phase='preparation';f.ui.shortcut('legacySkill','A05C');assert.equal(f.sent.length,0);assert.match(f.messages.at(-1),/início/);
 f.s.phase='wave';f.ui.setHoveredSkill('A05C');assert.equal(f.ui.skillPreview().mode,'hover');f.ui.setHoveredSkill(null);assert.equal(f.ui.skillPreview(),null);
 assert.notDeepEqual(PHASE_KILLER_SKILL_ILLUSTRATIONS.A05N,PHASE_KILLER_SKILL_ILLUSTRATIONS.A05K);assert.ok(PHASE_KILLER_SKILL_ILLUSTRATIONS.A05N[1].includes('<path'));assert.ok(PHASE_KILLER_SKILL_ILLUSTRATIONS.A05K[1].includes('<path'));
});

test('selected destructible fields use authoritative group-independent attack commands',()=>{const {ui,sent}=fixture();ui.point({point:{x:1,z:1},pkField:77,button:2});assert.deepEqual(sent.at(-1),{type:'pkAttack',target:77});});
