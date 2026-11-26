import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {equippedSkillDetails,skillHoverCardMarkup} from '../src/skill-hover-card.js';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
test('equipped classic skill cards compare actual current and next ranks, and upgrades spend exactly one authoritative point',()=>{
 const g=new Game(19,{mode:'campaign'});g.addPlayer('p','knight');const u=qualifiedRoTestHero(g.player('p'),{jobLevel:10});u.level=30;u.skillPoints=1;const key=u.skills[0],token='classic:'+key;
 const before=equippedSkillDetails(g.snapshot(),u,token);assert.equal(before.rank,1);assert.equal(before.canUpgrade,true);assert.ok(before.rows.length>=3);
 const html=skillHoverCardMarkup(before);assert.match(html,/Atual/);assert.match(html,/Próximo/);assert.match(html,/1 ponto/);
 assert.equal(g.command('p',{type:'buy',skill:key}),true);assert.equal(u.skillPoints,0);const after=equippedSkillDetails(g.snapshot(),u,token);assert.equal(after.rank,2);assert.equal(after.canUpgrade,false);assert.match(after.upgradeReason,/ponto/);
 assert.equal(g.command('p',{type:'buy',skill:key}),false);assert.equal(equippedSkillDetails(g.snapshot(),u,'classic:unknown'),null);
 u.skillLevels[key]=5;assert.equal(equippedSkillDetails(g.snapshot(),u,token).max,5);assert.doesNotMatch(skillHoverCardMarkup(equippedSkillDetails(g.snapshot(),u,token)),/<b>Próximo<\/b>/);
});
test('Ragnarok skill cards use effective cooldown once and quick upgrades share the existing level-up improvement',()=>{
 const g=new Game(57,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=qualifiedRoTestHero(g.player('p'),{jobLevel:10});u.bonkBuild.tomes.haste=3;
 let state=g.snapshotFor('p'),entry=state.bonk.weapons[1],details=equippedSkillDetails(state,u,'ro:'+entry.key);assert.equal(details.canUpgrade,false);
 const cooldown=details.rows.find(r=>r.label==='Recarga').current;assert.equal(cooldown,Number(entry.cooldown.toFixed(2)).toLocaleString('pt-BR')+' s');
 g.bonk.offer={id:1,choices:[]};g.bonk.stage='levelup';u.bonkPendingLevels=1;state=g.snapshotFor('p');details=equippedSkillDetails(state,u,'ro:'+entry.key);assert.equal(details.canUpgrade,false);assert.match(details.upgradeReason,/quatro ofertas/);g.bonk.offer.choices=[{id:'offered-skill',kind:'weapon',key:entry.key,level:2,name:entry.name,description:entry.description}];state=g.snapshotFor('p');details=equippedSkillDetails(state,u,'ro:'+entry.key);assert.equal(details.canUpgrade,true);
 const html=roSkillDockMarkup(state.bonk.weapons,{upgradeAvailable:true,upgradeKeys:[entry.key]});assert.match(html,/data-bk-upgrade=/);assert.match(html,/data-skill-info/);
 assert.equal(g.command('p',{type:'bkChooseSkill',key:entry.key}),true);assert.equal(u.bonkPendingLevels,0);assert.equal(u.bonkBuild.weapons[entry.key],2);
 assert.equal(g.command('p',{type:'bkChooseSkill',key:entry.key}),false);
});
test('skill detail cards escape names and descriptions',()=>{
 const html=skillHoverCardMarkup({key:'test',name:'<script>',art:'heal',description:'<img onerror=bad>',rank:1,max:5,kind:'Ativa',rows:[],upgradeReason:'<unsafe>',auto:false});assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/&lt;script&gt;/);
});
