// Small authored voxel landmarks for sand and flooded-cave habitats.
export function habitatSceneryParts(type,p,variant=0){
 if(!['sand-pyramid','sand-gate','desert-well','coastal-wreck','coral-garden','coastal-arch'].includes(type))return null;
 const parts=[],b=(x,y,z,w,h,d,c,a=0,lit=false)=>parts.push([x,y,z,w,h,d,c,a,lit]),sand=0xc8aa73,edge=0x9d7f51,light=0xe2c891,wood=0x795b40;
 if(type==='sand-pyramid'){for(let i=0;i<10;i++){const w=9-i*.74;b(0,.25+i*.48,0,w,.5,w,i%3===0?light:sand);}b(0,1.35,4.4,1.5,2.5,.15,0x564d3b);b(0,2.7,4.45,2.1,.4,.25,edge);for(const side of [-1,1]){b(side*3.5,.35,4.4,1,.7,1,sand);b(side*3.5,1.15,4.4,.65,1,.65,edge);b(side*3.5,1.8,4.4,.85,.3,.85,light);}}
 if(type==='sand-gate'||type==='coastal-arch'){const c=type==='sand-gate'?sand:p.stone;for(const side of [-1,1]){for(let i=0;i<7;i++)b(side*3.3,.4+i*.7,0,1.5,.68,1.8,i%3===0?p.dark:c);b(side*2.6,5.1,0,2.9,.75,1.9,c);}b(0,5.5,0,3.3,.7,1.8,c);for(let i=0;i<7;i++)b(-2.4+i*.8,5.9+Math.sin(i*1.5)*.08,0,.72,.18,1.7,type==='sand-gate'?light:p.dark);}
 if(type==='desert-well'){for(let i=0;i<16;i++){const a=i*Math.PI/8;b(Math.sin(a)*1.7,.42,Math.cos(a)*1.7,.7,.7,.7,i%3? sand:edge);}b(0,.18,0,2.8,.12,2.8,0x467e87);for(const x of [-2.6,2.6])b(x,1.8,0,.3,3.6,.3,wood);b(0,3.6,0,6,.3,.5,wood);for(let i=0;i<5;i++)b(0,2.2+i*.23,0,.06,.25,.06,0xbfa77b);b(0,1.8,0,.7,.7,.7,wood);}
 if(type==='coastal-wreck'){for(const side of [-1,1])for(let i=0;i<8;i++){const z=(i-3.5)*1.05,w=2.8-Math.abs(i-3.5)*.32;for(let j=0;j<3;j++)b(side*(w-j*.25),.4+j*.42,z,.3,.5,.9,j%2?wood:p.wood,side*.15);}for(let i=0;i<7;i++)b((i-3)*.7,.2,0,.6,.18,8.4,wood);b(.5,3,-1,.35,5.8,.35,p.wood,.1);b(.5,4,-1,5.8,.25,.25,wood,.1);for(let i=0;i<4;i++)b(-1.2+i*.65,3.4-i*.3,-1,.6,1.4,.08,0xaca68d);}
 if(type==='coral-garden'){for(let i=0;i<13;i++){const x=Math.sin(i*2.4)*3.8,z=Math.cos(i*2.1)*3.4,h=.6+(i%5)*.36,c=[0xd0868c,0x8b9ab7,0xdaa98c][i%3];b(x,h*.5,z,.24,h,.3,c);for(const side of [-1,1]){b(x+side*.3,h*.68,z,.55,.18,.25,c);b(x+side*.55,h*.85,z,.18,h*.6,.23,c);}b(x,.12,z,.8,.18,.8,p.stone);}}
 return parts;
}
