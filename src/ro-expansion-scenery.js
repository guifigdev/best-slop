// Compact, merged voxel scenery: no individual meshes, lights or textures.
const cache=new Map();
export function roExpansionSceneryParts(style,p,variant=0){
 if(!['snow-village','toy-factory','clockwork','thanatos','snow-festival-tree','toy-train','toy-gifts','clock-gears','thanatos-spire'].includes(style))return null;
 const cacheKey=[style,p.stone,p.dark,p.wood,p.glow,variant%3].join(':');if(cache.has(cacheKey))return cache.get(cacheKey);
 const a=[],b=(x,y,z,w,h,d,c=p.stone,angle=0,lit=false)=>a.push([x,y,z,w,h,d,c,angle,lit]),wood=p.wood,dark=p.dark,gold=0xc7a56b,snow=0xe5eeed,red=0xa94848,green=0x458475;
 const wheel=(x,y,z,r,c=gold,segments=12)=>{for(let i=0;i<segments;i++){const q=i*Math.PI*2/segments;b(x+Math.sin(q)*r,y+Math.cos(q)*r,z,.28,.28,.20,c,q);if(i%3===0)b(x+Math.sin(q)*r*.42,y+Math.cos(q)*r*.42,z,.16,r*.8,.16,dark,-q);}b(x,y,z,.4,.4,.3,dark);};
 const gift=(x,z,c)=>{b(x,.7,z,1.2,1.2,1.2,c);b(x,.7,z,.18,1.25,1.25,gold);b(x,1.33,z,1.3,.16,1.3,c);b(x,1.48,z,.55,.20,.18,gold);};
 const finished=()=>{if(a.length>180)throw Error('Expansion scenery exceeds voxel budget');const result=Object.freeze(a.map(Object.freeze));cache.set(cacheKey,result);return result;};
 if(style==='snow-festival-tree'){b(0,2,0,.8,4,.8,wood);for(let level=0;level<7;level++){const w=5-level*.55;b(0,1.5+level*.6,0,w,.7,w,green);b(0,1.9+level*.6,0,w*.88,.15,w*.88,snow);for(const side of [-1,1])b(side*w*.4,1.6+level*.6,w*.4,.20,.25,.2,level%2?red:gold);}b(0,6,0,.6,.8,.6,gold,Math.PI/4,true);for(let i=0;i<4;i++)gift(Math.sin(i*Math.PI/2)*2.6,Math.cos(i*Math.PI/2)*2.6,i%2?red:green);return finished();}
 if(style==='toy-train'){for(let car=0;car<3;car++){const x=(car-1)*2.7,c=[red,green,0x5b82b1][car];b(x,1.2,0,2.5,.7,1.9,c);for(const side of [-1,1])for(const dx of [-.8,.8])wheel(x+dx,.55,side*1.0,.42,dark,8);if(car===0){b(x,2,0,1.8,1,1.6,red);b(x-.6,2.9,0,.4,.8,.4,gold);}else{b(x,2,-.7,2.4,.9,.15,c);b(x,2,.7,2.4,.9,.15,c);}b(x+1.35,.9,0,.4,.13,.13,gold);}return finished();}
 if(style==='toy-gifts'){for(let i=0;i<9;i++)gift((i%3-1)*1.7,(Math.floor(i/3)-1)*1.7,[red,green,0x628bbc][i%3]);return finished();}
 if(style==='clock-gears'){b(0,.3,0,6,.6,4,dark);for(let i=0;i<3;i++){const x=(i-1)*2,y=2.1+(i%2)*2;wheel(x,y,0,1.3);b(x,y*.5,-.3,.25,y,.3,wood);}for(let j=0;j<5;j++)b(0,1+j*.6,-1.2,5,.2,.2,gold);return finished();}
 if(style==='thanatos-spire'){for(let j=0;j<12;j++){const w=3.8-j*.18;b(0,.35+j*.65,0,w,.6,w,j%3?dark:p.stone);if(j%2===0)b(0,.4+j*.65,w*.5+.05,.25,.4,.1,p.glow,0,true);}for(let side of [-1,1])for(let j=0;j<4;j++)b(side*(2.4-j*.4),1+j*.45,1.6,.6,.4,1.3,p.stone);b(0,8.7,0,.8,2,.8,gold);return finished();}
 if(style==='snow-village'){
  b(0,.25,0,7,.5,6,dark);for(let i=0;i<7;i++){b(0,.8+i*.43,0,5.7,.39,4.7,i%2?wood:0x977358);for(const side of [-1,1])b(side*2.9,.8+i*.43,0,.4,.4,5,wood);}
  b(0,1.55,2.42,1.25,2.2,.15,dark);for(const side of [-1,1]){b(side*1.7,2.4,2.45,1.05,1.2,.16,p.glow,0,true);b(side*1.7,2.4,2.57,.08,1.3,.08,wood);b(side*1.7,2.4,2.57,1.2,.08,.08,wood);}
  for(let side of [-1,1])for(let i=0;i<7;i++){b(side*(i+.5)*.48,5.1-i*.25,0,.52,.28,5.8,red);b(side*(i+.5)*.48,5.32-i*.25,0,.55,.18,5.9,snow);}b(-1.8,5,-.8,.8,2,.8,dark);b(-1.8,6.1,-.8,1,.18,1,snow);gift(3.9,1.5,red);gift(-3.9,1.5,green);
  for(let side of [-1,1])for(let i=0;i<5;i++)b(side*(1+i*.5),3.8,2.9,.18,.18,.18,i%2?red:p.glow,0,i%2===0);
 }else if(style==='toy-factory'){
  b(0,.2,0,8,.4,6,dark);for(const side of [-1,1]){b(side*3.4,2,0,.5,4,5,red);b(side*3.4,4.2,0,.8,.35,5.5,gold);}b(0,4.5,-1.7,7.5,.55,1.3,green);b(0,3.9,-2.2,6,1.4,.3,wood);
  for(let i=0;i<10;i++)b((i-4.5)*.63,1.15,0,.56,.25,2.6,i%2?dark:0x9d9f91);for(const side of [-1,1])b(0,.75,side*1.5,7,.35,.2,gold);
  wheel(-2.9,3.1,2.2,.65);wheel(2.9,3.1,2.2,.65);for(let i=0;i<3;i++){const x=(i-1)*2;b(x,1.8,0,1.1,1.05,1, [red,green,0x547eae][i]);b(x,2.5,0,.7,.5,.7,0xe6cb9e);b(x,2.55,.4,.45,.08,.08,dark);b(x,2.95,0,1.1,.4,.9,red);for(const side of [-1,1])b(x+side*.6,1.9,0,.25,.7,.3,gold);}
  for(let side of [-1,1])for(let i=0;i<4;i++)gift(side*4.2,-1.5+i*1.2,i%2?red:green);
 }else if(style==='clockwork'){
  for(let j=0;j<3;j++)b(0,.25+j*.35,0,7-j*.5,.4,6-j*.5,dark);for(let i=0;i<10;i++){b(0,1.4+i*.62,0,4.7,.59,4.1,i%3?p.stone:dark);for(const side of [-1,1])b(side*2.4,1.4+i*.62,1.9,.35,.6,.35,gold);}
  const cy=6.0;for(let i=0;i<16;i++){const q=i*Math.PI/8;b(Math.sin(q)*1.65,cy+Math.cos(q)*1.65,2.22,.34,.35,.22,gold,-q);if(i%2===0)b(Math.sin(q)*1.26,cy+Math.cos(q)*1.26,2.28,.10,.3,.10,dark,-q);}b(0,cy,2.34,.12,2.1,.10,dark,-.22);b(.43,cy+.18,2.35,.95,.13,.1,dark,-.5);b(0,cy,2.41,.23,.23,.1,p.glow,0,true);
  wheel(-3.2,2.4,0,1.0);wheel(3.2,3.6,0,.9);b(0,8,0,5.6,.5,4.7,gold);for(let j=0;j<5;j++)b(0,8.45+j*.4,0,5-j*.8,.45,4-j*.65,dark);b(0,3,2.2,.16,2,.16,gold);b(0,2.1,2.25,.7,.7,.2,gold);
 }else{
  for(let j=0;j<4;j++)b(0,.15+j*.32,0,7-j*.5,.35,6-j*.4,j%2?p.stone:dark);
  for(const side of [-1,1]){for(let j=0;j<11;j++){b(side*2.7,1.4+j*.62,0,.9,.58,1.6,j%3?dark:p.stone);if(j%2===0)b(side*2.7,1.4+j*.62,.87,.15,.35,.09,p.glow,0,true);}for(let j=0;j<5;j++)b(side*(2.6-j*.45),7.7+j*.35,0,.7,.45,1.7,p.stone);for(let j=0;j<4;j++)b(side*3.6,2+j*1.4,-1.6,.55,2,.65,dark);b(side*3.6,8.5,-1.6,.3,2,.35,gold);}
  b(0,2.7,-1.7,3.4,3,.5,dark);b(0,4.3,-1.3,1.1,1.5,.3,p.glow,Math.PI/4,true);for(let i=0;i<7;i++)b((i-3)*.7,.65,2.1+Math.sin(i)*.2,.5,.6,.7,p.stone,i*.2);
 }
 if(a.length>180)throw Error('Expansion scenery exceeds voxel budget');const result=Object.freeze(a.map(Object.freeze));cache.set(cacheKey,result);return result;
}
