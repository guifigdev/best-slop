import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS} from '../shared/catalog.js';
import {RAGNAROK_TOWER_PACK_B as refs} from '../shared/ragnarok-tower-pack-b.js';
import {ragnarokTowerPackBSpec as spec,RAGNAROK_TOWER_PACK_B_KINDS as kinds} from '../src/ragnarok-tower-art-b.js';
import {RO_ENDLESS_FLOORS as floors,RO_ENDLESS_SOURCE_IDS as ids,RO_ENDLESS_MISSING as queued} from '../shared/ragnarok-endless-tower.js';
const boxes=m=>[...m.parts,...m.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...m.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))];
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};

test('Tower packB retains94 concrete source identities, immutable bounded sculptures and valid skills',()=>{
 assert.equal(refs.length,94);assert.equal(kinds.length,94);assert.equal(new Set(refs.map(m=>m.id)).size,94);const signatures=new Set();
 for(const r of refs){
  assert.equal(r.key,'tower_'+r.id);assert.ok(SKILLS[r.skill],r.key);assert.equal(r.sourceId,r.id);assert.ok(r.name!==r.sourceName);frozen(r);
  const m=spec(r.key),all=boxes(m);assert.equal(m,spec(r.key));frozen(m);assert.equal(m.key,r.key);assert.ok(all.length>=25&&all.length<=500,r.key+': '+all.length);assert.ok(m.height>.5&&m.height<5,r.key);assert.ok(m.eyeLine>0&&m.eyeLine<=m.height);
  for(const p of all){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite),r.key);assert.ok(p.slice(3,6).every(v=>v>0));assert.ok(Number.isInteger(p[6])&&p[6]>=0&&p[6]<=0xffffff);}
  for(const a of m.flames)assert.ok([a.x,a.y,a.z,a.size].every(Number.isFinite)&&a.size>0);
  signatures.add(JSON.stringify(all));
 }
 assert.equal(signatures.size,94,'source elemental variants have their own palettes');for(const k of ['__proto__','constructor','tower_1','ifrit',null,undefined])assert.equal(spec(k),null);
});

test('MVPs, marine undead, machines and original elemental variants have matching anatomy',()=>{
 assert.equal(spec('tower_1312').legs.length,4,'Turtle General has four turtle legs');
 assert.equal(spec('tower_1785').legs.length,2,'Atroce is an armed wolf humanoid');
 assert.equal(spec('tower_1874').wings.length,2,'true Beelzebub is winged');
 assert.equal(spec('tower_1064').motion,'float');assert.equal(spec('tower_1064').legs.length,0);
 for(const id of [1670,1671,1672,1673,1676,1677,1678,1679])assert.equal(spec('tower_'+id).legs.length,2,'mechanical walker '+id);
 for(const id of [1693,1694,1695,1696,1697])assert.equal(spec('tower_'+id).motion,'float');
 assert.ok(spec('tower_1379').flames.length>=8,'Nightmare Terror carries native fire anchors');
 assert.ok(spec('tower_1869').flames.length===2,'Flame Skull has native fire');
 assert.ok(spec('tower_1957').parts.filter(p=>p[6]===0x302836).length>=10,'Entweihen has stacked skull faces');
 assert.ok(spec('tower_1720').parts.filter(p=>p[6]===0x527d7f).length===6,'Hydrolancer has three pairs of eyes');
});

test('only verified source palette families declare variantOf; owl nobles retain different geometry',()=>{
 const shape=key=>JSON.stringify(boxes(spec(key)).map(p=>p.slice(0,6)));
 const shapes=new Map(),byKey=new Map(refs.map(r=>[r.key,r]));let variants=0;
 for(const r of refs){
  const signature=shape(r.key);
  if(r.variantOf){variants++;assert.ok(byKey.has(r.variantOf));assert.equal(byKey.get(r.variantOf).variantOf,undefined);assert.equal(signature,shape(r.variantOf),'variant shares complete anatomy: '+r.key);}
  else{assert.ok(!shapes.has(signature),'undeclared geometry duplicate: '+r.key);shapes.set(signature,r.key);}
 }
 assert.equal(variants,14);assert.equal(shapes.size,80);
 assert.equal(byKey.get('tower_1295').variantOf,undefined);assert.equal(byKey.get('tower_1320').variantOf,undefined);assert.notEqual(shape('tower_1295'),shape('tower_1320'));
});

test('Classic Tower preserves100floors, source encounters, floor99 random groups and floor100 thorn composition',()=>{
 assert.equal(floors.length,100);assert.deepEqual(floors.map(f=>f.floor),Array.from({length:100},(_,i)=>i+1));assert.equal(ids.length,327);assert.equal(queued.length,186);frozen(floors);
 for(const f of floors){for(const m of [...f.monsters,...(f.randomGroups?.pool||[]).flatMap(g=>g.monsters)]){assert.ok(ids.includes(m.sourceId));assert.ok(m.key&&Number.isInteger(m.count)&&m.count>0);}}
 assert.equal(floors[0].monsters.reduce((n,m)=>n+m.count,0),36);assert.ok(floors[4].monsters.some(m=>m.sourceId===1086&&m.count===1));
 const f99=floors[98];assert.equal(f99.monsters.length,0);assert.equal(f99.randomGroups.draws,7);assert.equal(f99.randomGroups.pool.length,30);assert.equal(f99.randomGroups.replacement,true);
 const f100=floors[99];assert.equal(f100.boss.sourceId,1957);assert.equal(f100.monsters.reduce((n,m)=>n+m.count,0),26);assert.equal(f100.randomGroups.draws,2);assert.equal(f100.randomGroups.pool.length,3);
 assert.equal(floors[94].boss.sourceId,1873);assert.equal(floors[94].boss.phaseSourceId,1874);assert.ok(ids.includes(1874));
});
