import test from 'node:test';
import assert from 'node:assert/strict';
import {fenrirSpec,buildFenrirModel,fenrirPortrait,FENRIR_ART,FENRIR_SKILL_ILLUSTRATIONS} from '../src/fenrir-art.js';
test('Fenrir is a cached four-legged original wolf skin whose avatar and renderer use identical geometry',()=>{
 const s=fenrirSpec(),drawn=[];assert.equal(fenrirSpec({hero:'fenrir'}),s);assert.equal(buildFenrirModel('fenrir',{},(_body,...p)=>drawn.push(p)),s);assert.deepEqual(drawn,s.parts);assert.equal(s.legs.length,4);assert.equal(s.wings.length,0);assert.equal(s.motion,'quadruped');assert.ok(s.parts.length>45&&s.parts.length<100);assert.ok(s.parts.every(p=>p.length===7&&p.every(Number.isFinite)&&p.slice(3,6).every(v=>v>0)));assert.ok(s.legs.every(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color].every(Number.isFinite)));assert.ok(s.height>2.5&&s.height<3.5);assert.match(fenrirPortrait(),/fenrir-portrait/);assert.equal(fenrirPortrait({hero:'fenrir'}),fenrirPortrait('fenrir'));assert.doesNotMatch(fenrirPortrait(),/NaN|undefined/);assert.equal(FENRIR_ART.name,'Fenrir');
});
test('Fenrir cosmetics never intercept other characters and all six illustration subjects are distinct',()=>{
 for(const key of ['knight','constructor','__proto__',null,{hero:'mage'}]){assert.equal(fenrirSpec(key),null);assert.equal(fenrirPortrait(key),'');assert.equal(buildFenrirModel(key,{},()=>assert.fail('unrelated model drawn')),null);}
 const drawings=new Set();assert.equal(Object.keys(FENRIR_SKILL_ILLUSTRATIONS).length,6);for(const [palette,paths]of Object.values(FENRIR_SKILL_ILLUSTRATIONS)){assert.ok(['nature','blood','gold','arcane','death'].includes(palette));assert.match(paths,/<path/);assert.doesNotMatch(paths,/NaN|undefined|<script/);assert.equal(drawings.has(paths),false);drawings.add(paths);}
});
