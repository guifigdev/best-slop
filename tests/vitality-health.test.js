import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {HEROES,ATTRIBUTES} from '../shared/catalog.js';

test('each VIT adds one percent maximum HP in addition to the existing flat bonus in every Custom Hero mode',()=>{
 for(const mode of ['campaign','best','tower','war','linewars'])for(const type of Object.keys(HEROES)){
  const g=new Game(17,{mode});g.addPlayer('p',type);const p=g.player('p');p.level=4;
  for(const vit of [0,1,5,9,10,11,50,99]){p.attributes.vit=vit;g.refresh(p);assert.equal(p.hpBonusPercent,vit*.01);assert.equal(p.maxHp,Math.round((HEROES[type].hp+90+vit*20)*(1+vit*.01)));assert.equal(p.hpRegenPercent,Math.floor(vit/10)*.001);}
 }
});

test('VIT from tomes and equipment scales the same health pool, including item health, and recomputation never compounds it',()=>{
 const g=new Game();g.addPlayer('p');const p=g.player('p');p.attributes.vit=9;p.tomeAttributes={vit:5};p.inventory=[{key:'crown',level:1},{key:'runemail',level:1}];g.refresh(p);
 const vit=p.totalAttributes.vit;assert.equal(vit,19);assert.equal(p.maxHp,Math.round((HEROES.knight.hp+19*20+80)*1.19));const hp=p.maxHp;for(let i=0;i<20;i++)g.refresh(p);assert.equal(p.maxHp,hp);
 p.hp=hp-100;p.inventory.pop();g.refresh(p);assert.ok(p.hp<=p.maxHp);assert.equal(p.maxHp-p.hp,100);
});

test('the description separates per-point maximum life from the unchanged ten-VIT regeneration threshold',()=>{
 assert.match(ATTRIBUTES.vit.description,/\+1% vida máxima/);assert.match(ATTRIBUTES.vit.description,/Regeneração: \+0,1% da vida máxima\/s a cada 10 VIT/);
});
