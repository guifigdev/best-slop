// Snow-heavy conifers: stepped branches, visible trunk and separate snow caps.
// Uses the world's existing solid voxel batch; no billboard or extra material.
export function roSnowPineParts(tree,variant=0){
 const h=tree.h||6,s=Math.max(.7,Math.min(1.5,tree.scale||1)),parts=[],b=(...p)=>parts.push(p),trunk=tree.w||.65;
 b(0,h*.43,0,trunk,h*.86,trunk,0x705340);
 for(let tier=0;tier<5;tier++){
  const width=(3.3-tier*.52)*s,y=h*(.26+tier*.135),rise=h*.11;
  for(let step=0;step<3;step++){const w=width*(1-step*.2),yy=y+step*rise*.34;b(0,yy,0,w,rise*.40,w,[0x28574e,0x34695b,0x427967][(tier+variant)%3]);}
  const top=y+rise*.91;b(0,top,0,width*.63,.16*s,width*.63,0xf2f8ff);b(-width*.27,y+rise*.33,0,width*.32,.18*s,width*.87,0xdeedf8);b(width*.27,y+rise*.33,.04,width*.32,.18*s,width*.87,0xeaf4ff);
 }
 b(0,h*.98,0,.25*s,.5*s,.25*s,0xf4faff);b(0,.10,0,1.25*s,.2,1.2*s,0xe6f2fc);
 return parts;
}
export function roSnowRockParts(rock){const w=rock.w||2,d=rock.d||2,h=rock.h||1;return [[0,h*.43,0,w*.84,h*.8,d*.8,0x869fb5],[w*.22,h*.33,d*.15,w*.55,h*.56,d*.63,0xa9c2d7],[0,h*.85,0,w*.72,.22,d*.7,0xf0f8ff],[-w*.25,h*.55,-d*.2,w*.42,.2,d*.48,0xdcecf9]];}
