import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {HEROES,SKILLS,skillAt} from '../shared/catalog.js';
import {canUseSkill} from '../shared/archetypes.js';
import {physicalSkillDamage} from '../shared/ability-rules.js';
import {armyPortrait,ARMY_PORTRAIT_KINDS} from '../src/army-art.js';
import {scarabPortrait} from '../src/scarab-art.js';
import {icon} from '../src/art.js';

const keys=['fenrirfang','scarabs','packaura','lifeaura','runicbarrier','spiritward','weakeninghowl'];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup(skills=keys,rank=1,mode='tower'){
 const g=new Game(731,{mode});g.addPlayer('p','fenrir');g.addPlayer('q','mage');g.phase='wave';g.wave=1;
 const p=g.player('p'),q=g.player('q');for(const [i,u]of [p,q].entries()){u.x=i*2;u.z=0;u.order='hold';u.cd=9999;u.team=1;u.challenge=undefined;}
 p.skills=[...skills];p.skillLevels=Object.fromEntries(skills.map(key=>[key,rank]));q.skills=[];q.skillLevels={};g.refresh(p);g.refresh(q);p.mana=10000;
 const e=g.spawnEnemy('wolf',0,1.5,{hp:10000,damage:100,armor:0,speed:0,skills:[],team:2,accuracy:1,evasion:0,critChance:0,variantRoll:.99});e.order='stop';e.cd=9999;e.magicDefense=0;return{g,p,q,e};
}
const cast=(g,p,key,target)=>g.cast(p,{slot:p.skills.indexOf(key),target:target?.id});

test('seven Nordic skills have five finite ranks, distinct art and real acquisition for every hero',()=>{
 assert.equal(HEROES.fenrir.archetype,'physical_melee');const images=new Set();
 for(const key of keys){assert.equal(SKILLS[key].levels.length,5);images.add(icon(key));for(const rank of SKILLS[key].levels)for(const n of Object.values(rank))if(typeof n==='number')assert.ok(Number.isFinite(n)&&n>=0);}
 assert.equal(images.size,keys.length);
 for(const type of Object.keys(HEROES)){
  const g=new Game(4);g.addPlayer('p',type);const p=g.player('p');p.skills=[];p.skillLevels={};p.skillPoints=35;p.level=50;
  for(const key of keys){assert.equal(canUseSkill(p,key),true);for(let rank=1;rank<=5;rank++){assert.equal(g.command('p',{type:'buy',skill:key}),true,`${type} ${key} rank ${rank}`);assert.equal(p.skillLevels[key],rank);}}
  assert.equal(p.skillPoints,0);assert.equal(p.skills.length,7);assert.equal(g.command('p',{type:'buy',skill:'fenrirfang'}),false);
 }
});

test('Fenrir bite is physical, scales with ATK, respects melee reach and magic immunity blocks only its slow',()=>{
 const{g,p,e}=setup(['fenrirfang'],5);e.armor=10;e.magicDefense=100;p.damage=100;const mana=p.mana,hp=e.hp;e.z=3;
 assert.equal(cast(g,p,'fenrirfang',e),false);assert.equal(p.mana,mana);assert.equal(p.cooldowns.fenrirfang,undefined);e.z=2.5;
 assert.equal(cast(g,p,'fenrirfang',e),true);close(hp-e.hp,physicalSkillDamage(p,60,1.15)/1.6);assert.equal(e.frostUntil,2);assert.equal(p.castSkill,'fenrirfang');
 p.cooldowns.fenrirfang=0;e.frostUntil=0;e.avatar=10;assert.equal(cast(g,p,'fenrirfang',e),true);assert.equal(e.frostUntil,0);assert.equal(p.mana,mana-100);
});

test('scarabs use their own model identity, scale per rank, expire and replace only their summoning group',()=>{
 const{g,p}=setup(['scarabs','odinsravens'],5);assert.equal(cast(g,p,'odinsravens'),true);assert.equal(cast(g,p,'scarabs'),true);
 let summoned=g.units.filter(u=>u.summoner===p.id&&u.summonSkill==='scarabs');assert.equal(summoned.length,4);
 for(const s of summoned){assert.equal(s.kind,'scarab');assert.equal(s.size,.65);assert.equal(s.team,p.team);assert.equal(s.owner,p.owner);assert.equal(s.maxHp,400);assert.equal(s.monsterBase.damage,35);assert.equal(s.expires,30);assert.equal(s.flying,false);assert.deepEqual(s.skills,[]);}
 const old=new Set(summoned.map(u=>u.id)),ravens=g.units.filter(u=>u.summonSkill==='odinsravens').map(u=>u.id);p.cooldowns.scarabs=0;assert.equal(cast(g,p,'scarabs'),true);
 summoned=g.units.filter(u=>u.summoner===p.id&&u.summonSkill==='scarabs');assert.equal(summoned.length,4);assert.ok(summoned.every(u=>!old.has(u.id)));assert.deepEqual(g.units.filter(u=>u.summonSkill==='odinsravens').map(u=>u.id),ravens);
 g.time=30.1;g.tick(.01);assert.ok(summoned.every(u=>!u.alive));assert.equal(armyPortrait('scarab'),scarabPortrait());assert.ok(ARMY_PORTRAIT_KINDS.includes('scarab'));
});

test('pack and life auras affect allies and summons using the strongest copy exactly once, then revert outside range',()=>{
 const{g,p,q}=setup(['packaura','lifeaura','scarabs'],5);q.skills=['packaura','lifeaura'];q.skillLevels={packaura:1,lifeaura:1};assert.equal(cast(g,p,'scarabs'),true);
 const s=g.units.find(u=>u.summonSkill==='scarabs');g.refresh(s);const base=s.monsterBase;close(s.damage,base.damage*1.18);close(s.hpRegen,3.5);close(s.magicDefense,base.magicDefense+6);
 const original={damage:s.damage,hpRegen:s.hpRegen,magicDefense:s.magicDefense};for(let i=0;i<20;i++)g.refresh(s);for(const k of Object.keys(original))close(s[k],original[k]);
 g.refresh(q);const high=q.damage;q.skills=[];q.skillLevels={};g.refresh(q);close(q.damage,high);
 p.x=20;g.refresh(s);close(s.damage,base.damage);close(s.hpRegen,base.hpRegen);close(s.magicDefense,base.magicDefense);
 q.x=40;g.refresh(q);const outside=q.damage;q.x=p.x;g.refresh(q);close(q.damage,outside*1.18);
 p.challenge='other-arena';g.refresh(q);close(q.damage,outside);
});

test('runic barrier protects nearby allies with a finite physical pool and hit count without touching magical/environment damage',()=>{
 const{g,p,q,e}=setup(['runicbarrier'],1);const far=g.spawnEnemy('scarab',8,0,{summon:true,team:1,hp:100,damage:1,skills:[]});p.armor=q.armor=0;p.magicDefense=q.magicDefense=0;
 assert.equal(cast(g,p,'runicbarrier'),true);assert.ok(p.shield>0&&q.shield>0);assert.equal(far.shield,undefined);assert.equal(p.shieldHits,3);
 const pool=p.shield,hp=p.hp;close(g.hit(p,40,e,true),40);close(g.hit(p,40,e,false,false,false,true),40);assert.equal(p.shield,pool);assert.equal(p.shieldHits,3);close(p.hp,hp-80);
 for(let i=0;i<3;i++)close(g.hit(p,1,e),0);assert.equal(p.shieldHits,0);assert.equal(p.shield,0);close(g.hit(p,20,e),20);
 q.shield=5;close(g.hit(q,20,e),15);assert.equal(q.shield,0);assert.equal(q.shieldHits,2);
});

test('barrier refuses redundant casts without mana/cooldown and does not replace a stronger nearby protection',()=>{
 const{g,p,q}=setup(['runicbarrier']);assert.equal(cast(g,p,'runicbarrier'),true);p.cooldowns.runicbarrier=0;const mana=p.mana;assert.equal(cast(g,p,'runicbarrier'),false);assert.equal(p.mana,mana);assert.equal(p.cooldowns.runicbarrier,0);
 q.shield=9999;q.shieldHits=99;q.shieldUntil=100;p.shield=0;assert.equal(cast(g,p,'runicbarrier'),true);assert.equal(q.shield,9999);assert.equal(q.shieldHits,99);assert.equal(q.shieldUntil,100);
});

test('spirit ward blocks only magical combat damage and expires while ordinary physical and environmental damage remain',()=>{
 const{g,p,e}=setup(['spiritward'],5);p.armor=p.magicDefense=0;assert.equal(cast(g,p,'spiritward'),true);assert.equal(p.magicWardUntil,3.5);
 close(g.hit(p,100,e,true),0);close(g.hit(p,100,e),100);close(g.hit(p,100,e,true,false,false,true),100);
 p.cooldowns.spiritward=0;const mana=p.mana;assert.equal(cast(g,p,'spiritward'),false);assert.equal(p.mana,mana);p.avatar=100;g.time=4;assert.equal(cast(g,p,'spiritward'),false);p.avatar=0;close(g.hit(p,50,e,true),50);
});

test('spirit ward prevents bolt damage while allowing its stun and barrier protection expires at its stated duration',()=>{
 const{g,p,e}=setup(['spiritward','runicbarrier']);assert.equal(cast(g,p,'spiritward'),true);const hp=p.hp;e.skills=['bolt'];e.skillLevels={bolt:1};e.mana=1000;
 assert.equal(g.cast(e,{slot:0,target:p.id}),true);assert.equal(p.hp,hp);assert.ok(p.stun>0,'damage immunity does not grant control immunity');p.stun=0;assert.equal(cast(g,p,'runicbarrier'),true);
 p.armor=0;g.time=12;close(g.hit(p,15,e),15);assert.equal(p.shieldHits,3,'expired protection consumes no charges');
});

test('weakening howl skips empty area, reduces outgoing combat only and does not stack with copies',()=>{
 const{g,p,q,e}=setup(['weakeninghowl'],5);e.z=6;const mana=p.mana;assert.equal(cast(g,p,'weakeninghowl'),false);assert.equal(p.mana,mana);assert.equal(p.cooldowns.weakeninghowl,undefined);
 e.z=4;p.armor=p.magicDefense=0;assert.equal(cast(g,p,'weakeninghowl'),true);assert.equal(e.damageReduction,.24);close(g.hit(p,100,e),76);close(g.hit(p,100,e,true),76);close(g.hit(p,100,e,true,false,false,true),100);
 q.skills=['weakeninghowl'];q.skillLevels={weakeninghowl:1};q.mana=1000;assert.equal(cast(g,q,'weakeninghowl'),true);assert.equal(e.damageReduction,.24);close(g.hit(p,100,e),76);g.time=6.1;close(g.hit(p,100,e),100);
});

test('autocast uses real resources, range and existing summons/wards, with common cast animation metadata',()=>{
 for(const key of ['fenrirfang','scarabs','runicbarrier','spiritward','weakeninghowl']){
  const{g,p}=setup([key]);const mana=p.mana;assert.equal(g.toggleAutocast(p,{slot:0}),true);assert.equal(g.tickAutocast(p),true,key);assert.equal(p.mana,mana-skillAt(key).mana);assert.equal(p.castSkill,key);assert.equal(p.castAt,g.time);assert.ok(g.effects.some(e=>e.type==='cast'&&e.skill===key));
  p.cooldowns[key]=0;p.nextAutoCastAt=0;if(['scarabs','runicbarrier','spiritward'].includes(key)){assert.equal(g.tickAutocast(p),false,key);assert.equal(p.mana,mana-skillAt(key).mana);}
 }
 const{g,p,e}=setup(['fenrirfang']);g.toggleAutocast(p,{slot:0});e.z=4;const mana=p.mana;assert.equal(g.tickAutocast(p),false);assert.equal(p.mana,mana);
});

test('new protections and debuffs are cleared on round restore and hero skills stay disabled for Castle builders',()=>{
 const{g,p,e}=setup(['runicbarrier','spiritward','weakeninghowl']);for(const key of p.skills)assert.equal(cast(g,p,key),true);p.weakenedUntil=20;p.damageReduction=.24;g.restoreHeroes();assert.equal(p.magicWardUntil,0);assert.equal(p.shield,0);assert.equal(p.shieldHits,null);assert.equal(p.shieldPhysicalOnly,false);assert.equal(p.weakenedUntil,0);assert.equal(p.damageReduction,0);
 const castle=new Game(7,{mode:'castlefight'});castle.addPlayer('p','knight');for(const key of keys)assert.equal(castle.command('p',{type:'buy',skill:key}),false);
});

test('Line Wars uses the same summons, protections and howl without affecting another defender’s arena',()=>{
 const g=new Game(31,{mode:'linewars'});g.addPlayer('p','fenrir');g.addPlayer('q','mage');g.initLineWars();const p=g.player('p'),q=g.player('q');p.skills=['scarabs','runicbarrier','weakeninghowl','packaura'];p.skillLevels={scarabs:5,runicbarrier:5,weakeninghowl:5,packaura:5};p.mana=10000;
 const own=g.spawnEnemy('scarab',p.x+1,p.z,{lineLane:p.lineLane,cell:p.cell,hp:10000,damage:10,skills:[],speed:0,team:99});const other=g.spawnEnemy('scarab',q.x+1,q.z,{lineLane:q.lineLane,cell:q.cell,hp:10000,damage:10,skills:[],speed:0,team:99});
 assert.equal(cast(g,p,'scarabs'),true);const summons=g.units.filter(u=>u.summonSkill==='scarabs');assert.equal(summons.length,4);assert.ok(summons.every(u=>u.lineLane===p.lineLane&&u.cell===p.cell));
 assert.equal(cast(g,p,'runicbarrier'),true);assert.ok(summons.every(u=>u.shield>0&&u.shieldHits===7));assert.equal(q.shield,undefined);
 assert.equal(cast(g,p,'weakeninghowl'),true);assert.equal(own.damageReduction,.24);assert.equal(other.damageReduction,undefined);for(const u of summons)close(u.damage,u.monsterBase.damage*1.18);
});
