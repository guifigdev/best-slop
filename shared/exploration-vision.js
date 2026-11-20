import {treeTagCanSee} from './tree-tag.js';
import {KODO_TAG_MAP} from './kodo-tag-catalog.js';
import {TREE_TAG_RULES} from './tree-tag-catalog.js';
// Team exploration is authoritative. Moving the camera never reveals terrain.
const memories=new WeakMap();
export const treeTagVision=(game,owner)=>constructionVision(game,owner,'treetag');
export const kodoTagVision=(game,owner)=>constructionVision(game,owner,'kodotag');
function constructionVision(game,owner,mode){
 const tt=(mode==='kodotag'?game.kodoTag:game.treeTag)||{map:mode==='kodotag'?KODO_TAG_MAP:TREE_TAG_RULES.map,buildings:[],elapsed:0},observer=game.player(owner);if(!observer)return null;
 let teams=memories.get(game);if(!teams){teams=new Map();memories.set(game,teams);}
 const bounds=tt.map,size=96,team=observer.team;
 let memory=teams.get(team);if(!memory){memory={cells:new Uint8Array(size*size),at:-Infinity,vision:null};teams.set(team,memory);}
 if(memory.vision&&game.time-memory.at<.18&&game.time>=memory.at)return memory.vision;
 const sources=game.units.filter(u=>u.alive&&u.team===team&&!u.treeTagCaptured&&!u.kodoTagCaptured).map(u=>({x:u.x,z:u.z,r:u.treeTagWorker?8:12}));
 for(const b of tt.buildings)if(b.alive&&b.team===team&&b.workRemaining<=0)sources.push({x:b.x,z:b.z,r:b.type==='tower'?12:8});
 for(const u of game.units)if(u.team===team&&u.treeTagRevealUntil>tt.elapsed)sources.push({...u.treeTagRevealPoint||u,r:12});
 if(observer.treeTagCaptured||observer.kodoTagCaptured)sources.push({...tt.map.prison||{x:0,z:1.75},r:7});
 const stepX=(bounds.maxX-bounds.minX)/size,stepZ=(bounds.maxZ-bounds.minZ)/size;
 const cells=memory.cells;for(let i=0;i<cells.length;i++)if(cells[i])cells[i]=1;
 for(const s of sources){const minX=Math.max(0,Math.floor((s.x-s.r-bounds.minX)/stepX)),maxX=Math.min(size-1,Math.ceil((s.x+s.r-bounds.minX)/stepX)),minZ=Math.max(0,Math.floor((s.z-s.r-bounds.minZ)/stepZ)),maxZ=Math.min(size-1,Math.ceil((s.z+s.r-bounds.minZ)/stepZ));for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++)if(Math.hypot(bounds.minX+(x+.5)*stepX-s.x,bounds.minZ+(z+.5)*stepZ-s.z)<=s.r)cells[z*size+x]=2;}
 const observers=game.units.filter(u=>u.alive&&u.team===team&&!u.treeTagCaptured);const visible=p=>sources.some(s=>Math.hypot(p.x-s.x,p.z-s.z)<=s.r)&&(mode!=='treetag'||observers.some(u=>treeTagCanSee(tt,u,p))||tt.buildings.some(b=>b.alive&&b.team===team&&Math.hypot(b.x-p.x,b.z-p.z)<=8));
 memory.at=game.time;memory.vision={kind:'radial',size,bounds:{minX:bounds.minX,maxX:bounds.maxX,minZ:bounds.minZ,maxZ:bounds.maxZ},cells:Array.from(cells).join(''),unitIds:game.units.filter(u=>u.team===team||u.treeTagCaptured||visible(u)).map(u=>u.id),buildingIds:tt.buildings.filter(b=>b.team===team||visible(b)).map(b=>b.id)};
 return memory.vision;
}

export function filterExplorationSnapshot(state,vision){
 if(!vision)return state;
 const ids=new Set(vision.unitIds||[]),objects=new Set(vision.objectIds||[]),units=state.units.filter(u=>ids.has(u.id)),visible=p=>{
  if(vision.kind!=='radial')return (state.dungeon?.map?.rooms||[]).some(r=>vision.visibleRooms?.includes(r.id)&&Math.abs(p.x-r.x)<=r.w/2+2.5&&Math.abs(p.z-r.z)<=r.d/2+2.5);
  const b=vision.bounds,x=Math.floor((p.x-b.minX)/(b.maxX-b.minX)*vision.size),z=Math.floor((p.z-b.minZ)/(b.maxZ-b.minZ)*vision.size);
  return x>=0&&z>=0&&x<vision.size&&z<vision.size&&vision.cells[z*vision.size+x]==='2';
 };
 return{...state,explorationVision:vision,units,effects:(state.effects||[]).filter(e=>visible(e)),projectiles:(state.projectiles||[]).filter(p=>visible(p)),bossWarnings:(state.bossWarnings||[]).filter(p=>visible(p)),...(state.treeTag?{treeTag:{...state.treeTag,vision,buildings:state.treeTag.buildings.filter(b=>vision.buildingIds.includes(b.id))}}:{}),...(state.kodoTag?{kodoTag:{...state.kodoTag,vision,buildings:state.kodoTag.buildings.filter(b=>vision.buildingIds.includes(b.id))}}:{}),...(state.dungeon?{dungeon:{...state.dungeon,visibility:vision,objects:state.dungeon.objects.filter(o=>objects.has(o.id))}}:{})};
}
