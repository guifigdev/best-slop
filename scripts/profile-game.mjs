// Reproducible synthetic CPU/network probe. It does not measure WebGL FPS.
// node scripts/profile-game.mjs [--profile] [--steps=300]
import {performance} from 'node:perf_hooks';
import {writeFile,mkdir} from 'node:fs/promises';
import inspector from 'node:inspector';
import {gzipSync} from 'node:zlib';
import os from 'node:os';
import {Game} from '../shared/simulation.js';
import {castleNavigationInfo,castlePassable,moveCastleUnit} from '../shared/castle-navigation.js';

const steps=Math.max(60,Number(process.argv.find(s=>s.startsWith('--steps='))?.split('=')[1])||300);
const quantile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))];
const summary=a=>({meanMs:+(a.reduce((s,n)=>s+n,0)/a.length).toFixed(3),p50Ms:+quantile(a,.5).toFixed(3),p95Ms:+quantile(a,.95).toFixed(3),maxMs:+Math.max(...a).toFixed(3)});
function scene(count){
 const game=new Game(112,{mode:'castlefight',laneCount:2});game.addPlayer('a');game.addPlayer('b');game.initCastleFight();
 game.castleDefenseTick=()=>{}; // Keep the synthetic population constant.
 const cf=game.castleFight;
 for(let i=0;i<count;i++){
  const team=i%2+1,d=team===1?1:-1,lane=Math.floor(i/2)%2;
  const unit=game.castleSpawn({id:900+team,key:'human_h000',owner:team===1?'a':'b',team,lane,x:-d*32,z:lane?9:-9,w:2.5,d:2.5,spawnCount:i});
  if(!unit)throw new Error('Synthetic producer blocked at '+i);
  const row=Math.floor(i/4);Object.assign(unit,{x:-d*(18+row%5*.9),z:cf.map.lanes[lane].z+(Math.floor(row/5)-1)*.95,pathIndex:1,hp:1e9,maxHp:1e9,damage:0,baseDamage:0});
 }
 return game;
}
function snapshotProbe(game){
 const durations=[],serialize=[];let snapshot,json;
 for(let i=0;i<20;i++){let start=performance.now();snapshot=game.snapshot();durations.push(performance.now()-start);start=performance.now();json=JSON.stringify(snapshot);serialize.push(performance.now()-start);}
 return {create:summary(durations),stringify:summary(serialize),bytes:Buffer.byteLength(json),gzipBytes:gzipSync(json).byteLength,units:snapshot.units.length,terrainRepeated:!!(snapshot.voxelMap&&snapshot.castleFight?.map?.terrain),troopsRepeated:snapshot.castleFight?.units.length||0};
}

const output={date:new Date().toISOString(),node:process.version,cpu:os.cpus()[0]?.model,platform:os.platform(),steps,dt:1/30,synthetic:true,cases:[]};
let session;
if(process.argv.includes('--profile')){session=new inspector.Session();session.connect();await new Promise((resolve,reject)=>session.post('Profiler.enable',e=>e?reject(e):resolve()));await new Promise((resolve,reject)=>session.post('Profiler.start',e=>e?reject(e):resolve()));}
for(const count of [0,60,120]){
 const game=scene(count);for(let i=0;i<30;i++)game.tick(1/30);
 const times=[];for(let i=0;i<steps;i++){const start=performance.now();game.tick(1/30);times.push(performance.now()-start);}
 output.cases.push({name:`Castle Fight ${count} troops`,tick:summary(times),navigation:castleNavigationInfo(game.castleFight),snapshot:snapshotProbe(game)});
}
// Stable obstacle geometry: isolate repeated validity queries/cache overhead.
for(const buildings of [0,24]){
 const g=scene(0),cf=g.castleFight;for(let i=0;i<buildings;i++)cf.buildings.push({id:2000+i,alive:true,x:-45+(i%4)*5,z:-20+Math.floor(i/4)*7,w:2.5,d:2.5});cf.navigationRevision++;
 const times=[];for(let i=0;i<10;i++){const start=performance.now();for(let q=0;q<10000;q++)castlePassable(cf,{x:(q%40)-20,z:9},.45);times.push(performance.now()-start);}
 output.cases.push({name:`10000 static pathing queries, ${buildings} buildings`,batch:summary(times),navigation:castleNavigationInfo(cf)});
}
{
 const game=scene(0),cf=game.castleFight;
 cf.obstacles=[{id:'synthetic-detour-wall',x:0,z:0,w:2,d:30}];cf.navigationRevision++;
 const troops=Array.from({length:60},(_,i)=>({id:8000+i,x:-40+(i%6)*.9,z:(Math.floor(i/6)-5)*.9,speed:3,size:1,flying:false}));
 const goal={x:40,z:0};const run=()=>{cf.elapsed+=1/30;for(const u of troops)moveCastleUnit(cf,u,goal,1/30);};
 let start=performance.now();run();const cold=performance.now()-start,times=[];
 for(let i=0;i<steps;i++){start=performance.now();run();times.push(performance.now()-start);}
 output.cases.push({name:'60 walkers around a synthetic wall (A* detour)',coldMs:+cold.toFixed(3),warm:summary(times),navigation:castleNavigationInfo(cf)});
}
await mkdir(new URL('../outputs/',import.meta.url),{recursive:true});
if(session){const {profile}=await new Promise((resolve,reject)=>session.post('Profiler.stop',(e,r)=>e?reject(e):resolve(r)));session.disconnect();await writeFile(new URL('../outputs/game-performance.cpuprofile',import.meta.url),JSON.stringify(profile));
 const counts=new Map();for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1);const total=profile.samples?.length||1;
 output.sampledHotspots=profile.nodes.map(n=>({name:n.callFrame.functionName||'(anonymous)',url:n.callFrame.url?.split('/').at(-1),selfPercent:+((counts.get(n.id)||0)/total*100).toFixed(2)})).filter(n=>n.selfPercent>.5).sort((a,b)=>b.selfPercent-a.selfPercent).slice(0,15);
}
await writeFile(new URL('../outputs/game-performance.json',import.meta.url),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
