import {BLOODY_TERRAIN_DATA as DATA} from './bloody-terrain-data.js';

// WPM rows advance north in Warcraft coordinates; our world uses z=-nativeY/128.
// Keep the exact quarter-tile pathing instead of approximating cliffs/water by
// a square arena. The flood fill also excludes all isolated preparation pods.
const W=DATA.pathing.width,H=DATA.pathing.height,STEP=DATA.pathing.step;
const flags=Uint8Array.from(DATA.pathing.flags.match(/../g),s=>parseInt(s,16));
const index=(x,z)=>Math.floor((DATA.origin[1]-z)/STEP)*W+Math.floor((x-DATA.origin[0])/STEP);
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
  if(old){old.d+=STEP;old.z-=STEP/2;current.set(key,old);}else{const box={x:DATA.origin[0]+(start+col)*STEP/2,z:DATA.origin[1]-(row+.5)*STEP,w:(col-start)*STEP,d:STEP,nativePathing:true};obstacles.push(box);current.set(key,box);}
 }
 previous=current;
}
const names=['Red','Blue','Teal','Purple','Yellow','Orange','Green','Pink'];
const nativePlots=names.map((name,seat)=>({...DATA.regions[name],seat,name,native:true,center:{x:DATA.starts[seat].x,z:DATA.starts[seat].z}}));
// Native SW6.4d has eight players. Existing browser formats allow ten, so their
// two additional private gardens are deliberately outside the source terrain.
const extraPlots=[-1,1].map((sign,i)=>({seat:8+i,name:'Jardim adicional '+(i+1),native:false,minX:sign*55-5.5,maxX:sign*55+5.5,minZ:-3,maxZ:3,x:sign*55,z:0,center:{x:sign*55,z:0}}));
const preparationPlots=Object.freeze([...nativePlots,...extraPlots]);
const fronts=Object.freeze(['1a','1b','2a','2b','3a','3b','4a','4b'].map((key,i)=>({index:i,key,...DATA.regions['Frontrank_'+key],reinforcement:DATA.regions['Reinforcements_'+key]})));
const map=Object.freeze({minX:-62,maxX:62,minZ:-48,maxZ:48,width:124,depth:96,nativeExtent:{minX:-48,maxX:48,minZ:-48,maxZ:48},center:{x:0,z:0},battlefieldKey:'swbt-6.4d',obstacles});
export const BLOODY_BATTLEFIELD=Object.freeze({map,source:DATA.provenance,preparationPlots,fronts,obstacles,bridges:[],adaptation:'Eight native private plots and fronts. Two additional isolated Nordic gardens support the browser ten-player format; five-versus-five shares the native south/north approaches.'});
export const bloodyPreparationPlot=seat=>preparationPlots[Math.max(0,Math.min(9,Math.floor(Number(seat)||0)))];
export function bloodyPreparationValid(seat,point,radius=.2){
 const plot=bloodyPreparationPlot(seat);
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z)||point.x<plot.minX+.8||point.x>plot.maxX-.8||point.z<plot.minZ+.8||point.z>plot.maxZ-.8)return false;
 if(!plot.native)return true;
 const minCol=Math.floor((point.x-radius+48)/STEP),maxCol=Math.floor((point.x+radius+48)/STEP),minRow=Math.floor((48-point.z-radius)/STEP),maxRow=Math.floor((48-point.z+radius)/STEP);
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
 const minCol=Math.floor((point.x-radius+48)/STEP),maxCol=Math.floor((point.x+radius+48-(radius?1e-7:0))/STEP),minRow=Math.floor((48-point.z-radius)/STEP),maxRow=Math.floor((48-point.z+radius-(radius?1e-7:0))/STEP);
 if(minCol<0||maxCol>=W||minRow<0||maxRow>=H)return true;
 for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++)if(!connected[row*W+col])return true;
 return false;
}
export function bloodyBattleFront({seat=0,team=1,teams=false,teamIndex=0}={}){
 if(teams){const side=team===1?0:4;return{...fronts[side+(teamIndex%2)],extraOffset:Math.floor(teamIndex/2)*1.8};}
 const i=seat<8?seat:seat===8?0:4;return{...fronts[i],extraOffset:seat>=8?3.6:0};
}
export function bloodyBattleSpawn({seat=0,team=1,teams=false,teamIndex=0,entry,index:troopIndex=0,count=1}){
 const plot=bloodyPreparationPlot(seat),front=bloodyBattleFront({seat,team,teams,teamIndex}),length=Math.hypot(front.x,front.z),out={x:front.x/length,z:front.z/length},side={x:-out.z,z:out.x};
 const lateral=((entry.x-(plot.minX+plot.maxX)/2)/(plot.maxX-plot.minX))*5.8+(troopIndex-(count-1)/2)*1.15+front.extraOffset;
 const depth=((entry.z-plot.minZ)/(plot.maxZ-plot.minZ)-.5)*4;
 return{x:front.x+side.x*lateral+out.x*depth,z:front.z+side.z*lateral+out.z*depth};
}
const contexts=new WeakMap();
export function bloodyBattleContext(game){let context=contexts.get(game);if(!context){context={map:{...map,...map.nativeExtent,width:96,depth:96},buildings:[],obstacles,navigationRevision:1};contexts.set(game,context);}context.units=game.units.filter(u=>u.bloodyUnit&&u.alive);context.elapsed=game.time;return context;}
