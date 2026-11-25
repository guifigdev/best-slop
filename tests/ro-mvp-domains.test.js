import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_WORLD_ROUTE,roWorldRegion} from '../shared/ro-world-route.js';
import {RO_MVP_DOMAINS,roMvpDomainProps} from '../shared/ro-mvp-domain.js';
import {roMvpDomainParts} from '../src/ro-mvp-domain-art.js';
import {roTownServices,roTownStock} from '../shared/ro-town-services.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {roTradeHub,roHasSecretMerchant} from '../shared/ro-region-services.js';
import {environmentPlacement,environmentProfile} from '../src/environment-pack-art.js';
test('all current MVP regions receive distinct full-volume domain props outside their arena, without extra colliders',()=>{
 const shapes=new Set();for(const domain of Object.values(RO_MVP_DOMAINS)){const parts=roMvpDomainParts(domain);assert.ok(parts.length>8&&parts.length<=100,domain);assert.equal(parts,roMvpDomainParts(domain));assert.ok(parts.every(p=>p.slice(0,7).every(Number.isFinite)&&p.slice(3,6).every(v=>v>0)),domain);shapes.add(JSON.stringify(parts));}assert.equal(shapes.size,Object.keys(RO_MVP_DOMAINS).length);
 for(const region of RO_WORLD_ROUTE){const props=roMvpDomainProps(region);assert.ok(props.length>=4,region.key);for(const p of props){assert.equal(p.solid,false);assert.ok(Math.hypot(p.x-region.bossArena.x,p.z-region.bossArena.z)>region.bossArena.radius);assert.ok(roMvpDomainParts(p.domain,p.variant).length);}}
 const region=roWorldRegion('thor-volcano',17),map=generateBonkLevel(17,region.scene,region.habitat,region);assert.ok(map.decorations.some(d=>d.type==='mvp-domain-prop'&&d.domain==='volcano'));assert.ok(!map.obstacles.some(d=>d.type==='mvp-domain-prop'));
});
test('settlements replace ubiquitous shops; boss dungeons contain neither a normal shop nor a hidden vendor',()=>{
 let hubs=0;for(const region of RO_WORLD_ROUTE){const map={seed:17,stageKey:region.scene,route:region,spawn:region.entry,obstacles:[],minX:-115,maxX:115,minZ:-115,maxZ:115};const services=roTownServices(map);if(roTradeHub(map)){hubs++;assert.equal(services.length,5);}else assert.deepEqual(services,[]);if(['thor-volcano','ice-cavern','morroc-pyramid','glast-heim','toy-factory'].includes(region.key)){assert.equal(roTradeHub(map),null);assert.equal(roHasSecretMerchant(map),false);}}assert.equal(hubs,7);
});
test('one regional market offers the same cross-class stock to every player and hive surroundings include bees and beehives',()=>{
 const region=RO_WORLD_ROUTE[0],map={seed:17,stageKey:region.scene,route:region,spawn:region.entry,obstacles:[]},game={bonk:{map,clearedStages:[]}},shop={id:'town:17:equipmentShop',type:'equipmentShop'};assert.deepEqual(roTownStock(game,{roLineage:'shadowcross'},shop),roTownStock(game,{roLineage:'archmage'},shop));assert.ok(roTownStock(game,{},shop).length>=12);const state={options:{mode:'bonk'},worldSeed:17,bonk:{map}};assert.equal(environmentProfile(state).life,'bees');assert.ok(environmentPlacement(state).some(p=>p.source==='mvp-domain'&&p.key==='beehive'));
});
