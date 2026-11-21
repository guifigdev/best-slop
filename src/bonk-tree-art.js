import * as T from 'three';
const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const BONK_TREE_ART_BUDGET=Object.freeze({canopyGrid:5,maxCanopyTriangles:400,clustersPerTree:7,fallingLeaves:24,leafPeriod:30,leafLifetime:5.5});

// One baked, hollow-surface voxel crown is instanced for every small leaf clump.
// Internal cube faces never reach the GPU. Bounds remain the unit cube assumed
// by the shared spatial visibility system.
export function createBonkCanopyGeometry(){
 const n=5,step=1/n,occupied=new Set(),key=(x,y,z)=>x+':'+y+':'+z;
 for(let z=-2;z<=2;z++)for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(x*x+y*y*1.14+z*z*.96<5.8+random(x*3+y*7+z*13)*.5)occupied.add(key(x,y,z));
 const positions=[],normals=[],colors=[],faces=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[0,0,1],[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]]],[[0,0,-1],[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]]];
 for(const id of occupied){const [x,y,z]=id.split(':').map(Number),tone=.81+random(x*3+y*5+z*17)*.19;for(const [normal,corners]of faces){if(occupied.has(key(x+normal[0],y+normal[1],z+normal[2])))continue;for(const i of [0,1,2,0,2,3]){const q=corners[i];positions.push((x+q[0])*step,(y+q[1])*step,(z+q[2])*step);normals.push(...normal);colors.push(tone,tone,tone);}}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();geometry.userData.voxelCells=occupied.size;return geometry;
}

export function bonkTreeParts(tree,p,variant=0,{distant=false}={}){
 const h=tree.h||7,s=tree.scale||1,w=tree.w||.8,d=tree.d||.8,wood=[],leaves=[],b=(x,y,z,ww,hh,dd,c=p.wood,a=0)=>wood.push([x,y,z,ww,hh,dd,c,a]),leaf=(x,y,z,ww,hh,dd,c)=>leaves.push([x,y,z,ww,hh,dd,c,0]),phase=variant*2.399,green=[p.dark,0x3f6847,0x577d4a,p.grass];
 if(distant){b(0,h*.37,0,w,h*.74,d);leaf(0,h*.76,0,4.1*s,3*s,3.7*s,p.dark);leaf(Math.sin(phase)*s*.5,h*.99,0,2.7*s,2.1*s,2.5*s,p.grass);return{wood,leaves};}
 for(let j=0;j<7;j++){const y=h*(j+.5)*.092,off=Math.sin(phase+j*.8)*.07*s;b(off,y,0,w*(.98-j*.045),h*.1,d*(.95-j*.035),j%3?p.wood:0x6c533c);if(j%2===0)b(off+w*.44,y,d*.18,.065*s,h*.09,.08*s,0x4b4230);}
 for(let j=0;j<4;j++){const a=phase+j*Math.PI*.5,xx=Math.sin(a),zz=Math.cos(a);b(xx*.45*s,.16,zz*.45*s,.8*s,.28*s,.26*s,p.wood,-a);for(let k=0;k<3;k++)b(xx*(.38+k*.35)*s,h*.5+k*.25*s,zz*(.38+k*.35)*s,.5*s,.3*s,.35*s,k%2?p.wood:0x755b3b,-a);}
 if(variant%3===1){for(let j=0;j<6;j++){const size=(3.05-j*.27)*s;leaf(Math.sin(phase+j)*.2*s,h*.61+j*.48*s,Math.cos(phase+j*.4)*.13*s,size,1.7*s,size*.9,green[j%4]);}}
 else{leaf(0,h*.76,0,3.2*s,2.7*s,2.9*s,green[0]);for(let j=0;j<5;j++){const a=phase+j*Math.PI*2/5,r=(.8+random(j+variant)*.35)*s;leaf(Math.sin(a)*r,h*(.69+random(j*7+variant)*.13),Math.cos(a)*r,(2.25+random(j+4)*.35)*s,1.95*s,(2.05+random(j+1)*.3)*s,green[1+j%3]);}leaf(Math.sin(phase)*.3*s,h*.99,Math.cos(phase)*.2*s,2.05*s,1.7*s,1.9*s,green[3]);}
 return{wood,leaves};
}

// Decorative leaves use a deterministic time window, not accumulated particles.
// A paused clock freezes them; a map change cannot retain old emitters.
export function bonkFallingLeaves(emitters,time,hero={x:0,z:0}){
 const parts=[],B=BONK_TREE_ART_BUDGET,near=(emitters||[]).filter(e=>(e.x-hero.x)**2+(e.z-hero.z)**2<45**2).sort((a,b)=>(a.x-hero.x)**2+(a.z-hero.z)**2-((b.x-hero.x)**2+(b.z-hero.z)**2)).slice(0,8);
 for(const [index,e]of near.entries())for(let j=0;j<3&&parts.length<B.fallingLeaves;j++){const seed=e.seed||index*7,phase=random(seed*11+j*31)*B.leafPeriod,age=((time+phase)%B.leafPeriod+B.leafPeriod)%B.leafPeriod;if(age>B.leafLifetime)continue;const life=age/B.leafLifetime,a=seed+j*2.1+t(time),x=e.x+Math.sin(a)*.45+age*.33,z=e.z+Math.cos(a*.8)*.5+age*.12,y=e.y-age*(e.height||5)/B.leafLifetime,size=.13*(1-life*.45);parts.push([x,y,z,size,.026,size*1.8,j%3===0?0xb6aa67:j%3===1?0x8c9f55:0x60844f,a]);}
 return parts;
}
const t=time=>Math.floor(time*12)/12;
