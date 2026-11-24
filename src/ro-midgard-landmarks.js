// Voxel studies of the original Midgard city silhouettes. Cached parts join
// the existing terrain batches; no mesh, light or texture per landmark.
export const RO_MIDGARD_MODELS=Object.freeze({
 'alberta-harbor':['alberta-ship','alberta-crane','alberta-lighthouse','alberta-warehouse'],
 'turtle-island':['turtle-shell-shrine','turtle-nest','coral-arch','island-mooring'],
 'amatsu-sakura':['amatsu-castle','amatsu-torii','sakura-garden','amatsu-bridge'],
 'comodo-beach':['comodo-cavemouth','comodo-shell-stage','comodo-stilt-house','comodo-drum-circle'],
 'umbala-canopy':['umbala-treehouse','umbala-mask-gate','wootan-drums','umbala-root-shrine'],
 'niflheim-hollows':['niflheim-house','pumpkin-cart','ghost-bell-tower','niflheim-dead-arch']
});
Object.values(RO_MIDGARD_MODELS).forEach(Object.freeze);
const known=new Set(Object.values(RO_MIDGARD_MODELS).flat()),cache=new Map();
export function roMidgardLandmarkParts(model,p,variant=0){
 if(!known.has(model))return null;
 const key=[model,p.stone,p.dark,p.wood,p.grass,p.glow,variant%3].join(':');if(cache.has(key))return cache.get(key);
 const parts=[],b=(x,y,z,w,h,d,c=p.stone,a=0,lit=false)=>parts.push([x,y,z,w,h,d,c,a,lit]),wood=p.wood,dark=p.dark,cream=0xe6d6ae,blue=0x527b98,red=0xa84e42,gold=0xd5ad62;
 const stairs=(w=6,d=4)=>{for(let j=0;j<4;j++)b(0,.12+j*.20,j*.45,w-j*.4,.25+j*.35,d-j*.8,j%2?p.stone:dark);};
 const roof=(x,y,z,w,d,c=blue)=>{for(const side of [-1,1])for(let j=0;j<5;j++)b(x+side*(j+.5)*w/10,y+(4-j)*.26,z,w/10+.08,.30,d+.2,c);};
 const crate=(x,z,c=wood)=>{b(x,.55,z,1.05,1.05,1.05,c);for(const side of [-1,1]){b(x+side*.44,.55,z,.1,1.15,1.12,dark);b(x,.55,z+side*.54,1.1,.1,.08,gold);}};
 const lantern=(x,y,z)=>{b(x,y,z,.65,.9,.65,0xf3cc86,0,true);for(const dy of [-.49,.49])b(x,y+dy,z,.8,.12,.8,red);b(x,y-.8,z,.10,.55,.10,gold);};
 const pumpkin=(x,y,z,s=1)=>{for(let j=0;j<7;j++){const a=j*Math.PI*2/7;b(x+Math.sin(a)*s*.22,y,z+Math.cos(a)*s*.22,s*.63,s*.85,s*.63,j%2?0xd87931:0xe9933d,a);}b(x,y+s*.53,z,.16*s,.35*s,.16*s,0x617745);for(const side of [-1,1])b(x+side*s*.22,y+s*.1,z+s*.50,.16*s,.2*s,.04*s,p.glow,side*.25,true);b(x,y-s*.18,z+s*.51,s*.45,.09*s,.04*s,p.glow,0,true);};
 if(model==='alberta-ship'){
  for(let i=0;i<13;i++){const x=(i-6)*.62,width=3.2-Math.abs(i-6)*.30;b(x,1,0,.65,.95,width,wood);b(x,1.58,0,.65,.22,width+.08,cream);for(const side of [-1,1])b(x,2.0,side*width*.5,.66,.7,.16,wood);}
  for(const x of [-2,1.5]){b(x,4.5,0,.20,6,.20,wood);b(x,6.4,0,3,.14,.14,dark);for(let j=0;j<6;j++)b(x,5.9-j*.4,.13,2.8-Math.abs(j-2.5)*.18,.43,.10,cream);b(x+1.1,7.9,0,1.1,.4,.08,blue);}
  b(-3.1,2.5,0,1.4,1.1,2.1,blue);roof(-3.1,3.2,0,1.7,2.4);for(const side of [-1,1])b(3.6,2.1,side*.85,.15,.15,2.7,wood,side*.35);b(4.25,2.15,0,1.5,.15,.16,wood);
  for(let j=0;j<8;j++)b((j-3.5)*.8,.25,3.1,.75,.3,1.1,wood);for(const x of [-3,3])b(x,.8,3.4,.25,1.5,.25,dark);
 }else if(model==='alberta-crane'){
  stairs(6,4);for(const x of [-1.5,1.5])b(x,3.2,0,.38,5.2,.38,wood);b(0,5.7,0,5.8,.45,.6,wood);for(let j=0;j<6;j++)b(-1.7+j*.55,3.1+j*.4,0,.65,.25,.35,gold,.62);b(2.4,3.7,0,.08,3.5,.08,dark);b(2.4,1.9,0,.8,.2,.45,dark);for(let j=0;j<4;j++)crate(-2+j*1.3,1.6);crate(-1.4,-1.5);crate(0,-1.5);
 }else if(model==='alberta-lighthouse'){
  for(let j=0;j<11;j++){const w=3.5-j*.13;b(0,.35+j*.55,0,w,.56,w,j%3?cream:p.stone);if(j===3||j===7)b(0,.43+j*.55,w*.51,.45,.8,.05,blue);}b(0,6.5,0,3.9,.3,3.9,blue);for(const x of [-1.1,1.1])for(const z of [-1.1,1.1])b(x,7.25,z,.18,1.3,.18,wood);b(0,7.25,0,1.5,1.0,1.5,p.glow,0,true);roof(0,8.0,0,4.3,4.1);b(0,9.3,0,.15,.8,.15,gold);
 }else if(model==='alberta-warehouse'){
  b(0,.25,0,7,.5,5.7,p.stone);b(0,2.1,0,6.3,3.4,4.8,cream);for(const x of [-2.9,0,2.9])b(x,2.2,2.46,.18,3.8,.18,wood);b(0,1.8,2.48,1.9,2.8,.08,dark);for(const x of [-2,2])b(x,2.8,2.49,1.0,1.1,.08,blue);roof(0,4.2,0,7.3,5.8);crate(3.9,1.2);crate(-3.8,1.3);
 }else if(model==='turtle-shell-shrine'){
  stairs(8,5);for(let j=0;j<5;j++){const w=6.9-j*.9;b(0,1.3+j*.48,0,w,.58,w*.8,j%2?0x769264:0x547b5e);}for(let j=0;j<7;j++){const a=j*Math.PI*2/7;b(Math.sin(a)*2.45,2.0,Math.cos(a)*1.9,.17,1.5,.65,dark,-a);}for(const side of [-1,1])b(side*2.4,.6,2.0,1.8,.5,1.0,0xb9b78b,side*.35);b(0,1.4,3.2,1.4,1,1.4,0x849b70);b(0,4.4,0,.9,.8,.9,p.glow,Math.PI/4,true);
 }else if(model==='turtle-nest'){
  for(let j=0;j<15;j++){const a=j*Math.PI*2/15;b(Math.sin(a)*2.7,.4,Math.cos(a)*2.1,.65,.45,.8,0xbba572,-a);}for(let j=0;j<5;j++){const x=(j%3-1)*1.1,z=Math.floor(j/3)*1.2-.5;b(x,.7,z,.8,1.1,.8,cream);b(x,1.25,z,.6,.18,.6,0xefe3bf);}for(let side of [-1,1])for(let j=0;j<4;j++)b(side*(2.2+j*.4),.3+j*.25,-1.8,.8,.16,.4,p.grass,side*.4);
 }else if(model==='coral-arch'){
  for(const side of [-1,1])for(let j=0;j<7;j++){const x=side*(2.5-Math.max(0,j-3)*.38);b(x,.4+j*.65,0,.8,.75,.9,j%2?0xa67ca7:0xd39b9a);if(j%2===0)b(x+side*.55,.7+j*.65,0,1.2,.22,.6,0xe1b8b1);}b(0,4.7,0,1.1,.65,.85,0xa67ca7);for(let j=0;j<5;j++)b((j-2)*1.3,.15,1.6,1,.25,.8,0xdbcc9a);
 }else if(model==='island-mooring'){
  for(let j=0;j<12;j++)b((j-5.5)*.55,.65,0,.52,.25,3,wood);for(const x of [-2.5,2.5])for(const z of [-1.25,1.25]){b(x,.6,z,.25,1.5,.25,dark);b(x,1.45,z,.5,.2,.5,cream);}for(let j=0;j<7;j++){const w=1.7-Math.abs(j-3)*.25;b((j-3)*.5,.4,2.9,.5,.45,w,wood);}crate(-1,0);b(2.5,2.5,-1.25,.15,2.7,.15,wood);b(3.0,3.2,-1.25,1,.65,.10,0xe5c491);
 }else if(model==='amatsu-castle'){
  stairs(8,6);for(let level=0;level<3;level++){const w=6.2-level*1.5,y=1.3+level*2.1;b(0,y+.7,0,w,1.65,w*.72,0xf0e8d3);for(const x of [-w*.36,w*.36]){b(x,y+.65,w*.365,.32,.85,.05,dark);b(x,y+.65,w*.395,.06,.9,.04,wood);}roof(0,y+1.7,0,w+1.9,w*.8+1.0,0x486b68);for(const side of [-1,1])b(side*(w*.5+.75),y+2.05,0,.65,.18,w*.8+1,0x486b68,side*.2);}b(0,8.7,0,.15,1.0,.15,gold);
 }else if(model==='amatsu-torii'){
  for(const side of [-1,1]){b(side*2.5,2.6,0,.5,5.2,.5,red);b(side*2.5,.35,0,.8,.7,.8,dark);lantern(side*3.9,1.6,1.1);b(side*3.9,.7,1.1,.22,1.3,.22,p.stone);}b(0,4.8,0,6.2,.32,.65,red);b(0,5.7,0,7,.4,.8,dark);for(const side of [-1,1])b(side*3.6,5.85,0,1.1,.22,.8,dark,side*.12);b(0,5.1,.44,.65,.9,.07,gold);
 }else if(model==='sakura-garden'){
  b(0,2.5,0,.65,5,.65,wood);for(const side of [-1,1])b(side*.85,3.7,0,2.5,.35,.4,wood,side*.4);for(let j=0;j<11;j++){const a=j*2.4,r=1.4+(j%3)*.4;b(Math.sin(a)*r,4.7+(j%3)*.55,Math.cos(a)*r,2.4,.9,2.1,[0xe7a7bb,0xf1c4d0,0xc983a2][j%3],j*.4);}for(let j=0;j<9;j++)b(Math.sin(j*2.4)*3.1,.07,Math.cos(j*2.4)*2.8,.3,.04,.18,0xeeb4c8,j);b(0,.25,3,5,.45,1.2,p.stone);
 }else if(model==='amatsu-bridge'){
  for(let j=0;j<13;j++){const x=(j-6)*.55,y=.3+Math.sin(j*Math.PI/12)*.9;b(x,y,0,.55,.2,2.7,wood);for(const side of [-1,1]){b(x,y+.75,side*1.4,.08,1.1,.08,red);b(x,y+1.3,side*1.4,.62,.13,.13,red);}}for(const side of [-1,1]){b(side*3.8,2.2,1.5,.17,3.8,.17,wood);lantern(side*3.8,3.3,1.5);}
 }else if(model==='comodo-cavemouth'){
  for(const side of [-1,1])for(let j=0;j<7;j++)b(side*(3.4-Math.max(0,j-2)*.4),.5+j*.7,0,1.5,1,3.4,j%3?p.stone:dark,side*.13);b(0,5.3,0,3.1,1.2,3.8,dark);for(const side of [-1,1]){b(side*3,1.3,2.1,.2,2.2,.2,wood);b(side*3,2.5,2.1,.45,.65,.45,p.glow,0,true);}for(let j=0;j<5;j++)b((j-2)*1.2,.15,1.4,1,.3,1.5,p.stone);
 }else if(model==='comodo-shell-stage'){
  stairs(8,5);for(let j=0;j<15;j++){const a=(j/14-.5)*Math.PI,x=Math.sin(a)*3,y=1.7+Math.cos(a)*3;b(x,y,-1,.4,1.2,1.0,j%2?0xe1bdac:0xc99f9e,-a);}b(0,1.15,0,6.5,.35,3.8,0xd3b68d);for(const side of [-1,1])b(side*3.6,1.8,1.6,.5,2.5,.5,wood);lantern(-3.6,3.1,1.6);lantern(3.6,3.1,1.6);
 }else if(model==='comodo-stilt-house'){
  for(const x of [-2.4,2.4])for(const z of [-1.6,1.6])b(x,1.1,z,.38,2.2,.38,wood);b(0,2.2,0,5.7,.25,4);for(const side of [-1,1])b(side*2.5,3.2,0,.25,2,3.8,wood);b(0,3.2,-1.8,5,2,.25,wood);for(let j=0;j<7;j++)roof(0,4.4+j*.07,0,6.5-j*.08,4.8-j*.07,0xb89c62);b(0,2.3,2.3,2,.2,2.2,wood);for(let j=0;j<5;j++)b(0,1.9-j*.35,3+j*.35,1.8,.2,.5,wood);
 }else if(model==='comodo-drum-circle'||model==='wootan-drums'){
  const tribal=model==='wootan-drums';for(let j=0;j<5;j++){const a=j*1.2566,x=Math.sin(a)*2.4,z=Math.cos(a)*2.1,h=1.2+(j%3)*.35;b(x,h*.5,z,.95,h,.95,tribal?0x8b5941:wood,a);b(x,h,z,1.05,.13,1.05,cream);for(const side of [-1,1])b(x+side*.4,h*.5,z,.08,h,.1,gold);}for(const side of [-1,1]){b(side*3.5,2.2,-1.5,.3,4.4,.3,wood);lantern(side*3.5,4,-1.5);}if(tribal){b(0,2.3,-1.8,1.2,2.8,.35,0xc7995e);for(const side of [-1,1])b(side*.3,2.7,-1.59,.16,.3,.05,dark);b(0,2.0,-1.56,.45,.25,.08,dark);}
 }else if(model==='umbala-treehouse'){
  for(let j=0;j<10;j++)b(Math.sin(j*.4)*.15,.4+j*.65,0,1.6-j*.06,.7,1.5-j*.05,j%3?wood:dark);for(const side of [-1,1])b(side*1.1,1,0,2.7,.6,.8,wood,side*.22);b(0,4.4,0,6.8,.3,5);for(const side of [-1,1])b(side*2.5,5.3,0,.2,1.8,3.7,wood);b(0,5.3,-1.7,5,1.8,.2,wood);roof(0,6.4,0,6.9,5.3,0x7d8b50);for(let j=0;j<10;j++){b(-2.9,4.2-j*.38,1.8,.85,.13,.3,cream);for(const side of [-1,1])b(-2.9+side*.55,2.3,1.8,.10,4.8,.10,wood);}for(let j=0;j<6;j++){const a=j*Math.PI/3;b(Math.sin(a)*2.1,8.0+(j%2)*.6,Math.cos(a)*1.8,3,.9,2.8,p.grass,a);}
 }else if(model==='umbala-mask-gate'){
  for(const side of [-1,1]){b(side*2.7,2.4,0,.8,4.8,.8,wood);b(side*2.7,3.8,.55,1.25,1.8,.3,0xbf965a);for(const eye of [-1,1])b(side*2.7+eye*.28,4.1,.74,.22,.3,.06,dark);b(side*2.7,3.4,.74,.6,.25,.06,dark);}b(0,5.4,0,7.1,.6,.9,wood);for(let j=0;j<9;j++)b((j-4)*.65,5.7,.1,.3,.6,.3,j%2?cream:red,j*.15);
 }else if(model==='umbala-root-shrine'){
  stairs(7,5);for(let j=0;j<9;j++)b(0,1+j*.65,0,2.8-j*.17,.7,2.7-j*.17,j%3?wood:dark);for(const side of [-1,1])for(let j=0;j<5;j++)b(side*(.8+j*.6),1.5-j*.25,.3,.9,.6,1.3,wood,side*.2);b(0,3.5,1.35,1.5,2.1,.2,0xb48c55);for(const x of [-.4,.4])b(x,3.9,1.49,.25,.4,.05,p.glow,0,true);b(0,3.0,1.49,.7,.18,.06,dark);
 }else if(model==='niflheim-house'){
  b(0,.25,0,6,.5,4.7,dark);for(let j=0;j<7;j++)b(j*.06,1+j*.42,0,5.4,.39,4.2,j%2?wood:0x6c5467,j*.006);for(const side of [-1,1]){b(side*1.5,2.6,2.17,.85,1.3,.08,p.glow,side*.13,true);b(side*1.5,2.6,2.24,.12,1.4,.05,dark,side*.13);}b(.2,1.7,2.17,1.1,2.5,.08,dark);for(let j=0;j<8;j++)b((j-3.5)*.72,5.5-Math.abs(j-3.5)*.46,0,.78,.35,5.3,0x493b58,j*.01);b(1.8,5.5,-.8,.8,2.3,.8,dark,.14);pumpkin(-3.6,.6,1.5,.95);pumpkin(3.6,.6,1.5,.8);
 }else if(model==='pumpkin-cart'){
  b(0,.9,0,4.4,.25,2.5,wood);for(const side of [-1,1]){b(0,1.3,side*1.25,4.5,.6,.15,wood);for(const x of [-1.5,1.5])for(let j=0;j<8;j++){const a=j*Math.PI/4;b(x+Math.sin(a)*.6,.55+Math.cos(a)*.6,side*1.45,.25,.25,.2,dark,a);}}for(let j=0;j<5;j++)pumpkin((j%3-1)*1.2,1.7,(Math.floor(j/3)-.5)*1.2,.8);b(2.8,.7,0,1.7,.13,.16,wood);
 }else if(model==='ghost-bell-tower'){
  stairs(7,5);for(const side of [-1,1]){b(side*2,3.8,0,.7,6.8,.8,wood,side*.055);b(side*2,4,1.1,.8,1.2,.06,p.glow,side*.12,true);}b(0,7.3,0,5.5,.5,2.8,dark);roof(0,7.7,0,6.2,3.7,0x5e4565);b(0,6.4,0,.15,1.8,.15,dark);for(let j=0;j<4;j++)b(0,6-j*.25,0,1+j*.3,.3,.85+j*.25,0xa58e75);b(0,4.9,0,.18,.6,.18,dark);pumpkin(3,.5,1.8,.8);
 }else if(model==='niflheim-dead-arch'){
  for(const side of [-1,1]){for(let j=0;j<7;j++)b(side*(2.7-Math.max(0,j-3)*.25),.4+j*.7,0,.7,.9,.8,wood,side*.08);for(let j=0;j<4;j++)b(side*(2.6+j*.4),3.2+j*.4,0,1,.20,.3,dark,side*.5);pumpkin(side*2.7,.6,1.1,.9);}b(0,5.6,0,2.7,.5,.75,wood);for(let j=0;j<5;j++)b((j-2)*.5,4.8,.1,.08,1,.08,dark);
 }
 if(parts.length>180)throw Error('Midgard landmark exceeds shared prop budget: '+model);
 const result=Object.freeze(parts.map(Object.freeze));cache.set(key,result);return result;
}
