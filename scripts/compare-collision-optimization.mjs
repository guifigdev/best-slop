// Regression probe against the recorded baseline; requires that commit in local Git history.
import {execFileSync} from 'node:child_process';
import {resolveUnitCollisions as optimized} from '../shared/unit-collision.js';
import {RO_MONSTER_BODY_HULLS} from '../shared/ro-monster-body-hulls.js';
import assert from 'node:assert/strict';
const base=new URL('../shared/',import.meta.url).href;
const source=execFileSync('git',['show','1c0b149:shared/unit-collision.js'],{encoding:'utf8'}).replaceAll("from './","from '"+base);
const {resolveUnitCollisions:original}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let seed=271127;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),species=Object.keys(RO_MONSTER_BODY_HULLS);
for(let scene=0;scene<40;scene++){
 const g={time:1,bounds:120,options:{mode:'bonk'},obstacles:scene%2?[{x:3,z:0,w:1,d:14}]:[],units:Array.from({length:10+scene%15},(_,id)=>({id:id+1,team:100,alive:true,bonkEnemy:true,ragnarokVisual:species[id%species.length],x:rand()*8-4,z:rand()*8-4,collisionRadius:.4+rand()*.5,size:.7+rand()*.5,facing:rand()*Math.PI*2}))},a=structuredClone(g),b=structuredClone(g);
 const before=original(a,1/30),after=optimized(b,1/30);assert.deepEqual(after,before);assert.deepEqual(b.units,a.units);
}
console.log('40 dense scenes: exact positions, collision counters and actor state match the baseline.');
