import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
function setup(online=false){const g=new Game(48,{mode:'bonk',bonkActivity:'tower',bonkLineage:'imperialguard',bonkSkillMode:'class',online});g.addPlayer('p','turtle');if(online)g.addPlayer('q','knight');g.command('p',{type:'bkReady'});return{g,u:qualifiedRoTestHero(g.player('p'),{})};}
function offer(g,u,choice){const value={id:'offer-'+g.id(),choices:[{...choice,id:'choice-'+g.id()}]};if(g.bonkOnline)u.bonkOffer=value;else{g.bonk.offer=value;g.bonk.stage='levelup';}return value.choices[0];}
test('six repeated stale rank-one cards upgrade the live skill to six and consume exactly six pending improvements',()=>{
 const{g,u}=setup();u.bonkPendingLevels=6;const original=roSkillOfferPool(u).find(c=>c.key==='sm_magnum');assert.equal(original.level,1);
 for(let rank=1;rank<=6;rank++){const c=offer(g,u,original);assert.equal(g.command('p',{type:'bkChoose',choiceId:c.id}),true);assert.equal(u.bonkBuild.weapons.sm_magnum,rank);assert.equal(u.bonkPendingLevels,6-rank);assert.equal(g.snapshotBonk('p').build.weapons.sm_magnum,rank);assert.equal(g.command('p',{type:'bkChoose',choiceId:c.id}),false,'repeated click on an old card is not another upgrade');}
 assert.equal(g.bonk.stage,'playing');assert.equal(g.bonk.offer,null);assert.equal(roSkillOfferPool(u).find(c=>c.key==='sm_magnum').level,7);
});
test('ordinary queued level choices advance their shown skill rank and finish rather than reopening forever',()=>{
 const{g,u}=setup();u.bonkPendingLevels=20;offer(g,u,roSkillOfferPool(u).find(c=>c.kind==='weapon'));
 for(let n=20;n>0;n--){const current=g.bonk.offer,c=current.choices.find(c=>c.kind==='weapon')||current.choices[0],before=u.bonkBuild.weapons[c.key]||0;assert.equal(g.command('p',{type:'bkChoose',choiceId:c.id}),true);assert.equal(u.bonkPendingLevels,n-1);if(c.kind==='weapon')assert.equal(u.bonkBuild.weapons[c.key],before+1);g.snapshotBonk('p');}
 assert.equal(g.bonk.stage,'playing');assert.equal(g.bonk.offer,null);
});
test('a stale maxed skill cannot lower its level or consume a pending improvement',()=>{
 const{g,u}=setup();u.bonkPendingLevels=1;u.bonkBuild.weapons.sm_magnum=8;const c=offer(g,u,{kind:'weapon',key:'sm_magnum',level:1});assert.equal(g.command('p',{type:'bkChoose',choiceId:c.id}),false);assert.equal(u.bonkBuild.weapons.sm_magnum,8);assert.equal(u.bonkPendingLevels,1);assert.ok(g.bonk.offer.choices.length);assert.ok(!g.bonk.offer.choices.some(c=>c.key==='sm_magnum'));
});
test('online skill choices consume only their owner pending levels and close their personal offer',()=>{
 const{g,u}=setup(true),q=qualifiedRoTestHero(g.player('q'),{});u.bonkPendingLevels=2;q.bonkPendingLevels=3;const original=roSkillOfferPool(u).find(c=>c.key==='sm_magnum');
 for(let rank=1;rank<=2;rank++){const c=offer(g,u,original);assert.equal(g.command('p',{type:'bkChoose',choiceId:c.id}),true);assert.equal(u.bonkBuild.weapons.sm_magnum,rank);assert.equal(q.bonkPendingLevels,3);}
 assert.equal(u.bonkOffer,null);assert.equal(g.snapshotBonk('p').stage,'playing');
});
