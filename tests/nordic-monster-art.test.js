import test from 'node:test';
import assert from 'node:assert/strict';
import {NORDIC_MONSTER_KINDS,nordicMonsterSpec,nordicMonsterPortrait} from '../src/nordic-monster-art.js';
import {buildMonster} from '../src/monster-art.js';
import {armyPortrait,ARMY_PORTRAIT_KINDS} from '../src/army-art.js';
import {MONSTER_PROFILES} from '../shared/monsters.js';
import {LINE_UNITS} from '../shared/line-units.js';

test('six repaginated monsters have separate finite vertex-colour voxel silhouettes and a bounded geometry budget',()=>{
 const silhouettes=new Set();
 for(const kind of NORDIC_MONSTER_KINDS){
  const spec=nordicMonsterSpec(kind),parts=[];assert.equal(buildMonster(kind,{},(_body,...part)=>parts.push(part)),spec);assert.deepEqual(parts,spec.parts);
  assert.ok(Object.isFrozen(spec)&&Object.isFrozen(spec.parts));assert.ok(spec.parts.length<=80);
  assert.ok(spec.height>2.4&&spec.eyeLine>1.8);assert.equal(spec.legs.length,kind==='helhound'?4:2);assert.equal(spec.wings.length,kind==='bat'?2:0);
  const boxes=[...parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...spec.wings.flatMap(w=>w.parts)];
  for(const b of boxes){assert.equal(b.length,7);assert.ok(b.every(Number.isFinite));assert.ok(b.slice(3,6).every(n=>n>0));assert.ok(b[6]>=0&&b[6]<=0xffffff);}
  silhouettes.add(JSON.stringify(parts));assert.equal(nordicMonsterSpec(kind),spec);
 }
 assert.equal(silhouettes.size,6);assert.ok(nordicMonsterSpec('champion').height>nordicMonsterSpec('goblin').height);
 for(const kind of ['knight','mage','ranger','turtle','owl','raccoon','duck','frog','hare','wolf','__proto__','missing'])assert.equal(nordicMonsterSpec(kind),null);
});

test('matching troop portraits project the very same voxel parts and stay safe for cached HUD use',()=>{
 const portraits=new Set();
 for(const kind of NORDIC_MONSTER_KINDS){
  const svg=nordicMonsterPortrait(kind);assert.equal(armyPortrait(kind),svg);assert.ok(ARMY_PORTRAIT_KINDS.includes(kind));assert.match(svg,/class="army-portrait nordic-monster-portrait"/);assert.match(svg,/<polygon /);assert.doesNotMatch(svg,/undefined|NaN|Infinity|<script|<image|href=/);assert.equal(nordicMonsterPortrait(kind),svg);portraits.add(svg);
  for(const tag of svg.matchAll(/points="([^"]+)"/g))for(const pair of tag[1].split(' ')){const[x,y]=pair.split(',').map(Number);assert.ok(x>=0&&x<=96&&y>=0&&y<=80);}
 }
 assert.equal(portraits.size,6);assert.equal(nordicMonsterPortrait('duck'),null);
});

test('northern and Line Wars labels match the new monster identities instead of the replaced cute animals',()=>{
 assert.match(MONSTER_PROFILES.goblin.name,/Draugr/);assert.match(MONSTER_PROFILES.brute.name,/Jotun/);assert.match(MONSTER_PROFILES.ram.name,/Sátiro/);assert.match(MONSTER_PROFILES.bat.name,/Gárgula/);assert.match(MONSTER_PROFILES.champion.name,/Jotun/);
 assert.match(LINE_UNITS.shieldling.name,/Draugr/);assert.equal(LINE_UNITS.boarguard.name,'Golem de Basalto');assert.equal(LINE_UNITS.frostcharger.name,'Escorpião de Cobre');
});
