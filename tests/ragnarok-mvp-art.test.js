import test from 'node:test';
import assert from 'node:assert/strict';
import {ragnarokMvpSpec as spec,RAGNAROK_MVP_KINDS as kinds} from '../src/ragnarok-mvp-art.js';
import {RAGNAROK_MVPS as catalog} from '../shared/ragnarok-mvp-catalog.js';
import {SKILLS} from '../shared/catalog.js';
const all=s=>[...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...s.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))];
test('sixteen authored MVP sculptures are cached, immutable, finite and anatomically distinct',()=>{
 assert.equal(kinds.length,16);const geometry=new Set();
 for(const key of kinds){const s=spec(key),p=all(s);assert.equal(spec(key),s);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts[0]));assert.ok(p.length>=120&&p.length<600,key+': '+p.length);assert.ok(p.every(p=>p.length===7&&p.every(Number.isFinite)&&p.slice(3,6).every(v=>v>0)));assert.ok(s.eyeLine>0&&s.eyeLine<s.height);assert.ok(s.height<4&&s.height>1.5);assert.ok(p.every(p=>p[1]+p[4]/2<s.height+.001));geometry.add(JSON.stringify(p.map(p=>p.slice(0,6))));}
 assert.equal(geometry.size,16);for(const k of ['missing','__proto__','constructor'])assert.equal(spec(k),null);
});
test('requested MVPs retain their defining sprite anatomy rather than merely enlarged common bodies',()=>{
 const fire=spec('ifrit'),valk=spec('valkyrierandgris'),morroc=spec('satanmorroc'),free=spec('phreeoni');
 assert.equal(fire.motion,'float');assert.equal(fire.legs.length,0);assert.ok(fire.flames.length>=4);assert.ok(fire.parts.filter(p=>p[1]>2.9).length>12,'jagged flame crown and horns');
 assert.equal(valk.wings.length,2);assert.ok(valk.wings.every(w=>w.parts.length>=30));assert.ok(valk.parts.some(p=>p[6]===0xb9767e),'pink cloak');assert.ok(all(valk).some(p=>Math.abs(p[0])>1.8),'large dark feather wings');
 assert.equal(morroc.legs.length,2);assert.ok(morroc.parts.some(p=>p[1]>3.3),'horned gargoyle crown');assert.ok(morroc.parts.filter(p=>Math.abs(p[0])>.9).length>30,'massive sculpted arms');assert.ok(morroc.parts.some(p=>p[6]===0xad9574),'ornate belt clasp');
 assert.ok(free.parts.filter(p=>p[6]===0xffe9bc).length>=11,'huge grin with distinct teeth');assert.ok(free.parts.some(p=>p[6]===0xe58fa4),'hanging tongue');assert.ok(free.parts.filter(p=>p[6]===0xa9ba68).length>30,'green crown feelers');
});
test('the remaining bosses carry their characteristic equipment, throne, insect legs or icy wolf anatomy',()=>{
 assert.ok(spec('baphomet').parts.filter(p=>p[1]>3.1).length>15,'crescent scythe');assert.ok(spec('osiris').parts.filter(p=>p[4]<.08&&p[3]>.4).length>=10,'overlapping bandages');
 assert.ok(spec('drake').parts.some(p=>p[3]>=.8&&p[1]>2.4),'pirate hat');assert.ok(spec('doppelganger').parts.filter(p=>p[1]>2.4).length>10,'spiked hair and long blade');
 assert.ok(spec('amonra').parts.some(p=>p[3]>1.6&&p[1]<.3),'carved throne base');assert.ok(spec('eddga').parts.some(p=>p[6]===0x9d9b96),'smoking pipe');assert.equal(spec('gtb').legs.length,6);assert.equal(spec('maya').legs.length,6);assert.equal(spec('mistress').wings.length,2);
 assert.ok(spec('stormyknight').parts.some(p=>p[6]===0xd89865),'copper shield');assert.equal(spec('hatii').legs.length,4);assert.ok(spec('hatii').parts.some(p=>p[2]<-1.7),'wolf tail');assert.ok(spec('fallenbishop').parts.filter(p=>p[6]===0x817799).length>=18,'rear spectral bishop halo');
});
test('MVP catalog separates source identity from adapted names and supplies four readable thematic warnings',()=>{
 assert.equal(catalog.length,16);assert.ok(Object.isFrozen(catalog));assert.equal(new Set(catalog.map(v=>v.id)).size,16);
 for(const r of catalog){assert.ok(SKILLS[r.skill],r.skill);assert.notEqual(r.name.toLowerCase(),r.sourceName.toLowerCase());assert.ok(r.unlockWave>=10&&r.unlockWave<=45);assert.ok(r.biomes.length>0);assert.equal(r.patterns.length,4);assert.ok(Object.isFrozen(r.patterns[0]));for(const p of r.patterns){assert.ok(['circle','ring','cone','line'].includes(p.shape));assert.ok(p.delay>=1.8&&p.delay<=3);assert.ok(['fire','ice','physical','poison','dark','lightning'].includes(p.element));}}
 assert.ok(catalog.find(v=>v.key==='ifrit').patterns.every(p=>p.element==='fire'));assert.ok(catalog.find(v=>v.key==='phreeoni').patterns.every(p=>p.element==='physical'));assert.ok(catalog.find(v=>v.key==='satanmorroc').patterns.every(p=>p.element==='dark'));
});
