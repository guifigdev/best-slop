// CPU-only probe of the actual simulation, snapshots and HTML builders. No FPS claim.
// node scripts/profile-ragnabonk.mjs --steps=180 --profile
import {performance} from 'node:perf_hooks';
import inspector from 'node:inspector';
import os from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {RO_SKILLS,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {roEquipmentBagMarkup} from '../src/ro-equipment-bag-ui.js';
import {roSkillLibraryMarkup} from '../src/ro-skill-library.js';

const steps=Math.max(60,Math.min(1800,Number(process.argv.find(a=>a.startsWith('--steps='))?.split('=')[1])||180));
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))];
const summary=values=>({meanMs:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(3),p50Ms:+percentile(values,.5).toFixed(3),p95Ms:+percentile(values,.95).toFixed(3),maxMs:+Math.max(...values).toFixed(3)});
const probe=(fn,n=50)=>{const times=[];let result;for(let i=0;i<n;i++){const t=performance.now();result=fn();times.push(performance.now()-t);}return{timing:summary(times),result};};
function fixture(count,spells){
 const g=new Game(271127,{mode:'bonk',bonkWorld:'dominion',bonkLineage:'archmage'});g.addPlayer('probe','mage');g.command('probe',{type:'bkReady'});
 const u=g.player('probe'),template=structuredClone(g.units.find(e=>e.bonkEnemy));if(!template)throw Error('A real spawned enemy is required');
 u.level=spells?150:10;advanceRoJob(u,spells?3:0);u.bonkInvulnerableUntil=1e9;u.bonkMove={dx:0,dz:0};
 const selected=Object.values(RO_SKILLS).filter(s=>s.kind!=='passive'&&s.lineage==='archmage').slice(0,12).map(s=>s.key);
 // Select explicit existing mage skills if the catalogue expresses lineage via jobs.
 const fallback=['mg_firebolt','mg_coldbolt','mg_lightningbolt','mg_fireball','mg_soulstrike','mg_frostdiver','wz_meteor','wz_stormgust','wz_jupitel','wz_lov','wz_heavendrive','mg_thunderstorm'].filter(k=>RO_SKILLS[k]);
 const skills=spells?(selected.length?selected:fallback):[];
 u.bonkBuild.weapons={basic:1,...Object.fromEntries(skills.map(k=>[k,5]))};u.bonkSkillSlots=['basic',...skills].slice(0,13);while(u.bonkSkillSlots.length<13)u.bonkSkillSlots.push(null);
 u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,spells]));u.mana=bonkStats(u).maxMana;
 const monsters=Array.from({length:count},(_,i)=>{const a=i*2.399963,r=3+Math.sqrt((i+.5)/Math.max(1,count))*22;return{...structuredClone(template),id:10000+i,x:u.x+Math.sin(a)*r,z:u.z+Math.cos(a)*r,hp:1e9,maxHp:1e9,bonkNextSpecial:1e9};});
 g.units=[u,...monsters];g.bonk.spawnAt=1e9;g.bonk.bossSpawned=true;g.bonk.bossUnlocked=false;g.bonk.offer=null;g.bonk.stage='playing';
 return{g,u,skills};
}
const report={date:new Date().toISOString(),node:process.version,cpu:os.cpus()[0]?.model,platform:os.platform(),steps,dt:1/30,seed:271127,synthetic:true,measuresGPU:false,cases:[]};
let profiler;if(process.argv.includes('--profile')){profiler=new inspector.Session();profiler.connect();await new Promise((ok,no)=>profiler.post('Profiler.enable',e=>e?no(e):ok()));await new Promise((ok,no)=>profiler.post('Profiler.start',e=>e?no(e):ok()));}
for(const [count,spells]of [[0,false],[60,false],[140,true],[280,true]]){
 const{g,u,skills}=fixture(count,spells);for(let i=0;i<30;i++)g.tick(1/30);
 const times=[];let maxEffects=0,maxShots=0,maxZones=0;for(let i=0;i<steps;i++){const t=performance.now();g.tick(1/30);times.push(performance.now()-t);maxEffects=Math.max(maxEffects,g.effects.length);maxShots=Math.max(maxShots,g.bonk.projectiles.length);maxZones=Math.max(maxZones,g.bonk.roSkillZones?.length||0);}
 const snap=probe(()=>g.snapshotFor('probe')),state=snap.result,json=probe(()=>JSON.stringify(state)),stats=probe(()=>bonkStats(u)),bag=probe(()=>roEquipmentBagMarkup(u)),library=probe(()=>roSkillLibraryMarkup(state.bonk,u));
 const lean={...state,bonk:{...state.bonk}};delete lean.bonk.map;delete lean.obstacles;delete lean.bonk.skillCatalog;delete lean.bonk.learnedSkills;
 report.cases.push({name:`${count} monsters; ${spells?'automatic mage skills':'no automatic attacks'}`,skills,units:g.units.length,peaks:{effects:maxEffects,projectiles:maxShots,zones:maxZones},tick:summary(times),snapshot:snap.timing,stringify:json.timing,bonkStats:stats.timing,inventoryMarkup:bag.timing,skillLibraryMarkup:library.timing,fullSnapshotBytes:Buffer.byteLength(json.result),afterStaticAndSkillCacheBytes:Buffer.byteLength(JSON.stringify(lean))});
}
await mkdir('outputs',{recursive:true});
if(profiler){const{profile}=await new Promise((ok,no)=>profiler.post('Profiler.stop',(e,r)=>e?no(e):ok(r)));profiler.disconnect();await writeFile('outputs/ragnabonk-performance.cpuprofile',JSON.stringify(profile));const samples=new Map();for(const id of profile.samples||[])samples.set(id,(samples.get(id)||0)+1);const total=profile.samples?.length||1;report.sampledHotspots=profile.nodes.map(n=>({name:n.callFrame.functionName||'(anonymous)',file:n.callFrame.url?.split('/').at(-1),selfPercent:+((samples.get(n.id)||0)/total*100).toFixed(2)})).filter(r=>r.selfPercent>=.5).sort((a,b)=>b.selfPercent-a.selfPercent).slice(0,20);}
await writeFile('outputs/ragnabonk-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
