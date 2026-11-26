import test from 'node:test';
import assert from 'node:assert/strict';
import {tickRoAutoSkillQueue,setRoAutoSkillTiming,roAutoSkillConfig} from '../shared/ro-auto-skill-queue.js';
import {roEquipSkill} from '../shared/ro-skill-loadout.js';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {roSkillLibraryMarkup} from '../src/ro-skill-library.js';

function fixture(){const unit={id:1,alive:true,bonkHero:true,x:0,z:0,mana:1000,bonkBuild:{weapons:{bash:1,envenom:1}},bonkSkillSlots:[null,'bash','envenom']},game={options:{mode:'bonk'},bonk:{stage:'playing',elapsed:0},units:[unit,{id:2,bonkEnemy:true,alive:true,x:1,z:0,collisionRadius:.3}]},stats={afterCastReduction:1,variableCastReduction:1,fixedCastReduction:1,attackMotion:.01},casts=[];return{unit,game,stats,casts,tick(time){game.bonk.elapsed=time;game.time=time;return tickRoAutoSkillQueue(game,unit,stats,w=>{casts.push({key:w.key,time});return true;});}};}

test('FIFO automation follows slots, spaces successful casts and repeats each identity at its configured interval without writing other cooldowns',()=>{
 const f=fixture();assert.ok(setRoAutoSkillTiming(f.unit,{gap:.5}));assert.ok(setRoAutoSkillTiming(f.unit,{key:'bash',interval:2}));assert.ok(setRoAutoSkillTiming(f.unit,{key:'envenom',interval:3}));assert.ok(f.tick(0));assert.deepEqual(Object.keys(f.unit.bonkWeaponAt),['bash']);assert.equal(f.tick(.49),false);assert.ok(f.tick(.5));assert.equal(f.tick(1.99),false);assert.ok(f.tick(2));assert.equal(f.tick(3.49),false);assert.ok(f.tick(3.5));assert.deepEqual(f.casts,[{key:'bash',time:0},{key:'envenom',time:.5},{key:'bash',time:2},{key:'envenom',time:3.5}]);
});

test('one pending entry per skill prevents backlog, blocked heads do not starve others and disabled/reserve skills leave the queue',()=>{
 const f=fixture();f.unit.bonkWeaponAt={bash:100};assert.ok(f.tick(0));assert.equal(f.casts[0].key,'envenom');for(let i=1;i<30;i++)f.tick(i*.05);assert.equal(new Set(f.unit.roAutoQueue.keys).size,f.unit.roAutoQueue.keys.length);assert.ok(f.unit.roAutoQueue.keys.includes('bash'));f.unit.bonkSkillAuto={bash:false,envenom:false};f.tick(2);assert.deepEqual(f.unit.roAutoQueue.keys,[]);f.unit.bonkSkillAuto={bash:true};f.unit.bonkSkillSlots=[null,null,'envenom'];f.tick(3);assert.equal(f.unit.roAutoQueue.keys.includes('bash'),false);
});

test('slot swaps preserve pending intervals and cooldowns, change queue priority and keep the native attack fixed',()=>{
 const f=fixture();f.unit.bonkWeaponAt={bash:10,envenom:20};f.tick(0);setRoAutoSkillTiming(f.unit,{key:'bash',interval:7});const cooldowns={...f.unit.bonkWeaponAt};assert.ok(roEquipSkill(f.unit,'envenom',1));assert.deepEqual(f.unit.bonkSkillSlots.slice(1,3),['envenom','bash']);assert.deepEqual(f.unit.roAutoQueue.keys,['envenom','bash']);assert.deepEqual(f.unit.bonkWeaponAt,cooldowns);assert.equal(roAutoSkillConfig(f.unit).intervals.bash,7);assert.equal(roEquipSkill(f.unit,'envenom',0),false);
});

test('automation cannot run during pause, level offers or death and cast time occupies the queue until completion',()=>{
 const f=fixture();for(const stage of ['preparation','levelup','finished']){f.game.bonk.stage=stage;assert.equal(f.tick(0),false);}f.game.bonk.stage='playing';f.unit.alive=false;assert.equal(f.tick(0),false);f.unit.alive=true;f.unit.roCasting={key:'bash',finishAt:2};assert.equal(f.tick(1),false);assert.equal(f.casts.length,0);delete f.unit.roCasting;f.game.paused=true;assert.equal(f.tick(2),false);f.game.paused=false;f.game.bonk.offer={choices:[]};assert.equal(f.tick(2),false);
});

test('authoritative AUTO never starts two skills together, respects configured repeats and saves preferences without persisting a transient backlog',()=>{
 const g=new Game(717,{mode:'bonk',bonkLineage:'dragonknight'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');Object.assign(g.bonk,{routeVersion:0,spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[],bossUnlocked:false});g.bonk.map.obstacles=[];g.obstacles=[];u.bonkBuild.weapons={basic:1,bash:1,sm_magnum:1};u.bonkSkillSlots=['basic','bash','sm_magnum'];u.bonkSkillAuto={basic:false};u.attributes.int=99;u.mana=10000;u.bonkInvulnerableUntil=1000;g.units=[u,{id:900,bonkEnemy:true,alive:true,team:100,x:u.x,z:u.z+1.5,hp:1e8,maxHp:1e8,speed:0,damage:0,collisionRadius:.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity}];assert.ok(g.command('p',{type:'bkAutoTiming',gap:.4}));assert.ok(g.command('p',{type:'bkAutoTiming',key:'bash',interval:1.2}));const seen=new Map();for(let i=0;i<140;i++){g.tick(.05);for(const e of g.effects)if(e.type==='roAttack')seen.set(e.id,e);}const casts=[...seen.values()];assert.ok(casts.length>=3);for(let i=1;i<casts.length;i++)assert.ok(casts[i].time-casts[i-1].time>=.4-1e-7);const bash=casts.filter(e=>e.skillKey==='bash');for(let i=1;i<bash.length;i++)assert.ok(bash[i].time-bash[i-1].time>=1.2-1e-7);const saved=createRoCheckpoint(g);assert.ok(saved);assert.deepEqual(saved.hero.roAutoSkills,{gap:.4,intervals:{bash:1.2}});assert.equal(saved.hero.roAutoQueue,undefined);const resumed=new Game(55,{mode:'bonk',bonkLineage:'dragonknight'});resumed.addPlayer('p','knight');assert.ok(resumed.command('p',{type:'bkRestore',checkpoint:saved}));assert.deepEqual(resumed.player('p').roAutoSkills,saved.hero.roAutoSkills);
 for(const invalid of [{gap:0,intervals:{}},{gap:NaN,intervals:{}},{gap:.5,intervals:{unlearned:2}},{gap:.5,intervals:{bash:-1}},{gap:.5,intervals:{bash:121}}]){const bad=structuredClone(saved);bad.hero.roAutoSkills=invalid;assert.equal(validateRoCheckpoint(bad),null);}
});

test('library exposes drag targets and editable per-character timing, while invalid configuration commands are atomic',()=>{
 const f=fixture();for(const c of [{gap:-1},{gap:11},{key:'unknown',interval:2},{key:'bash',interval:'3'},{key:'bash',interval:Infinity}])assert.equal(setRoAutoSkillTiming(f.unit,c),false);assert.equal(f.unit.roAutoSkills,undefined);setRoAutoSkillTiming(f.unit,{key:'bash',interval:4.5});const html=roSkillLibraryMarkup({weapons:[{key:'basic',level:1},{key:'bash',name:'Golpe',level:1,kind:'slash',skill:'cleave'}]},f.unit);assert.match(html,/draggable="true" data-bk-drag-skill="bash"/);assert.match(html,/data-bk-drop-skill-slot="12"/);assert.match(html,/data-bk-auto-gap/);assert.match(html,/data-bk-auto-interval="bash" value="4.5"/);assert.match(html,/Alt \+ ← \/ →/);
});
