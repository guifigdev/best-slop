import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS,ITEMS} from '../shared/catalog.js';
import {WARLOCK_SKILLS,WARLOCK_ITEMS} from '../shared/warlock-catalog.js';
import {TREE_TAG_SKILLS,TREE_TAG_ITEMS} from '../shared/tree-tag-catalog.js';
import {CASTLE_ITEMS} from '../shared/castle-catalog.js';
import {icon} from '../src/art.js';
import {legacyIcon,legacyItemIcon} from '../src/legacy-ui.js';
import {gameIllustration} from '../src/game-illustrations.js';
import {castleInventoryMarkup} from '../src/castle-inventory-ui.js';

test('the shared Custom Hero icon entry point actually exposes each catalog illustration in both skills and item consumers',()=>{
 for(const [kind,catalog]of [['skill',SKILLS],['item',ITEMS]])for(const key of Object.keys(catalog))assert.equal(icon(key),gameIllustration('survival',kind,key),key);
});
test('Warlock and Tree Tag HUD/store helpers resolve native keys without collapsing unfamiliar families into one fallback bolt',()=>{
 for(const [game,skills,items]of [['warlock',WARLOCK_SKILLS,WARLOCK_ITEMS],['treetag',TREE_TAG_SKILLS,TREE_TAG_ITEMS]]){const rendered=new Set();for(const [key,s]of Object.entries(skills)){const svg=legacyIcon(s,game);assert.equal(svg,gameIllustration(game,'skill',key));assert.equal(legacyIcon(s),svg);rendered.add(svg);}assert.equal(rendered.size,Object.keys(skills).length);for(const [key,item]of Object.entries(items))assert.equal(legacyItemIcon(game,item),gameIllustration(game,'item',key));}
});
test('every Castle inventory item retains its own illustration, including equal concept names from other games',()=>{
 for(const key of Object.keys(CASTLE_ITEMS)){const html=castleInventoryMarkup({inventory:[{key,charges:1}]},{cooldowns:{}},0);assert.ok(html.includes(gameIllustration('castlefight','item',key)),key);assert.match(html,/data-illustration="castlefight\/item\//);assert.equal((html.match(/data-cf-inventory=/g)||[]).length,6);}
});
