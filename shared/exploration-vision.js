import {KODO_TAG_MAP,KODO_TAG_FOREST,KODO_TAG_MINES} from './kodo-tag-catalog.js';
import {TREE_TAG_RULES,TREE_TAG_FOREST} from './tree-tag-catalog.js';

const memories=new WeakMap(),occlusions=new WeakMap(),SIZE=128;
const OCTANTS=[[1,0,0,1],[0,1,1,0],[0,-1,1,0],[-1,0,0,1],[-1,0,0,-1],[0,-1,-1,0],[0,1,-1,0],[1,0,0,-1]];
export const treeTagVision=(game,owner)=>constructionVision(game,owner,'treetag');
export const kodoTagVision=(game,owner)=>constructionVision(game,owner,'kodotag');
function blockerGrid(game,tt,bounds,stepX,stepZ){
 const blockers=[...(tt.obstacles||tt.map.obstacles||[]),...(tt.trees||[]),...(tt.buildings||[])].filter(o=>o.alive!==false&&!o.destroyed&&!(o.workRemaining>0));
 const signature=[bounds.minX,bounds.minZ,stepX,stepZ,...blockers.map(o=>[o.x,o.z,o.w||.7,o.d||.7].join(','))].join(';');
 let cached=occlusions.get(game);if(cached?.signature===signature)return cached;
 const blocked=new Uint8Array(SIZE*SIZE);for(const o of blockers){const w=o.w||.7,d=o.d||.7,x0=Math.floor((o.x-w/2-bounds.minX)/stepX),x1=Math.floor((o.x+w/2-bounds.minX)/stepX),z0=Math.floor((o.z-d/2-bounds.minZ)/stepZ),z1=Math.floor((o.z+d/2-bounds.minZ)/stepZ);for(let z=Math.max(0,z0);z<=Math.min(SIZE-1,z1);z++)for(let x=Math.max(0,x0);x<=Math.min(SIZE-1,x1);x++)blocked[z*SIZE+x]=1;}
 cached={signature,blocked};occlusions.set(game,cached);return cached;
}
function sourceField(source,bounds,stepX,stepZ,blocked){
 const cx=Math.floor((source.x-bounds.minX)/stepX),cz=Math.floor((source.z-bounds.minZ)/stepZ),radius=Math.ceil(source.r/Math.min(stepX,stepZ)),seen=new Uint8Array(SIZE*SIZE),indices=[],radiusSquared=source.r*source.r;
 const inside=(x,z)=>x>=0&&z>=0&&x<SIZE&&z<SIZE;
 // Only a vision-producing building can ignore its own opaque body. Other
 // walls/trees still cast shadows; the source range remains centre-based.
 const self=source.w?{minX:Math.floor((source.x-source.w/2-bounds.minX)/stepX),maxX:Math.floor((source.x+source.w/2-bounds.minX)/stepX),minZ:Math.floor((source.z-source.d/2-bounds.minZ)/stepZ),maxZ:Math.floor((source.z+source.d/2-bounds.minZ)/stepZ)}:null;
 const opaque=(x,z)=>!inside(x,z)||blocked[z*SIZE+x]&&!(self&&x>=self.minX&&x<=self.maxX&&z>=self.minZ&&z<=self.maxZ);
 const mark=(x,z)=>{if(!inside(x,z))return;const index=z*SIZE+x;if(seen[index])return;const dx=bounds.minX+(x+.5)*stepX-source.x,dz=bounds.minZ+(z+.5)*stepZ-source.z;if(dx*dx+dz*dz>radiusSquared)return;seen[index]=1;indices.push(index);};
 if(inside(cx,cz)){seen[cz*SIZE+cx]=1;indices.push(cz*SIZE+cx);}
 function cast(row,start,end,xx,xy,yx,yy){
  if(start<end)return;let next=start;
  for(let distance=row;distance<=radius;distance++){
   let shadow=false;const dy=-distance;
   for(let dx=-distance;dx<=0;dx++){
    const left=(dx-.5)/(dy+.5),right=(dx+.5)/(dy-.5);if(start<right)continue;if(end>left)break;
    const x=cx+dx*xx+dy*xy,z=cz+dx*yx+dy*yy;mark(x,z);const wall=opaque(x,z);
    if(shadow){if(wall)next=right;else{shadow=false;start=next;}}
    else if(wall&&distance<radius){shadow=true;cast(distance+1,start,left,xx,xy,yx,yy);next=right;}
   }
   if(shadow)break;
  }
 }
 for(const octant of OCTANTS)cast(1,1,0,...octant);return Uint32Array.from(indices);
}
function constructionVision(game,owner,mode){
 const tt=(mode==='kodotag'?game.kodoTag:game.treeTag)||{map:mode==='kodotag'?KODO_TAG_MAP:TREE_TAG_RULES.map,buildings:[],elapsed:0},observer=game.player(owner);if(!observer)return null;
 let teams=memories.get(game);if(!teams){teams=new Map();memories.set(game,teams);}const team=observer.team,bounds=tt.map,memoryKey=mode+':'+team;
 let memory=teams.get(memoryKey);if(!memory){memory={cells:new Uint8Array(SIZE*SIZE),at:-Infinity,vision:null,collections:new Map(),sourceCache:new Map()};teams.set(memoryKey,memory);}
 if(memory.vision&&game.time-memory.at<.18&&game.time>=memory.at)return memory.vision;
 const sources=game.units.filter(u=>u.alive&&u.team===team&&!u.treeTagCaptured&&!u.kodoTagCaptured).map(u=>({x:u.x,z:u.z,r:u.treeTagWorker||u.kodoTagWorker?13:mode==='kodotag'?19:16}));
 for(const b of tt.buildings||[])if(b.alive&&b.team===team&&b.workRemaining<=0)sources.push({x:b.x,z:b.z,w:b.w||.7,d:b.d||.7,r:b.type==='tower'?18:12});
 for(const u of game.units)if(u.team===team&&u.treeTagRevealUntil>tt.elapsed)sources.push({...u.treeTagRevealPoint||u,r:14});
 if(observer.treeTagCaptured||observer.kodoTagCaptured)sources.push({...tt.map.prison||tt.map.jail||{x:0,z:1.75},r:9});
 const stepX=(bounds.maxX-bounds.minX)/SIZE,stepZ=(bounds.maxZ-bounds.minZ)/SIZE,{blocked,signature}=blockerGrid(game,tt,bounds,stepX,stepZ),cells=memory.cells;
 if(memory.occlusion!==signature){memory.sourceCache.clear();memory.occlusion=signature;}
 for(let i=0;i<cells.length;i++)if(cells[i])cells[i]=1;
 const covered=source=>{const x0=Math.max(0,Math.floor((source.x-source.r-bounds.minX)/stepX)),x1=Math.min(SIZE-1,Math.floor((source.x+source.r-bounds.minX)/stepX)),z0=Math.max(0,Math.floor((source.z-source.r-bounds.minZ)/stepZ)),z1=Math.min(SIZE-1,Math.floor((source.z+source.r-bounds.minZ)/stepZ)),r2=source.r*source.r;for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){if(cells[z*SIZE+x]===2)continue;const dx=bounds.minX+(x+.5)*stepX-source.x,dz=bounds.minZ+(z+.5)*stepZ-source.z;if(dx*dx+dz*dz<=r2)return false;}return true;};
 const nextCache=new Map();for(const source of sources){const key=[source.x,source.z,source.r,source.w||0,source.d||0].join(',');let field=memory.sourceCache.get(key);if(!field){if(covered(source))continue;field=sourceField(source,bounds,stepX,stepZ,blocked);}nextCache.set(key,field);for(const i of field)if(cells[i]!==2)cells[i]=2;}memory.sourceCache=nextCache;
 // The nearest visible face is enough to identify a structure. Its opaque
 // centre need not be visible, and hidden destruction retains the old clone.
 const visible=o=>{if(!Number.isFinite(o.x)||!Number.isFinite(o.z))return false;const w=o.w||0,d=o.d||0,x0=Math.floor((o.x-w/2-bounds.minX)/stepX),x1=Math.floor((o.x+w/2-bounds.minX)/stepX),z0=Math.floor((o.z-d/2-bounds.minZ)/stepZ),z1=Math.floor((o.z+d/2-bounds.minZ)/stepZ);for(let z=Math.max(0,z0);z<=Math.min(SIZE-1,z1);z++)for(let x=Math.max(0,x0);x<=Math.min(SIZE-1,x1);x++)if(cells[z*SIZE+x]===2)return true;return false;};
 const remember=(name,current,initial=[])=>{let saved=memory.collections.get(name);if(!saved){saved=new Map(initial.map(o=>[o.id,structuredClone(o)]));memory.collections.set(name,saved);}const existing=new Set();for(const o of current){existing.add(o.id);if(visible(o)||name==='buildings'&&o.team===team)saved.set(o.id,structuredClone(o));}for(const [id,o]of saved)if(!existing.has(id)&&visible(o))saved.delete(id);return [...saved.values()];};
 const remembered={trees:remember('trees',tt.trees||[],mode==='kodotag'?KODO_TAG_FOREST:TREE_TAG_FOREST),buildings:remember('buildings',tt.buildings||[])};
 if(mode==='kodotag'){remembered.obstacles=remember('obstacles',tt.obstacles||tt.map.obstacles||[],tt.map.obstacles||[]);remembered.mines=remember('mines',tt.mines||[],KODO_TAG_MINES);}
 memory.at=game.time;memory.vision={kind:'radial',team,size:SIZE,edgeSoftness:4,unexploredLight:.27,exploredLight:.52,bounds:{minX:bounds.minX,maxX:bounds.maxX,minZ:bounds.minZ,maxZ:bounds.maxZ},cells:Array.from(cells).join(''),unitIds:game.units.filter(u=>u.team===team||visible(u)).map(u=>u.id),buildingIds:(tt.buildings||[]).filter(b=>visible(b)||b.team===team).map(b=>b.id),remembered};return memory.vision;
}

export function filterExplorationSnapshot(state,vision){
 if(!vision)return state;const {remembered,...publicVision}=vision,ids=new Set(vision.unitIds||[]),objects=new Set(vision.objectIds||[]),units=state.units.filter(u=>ids.has(u.id)),alliedOwners=new Set(units.filter(u=>u.team===vision.team).map(u=>u.owner).filter(owner=>owner!=null)),alliedIds=new Set(units.filter(u=>u.team===vision.team).map(u=>u.id));
 const visible=p=>{if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z))return false;if(vision.kind!=='radial')return (state.dungeon?.map?.rooms||[]).some(r=>vision.visibleRooms?.includes(r.id)&&Math.abs(p.x-r.x)<=r.w/2+2.5&&Math.abs(p.z-r.z)<=r.d/2+2.5);const b=vision.bounds,x=Math.floor((p.x-b.minX)/(b.maxX-b.minX)*vision.size),z=Math.floor((p.z-b.minZ)/(b.maxZ-b.minZ)*vision.size);return x>=0&&z>=0&&x<vision.size&&z<vision.size&&vision.cells[z*vision.size+x]==='2';};
 const privateFields=new Set(['navigationRevision','forestRevision','resourceRevision','navigation','step','respawns']);
 const actorArrays=new Set(['units','kodos','workers','actors','summons','creeps']);
 const eventArrays=new Set(['effects','projectiles','zones','fields','bossWarnings','warnings','telegraphs']);
 const sanitize=(value,key='',parentAllied=false)=>{
  if(value==null||typeof value!=='object')return value;
  if(Array.isArray(value)){
   const selected=actorArrays.has(key)?value.filter(o=>ids.has(o.id)):eventArrays.has(key)?value.filter(visible):value;
   return selected.map(o=>sanitize(o,key,parentAllied));
  }
  const allied=parentAllied||value.team===vision.team||alliedOwners.has(value.owner)||alliedIds.has(value.id),out={};
  for(const [field,item]of Object.entries(value)){
   if(privateFields.has(field))continue;
   if(!allied&&['productionQueue','researching','researchLevels','trainRemaining','rally','destination','order','target','gatherProgress','carrying','treeTagAction','kodoTagAction','queue','rallyPoint'].includes(field))continue;
   out[field]=sanitize(item,field,allied||key==='players'&&alliedOwners.has(field));
  }return out;
 };
 const cleanMode=mode=>{const source=state[mode];if(!source)return null;const clean=sanitize(source);if(remembered){for(const key of ['trees','buildings','obstacles','mines'])if(remembered[key])clean[key]=remembered[key].map(o=>sanitize(o));}else clean.buildings=(source.buildings||[]).filter(b=>vision.buildingIds?.includes(b.id)).map(o=>sanitize(o));if(clean.map&&remembered?.obstacles)clean.map={...clean.map,obstacles:clean.obstacles};clean.vision=publicVision;return clean;};
 return{...state,explorationVision:publicVision,units:units.map(u=>sanitize(u)),effects:(state.effects||[]).filter(visible),projectiles:(state.projectiles||[]).filter(visible),bossWarnings:(state.bossWarnings||[]).filter(visible),...(state.treeTag?{treeTag:cleanMode('treeTag')}:{}),...(state.kodoTag?{kodoTag:cleanMode('kodoTag')}:{}),...(state.dungeon?{dungeon:{...state.dungeon,visibility:vision,objects:state.dungeon.objects.filter(o=>objects.has(o.id))}}:{})};
}
