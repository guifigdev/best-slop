import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {TreeTagMethods,treeTagBuildCheck,treeTagCanSee} from '../shared/tree-tag.js';
import {TREE_TAG_REFERENCE,TREE_TAG_RULES as R,TREE_TAG_CHARACTERS as C,TREE_TAG_SKILLS as S,TREE_TAG_BUILDINGS as B,TREE_TAG_RESEARCH as RESEARCH,TREE_TAG_UNITS as UNITS,TREE_TAG_FOREST,TREE_TAG_WORKERS,TREE_TAG_WORKER_SKILLS,treeTagWorkerCatalog,treeTagSkillAt} from '../shared/tree-tag-catalog.js';

function setup(role='blaze'){
 const g=new Game(513,{mode:'campaign'});Object.assign(g,TreeTagMethods);g.addPlayer('ent','knight');g.addPlayer('ally','knight');g.addPlayer('fire','knight');
 g.setupTreeTagPlayer(g.player('ent'),'ent');g.setupTreeTagPlayer(g.player('ally'),'ent');g.setupTreeTagPlayer(g.player('fire'),role);assert.equal(g.initTreeTag(),true);return {g,e:g.player('ent'),a:g.player('ally'),f:g.player('fire')};
}
function tick(g,seconds,step=.1){for(let t=0;t<seconds-1e-8;t+=step){const dt=Math.min(step,seconds-t);g.time+=dt;g.tickTreeTag(dt);}}
function clear(g){g.treeTag.trees.length=0;g.treeTag.navigationRevision++;}
function finish(g,b){for(let i=0;i<1500&&b.workRemaining>0;i++)tick(g,.1);assert.equal(b.workRemaining,0);}
function build(g,e,key,x=-25,z=-25){e.gold=e.lumber=10000;assert.equal(g.treeTagCommand(e,{type:'ttBuild',building:key,x,z}),true,g.commandFailureReason);return g.treeTag.buildings.at(-1);}

test('several foundation orders keep the builder on its current work and finish subsequent jobs in order',()=>{
 const {g,e}=setup();clear(g);e.x=-25;e.z=-21;const first=build(g,e,'eC09'),second=build(g,e,'eC23',-21.5,-25),third=build(g,e,'eC23',-18,-25);assert.equal(e.treeTagAction.target,first.id);assert.deepEqual(e.treeTagBuildQueue,[second.id,third.id]);tick(g,3);assert.ok(first.workRemaining<first.workTotal);assert.equal(second.workRemaining,second.workTotal);assert.equal(e.treeTagWorking,true);assert.equal(e.moving,false);tick(g,35);assert.ok([first,second,third].every(b=>b.workRemaining===0));assert.deepEqual(e.treeTagBuildQueue,[]);assert.equal(e.treeTagAction,null);tick(g,.1);assert.equal(e.treeTagWorking,false);
});

test('moving or stopping pauses construction and Resume finishes the foundation without charging twice',()=>{
 const {g,e,a}=setup();clear(g);e.x=-25;e.z=-23;const b=build(g,e,'eC09');tick(g,2);assert.ok(b.workRemaining<15);assert.equal(g.treeTagCommand(e,{type:'ttMove',x:-20,z:-20}),true);const remaining=b.workRemaining;tick(g,3);assert.equal(b.workRemaining,remaining);assert.equal(e.treeTagWorking,false);const gold=e.gold,wood=e.lumber;assert.equal(g.treeTagCommand(a,{type:'ttResume',buildingId:b.id}),false);assert.equal(g.treeTagCommand(e,{type:'ttResume',buildingId:b.id}),true);assert.equal(e.gold,gold);assert.equal(e.lumber,wood);finish(g,b);assert.equal(b.hp,b.maxHp);assert.equal(g.treeTagCommand(e,{type:'ttResume',buildingId:b.id}),false);
});

test('an unreachable build retains its order, reports blocked and never animates work or consumes construction time',()=>{
 const {g,e}=setup();clear(g);e.x=-25;e.z=-20;const b=build(g,e,'eC09');g.treeTag.trees.push({id:'barrier',x:-25,z:-25,w:8,d:8,alive:true,hp:100});g.treeTag.navigationRevision++;tick(g,1);assert.equal(b.workRemaining,15);assert.equal(e.treeTagAction.target,b.id);assert.equal(e.treeTagBlocked,true);assert.equal(e.treeTagWorking,false);g.treeTag.trees[0].alive=false;g.treeTag.navigationRevision++;finish(g,b);assert.equal(b.workRemaining,0);
});

test('a builder reaches and works beside adjacent buildings and trees instead of settling outside work range',()=>{
 const {g,e}=setup();clear(g);e.x=-22;e.z=-21;const b=build(g,e,'eC09');for(const [x,z]of [[-27.5,-25],[-25,-27.5],[-22.5,-25]])g.treeTag.trees.push({id:'edge-'+x+':'+z,x,z,w:1,d:1,alive:true,hp:100});g.treeTag.navigationRevision++;tick(g,22);assert.equal(b.workRemaining,0);assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.z));assert.equal(e.treeTagBlocked,false);
});

test('Tree Tag reference pins the classic map bytes, explicit character objects, original timing and four reachable researches',()=>{
 assert.equal(TREE_TAG_REFERENCE.sha256,'7c1ad8d581f63a908ab5ada6062b008d57999c80b22d92f5d3d27e0e2eb945c5');assert.equal(TREE_TAG_REFERENCE.bytes,223412);assert.equal(TREE_TAG_REFERENCE.version,'Tree Tag, Final v5.13');assert.equal(R.duration,1800);assert.equal(R.infernalDelay,30);assert.equal(R.incomeInterval,5);
 assert.deepEqual(Object.keys(C),['ent','blaze','pyra','burnin']);assert.equal(C.ent.hp,25);assert.equal(C.ent.speed,290/128);assert.equal(C.blaze.rawStats.hp,10000);assert.equal(C.blaze.rawStats.damage,90);assert.equal(C.blaze.hp,10375);assert.equal(C.burnin.hp,10500);assert.equal(TREE_TAG_FOREST.length,1353);assert.deepEqual(B.eC45.research,['Resw','Rerh','R000']);assert.deepEqual(B.e000.research,['R002']);assert.equal(RESEARCH.R000.cost,100);
});

test('native cooldowns, mana costs and non-linear skill ranks remain factual and separate from Survival attributes',()=>{
 assert.equal(treeTagSkillAt('blink').cooldown,30);assert.equal(treeTagSkillAt('blink').mana,0);assert.equal(treeTagSkillAt('blink').distance,1000/128);assert.equal(treeTagSkillAt('destroyTrees').range,2000/128);assert.equal(treeTagSkillAt('destroyTrees').cooldown,25);
 assert.deepEqual(S.ensnare.levels.map(s=>s.duration),[1,1.5,2,2.5]);assert.deepEqual(S.ensnare.levels.map(s=>s.cooldown),[60,50,45,40]);assert.equal(S.avatar.requiredLevel,6);assert.equal(S.nuclear.levels[1].radius,1100/128);assert.equal(S.immolation.levels[3].nativeData.DataA,25);
 const {e,f}=setup();assert.equal(e.attributePoints,0);assert.equal(f.attributePoints,0);assert.equal(f.skillPoints,1);assert.deepEqual(e.inventory,[]);assert.equal(f.inventory[0].id,'I000');assert.equal(f.inventory[0].charges,0);
});

test('the opening grants Ents thirty seconds and pays the original five-second income to both roles',()=>{
 const {g,e,f}=setup();assert.equal(e.gold,20);assert.equal(e.lumber,40);assert.equal(f.gold,100);assert.equal(f.lumber,50);assert.equal(f.treeTagWaiting,true);assert.equal(g.treeTagCommand(f,{type:'ttMove',x:10,z:0}),false);tick(g,29.9);assert.equal(f.treeTagWaiting,true);tick(g,.1);assert.equal(f.treeTagWaiting,false);assert.ok(g.treeTag.releaseRemaining<1e-8);assert.equal(e.gold,26);assert.equal(e.lumber,52);assert.equal(f.gold,112);assert.equal(f.lumber,74);
});

test('forest clearing and a thirty-second Blink respect trees, cooldown and mana without changing the reference forest',()=>{
 const {g,e}=setup(),before=TREE_TAG_FOREST.filter(t=>t.alive).length;const target=g.treeTag.trees.find(t=>Math.hypot(t.x-e.x,t.z-e.z)<12);
 assert.ok(target);assert.equal(g.treeTagCommand(e,{type:'ttCast',skill:'destroyTrees',x:target.x,z:target.z}),true);assert.equal(target.alive,false);assert.equal(e.cooldowns.destroyTrees,25);assert.equal(e.mana,0);assert.equal(g.treeTagCommand(e,{type:'ttCast',skill:'destroyTrees',x:target.x,z:target.z}),false);assert.equal(TREE_TAG_FOREST.filter(t=>t.alive).length,before);
 clear(g);const x=e.x;assert.equal(g.treeTagCommand(e,{type:'ttCast',skill:'blink',x:e.x+6,z:e.z}),true);assert.ok(e.x>x+5);assert.equal(e.cooldowns.blink,30);assert.equal(g.treeTagCommand(e,{type:'ttCast',skill:'blink',x:e.x+2,z:e.z}),false);
});

test('a builder walks to the real foundation and works before it yields resource income',()=>{
 const {g,e}=setup();clear(g);e.x=-10;e.z=-25;const gold=e.gold,wood=e.lumber;assert.equal(g.treeTagCommand(e,{type:'ttBuild',building:'eC09',x:-25,z:-25}),true);const b=g.treeTag.buildings[0];assert.equal(e.gold,gold-20);assert.equal(e.lumber,wood-40);assert.equal(b.workRemaining,15);tick(g,1);assert.equal(b.workRemaining,15);assert.ok(e.x<-10);finish(g,b);const start=e.gold;tick(g,5);assert.equal(e.gold-start,2);
});

test('build rejection is atomic for occupied trees, prisons, insufficient resources and foreign roles',()=>{
 const {g,e,f}=setup();const t=g.treeTag.trees[0],gold=e.gold,wood=e.lumber;assert.equal(treeTagBuildCheck(g,e,'eC23',t).allowed,false);assert.equal(g.treeTagCommand(e,{type:'ttBuild',building:'eC23',x:0,z:0}),false);assert.equal(g.treeTagCommand(e,{type:'ttBuild',building:'h003',x:-30,z:-30}),false);assert.equal(g.treeTagCommand(f,{type:'ttBuild',building:'eC23',x:-30,z:-30}),false);assert.equal(e.gold,gold);assert.equal(e.lumber,wood);assert.equal(g.treeTag.buildings.length,0);
});

test('in-progress construction cancellation refunds the explicit native 100 percent and demolition is owner-only',()=>{
 const {g,e,a}=setup();clear(g);e.gold=e.lumber=100;assert.equal(g.treeTagCommand(e,{type:'ttBuild',building:'eC09',x:-25,z:-25}),true);const b=g.treeTag.buildings[0];assert.equal(g.treeTagCommand(a,{type:'ttDemolish',buildingId:b.id}),false);assert.equal(g.treeTagCommand(e,{type:'ttDemolish',buildingId:b.id}),true);assert.equal(e.gold,100);assert.equal(e.lumber,100);assert.equal(b.alive,false);
});

test('native resource upgrades consume exact costs, require owner and improve income only after work completes',()=>{
 const {g,e,a}=setup();clear(g);e.x=-23;e.z=-25;const b=build(g,e,'eC09');finish(g,b);e.gold=e.lumber=1000;assert.equal(g.treeTagCommand(a,{type:'ttUpgrade',buildingId:b.id,building:'e003'}),false);assert.equal(g.treeTagCommand(e,{type:'ttUpgrade',buildingId:b.id,building:'e003'}),true);assert.equal(e.gold,940);assert.equal(e.lumber,900);assert.equal(b.key,'eC09');finish(g,b);assert.equal(b.key,'e003');assert.equal(b.incomeGold,4);assert.equal(b.incomeWood,3);
});

test('an Infernal capture creates prison ashes, pays 125 gold and 350 XP, and an allied Ent can rescue them',()=>{
 const {g,e,a,f}=setup();clear(g);tick(g,30);Object.assign(f,{x:15,z:15,cd:0});Object.assign(e,{x:15.5,z:15});Object.assign(a,{x:-20,z:-20});const gold=f.gold;assert.equal(g.treeTagCommand(f,{type:'ttAttack',target:e.id}),true);tick(g,.1);assert.equal(e.treeTagCaptured,true);assert.equal(e.alive,true);assert.ok(Math.hypot(e.x,e.z)<2);assert.equal(f.gold,gold+125);assert.equal(f.xp,350);assert.equal(f.level,2);assert.equal(f.skillPoints,2);a.x=e.x;a.z=e.z;tick(g,.1);assert.equal(e.treeTagCaptured,false);assert.equal(e.hp,e.maxHp);assert.equal(g.phase,'wave');
});

test('capturing the final Ent grants Infernal victory, whereas surviving the native timer grants Ent victory',()=>{
 const first=setup();clear(first.g);tick(first.g,30);for(const e of [first.e,first.a]){first.f.x=15;first.f.z=15;first.f.cd=0;e.x=15.5;e.z=15;first.g.treeTagCommand(first.f,{type:'ttAttack',target:e.id});tick(first.g,.1);}assert.equal(first.g.treeTag.winnerRole,'infernal');
 const second=setup();second.g.time+=1800;second.g.tickTreeTag(1800);assert.equal(second.g.treeTag.winnerRole,'ent');assert.equal(second.g.phase,'victory');
});

test('learning uses native hero minimum levels and never consumes a point for a locked ultimate',()=>{
 const {g,f}=setup('burnin');tick(g,30);assert.equal(g.treeTagCommand(f,{type:'ttLearn',skill:'avatar'}),false);assert.equal(f.skillPoints,1);f.level=6;assert.equal(g.treeTagCommand(f,{type:'ttLearn',skill:'avatar'}),true);assert.equal(f.skillLevels.avatar,1);assert.equal(f.skillPoints,0);f.mana=1000;const hp=f.maxHp;assert.equal(g.treeTagCommand(f,{type:'ttCast',skill:'avatar'}),true);assert.equal(f.maxHp,hp+100);assert.equal(f.cooldowns.avatar,120);assert.equal(f.mana,850);
});

test('six inventory slots, native active item mana and cooldowns are authoritative',()=>{
 const {g,f}=setup();tick(g,30);f.x=f.z=0;f.gold=10000;f.mana=300;assert.equal(g.treeTagCommand(f,{type:'ttUseItem',slot:0,x:4,z:0}),true);assert.equal(f.mana,225);assert.equal(f.treeTagItemCooldowns.I000,15);assert.equal(g.treeTagCommand(f,{type:'ttUseItem',slot:0,x:4,z:0}),false);for(let i=0;i<5;i++)assert.equal(g.treeTagCommand(f,{type:'ttBuy',item:'I006'}),true);const gold=f.gold;assert.equal(f.inventory.length,6);assert.equal(g.treeTagCommand(f,{type:'ttBuy',item:'I006'}),false);assert.equal(f.gold,gold);
});

test('Upgrade Center researches exact inherited costs and map-overridden times, then upgrades owned structures',()=>{
 const {g,e}=setup();clear(g);e.x=-23;e.z=-25;const life=build(g,e,'e000');life.workRemaining=0;life.hp=life.maxHp;g.treeTagCommand(e,{type:'ttStop'});assert.equal(g.treeTagCommand(e,{type:'ttTrain',buildingId:life.id,unit:'uC43'}),true);tick(g,15);const worker=g.units.find(u=>u.treeTagWorker&&u.workerType==='uC43');assert.ok(worker);assert.equal(g.treeTagCommand(e,{type:'ttBuild',workerId:worker.id,building:'eC45',x:-30,z:-25}),true);const center=g.treeTag.buildings.at(-1);center.workRemaining=0;center.hp=center.maxHp;e.gold=e.lumber=1000;
 assert.equal(g.treeTagCommand(e,{type:'ttResearch',buildingId:center.id,research:'R000'}),true);assert.equal(e.gold,900);assert.equal(e.lumber,975);assert.equal(g.treeTag.players.ent.researching.remaining,30);const hp=life.maxHp;tick(g,30);assert.equal(g.treeTag.players.ent.researchLevels.R000,1);assert.equal(g.treeTag.players.ent.researching,null);assert.ok(Math.abs(life.maxHp-hp*1.1)<1e-8);assert.equal(life.armor,B.e000.armor+B.e000.armorUpgrade);
});

test('trees occlude Infernal sight and temporary reveal is localized, while allies remain visible',()=>{
 const {g,e,a,f}=setup();g.treeTag.trees=[{id:'test',x:1,z:0,w:1,d:1,alive:true}];f.x=f.z=0;e.x=2;e.z=0;a.x=30;a.z=0;assert.equal(treeTagCanSee(g.snapshotTreeTag(),f,e),false);assert.equal(treeTagCanSee(g.snapshotTreeTag(),e,a),true);f.treeTagRevealUntil=100;f.treeTagRevealPoint={x:2,z:0};assert.equal(treeTagCanSee(g.snapshotTreeTag(),f,e),true);e.x=30;assert.equal(treeTagCanSee(g.snapshotTreeTag(),f,e),false);
});

test('snapshots expose stable role, prison, structure and remaining cooldown data without navigation caches',()=>{
 const {g,e,f}=setup();const snap=JSON.parse(JSON.stringify(g.snapshotTreeTag()));assert.equal(snap.remaining,1800);assert.equal(snap.releaseAt,30);assert.equal(snap.releaseRemaining,30);assert.equal(snap.trees.length,1353);assert.equal(snap.navigation,undefined);assert.equal(snap.players.ent.role,'ent');assert.equal(snap.players.fire.role,'infernal');assert.equal(e.cooldowns.blink,undefined);assert.equal(f.treeTagState,'waiting');
});


test('native secondary tree weapon and Berserk haste preserve damage rather than tripling each hit',()=>{
 const {g,f}=setup();clear(g);tick(g,30);f.x=15;f.z=15;f.gold=10000;const tree={id:'weapon-tree',x:15.5,z:15,w:.5,d:.5,hp:1000,maxHp:1000,armor:0,alive:true};g.treeTag.trees.push(tree);g.treeTag.navigationRevision++;g.treeTagCommand(f,{type:'ttAttack',target:tree.id});tick(g,.1);assert.equal(tree.hp,1000-C.blaze.treeDamage);const baseline=f.cd;f.inventory.push({id:'I001',key:'I001',charges:0});assert.equal(g.treeTagCommand(f,{type:'ttUseItem',slot:f.inventory.length-1}),true);f.cd=0;tick(g,.1);assert.equal(tree.hp,1000-C.blaze.treeDamage*2);assert.ok(Math.abs(f.cd-baseline/3)<1e-8);
});


test('the requested larger map expands both axes and resamples native forest positions without altering skill range',()=>{
 assert.equal(R.map.width,116);assert.equal(R.map.depth,116);assert.equal(R.nativeMap.width,94);assert.equal(R.mapScale,116/94);assert.equal(R.forestRenderedCount,1353);assert.equal(R.forestNativeCount,4939);assert.ok(TREE_TAG_FOREST.some(t=>Math.abs(t.x)>50));assert.ok(TREE_TAG_FOREST.some(t=>Math.abs(t.z)>50));assert.ok(TREE_TAG_FOREST.every(t=>Math.abs(t.x)<=58&&Math.abs(t.z)<=58));assert.equal(treeTagSkillAt('blink').distance,1000/128);
});

function readyLife(g,e){clear(g);e.x=-23;e.z=-25;const life=build(g,e,'e000');life.workRemaining=0;life.hp=life.maxHp;g.treeTagCommand(e,{type:'ttStop'});return life;}
function train(g,e,life,raw){e.gold=e.lumber=10000;assert.equal(g.treeTagCommand(e,{type:'ttTrain',buildingId:life.id,unit:raw}),true);tick(g,UNITS[raw].buildTime+.1);const worker=g.units.filter(u=>u.treeTagWorker&&u.workerType===raw).at(-1);assert.ok(worker,raw);return worker;}

test('Tree of Life trains real native workers with separate bodies and native prices rather than granting an Ent a permanent global build flag',()=>{
 const {g,e}=setup(),life=readyLife(g,e);e.gold=e.lumber=1000;assert.equal(g.treeTagCommand(e,{type:'ttTrain',buildingId:life.id,unit:'uC43'}),true);assert.equal(e.gold,940);assert.equal(e.lumber,940);assert.equal(g.units.some(u=>u.treeTagWorker),false);tick(g,14.9);assert.equal(g.units.some(u=>u.treeTagWorker),false);tick(g,.1);const worker=g.units.find(u=>u.treeTagWorker);assert.equal(worker.workerType,'uC43');assert.equal(worker.sourceBuilding,life.id);assert.equal(worker.expiresAt,null);assert.equal(worker.maxHp,25);assert.equal(e.treeTagAdvancedBuilder,undefined);assert.equal(worker.gold,undefined);assert.equal(worker.lumber,undefined);assert.ok(Math.hypot(worker.x-life.x,worker.z-life.z)<4);assert.equal(g.treeTagCommand(e,{type:'ttBuild',building:'eC45',x:-30,z:-25}),false);assert.match(g.commandFailureReason,/selecione/);assert.equal(treeTagWorkerCatalog(worker),TREE_TAG_WORKERS.uC43);
});

test('selecting an Advanced Builder moves, constructs and repairs independently while debiting only its controlling player',()=>{
 const {g,e,a}=setup(),life=readyLife(g,e),worker=train(g,e,life,'uC43'),start={x:e.x,z:e.z};e.gold=e.lumber=1000;const allyGold=a.gold;assert.equal(g.treeTagCommand(a,{type:'ttMove',workerId:worker.id,x:-35,z:-25}),false);assert.equal(g.treeTagCommand(e,{type:'ttMove',workerId:worker.id,x:-35,z:-25}),true);tick(g,1);assert.ok(worker.x<life.x);assert.deepEqual({x:e.x,z:e.z},start);assert.equal(g.treeTagCommand(e,{type:'ttBuild',workerId:worker.id,building:'eC45',x:-35,z:-25}),true);assert.equal(e.gold,900);assert.equal(e.lumber,900);const b=g.treeTag.buildings.at(-1);finish(g,b);assert.equal(worker.treeTagAction,null);assert.equal(b.hp,b.maxHp);b.hp-=50;const gold=e.gold;assert.equal(g.treeTagCommand(e,{type:'ttRepair',workerId:worker.id,buildingId:b.id}),true);tick(g,2);assert.equal(b.hp,b.maxHp);assert.ok(e.gold<gold+2,'repair spends owner gold while ordinary income continues');assert.equal(a.gold>=allyGold,true);assert.equal(worker.gold,undefined);assert.equal(g.treeTagCommand(e,{type:'ttStop',workerId:worker.id}),true);
});

test('Wisps harvest five lumber each native eight-second cycle and never acquire an automatic combat target',()=>{
 const {g,e,f}=setup(),life=readyLife(g,e),wisp=train(g,e,life,'e001');assert.equal(wisp.name,'Wisp');assert.equal(wisp.treeTagAction,null);assert.equal(wisp.expiresAt,null);const tree={id:'worker-harvest-tree',x:wisp.x+.7,z:wisp.z,w:.75,d:.75,hp:50,alive:true};g.treeTag.trees.push(tree);g.treeTag.navigationRevision++;e.lumber=100;g.treeTag.incomeAt=1000;assert.equal(g.treeTagCommand(e,{type:'ttGather',workerId:wisp.id,target:tree.id}),true);tick(g,8);assert.equal(e.lumber,105);assert.equal(tree.hp,50);tick(g,8);assert.equal(e.lumber,110);assert.equal(g.treeTagCommand(e,{type:'ttBuild',workerId:wisp.id,building:'eC23',x:-35,z:-35}),false);g.treeTagCommand(e,{type:'ttStop',workerId:wisp.id});f.x=wisp.x+.5;f.z=wisp.z;tick(g,.1);assert.equal(wisp.treeTagAction,null);assert.equal(f.hp,f.maxHp);
});

test('Nature Lover regrows native-radius trees using its own mana and cooldown, and never turns into a builder',()=>{
 const {g,e}=setup(),life=readyLife(g,e),worker=train(g,e,life,'e002');assert.deepEqual(worker.skills,['blink','regrow']);const point={x:worker.x,z:worker.z+3.5},tree={id:'worker-regrow-tree',...point,w:.75,d:.75,hp:0,alive:false};g.treeTag.trees.push(tree);const mana=worker.mana;assert.equal(g.treeTagCommand(e,{type:'ttCast',workerId:worker.id,skill:'regrow',...point}),true,g.commandFailureReason);assert.equal(tree.alive,true);assert.equal(worker.mana,mana-100);assert.equal(worker.cooldowns.regrow,8);assert.equal(TREE_TAG_WORKER_SKILLS.regrow.radius,200/128);assert.equal(g.treeTagCommand(e,{type:'ttBuild',workerId:worker.id,building:'eC23',x:-35,z:-35}),false);
});

test('workers survive without summon expiry and a captured owner cannot keep commanding them',()=>{
 const {g,e,f}=setup(),life=readyLife(g,e),worker=train(g,e,life,'uC43');assert.equal(Number.isFinite(worker.expiresAt),false);tick(g,30);Object.assign(f,{x:15,z:15,cd:0});Object.assign(e,{x:15.5,z:15});assert.equal(g.treeTagCommand(f,{type:'ttAttack',target:e.id}),true);tick(g,.1);assert.equal(e.treeTagCaptured,true);assert.equal(worker.alive,false);assert.equal(g.treeTagCommand(e,{type:'ttMove',workerId:worker.id,x:-20,z:-20}),false);
});
