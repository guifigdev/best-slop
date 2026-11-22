const cache=new Map();
// Original stepped silhouettes. Bark and roots stay rigid; only the raised
// leaf clusters are marked for the shared GPU wind animation.
export function sceneryTreeArt(kind){
 if(cache.has(kind))return cache.get(kind);if(!['pine','birch'].includes(kind))return null;
 const birch=kind==='birch',trunk=[],leaves=[],wood=birch?0xd1d0b2:0x73533b;
 const box=(list,x,y,z,w,h,d,c)=>list.push(Object.freeze([x,y,z,w,h,d,c]));
 box(trunk,0,2.15,0,.48,4.3,.48,wood);box(trunk,-.17,1.75,-.14,.14,3.4,.16,birch?0xb1b39b:0x604532);box(trunk,.2,1.9,.16,.08,3.7,.16,birch?0xe6dfbf:0x96714d);
 for(const side of [-1,1]){box(trunk,side*.3,.12,0,.5,.24,.28,wood);box(trunk,0,.1,side*.3,.28,.2,.5,wood);box(trunk,side*.35,3.6,0,.65,.17,.2,wood);box(trunk,side*.58,3.78,0,.14,.45,.18,wood);}
 for(let i=0;i<8;i++){const y=.45+i*.45;box(trunk,i%2?.245:-.245,y,.04,.025,.07+(i%3)*.025,.18+(i%2)*.14,birch?0x6f6b57:0x4d3d2e);if(birch)box(trunk,(i%3-1)*.1,y+.15,.245,.17,.035,.02,0x807f68);}
 const palette=birch?[0x64834d,0x829c58,0x9fb96d,0xb8cb84]:[0x294d3c,0x3d6650,0x58805a,0x80a06c],cell=.32;
 for(let layer=0;layer<4;layer++){
  const radius=birch?[1.05,1.14,.91,.59][layer]:[1.08,.86,.62,.32][layer],y=birch?3.92+layer*.34:3.91+layer*.59;
  for(let iz=-4;iz<=4;iz++)for(let ix=-4;ix<=4;ix++){
   const x=ix*cell+(birch?Math.sin(layer*2)*.14:0),z=iz*cell,shape=(x*x/(radius*radius)+z*z/(radius*radius*.85)),hash=((ix*19+iz*31+layer*13)%11+11)%11;
   if(shape>1||shape>.7&&hash<2)continue;
   const h=birch?.36+(hash%3)*.075:.48+(hash%3)*.07,light=Math.min(3,layer>1?2+(hash%3===0?1:0):hash%5===0?2:layer===0?0:1);
   box(leaves,x,y+(hash%2)*.04,z,cell+.035,h,cell+.035,palette[light]);
  }
 }
 const result=Object.freeze({trunk:Object.freeze(trunk),leaves:Object.freeze(leaves),parts:Object.freeze([...trunk,...leaves])});cache.set(kind,result);return result;
}
