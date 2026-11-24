import test from 'node:test';
import assert from 'node:assert/strict';
import {generateBonkLevel,bonkBlocked} from '../shared/bonk-level.js';
import {RO_WORLD_ROUTE,roWorldRegion} from '../shared/ro-world-route.js';
import {roIceWeightAt,roIcePatches} from '../shared/ro-ice-terrain.js';
import {generateRoSecretMerchants} from '../shared/ro-secret-merchants.js';
import {RO_ENVIRONMENT_THEMES,RO_LAVA_CHANNEL_CELL_SIZE,roLavaChannelAt,roEnvironmentHazards,roHazardContains,roHazardBoundary,roEnvironmentHazardAt,tickRoEnvironmentHazards,roEnvironmentHazardSnapshot} from '../shared/ro-environment-hazards.js';

function mapFor(key='thor-volcano',seed=29){const r=roWorldRegion(key,seed);return generateBonkLevel(seed,r.scene,r.habitat,r);}
function setup(key='thor-volcano'){
 const map=mapFor(key),zone=roEnvironmentHazards(map)[0],unit={id:'hero',bonkHero:true,alive:true,maxHp:1000,hp:1000,x:zone.x,z:zone.z},hits=[];
 const game={options:{mode:'bonk'},time:0,bonk:{map,activity:'adventure',stage:'playing'},random:()=>{throw Error('Hazards must not use combat RNG.');}};
 const tick=(seconds,dt=.05)=>{let result;for(let i=0;i<Math.round(seconds/dt);i++){game.time+=dt;result=tickRoEnvironmentHazards(game,unit,dt,{damage:(amount,element)=>{hits.push({amount,element,at:game.time});unit.hp-=amount;}});}return result;};
 return{map,zone,unit,game,hits,tick};
}

test('all 16 regions have seeded optional clearings, safe roads, gates, arenas and reachable footprints',()=>{
 assert.equal(Object.keys(RO_ENVIRONMENT_THEMES).length,22);
 for(const seed of [1,29,73,124])for(const region of RO_WORLD_ROUTE){
  const map=mapFor(region.key,seed),merchants=generateRoSecretMerchants(map);map.objects.push(...merchants);const before=JSON.stringify(map),zones=roEnvironmentHazards(map);
  assert.ok(zones.length>=2&&zones.length<=3,region.key+' seed '+seed);
  assert.deepEqual(zones,roEnvironmentHazards(structuredClone(map)));
  assert.equal(JSON.stringify(map),before,'generation never alters terrain/colliders');
  for(const zone of zones){
   assert.equal(roEnvironmentHazardAt(map,zone.x,zone.z),zone);
   assert.equal(bonkBlocked(map,zone,.8),false);
   for(const p of roHazardBoundary(zone,64))assert.equal(bonkBlocked(map,p,.7),false);
   for(const safe of [map.spawn,map.route.entry,map.route.bossArena,...map.route.gates,...merchants])assert.equal(roHazardContains(zone,safe.x,safe.z),false);
   for(const path of map.paths){const dx=path.to.x-path.from.x,dz=path.to.z-path.from.z;for(let i=0;i<=40;i++)for(const side of [-1,0,1]){const len=Math.hypot(dx,dz)||1,x=path.from.x+dx*i/40-dz/len*side*(path.width||12)/2,z=path.from.z+dz*i/40+dx/len*side*(path.width||12)/2;assert.equal(roHazardContains(zone,x,z),false,'whole road width stays safe');}}
  }
  map.objects.pop();map.obstacles.pop();assert.equal(roEnvironmentHazards(map),zones,'removing props never relocates an existing hazard');assert.ok(Object.isFrozen(zones)&&zones.every(Object.isFrozen));
 }
 assert.deepEqual(roEnvironmentHazards({...mapFor(),tower:{floor:1}}),[]);
 assert.deepEqual(roEnvironmentHazards(generateBonkLevel(29,'grove')),[],'unrouted legacy maps keep their existing terrain');
});

test('rotated elliptical host containment and renderer boundary agree without bounding-box damage',()=>{
 const zone={x:9,z:-3,rx:6,rz:2,angle:Math.PI/3},boundary=roHazardBoundary(zone);
 assert.equal(boundary.length,64);assert.equal(roHazardContains(zone,9,-3),true);
 for(const p of boundary){assert.equal(roHazardContains(zone,9+(p.x-9)*.999,-3+(p.z+3)*.999),true);assert.equal(roHazardContains(zone,9+(p.x-9)*1.001,-3+(p.z+3)*1.001),false);}
 assert.equal(roHazardContains(zone,15,-1),false);assert.equal(roHazardContains(zone,NaN,0),false);
});

test('lava warns before local periodic damage and never catches up into a burst',()=>{
 const{unit,game,hits,tick,zone}=setup();const warning=tick(1.15);assert.equal(warning.status.phase,'warning');assert.equal(warning.speedMultiplier,1);assert.equal(hits.length,0);
 const active=tick(.05);assert.equal(active.status.phase,'active');assert.equal(hits.length,1);assert.equal(hits[0].element,'fire');assert.equal(hits[0].amount,35);
 tick(3);assert.equal(hits.length,4);for(let i=1;i<hits.length;i++)assert.ok(hits[i].at-hits[i-1].at>.99);
 const count=hits.length;tickRoEnvironmentHazards(game,unit,3600,{damage:()=>hits.push({})});assert.ok(hits.length<=count+1);assert.ok(unit.roEnvironmentExposure.exposure<5,'suspended wall time is not simulated');
 unit.x=zone.x+20;tick(.05);assert.equal(unit.roEnvironmentExposure,undefined);assert.equal(roEnvironmentHazardSnapshot(unit),null);
});

test('deep snow accumulates for 3s, progressively chills, preserves skill frost, and resets outside',()=>{
 const{map,unit,game,hits,tick,zone}=setup('ice-cavern');unit.frostUntil=100;
 assert.equal(tick(2.95).speedMultiplier,1);assert.equal(hits.length,0);
 const active=tick(.05);assert.equal(hits.length,1);assert.equal(hits[0].element,'ice');assert.ok(Math.abs(active.speedMultiplier-.9)<1e-8);assert.equal(unit.frostUntil,100);
 const chilled=tick(5);assert.ok(Math.abs(chilled.speedMultiplier-.65)<1e-8);assert.ok(unit.hp>750,'bounded cold exposure leaves time to escape');
 unit.x=zone.x+20;unit.z=zone.z+20;assert.equal(tick(.05).speedMultiplier,1);assert.equal(unit.roEnvironmentExposure,undefined);
 Object.assign(unit,{x:zone.x,z:zone.z});const again=tick(.05);assert.equal(again.status.phase,'warning');assert.equal(again.speedMultiplier,1);
 for(const key of ['ice-cavern','lutie'])for(const seed of [1,29,73,124]){const m=mapFor(key,seed);for(const h of roEnvironmentHazards(m)){assert.equal(roIceWeightAt(m,h.x,h.z),0);for(const p of roHazardBoundary(h))assert.equal(roIceWeightAt(m,p.x,p.z),0);}for(const ice of roIcePatches(m))assert.equal(roEnvironmentHazardAt(m,ice.x,ice.z),null);}
 assert.ok(map.route.key==='ice-cavern');assert.equal(game.bonk.activity,'adventure');
});

test('poison is local, leaves no lingering remote damage, and reentry gives a new warning',()=>{
 const{unit,hits,tick,zone}=setup('payon-forest');assert.equal(tick(.5).status.type,'poison');tick(1);assert.equal(hits.length,1);assert.equal(hits[0].element,'poison');
 unit.x=zone.x+30;tick(10);assert.equal(hits.length,1);
 Object.assign(unit,{x:zone.x,z:zone.z});tick(.5);assert.equal(hits.length,1);assert.equal(roEnvironmentHazardSnapshot(unit).phase,'warning');
});

test('pauses, improvement choices and non-heroes cannot advance or receive environmental damage',()=>{
 const{unit,game,hits,tick}=setup();tick(.8);const exposure=unit.roEnvironmentExposure.exposure;
 for(const apply of [()=>{game.paused=true;},()=>{game.bonk.paused=true;},()=>{game.bonk.stage='levelup';},()=>{unit.bonkOffer={choices:[]};},()=>{game.bonk.offer={choices:[]};}]){
  game.paused=false;game.bonk.paused=false;game.bonk.stage='playing';unit.bonkOffer=null;game.bonk.offer=null;apply();tick(5);assert.equal(unit.roEnvironmentExposure.exposure,exposure);assert.equal(hits.length,0);
 }
 game.bonk.offer=null;
 for(const patch of [{bonkHero:false,bonkEnemy:true},{bonkHero:false,roCompanion:true},{alive:false},{bonkDisconnected:true}]){const other={...unit,...patch};assert.deepEqual(tickRoEnvironmentHazards(game,other,.1,{damage:()=>assert.fail('only living player heroes may be damaged')}),{speedMultiplier:1,status:null});assert.equal(other.roEnvironmentExposure,undefined);}
});

test('region changes reset exposure and all themes use non-physical bounded damage',()=>{
 const{unit,game,hits,tick}=setup();tick(2);assert.equal(hits.length,1);const cold=mapFor('lutie');game.bonk.map=cold;const p=roEnvironmentHazards(cold)[0];Object.assign(unit,{x:p.x,z:p.z});const fresh=tick(.05);assert.equal(fresh.status.phase,'warning');assert.equal(fresh.status.type,'cold');assert.equal(hits.length,1);
 for(const theme of Object.values(RO_ENVIRONMENT_THEMES)){assert.notEqual(theme.element,'physical');assert.ok(theme.damageFraction>=.02&&theme.damageFraction<=.04);assert.ok(theme.speedMultiplier>=.65);}
});

test('existing orange lava channels share one global tile mask, local damage and protected clearings',()=>{
 const{game,unit,hits,tick,map}=setup(),step=RO_LAVA_CHANNEL_CELL_SIZE,zones=roEnvironmentHazards(map),before=JSON.stringify(map);let cell;
 outer:for(let iz=-29;iz<29;iz++)for(let ix=-29;ix<29;ix++){const x=ix*step,z=iz*step,p={x:x+step*.5,z:z+step*.5};if(roLavaChannelAt(map,p.x,p.z)&&!bonkBlocked(map,p,.5)&&!zones.some(h=>roHazardContains(h,p.x,p.z))){cell={x,z,...p,cornerX:x,cornerZ:z};break outer;}}
 assert.ok(cell,'reachable lava exists outside the three new ellipses');assert.equal(JSON.stringify(map),before);
 const p=cell;assert.ok(Math.abs(Math.sin(p.cornerX*.055+Math.sin(p.cornerZ*.038)*1.4))<.105);
 for(const dx of [.001,.9,3.599])for(const dz of [.001,1.8,3.599])assert.equal(roLavaChannelAt(map,p.cornerX+dx,p.cornerZ+dz),true,'whole 3.6m square matches its ground tile');
 assert.equal(roLavaChannelAt(map,p.cornerX,p.cornerZ),true,'renderer corner and hero tile sample agree');
 const contact=roEnvironmentHazardAt(map,p.x,p.z);assert.equal(contact.type,'lava');assert.match(contact.id,/:channel:/);assert.ok(!zones.some(h=>h.id===contact.id));
 for(const protectedMap of [
  {...map,spawn:p},
  {...map,route:{...map.route,entry:p}},
  {...map,route:{...map.route,gates:[p]}},
  {...map,route:{...map.route,bossArena:{...p,radius:28}}},
  {...map,objects:[{...p,type:'secretMerchant'}]},
  {...map,paths:[{from:{x:p.x-20,z:p.z},to:{x:p.x+20,z:p.z},width:12}]}
 ])assert.equal(roLavaChannelAt(protectedMap,p.x,p.z),false,'safe location removes the visible lava tile too');
 assert.equal(roLavaChannelAt({...map,tower:{floor:1}},p.x,p.z),false);
 assert.equal(roLavaChannelAt(mapFor('ice-cavern'),p.x,p.z),false,'ice never acquires lava damage');
 Object.assign(unit,{x:p.x,z:p.z});assert.equal(tick(1.15).status.phase,'warning');assert.equal(hits.length,0);tick(.05);assert.equal(hits.length,1);assert.equal(hits[0].element,'fire');
 game.paused=true;const exposure=unit.roEnvironmentExposure.exposure;tick(5);assert.equal(unit.roEnvironmentExposure.exposure,exposure);assert.equal(hits.length,1);
 game.paused=false;Object.assign(unit,map.spawn);tick(4);assert.equal(hits.length,1);assert.equal(roEnvironmentHazardSnapshot(unit),null,'no channel damage follows the hero out');
});
