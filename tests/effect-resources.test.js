import test from 'node:test';
import assert from 'node:assert/strict';
import {customHeroAttackEffect} from '../src/hero-cosmetics.js';
import {refreshEffectEvent} from '../src/effect-resources.js';

test('replayed spectator snapshots retain melee art instead of entering the arrow animation',()=>{
 const event={id:18,type:'arrow',basicAttack:true,source:2,time:5,x:10,z:20,tx:12,tz:20};
 const before=structuredClone(event);
 const entry={e:customHeroAttackEffect(event,{hero:'knight',range:1.8})};
 assert.equal(entry.e.type,'slash');
 for(let i=0;i<4;i++)refreshEffectEvent(entry,{...event,tx:12+i,pulses:4-i});
 assert.equal(entry.e.type,'slash');
 assert.equal(entry.e.projectileKind,null);
 assert.equal(entry.e.tx,15);
 assert.equal(entry.e.pulses,1);
 assert.deepEqual(event,before);
});

test('refresh preserves projectile styling and accepts current field state',()=>{
 const entry={e:{type:'arrow',projectileKind:'arcane'}};
 refreshEffectEvent(entry,{type:'arrow',projectileKind:'egg',x:8,time:2});
 assert.equal(entry.e.projectileKind,'arcane');
 assert.equal(entry.e.x,8);
 const field={e:{type:'blizzard',pulses:4}};
 refreshEffectEvent(field,{type:'blizzard',pulses:0,duration:3});
 assert.equal(field.e.pulses,0);
 assert.equal(field.e.duration,3);
});
