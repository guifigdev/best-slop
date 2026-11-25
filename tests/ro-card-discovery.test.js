import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_CARDS,RO_LOOT_RATES} from '../shared/ragnarok-equipment.js';
import {LOOT_RARITIES} from '../shared/rarity.js';
import {roCardRarityVisual} from '../shared/ro-card-rarity.js';
import {roCardCollectionMarkup} from '../src/ro-card-discovery.js';
import {createRoCardDropArt,RO_CARD_DROP_DURATION} from '../src/ro-card-drop-art.js';

test('every card has a local rarity and reuses the exact Custom Hero colors without changing drop odds',()=>{
 const grades=new Set();for(const card of Object.values(RO_CARDS)){const visual=roCardRarityVisual(card);assert.equal(visual,LOOT_RARITIES[card.rarity]);grades.add(card.rarity);}assert.equal(grades.size,5);assert.equal(RO_CARDS.poring.rarity,'common');assert.equal(RO_CARDS.baphomet.rarity,'legendary');assert.equal(RO_CARDS.ifrit.rarity,'heroic');assert.deepEqual(RO_LOOT_RATES,{card:.005,bossCard:.005,equipment:.06});
 const html=roCardCollectionMarkup(['ifrit','poring']);assert.ok(html.indexOf('data-ro-card="ifrit"')<html.indexOf('data-ro-card="fabre"'),'owned cards appear first');for(const key of ['ifrit','poring'])assert.ok(html.includes('--ro-card-rarity:'+LOOT_RARITIES[RO_CARDS[key].rarity].color));const owned=roCardCollectionMarkup(['poring'],{ownedOnly:true});assert.ok(!owned.includes('data-ro-card="fabre"'));assert.ok(owned.includes('Conquistada permanentemente'));
});
test('card discoveries have real colored cards and beacons, share two draws, expire and dispose safely',()=>{
 const scene=new T.Scene(),art=createRoCardDropArt({scene}),keys=['poring','baphomet','ifrit'],drops=keys.map((key,i)=>({key,x:i*3,z:0,at:0})),state={options:{mode:'bonk'},units:[]};art.update(drops,state,.2,()=>4);assert.equal(art.stats().cards,3);assert.equal(art.stats().drawCalls,2);assert.deepEqual(art.stats().rarities,keys.map(k=>RO_CARDS[k].rarity));const beams=scene.getObjectByName('ro-rarity-card-beacons'),color=new T.Color(),m=new T.Matrix4();for(let i=0;i<3;i++){beams.getColorAt(i,color);assert.equal('#'+color.getHexString(),LOOT_RARITIES[RO_CARDS[keys[i]].rarity].color);beams.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));assert.ok(m.elements[13]>4);}art.update(drops,state,RO_CARD_DROP_DURATION+1);assert.equal(art.stats().cards,0);assert.equal(art.stats().drawCalls,0);art.update(drops,{options:{mode:'warlock'}},.2);assert.equal(art.stats().cards,0);art.dispose();art.dispose();assert.equal(scene.children.length,0);
});
