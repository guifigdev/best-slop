import {BLOODY_TERRAIN_DATA as DATA} from './bloody-terrain-data.js';

// Enlarge every coordinate together: art, WPM collision, private gardens and
// battle formations must describe the same world. The source data stays intact.
export const BLOODY_WORLD_SCALE=2;
const S=BLOODY_WORLD_SCALE;
const scaledRegion=r=>({...r,minX:r.minX*S,maxX:r.maxX*S,minZ:r.minZ*S,maxZ:r.maxZ*S,x:r.x*S,z:r.z*S});
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Broad, continuously walkable relief is an explicit browser adaptation. The
// central summit has a flat meeting terrace and four gently sloping approaches;
// it does not insert an unrepresented mountain obstacle into native WPM paths.
export function bloodyHeightAt(x,z){
 if(typeof x==='object'){z=x.z;x=x.x;}
 if(!Number.isFinite(x)||!Number.isFinite(z))return 0;
 const nx=x/S,nz=z/S,r=Math.hypot(nx,nz),falloff=1-smooth((r-3)/23);
 if(!falloff)return 0;
 const rise=6.5*falloff;
 const shoulders=Math.sin(nx*.23)*Math.sin(nz*.2)*.65*falloff*smooth(r/6);
 return rise+shoulders;
}

// WPM rows advance north in Warcraft coordinates; our world uses z=-nativeY/128.
// Keep the exact quarter-tile pathing instead of approximating cliffs/water by
// a square arena. The flood fill also excludes all isolated preparation pods.
const W=DATA.pathing.width,H=DATA.pathing.height,STEP=DATA.pathing.step*S,OX=DATA.origin[0]*S,OZ=DATA.origin[1]*S;
const flags=Uint8Array.from(DATA.pathing.flags.match(/../g),s=>parseInt(s,16));
const index=(x,z)=>Math.floor((OZ-z)/STEP)*W+Math.floor((x-OX)/STEP);
const connected=new Uint8Array(W*H),queue=[index(0,0)];connected[queue[0]]=1;
for(let head=0;head<queue.length;head++){
 const i=queue[head],x=i%W,z=Math.floor(i/W);
 for(const k of [x?i-1:-1,x<W-1?i+1:-1,z?i-W:-1,z<H-1?i+W:-1])if(k>=0&&!connected[k]&&!(flags[k]&DATA.pathing.unwalkableBit)){connected[k]=1;queue.push(k);}
}
// Merge identical blocked horizontal runs vertically: exact collision, compact
// enough for the existing spatial hash and navigation grid to cache once.
const obstacles=[];let previous=new Map();
for(let row=0;row<H;row++){
 const current=new Map();
 for(let col=0;col<W;){if(connected[row*W+col]){col++;continue;}const start=col;while(col<W&&!connected[row*W+col])col++;const key=start+':'+col,old=previous.get(key);
  if(old){old.d+=STEP;old.z-=STEP/2;current.set(key,old);}else{const box={x:OX+(start+col)*STEP/2,z:OZ-(row+.5)*STEP,w:(col-start)*STEP,d:STEP,nativePathing:true};obstacles.push(box);current.set(key,box);}
 }
 previous=current;
}
// Native WPM contains cliff/water pathing, but its decorative tree placements
// are separate. Their visible trunks and volcanic cones now have real bodies.
const sceneryObstacles=DATA.placements.filter(p=>['ATtr','Volc'].includes(p.rawId)).map(p=>{const scale=Math.min(1.7,Math.max(.5,p.scale||1)),width=p.rawId==='ATtr'?.72*scale:5*scale;return{x:p.x*S,z:p.z*S,w:width,d:width,scenery:true,rawId:p.rawId};});
obstacles.push(...sceneryObstacles);
const names=['Red','Blue','Teal','Purple','Yellow','Orange','Green','Pink'];
const nativePlots=names.map((name,seat)=>({...scaledRegion(DATA.regions[name]),seat,name,native:true,center:{x:DATA.starts[seat].x*S,z:DATA.starts[seat].z*S}}));
// Native SW6.4d has eight players. Existing browser formats allow ten, so their
// two additional private gardens are deliberately outside the source terrain.
const extraPlots=[-1,1].map((sign,i)=>({seat:8+i,name:'Jardim adicional '+(i+1),native:false,minX:(sign*55-5.5)*S,maxX:(sign*55+5.5)*S,minZ:-3*S,maxZ:3*S,x:sign*55*S,z:0,center:{x:sign*55*S,z:0}}));
const preparationPlots=Object.freeze([...nativePlots,...extraPlots]);
const fronts=Object.freeze(['1a','1b','2a','2b','3a','3b','4a','4b'].map((key,i)=>({index:i,key,...scaledRegion(DATA.regions['Frontrank_'+key]),reinforcement:scaledRegion(DATA.regions['Reinforcements_'+key])})));
const map=Object.freeze({minX:-62*S,maxX:62*S,minZ:-48*S,maxZ:48*S,width:124*S,depth:96*S,nativeExtent:{minX:-48*S,maxX:48*S,minZ:-48*S,maxZ:48*S},center:{x:0,z:0},scale:S,battlefieldKey:'swbt-6.4d-expanded-relief',obstacles});
export const BLOODY_BATTLEFIELD=Object.freeze({map,scale:S,heightAt:bloodyHeightAt,source:DATA.provenance,preparationPlots,fronts,obstacles,bridges:[],adaptation:'Native terrain, private plots and approaches enlarged twofold. Smooth central summit and four-biome scenery are original browser art; ten-player formats add two private gardens.'});
export const bloodyPreparationPlot=seat=>preparationPlots[Math.max(0,Math.min(9,Math.floor(Number(seat)||0)))];
export function bloodyPreparationValid(seat,point,radius=.2){
 const plot=bloodyPreparationPlot(seat);
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z)||point.x<plot.minX+.8||point.x>plot.maxX-.8||point.z<plot.minZ+.8||point.z>plot.maxZ-.8)return false;
 if(!plot.native)return true;
 const minCol=Math.floor((point.x-radius-OX)/STEP),maxCol=Math.floor((point.x+radius-OX)/STEP),minRow=Math.floor((OZ-point.z-radius)/STEP),maxRow=Math.floor((OZ-point.z+radius)/STEP);
 for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++)if(flags[row*W+col]&DATA.pathing.unwalkableBit)return false;
 return true;
}
export function bloodyPreparationPoint(seat,preferred,occupied=[]){
 const plot=bloodyPreparationPlot(seat),candidates=[];
 for(let z=plot.minZ+.85;z<=plot.maxZ-.8;z+=.25)for(let x=plot.minX+.85;x<=plot.maxX-.8;x+=.25){const p={x,z};if(bloodyPreparationValid(seat,p)&&occupied.every(o=>Math.hypot(o.x-x,o.z-z)>=1.05))candidates.push(p);}
 candidates.sort((a,b)=>Math.hypot(a.x-preferred.x,a.z-preferred.z)-Math.hypot(b.x-preferred.x,b.z-preferred.z)||a.x-b.x||a.z-b.z);
 return candidates[0]||null;
}
export function bloodyTerrainBlocked(point,radius=0){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z)||!Number.isFinite(radius)||radius<0)return true;
 const minCol=Math.floor((point.x-radius-OX)/STEP),maxCol=Math.floor((point.x+radius-OX-(radius?1e-7:0))/STEP),minRow=Math.floor((OZ-point.z-radius)/STEP),maxRow=Math.floor((OZ-point.z+radius-(radius?1e-7:0))/STEP);
 if(minCol<0||maxCol>=W||minRow<0||maxRow>=H)return true;
 for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++)if(!connected[row*W+col])return true;
 if(sceneryObstacles.some(o=>Math.abs(point.x-o.x)<o.w/2+radius-1e-5&&Math.abs(point.z-o.z)<o.d/2+radius-1e-5))return true;
 return false;
}
export function bloodyBattleFront({seat=0,team=1,teams=false,teamIndex=0}={}){
 if(teams){const side=team===1?0:4;return{...fronts[side+(teamIndex%2)],extraOffset:Math.floor(teamIndex/2)*1.8*S};}
 const i=seat<8?seat:seat===8?0:4;return{...fronts[i],extraOffset:seat>=8?3.6*S:0};
}
export function bloodyBattleSpawn({seat=0,team=1,teams=false,teamIndex=0,entry,index:troopIndex=0,count=1}){
 const plot=bloodyPreparationPlot(seat),front=bloodyBattleFront({seat,team,teams,teamIndex}),length=Math.hypot(front.x,front.z),out={x:front.x/length,z:front.z/length},side={x:-out.z,z:out.x};
 const lateral=((entry.x-(plot.minX+plot.maxX)/2)/(plot.maxX-plot.minX))*5.8*S+(troopIndex-(count-1)/2)*1.15*S+front.extraOffset;
 const depth=((entry.z-plot.minZ)/(plot.maxZ-plot.minZ)-.5)*4*S;
 return{x:front.x+side.x*lateral+out.x*depth,z:front.z+side.z*lateral+out.z*depth};
}
const contexts=new WeakMap();
export function bloodyBattleContext(game){let context=contexts.get(game);if(!context){context={map:{...map,...map.nativeExtent,width:96*S,depth:96*S},buildings:[],obstacles,navigationRevision:2};contexts.set(game,context);}context.units=game.units.filter(u=>u.bloodyUnit&&u.alive);context.elapsed=game.time;return context;}
