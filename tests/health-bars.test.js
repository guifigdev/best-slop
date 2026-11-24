import test from 'node:test';
import assert from 'node:assert/strict';
import {healthBarPresentation} from '../src/health-bars.js';
test('overhead health uses commander relationships and keeps the left edge fixed as health falls',()=>{
 const own={id:1,owner:'p',team:1,hp:50,maxHp:100},ally={id:2,owner:'a',team:1,hp:100,maxHp:100},enemy={id:3,team:2,hp:10,maxHp:100},state={players:{p:1},units:[own,ally,enemy]},before=structuredClone(state);
 const a=healthBarPresentation(own,'p',state),b=healthBarPresentation(ally,'p',state),c=healthBarPresentation(enemy,'p',state);
 assert.equal(a.color,0x61f49b);assert.equal(b.color,0x7abaff);assert.equal(c.color,0xff5b64);assert.equal(a.fillWidth,.78);assert.equal(a.fillX-a.fillWidth/2,-.78);assert.deepEqual(state,before);
});
test('overhead health scales within a fixed budget, clamps health and honors explicit disguise colors',()=>{
 const unit={id:2,hp:150,maxHp:100,pkColor:'#aabbcc'};assert.equal(healthBarPresentation(unit,'p',{},Infinity).scale,1);assert.equal(healthBarPresentation(unit,'p',{},10000).scale,2.2);assert.equal(healthBarPresentation(unit,'p',{},0).scale,.9);assert.equal(healthBarPresentation(unit,'p',{}).color,'#aabbcc');assert.equal(healthBarPresentation(unit,'p',{}).ratio,1);assert.equal(healthBarPresentation({...unit,hp:-20},'p',{}).ratio,0);
});
