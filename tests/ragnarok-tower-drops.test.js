import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_TOWER_CARDS,RO_TOWER_MVP_GEAR,RO_TOWER_DROP_MAP,RO_TOWER_DROP_SOURCE} from '../shared/ragnarok-tower-drops.js';
import {RO_CARDS,RO_EQUIPMENT} from '../shared/ragnarok-equipment.js';
import {RO_ENDLESS_SOURCE_IDS} from '../shared/ragnarok-endless-tower.js';
const cards={...RO_CARDS,...RO_TOWER_CARDS},gear={...RO_EQUIPMENT,...RO_TOWER_MVP_GEAR};
test('Every original tower monster has audited metadata, including explicitly cardless summons',()=>{
 const sourceIds=new Set(Object.values(RO_TOWER_DROP_MAP).map(m=>m.sourceId));for(const id of RO_ENDLESS_SOURCE_IDS)assert.ok(sourceIds.has(id),String(id));
 assert.equal(RO_TOWER_DROP_MAP.poring.cardKey,'poring');assert.equal(RO_TOWER_DROP_MAP.tower_1958.cardKey,null);assert.equal(RO_TOWER_DROP_MAP.tower_1873.cardKey,null);assert.ok(RO_TOWER_DROP_MAP.tower_1874.cardKey,'Only the true Beelzebub form has its native card');
 for(const source of Object.values(RO_TOWER_DROP_SOURCE)){assert.match(source.url,/raw\.githubusercontent\.com\/rathena\/rathena/);assert.match(source.sha256,/^[a-f0-9]{64}$/);assert.ok(source.bytes>10000);}
});
test('Cards retain actual source identity and slots with immutable bounded local bonuses',()=>{
 assert.equal(Object.keys(RO_TOWER_CARDS).length,276);const slots=new Set();
 for(const card of Object.values(RO_TOWER_CARDS)){slots.add(card.slot);assert.equal(card.source,`https://www.divine-pride.net/database/item/${card.sourceId}`);assert.ok(card.monsters.length);assert.ok(Object.isFrozen(card.stats));for(const [stat,value]of Object.entries(card.stats)){assert.ok(Number.isFinite(value));assert.ok(Math.abs(value)<=(stat==='maxHp'?100:stat==='crit'||stat==='haste'? .1:12));}for(const key of card.monsters)assert.equal(RO_TOWER_DROP_MAP[key].cardKey,card.key);}
 assert.deepEqual([...slots].sort(),['accessory','armor','garment','head','offhand','shoes','weapon']);assert.equal(cards[RO_TOWER_DROP_MAP.whisper.cardKey].sourceId,4102);assert.equal(cards[RO_TOWER_DROP_MAP.tower_1957.cardKey].sourceId,4451);
});
test('MVP loot contains real equipment only and keeps source associations instead of random materials',()=>{
 assert.equal(Object.keys(RO_TOWER_MVP_GEAR).length,102);assert.ok(RO_TOWER_DROP_MAP.ifrit.equipmentKeys.some(key=>gear[key].sourceId===2678),'Ifrit drops Ring of Flame Lord');
 assert.ok(RO_TOWER_DROP_MAP.tower_1874.equipmentKeys.some(key=>gear[key].sourceId===2423),'Beelzebub drops Variant Shoes');
 for(const item of Object.values(RO_TOWER_MVP_GEAR)){assert.ok(['Armor','Weapon'].includes(item.sourceType));assert.ok(item.sockets>=0&&item.sockets<=4);assert.equal(item.source,`https://www.divine-pride.net/database/item/${item.sourceId}`);if(item.slot==='weapon'){assert.ok(item.weaponType);assert.ok(item.hands===1||item.hands===2);}assert.ok((item.stats.attack||0)<=35);assert.ok((item.stats.matk||0)<=35);assert.ok((item.stats.maxHp||0)<=100);assert.ok(Object.isFrozen(item));}
 for(const entry of Object.values(RO_TOWER_DROP_MAP)){if(entry.cardKey)assert.ok(cards[entry.cardKey]);if(entry.equipmentKeys.length)assert.ok(entry.boss);for(const key of entry.equipmentKeys)assert.ok(gear[key]);for(const drop of entry.sourceDrops){assert.ok(drop.sourceRate>=0&&drop.sourceRate<=1);const definition=drop.kind==='card'?cards[drop.key]:gear[drop.key];assert.equal(definition.sourceId,drop.sourceItemId);}}
});
