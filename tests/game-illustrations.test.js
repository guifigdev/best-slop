import {PHASE_KILLER_SKILLS,PHASE_KILLER_ITEMS} from '../shared/phase-killer-catalog.js';
import {KODO_TAG_SKILLS} from '../shared/kodo-tag-catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS,ITEMS} from '../shared/catalog.js';
import {WARLOCK_SKILLS,WARLOCK_ITEMS,WARLOCK_MASTERIES} from '../shared/warlock-catalog.js';
import {TREE_TAG_SKILLS,TREE_TAG_ITEMS,TREE_TAG_WORKER_SKILLS} from '../shared/tree-tag-catalog.js';
import {CASTLE_ITEMS} from '../shared/castle-catalog.js';
import {gameIllustration,gameIllustrationSpec,illustrationCatalog} from '../src/game-illustrations.js';

test('all six games have original illustrations for every current skill, item and mastery including archived Castle items',()=>{
 let count=0;
 for(const [game,kind,catalog]of [
  ['phasekiller','skill',PHASE_KILLER_SKILLS],['phasekiller','item',PHASE_KILLER_ITEMS],['survival','skill',SKILLS],['survival','item',ITEMS],
  ['warlock','skill',WARLOCK_SKILLS],['warlock','item',WARLOCK_ITEMS],['warlock','mastery',WARLOCK_MASTERIES],
  ['treetag','skill',TREE_TAG_SKILLS],['treetag','skill',TREE_TAG_WORKER_SKILLS],['kodotag','skill',KODO_TAG_SKILLS],['treetag','item',TREE_TAG_ITEMS],['castlefight','item',CASTLE_ITEMS]
 ])for(const [key,definition]of Object.entries(catalog)){
  const spec=gameIllustrationSpec(game,kind,key);assert.ok(spec,`${game}/${kind}/${key}`);assert.equal(spec.name,definition.name);assert.ok(spec.paths.length>80);assert.ok(Object.isFrozen(spec));assert.ok(gameIllustration(game,kind,key));count++;
 }
 for(const key of ['blink','cancel','repair','rescue']){assert.ok(gameIllustration('castlefight','skill',key));count++;}
 assert.equal(illustrationCatalog().length,count);assert.ok(count>=205);
});

test('related actions have distinct central subjects, rather than merely a different frame or palette over one fallback bolt',()=>{
 for(const game of ['survival','warlock','treetag','castlefight','kodotag'])for(const kind of ['skill','item','mastery']){
  const entries=illustrationCatalog().filter(s=>s.game===game&&s.kind===kind);
  assert.equal(new Set(entries.map(s=>s.paths)).size,entries.length,`${game}/${kind}`);
 }
 for(const key of ['S009','S030','S055','S006','S056','S057','S019','S050']){
  const svg=gameIllustration('warlock','skill',key);assert.notEqual(svg,gameIllustration('warlock','skill','S002'));assert.match(svg,/class="illustration-subject"/);
 }
 assert.notEqual(gameIllustration('treetag','item','I000'),gameIllustration('treetag','item','I006'));
 assert.notEqual(gameIllustration('castlefight','item','double_damage'),gameIllustration('castlefight','item','quad_damage'));
});

test('SVGs are bounded cacheable code-native assets with no external textures, active content or unresolved materials',()=>{
 let maximumBytes=0;
 for(const spec of illustrationCatalog()){
  const svg=gameIllustration(spec.game,spec.kind,spec.key);maximumBytes=Math.max(maximumBytes,svg.length);
  assert.match(svg,/^<svg viewBox="0 0 64 64"/);assert.ok(svg.endsWith('</svg>'));assert.match(svg,/aria-hidden="true"/);
  assert.doesNotMatch(svg,/undefined|NaN|Infinity|<image|<script|<foreignObject|href=|\bon\w+=|url\(/i);
  assert.doesNotMatch(svg,/(?:fill|stroke)="(?:light|accent|bright|shade)"/);
  assert.equal(gameIllustration(spec.game,spec.kind,spec.key),svg);assert.ok(svg.length<5000);
 }
 assert.ok(maximumBytes>1000);
 for(const mode of ['campaign','best','tower','war','linewars','customhero'])assert.equal(gameIllustration(mode,'skill','bolt'),gameIllustration('survival','skill','bolt'));
});

test('namespaces isolate equal item keys and unknown input never silently acquires an unrelated skill illustration',()=>{
 assert.notEqual(gameIllustration('survival','item','staff'),gameIllustration('warlock','item','staff'));
 assert.notEqual(gameIllustration('survival','skill','blink'),gameIllustration('treetag','skill','blink'));
 for(const [game,kind,key]of [['unknown','skill','bolt'],['warlock','skill','__proto__'],['warlock','item','toString'],['treetag','mastery','duration'],['castlefight','skill','S000'],['survival','skill','<script>'],['survival','item','bolt']]){
  assert.equal(gameIllustrationSpec(game,kind,key),null);assert.equal(gameIllustration(game,kind,key),'');
 }
});
