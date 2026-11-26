// Solid voxel laboratory props: research tanks, operating tables and pipes.
export function roBiolabPropParts(model='tank',floor=1){
 const parts=[],b=(x,y,z,w,h,d,c,lit=false)=>parts.push([x,y,z,w,h,d,c,0,lit]),steel=0x637581,dark=0x26343c,light=0xb4c3b7,liquid=floor===3?0xa47edc:0x66d4ba;
 b(0,.12,0,3,.24,5,dark);
 if(model==='tank'){
  for(const y of [.35,4.45]){b(0,y,0,2.8,.45,2.8,steel);b(0,y+.24,0,2.2,.12,2.2,light);}
  for(const side of [-1,1]){b(side*1.15,2.4,0,.28,3.7,2.1,steel);b(0,2.4,side*1.15,2.1,3.7,.16,0x314d57);b(0,2.4,side*1.25,1.6,3,.04,liquid,true);for(let j=0;j<6;j++)b(side*1.35,1+j*.5,.3,.12,.22,.3,j%2?steel:light);}
  b(0,2.1,1.3,.6,1.1,.2,0x596479);b(0,2.8,1.28,.5,.6,.22,0xb4a5b4);b(.65,4.8,-.6,.28,.8,.28,steel);b(1.3,5.1,-.6,1.4,.25,.3,steel);
 }else{
  for(const x of [-1,1])for(const z of [-1.7,1.7])b(x,.9,z,.2,1.5,.2,steel);
  b(0,1.75,0,2.8,.35,4.8,light);b(0,1.97,0,1.3,.12,3.4,0x675265);b(0,2.05,-1.4,1.1,.2,.7,0xc4b7a2);b(1.2,2.7,-1.5,.16,2.2,.16,steel);b(.6,3.65,-1.5,1.2,.15,.15,steel);b(.55,3.2,-1.5,.35,.65,.35,liquid,true);b(-1.45,1.2,.8,.35,2.1,.35,steel);b(-1.45,2.3,.8,.55,.15,.55,liquid,true);
 }
 return parts;
}
