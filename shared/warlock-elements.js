// Browser additions requested for this adaptation; these are not native Warlock1.02 spells.
const make=(key,name,column,family,description,{damage=0,cooldown=13,duration=4,slowDuration=1.25}={})=>Object.freeze({key,id:key,name,column,hotkey:column,family,kind:'active',target:'ground',maxLevel:5,maxRingLevel:7,learnCost:12,upgradeCost:6,costIncrement:1,browserExtension:true,wallLength:7,wallThickness:.7,slow:.4,slowDuration,description,ranks:Array.from({length:7},(_,i)=>({level:i+1,wallLength:7*Math.min(1,.6+i*.1),damage:damage?damage+i*.7:0,damageMax:damage?damage+i*.7:0,cooldown:Math.max(5,cooldown-i*.6),range:14*64,radius:.35*64,speed:12*64,duration:duration+i*.25,missiles:1})),provenance:{confirmed:[],adapted:['Browser extension requested by player; original balancing and voxel art']}});
export const WARLOCK_ELEMENT_SKILLS=Object.freeze({
 W_FIRE_WALL:make('W_FIRE_WALL','Parede de fogo','E','fireWall','Parede de chamas rotacionável. Empurra inimigos e aplica queimadura. Suas bolas de fogo que atravessam a parede ganham alcance renovado, tamanho e +20% de dano.',{duration:4,cooldown:14}),
 W_ICE_WALL:make('W_ICE_WALL','Parede de gelo','T','iceWall','Parede de gelo rotacionável. Aplica 40% de lentidão. Uma lança glacial despedaça a parede e deixa uma faixa que congela após exposição.',{duration:5,cooldown:15}),
 W_FROST_BOLT:make('W_FROST_BOLT','Lança glacial','D','frostBolt','Dispara uma lança de gelo que causa dano e aplica 40% de lentidão por 2,5s.',{damage:6,duration:2.5,cooldown:8})
});
export const isWarlockWall=family=>family==='fireWall'||family==='iceWall';
export function warlockWallContact(wall,from,to,padding=0){
 const angle=Number.isFinite(wall.angle)?wall.angle:0,s=Math.sin(angle),c=Math.cos(angle),local=p=>({x:(p.x-wall.x)*c-(p.z-wall.z)*s,z:(p.x-wall.x)*s+(p.z-wall.z)*c}),a=local(from),b=local(to),half={x:wall.thickness/2+padding,z:wall.length/2+padding};let enter=0,exit=1;
 for(const axis of ['x','z']){const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-10){if(Math.abs(a[axis])>half[axis])return null;}else{let first=(-half[axis]-a[axis])/delta,last=(half[axis]-a[axis])/delta;if(first>last)[first,last]=[last,first];enter=Math.max(enter,first);exit=Math.min(exit,last);if(enter>exit)return null;}}
 const side=Math.sign(a.x)||Math.sign(b.x)||1;return {fraction:enter,nx:c*side,nz:-s*side};
}
export function applyWarlockBurn(unit,source,time,duration=2){if((unit.wlMeteorBurnUntil||0)<=time)unit.wlMeteorBurnNextAt=time+.5;unit.wlMeteorBurnUntil=Math.max(unit.wlMeteorBurnUntil||0,time+duration);unit.wlMeteorBurnSource=source;}
export function applyWarlockFrost(unit,time,duration,slow=.4){const active=(unit.wlFrostUntil||0)>time;unit.wlFrostSlow=active?Math.max(unit.wlFrostSlow||0,slow):slow;unit.wlFrostUntil=Math.max(unit.wlFrostUntil||0,time+duration);}
export const warlockFrostFactor=(unit,time)=>(unit.wlFrostUntil||0)>time?1-Math.max(0,Math.min(.8,unit.wlFrostSlow||.4)):1;
