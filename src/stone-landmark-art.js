// Shared, render-only stone sculptures. Colliders and layout seeds stay in shared/.
const palettes={cavern:[0x655f53,0x827866,0xa3977e,0x454b42,0x697552],crypt:[0x656b70,0x858a89,0xa3a492,0x464e50,0x626e53],forest:[0x586658,0x7d8871,0xa0a78a,0x3c4941,0x54734b],frost:[0x789ba8,0xa6c7ce,0xd6e6df,0x567f91,0x8eb7c5],forge:[0x453e3b,0x635049,0x887061,0x302e30,0xd77b35],void:[0x575266,0x797084,0xa294a2,0x383643,0x76658c]};
const hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;},shapes=new Map();
export const STONE_ROCK_PART_BUDGET=112;
function rockShape(id,wall){const variant=hash(id)%32,key=variant+':'+!!wall;if(shapes.has(key))return shapes.get(key);let seed=variant+731;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),nx=10,nz=9,sx=1/nx,sz=1/nz,out=[],lean=(random()-.5)*.17,shoulder=(random()-.5)*.5;
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
  const x=(ix+.5)*sx-.5,z=(iz+.5)*sz-.5,dx=(x-lean)*2,dz=(z+.025)*2,r=dx*dx*.93+dz*dz*1.12,side=(x-shoulder)*3.4,back=(z+.13)*3.1,bulge=Math.max(Math.sqrt(Math.max(0,1-r)),.73*Math.sqrt(Math.max(0,1-side*side-back*back)));
  if(bulge<.16)continue;const rough=.04+random()*.065,top=Math.min(.98,Math.max(.08,Math.floor((wall?.75+bulge*.22:bulge*.88+rough)*32)/32)),shade=(ix+iz+variant)%7===0?2:((ix+iz)%3===0?0:1);
  out.push([x,top/2,z,sx*.99,top,sz*.99,shade]);
  // A lip seated on the upper surface follows the same contour; nothing floats.
  if((ix*7+iz*3+variant)%6===0&&top>.3)out.push([x,top-.004,z,sx*.86,.022,sz*.85,4]);
  // Thin recessed strata make fractures readable from a low camera angle.
  if(iz===6&&ix%2===0&&top>.35)out.push([x,top*.48,z+sz*.48,sx*.87,.014,sz*.025,3]);
 }
 const result=Object.freeze(out.map(part=>Object.freeze(part)));shapes.set(key,result);return result;}
export function stoneRockParts({id='stone',w=2,d=2,h=3,biome='cavern',wall=false}={}){const p=palettes[biome]||palettes.cavern;return rockShape(id,wall).map(([x,y,z,pw,ph,pd,index])=>[x*w,y*h,z*d,pw*w,ph*h,pd*d,p[index]]);}
export function stoneColumnParts({id='column',w=1.25,d=1.25,h=3,biome='crypt',broken=false}={}){
 const p=palettes[biome]||palettes.crypt,out=[],b=(x,y,z,pw,ph,pd,c)=>out.push([x*w,y*h,z*d,pw*w,ph*h,pd*d,c]),variant=hash(id)%4;
 for(let i=0;i<3;i++)b(0,.035+i*.05,0,1-i*.11,.07,1-i*.11,p[i%3]);
 b(0,.54,0,.47,.76,.47,p[0]);for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.sin(a)*.22,z=Math.cos(a)*.22;b(x,.54,z,.18,.76,.18,p[i%3]);}
 for(let course=0;course<5;course++)b(0,.23+course*.145,0,.66,.027,.66,p[2]);
 if(broken){for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){const top=.88+((x+z+variant+5)%3)*.045;b(x*.18,top-.03,z*.18,.175,.085,.175,p[1+(x+z+4)%2]);}}
 else{b(0,.91,0,.78,.08,.78,p[1]);for(let i=0;i<8;i++){const a=i*Math.PI/4;b(Math.sin(a)*.34,.96,Math.cos(a)*.34,.13,.08,.13,p[2]);}b(0,.99,0,1,.02,1,p[2]);}
 // Chiseled rectangular panels and a simple laurel across the face.
 b(0,.64,.32,.19,.19,.022,p[3]);for(const side of [-1,1])for(let i=0;i<3;i++)b(side*(.05+i*.036),.64+i*.032,.34,.04,.025,.018,p[2]);
 return out;
}
export function stoneRuneParts({id='rune',w=1.1,d=.9,h=1.85,biome='forest'}={}){const p=palettes[biome]||palettes.forest,out=[],b=(x,y,z,pw,ph,pd,c)=>out.push([x*w,y*h,z*d,pw*w,ph*h,pd*d,c]),variant=hash(id)%3;
 for(let i=0;i<3;i++)b(0,.045+i*.052,0,.99-i*.1,.08,.99-i*.1,p[i%3]);b(0,.53,0,.7,.7,.64,p[1]);b(0,.91,0,.55,.08,.59,p[2]);b(-.045,.965,0,.39,.03,.45,p[2]);
 for(const side of [-1,1])for(let row=0;row<5;row++)b(side*.307,.28+row*.128,.32,.062,.114,.035,row%2?p[0]:p[2]);b(0,.56,.329,.46,.5,.024,p[0]);b(0,.56,.348,.044,.42,.022,0xc8b47c);for(const side of [-1,1]){b(side*.085,.67,.35,.17,.035,.024,0xc8b47c);b(side*.065,.44,.35,.13,.034,.024,0xc8b47c);}
 for(let i=0;i<3;i++)b((i-1)*.21,.182,.22+(i%2)*.1,.18,.018,.17,p[4]);if(variant===1)b(.27,.84,-.02,.08,.12,.48,p[0]);return out;
}
