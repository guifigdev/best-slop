// Volumetric sculptures and habitat props, in the existing terrain batches.
// All six props together stay below 600 boxes and add no draw calls/colliders.
const cache=new Map();
export function roMvpDomainParts(theme,variant=0){
 const key=theme+':'+variant;if(cache.has(key))return cache.get(key);const parts=[],b=(x,y,z,w,h,d,c,lit=false)=>parts.push([x,y,z,w,h,d,c,0,lit]);
 const stone=0x595665,dark=0x2d2938,gold=0xcba05d,wood=0x694836,ice=0x97d9e8;
 const base=(c=stone)=>{b(0,.25,0,4,.5,3.5,c);b(0,.65,0,3.2,.3,2.8,c);};
 const fang=(x,z,c=0xddd4ad,scale=1)=>{for(let i=0;i<7;i++)b(x+i*.1,1+i*.48,z,(1.2-i*.14)*scale,.52*scale,(1-i*.1)*scale,c);};
 const flame=(x,y,z,c=0xef8a3d)=>{for(let i=0;i<4;i++)b(x+Math.sin(i)*.2,y+i*.55,z,1-i*.18,.7,1-i*.18,c,true);};
 if(theme==='hive'){
  b(0,2.3,0,.65,4.6,.65,wood);for(let row=0;row<5;row++)for(let col=0;col<4;col++){const x=(col-1.5)*.85+(row%2)*.3,y=3+row*.7;b(x,y,0,.84,.65,1.5,col===1&&row===2?0x4d3528:0xb88a3b);b(x,y,.81,.57,.42,.08,0xeac65d);}for(const side of [-1,1]){b(side*2.2,.3,1.4,1.5,.5,1.5,0xc2a64b);b(side*2.2,.6,1.4,.9,.25,.9,0xf0d374);}
 }else if(['tiger','wolf','ice-wolf'].includes(theme)){
  const c=theme==='ice-wolf'?ice:theme==='tiger'?0xbf7c42:0x68546a;base(c);for(const side of [-1,1]){fang(side*1.6,0,c,1.2);b(side*1.7,1.4,1.4,.7,1.1,.8,c);for(let i=0;i<3;i++)b(side*1.7+(i-1)*.26,.95,1.95,.18,.4,.7,0xe4dcba);}b(0,2,0,1.7,1.2,1.8,c);b(0,2.1,1,.9,.65,.8,c);for(const side of [-1,1]){b(side*.65,2.95,0,.5,.9,.6,c);b(side*.45,2.3,.94,.25,.2,.1,theme==='ice-wolf'?0xd9ffff:0xf1b458,true);}if(theme==='tiger')for(let i=0;i<3;i++)b(0,2.1+i*.25,1.42,.8,.1,.06,dark);
 }else if(['maw','demon','horns'].includes(theme)){
  base(dark);for(const side of [-1,1]){fang(side*1.6,0,theme==='maw'?0xc6ad73:dark,1.3);b(side*.65,2.4,.8,.4,.35,.18,0xd76c63,true);}b(0,1.9,0,2.3,1.9,1.8,theme==='maw'?0xb89b70:stone);for(let i=0;i<5;i++)b((i-2)*.35,1.15,1,.2,.6,.3,0xe1d2b2);if(theme==='horns')for(let i=0;i<9;i++){const a=i*Math.PI*2/9;b(Math.sin(a)*2.6,.2,Math.cos(a)*2.6,.5,.2,.5,0xad565c,true);}
 }else if(theme==='tomb'){
  base(0xa39164);for(let i=0;i<9;i++){b(0,1.1+i*.52,0,1.7-i*.09,.54,1.7-i*.09,i%3===0?gold:0x9d8259);if(i%2===0)b(0,1.1+i*.52,.92,.55,.25,.08,0xf0d084,true);}b(2,1.2,.5,1.2,.7,2.5,0x9d8259);b(2,1.65,.5,1,.2,2.1,gold);
 }else if(theme==='volcano'){
  base(0x403b3c);for(let i=0;i<6;i++){const a=i*Math.PI/3;b(Math.sin(a)*1.5,1.2,Math.cos(a)*1.5,1.1,2.2,1.1,0x54413c);flame(Math.sin(a),2.3,Math.cos(a));}b(0,.9,0,2.7,.5,2.7,0xffb34c,true);
 }else if(['sword','samurai'].includes(theme)){
  base(dark);b(0,3.2,0,.65,4.8,.35,0xb0b4cc);b(0,5.7,0,.28,.4,.28,0xebe6da);b(0,1.8,0,2.6,.25,.6,gold);for(const side of [-1,1]){b(side*1.9,2.7,-.4,.18,5.1,.18,wood);b(side*1.9,4.6,-.4,1.1,1.8,.12,theme==='samurai'?0xa84649:0x644c87);b(side*1.9,4.6,-.3,.2,1.3,.08,gold);}
 }else if(['wings','bishop'].includes(theme)){
  base(theme==='wings'?0xc3c3b3:stone);b(0,2.6,0,1.2,3.9,1.2,theme==='wings'?gold:dark);b(0,4.1,.7,.4,2.4,.3,gold);b(0,4.5,.7,1.9,.4,.3,gold);for(const side of [-1,1])for(let i=0;i<6;i++)b(side*(.8+i*.36),3.4+i*.35,-.2,.48,2.8-i*.35,.5,theme==='wings'?0xe2dac0:0x645775);for(const side of [-1,1])flame(side*2.2,1.1,1.2,theme==='bishop'?0xa7a4df:0xffd993);
 }else if(theme==='shell'){
  base(0x758868);for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++)if(row*row+col*col<=5)b(col*.75,1.4+(4-row*row-col*col)*.15,row*.7,.78,.6,.75,(row+col)%2?0x7f9c70:0xa5b47e);b(0,1.2,2,.7,.8,1.3,0xb0bb8a);
 }else if(theme==='wreck'){
  for(let i=0;i<7;i++)b((i-3)*.65,.7+i%2*.15,0,.58,1.1,2.5-Math.abs(i-3)*.25,wood);b(0,3.2,0,.25,5.8,.25,wood);b(0,5.2,0,3,.2,.2,dark);for(let i=0;i<4;i++)b(0,4.8-i*.5,.2,2.5-i*.25,.48,.08,0xa5a59b);b(1.6,1.3,1.5,.25,2.2,.3,stone);b(1.6,.6,1.5,1.6,.25,.35,stone);
 }else if(theme==='fox-shrine'){
  for(const side of [-1,1]){b(side*1.6,2.5,0,.45,5,.6,0xa85444);b(side*1.6,4.1,.8,.8,1,.8,0xf3d198,true);}b(0,4.8,0,4.4,.4,.9,0x9e4d42);b(0,5.3,0,5,.3,1.1,dark);for(let i=0;i<3;i++)b((i-1)*.8,3.9,.1,.25,.8,.1,0xe9d9b9);
 }else if(theme==='laboratory'){
  base(stone);for(const side of [-1,1]){b(side*1.1,2,0,1.5,2.8,1.5,0x61888c);b(side*1.1,2,.8,1.1,2,.12,0x9ad3bd,true);for(const y of [.8,3.4])b(side*1.1,y,0,1.8,.3,1.8,dark);}b(0,4,0,.25,1.5,.25,gold);
 }else if(theme==='frost-toys'){
  base(ice);for(const side of [-1,1]){b(side*1.25,1.4,0,1.8,1.6,1.7,side<0?0xa95765:0x708d9c);b(side*1.25,2.2,0,2,.25,1.9,0xd0e6e7);b(side*1.25,1.45,.9,.25,1.7,.12,gold);}for(let i=0;i<3;i++)fang((i-1)*.8,-1,ice,.7);
 }else if(theme==='thorn'){
  base(dark);for(let i=0;i<12;i++){const a=i*.5;b(Math.sin(a)*(.5+i*.08),1+i*.4,Math.cos(a)*.5,.5,.6,.5,0x66526c);if(i%2===0)b(Math.sin(a)*1.3,1.3+i*.4,Math.cos(a),.7,.18,.6,0x996e9b);}b(0,3,0,.7,1.5,.7,0xbe91cf,true);
 }
 const result=Object.freeze(parts.map(Object.freeze));cache.set(key,result);return result;
}
