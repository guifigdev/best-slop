import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {SKILLS} from '../shared/catalog.js';
import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {gainRoJobXp,roJobProgress} from '../shared/ro-job-progression.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {actorModelKey} from '../src/actor-identity.js';
import {roJobEvolutionMarkup} from '../src/ro-job-panel.js';

test('all twelve branches evolve through four different outfits without changing base level or spending a build choice',()=>{
 for(const p of Object.values(RO_LINEAGES)){const g=new Game(51,{mode:'bonk',bonkLineage:p.key});g.addPlayer('p',p.hero);g.command('p',{type:'bkReady'});const u=g.player('p'),base=u.level;u.bonkPendingLevels=1;
  for(let tier=0;tier<3;tier++){const before=actorModelKey(u);assert.equal(g.command('p',{type:'bkAdvanceJob'}),false);gainRoJobXp(u,20000);const progress=roJobProgress(u);assert.equal(progress.ready,true);assert.match(roJobEvolutionMarkup(g.snapshotBonk('p'),u),/data-bk-evolve/);assert.equal(g.command('p',{type:'bkAdvanceJob'}),true);assert.notEqual(actorModelKey(u),before);assert.equal(u.bonkJob,p.jobs[tier+1]);assert.equal(u.roJobLevel,1);assert.equal(u.roJobXp,0);assert.equal(u.level,base);assert.equal(u.bonkPendingLevels,1);}
  assert.equal(g.command('p',{type:'bkAdvanceJob'}),false);
 }
});

test('separate class XP survives checkpoints and legacy saves migrate without losing their developed outfit',()=>{
 const g=new Game(2,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');gainRoJobXp(u,250);const cp=createRoCheckpoint(g);assert.ok(cp.hero.roJobLevel>1);const target=new Game(3,{mode:'bonk',bonkLineage:'shadowcross'});target.addPlayer('p','raccoon');assert.equal(target.command('p',{type:'bkRestore',checkpoint:cp}),true);assert.equal(target.player('p').roJobLevel,u.roJobLevel);assert.equal(target.player('p').roJobXp,u.roJobXp);
 const legacy=structuredClone(cp);delete legacy.hero.roJobLevel;delete legacy.hero.roJobXp;legacy.hero.roTier=2;legacy.hero.level=27;const migrated=validateRoCheckpoint(legacy);assert.equal(migrated.hero.roTier,2);assert.ok(migrated.hero.roJobLevel>1);cp.hero.roJobLevel=71;assert.equal(validateRoCheckpoint(cp),null);
});

test('card and outfit-preview evolution both preserve the pending skill choice and refresh the offer',()=>{
 for(const method of ['card','preview']){
 const g=new Game(57,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');gainRoJobXp(u,20000);g.bonk.spawnAt=100;
 g.bonk.pickups.push({id:g.id(),x:u.x,z:u.z,type:'xp',value:40,age:0});g.tick(.1);const choice=g.bonk.offer.choices.find(c=>c.kind==='job');assert.ok(choice);const pending=u.bonkPendingLevels,base=u.level;
 assert.equal(g.command('p',method==='card'?{type:'bkChoose',choiceId:choice.id}:{type:'bkAdvanceJob'}),true);assert.equal(u.roTier,1);assert.equal(u.roJobLevel,1);assert.equal(u.level,base);assert.equal(u.bonkPendingLevels,pending);assert.equal(g.bonk.stage,'levelup');assert.ok(g.bonk.offer.choices.every(c=>c.kind!=='job'));
 assert.equal(g.command('p',{type:'bkChoose',choiceId:g.bonk.offer.choices[0].id}),true);assert.equal(u.bonkPendingLevels,pending-1);
 }
});

function classic(keys){const g=new Game(3,{mode:'tower'});g.addPlayer('p','mage');g.addPlayer('a','knight');g.phase='wave';g.wave=1;const u=g.player('p'),a=g.player('a');Object.assign(u,{x:0,z:0,skills:keys,skillLevels:Object.fromEntries(keys.map(k=>[k,1])),mana:9999,order:'stop',cooldowns:{}});Object.assign(a,{x:2,z:0,order:'stop'});g.refresh(u);u.mana=9999;return{g,u,a};}

test('eleven new classic Ragnarok techniques have five real ranks and support multiple ally aura families without stacking duplicates',()=>{
 const keys=Object.keys(SKILLS).filter(k=>k.startsWith('ro_'));assert.equal(keys.length,11);for(const k of keys)assert.equal(SKILLS[k].levels.length,5);
 const {g,u,a}=classic(['ro_impositio','ro_magnificat','ro_increaseagi','ro_angelus']);g.refresh(a);const baseline={damage:a.damage,armor:a.armor,mana:a.manaRegen,speed:a.attackSpeed};u.x=30;g.refresh(a);assert.ok(baseline.damage>a.damage);assert.ok(baseline.armor>a.armor);assert.ok(baseline.mana>a.manaRegen);assert.ok(baseline.speed>a.attackSpeed);u.x=0;u.skills.push('packaura');u.skillLevels.packaura=1;g.refresh(a);assert.equal(a.damage,baseline.damage);const enemy=g.spawnEnemy('wolf',1,1,{});g.refreshMonsterStats(enemy);assert.ok(enemy.team!==u.team);assert.equal(g.auraFor(enemy,'packaura'),null);
});

test('meteor pulses damage foes and sanctuary heals only allies; effects end on phase change',()=>{
 const {g,u,a}=classic(['ro_meteor','ro_sanctuary']),e=g.spawnEnemy('wolf',3,0,{hp:3000,damage:0,speed:0});e.order='stop';const hp=e.hp;assert.equal(g.command('p',{type:'cast',slot:0,x:3,z:0}),true);g.tickClassicRoEffects();assert.ok(e.hp<hp);const damaged=e.hp;g.time+=.4;g.tickClassicRoEffects();assert.ok(e.hp<damaged);
 a.hp-=200;e.hp-=20;const allyHp=a.hp,enemyHp=e.hp;assert.equal(g.command('p',{type:'cast',slot:1,x:2,z:0}),true);g.tickClassicRoEffects();assert.ok(a.hp>allyHp);assert.equal(e.hp,enemyHp);g.phase='preparation';g.tickClassicRoEffects();assert.equal(g.roClassicEffects.length,0);
});

test('three summons preserve owner, team and lifespan, replace their own earlier cast and benefit from allied auras',()=>{
 const {g,u}=classic(['ro_homunculus','ro_falcon','ro_valkyrie','ro_impositio']);for(let slot=0;slot<3;slot++){assert.equal(g.command('p',{type:'cast',slot}),true);const key=u.skills[slot],first=g.units.filter(v=>v.summonSkill===key);assert.equal(first.length,slot===1?2:1);for(const v of first){assert.equal(v.owner,'p');assert.equal(v.team,u.team);assert.equal(v.challenge,u.challenge);assert.ok(v.expires>g.time);assert.ok(g.auraFor(v,'packaura'));}u.cooldowns[key]=0;u.mana=9999;assert.equal(g.command('p',{type:'cast',slot}),true);const second=g.units.filter(v=>v.summonSkill===key);assert.equal(second.length,first.length);assert.ok(second.every(v=>!first.includes(v)));}
});
