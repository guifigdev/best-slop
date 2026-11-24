import test from 'node:test';
import assert from 'node:assert/strict';
import {unitFootprint,unitFootprintRadius,unitsArePhysicalAllies,unitsPhysicallyCollide,unitContactFraction} from '../shared/unit-footprint.js';
import {unitRadius,unitBlocked,resolveUnitCollisions} from '../shared/unit-collision.js';
import {moveUnit,navigation} from '../shared/field.js';
import {castleNavigationRadius,moveCastleUnit} from '../shared/castle-navigation.js';
import {buildHeroModel} from '../src/hero-models.js';
import {fenrirSpec} from '../src/fenrir-art.js';
import {Game} from '../shared/simulation.js';
const unit=(id,x=0,z=0,extra={})=>({id,x,z,alive:true,size:1,speed:4,team:1,...extra});
const game=units=>({time:1,bounds:16,units,obstacles:[]});

test('classic footprints cover authored feet, scale with the body and exclude decorative equipment',()=>{
 const model=buildHeroModel('knight',null,()=>{}),radius=unitFootprintRadius({hero:'knight',size:1});assert.equal(radius,.78);for(const leg of model.legs)assert.ok(Math.hypot(Math.abs(leg.x)+leg.w/2,Math.abs(leg.z)+leg.d/2)<=radius+.001);assert.equal(unitRadius({size:1.5}),radius*1.5);assert.deepEqual(unitFootprint({size:1}),{shape:'circle',radius:.78,width:1.56,depth:1.56});
 const wolf=unitFootprintRadius({hero:'fenrir'});for(const leg of fenrirSpec().legs)assert.ok(Math.hypot(Math.abs(leg.x)+leg.w/2,Math.abs(leg.z)+leg.d/2)<=wolf+.001);assert.ok(wolf>radius);for(const [kind,size]of [['champion',1.65],['brute',1.25],['goblin',.8]])assert.equal(unitFootprintRadius({kind}),unitFootprintRadius({size}));
 for(const size of [0,.2,1,4,99,NaN])assert.ok(Number.isFinite(unitFootprintRadius({size})));assert.equal(unitFootprintRadius({size:9,collisionRadius:1.13}),1.13,'explicit radius is world-space, never scaled twice');
});

test('native profiles retain authoritative special radii and Ragnarok locomotion defaults',()=>{
 for(const mode of ['castlefight','treetag','kodotag','phasekiller','bloody'])assert.equal(unitFootprintRadius({size:1,collisionRadius:.3},{mode}),.3);
 assert.equal(unitFootprintRadius({castleUnit:true,size:1}),castleNavigationRadius({size:1}));assert.equal(unitFootprintRadius({castleUnit:true,size:2,collisionRadius:1.8}),1.8);assert.equal(unitFootprintRadius({size:9},{mode:'bonk'}),.45);assert.equal(unitFootprintRadius({size:9,bonkHero:true}),.45);assert.equal(unitFootprintRadius({warlockCharacter:'fire',size:3}),.47);
});

test('allied owner/team/summons phase through each other without recovery pushes while hostile bodies remain solid',()=>{
 for(const extra of [{team:1,owner:'other'},{team:9,owner:'p'},{team:9,summonOwner:'p'},{team:9,summoner:1}]){const a=unit(1,0,0,{owner:'p'}),b=unit(2,0,0,extra),g=game([a,b]);assert.ok(unitsArePhysicalAllies(a,b));assert.equal(unitBlocked(g,a,b),false);assert.deepEqual(resolveUnitCollisions(g,.03),{pairs:0,passes:1,unresolved:0});assert.deepEqual([a.x,a.z,b.x,b.z],[0,0,0,0]);}
 const a=unit(1),b=unit(2,0,0,{team:2}),g=game([a,b]);assert.ok(unitsPhysicallyCollide(a,b));assert.equal(unitBlocked(g,a,b),true);resolveUnitCollisions(g,.03);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=unitRadius(a)+unitRadius(b)-.0002);
 assert.equal(unitsArePhysicalAllies({owner:null},{owner:null}),false);assert.equal(unitsPhysicallyCollide(unit(1),unit(2,0,0,{team:2,pkGhost:true})),false);assert.equal(unitsPhysicallyCollide(unit(1),unit(2,0,0,{team:2,flying:true})),false);
});

test('classic movement crosses allies but stops at hostile footprints on a swept step; walls remain solid',()=>{
 for(const team of [1,2]){const a=unit(1,-5),b=unit(2,0,0,{team}),g=game([a,b]);moveUnit(g,a,{x:5,z:0});if(team===1)assert.ok(Math.abs(a.x-5)<1e-9);else assert.ok(a.x<=-unitRadius(a)-unitRadius(b)+.001);}
 const a=unit(1,-5),b=unit(2,0,0),g=game([a,b]);g.obstacles=[{x:2,z:0,w:.1,d:30}];moveUnit(g,a,{x:5,z:0});assert.ok(a.x<=2-.05-unitRadius(a)+.001);const enemy=unit(3,0,0,{team:2});assert.ok(unitContactFraction(a,{x:-5,z:0},{x:5,z:0},[enemy])<.5);assert.equal(unitContactFraction(a,{x:-5,z:0},{x:5,z:0},[b]),1);
 const ally=unit(2,0,0),walker=unit(1,-5);assert.deepEqual(navigation(game([walker,ally]),walker,{x:5,z:0}),{x:5,z:0},'friendly bodies do not force avoidance paths');
});

test('native castle/tag locomotion respects hostile body radii and intentional ghost/air layers',()=>{
 for(const other of [{team:1},{team:2},{team:2,pkGhost:true},{team:2,flying:true}]){const a=unit(1,-5,0,{castleUnit:true,collisionRadius:.4}),b=unit(2,0,0,{castleUnit:true,collisionRadius:.6,...other}),cf={map:{minX:-16,maxX:16,minZ:-16,maxZ:16},units:[a,b],obstacles:[],buildings:[],elapsed:1};moveCastleUnit(cf,a,{x:5,z:0},3);if(other.team===2&&!other.pkGhost&&!other.flying)assert.ok(a.x<=-1+.001);else assert.equal(a.x,5);}
});

test('Warlock normal movement contacts enemies while allies and native teleports keep phasing',()=>{
 for(const team of [1,2]){const g=new Game(13,{mode:'warlock'});g.addPlayer('p','warlock','P');g.addPlayer('q','heretic','Q');g.initWarlock();g.startWarlockRound();const a=g.player('p'),b=g.player('q');a.x=-2;a.z=0;b.x=0;b.z=0;a.team=1;b.team=team;a.destination={x:2,z:0};a.speed=20;g.tick(.2);if(team===1)assert.ok(a.x>0);else assert.ok(a.x<=-.94+.001);}
});
