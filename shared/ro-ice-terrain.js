// One seeded surface mask for the host's movement and the client's ground art.
// Snow grips normally; only the blue frozen pools carry momentum.
export const RO_ICE_TERRAIN_RULES=Object.freeze({patches:7,acceleration:6,braking:3.2,maxMaps:32});
const cache=new Map(),empty=Object.freeze([]),hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const roHasFrozenTerrain=map=>!!map&&!map.tower&&map.stageKey==='glacier'&&(!map.route||['glacial','snow-village'].includes(map.route.style));
export function roIcePatches(map){
 if(!roHasFrozenTerrain(map))return empty;
 const key=[map.seed,map.stageKey,map.route?.key||'',map.route?.style||''].join(':');if(cache.has(key))return cache.get(key);
 const seed=Number(map.seed)||1,result=[],avoid=[map.spawn,map.route?.entry,map.route?.bossArena,...(map.route?.gates||[]).map(g=>({...g,radius:8}))].filter(Boolean);
 for(let i=0;i<96&&result.length<RO_ICE_TERRAIN_RULES.patches;i++){
  const x=(hash(seed+i*8.31)-.5)*166,z=(hash(seed+i*19.17+31)-.5)*166,rx=7+hash(seed+i*3.7+89)*5,rz=6+hash(seed+i*7.3+47)*4;
  if(avoid.some(p=>Math.hypot(x-p.x,z-p.z)<Math.max(rx,rz)+(p.radius||10)+4)||result.some(p=>Math.hypot(x-p.x,z-p.z)<Math.max(rx,rz)+Math.max(p.rx,p.rz)+5))continue;
  // Pools are mostly usable clearings rather than hidden under frozen props.
  if((map.obstacles||[]).some(o=>Math.abs(o.x-x)<o.w*.5+rx*.55&&Math.abs(o.z-z)<o.d*.5+rz*.55))continue;
  result.push(Object.freeze({id:'ice-'+result.length,x,z,rx,rz,angle:hash(seed+i*5.1)*Math.PI}));
 }
 const patches=Object.freeze(result);cache.set(key,patches);if(cache.size>RO_ICE_TERRAIN_RULES.maxMaps)cache.delete(cache.keys().next().value);return patches;
}
export function roIceWeightAt(map,x,z){
 let weight=0;for(const p of roIcePatches(map)){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle),radius=Math.hypot((dx*c+dz*s)/p.rx,(-dx*s+dz*c)/p.rz);weight=Math.max(weight,Math.max(0,Math.min(1,(1-radius)/.16)));}return weight;
}
export function roSnowCoverAt(map,x,z){
 if(!roHasFrozenTerrain(map))return 0;return (.45+.55*Math.max(0,Math.sin(x*.045+(map.seed||1)) * Math.cos(z*.038)))*(1-roIceWeightAt(map,x,z));
}
export function roIceMovement(map,unit,input,dt,speed,{dash=false}={}){
 const dx=Number.isFinite(input?.dx)?input.dx:0,dz=Number.isFinite(input?.dz)?input.dz:0,length=Math.hypot(dx,dz),vx=length?dx/length*speed:0,vz=length?dz/length*speed:0;
 if(!roHasFrozenTerrain(map)){delete unit.roIceMotion;return{dx,dz,speed};}
 const key=[map.seed,map.route?.key||''].join(':'),ice=!dash&&(unit.bonkJumpHeight||0)<.08&&roIceWeightAt(map,unit.x,unit.z)>.2;
 let motion=unit.roIceMotion;if(!motion||motion.map!==key)motion={map:key,x:0,z:0};
 if(!ice){motion.x=vx;motion.z=vz;unit.roIceMotion=motion;return{dx,dz,speed};}
 const blend=1-Math.exp(-(length?RO_ICE_TERRAIN_RULES.acceleration:RO_ICE_TERRAIN_RULES.braking)*Math.max(0,Math.min(.1,dt)));
 motion.x+=(vx-motion.x)*blend;motion.z+=(vz-motion.z)*blend;const magnitude=Math.hypot(motion.x,motion.z);
 if(magnitude<.035){motion.x=0;motion.z=0;}else if(magnitude>speed&&magnitude>0){motion.x*=speed/magnitude;motion.z*=speed/magnitude;}
 unit.roIceMotion=motion;return{dx:motion.x,dz:motion.z,speed:Math.hypot(motion.x,motion.z)};
}
