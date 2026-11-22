const shade=(c,t)=>[16,8,0].reduce((n,s)=>n|(Math.min(255,Math.round((c>>s&255)*t))<<s),0);
// Original voxel silhouettes get small rounded cross-sections, fabric pixels
// and surface seams, baked into each shared cached starter model.
export function refineStarterSurfaces(parts,maxParts=620){
 const out=[];
 for(const [index,p]of parts.entries()){
  const remaining=parts.length-index,[x,y,z,w,h,d,c]=p,big=w>.35&&h>.2&&d>.3;
  if(!big||out.length+remaining+7>maxParts){out.push(p);continue;}
  const rows=h>.4?7:4,head=y>1.5&&w>.55&&h>.4;
  for(let row=0;row<rows;row++){const t=(row+.5)/rows*2-1,round=1-t*t*(head?.24:.1);out.push([x,y-h/2+h*(row+.5)/rows,z,w*round,h/rows+.003,d*(1-t*t*.09),row===0?shade(c,.86):row===rows-1?shade(c,1.1):c]);}
  const nx=Math.min(6,Math.floor(w/.09)),ny=Math.min(7,Math.floor(h/.085));
  for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
   if((row+col)%3!==0||out.length+remaining>=maxParts)continue;
   out.push([x+(col-(nx-1)/2)*.082,y+(row-(ny-1)/2)*.079,z+d/2+.009,.035,.035,.023,shade(c,(row+col)%2?1.14:.79)]);
  }
  if(head&&out.length+remaining+4<maxParts)for(const side of [-1,1]){out.push([x+side*w*.5,y-.04,z,.085,.16,.17,shade(c,.96)],[x+side*w*.22,y-.11,z+d/2+.021,.11,.028,.025,shade(c,.86)]);}
 }
 return out;
}

export function starterGarmentRelief(parts,{cloth=0x637f7c,trim=0xd7bd82,hair=null,skin=null,robe=false}={}){
 const b=(...p)=>parts.push(p);
 for(const side of [-1,1]){
  for(let row=0;row<8;row++){b(side*.3,.72+row*.087,.352,.028,.054,.026,shade(cloth,row%3===0?1.23:.78));if(row%2===0)b(side*.42,1.06+row*.055,.28,.033,.027,.033,trim);}
  for(let col=0;col<4;col++){b(side*(.07+col*.083),.67,.37,.036,.031,.027,trim);b(side*(.06+col*.08),1.31,.353,.04,.025,.022,shade(trim,.78));}
  if(robe)for(let row=0;row<8;row++){b(side*(.16+row%2*.027),.3+row*.115,.36,.031,.086,.025,shade(cloth,row%2?1.18:.76));b(side*.31,.3+row*.115,.375,.025,.028,.028,trim);}
 }
 b(0,.7,.39,.14,.1,.033,trim);b(0,.7,.413,.07,.045,.014,shade(trim,.58));
 if(hair!==null){for(let x=-4;x<=4;x++){for(let z=-2;z<=2;z++)b(x*.075,2.19-Math.abs(x)*.012-Math.abs(z)*.008,z*.1,.069,.073,.09,shade(hair,(x+z)%3===0?1.15:.92));b(x*.073,2.065-Math.abs(x)*.01,.36,.065,.13+(x+4)%3*.03,.065,shade(hair,x%2?1.1:.86));}}
 if(skin!==null)for(const side of [-1,1]){b(side*.18,1.85,.437,.145,.17,.032,0xe7ddc5);b(side*.18,1.843,.46,.078,.124,.022,0x527374);b(side*.18,1.836,.476,.036,.08,.014,0x273b3b);b(side*.18-.021,1.879,.488,.025,.031,.011,0xf2ead1);b(side*.18,1.959,.42,.16,.027,.022,shade(hair??cloth,.65));b(side*.29,1.73,.385,.071,.025,.022,shade(skin,.88));}
 return parts;
}
