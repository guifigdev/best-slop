import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {KODO_TAG_UNITS as U,KODO_TAG_RULES as R} from '../shared/kodo-tag-catalog.js';
import {castlePassable,castleNavigationRadius,constructionDisplacements} from '../shared/castle-navigation.js';
import {useShortcuts} from '../src/shortcuts.js';
import {ownKodoSelection,kodoUnitType} from '../src/rts-selection.js';
const setup=()=>{const g=new Game(16,{mode:'kodotag'});g.addPlayer('p','runner');g.addPlayer('q','runner');g.initKodoTag();Object.assign(g.kodoTag,{released:true,escalationIndex:R.escalation.length,obstacles:[],mines:[]});g.kodoTag.navigationRevision++;const p=g.player('p'),q=g.player('q');Object.assign(p,{x:8,z:8,gold:10000,lumber:10000});Object.assign(q,{x:-20,z:-20});return {g,p,q};};
const tick=(g,n)=>{for(let i=0;i<n*20;i++)g.tick(.05);};
const build=(g,x,z=8,key='hC08')=>{assert.equal(g.command('p',{type:'ktBuild',building:key,x,z}),true,g.commandFailureReason);return g.kodoTag.buildings.at(-1);};
const worker=(g,owner='p',x=8,z=8)=>{const d=U.hC19,u={...d,id:g.id(),unitKey:'hC19',owner,x,z,team:1,alive:true,hp:d.hp,maxHp:d.hp,mana:0,maxMana:0,cd:0,stun:0,kodoTagUnit:true,kodoTagWorker:true,order:'stop'};g.units.push(u);return u;};

test('Kodo repeated placements reserve sites and finish every queued foundation in order',()=>{
 const {g,p}=setup(),a=build(g,10),b=build(g,14),c=build(g,18);assert.equal(p.kodoTagAction.target,a.id);assert.deepEqual(p.kodoTagBuildQueue,[b.id,c.id]);tick(g,.5);assert.equal(b.workProgress,0);assert.equal(c.workProgress,0);tick(g,16);for(const entry of [a,b,c]){assert.equal(entry.workRemaining,0);assert.equal(entry.hp,entry.maxHp);}assert.equal(p.kodoTagAction,null);assert.deepEqual(p.kodoTagBuildQueue,[]);
});
test('failed repeated placement keeps the existing work queue and does not charge',()=>{
 const {g,p}=setup(),a=build(g,10),b=build(g,14),gold=p.gold;assert.equal(g.command('p',{type:'ktBuild',building:'hC08',x:14,z:8}),false);assert.equal(p.gold,gold);assert.equal(g.kodoTag.buildings.length,2);assert.equal(p.kodoTagAction.target,a.id);assert.deepEqual(p.kodoTagBuildQueue,[b.id]);
});
test('Move and Stop pause Kodo construction without losing FIFO; Resume starts the oldest order once',()=>{
 const {g,p}=setup(),a=build(g,10),b=build(g,14),gold=p.gold;assert.equal(g.command('p',{type:'ktMove',x:8,z:14}),true);assert.deepEqual(p.kodoTagBuildQueue,[a.id,b.id]);assert.equal(p.kodoTagBuildPaused,true);assert.equal(p.kodoTagAction,null);tick(g,4);assert.equal(a.workProgress+b.workProgress,0);assert.ok(p.z>10);assert.equal(g.command('p',{type:'ktStop'}),true);assert.deepEqual(p.kodoTagBuildQueue,[a.id,b.id]);for(const building of [b,b])assert.equal(g.command('p',{type:'ktResume',buildingId:building.id}),true);assert.equal(p.kodoTagAction.target,a.id);assert.deepEqual(p.kodoTagBuildQueue,[b.id]);assert.equal(p.kodoTagBuildPaused,false);assert.equal(p.gold,gold);tick(g,20);assert.equal(a.workRemaining+b.workRemaining,0);assert.ok(a.completedAt<b.completedAt);
});

test('eight touching Kodo walls finish in placement order even when the nearest wall was placed last',()=>{
 const {g,p}=setup(),walls=Array.from({length:8},(_,i)=>build(g,17-i,8,'hC07')),start={x:p.x,z:p.z};tick(g,24);assert.ok(Math.hypot(p.x-start.x,p.z-start.z)>1);walls.forEach((b,i)=>{assert.equal(b.workRemaining,0,`wall ${i} remains unfinished`);if(i)assert.ok(b.completedAt>walls[i-1].completedAt);});assert.equal(p.kodoTagAction,null);assert.deepEqual(p.kodoTagBuildQueue,[]);
});

test('Tree construction preserves eight FIFO jobs through movement and Stop, then resumes the oldest',()=>{
 const g=new Game(513,{mode:'treetag'});g.addPlayer('p','ent');g.addPlayer('q','ent');g.addPlayer('f','blaze');for(const id of ['p','q','f'])g.command(id,{type:'ttReady'});const p=g.player('p');Object.assign(p,{x:-25,z:18,gold:10000,lumber:10000});g.treeTag.trees=[];g.treeTag.navigationRevision++;const walls=[];for(let i=0;i<8;i++){assert.equal(g.command('p',{type:'ttBuild',building:'eC23',x:-10-i*2,z:18}),true,g.commandFailureReason);walls.push(g.treeTag.buildings.at(-1));}assert.equal(g.command('p',{type:'ttMove',x:-25,z:23}),true);assert.equal(p.treeTagBuildPaused,true);assert.deepEqual(p.treeTagBuildQueue,walls.map(b=>b.id));tick(g,3);assert.ok(p.z>19);assert.equal(walls.reduce((n,b)=>n+(b.workProgress||0),0),0);assert.equal(g.command('p',{type:'ttStop'}),true);assert.equal(g.command('p',{type:'ttResume',buildingId:walls.at(-1).id}),true);assert.equal(p.treeTagAction.target,walls[0].id);tick(g,100);walls.forEach((b,i)=>{assert.equal(b.workRemaining,0,`wall ${i} remains unfinished`);if(i)assert.ok(b.completedAt>walls[i-1].completedAt);});assert.equal(p.treeTagAction,null);assert.deepEqual(p.treeTagBuildQueue,[]);
});

test('placing over multiple characters moves each outside the solid footprint and they can still move',()=>{
 const {g,p,q}=setup();Object.assign(q,{x:8.2,z:8});const b=build(g,8);for(const u of [p,q])assert.equal(castlePassable(g.kodoTag.navigation,u,u.collisionRadius),true);assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>=p.collisionRadius+q.collisionRadius-.00001);tick(g,2);assert.equal(b.workRemaining,0);const start={x:p.x,z:p.z};assert.equal(g.command('p',{type:'ktMove',x:6,z:14}),true);tick(g,2);assert.ok(Math.hypot(p.x-start.x,p.z-start.z)>1);
});
test('placement is refused atomically when an occupant has no free exit',()=>{
 const unit={id:1,x:0,z:0,alive:true,collisionRadius:.4};const world={map:{minX:-1,maxX:1,minZ:-1,maxZ:1},buildings:[],units:[unit]},b={x:0,z:0,w:2,d:2,alive:true};assert.equal(constructionDisplacements(world,b,[unit]),null);assert.deepEqual({x:unit.x,z:unit.z},{x:0,z:0});
});
test('Kodo group Move, Gather and Stop reach all selected owned workers; foreign selection is rejected atomically',()=>{
 const {g,p}=setup(),a=build(g,10);tick(g,3);const w1=worker(g),w2=worker(g,'p',8,10),foreign=worker(g,'q',-20,-20);assert.equal(g.command('p',{type:'ktUnitBatch',action:'move',unitIds:[w1.id,w2.id,w1.id],x:6,z:14}),true);assert.notDeepEqual(w1.destination,w2.destination);const prior={...w1.destination};assert.equal(g.command('p',{type:'ktUnitBatch',action:'move',unitIds:[w1.id,foreign.id],x:0,z:10}),false);assert.deepEqual(w1.destination,prior);const mine={id:'test-mine',x:15,z:8,w:1.6,d:1.6,gold:100,remaining:100,alive:true};g.kodoTag.mines=[mine];g.kodoTag.navigationRevision++;assert.equal(g.command('p',{type:'ktUnitBatch',action:'gather',unitIds:[w1.id,w2.id],mineId:mine.id}),true);for(const w of [w1,w2])assert.equal(w.kodoTagAction.target,mine.id);assert.equal(g.command('p',{type:'ktUnitBatch',action:'stop',unitIds:[w1.id,w2.id]}),true);tick(g,2);for(const w of [w1,w2])assert.equal(w.kodoTagAction,null);assert.equal(a.workRemaining,0);
});
test('Kodo group training charges once per selected producer and reports a resource shortage',()=>{
 const {g,p}=setup(),a=build(g,10),b=build(g,14);tick(g,8);p.gold=600;assert.equal(g.command('p',{type:'ktBuildingBatch',action:'train',buildingIds:[a.id,b.id,a.id],unit:'hC19'}),true);assert.equal(p.gold,0);for(const entry of [a,b])assert.deepEqual(entry.productionQueue,['hC19']);p.gold=300;assert.equal(g.command('p',{type:'ktBuildingBatch',action:'train',buildingIds:[a.id,b.id],unit:'hC19'}),true);assert.equal(p.kodoTagLastBatch.succeeded,1);assert.equal(p.kodoTagLastBatch.failed,1);assert.equal(p.gold,0);
});
test('Shift can be held before choosing the blueprint and releases on keyup or blur',()=>{
 const target=new EventTarget(),actions=[],hook=useShortcuts({target,context:()=>({playing:true,repeatBuild:false}),onAction:a=>actions.push(a)}),emit=type=>{const e=new Event(type);Object.assign(e,{key:'Shift',code:'ShiftLeft'});target.dispatchEvent(e);};emit('keydown');assert.equal(hook.held.has('Shift'),true);emit('keyup');assert.equal(hook.held.has('Shift'),false);emit('keydown');target.dispatchEvent(new Event('blur'));assert.equal(hook.held.size,0);assert.deepEqual(actions,[]);hook.destroy();
});
test('Kodo selection excludes enemies, captured Runners and dead workers',()=>{
 const units=[{id:1,owner:'p',alive:true,kodoTagCharacter:'runner'},{id:2,owner:'p',alive:true,kodoTagUnit:true,unitKey:'hC19'},{id:3,owner:'p',alive:false,kodoTagUnit:true},{id:4,owner:'q',alive:true,kodoTagCharacter:'runner'},{id:5,owner:'p',alive:true,kodoTagCharacter:'runner',kodoTagCaptured:true}];assert.deepEqual(ownKodoSelection(units,'p',[1,2,2,3,4,5]),[1,2]);assert.equal(kodoUnitType(units[1]),'unit:hC19');
});

test('Tree Tag and Castle Fight also push characters out of a new foundation without abandoning construction',()=>{
 for(const mode of ['treetag','castlefight']){
  const g=new Game(513,{mode});g.addPlayer('p',mode==='treetag'?'ent':'knight');g.addPlayer('q',mode==='treetag'?'ent':'knight');if(mode==='treetag'){g.addPlayer('f','blaze');for(const id of ['p','q','f'])g.command(id,{type:'ttReady'});}else g.initCastleFight();const p=g.player('p');Object.assign(p,{x:mode==='treetag'?-25:-30,z:18,gold:10000,lumber:10000});const context=mode==='treetag'?g.treeTag:g.castleFight;if(mode==='treetag')context.trees=[];else context.obstacles=[];context.navigationRevision++;assert.equal(g.command('p',{type:mode==='treetag'?'ttBuild':'cfBuild',building:mode==='treetag'?'eC09':'human_h000',x:p.x,z:p.z}),true,g.commandFailureReason);const b=context.buildings.at(-1);assert.ok(Math.abs(p.x-b.x)>=b.w/2+castleNavigationRadius(p)-1e-5||Math.abs(p.z-b.z)>=b.d/2+castleNavigationRadius(p)-1e-5);tick(g,20);assert.equal(b.workRemaining,0);
 }
});

test('Kodo bodies separate at their physical radius without passing through walls or structures',()=>{
 const {g,p,q}=setup();Object.assign(p,{x:-20,z:-20});Object.assign(q,{x:-20,z:-18});const mobs=[];for(let i=0;i<5;i++){const d=U.oC06,u={...d,id:g.id(),unitKey:'oC06',collisionRadius:d.size*.82,owner:'kodos',team:2,x:8,z:8,maxHp:d.hp,hp:d.hp,maxMana:0,mana:0,alive:true,kodoTagUnit:true,kodoTagKodo:true,cd:0,stun:0,order:'auto'};g.units.push(u);mobs.push(u);}g.kodoTag.obstacles=[{id:'cliff',x:10,z:8,w:1,d:6,alive:true}];g.kodoTag.navigationRevision++;tick(g,1);for(let i=0;i<mobs.length;i++){const a=mobs[i];assert.equal(castlePassable(g.kodoTag.navigation,a,a.collisionRadius),true);for(const b of mobs.slice(i+1))assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=a.collisionRadius+b.collisionRadius-.03);}
});
