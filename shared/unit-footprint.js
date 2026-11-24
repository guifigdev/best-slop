// World-space body footprints shared by physics, navigation and selection.
// The classic four feet reach x=.455,z=.63 (radius .777), excluding equipment
// and wings. Native modes retain their authored smaller bodies/corridors.
export const UNIT_FOOTPRINT_PROFILES=Object.freeze({standard:Object.freeze({radius:.78,min:.2,max:1.6}),castle:Object.freeze({radius:.45,min:.2,max:2}),warlock:Object.freeze({radius:.47,min:.2,max:1.6,scaleSize:false}),bonk:Object.freeze({radius:.45,min:.2,max:1.6,scaleSize:false})});
const nativeModes=new Set(['castlefight','treetag','kodotag','phasekiller','bloody']);
export function unitFootprintRadius(unit,options){
 const explicit=unit?.collisionRadius;if(Number.isFinite(explicit)&&explicit>=.2&&explicit<=1.6)return explicit;
 const mode=options?.mode,profile=options?.profile;
 const native=unit?.castleUnit||unit?.castleBuilder||unit?.treeTagCharacter||unit?.treeTagSummon||unit?.treeTagWorker||unit?.kodoTagCharacter||unit?.kodoTagUnit||unit?.kodoTagKodo||unit?.pkCharacter||unit?.pkCreature;
 const key=profile||(mode==='bonk'||unit?.bonkHero||unit?.bonkEnemy?'bonk':mode==='warlock'||unit?.warlockCharacter?'warlock':nativeModes.has(mode)||native?'castle':'standard'),p=UNIT_FOOTPRINT_PROFILES[key]||UNIT_FOOTPRINT_PROFILES.standard,fallback=unit?.kind==='champion'?1.65:unit?.kind==='brute'?1.25:unit?.kind==='goblin'?.8:1,size=p.scaleSize===false?1:Number.isFinite(unit?.size)?Math.max(0,unit.size):fallback,base=key==='standard'&&(unit?.hero==='fenrir'||unit?.hero==='wolf')?1.45:p.radius;
 // Explicit native collisionRadius is already measured in world metres.
 const radius=Number.isFinite(unit?.collisionRadius)?unit.collisionRadius:base*size;return Math.max(p.min,Math.min(p.max,radius));
}
export function unitFootprint(unit,options){const radius=unitFootprintRadius(unit,options);return{shape:'circle',radius,width:radius*2,depth:radius*2};}
const same=(first,second)=>first!=null&&first===second;
export function unitsArePhysicalAllies(a,b){
 if(a?.team!=null&&b?.team!=null&&a.team===b.team)return true;
 if(same(a?.owner,b?.owner)||same(a?.owner,b?.summonOwner)||same(a?.summonOwner,b?.owner)||same(a?.summonOwner,b?.summonOwner))return true;
 return a?.summoner!=null&&a.summoner===b?.id||b?.summoner!=null&&b.summoner===a?.id;
}
export function unitHasPhysicalBody(u){return !!u&&u.alive!==false&&!u.noCollision&&!u.pkGhost&&!u.wlGhost&&!u.pkIllusion&&!u.treeTagCaptured&&!u.treeTagWaiting&&!u.kodoTagCaptured;}
const space=u=>u.cell?`cell:${u.cell.x}:${u.cell.z}:${u.cell.r}`:u.lineLane!==undefined?`line:${u.lineLane}`:u.challenge?`trial:${u.challenge}`:'world';
export function unitsPhysicallyCollide(a,b){return a!==b&&!(a?.id!=null&&a.id===b?.id)&&unitHasPhysicalBody(a)&&unitHasPhysicalBody(b)&&!!a.flying===!!b.flying&&space(a)===space(b)&&!(a.pkDimension&&b.pkDimension&&a.pkDimension!==b.pkDimension)&&((a.bonkEnemy&&b.bonkEnemy)||!unitsArePhysicalAllies(a,b));}

// Earliest hostile-body contact on a segment. Allies never enter this sweep;
// static walls remain the responsibility of the caller's existing solid sweep.
export function unitContactFraction(unit,from,to,others,radiusOf=unitFootprintRadius){
 const vx=to.x-from.x,vz=to.z-from.z,length=vx*vx+vz*vz;if(!Number.isFinite(length)||length<1e-12)return 1;let fraction=1;const r=radiusOf(unit),minX=Math.min(from.x,to.x),maxX=Math.max(from.x,to.x),minZ=Math.min(from.z,to.z),maxZ=Math.max(from.z,to.z);
 for(const other of others||[]){if(other===unit||!Number.isFinite(other.x)||!Number.isFinite(other.z))continue;const sum=r+radiusOf(other)-.0001;if(other.x<minX-sum||other.x>maxX+sum||other.z<minZ-sum||other.z>maxZ+sum||!unitsPhysicallyCollide(unit,other))continue;const dx=from.x-other.x,dz=from.z-other.z,c=dx*dx+dz*dz-sum*sum,dot=dx*vx+dz*vz;
  if(c<0){if(dot<0)fraction=0;continue;}if(dot>=0)continue;const discriminant=dot*dot-length*c;if(discriminant<0)continue;const hit=(-dot-Math.sqrt(discriminant))/length;if(hit>=0&&hit<fraction)fraction=Math.max(0,hit-1e-6);
 }return fraction;
}
