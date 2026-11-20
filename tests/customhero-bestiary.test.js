import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {SKILLS} from '../shared/catalog.js';
import {CUSTOM_HERO_BESTIARY as C,CUSTOM_HERO_COMMON_VISUALS as COMMON,CUSTOM_HERO_SKILL_THEMES as THEMES} from '../shared/customhero-bestiary.js';
import {MONSTERS,MONSTER_PROFILES,monsterKind,monsterLoadout} from '../shared/monsters.js';
import {monsterReferenceName} from '../shared/monster-visual-references.js';

test('all twenty-one voxel creatures are genuine gradually unlocked challengers with local, bounded combat roles',()=>{
 assert.equal(Object.keys(C).length,21);const seen=new Set();
 for(const [key,s]of Object.entries(C)){
  assert.equal(MONSTERS[key],s);assert.ok(Object.isFrozen(s));assert.ok(s.unlockWave>=2&&s.unlockWave<=25);assert.equal(s.ragnarokVisual,key.slice(3));
  assert.ok(s.hpMultiplier>=.8&&s.hpMultiplier<=1.45);assert.ok(s.damageMultiplier>=.65&&s.damageMultiplier<=1);assert.ok(s.moveSpeed>=2&&s.moveSpeed<=4.1);assert.ok(SKILLS[s.skill]);assert.ok(THEMES[key].includes(s.skill));
  for(const n of [1,15,35,60])for(const roll of [0,.2,.55,.99]){const loadout=monsterLoadout(key,n,'boss',()=>roll);assert.equal(loadout.skills[0],s.skill);assert.ok(loadout.skills.every(skill=>THEMES[key].includes(skill)&&SKILLS[skill]));}
 }
 for(let i=0;i<1000;i++){const kind=monsterKind('frog',30,i/1000);if(C[kind])seen.add(kind);}
 assert.deepEqual(seen,new Set(Object.keys(C)),'the actual selection pool exposes every new species');
 assert.equal(monsterKind('frog',1,.1),'frog');assert.equal(monsterKind('frog',30,.9),'frog','the existing fauna remains in the pool');
});
test('common first-wave skins do not change their original health, attack, movement, skill or collision budget',()=>{
 const g=new Game(7);g.wave=1;g.phase='wave';
 for(const [kind,visual]of Object.entries(COMMON)){
  const u=g.spawnEnemy(kind,0,0,{hp:123,damage:12,armor:2,collisionRadius:.37,variantRoll:.99,skills:[]}),p=MONSTER_PROFILES[kind];
  assert.equal(u.kind,kind);assert.equal(u.ragnarokVisual,visual);assert.equal(u.name,monsterReferenceName(visual,p.name));assert.equal(u.maxHp,123);assert.equal(u.damage,12*p.attackMultiplier);assert.equal(u.speed,p.moveSpeed);assert.equal(u.interval,p.attackInterval);assert.equal(u.armor,2);assert.equal(u.collisionRadius,.37);assert.deepEqual(u.skills,[]);
 }
});
test('real campaign, tower, individual and team waves use the new art while retaining counts and the wave stat formula',()=>{
 for(const mode of ['campaign','tower','best','war']){
  const g=new Game(72,{mode,teamSize:1,teamCount:2});g.addPlayer('a','knight');g.addPlayer('b','mage');const gold=g.heroes().map(u=>u.gold),seen=new Set();
  for(const wave of [1,2,6,11,21,31]){
   g.wave=wave-1;g.spawnWave();const enemies=g.units.filter(u=>!u.hero&&!u.summon);assert.equal(enemies.length,Math.min(18,3+Math.floor(wave/4))*2,mode+': '+wave);
   for(const u of enemies){const s=MONSTERS[u.kind];assert.equal(u.monsterBase.hp,(65+wave*16)*(s?.hpMultiplier||1));if(u.ragnarokVisual){seen.add(u.ragnarokVisual);assert.equal(u.name,monsterReferenceName(u.ragnarokVisual,u.name));}if(s)assert.ok(s.unlockWave<=wave);}
  }
  assert.ok(seen.size>=10,mode+' genuinely spawns diverse models');assert.deepEqual(g.heroes().map(u=>u.gold),gold,'spawning does not award or consume currency');
 }
});
test('explicit summons and race creeps retain their scenario names, selected skills and visual metadata',()=>{
 const g=new Game(8);g.wave=1;
 const data={hp:123,damage:9,speed:5,interval:.7,size:.6,skills:[],name:'Scenario-owned unit',variantRoll:.99};
 for(const flag of ['summon','lineCreep','castleUnit','dungeonEnemy','bonkEnemy']){const u=g.spawnEnemy('frog',0,0,{...data,[flag]:true});assert.equal(u.ragnarokVisual,undefined,flag);assert.equal(u.name,data.name,flag);assert.equal(u.maxHp,data.hp);assert.equal(u.size,data.size);assert.deepEqual(u.skills,[]);}
 const explicit=g.spawnEnemy('frog',0,0,{...data,lineCreep:true,ragnarokVisual:'marin'});assert.equal(explicit.ragnarokVisual,'marin');assert.equal(explicit.name,data.name);
});
