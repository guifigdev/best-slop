import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {treeTagBuildCheck} from '../shared/tree-tag.js';
import {castlePassable,castleRouteAvailable} from '../shared/castle-navigation.js';
import {TREE_TAG_CHARACTERS,TREE_TAG_BUILDINGS} from '../shared/tree-tag-catalog.js';

function setup(){const g=new Game(513,{mode:'treetag'});g.addPlayer('e','ent','Capturado');g.addPlayer('a','ent','Socorro');g.addPlayer('f','burnin','Infernal');assert.equal(g.initTreeTag(),true);const e=g.player('e'),a=g.player('a'),f=g.player('f');Object.assign(a,{x:5,z:0});g.tick(30);Object.assign(f,{x:15,z:15,cd:0});Object.assign(e,{x:15.5,z:15});assert.equal(g.command('f',{type:'ttAttack',target:e.id}),true);g.tick(.1);assert.equal(e.treeTagCaptured,true);return{g,e,a,f};}
const tick=(g,seconds)=>{for(let t=0;t<seconds-1e-8;t+=.05)g.tick(Math.min(.05,seconds-t));};
const context=g=>({...g.treeTag.navigation,map:g.treeTag.map,buildings:g.treeTag.buildings,obstacles:g.treeTag.trees,elapsed:g.treeTag.elapsed,navigationRevision:g.treeTag.navigationRevision,units:g.units.filter(u=>u.alive&&!u.treeTagCaptured)});

test('walking to the visible prison rim rescues an ally despite ashes on the opposite side',()=>{
 const{g,e,a}=setup();assert.equal(e.alive,true);assert.equal(e.hp,25);assert.equal(e.maxHp,TREE_TAG_CHARACTERS.ent.hp);assert.equal(e.treeTagState,'captured');assert.equal(e.kind,'treeAsh');
 assert.equal(g.command('a',{type:'ttMove',x:2,z:0}),true);tick(g,1.4);assert.ok(a.x<5&&a.x>2);assert.equal(e.treeTagCaptured,false);assert.equal(e.treeTagState,'active');assert.equal(e.kind,'treant');assert.equal(e.hp,25);assert.ok(Math.hypot(a.x,a.z)<=2.35);assert.ok(g.effects.some(fx=>fx.rescue&&fx.source===e.id));
 assert.equal(g.command('e',{type:'ttMove',x:7,z:3}),true);const before={x:e.x,z:e.z};tick(g,2);assert.ok(Math.hypot(e.x-before.x,e.z-before.z)>3);assert.equal(e.treeTagCaptured,false);assert.equal(e.castleNavigationBlocked,false);
});

test('merely being near the clearing does not rescue before entering the marked region',()=>{
 const{g,e,a}=setup();Object.assign(a,{x:3,z:0});tick(g,.2);assert.equal(e.treeTagCaptured,true);assert.equal(e.treeTagState,'captured');
 assert.equal(g.command('a',{type:'ttAttack',target:e.id}),true);tick(g,1);assert.equal(e.treeTagCaptured,false);
});

test('legacy obstacles over the ashes produce a free local revival with a walking route and no residual root',()=>{
 const{g,e,a}=setup();e.treeTagRootUntil=100;g.treeTag.buildings.push({id:g.id(),owner:'a',team:1,x:e.x,z:e.z,w:2,d:2,alive:true,treeTagStructure:true,workRemaining:15,workTotal:15,hp:100,maxHp:100,productionQueue:[],trainRemaining:0});g.treeTag.trees.push({id:'legacy-tree',x:.8,z:-1,w:.75,d:.75,alive:true,hp:50});g.treeTag.navigationRevision++;
 assert.equal(g.command('a',{type:'ttMove',x:2,z:0}),true);tick(g,1.6);assert.equal(e.treeTagCaptured,false);assert.equal(e.treeTagRootUntil,0);assert.ok(Math.hypot(e.x,e.z)<4);assert.equal(castlePassable(context(g),e,e.collisionRadius),true);assert.equal(castleRouteAvailable(context(g),e,a,e.collisionRadius),true);
 assert.equal(g.command('e',{type:'ttMove',x:6,z:3}),true);const before={x:e.x,z:e.z};tick(g,2);assert.ok(Math.hypot(e.x-before.x,e.z-before.z)>3);assert.equal(e.treeTagCaptured,false);
});

test('one Ent entering the prison rescues every allied ash with distinct collision-safe positions',()=>{
 const g=new Game(19,{mode:'treetag'});for(const id of ['one','two','rescue'])g.addPlayer(id,'ent');g.addPlayer('fire','blaze');g.initTreeTag();g.tick(30);const f=g.player('fire'),rescuer=g.player('rescue');Object.assign(rescuer,{x:5,z:0});
 for(const id of ['one','two']){const target=g.player(id);Object.assign(f,{x:15,z:15,cd:0});Object.assign(target,{x:15.5,z:15});g.command('fire',{type:'ttAttack',target:target.id});g.tick(.1);assert.equal(target.treeTagCaptured,true);}
 assert.equal(g.command('rescue',{type:'ttMove',x:2,z:0}),true);tick(g,1.5);const first=g.player('one'),second=g.player('two');for(const u of [first,second]){assert.equal(u.treeTagCaptured,false);assert.equal(castlePassable(context(g),u,u.collisionRadius),true);assert.equal(castleRouteAvailable(context(g),u,rescuer,u.collisionRadius),true);}
 assert.ok(Math.hypot(first.x-second.x,first.z-second.z)>=first.collisionRadius+second.collisionRadius-1e-5);
});

test('footprints cannot intrude into prison or close its cardinal access corridors',()=>{
 const{g,a}=setup();a.gold=a.lumber=10000;const key='eC23',d=TREE_TAG_BUILDINGS[key];assert.ok(d.root);
 for(const p of [{x:0,z:0},{x:4,z:0},{x:0,z:8},{x:-8,z:0},{x:4.5,z:1.5}]){const check=treeTagBuildCheck(g,a,key,p);assert.equal(check.allowed,false,JSON.stringify(p));assert.match(check.reason,/prisão|saída/);}
 assert.equal(treeTagBuildCheck(g,a,key,{x:6,z:6}).allowed,true);const gold=a.gold,wood=a.lumber;assert.equal(g.command('a',{type:'ttBuild',building:key,x:0,z:8}),false);assert.equal(a.gold,gold);assert.equal(a.lumber,wood);
});

test('revival keeps its existing brief invulnerability so a camping Infernal cannot recapture in the same frame',()=>{
 const{g,e,a,f}=setup();Object.assign(a,{x:2,z:0,invulnerableUntil:g.treeTag.elapsed+5});Object.assign(f,{x:1,z:0,cd:0,treeTagAction:{type:'attack',target:e.id}});f.skillLevels.immolation=4;
 tick(g,.05);assert.equal(e.treeTagCaptured,false);assert.equal(e.hp,25);assert.ok(e.invulnerableUntil>g.treeTag.elapsed);tick(g,.5);assert.equal(e.treeTagCaptured,false);assert.equal(e.hp,25);
 // Protection remains temporary: native Ent HP is 25 and a stationary Ent
 // beside a hostile immolation aura can still be captured after it expires.
 assert.equal(g.command('a',{type:'ttMove',x:5,z:4}),true);tick(g,4);assert.equal(e.treeTagCaptured,true);assert.ok(Math.hypot(a.x,a.z)>2.35);assert.equal(e.alive,true);
});
