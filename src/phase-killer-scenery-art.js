// Original voxel scenery. All solid foundations stay inside authoritative AABBs.
export const phaseSceneryVariant=id=>[...String(id)].reduce((hash,c)=>(hash*31+c.charCodeAt(0))>>>0,7)%4;
export function phaseHouseArt(b,c){
 const original=b,rotated=b.w<b.d;b={...b,x:0,z:0,w:rotated?b.d:b.w,d:rotated?b.w:b.d};
 const variant=phaseSceneryVariant(b.id),h=[4.6,5.0,5.6,4.8][variant],x=b.x,z=b.z,w=b.w,d=b.d,front=z+d/2,stone=[0xaaa18a,0x8d938b,0x9e9b92,0xb0a28b][variant],wall=variant===3?0x8e7257:stone,parts=[],windows=[];
 parts.push([x,.16,z,w,.32,d,0x777c75],[x,(h+.32)/2,z,w,h-.32,d,wall]);
 for(const side of [-1,1])parts.push([x+side*w*.43,h*.5,front+.025,.12,h,.12,c.wood]);
 for(const y of [.39,h*.56,h-.04])parts.push([x,y,front+.025,w,.12,.12,c.wood]);
 // Stone courses, weathered timber and door arches distinguish each facade.
 if(variant===0||variant===2)for(let row=0;row<6;row++)for(let j=0;j<3;j++)parts.push([x+(j-1)*w*.29+(row%2?.05:0),.65+row*.58,front+.015,w*.26,.31,.06,row%2?0x9b9a8e:stone]);
 if(variant===3)for(let row=0;row<10;row++)parts.push([x,.6+row*.4,front+.055,w,.045,.045,0x6a543f]);
 parts.push([x,1.94,front+.065,2.05,3.85,.1,0x453b32],[x,1.94,front+.125,1.8,3.65,.04,0x6d5943],[x+.65,1.35,front+.165,.1,.15,.035,0xc3a46c]);
 for(const side of [-1,1]){
  const wx=x+side*w*.34,wy=variant===2?3.15:2.65;parts.push([wx,wy,front+.075,.85,1.2,.1,0x4c463e],[wx,wy,front+.15,.065,1.13,.03,c.wood],[wx,wy,front+.15,.8,.065,.03,c.wood]);windows.push([wx,wy,front+.135,.7,1.0,.035,c.accent]);
 }
 const roof=[c.roof,0x526273,0x58645b,0x66594c][variant];for(let tier=0;tier<(variant===1?4:3);tier++)parts.push([x,h+.24+tier*.38,z,w+.32-tier*w*.19,.42,d+.3-tier*d*.19,roof]);
 parts.push([x+w*.29,h+.42,z-d*.23,.38,1.2,.4,0x747a73],[x+w*.29,h+1.06,z-d*.23,.47,.15,.49,0xa49b84]);
 if(variant===2){parts.push([x-w*.28,h+.55,z+d*.2,w*.42,1.05,d*.52,stone],[x-w*.28,h+1.13,z+d*.2,w*.48,.18,d*.57,roof]);windows.push([x-w*.28,h+.63,front-.02,.18,.37,.04,c.accent]);}
 const transform=part=>{const [px,py,pz,pw,ph,pd,pc]=part;return rotated?[original.x+pz,py,original.z-px,pd,ph,pw,pc]:[original.x+px,py,original.z+pz,pw,ph,pd,pc];};
 return{variant,height:h,doorHeight:3.65,doorWidth:1.8,facadeWidth:w,parts:parts.map(transform),windows:windows.map(transform),windowNormal:rotated?{x:1,z:0}:{x:0,z:1}};
}
export function phaseTreeArt(p,dimension,c){
 const variant=phaseSceneryVariant(p.id),scale=Math.min(1.3,Math.max(.7,p.scale)),height=[3.65,2.9,3.35,3.2][variant],x=p.x,z=p.z,foliage=dimension==='normal'?[0x365b42,0x4f7350,0x68865b]:dimension==='aether'?[0x4a5b76,0x627a94,0x7c91a6]:[0x5e4a74,0x7a608c,0x997aaa],parts=[];
 if(variant===0)for(let i=0;i<4;i++)parts.push([x,height*.52+i*.53,z,(1.55-i*.29)*scale,.75,(1.55-i*.29)*scale,foliage[Math.min(2,i)],0]);
 if(variant===1){parts.push([x,2.25,z,1.65*scale,1.0,1.55*scale,foliage[0],0],[x-.32,2.7,z+.15,1.2*scale,.7,1.2*scale,foliage[1],.08],[x+.38,2.65,z-.22,1.15*scale,.7,1.08*scale,foliage[2],-.08]);}
 if(variant===2){parts.push([x-.35,2.15,z,.8,.18,.2,c.wood,-.4],[x+.35,2.65,z,.85,.18,.18,c.wood,.4],[x-.22,3.0,z-.2,.65,.2,.18,c.wood,-.65],[x+.05,3.45,z,.28,.7,.28,foliage[1],.15]);}
 if(variant===3){parts.push([x-.24,2.3,z,1.0*scale,.75,1.1*scale,foliage[0],0],[x+.24,2.8,z+.1,.9*scale,.7,1.0*scale,foliage[1],0],[x-.08,3.25,z,.68*scale,.6,.75*scale,foliage[2],0]);}
 return{variant,height,trunkColor:variant===3&&dimension==='normal'?0xaaa996:c.wood,parts};
}
export function phaseChurchArt(b,c){
 const x=b.x,z=b.z,w=b.w,d=b.d,parts=[[x,.22,z,w,.44,d,0x797e78],[x+1.2,3.4,z,w-2.4,6.4,d-.35,0xa4a69b],[x-w*.34,5,z,3.4,9.6,3.6,0x969e95]],windows=[];
 for(const side of [-1,1])for(let i=0;i<4;i++){const px=x-2.8+i*2.3;parts.push([px,2.6,z+side*(d/2-.12),.36,5.1,.42,0x7c8982],[px,6.3,z+side*(d/2-.12),.6,.32,.58,0x9fa99c]);}
 for(let tier=0;tier<5;tier++)parts.push([x+1.2,6.8+tier*.35,z,w-2.2,.4,d+.3-tier*1.45,c.roof]);
 for(let tier=0;tier<6;tier++)parts.push([x-w*.34,10.1+tier*.43,z,4.0-tier*.57,.48,4.0-tier*.57,0x42505e]);
 const front=x-w/2;parts.push([front-.04,1.96,z,.1,3.9,2.2,0x50564f],[front-.1,1.96,z,.04,3.65,1.8,c.wood],[front-.08,4.05,z,.15,.2,2.45,0xb4b2a0]);
 for(const side of [-1,1])for(let i=0;i<3;i++){const wx=x-.8+i*2.5;parts.push([wx,4.15,z+side*d/2,.9,2.55,.11,0x535d60]);windows.push([wx,4.15,z+side*(d/2+.065),.67,2.2,.035,0xb8cad1]);}
 parts.push([x-w*.34,8.35,z+1.84,1.1,1.5,.1,0x414b4a],[x-w*.34,8.35,z+1.9,.3,.8,.06,0xb2a27a],[x-w*.34,13.2,z,.15,1.4,.15,0xa8a58e],[x-w*.34,13.4,z,.85,.12,.15,0xa8a58e]);
 return{parts,windows,windowNormal:{x:0,z:1},height:13.9,doorHeight:3.65,doorWidth:1.8,facadeWidth:d,variant:'church'};
}
export function phaseFountainArt(b,c){
 const x=b.x,z=b.z,w=b.w,d=b.d,parts=[[x,.12,z,w,.24,d,0x858d87]],windows=[];
 for(const side of [-1,1]){parts.push([x+side*(w/2-.14),.38,z,.28,.52,d,0xb0b3a4],[x,.38,z+side*(d/2-.14),w-.5,.52,.28,0xb0b3a4]);}
 for(const sx of [-1,1])for(const sz of [-1,1])parts.push([x+sx*(w/2-.35),.68,z+sz*(d/2-.35),.4,.22,.4,0xc2bda9]);
 parts.push([x,.9,z,.38,1.4,.38,c.wall],[x,1.52,z,1.5,.18,1.5,0x999f94],[x,1.83,z,.26,.55,.26,0xb6b49b]);windows.push([x,.31,z,w-.6,.035,d-.6,0x709da5],[x,1.64,z,.95,.045,.95,0x93c1c8]);
 return{parts,windows,windowNormal:{x:0,z:0},height:2.1,variant:'fountain'};
}
