import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS,CASTLE_UNITS} from '../shared/castle-catalog.js';
import {castleSupportIncomingDamage,castleSupportOnSpawn,tickCastleSupport} from '../shared/castle-support.js';

function game(){const g=new Game(747,{mode:'castlefight'});g.addPlayer('a','owl');g.addPlayer('b','knight');g.initCastleFight();g.castleFight.buildings=[];g.castleFight.units=[];return g;}
function building(g,key,team=1,point={x:-30,z:-12}){const def=CASTLE_BUILDINGS[key],b={id:g.id(),key,name:def.name,owner:team===1?'a':'b',team,...point,w:def.footprint.w,d:def.footprint.d,lane:0,castleStructure:true,maxHp:1000,hp:1000,armor:5,armorType:'fortified',alive:true,economyReady:true,readyAt:0,workRemaining:0,productionPaused:false};g.castleFight.buildings.push(b);return b;}
function unit(g,team=2,extra={}){const u={id:g.id(),owner:team===1?'a':'b',team,castleUnit:true,kind:'wolf',unitKey:'h003',name:'test troop',x:-25,z:-12,hp:1500,maxHp:1500,damage:30,baseDamage:30,armor:4,baseArmor:4,armorType:'heavy',attackType:'normal',range:.6,speed:3,interval:1.3,alive:true,cd:999,stun:0,flying:false,route:[{x:team===1?40:-40,z:-12}],pathIndex:0,canHitGround:true,canHitAir:true,...extra};g.castleFight.units.push(u);return u;}
const tick=(g,dt=.1)=>{g.time+=dt;g.castleFight.elapsed+=dt;g.castleSupportTick(dt);};

test('a legitimately paid Chilling Mushroom completes construction and strikes one enemy flyer, leaving ground units, allies and builders untouched',()=>{
 const g=game(),p=g.player('a');p.gold=p.lumber=10000;const before={hp:p.hp,gold:p.gold,wood:p.lumber};assert.equal(g.command('a',{type:'cfBuild',building:'north_h047',x:-32,z:9}),true);const b=g.castleFight.buildings[0];assert.equal(p.gold,before.gold-CASTLE_BUILDINGS.north_h047.cost);assert.equal(p.lumber,before.wood-CASTLE_BUILDINGS.north_h047.lumberCost);
 for(let i=0;i<300&&!b.economyReady;i++)g.tick(.05);assert.ok(b.economyReady,'builder really walked to and completed the paid structure');const air=unit(g,2,{flying:true}),air2=unit(g,2,{flying:true,x:-23}),ground=unit(g),ally=unit(g,1,{flying:true});const hp=air.hp+air2.hp;g.castleSupportTick(.1);assert.equal(air.hp+air2.hp,hp-300);assert.equal([air,air2].filter(u=>u.stun>0).length,1);assert.equal(ground.hp,1500);assert.equal(ally.hp,1500);assert.equal(p.hp,before.hp);const after=air.hp+air2.hp;g.castleSupportTick(.1);assert.equal(air.hp+air2.hp,after,'its native eight-second cooldown is authoritative');
});

test('earthquake and serpent poison apply real reversible movement/attack/armor penalties without friendly damage or permanent stat drift',()=>{
 for(const [key,slow]of [['naga_h00I',.5],['orc_h02N',.2]]){const g=game();const b=building(g,key),enemy=unit(g),ally=unit(g,1);tick(g);tick(g);assert.ok(enemy.hp<1500,key+' deals real damage');assert.ok(Math.abs(enemy.castleSupportMoveFactor-(1-slow))<1e-7);assert.ok(Math.abs(enemy.castleSupportAttackFactor-(1-slow))<1e-7);assert.equal(ally.hp,1500);const damage=enemy.damage,armor=enemy.armor;for(let i=0;i<3;i++)tick(g);assert.equal(enemy.damage,damage);assert.equal(enemy.armor,armor,'debuff does not stack each frame');b.alive=false;g.castleFight.elapsed=30;g.castleItemTick(.1);g.castleSupportTick(.1);assert.equal(enemy.castleSupportMoveFactor,1);assert.equal(enemy.castleSupportAttackFactor,1);assert.equal(enemy.armor,enemy.baseArmor);}
});

test('decay does not stack between cities and ignores mechanical targets',()=>{
 const g=game();building(g,'undead_h01Q');building(g,'undead_h01Q');const organic=unit(g),machine=unit(g,2,{mechanical:true}),ally=unit(g,1);tick(g,1);assert.equal(organic.hp,1492);assert.equal(machine.hp,1500);assert.equal(ally.hp,1500);
});

test('blessings, haste, protection and charged shields have distinct persistent effects and shields consume exactly their real charges',()=>{
 {const g=game();building(g,'orc_h02R');const ally=unit(g,1);g.random=()=>.4;tick(g);tick(g);assert.equal(ally.maxHp,1700);assert.equal(ally.damage,50);assert.equal(ally.armor,7);assert.equal(ally.castleSupportAttackFactor,1.2);for(let i=0;i<10;i++)tick(g);assert.equal(ally.maxHp,1700);assert.equal(ally.damage,50);}
 {const g=game();building(g,'human_h010');const ally=unit(g,1);tick(g);assert.equal(ally.hasteAttackSpeed,.66);assert.equal(ally.hasteMoveSpeed,0);assert.ok(ally.hasteUntil>=60);}
 {const g=game();building(g,'nightelf_h07H');const ally=unit(g,1);g.random=()=>.99;tick(g);assert.ok(Math.abs(castleSupportIncomingDamage(g,ally,100,{attackType:'spells'})-45)<1e-8);assert.equal(castleSupportIncomingDamage(g,ally,100,{attackType:'normal'}),100);g.random=()=>0;assert.equal(castleSupportIncomingDamage(g,ally,100,{attackType:'normal'}),60);}
 {const g=game();building(g,'mech_h05R');const ally=unit(g,1,{hp:1000});tick(g);tick(g);assert.equal(ally.armor,8);assert.equal(castleSupportIncomingDamage(g,ally,300,{attackType:'spells'}),0);assert.equal(ally.hp,1100);assert.equal(ally.castleEnergyShield.charges,1);assert.equal(castleSupportIncomingDamage(g,ally,300,{attackType:'spells'}),0);assert.equal(ally.castleEnergyShield,null);tick(g);assert.equal(ally.armor,4);assert.equal(castleSupportIncomingDamage(g,ally,300,{attackType:'spells'}),300);}
});

test('conversion and hex control enemy troops while building destruction excludes legendary structures and the main castle',()=>{
 {const g=game();building(g,'naga_h00M');const enemy=unit(g);tick(g);assert.equal(enemy.team,1);assert.equal(enemy.owner,'a');assert.equal(enemy.route.at(-1).x,g.castleFight.teams[1].x-3);}
 {const g=game();building(g,'elf_h00Z');const enemy=unit(g);tick(g);assert.equal(enemy.castleHexed,true);g.castleFight.elapsed=46;g.castleFight.buildings[0].alive=false;tick(g);assert.equal(enemy.castleHexed,false);}
 {const g=game();building(g,'chaos_h01E');const victim=building(g,'human_h000',2,{x:30,z:12}),legendary=building(g,'chaos_h01M',2,{x:34,z:12}),castle=g.castleFight.teams[1],hp=castle.hp;tick(g);assert.equal(victim.alive,false);assert.equal(legendary.alive,true);assert.equal(castle.hp,hp);}
});

test('artillery and frost siege actually damage buildings once per blast and Greater Frost Launcher also freezes nearby troops',()=>{
 {const g=game();building(g,'human_h001');g.random=()=>0;const victim=building(g,'human_h000',2,{x:30,z:12}),near=unit(g,2,{x:30,z:12});tick(g);const loss=1000-victim.hp;assert.ok(loss>300&&loss<500,'one armor-mitigated siege blast, never duplicate structure damage');assert.ok(near.hp<1500);}
 {const g=game();building(g,'north_h03L');const victim=building(g,'human_h000',2,{x:30,z:12}),near=unit(g,2,{x:30,z:12});tick(g);assert.ok(Math.abs(victim.hp-(1000-100/1.3))<1e-8);assert.ok(victim.castleFrozenUntil>=12);assert.equal(near.stun,12);}
});

test('eruption and starfall are bounded real damage fields; World Freezer creates three moving orbs with real attacks and control',()=>{
 for(const key of ['chaos_h01F','nightelf_h07I']){const g=game();building(g,key);const enemy=unit(g),ally=unit(g,1);tick(g);assert.equal(g.castleFight.supportFields.length,1);tick(g,.5);assert.ok(enemy.hp<1500);assert.equal(ally.hp,1500);g.castleFight.buildings[0].alive=false;g.castleFight.elapsed=20;tick(g);assert.equal(g.castleFight.supportFields.length,0);}
 {const g=game();const b=building(g,'north_h03O'),enemy=unit(g,2,{x:b.x+1,z:b.z});g.random=()=>0;tick(g);assert.equal(g.castleFight.supportFields.length,3);const before=g.castleFight.supportFields[0].z;tick(g,.25);assert.ok(g.castleFight.supportFields[0].z>before);assert.ok(enemy.hp<1500);assert.ok(enemy.castleRootUntil>g.castleFight.elapsed);}
});

test('corruption armor expires and multiple Power Plants strengthen an adjacent producer and its real birth only once',()=>{
 {const g=game();const b=building(g,'corrupted_h04T');const enemy=unit(g),ally=unit(g,1);tick(g);tick(g);assert.equal(enemy.armor,-8);assert.equal(ally.armor,4);b.alive=false;g.castleFight.elapsed=22;g.castleItemTick(.1);tick(g);assert.equal(enemy.armor,4);}
 {const g=game();const producer=building(g,'human_h000');building(g,'mech_h09T',1,{x:producer.x-2.6,z:producer.z});building(g,'mech_h09T',1,{x:producer.x+2.6,z:producer.z});tick(g);assert.equal(producer.armor,7);const def=CASTLE_UNITS[CASTLE_BUILDINGS.human_h000.unit],spawn=g.castleSpawn(producer);assert.ok(spawn);assert.equal(spawn.maxHp,def.hp+100);assert.equal(spawn.baseArmor,(def.armor||0)+2);assert.equal(spawn.baseDamage,def.damage*1.2);for(const b of g.castleFight.buildings)b.alive=false;tick(g);assert.equal(producer.armor,5);assert.equal(spawn.maxHp,def.hp+100,'trained stats remain after power source removal');}
});

test('Heroic Shrine duplicates actual training without recursively duplicating, and corpse skills consume bodies or resurrect after their delay',()=>{
 {const g=game();const producer=building(g,'human_h000');building(g,'human_h05G');g.random=()=>0;const original=g.castleSpawn(producer);assert.ok(original);assert.equal(g.castleFight.units.length,2);assert.equal(g.castleFight.units.filter(u=>u.castleDuplicate).length,1);castleSupportOnSpawn(g,g.castleFight.units[1],producer);assert.equal(g.castleFight.units.length,2);}
 {const g=game();building(g,'undead_h01P');const corpse=unit(g,2,{alive:false,died:g.time});tick(g);assert.equal(g.castleFight.supportCorpses[0].used,true);assert.equal(g.castleFight.units.filter(u=>u.alive&&u.team===1).length,1);assert.ok(g.castleFight.units.find(u=>u.alive).name.includes('Skeletal')||g.castleFight.units.find(u=>u.alive).name.includes('Skeleton'));}
 {const g=game();building(g,'elf_h059');unit(g,1,{alive:false,died:g.time});g.random=()=>0;tick(g);assert.equal(g.castleFight.units.filter(u=>u.alive).length,0);tick(g,2.1);assert.equal(g.castleFight.units.filter(u=>u.alive&&u.team===1).length,1);}
});

test('Forgotten One summons six attacking stationary tentacles with finite lifetime; Eraser removes only an enemy unit family',()=>{
 {const g=game();building(g,'corrupted_h04R');unit(g);tick(g);const summons=g.castleFight.units.filter(u=>u.team===1);assert.equal(summons.length,6);assert.ok(summons.every(u=>u.speed===0&&u.maxHp===225));g.castleFight.buildings[0].alive=false;tick(g,9.1);assert.ok(summons.every(u=>!u.alive));}
 {const g=game();building(g,'chaos_h01M');const a=unit(g,2,{unitKey:CASTLE_BUILDINGS.human_h000.unit}),evolved=unit(g,2,{unitKey:CASTLE_BUILDINGS.human_h039.unit}),different=unit(g,2,{unitKey:'different'}),ally=unit(g,1,{unitKey:a.unitKey});g.random=()=>0;tick(g);assert.equal(a.alive,false);assert.equal(evolved.alive,false);assert.equal(different.alive,true);assert.equal(ally.alive,true);}
});

test('Silver Glade arms a real ward that restores the attacked ally and nearby allies when damage arrives',()=>{
 const g=game();building(g,'nightelf_h08P');const target=unit(g,1,{hp:800,mana:0,maxMana:100}),near=unit(g,1,{x:-24,hp:900,mana:0,maxMana:100}),enemy=unit(g,2,{hp:800});g.random=()=>0;tick(g);assert.equal(target.hp,800,'the ward is not an invented immediate heal');assert.ok(target.castleRestorationWard);assert.equal(castleSupportIncomingDamage(g,target,50,{id:enemy.id,team:2,attackType:'normal'}),50);assert.equal(target.hp,975);assert.equal(near.hp,1075);assert.equal(target.mana,50);assert.equal(enemy.hp,800);assert.equal(target.castleRestorationWard,null);g.castleItemTick(.1);assert.equal(target.armor,10);g.castleFight.buildings[0].alive=false;g.castleFight.elapsed=7;g.castleItemTick(.1);tick(g);assert.equal(target.armor,4);
});

test('Present of Chaos executes all eight audited outcomes rather than substituting one generic attack',()=>{
 for(let outcome=0;outcome<8;outcome++){const g=game();building(g,'chaos_h05I');const enemy=unit(g),ally=unit(g,1),gold=g.player('a').gold;g.random=()=>(outcome+.01)/8;tick(g);assert.equal(ally.hp,1500);assert.ok(g.effects.some(e=>e.chaosOutcome===outcome));
  if(outcome===0){assert.equal(enemy.alive,false);assert.equal(g.player('a').gold,gold);}
  if(outcome===1){assert.equal(enemy.alive,false);assert.equal(g.player('a').gold,gold+4);}
  if(outcome===2){assert.equal(enemy.owner,'a');assert.equal(enemy.team,1);assert.equal(enemy.maxHp,600);}
  if(outcome===3)assert.equal(enemy.castleHexed,true);
  if(outcome===4)assert.equal(enemy.hp,1000);
  if(outcome===5){assert.equal(enemy.maxHp,1900);assert.equal(enemy.hp,1900);assert.equal(enemy.baseDamage,55);}
  if(outcome===6){assert.equal(enemy.stun,6);assert.equal(enemy.hp,1300);}
  if(outcome===7){assert.equal(enemy.hp,1500);assert.equal(enemy.team,2);}
 }
});

test('power dispels and special-effect cadence are bounded, and public snapshots omit private corpse/revival templates',()=>{
 const g=game(),b=building(g,'elf_h00Z');building(g,'mech_h09T',1,{x:b.x+2.6,z:b.z});const enemy=unit(g);b.castleFrozenUntil=20;g.random=()=>0;tick(g);assert.equal(b.castleFrozenUntil,g.castleFight.elapsed);assert.equal(enemy.castleHexed,true);assert.ok(Math.abs(b.nextEffect-g.castleFight.elapsed-10/1.25)<1e-8);assert.equal(b.armor,7);
 const corpse=unit(g,2,{alive:false});tick(g);assert.ok(g.castleFight.supportCorpses.some(c=>c.unitId===corpse.id));const publicState=g.snapshotCastleFight();assert.equal(Object.hasOwn(publicState,'supportCorpses'),false);assert.equal(Object.hasOwn(publicState,'supportRevivals'),false);assert.doesNotThrow(()=>JSON.stringify(g));
});
