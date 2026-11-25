import test from 'node:test';
import assert from 'node:assert/strict';
import {hudLauncherActions,hudPanelContext,hudResources,hudResourceMarkup} from '../src/rts-hud.js';
const actions=(mode,u={alive:true})=>hudLauncherActions({options:{mode}},u).map(a=>a.action);
test('construction belongs to the character command bar and never the side launcher',()=>{
 for(const mode of ['campaign','tower','best','war','linewars','dungeon','bonk','bloody','warlock','phasekiller','castlefight','treetag','kodotag'])assert.ok(!actions(mode).includes('build'),mode);
});
test('roles and capture state remove unavailable building actions',()=>{
 assert.ok(!actions('treetag',{alive:true,treeTagRole:'infernal'}).includes('build'));
 assert.ok(!actions('treetag',{alive:true,treeTagRole:'ent',treeTagCaptured:true}).includes('build'));
 assert.ok(!actions('kodotag',{alive:true,kodoTagCaptured:true}).includes('build'));
 assert.ok(!actions('kodotag',{alive:false}).includes('build'));
});
test('modes without item inventory hide the bag while equipment games keep access even when empty',()=>{
 for(const mode of ['kodotag','bloody'])assert.ok(!actions(mode).includes('inventory'));
 for(const mode of ['campaign','tower','best','war','linewars','bonk','dungeon','castlefight','treetag','warlock','phasekiller'])assert.ok(actions(mode).includes('inventory'),mode);
 assert.deepEqual(hudLauncherActions(null,null),[]);assert.deepEqual(hudLauncherActions({options:{mode:'campaign'}},null),[]);
 assert.equal(hudLauncherActions({options:{mode:'bloody'}},{alive:true})[0].label,'Exército');
});

test('RPG shortcuts separate attributes from skills and badge only the matching points',()=>{
 for(const mode of ['campaign','tower','best','war','linewars','dungeon','bonk']){
  const shortcuts=hudLauncherActions({options:{mode}},{attributePoints:8,skillPoints:3});
  assert.deepEqual(shortcuts.map(a=>a.action),['character','skills','inventory'],mode);
  assert.deepEqual(shortcuts.slice(0,2).map(a=>[a.label,a.points]),[['Atributos',8],['Habilidades',3]],mode);
 }
 const empty=hudLauncherActions({options:{mode:'campaign'}},{attributePoints:-5,skillPoints:0});
 assert.deepEqual(empty.slice(0,2).map(a=>a.points),[0,0]);
});

test('Warlock offers its grimoire and bag without inventing an attribute sheet',()=>{
 const entries=hudLauncherActions({options:{mode:'warlock'}},{attributePoints:99,skillPoints:5});
 assert.deepEqual(entries.map(a=>[a.action,a.label]),[['skills','Grimório'],['inventory','Mochila']]);
 assert.ok(entries.every(a=>!a.points));
 for(const mode of ['treetag','castlefight','kodotag','bloody','phasekiller'])assert.deepEqual(actions(mode).filter(a=>a==='skills'),[],mode);
});

test('hero windows are contextual and legacy modes retain their command titles',()=>{
 const state={options:{mode:'campaign'}};
 assert.deepEqual(hudPanelContext(state),{title:'Atributos',eyebrow:'SEU PERSONAGEM',page:'attributes'});
 assert.deepEqual(hudPanelContext(state,'skills'),{title:'Habilidades',eyebrow:'SUAS TÉCNICAS',page:'skills'});
 assert.equal(hudPanelContext({options:{mode:'treetag'}},'attributes').page,'commands');
 assert.equal(hudPanelContext({options:{mode:'phasekiller'}},'attributes').title,'Investigação');
 assert.equal(hudPanelContext(state,'line').title,'Comandos da linha');
});

test('fixed resource widget exposes only mode resources with accessible, bounded values',()=>{
 const u={gold:1210.9,lumber:53.7,score:4,btBlood:8,essence:2};
 assert.deepEqual(hudResources({options:{mode:'treetag'}},u).map(r=>[r.key,r.value]),[['gold',1210],['wood',53]]);
 assert.deepEqual(hudResources({options:{mode:'warlock'}},u).map(r=>r.key),['gold','score']);
 assert.deepEqual(hudResources(null,u),[]);
 const html=hudResourceMarkup({options:{mode:'bonk'}},u);assert.match(html,/aria-label="Zeny: 1210"/);assert.match(html,/>1\.210<\/b>/);assert.doesNotMatch(html,/Madeira|Essência/);
});
