import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {ITEMS,skillAt} from '../shared/catalog.js';
const keys=['str','int','dex','luk','vit','agi'];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(mode='tower',skill='scarabs'){
 const g=new Game(174,{mode});g.addPlayer('p','fenrir');const p=g.player('p');g.phase='wave';g.wave=1;p.skills=[skill];p.skillLevels={[skill]:1};p.attributes=Object.fromEntries(keys.map(k=>[k,0]));p.inventory=[];g.refresh(p);p.mana=10000;assert.equal(g.cast(p,{slot:0}),true);return{g,p,s:g.units.find(s=>s.summoner===p.id)};
}
test('every Custom Hero summon family inherits its caster attributes while preserving the skill rank baseline',()=>{
 for(const mode of ['campaign','best','tower','war','linewars'])for(const skill of ['summon','scarabs','odinsravens','thorsgoats','freyjascat','helguard']){
  const {g,p,s}=setup(mode,skill),base={...s.monsterBase};p.attributes={str:20,int:20,dex:20,luk:30,vit:20,agi:20};g.refresh(p);g.refresh(s);
  assert.deepEqual(s.inheritedAttributes,p.totalAttributes);assert.equal(s.maxHp,Math.round((base.hp+400)*1.2));assert.equal(s.armor,base.armor+20);assert.equal(s.maxMana,base.mana+160);close(s.attackSpeed,1.3);close(s.critChance,base.critChance+.1);close(s.perfectEvasion,.03);assert.ok(s.damage>base.damage);assert.ok(s.magicPower>base.magicPower);assert.deepEqual(s.monsterBase,base);
 }
});
test('live changes use items and tomes, preserve missing health, and never compound or revive dead summons',()=>{
 const {g,p,s}=setup();const original=s.maxHp;s.hp-=40;p.tomeAttributes={vit:10,str:5};g.refresh(p);g.refresh(s);assert.ok(s.maxHp>original);assert.equal(s.maxHp-s.hp,40);const once={hp:s.hp,maxHp:s.maxHp,damage:s.damage,armor:s.armor};for(let i=0;i<40;i++)g.refresh(s);for(const k of Object.keys(once))close(s[k],once[k]);
 p.tomeAttributes={};const equipment=Object.entries(ITEMS).find(([,i])=>i.attributes?.vit>0&&!i.consumable);assert.ok(equipment);p.inventory=[{key:equipment[0],level:1}];g.refresh(p);g.refresh(s);assert.equal(s.inheritedAttributes.vit,p.totalAttributes.vit);assert.ok(s.maxHp>original);p.inventory=[];g.refresh(p);g.refresh(s);assert.equal(s.maxHp,original);assert.equal(s.maxHp-s.hp,40);s.hp=0;s.alive=false;p.attributes.vit=50;g.refresh(p);g.refresh(s);assert.equal(s.hp,0);
});
test('attribute scaling and nearby auras are independent and only the owning hero supplies the attributes',()=>{
 const {g,p,s}=setup();g.addPlayer('q','mage');p.attributes.str=20;p.skills.push('packaura');p.skillLevels.packaura=1;g.refresh(p);s.x=p.x;s.z=p.z;g.refresh(s);const boosted=s.damage;p.x+=20;g.refresh(s);close(boosted,s.damage*(1+skillAt('packaura',1).damageBonus));assert.equal(s.inheritedAttributes.str,20);
 const enemy=g.spawnEnemy('wolf',0,0,{hp:100,damage:10,skills:[],summon:true,summoner:999,owner:'other',team:2});assert.equal(enemy.inheritedAttributes,undefined);assert.equal(enemy.maxHp,enemy.monsterBase.hp);
 const native={...s};const old=g.options;g.options={mode:'castlefight'};g.refresh(native);assert.equal(native.maxHp,native.monsterBase.hp);g.options=old;
});
