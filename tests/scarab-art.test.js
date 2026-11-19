import test from 'node:test';
import assert from 'node:assert/strict';
import {SCARAB_ART,scarabSpec,buildScarabModel,scarabPortrait} from '../src/scarab-art.js';
import {buildMonster} from '../src/monster-art.js';

test('runic scarab has six separated legs and a compact non-animal voxel body',()=>{
 const s=scarabSpec(),parts=[];assert.equal(buildMonster('scarab',{},(_body,...p)=>parts.push(p)),s);assert.deepEqual(parts,s.parts);
 assert.equal(s.legs.length,6);assert.equal(new Set(s.legs.map(p=>`${p.x},${p.z}`)).size,6);assert.equal(s.wings.length,0);
 assert.equal(s.motion,'insect');assert.ok(s.height<1.3);assert.ok(parts.length<64);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts)&&Object.isFrozen(s.legs));
 const boxes=[...parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])];
 for(const box of boxes){assert.equal(box.length,7);assert.ok(box.every(Number.isFinite));assert.ok(box.slice(3,6).every(n=>n>0));assert.ok(box[6]>=0&&box[6]<=0xffffff);assert.ok(box[1]-box[4]/2>=0);assert.ok(box[1]+box[4]/2<=s.height);}
 assert.ok(parts.some(p=>p[2]>1.2),'mandibles project forward');assert.ok(parts.some(p=>p[1]>1.17&&p[6]===0xa5e8e4),'rune visible on shell');
 assert.equal(scarabSpec({kind:'scarab'}),s);assert.equal(scarabSpec(),s);assert.match(SCARAB_ART.description,/Seis patas/);
});

test('scarab portrait uses its exact model boxes and is cached and safe',()=>{
 const svg=scarabPortrait();assert.match(svg,/class="army-portrait scarab-portrait"/);assert.match(svg,/<polygon /);assert.doesNotMatch(svg,/undefined|NaN|Infinity|<script|<image|href=/);
 assert.equal(scarabPortrait('scarab'),svg);assert.equal(scarabPortrait({kind:'scarab'}),svg);assert.equal((svg.match(/<polygon /g)||[]).length,(scarabSpec().parts.length+6)*3);
 for(const tag of svg.matchAll(/points="([^"]+)"/g))for(const pair of tag[1].split(' ')){const[x,y]=pair.split(',').map(Number);assert.ok(x>=0&&x<=96&&y>=0&&y<=80);}
 for(const value of ['wolf','__proto__',null,{}]){assert.equal(scarabSpec(value),null);assert.equal(scarabPortrait(value),'');assert.equal(buildScarabModel(value,{},()=>{throw Error('unexpected voxel');}),null);}
});
