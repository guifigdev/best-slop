import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {roMvpPressure} from '../shared/ro-mvp-pressure.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {roDifficulty} from '../shared/ro-difficulty.js';

function arena(difficulty='normal'){
 const g=new Game(617,{mode:'bonk',bonkDifficulty:difficulty});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.bonkBuild.weapons={};u.bonkInvulnerableUntil=0;
 const boss={id:g.id(),bonkBoss:true,bonkEnemy:true,alive:true,team:100,ragnarokMvp:'mistress',x:u.x+.5,z:u.z,hp:1e6,maxHp:1e6,speed:0,damage:100,interval:.9,collisionRadius:1,bonkNextAttack:0,bonkNextSpecial:Infinity,roNativeReadyAt:Infinity,roReinforceReadyAt:Infinity};
 g.units=[u,boss];g.effects=[];g.bonk.objectives=[];g.bonk.spawnAt=Infinity;g.bonk.bossSpawned=true;g.bonk.map.obstacles=[];return {g,u,boss};
}
test('MVP role profiles and stronger ordinary monsters keep independent fixed budgets',()=>{
 const flyer=roMvpPressure('mistress'),heavy=roMvpPressure('eddga'),caster=roMvpPressure('ifrit');assert.ok(flyer.speed>heavy.speed);assert.ok(flyer.attackInterval<heavy.attackInterval);assert.ok(heavy.damage>flyer.damage);assert.ok(caster.specialInterval<heavy.specialInterval);
 for(const activity of ['adventure','tower'])for(const key of ['mistress','eddga','ifrit']){
  const b=roSurvivorEnemyBudget({key,boss:true,activity}),p=roMvpPressure(key);assert.ok(b.speedScale>roDifficulty('normal').speed);assert.ok(b.hp>0&&b.damage>100);assert.ok(p.attackInterval<1.3&&p.specialInterval<5.8);
  assert.deepEqual(b,roSurvivorEnemyBudget({key,boss:true,activity,level:150,equipment:{damage:1e8}}));
 }
 const common=roSurvivorEnemyBudget({key:'poring'});assert.equal(common.speedScale,roDifficulty('normal').speed*1.1);assert.deepEqual(common,roSurvivorEnemyBudget({key:'poring',level:150}));
});
test('touching an MVP delivers its full basic attack on its own cadence without duplicate or delayed hits',()=>{
 const {g,u,boss}=arena(),hp=u.hp;g.tick(.05);const first=hp-u.hp;const ordinary=arena();ordinary.boss.bonkBoss=false;const normalHp=ordinary.u.hp;ordinary.g.tick(.05);assert.ok(first>(normalHp-ordinary.u.hp)*1.2,'full basic hit '+first+' versus touch '+(normalHp-ordinary.u.hp));assert.equal(g.effects.filter(e=>e.type==='damage'&&e.target===u.id).length,1);
 const collected=new Map(g.effects.filter(e=>e.type==='damage'&&e.target===u.id).map(e=>[e.id,e]));
 for(let i=0;i<44;i++){u.hp=u.maxHp;delete u.roContactPush;u.x=boss.x-.5;u.z=boss.z;g.tick(.05);for(const e of g.effects)if(e.type==='damage'&&e.target===u.id)collected.set(e.id,e);}
 const hits=[...collected.values()];assert.equal(hits.length,3);assert.ok(hits.every((hit,i)=>!i||hit.time-hits[i-1].time>=boss.interval-.00001));assert.equal(g.units.length,2);
});
test('MVP telegraphs keep safe reaction windows but become quicker and more frequent in rage and respect presets',()=>{
 const results=[];
 for(const difficulty of ['easy','normal','hard'])for(const rage of [false,true]){
  const {g,u,boss}=arena(difficulty);u.bonkInvulnerableUntil=1e6;boss.x=u.x+20;boss.bonkEnraged=rage;boss.bonkNextSpecial=0;g.tick(.05);
  assert.ok(g.bonk.warnings.length);const warning=g.bonk.warnings[0],windup=warning.fireAt-g.bonk.elapsed;assert.ok(windup>=1.3);assert.ok(warning.mvp==='mistress');
  results.push({difficulty,rage,windup,interval:boss.bonkNextSpecial-g.bonk.elapsed,count:g.units.length});assert.equal(g.units.length,2);
 }
 for(const difficulty of ['easy','normal','hard']){const normal=results.find(r=>r.difficulty===difficulty&&!r.rage),rage=results.find(r=>r.difficulty===difficulty&&r.rage);assert.ok(rage.windup<normal.windup&&rage.interval<normal.interval);}
 const easy=results.find(r=>r.difficulty==='easy'&&!r.rage),hard=results.find(r=>r.difficulty==='hard'&&!r.rage);assert.ok(easy.windup>hard.windup&&easy.interval>hard.interval);
});
