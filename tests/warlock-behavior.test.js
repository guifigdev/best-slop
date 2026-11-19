import {WARLOCK_POLISH} from '../shared/warlock-polish.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {wlSkillAt} from '../shared/warlock-catalog.js';
import {WARLOCK_BEHAVIOR as N,bindWarlockLink,tickWarlockLinks,warlockLinkAction,triggerWarlockVector,reflectWarlockDomeProjectile} from '../shared/warlock-behavior.js';
import {createLegacyUI} from '../src/legacy-ui.js';
import {warlockRanking,warlockResultsMarkup} from '../src/warlock-results.js';
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function setup(pSkills=[],qSkills=[]){const g=new Game(102,{mode:'warlock'});g.addPlayer('p','warlock');g.addPlayer('q','heretic');g.initWarlock();const p=g.player('p'),q=g.player('q');p.gold=q.gold=1000;for(const key of pSkills)assert.equal(g.command('p',{type:'wlBuy',skill:key}),true);for(const key of qSkills)assert.equal(g.command('q',{type:'wlBuy',skill:key}),true);g.command('p',{type:'wlReady'});g.command('q',{type:'wlReady'});Object.assign(p,{x:0,z:0,wlRegen:0});Object.assign(q,{x:7,z:0,wlRegen:0});return{g,p,q};}
const advance=(g,seconds)=>{for(let t=0;t<seconds-1e-9;t+=.025)g.tick(Math.min(.025,seconds-t));};

test('Link is a flying hook that attaches a persistent tether on impact and pulls the enemy instead of timing out at four seconds',()=>{
 const {g,p,q}=setup(['S019']);g.command('p',{type:'wlCast',skill:'S019',x:12,z:0});assert.equal(warlockLinkAction(g,p),'recall');near(g.warlock.projectiles[0].speed,950/64);assert.equal(q.hp,100);advance(g,.45);assert.equal(g.warlock.links.length,1);assert.equal(g.warlock.projectiles.length,0);assert.equal(warlockLinkAction(g,p),'release');advance(g,.15);assert.ok(q.hp<100);assert.ok(q.wlVx<0);assert.ok(q.x<7);
 for(let i=0;i<200;i++){Object.assign(q,{x:10,z:0,wlVx:0,wlVz:0});g.tick(.025);}assert.equal(g.warlock.links.length,1);assert.ok(g.warlock.links[0].elapsed>4);assert.equal(g.command('p',{type:'wlCast',skill:'S019'}),true);assert.equal(g.warlock.links.length,0);assert.ok(p.cooldowns.S019>0);
});
test('Hook can be recalled and cancelled during cooldown, and missing the target automatically recalls it',()=>{
 const {g,p}=setup(['S019']);g.command('p',{type:'wlCast',skill:'S019',x:-20,z:8});advance(g,.1);assert.equal(g.command('p',{type:'wlCast',skill:'S019'}),true);assert.equal(warlockLinkAction(g,p),'cancel');assert.equal(g.command('p',{type:'wlCast',skill:'S019'}),true);assert.equal(g.warlock.projectiles.length,0);assert.equal(g.command('p',{type:'wlCast',skill:'S019',x:20,z:8}),false);
 p.cooldowns.S019=0;g.command('p',{type:'wlCast',skill:'S019',x:-20,z:8});advance(g,WARLOCK_POLISH.link.flightDuration+.05);assert.equal(g.warlock.projectiles[0]?.returning,true);advance(g,1);assert.equal(g.warlock.projectiles.length,0);
});
test('Hooking a pillar pulls its caster, while close contact and dead endpoints break the tether',()=>{
 const {g,p,q}=setup(['S019']),rock=g.warlock.pillars[0];g.command('p',{type:'wlCast',skill:'S019',x:rock.x,z:rock.z});advance(g,.55);assert.equal(g.warlock.links[0]?.targetKind,'pillar');advance(g,.1);assert.ok(p.wlVx<0);assert.ok(p.wlVz<0);assert.equal(q.hp,100);rock.alive=false;advance(g,.025);assert.equal(g.warlock.links.length,0);bindWarlockLink(g,p,q);q.x=p.x+.5;q.z=p.z;advance(g,.025);assert.equal(g.warlock.links.length,0);
});
test('defensive C spells break incoming enemy links without deleting the caster own outgoing link',()=>{
 for(const spell of ['S005','S007','S048','S057']){const {g,p,q}=setup(['S019'],['S019',spell]);q.x=10;bindWarlockLink(g,p,q);bindWarlockLink(g,q,p);assert.equal(g.command('q',{type:'wlCast',skill:spell,x:0,z:0}),true,spell);assert.equal(g.warlock.links.some(l=>l.source===p.id),false,spell);assert.equal(g.warlock.links.some(l=>l.source===q.id),true,spell);}
});
test('Control keeps a travelling orb that forces victim casts to aim at it rather than converting pre-existing projectiles',()=>{
 const {g,p,q}=setup(['S050'],['S008']);q.x=5;g.command('q',{type:'wlCast',skill:'S000',x:5,z:20});const original=g.warlock.projectiles[0];g.command('p',{type:'wlCast',skill:'S050',x:10,z:0});const control=g.warlock.projectiles.find(v=>v.family==='control');near(control.speed,800/64);advance(g,.4);assert.equal(q.wlControl?.orb,control.id);near(control.speed,400/64);assert.equal(original.owner,'q');assert.equal(original.source,q.id);const aim={x:control.x,z:control.z};assert.equal(g.command('q',{type:'wlCast',skill:'S008',x:-15,z:15}),true);const meteor=g.warlock.fields.find(f=>f.family==='meteor');near(meteor.x,aim.x);near(meteor.z,aim.z);advance(g,3);assert.equal(q.wlControl,null);
});
test('Dome is independent from its moving caster and reflects incoming enemy projectiles radially at half speed and lets friendly shots pass',()=>{
 const {g,p}=setup(['S057']);g.command('p',{type:'wlCast',skill:'S057'});const dome=g.warlock.fields[0];near(dome.radius,180/64);near(dome.until-g.time,4);assert.equal(p.wlShieldUntil,0);g.command('p',{type:'wlMove',x:0,z:8});advance(g,.6);near(dome.x,0);near(dome.z,0);assert.ok(p.z>1);
 for(const team of [p.team,99]){const projectile={id:999,family:'fireball',source:20,owner:'q',team,x:0,z:0,dx:1,dz:0,speed:10,radius:.25,life:2,hitIds:[]};if(team===p.team){assert.equal(reflectWarlockDomeProjectile(g,projectile,{x:-5,z:0}),false);continue;}assert.equal(reflectWarlockDomeProjectile(g,projectile,{x:-5,z:0}),true);near(projectile.dx,-1);near(projectile.dz,0);near(projectile.speed,5);assert.equal(projectile.owner,p.owner);near(projectile.life,1.8);}
 const outward={family:'fireball',x:6,z:0,dx:1,dz:0,speed:10,radius:.25,life:2};assert.equal(reflectWarlockDomeProjectile(g,outward,{x:0,z:0}),false);
});
test('Dome protection is physical: a reflected fireball misses its intended victim and hits its original caster',()=>{
 const {g,p,q}=setup([],['S057']);Object.assign(p,{x:-8,z:0});Object.assign(q,{x:0,z:0});g.command('q',{type:'wlCast',skill:'S057'});g.command('p',{type:'wlCast',skill:'S000',x:10,z:0});advance(g,.9);assert.equal(q.hp,100);assert.ok(p.hp<100);
});
test('Vector leaves a six-second marker and redirects knockback toward it at preserved speed, with healing only for strong impulses',()=>{
 const {g,p,q}=setup(['S056']);g.command('p',{type:'wlCast',skill:'S056'});near(p.wlVector.until-g.time,6);near(p.wlVector.radius,225/64);Object.assign(p,{x:4,z:1,wlVx:0,wlVz:50,hp:50});bindWarlockLink(g,q,p);assert.equal(triggerWarlockVector(g,p),true);near(Math.hypot(p.wlVx,p.wlVz),50);assert.ok(p.wlVx<0&&p.wlVz<0);near(p.hp,50+.016*100*Math.sqrt(50*.03*64-16));assert.equal(p.wlVector,null);assert.equal(g.warlock.links.length,0);
 p.wlVector={x:0,z:0,radius:225/64,until:g.time+6};Object.assign(p,{x:4,z:0,wlVx:2,wlVz:1,hp:50});triggerWarlockVector(g,p);near(p.hp,50);
});
test('Time Shift preserves healing received after casting and restores only the native fraction of accumulated damage points',()=>{
 const {g,p}=setup(['S006']);Object.assign(p,{hp:50,damagePoints:20});g.command('p',{type:'wlCast',skill:'S006'});Object.assign(p,{hp:80,damagePoints:50,x:5,z:4});advance(g,3.525);near(p.hp,80);near(p.damagePoints,41);near(p.x,0);near(p.z,0);
});
test('the Link HUD can recall a hook despite the original spell cooldown without entering ground targeting again',()=>{
 const {g,p}=setup(['S019']);g.command('p',{type:'wlCast',skill:'S019',x:-20,z:8});const commands=[],ui=createLegacyUI({getState:()=>g.snapshot(),getOwner:()=> 'p',send:c=>(commands.push(c),g.command('p',c)),view:{setLegacyBuild(){},setInteraction(){}},toast(){}});assert.ok(p.cooldowns.S019>0);ui.shortcut('legacySkill','S019');assert.deepEqual(commands,[{type:'wlCast',skill:'S019'}]);assert.equal(g.warlock.projectiles[0].returning,true);assert.equal(ui.skillPreview(),null);
});
test('Warlock final ranking uses descending authoritative scores, shared positions for ties and escaped player names',()=>{
 const s={warlock:{round:11},units:[{owner:'a',name:'<Ada>',warlockCharacter:'warlock',score:3,seat:0},{owner:'b',name:'B',warlockCharacter:'heretic',score:5,seat:1},{owner:'c',name:'C',warlockCharacter:'occultist',score:5,seat:2},{owner:'d',name:'D',warlockCharacter:'inquisitor',score:1,seat:3}]};assert.deepEqual(warlockRanking(s).map(r=>[r.owner,r.rank,r.score,r.winner]),[['b',1,5,true],['c',1,5,true],['a',3,3,false],['d',4,1,false]]);const html=warlockResultsMarkup(s,'b');assert.match(html,/Vitória compartilhada/);assert.match(html,/&lt;Ada&gt;/);assert.match(html,/Pontuação de todos/);assert.equal((html.match(/<tr class=/g)||[]).length,4);assert.ok(html.indexOf('>B<')<html.indexOf('&lt;Ada&gt;'));assert.equal(warlockRanking(s).length,4);assert.equal(s.units[0].score,3);
});
test('runtime data pins verified projectile and trigger values without treating Link as a four-second debuff',()=>{
 near(wlSkillAt('S019',1).speed,950/64);near(wlSkillAt('S019',1).native.radius,35);near(wlSkillAt('S019',1).radius,WARLOCK_POLISH.link.radius);near(wlSkillAt('S050',1).duration,3.3);near(wlSkillAt('S056',1).radius,225/64);assert.equal(N.vector.duration,6);assert.equal(Object.hasOwn(N.link,'duration'),false);
});

test('Drain slows the enemy and delivers its base healing only when a separate noncolliding orb returns',()=>{
 const {g,p,q}=setup(['S014']);q.x=5;p.hp=50;g.command('p',{type:'wlCast',skill:'S014',x:12,z:0});advance(g,.35);assert.ok(q.hp<100);assert.equal(p.hp,50);assert.ok(q.wlDrainSpeed.delta<0);assert.equal(g.warlock.projectiles.some(p=>p.family==='drain_return'),true);advance(g,.5);near(p.hp,56);assert.equal(g.warlock.projectiles.some(p=>p.family==='drain_return'),false);
});
test('Drain supports allied healing and movement, and retargets once at its requested first destination',()=>{
 const first=setup(['S014']);first.q.team=first.p.team;first.q.x=4;first.q.hp=50;first.g.command('p',{type:'wlCast',skill:'S014',x:6,z:0});advance(first.g,.35);near(first.q.hp,56);assert.ok(first.q.wlDrainSpeed.delta>0);
 const {g,p,q}=setup(['S014']);q.x=12;q.z=6;g.command('p',{type:'wlCast',skill:'S014',x:3,z:0});advance(g,.325);const shot=g.warlock.projectiles.find(v=>v.family==='drain');assert.equal(shot.retargeted,true);assert.ok(shot.dz>0);near(shot.speed,600/64);
});
test('Gravity uses separate pull and damage radii, bends missiles and has no extra healing without Lifesteal mastery',()=>{
 const {g,p,q}=setup(['S018']);p.hp=50;q.x=5;q.z=2;g.command('p',{type:'wlCast',skill:'S018',x:20,z:0});const orb=g.warlock.projectiles.find(p=>p.family==='gravity');near(orb.speed,WARLOCK_POLISH.gravity.speed);near(orb.life,WARLOCK_POLISH.gravity.duration);const other={id:g.id(),key:'S000',family:'fireball',source:q.id,owner:q.owner,team:q.team,x:4,z:3,dx:1,dz:0,speed:5,radius:.2,life:2,age:0,damage:0,hitIds:[]};g.warlock.projectiles.push(other);advance(g,.2);assert.ok(q.wlVz<0);assert.ok(other.dz<0);assert.ok(q.hp<100);near(p.hp,50);assert.ok(g.warlock.projectiles.includes(orb));
});
