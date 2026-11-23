// Toy-factory-only substitutions. These are scenery, never monsters or pickups.
// All models fit the existing decoration bounds; the source colliders stay intact.
export const RO_TOY_FACTORY_ART_BUDGET=Object.freeze({smallParts:72,distantParts:18,extraDrawCalls:0,models:8});
export const RO_TOY_FACTORY_KINDS=Object.freeze(['gift-pile','train','rocking-horse','gingerbread','santa','candy-cane','nutcracker','cookie-pile']);
const models=new Map(),fitted=new WeakMap(),C=Object.freeze({red:0xb94c4d,redLight:0xd36059,redDark:0x8d3d43,green:0x467968,greenLight:0x66a18b,blue:0x638fb3,purple:0x8b709f,gold:0xe1bd72,cream:0xf1e4c6,white:0xf6eee1,wood:0xa77c50,dark:0x3b4143,dough:0xb77e4f,icing:0xffedce});
const hash=v=>{let n=7;for(const c of String(v))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;};
export function roToyFactoryKind(o,index=0){
 if(!o)return null;if(o.type==='scenery')return null;
 if(o.type==='regional-prop')return o.model==='toy-factory'?null:o.model==='toy-gifts'?'gift-pile':['toy-train','mine-wagon'].includes(o.model)?'train':null;
 if(!['weathered-rock','grave-marker','pillar','statue','boulder','stalagmite','basalt','sandstone','coastal-rock','runic-obelisk','crystal','arcane-crystal','snowbank'].includes(o.type))return null;
 const n=hash(o.id??index);if(o.type==='statue')return['santa','gingerbread','nutcracker'][n%3];if(['pillar','stalagmite','runic-obelisk'].includes(o.type))return['candy-cane','nutcracker','gift-pile'][n%3];if(o.type==='grave-marker')return n%2?'gingerbread':'santa';return['gift-pile','gift-pile','train','rocking-horse','gift-pile','gingerbread','cookie-pile','candy-cane'][n%8];
}
function model(kind,variant=0,distant=false){
 const key=kind+':'+variant+':'+distant;if(models.has(key))return models.get(key);const a=[],b=(x,y,z,w,h,d,c,angle=0,lit=false)=>a.push([x,y,z,w,h,d,c,angle,lit]);
 const gift=(x,y,z,size,c)=>{b(x,y+size*.5,z,size,size,size,c);b(x,y+size*.5,z,size*.14,size*1.02,size*1.02,C.gold);b(x,y+size*.5,z,size*1.02,size*1.02,size*.14,C.gold);b(x,y+size*1.03,z,size*1.08,size*.12,size*1.08,c);if(!distant){for(const s of [-1,1]){b(x+s*size*.19,y+size*1.17,z,size*.32,size*.13,size*.12,C.gold,s*.28);b(x+s*size*.25,y+size*1.24,z,size*.11,size*.12,size*.12,C.cream);}b(x,y+size*1.14,z,size*.18,size*.19,size*.21,C.gold);}};
 const wheel=(x,y,z,r)=>{b(x,y,z,r*1.6,r*1.2,.17,C.dark);b(x,y,z,r*1.2,r*1.7,.18,C.dark);b(x,y,z,r*.72,r*.72,.23,C.gold);b(x,y,z+.13,r*.25,r*.25,.04,C.red);};
 if(distant){gift(-.53,0,0,1.25,variant%2?C.green:C.red);gift(.63,0,.1,1.05,C.blue);gift(-.35,1.4,-.02,.9,C.redLight);}
 else if(kind==='gift-pile'){
  gift(-.68,0,-.45,1.2,variant%2?C.red:C.green);gift(.65,0,-.33,1.13,C.blue);gift(.09,0,.78,1.1,C.purple);gift(-.57,1.4,-.38,1.0,C.redLight);gift(.5,1.32,-.25,.83,C.greenLight);
 }else if(kind==='train'){
  b(0,.25,0,4.3,.23,1.6,C.redDark);b(-.43,.96,0,2.7,.95,1.34,C.green);for(const y of [.63,1.31])b(-.43,y,0,2.45,.2,1.05,C.greenLight);for(const x of [-1.42,-.43,.56])b(x,.96,0,.1,1.05,1.48,C.gold);
  b(1.13,1.3,0,1.27,1.85,1.58,C.red);b(1.13,2.32,0,1.59,.17,1.85,C.redDark);for(const side of [-1,1]){b(1.13,1.76,side*.81,.86,.65,.055,C.cream);b(1.13,1.76,side*.85,.65,.44,.025,C.blue);b(1.13,1.76,side*.87,.055,.49,.025,C.gold);}b(-1.08,1.91,0,.35,1.0,.39,C.dark);b(-1.08,2.45,0,.56,.18,.61,C.gold);b(-1.82,.96,0,.24,.72,1.13,C.red);b(-1.97,1.06,0,.12,.36,.36,C.gold,0,true);
  for(const side of [-1,1])for(const x of [-1.27,0,1.29])wheel(x,.45,side*.83,.38);for(const side of [-1,1])b(0,.43,side*1.0,3.3,.08,.08,C.gold);b(-2.16,.3,0,.45,.12,.5,C.gold);b(2.06,.3,0,.4,.12,.36,C.gold);for(const x of [-1.2,0,1.2])b(x,.05,0,.2,.1,2.1,C.wood);
 }else if(kind==='rocking-horse'){
  for(const side of [-1,1]){for(let i=0;i<5;i++)b((i-2)*.57,.14+Math.abs(i-2)*.1,side*.57,.6,.18,.18,C.redDark);for(const x of [-.88,.85]){b(x,.8,side*.4,.23,1.1,.25,C.wood);b(x,.31,side*.42,.31,.23,.33,C.dark);}}
  b(0,1.47,0,2.35,.8,.95,C.cream);b(-1.0,1.95,0,.66,1.28,.68,C.cream);b(-1.28,2.55,0,.93,.65,.64,C.wood);b(-1.64,2.4,0,.63,.42,.58,C.cream);for(const side of [-1,1]){b(-1.13,2.97,side*.19,.14,.36,.18,C.wood);b(-1.39,2.62,side*.335,.1,.1,.03,C.dark);b(-1.0,2.02,side*.39,.13,1.08,.08,C.red);b(.13,1.91,side*.41,.95,.16,.22,C.gold);}b(.13,1.95,0,1.05,.21,.98,C.green);for(let i=0;i<5;i++)b(-.69,2.42-i*.19,0,.2,.25,.72,i%2?C.redDark:C.red);for(let i=0;i<3;i++)b(1.29+i*.16,1.63-i*.25,0,.34,.35,.27,C.redDark);
 }else if(kind==='gingerbread'){
  const rows=[[[4,8]],[[3,9]],[[2,10]],[[2,10]],[[3,9]],[[4,8]],[[1,11]],[[0,12]],[[0,12]],[[1,11]],[[4,8]],[[4,8]],[[3,9]],[[2,5],[7,10]],[[2,5],[7,10]],[[1,5],[7,11]]],cell=.21;
  for(let row=0;row<rows.length;row++)for(const [start,end]of rows[row])b(((start+end)*.5-6)*cell,(rows.length-row-.5)*cell,0,(end-start+1)*cell,cell*.99,.38,row%4===0?0xcc9864:C.dough);
  for(const x of [-.4,.4]){b(x,2.73,.21,.17,.2,.055,C.icing);b(x,2.71,.25,.07,.1,.025,C.dark);}b(0,2.29,.23,.5,.08,.06,C.red);for(const side of [-1,1]){b(side*.3,2.37,.23,.09,.12,.055,C.icing);b(side*1.05,1.73,.22,.12,.39,.06,C.icing);b(side*.67,.22,.22,.4,.12,.06,C.icing);}for(let i=0;i<3;i++)b(0,1.89-i*.36,.23,.18,.18,.07,i%2?C.red:C.green);
 }else if(kind==='santa'||kind==='nutcracker'){
  const santa=kind==='santa',coat=santa?C.red:C.green;for(const side of [-1,1]){b(side*.29,.2,.13,.46,.28,.68,C.dark);b(side*.26,.59,0,.35,.65,.37,santa?C.redDark:C.cream);b(side*.66,1.56,0,.28,.93,.38,coat);b(side*.67,1.11,.08,.31,.21,.4,C.white);b(side*.68,.98,.1,.27,.23,.34,santa?C.green:C.wood);}
  for(let i=0;i<5;i++)b(0,1.09+i*.18,0,1.12-i*.07,.2,.66,i%3===0?C.redLight:coat);b(0,.99,.04,1.14,.15,.71,C.white);b(0,1.33,.05,1.05,.18,.7,C.dark);b(0,1.33,.42,.31,.23,.08,C.gold);b(0,1.33,.47,.16,.1,.035,C.dark);b(0,2.25,0,.72,.66,.62,0xe6bb8e);for(const side of [-1,1]){b(side*.16,2.34,.33,.09,.08,.035,C.dark);b(side*.32,2.19,.31,.16,.11,.055,C.redLight);}b(0,2.2,.37,.17,.16,.12,0xefc198);
  if(santa){for(let i=0;i<5;i++)b(0,2.13-i*.12,.32,.76-i*.12,.16,.22,i%2?C.cream:C.white);for(const side of [-1,1])b(side*.2,2.21,.42,.35,.12,.12,C.white);b(0,2.64,0,.87,.18,.76,C.white);for(let i=0;i<5;i++)b(i*.08,2.8+i*.15,0,.72-i*.11,.19,.62-i*.08,i%2?C.red:C.redLight);b(.43,3.43,.03,.31,.28,.3,C.white);for(const x of [-.39,.39])b(x,1.73,.36,.1,.56,.09,C.white);gift(.86,.35,.24,.55,C.green);}
  else{b(0,2.88,0,.92,.82,.77,C.dark);b(0,3.34,0,1.0,.13,.87,C.red);b(0,2.81,.41,.1,.52,.055,C.gold);for(let i=0;i<3;i++){b(0,1.68+i*.19,.37,.18,.07,.05,C.gold);b(0,2.06-i*.1,.38,.41-i*.08,.13,.13,C.cream);}for(const side of [-1,1]){b(side*.6,2.04,0,.43,.14,.63,C.gold);b(side*.2,2.3,.35,.29,.08,.04,C.dark);}b(0,2.04,.45,.42,.12,.08,C.white);}
 }else if(kind==='candy-cane'){
  gift(0,0,0,1.07,C.green);for(let j=0;j<14;j++)b(-.13,1.3+j*.19,0,.3,.19,.3,j%2?C.white:C.red);for(let i=0;i<9;i++){const a=Math.PI-i*Math.PI/8;b(.42+Math.cos(a)*.55,3.77+Math.sin(a)*.55,0,.28,.28,.3,i%2?C.white:C.red);}b(.97,3.57,0,.3,.4,.3,C.red);for(const side of [-1,1])b(-.13+side*.26,2.15,.2,.42,.16,.15,C.gold,side*.3);b(-.13,2.15,.23,.22,.25,.16,C.gold);
 }else{
  for(let layer=0;layer<4;layer++){const x=layer%2?.18:-.12,z=layer%2?-.1:.12,y=.16+layer*.32;b(x,y,z,1.5,.26,1.16,C.dough);b(x,y,z,1.18,.27,1.52,layer%2?0xd5a46b:0xc5915c);for(let j=0;j<4;j++)b(x+Math.sin(j*2.4)*.42,y+.15,z+Math.cos(j*2.4)*.42,.16,.035,.17,j%2?C.dark:C.redDark);}b(0,1.43,0,.75,.12,.15,C.icing);b(0,1.43,0,.15,.12,.75,C.icing);
 }
 const budget=distant?RO_TOY_FACTORY_ART_BUDGET.distantParts:RO_TOY_FACTORY_ART_BUDGET.smallParts;if(a.length>budget)throw Error('Toy model exceeds instance budget: '+kind+' '+a.length);const result=Object.freeze(a.map(Object.freeze));models.set(key,result);return result;
}

export function roToyFactoryParts(o,index=0,{distant=false}={}){
 const kind=roToyFactoryKind(o,index);if(!kind)return null;const variant=hash(o.id??index)%3,source=model(kind,variant,distant),cacheKey=String(distant);let cached=fitted.get(o);if(cached?.[cacheKey])return cached[cacheKey];
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;for(const [x,y,z,w,h,d,,a]of source){const ex=(Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*d)*.5,ez=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*d)*.5;minX=Math.min(minX,x-ex);maxX=Math.max(maxX,x+ex);minZ=Math.min(minZ,z-ez);maxZ=Math.max(maxZ,z+ez);minY=Math.min(minY,y-h*.5);maxY=Math.max(maxY,y+h*.5);}
 const width=maxX-minX,depth=maxZ-minZ,height=maxY-minY,yaw=o.yaw||0,c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw)),scale=Math.min(Math.max(.1,o.w||2)/(width*c+depth*s),Math.max(.1,o.d||2)/(width*s+depth*c),Math.max(.1,o.h||4)/height)*.98,cx=(minX+maxX)*.5,cz=(minZ+maxZ)*.5;
 const parts=Object.freeze(source.map(([x,y,z,w,h,d,color,angle,lit])=>Object.freeze([(x-cx)*scale,(y-minY)*scale,(z-cz)*scale,w*scale,h*scale,d*scale,color,angle,lit]))),result=Object.freeze({kind,parts});if(!cached)fitted.set(o,cached={});cached[cacheKey]=result;return result;
}
