import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {phaseKillerUnitSkills,PHASE_KILLER_IMPLEMENTED_FAMILIES} from '../shared/phase-killer.js';
import {PHASE_KILLER_ITEMS as I,PHASE_KILLER_SKILLS as S,PHASE_KILLER_RECIPES as R,PHASE_KILLER_WORLD_RECIPES as W,PHASE_KILLER_BLOOD_FORGE as FORGE,PHASE_KILLER_DISGUISES as D,PHASE_KILLER_ACTORS as A} from '../shared/phase-killer-catalog.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const cast=(g,u,skill,extra={})=>g.command(u.owner,{type:'pkCast',skill,...extra});
function setup(){const g=new Game(17,{mode:'phasekiller'});for(let i=0;i<6;i++)g.addPlayer('p'+i,'townsperson','Pessoa '+i);g.initPhaseKiller();g.phaseKiller.assignAt=0;g.tick(.01);const killer=g.units.find(u=>u.pkRole==='killer'),u=g.units.find(u=>u.pkRole==='townsfolk'),target=g.units.find(t=>t!==u&&t!==killer);Object.assign(u,{x:15,z:-7});Object.assign(target,{x:16,z:-7});return{g,u,target,killer};}
function give(u,key){u.inventory.push({key,charges:I[key].charges});return u.inventory.at(-1);}
function itemFor(skill){return Object.values(I).find(i=>!i.internal&&i.skills.includes(skill)&&i.charges>0)?.key;}

test('civilian blood vial expands its own native children and charges are extracted from iuse',()=>{
 const{g,u}=setup();assert.ok(phaseKillerUnitSkills(u).includes('A066'));assert.ok(phaseKillerUnitSkills(u).includes('A067'));assert.ok(phaseKillerUnitSkills(u).includes('A05C'));assert.equal(phaseKillerUnitSkills(u).includes('A060'),false);
 assert.equal(I.I00E.charges,2);assert.equal(I.I01H.charges,3);assert.equal(I.I01N.charges,2);assert.equal(I.I001.charges,0);assert.equal(I.I02R.charges,1);assert.equal(I.I039.stats.attackSpeed,.2);close(I.I039.stats.moveSpeedFlat,75/128);assert.ok(I.I039.skills.includes('A05N'));assert.ok(I.I032.skills.includes('A05K'));
 const before=u.pkBlood;assert.equal(cast(g,u,'A05C',{target:u.id}),true);close(u.pkBlood,before+15);assert.ok(u.hp<250);
});

test('a charged item consumes once without itemSlot, rejects forged slots, and cannot be cast after exhaustion',()=>{
 const{g,u}=setup();give(u,'I01N');assert.equal(cast(g,u,'A03M'),true);assert.equal(u.inventory[0].charges,1);assert.equal(u.pkInvulnerableUntil,g.time+15);u.cooldowns.A03M=0;const mana=u.mana;
 assert.equal(cast(g,u,'A03M',{itemSlot:2}),false);assert.equal(u.inventory[0].charges,1);assert.equal(u.mana,mana);assert.equal(cast(g,u,'A03M'),true);assert.equal(u.inventory.length,0);u.cooldowns.A03M=0;assert.equal(cast(g,u,'A03M'),false);
});

test('wearing armor toggles a profile instead of stacking inventory armor, and weapon penalties remain finite and reversible',()=>{
 const{g,u}=setup();give(u,'I000');give(u,'I009');give(u,'I001');g.tick(.01);close(u.armor,0);close(u.speed,D.hpea.speed);close(u.interval,D.hpea.interval/.8);
 assert.equal(cast(g,u,'A005',{itemSlot:0}),true);close(u.armor,10);close(u.speed,D.h002.speed);close(u.interval,D.h002.interval/.8);assert.equal(u.pkAppearance,'h002');
 for(let i=0;i<12;i++)g.tick(.01);close(u.armor,10);u.cooldowns.A005=0;assert.equal(cast(g,u,'A005',{itemSlot:0}),true);close(u.armor,0);assert.equal(u.pkAppearance,'townsperson');
 assert.equal(cast(g,u,'A00H',{itemSlot:1}),true);close(u.armor,20);assert.equal(u.pkAppearance,'h003');g.command(u.owner,{type:'pkDrop',slot:1});close(u.armor,0);close(u.speed,D.hpea.speed);
});

test('Blood Forge follows first-slot orbs, native blood costs and result pools, without consuming the orb',()=>{
 const{g,u}=setup();give(u,'I03H');u.pkBlood=8;g.random=()=>0;const count=g.phaseKiller.loot.length;assert.equal(cast(g,u,'A066'),true);assert.equal(u.pkBlood,0);assert.equal(u.inventory[0].key,'I03H');assert.equal(g.phaseKiller.loot.length,count+1);assert.equal(g.phaseKiller.loot.at(-1).key,FORGE.I03H.outputs[0]);
 u.cooldowns.A066=0;assert.equal(cast(g,u,'A066'),false);assert.equal(g.phaseKiller.loot.length,count+1);u.inventory=[{key:'I03R',charges:0}];u.pkBlood=4;assert.equal(cast(g,u,'A066'),true);assert.equal(u.pkBlood,0);assert.equal(u.inventory[0].key,'I03R');
});

test('Invoke is civilian-accessible, spends blood rather than souls, and uses native Master Orb effects',()=>{
 const{g,u}=setup();give(u,'I03T');u.pkBlood=45;u.hp=20;u.mana=0;u.pkSouls=0;assert.equal(cast(g,u,'A067'),true);assert.equal(u.hp,u.maxHp);assert.equal(u.mana,u.maxMana);assert.equal(u.pkBlood,0);assert.equal(u.pkSouls,0);assert.equal(u.inventory[0].key,'I03T');
 u.cooldowns.A067=0;u.inventory=[{key:'I03S',charges:0}];u.pkBlood=10;assert.equal(cast(g,u,'A067'),true);assert.equal(u.pkOrbRevealUntil,g.time+5);assert.equal(u.pkBlood,0);
});

test('two-item stone recipes and global Omniworld portal consume the correct pair only in its original region',()=>{
 const{g,u,target}=setup();u.inventory=[{key:'I01T',charges:0},{key:'I01T',charges:0}];assert.equal(g.command(u.owner,{type:'pkCombine',from:0,to:1}),true);assert.equal(u.inventory[0].key,'I01U');give(u,'I01U');assert.equal(g.command(u.owner,{type:'pkCombine',from:0,to:1}),true);assert.equal(u.inventory[0].key,'I01S');assert.equal(R.length,63);
 u.inventory=[{key:'I01C',charges:0},{key:'I01R',charges:0}];assert.equal(g.command(u.owner,{type:'pkCombine',from:0,to:1}),false);assert.equal(u.inventory.length,2);const r=W[0].region;Object.assign(u,{pkDimension:'aether',x:(r.minX+r.maxX)/2,z:(r.minZ+r.maxZ)/2});assert.equal(g.command(u.owner,{type:'pkCombine',from:0,to:1}),true);assert.equal(u.inventory.length,0);assert.equal(g.phaseKiller.gatewayOpen,true);
 Object.assign(target,{pkDimension:'aether',x:33,z:31});assert.equal(g.command(target.owner,{type:'pkGateway'}),true);assert.equal(target.pkDimension,'omni');assert.equal(g.snapshotFor(target.owner).phaseKiller.gatewayOpen,true);
});

test('cooldown snapshots expose remaining seconds while keeping canonical deadlines unchanged',()=>{
 const{g,u}=setup();assert.equal(cast(g,u,'A00E'),true);const deadline=u.cooldowns.A00E;g.tick(.5);const own=g.snapshotFor(u.owner).units.find(t=>t.owner===u.owner);close(own.cooldowns.A00E,deadline-g.time);assert.equal(u.cooldowns.A00E,deadline);assert.ok(own.cooldowns.A00E>=0&&own.cooldowns.A00E<S.A00E.cooldown);
});

test('lobby chat persists into initialization and allows repeated messages before the paused lobby starts',()=>{
 const g=new Game(4,{mode:'phasekiller'});g.addPlayer('a','townsperson','Ana');g.addPlayer('b','townsperson','Beto');assert.equal(g.command('a',{type:'pkChat',text:'Vamos começar?'}),true);assert.equal(g.command('a',{type:'pkChat',text:'Prontos?'}),true);assert.equal(g.snapshotFor('b').phaseKiller.messages[0].text,'Vamos começar?');assert.equal(g.phaseKiller,undefined);g.command('a',{type:'pkReady'});g.command('b',{type:'pkReady'});assert.equal(g.phaseKiller.messages[0].text,'Vamos começar?');
});

test('Soul Burn and Lightning Shield use attached native level-one damage and status fields',()=>{
 const{g,u,target}=setup();give(u,'I039');u.mana=150;assert.equal(cast(g,u,'A05N',{target:target.id}),true);close(target.speed,D.hpea.speed*.5);close(target.interval,2);const hp=target.hp;g.tick(1);assert.ok(target.hp<hp);close(target.pkSoulBurn.damage,5);assert.equal(target.pkSoulBurn.damageReduction,.5);
 give(u,'I032');target.pkSoulBurn=null;g.tick(.01);assert.equal(cast(g,u,'A05K',{target:u.id}),true);const old=target.hp;g.tick(1);assert.ok(target.hp<old);assert.equal(u.pkLightningShield.damage,10);
});

test('killer death is final and cannot regenerate back to life on a subsequent tick',()=>{
 const{g,u,killer}=setup();Object.assign(u,{x:15,z:-7,damage:1000,cd:0});Object.assign(killer,{x:15.1,z:-7,hp:1});g.command(u.owner,{type:'pkAttack',target:killer.id});g.tick(.05);assert.equal(g.phaseKiller.finished,true);assert.equal(killer.alive,false);assert.equal(killer.hp,0);g.tick(1);assert.equal(killer.hp,0);assert.equal(g.phaseKiller.winner,'townsfolk');
});

test('every active catalog family has an explicit mechanic rather than a generic fallback',()=>{
 for(const skill of Object.values(S))if(skill.kind==='active')assert.ok(PHASE_KILLER_IMPLEMENTED_FAMILIES.includes(skill.family),skill.key+' '+skill.family);
});

test('phase cube reveals clues without transporting, spheres transport self and target, and ghosts have native profiles',()=>{
 const{g,u,target}=setup();give(u,itemFor('A01S')||'I00T');u.skills.push('A01S','A01T','A01U');u.mana=1000;const z=u.z;
 assert.equal(cast(g,u,'A01S'),true);assert.equal(u.pkDimension,'normal');assert.equal(u.z,z);assert.ok(u.pkPhaseRevealUntil>g.time);
 assert.equal(cast(g,u,'A01T'),true);assert.equal(u.pkDimension,'aether');close(u.z,z+64);assert.ok(u.pkPauseUntil>g.time);g.tick(1.6);Object.assign(target,{pkDimension:'aether',x:u.x+1,z:u.z});assert.equal(cast(g,u,'A01U',{target:target.id}),true);assert.equal(target.pkDimension,'normal');
});

test('Invoke Aether creates an entry rift and delayed native-scale nova waves instead of generic instant damage',()=>{
 const{g,u}=setup();give(u,'I03O');u.pkBlood=30;Object.assign(u,{x:10,z:-20});assert.equal(cast(g,u,'A067'),true);assert.equal(u.pkBlood,0);assert.ok(g.phaseKiller.fields.some(f=>f.family==='rift'));assert.ok(g.phaseKiller.fields.some(f=>f.family==='supernova'));assert.equal(g.phaseKiller.fields.filter(f=>f.family==='nova').length,1);
 for(let i=0;i<15;i++)g.tick(.25);assert.ok(g.phaseKiller.fields.some(f=>f.family==='nova'));assert.ok(g.phaseKiller.fields.filter(f=>f.family==='nova').length>=30);assert.equal(u.pkDimension,'aether');
});

test('bombs have a real fuse and can be attacked while hidden traps stay out of other viewer packets',()=>{
 const{g,u,target}=setup();u.skills.push('A00R','A02W');u.mana=1000;assert.equal(cast(g,u,'A00R',{x:u.x+.7,z:u.z}),true);const bomb=g.phaseKiller.fields.find(f=>f.family==='dynamite');assert.equal(bomb.hp,5);assert.ok(bomb.explodeAt-g.time>=4.99);assert.equal(g.command(target.owner,{type:'pkAttack',target:bomb.id}),true);Object.assign(target,{x:u.x+.8,z:u.z,damage:100,cd:0});g.tick(.05);g.tick(.05);assert.equal(g.phaseKiller.fields.some(f=>f.id===bomb.id),false);
 // Use a separate location so the test does not immediately spring the trap.
 const safe=setup();safe.u.skills.push('A02W');safe.u.mana=1000;assert.equal(cast(safe.g,safe.u,'A02W',{x:safe.u.x-.7,z:safe.u.z}),true);const trap=safe.g.phaseKiller.fields.find(f=>f.family==='netTrap');assert.ok(safe.g.snapshotFor(safe.u.owner).phaseKiller.fields.some(f=>f.id===trap.id));assert.equal(safe.g.snapshotFor(safe.target.owner).phaseKiller.fields.some(f=>f.id===trap.id),false);
});

test('storage preserves charges, enforces proximity and three slots, and rejects protected native items',()=>{
 const{g,u}=setup();u.skills.push('A05D');assert.equal(cast(g,u,'A05D',{x:u.x+.7,z:u.z}),true);const cube=g.phaseKiller.fields.find(f=>f.family==='storageCube');give(u,'I01N');give(u,'I039');assert.equal(g.command(u.owner,{type:'pkStore',fieldId:cube.id,slot:0}),true);assert.equal(cube.inventory[0].charges,2);assert.equal(g.command(u.owner,{type:'pkStore',fieldId:cube.id,slot:0}),false);assert.equal(g.command(u.owner,{type:'pkTake',fieldId:cube.id,slot:0}),true);assert.equal(u.inventory.at(-1).key,'I01N');u.x+=10;assert.equal(g.command(u.owner,{type:'pkTake',fieldId:cube.id,slot:0}),false);
});

test('lobby and live collision positions are distinct and cannot push a character through a house',()=>{
 const g=new Game(5,{mode:'phasekiller'});for(let i=0;i<6;i++)g.addPlayer('a'+i,'townsperson');const positions=g.units.map(u=>u.x+':'+u.z);assert.equal(new Set(positions).size,6);g.initPhaseKiller();const a=g.units[0],b=g.units[1];Object.assign(a,{x:10,z:-20});Object.assign(b,{x:10,z:-20});g.tick(.05);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=.599);
});

test('gathering deaths cannot turn a ghost into the killer when identities are assigned',()=>{
 const g=new Game(91,{mode:'phasekiller'});for(let i=0;i<6;i++)g.addPlayer('v'+i,'townsperson');g.initPhaseKiller();const victim=g.units[0],attacker=g.units[1];Object.assign(victim,{x:10,z:-20,hp:1});Object.assign(attacker,{x:10.1,z:-20,damage:100,cd:0});g.command(attacker.owner,{type:'pkAttack',target:victim.id});g.tick(.05);assert.equal(victim.pkGhost,true);assert.equal(victim.hp,200);assert.equal(victim.maxMana,50);close(victim.speed,125/128);assert.deepEqual(phaseKillerUnitSkills(victim),['A02K','A01C']);g.command(attacker.owner,{type:'pkStop'});g.phaseKiller.assignAt=g.time;g.tick(.05);assert.notEqual(victim.pkRole,'killer');assert.equal(g.units.filter(u=>u.pkRole==='killer').length,1);assert.equal(g.units.find(u=>u.pkRole==='killer').pkGhost,false);
});

test('Arcanum revives after its native delay and Soul Skull creates a zombie who can consume a local skeleton to become free',()=>{
 const{g,u,target}=setup();Object.assign(target,{pkGhost:true,pkAppearance:'ghost',hp:200,maxHp:200,maxMana:50,mana:50,skills:['A02K','A01C']});u.skills.push('A03B');assert.equal(cast(g,u,'A03B',{target:target.id}),true);assert.equal(target.pkGhost,true);g.tick(1);assert.equal(target.pkGhost,true);g.tick(1.1);assert.equal(target.pkGhost,false);assert.equal(target.hp,250);assert.ok(phaseKillerUnitSkills(target).includes('A000'));
 Object.assign(target,{pkGhost:true,pkAppearance:'ghost',hp:200,maxHp:200,maxMana:50,mana:50});u.skills.push('A056');u.mana=100;assert.equal(cast(g,u,'A056',{target:target.id}),true);assert.equal(target.pkZombie,true);assert.equal(target.pkMaster,u.owner);assert.equal(target.maxHp,300);assert.ok(phaseKillerUnitSkills(target).includes('A053'));
 const body={id:g.id(),owner:'dead',x:target.x,z:target.z,dimension:target.pkDimension,skeletonAt:g.time,consumed:false};g.phaseKiller.corpses.push(body);assert.equal(cast(g,target,'A053',{target:body.id}),true);assert.equal(body.consumed,true);assert.equal(target.pkZombie,false);assert.equal(target.pkMaster,null);assert.equal(target.maxHp,250);
});

test('native matches create light without damage, smoke restores cooldowns and poison is self-inflicted',()=>{
 const{g,u,target}=setup();u.skills.push('A00K','A032','A00X');const hp=target.hp;assert.equal(cast(g,u,'A00K'),true);assert.equal(target.hp,hp);assert.ok(g.phaseKiller.fields.some(f=>f.family==='matchLight'&&f.until-g.time===3));u.cooldowns.A00E=50;assert.equal(cast(g,u,'A032'),true);assert.equal(u.cooldowns.A00E,undefined);const before=u.hp;assert.equal(cast(g,u,'A00X'),true);assert.ok(u.hp<before);assert.equal(u.pkPoison.damage,11);assert.equal(target.pkPoison,undefined);
});

test('net traps spring on approach and physically hold the victim for ten seconds without fabricated damage',()=>{
 const{g,u,target}=setup();u.skills.push('A02W');Object.assign(target,{x:20,z:-7});assert.equal(cast(g,u,'A02W',{x:u.x+.7,z:u.z}),true);const trap=g.phaseKiller.fields.find(f=>f.family==='netTrap');Object.assign(target,{x:trap.x+.2,z:trap.z});const hp=target.hp;g.tick(.05);assert.ok(target.pkRootUntil>=g.time+9.99);assert.equal(g.phaseKiller.fields.some(f=>f.id===trap.id),false);assert.ok(target.hp>=hp);g.command(target.owner,{type:'pkMove',x:20,z:-7});const x=target.x;g.tick(.1);close(target.x,x);
});

test('Locator marks another civilian and emits cross-world clues when used on oneself',()=>{
 const{g,u,target}=setup();u.skills.push('A033');u.mana=1000;assert.equal(cast(g,u,'A033',{target:target.id}),true);assert.equal(u.pkLocatorOwner,target.owner);const before={x:u.x,z:u.z};u.cooldowns.A033=0;assert.equal(cast(g,u,'A033',{target:u.id}),true);close(u.x,before.x);close(u.z,before.z);const clues=g.snapshotFor(u.owner).phaseKiller.markers;assert.ok(clues.length>0);assert.equal(g.snapshotFor(target.owner).phaseKiller.markers.length,0);
});

test('the two Impeders apply their native disruption fields without an invented direct damage hit',()=>{
 const{g,u,target}=setup();u.skills.push('A02Q');u.mana=1000;const hp=target.hp;assert.equal(cast(g,u,'A02Q',{target:target.id}),true);assert.equal(target.hp,hp);assert.equal(target.pkDisruption.prevents,8);close(target.pkDisruption.missChance,.15);target.skills.push('A00E');assert.equal(cast(g,target,'A00E'),false);assert.match(g.commandFailureReason,/silêncio/);
});

test('native ambient creatures spawn in Aether during exploration and Unphased starts in its original Omniworld position with repaired boss loot',()=>{
 const g=new Game(8,{mode:'phasekiller'});for(let i=0;i<6;i++)g.addPlayer('a'+i,'townsperson');g.random=()=>0;g.initPhaseKiller();g.tick(.01);assert.equal(g.phaseKiller.stage,'gathering');const boss=g.units.find(u=>u.pkBoss),shade=g.units.find(u=>u.pkCreature&&!u.pkBoss);assert.equal(boss.pkAppearance,'h01U');assert.equal(boss.hp,750);assert.ok(Math.hypot(boss.x+3686.5/128,boss.z-15911.4/128)<.1,'first movement remains near native placement');assert.equal(shade.pkDimension,'aether');assert.equal(shade.pkAppearance,'h01N');close(shade.maxHp,A.h01N.hp);close(shade.damage,A.h01N.damage);assert.ok(g.phaseKiller.nextAmbientAt>=20&&g.phaseKiller.nextAmbientAt<=35.1);
 g.tick(19);assert.equal(g.units.filter(u=>u.pkCreature&&!u.pkBoss).length,1);g.tick(1.1);assert.equal(g.units.filter(u=>u.pkCreature&&!u.pkBoss).length,2);
 const hero=g.player('a0');boss.hp=1;Object.assign(hero,{pkDimension:'omni',x:boss.x+.1,z:boss.z,cd:0});const before=g.phaseKiller.loot.length;assert.equal(g.command(hero.owner,{type:'pkAttack',target:boss.id}),true);g.tick(.01);assert.equal(boss.alive,false);assert.equal(g.phaseKiller.loot.length-before,14);assert.ok(g.phaseKiller.loot.slice(-14).every(e=>e.dimension==='omni'&&I[e.key]));
});
