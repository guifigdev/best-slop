// Navigation state is deliberately outside snapshots: troop path arrays and
// collision grids are caches, not authoritative game data sent to clients.
const contexts=new WeakMap(),unitPaths=new WeakMap(),unitGoals=new WeakMap();
const CELL=.75,BUCKET=4,EPS=.00001,MAX_EXPANSIONS=16000,MAX_SHARED_PATHS=96;
const hypot=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finitePoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
export function castleNavigationRadius(u){return clamp(Number.isFinite(u?.collisionRadius)?u.collisionRadius:(u?.size||1)*.45,.2,2);}
function bounds(cf){const m=cf.map||{};return{minX:m.minX??-(m.width||48)/2,maxX:m.maxX??(m.width||48)/2,minZ:m.minZ??-(m.depth||32)/2,maxZ:m.maxZ??(m.depth||32)/2};}
function inside(b,p,r){return finitePoint(p)&&p.x>=b.minX+r-EPS&&p.x<=b.maxX-r+EPS&&p.z>=b.minZ+r-EPS&&p.z<=b.maxZ-r+EPS;}
function shape(o){return o&&o.alive!==false&&finitePoint(o)&&Number.isFinite(o.w)&&Number.isFinite(o.d)&&o.w>0&&o.d>0;}
// Compare the few geometry fields directly. Stringifying every structure on
// every passability query dominated crowded scenes despite cached A* paths.
// Keep this check even within a frame: callers may move/replace a building
// directly, and collision validity must not wait for the next simulation tick.
function geometryRecords(items){return items.map(o=>({ref:o,id:o.id,x:o.x,z:o.z,w:o.w,d:o.d,alive:o.alive!==false}));}
function sameGeometry(items,records){if(!records||items.length!==records.length)return false;for(let i=0;i<items.length;i++){const o=items[i],r=records[i];if(o!==r.ref||o.id!==r.id||o.x!==r.x||o.z!==r.z||o.w!==r.w||o.d!==r.d||(o.alive!==false)!==r.alive)return false;}return true;}
function context(cf){
 const buildings=cf.buildings||[],castles=cf.teams?.length?cf.teams:cf.map?.castles||[],obstacles=cf.obstacles||[],b=bounds(cf),revision=cf.navigationRevision||0,frame=cf.elapsed??0;
 let c=contexts.get(cf);const checkStatic=!c||c.obstacleSource!==obstacles||c.obstacleCount!==obstacles.length||c.revision!==revision||c.frame!==frame;
 const changed=!c||c.revision!==revision||!sameGeometry(buildings,c.buildingGeometry)||!sameGeometry(castles,c.castleGeometry)||checkStatic&&!sameGeometry(obstacles,c.obstacleGeometry)||b.minX!==c.bounds.minX||b.maxX!==c.bounds.maxX||b.minZ!==c.bounds.minZ||b.maxZ!==c.bounds.maxZ;
 if(changed){
  const boxes=[...buildings,...castles,...obstacles].filter(shape),hash=new Map();for(let i=0;i<boxes.length;i++){const o=boxes[i];for(let x=Math.floor((o.x-o.w/2)/BUCKET);x<=Math.floor((o.x+o.w/2)/BUCKET);x++)for(let z=Math.floor((o.z-o.d/2)/BUCKET);z<=Math.floor((o.z+o.d/2)/BUCKET);z++){const key=`${x},${z}`,list=hash.get(key)||[];list.push(i);hash.set(key,list);}}
  const generation=(c?.generation||0)+1;
  c={signature:String(generation),generation,bounds:b,boxes,hash,buildingGeometry:geometryRecords(buildings),castleGeometry:geometryRecords(castles),obstacleGeometry:geometryRecords(obstacles),grids:new Map(),paths:new Map(),searches:c?.searches||0,expanded:c?.expanded||0,rebuilds:(c?.rebuilds||0)+1};contexts.set(cf,c);
 }
 Object.assign(c,{obstacleSource:obstacles,obstacleCount:obstacles.length,revision,frame});return c;
}
function nearby(c,a,b=a,r=0){const found=new Set();for(let x=Math.floor((Math.min(a.x,b.x)-r)/BUCKET);x<=Math.floor((Math.max(a.x,b.x)+r)/BUCKET);x++)for(let z=Math.floor((Math.min(a.z,b.z)-r)/BUCKET);z<=Math.floor((Math.max(a.z,b.z)+r)/BUCKET);z++)for(const i of c.hash.get(`${x},${z}`)||[])found.add(i);return [...found].map(i=>c.boxes[i]);}
function overlaps(p,o,r){return Math.abs(p.x-o.x)<o.w/2+r-EPS&&Math.abs(p.z-o.z)<o.d/2+r-EPS;}
function passable(c,p,r){return inside(c.bounds,p,r)&&!nearby(c,p,p,r).some(o=>overlaps(p,o,r));}
// Slab intersection of a swept body against the radius-inflated obstacle.
function segmentBox(a,b,o,r){let min=0,max=1;for(const axis of ['x','z']){const half=(axis==='x'?o.w:o.d)/2+r-EPS,lo=o[axis]-half,hi=o[axis]+half,delta=b[axis]-a[axis];if(Math.abs(delta)<EPS){if(a[axis]<=lo||a[axis]>=hi)return false;continue;}let enter=(lo-a[axis])/delta,leave=(hi-a[axis])/delta;if(enter>leave)[enter,leave]=[leave,enter];min=Math.max(min,enter);max=Math.min(max,leave);if(min>max)return false;}return max>=0&&min<=1;}
function clear(c,a,b,r,flying=false){return inside(c.bounds,a,r)&&inside(c.bounds,b,r)&&(flying||!nearby(c,a,b,r).some(o=>segmentBox(a,b,o,r)));}

export function castlePassable(cf,point,radius=.4,options={}){
 if(!cf||!finitePoint(point)||!Number.isFinite(radius)||radius<0)return false;const c=context(cf),flying=options.flying??point.flying??false;if(!inside(c.bounds,point,radius)||!flying&&!passable(c,point,radius))return false;
 if(options.ignoreUnits!==false)return true;return !(cf.units||[]).some(u=>u.alive&&u.id!==options.ignoreId&&u!==point&&!!u.flying===!!flying&&finitePoint(u)&&hypot(u,point)<castleNavigationRadius(u)+radius-EPS);
}

export function castleSegmentClear(cf,from,to,radius=.4,options={}){return !!(cf&&finitePoint(from)&&finitePoint(to)&&Number.isFinite(radius)&&radius>=0&&clear(context(cf),from,to,radius,options.flying??from.flying??false));}

export function castleSpawnPoint(cf,preferred,radius=.4,options={}){
 if(!cf||!finitePoint(preferred)||!Number.isFinite(radius)||radius<0)return null;const c=context(cf),flying=options.flying??preferred.flying??false,maxDistance=Number.isFinite(options.maxDistance)?Math.max(0,options.maxDistance):3,valid=p=>(flying?inside(c.bounds,p,radius):passable(c,p,radius))&&(options.ignoreUnits!==false||!(cf.units||[]).some(u=>u.alive&&u.id!==options.ignoreId&&u!==preferred&&!!u.flying===!!flying&&finitePoint(u)&&hypot(u,p)<castleNavigationRadius(u)+radius-EPS));
 if(valid(preferred))return{x:preferred.x,z:preferred.z};
 const candidates=[],step=.2;for(let r=step;r<=maxDistance+EPS;r+=step){const count=Math.max(16,Math.ceil(2*Math.PI*r/.2));for(let i=0;i<count;i++){const angle=Math.PI+i*2*Math.PI/count,p={x:preferred.x+Math.cos(angle)*r,z:preferred.z+Math.sin(angle)*r};if(valid(p))candidates.push(p);}if(candidates.length)break;}
 if(!candidates.length){const p={x:clamp(preferred.x,c.bounds.minX+radius,c.bounds.maxX-radius),z:clamp(preferred.z,c.bounds.minZ+radius,c.bounds.maxZ-radius)};if(hypot(p,preferred)<=maxDistance+EPS&&valid(p))candidates.push(p);}
 candidates.sort((a,b)=>hypot(a,preferred)-hypot(b,preferred)||(options.toward?hypot(a,options.toward)-hypot(b,options.toward):0)||a.x-b.x||a.z-b.z);return candidates[0]||null;
}

function gridFor(c,radius){const radiusKey=Math.ceil((radius-EPS)/.05)*.05,key=radiusKey.toFixed(3);let g=c.grids.get(key);if(g)return g;const b=c.bounds,minX=b.minX+radiusKey+.001,minZ=b.minZ+radiusKey+.001,nx=Math.floor((b.maxX-radiusKey-minX)/CELL)+1,nz=Math.floor((b.maxZ-radiusKey-minZ)/CELL)+1;g={radius:radiusKey,minX,minZ,nx,nz,walk:new Int8Array(Math.max(0,nx*nz))};c.grids.set(key,g);return g;}
const gridPoint=(g,id)=>({x:g.minX+(id%g.nx)*CELL,z:g.minZ+Math.floor(id/g.nx)*CELL});
function walkable(c,g,id){if(id<0||id>=g.walk.length)return false;if(!g.walk[id])g.walk[id]=passable(c,gridPoint(g,id),g.radius)?1:-1;return g.walk[id]===1;}
function anchor(c,g,p,r){const x=Math.round((p.x-g.minX)/CELL),z=Math.round((p.z-g.minZ)/CELL),candidates=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const nx=x+dx,nz=z+dz;if(nx<0||nx>=g.nx||nz<0||nz>=g.nz)continue;const id=nz*g.nx+nx,q=gridPoint(g,id);if(walkable(c,g,id)&&clear(c,p,q,r))candidates.push({id,distance:hypot(p,q)});}candidates.sort((a,b)=>a.distance-b.distance||a.id-b.id);return candidates[0]?.id??null;}
class Heap{constructor(){this.data=[];}push(n){const a=this.data;let i=a.push(n)-1;while(i){const parent=(i-1)>>1;if(a[parent].f<n.f||a[parent].f===n.f&&a[parent].id<=n.id)break;a[i]=a[parent];i=parent;}a[i]=n;}pop(){const a=this.data,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let child=i*2+1;if(child+1<a.length&&(a[child+1].f<a[child].f||a[child+1].f===a[child].f&&a[child+1].id<a[child].id))child++;if(a[child].f>last.f||a[child].f===last.f&&a[child].id>=last.id)break;a[i]=a[child];i=child;}a[i]=last;}return first;}}
function search(c,g,start,goal){
 const key=`${g.radius}:${start}:${goal}`;if(c.paths.has(key))return c.paths.get(key);c.searches++;const n=g.walk.length,cost=new Float64Array(n);cost.fill(Infinity);const previous=new Int32Array(n);previous.fill(-1);const closed=new Uint8Array(n),heap=new Heap(),end=gridPoint(g,goal);cost[start]=0;heap.push({id:start,f:hypot(gridPoint(g,start),end)});let expanded=0,found=false;
 while(heap.data.length&&expanded<Math.min(MAX_EXPANSIONS,n)){const {id}=heap.pop();if(closed[id])continue;closed[id]=1;expanded++;if(id===goal){found=true;break;}const x=id%g.nx,z=Math.floor(id/g.nx),a=gridPoint(g,id);for(const[dx,dz]of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=g.nx||nz<0||nz>=g.nz)continue;const next=nz*g.nx+nx;if(closed[next]||!walkable(c,g,next))continue;const point=gridPoint(g,next);if(!clear(c,a,point,g.radius))continue;const value=cost[id]+CELL*(dx&&dz?Math.SQRT2:1);if(value>=cost[next])continue;cost[next]=value;previous[next]=id;heap.push({id:next,f:value+hypot(point,end)});}}
 c.expanded+=expanded;let result=null;if(found){result=[];for(let id=goal;id!==-1;id=previous[id])result.push(gridPoint(g,id));result.reverse();}if(c.paths.size>=MAX_SHARED_PATHS)c.paths.delete(c.paths.keys().next().value);c.paths.set(key,result);return result;
}
function plan(c,u,goal,radius){const g=gridFor(c,radius),start=anchor(c,g,u,radius),end=anchor(c,g,goal,radius);if(start===null||end===null)return null;const path=search(c,g,start,end);if(!path)return null;return[...path.map(p=>({...p})),{...goal}];}

export function castleRouteAvailable(cf,from,to,radius=.4,options={}){
 if(!cf||!finitePoint(from)||!finitePoint(to)||!Number.isFinite(radius)||radius<0)return false;
 const c=context(cf),flying=options.flying??from.flying??false;
 if(!inside(c.bounds,from,radius)||!inside(c.bounds,to,radius)||!flying&&(!passable(c,from,radius)||!passable(c,to,radius)))return false;
 return clear(c,from,to,radius,flying)||!flying&&!!plan(c,from,to,radius);
}

export function moveCastleUnit(cf,u,destination,dt){
 if(!cf||!u||!finitePoint(u)||!finitePoint(destination)||!Number.isFinite(dt)||dt<=0||!Number.isFinite(u.speed)||u.speed<0)return false;u.moving=false;const c=context(cf),r=castleNavigationRadius(u),flying=!!u.flying,now=cf.elapsed??0;
 if(!inside(c.bounds,u,r)||!flying&&!passable(c,u,r)){const recovered=castleSpawnPoint(cf,u,r,{flying,maxDistance:Math.min(2.25,Math.max(.9,r*1.5))});if(!recovered){u.castleNavigationBlocked=true;return false;}u.x=recovered.x;u.z=recovered.z;unitPaths.delete(u);}
 const exact={x:clamp(destination.x,c.bounds.minX+r,c.bounds.maxX-r),z:clamp(destination.z,c.bounds.minZ+r,c.bounds.maxZ-r)};let goal=exact;if(!flying&&!passable(c,exact,r)){const saved=unitGoals.get(u),key=`${c.signature}:${r}:${exact.x}:${exact.z}:${destination.w||0}:${destination.d||0}`;if(saved?.key===key)goal=saved.point;else{goal=castleSpawnPoint(cf,exact,r,{maxDistance:Math.min(8,Math.max(3,(destination.w||0)/2+r+.4,(destination.d||0)/2+r+.4)),toward:u});unitGoals.set(u,{key,point:goal});}}
 if(!goal){u.castleNavigationBlocked=true;return false;}if(hypot(u,goal)<.12){u.castleNavigationBlocked=false;return true;}
 let path,following=null,indexBase=0;if(clear(c,u,goal,r,flying)){path=[goal];unitPaths.delete(u);}else{
  const key=`${Math.round(goal.x/CELL)},${Math.round(goal.z/CELL)}`,old=unitPaths.get(u),newIntent=old&&hypot(old.goal,goal)>4,stale=!old||old.signature!==c.signature||old.radius!==r||old.key!==key&&(now>=old.nextSearch||newIntent);
  if(stale){path=plan(c,u,goal,r);unitPaths.set(u,{signature:c.signature,radius:r,key,goal:{...goal},path,index:0,nextSearch:now+1});}else path=old.path;
  const record=unitPaths.get(u);if(!path){u.castleNavigationBlocked=true;return false;}let index=record.index;while(index<path.length-1&&hypot(u,path[index])<.16)index++;
  // Smooth only through verified clear segments; never cut an inflated corner.
  for(let next=Math.min(path.length-1,index+14);next>index;next--)if(clear(c,u,path[next],r)){index=next;break;}record.index=index;following=record;indexBase=index;path=path.slice(index);
 }
 let budget=u.speed*dt;for(let waypointIndex=0;waypointIndex<path.length;waypointIndex++){const point=path[waypointIndex];if(budget<=EPS)break;const d=hypot(u,point);if(d<EPS)continue;const step=Math.min(d,budget),next={x:u.x+(point.x-u.x)/d*step,z:u.z+(point.z-u.z)/d*step};if(!clear(c,u,next,r,flying)){unitPaths.delete(u);u.castleNavigationBlocked=true;return false;}const dx=next.x-u.x,dz=next.z-u.z;u.x=next.x;u.z=next.z;u.facing=Math.atan2(dx,dz);u.moving=true;budget-=step;if(step<d)break;if(following)following.index=Math.min(following.path.length-1,indexBase+waypointIndex+1);}
 u.castleNavigationBlocked=false;return hypot(u,goal)<.16;
}

export function castleNavigationInfo(cf){const c=context(cf);return{searches:c.searches,expanded:c.expanded,rebuilds:c.rebuilds,cachedPaths:c.paths.size,gridCount:c.grids.size};}
