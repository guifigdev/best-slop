import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_CARDS,RO_LOOT_RATES} from '../shared/ragnarok-equipment.js';
import {LOOT_RARITIES} from '../shared/rarity.js';
import {roCardRarityVisual} from '../shared/ro-card-rarity.js';
import {roCardCollectionMarkup} from '../src/ro-card-discovery.js';
import {createRoCardDropArt,RO_CARD_DROP_DURATION,roCardPickupRequest} from '../src/ro-card-drop-art.js';

test('every card has a local rarity and reuses the exact Custom Hero colors without changing drop odds',()=>{
 const grades=new Set();for(const card of Object.values(RO_CARDS)){const visual=roCardRarityVisual(card);assert.equal(visual,LOOT_RARITIES[card.rarity]);grades.add(card.rarity);}assert.equal(grades.size,5);assert.equal(RO_CARDS.poring.rarity,'common');assert.equal(RO_CARDS.baphomet.rarity,'legendary');assert.equal(RO_CARDS.ifrit.rarity,'heroic');assert.deepEqual(RO_LOOT_RATES,{card:.005,bossCard:.005,equipment:.06});
 const html=roCardCollectionMarkup(['ifrit','poring']);assert.ok(html.indexOf('data-ro-card="ifrit"')<html.indexOf('data-ro-card="fabre"'),'owned cards appear first');for(const key of ['ifrit','poring'])assert.ok(html.includes('--ro-card-rarity:'+LOOT_RARITIES[RO_CARDS[key].rarity].color));const owned=roCardCollectionMarkup(['poring'],{ownedOnly:true});assert.ok(!owned.includes('data-ro-card="fabre"'));assert.ok(owned.includes('Carta descoberta'));
});
test('card discoveries have real colored cards and beacons, share two draws, expire and dispose safely',()=>{
 const scene=new T.Scene(),art=createRoCardDropArt({scene}),keys=['poring','baphomet','ifrit'],drops=keys.map((key,i)=>({key,x:i*3,z:0,at:0})),state={options:{mode:'bonk'},units:[]};art.update(drops,state,.2,()=>4);assert.equal(art.stats().cards,3);assert.equal(art.stats().drawCalls,2);assert.deepEqual(art.stats().rarities,keys.map(k=>RO_CARDS[k].rarity));const beams=scene.getObjectByName('ro-rarity-card-beacons'),color=new T.Color(),m=new T.Matrix4();for(let i=0;i<3;i++){beams.getColorAt(i,color);assert.equal('#'+color.getHexString(),LOOT_RARITIES[RO_CARDS[keys[i]].rarity].color);beams.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));assert.ok(m.elements[13]>4);}art.update(drops,state,RO_CARD_DROP_DURATION+1);assert.equal(art.stats().cards,0);assert.equal(art.stats().drawCalls,0);art.update(drops,{options:{mode:'warlock'}},.2);assert.equal(art.stats().cards,0);art.dispose();art.dispose();assert.equal(scene.children.length,0);
});

test('ground-card labels have a fixed anchor, hold still under the pointer, and send a complete pickup event',()=>{
 class Element{constructor(tag){this.tag=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.classList={add(){}};this.offsetWidth=190;this.offsetHeight=43;}append(e){e.parent=this;this.children.push(e);}remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}replaceChildren(){this.children=[];}setAttribute(k,v){this[k]=v;}querySelector(tag){return this.children.find(c=>c.tag===tag);}}
 const container=new Element('world');container.clientWidth=1000;container.clientHeight=700;container.ownerDocument={createElement:tag=>new Element(tag)};const camera=new T.PerspectiveCamera(60,1000/700,.1,100);camera.position.set(0,2,6);camera.lookAt(0,1,0);camera.updateMatrixWorld();const clicked=[],drop={id:'receipt',key:'poring',pending:true,x:0,z:0,at:0},state={options:{mode:'bonk'},units:[{id:1,bonkHero:true,x:0,z:1}]},art=createRoCardDropArt({scene:new T.Scene(),container,onPickup:d=>clicked.push(roCardPickupRequest(d))});try{
  art.update([drop],state,.1,()=>0,camera,1);const label=container.children[0].children[0],top=label.style.top;art.update([drop],state,.4,()=>0,camera,1);assert.equal(label.style.top,top,'label does not bob with the physical card');label.onpointerenter();const left=label.style.left;camera.position.x=1;camera.lookAt(1,1,0);camera.updateMatrixWorld();art.update([drop],state,.6,()=>0,camera,1);assert.equal(label.style.left,left,'hovering locks the clickable target');label.onclick({stopPropagation(){}});assert.deepEqual(clicked,[{button:0,point:{x:0,z:0},roCardDrop:'receipt'}]);label.onpointerleave();art.update([drop],state,.7,()=>0,camera,1);assert.notEqual(label.style.left,left);state.units[0].z=8;art.update([drop],state,.8,()=>0,camera,1);assert.match(label.querySelector('small').textContent,/Aproxime-se · 8 m/);
 }finally{art.dispose();}
});
