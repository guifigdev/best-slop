import {performance} from 'node:perf_hooks';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createBonkSpatialIndex} from '../shared/bonk-spatial.js';

let seed=47953;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const units=Array.from({length:280},(_,id)=>({id,x:random()*100-50,z:random()*100-50,alive:true,bonkEnemy:true,collisionRadius:.4+random()*.7}));
const shots=Array.from({length:220},()=>({x:random()*80-40,z:random()*80-40}));
const index=createBonkSpatialIndex(units),frames=600;
function run(spatial) {let checksum=0,tests=0; const start=performance.now();
 for(let frame=0;frame<frames;frame++) {
  if(spatial)index.rebuild(units);
  for(const p of shots) {const hits=spatial?index.within(p,.45,{collisionRadii:true}):units.filter(u=>{tests++;return Math.hypot(u.x-p.x,u.z-p.z)<=.45+u.collisionRadius;}); for(const u of hits)checksum+=u.id;}
  if(spatial)tests+=index.stats().distanceTests;
 }
 return {milliseconds:performance.now()-start,distanceTests:tests,checksum};
}
run(false);run(true);
const samples=Array.from({length:5},()=>({before:run(false),after:run(true)}));
const median=key=>samples.map(s=>s[key].milliseconds).sort((a,b)=>a-b)[2];
if(samples.some(s=>s.before.checksum!==s.after.checksum))throw new Error('Spatial results changed');
const report={command:'node scripts/benchmark-bonk-spatial.mjs',node:process.version,scenario:{enemies:units.length,projectiles:shots.length,frames,seed:47953,distribution:'100m by 100m; shots in 80m by 80m'},medianMs:{before:median('before'),after:median('after')},speedup:median('before')/median('after'),distanceTests:{before:samples[0].before.distanceTests,after:samples[0].after.distanceTests},checksum:samples[0].before.checksum,samples,notes:['Includes one full index rebuild per simulated frame.','Same 280 alive enemies and 220 projectiles; no enemy/effect budget reductions.','CPU microbenchmark only; browser/device frame rates require runtime profiling.']};
mkdirSync('outputs/ro-conversion',{recursive:true});writeFileSync('outputs/ro-conversion/performance-spatial.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
