import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {transform} from 'esbuild';
import {readFileSync} from 'node:fs';
import {Game} from '../shared/simulation.js';
import {RO_EQUIPMENT,createRoEquipment,roBagUsage} from '../shared/ragnarok-equipment.js';
import {createBonkUI,bonkInteraction,bonkUpgradeMarkup,BONK_HELP} from '../src/bonk-ui.js';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
import {roSecretMerchantMarkup} from '../src/ro-secret-merchant-ui.js';

function setup(){const g=new Game(84,{mode:'bonk',bonkLineage:'dragonknight'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=qualifiedRoTestHero(g.player('p'),{}),merchant=g.bonk.objects.find(o=>o.type==='secretMerchant');assert.ok(merchant);u.x=merchant.x;u.z=merchant.z;u.gold=2000;g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.ambientSeeded=true;g.tick(.05);return{g,u,merchant};}
test('merchant E and pointer open a shop and pause local input without buying anything',()=>{
 for(const input of ['E','pointer']){const {g,u,merchant}=setup(),sent=[],paused=[],getState=()=>g.snapshotFor('p'),ui=createBonkUI({getState,getOwner:()=> 'p',send:command=>{sent.push(command);g.command('p',command);},onInventory:value=>paused.push(value)});const gold=u.gold,entry=bonkInteraction(getState().bonk,u);assert.equal(entry.merchant,true);assert.match(entry.description,/comparar antes/);if(input==='E')ui.action('interact');else ui.point({bonkObject:merchant.id,button:0});assert.deepEqual(sent.map(c=>c.type),['bkMove','bkInteract']);assert.equal(u.gold,gold);assert.equal(paused.at(-1),true);assert.equal(getState().bonk.secretMerchant.id,merchant.id);ui.action('interact');assert.equal(sent.at(-1).type,'bkSecretClose');assert.equal(paused.at(-1),false);assert.equal(getState().bonk.secretMerchant,null);}
});
test('compact shop shows three real offers and actual/new comparisons, guards capacity and sold stock',()=>{
 const {g,u,merchant}=setup();assert.ok(g.command('p',{type:'bkInteract',object:merchant.id}));let shop=g.snapshotBonk().secretMerchant;const selected=shop.offers[0],before=JSON.stringify(u),html=roSecretMerchantMarkup(shop,u,{selectedOfferId:selected.id,online:true});assert.equal((html.match(/data-bk-secret-inspect=/g)||[]).length,3);assert.match(html,/ATUAL ·/);assert.match(html,/NOVO/);assert.match(html,/Bônus completos ao equipar/);assert.match(html,/Online · o mundo continua/);assert.match(html,/data-bk-secret-buy=/);assert.match(html,/data-ro-item-icon=/);assert.doesNotMatch(html,/portrait|Refinar|refine/i);assert.equal(JSON.stringify(u),before);
 for(let i=0;i<30;i++)u.roInventory.push(createRoEquipment('knife','full-'+i));assert.equal(roBagUsage(u),30);shop=g.snapshotBonk().secretMerchant;const full=roSecretMerchantMarkup(shop,u);assert.match(full,/Mochila cheia/);assert.match(full,/data-bk-secret-buy="[^"]+" disabled/);const gold=u.gold;assert.equal(g.command('p',{type:'bkSecretBuy',object:merchant.id,offer:selected.id}),false);assert.equal(u.gold,gold);
});
test('confirmed purchase receipt opens the owned inventory item and leaves equipment selection explicit',()=>{
 const {g,u,merchant}=setup();g.command('p',{type:'bkInteract',object:merchant.id});const offer=g.snapshotBonk().secretMerchant.offers[0],worn=u.roEquipment.weapon;assert.ok(g.command('p',{type:'bkSecretBuy',object:merchant.id,offer:offer.id}));const b=g.snapshotBonk(),receipt=b.lastLoot.equipment[0];assert.equal(b.lastLoot.kind,'merchant');assert.ok(u.roInventory.some(i=>i.id===receipt.id));assert.equal(u.roEquipment.weapon,worn);const html=roSecretMerchantMarkup(b.secretMerchant,u,{selectedOfferId:offer.id,receipt:{id:receipt.id,name:receipt.name}});assert.match(html,/Compra recebida/);assert.match(html,new RegExp('data-bk-secret-inventory="'+receipt.id+'"'));assert.match(html,/data-bk-secret-buy="[^"]+" disabled/);assert.match(html,/Esgotado/);assert.equal(u.gold,2000-offer.price);assert.equal(RO_EQUIPMENT[offer.key].grade,3);
});
test('four randomized choices are final; the collection cannot be opened during an offer and HUD upgrades require an offered key',()=>{
 const offer={id:1,choices:[{id:'a',key:'bash',kind:'weapon',name:'Golpe',level:2,description:'Impacto'}]},html=bonkUpgradeMarkup(offer);assert.doesNotMatch(html,/Escolher outra habilidade|data-bk-skills|qualquer outra habilidade/);assert.match(html,/quatro melhorias sorteadas/);assert.match(BONK_HELP,/quatro ofertas|quatro melhorias/);const sent=[],u={id:1},state={options:{mode:'bonk'},players:{p:1},units:[u],bonk:{stage:'levelup',offer}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>sent.push(c),onInventory:()=>assert.fail('offer cannot open collection')});ui.action('skills');ui.chooseSkill('not-offered');assert.deepEqual(sent,[]);
 const dock=roSkillDockMarkup([{key:'basic',name:'Básico',level:1},{key:'bash',name:'Golpe',level:1},{key:'fire',name:'Fogo',level:1}],{upgradeAvailable:true,upgradeKeys:['bash']});assert.match(dock,/data-bk-upgrade="bash"  aria-label/);assert.match(dock,/data-bk-upgrade="basic" disabled/);assert.match(dock,/data-bk-upgrade="fire" disabled/);
});
test('merchant layout CSS parses and remote values are escaped',async()=>{
 await transform(readFileSync(new URL('../src/ro-secret-merchant-ui.css',import.meta.url),'utf8'),{loader:'css'});const {g,u,merchant}=setup();g.command('p',{type:'bkInteract',object:merchant.id});const snapshot=g.snapshotBonk().secretMerchant;snapshot.name='<img onerror=bad>';snapshot.offers[0].name='<script>bad</script>';const html=roSecretMerchantMarkup(snapshot,u);assert.match(html,/&lt;img onerror=bad&gt;/);assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.doesNotMatch(html,/<img[^>]+onerror|<script/);
});
