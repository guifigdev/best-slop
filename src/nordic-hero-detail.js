// Sculpted relief shared by the playable meshes and their selection portraits.
// These boxes are merged by the existing actor geometry builder, not new draws.
const shade=(c,f)=>[16,8,0].reduce((v,s)=>v|(Math.min(255,Math.round(((c>>s)&255)*f))<<s),0);
export function carveNordicSurfaces(source){
 const out=[];
 for(const p of source){
  const [x,y,z,w,h,d,c]=p;
  if(w<.38||h<.18||d<.22){out.push(p);continue;}
  // Bevel the outline, with a lit top lip and a darker lower chamfer.
  const step=Math.min(h*.17,.055),cut=Math.min(w*.1,d*.1,.055);
  out.push([x,y-h/2+step/2,z,w-cut*2,step,d-cut*2,shade(c,.83)],
   [x,y,z,w,h-step*2,d,c],
   [x,y+h/2-step/2,z,w-cut*2,step,d-cut*2,shade(c,1.12)]);
 }
 return out;
}
export function nordicHeroRelief(kind,parts){
 const b=(...p)=>parts.push(p),gold=0xd9bb71,light=0xf0dfb4,steel=0xc1cfd0;
 const stud=(x,y,z,c=gold)=>{b(x,y,z,.046,.046,.028,c);b(x-.009,y+.01,z+.018,.018,.018,.014,light);};
 const rune=(x,y,z,c)=>{for(let i=-2;i<=2;i++)b(x,y+i*.033,z,.024,.032,.021,c);for(let i=0;i<3;i++)b(x+(i+1)*.025,y+.065-i*.025,z,.025,.025,.021,c);};
 // Tailored belts, leather straps, articulated kneecaps and boot lacing.
 for(const side of [-1,1]){
  b(side*.24,.38,.225,.25,.17,.10,kind==='ranger'?0xa7b4ad:0x64777b);
  b(side*.24,.39,.285,.15,.11,.035,steel);
  for(let i=0;i<4;i++){b(side*.24-.07+i*.046,.19,.253,.027,.027,.025,gold);b(side*.35,.72+i*.14,.325,.026,.067,.028,0xe0cda1);}
  for(let i=0;i<3;i++)stud(side*(.13+i*.09),.645,.354);
 }
 if(kind==='knight'||kind==='turtle'){
  // Interlocked mail below the breastplate, visible between the plated tassets.
  for(let row=0;row<4;row++)for(let col=0;col<11;col++){
   const x=(col-5)*.065+(row%2)*.023,y=.77+row*.065;
   b(x,y,.361,.047,.046,.035,(col+row)%2?0x566970:0xb6c5c4);
  }
  for(const side of [-1,1]){
   b(side*.28,.86,.40,.21,.3,.085,0x78929a);b(side*.28,.88,.451,.13,.19,.028,steel);
   for(let i=0;i<4;i++)stud(side*(.39+i*.074),1.54,.35);
   rune(side*.25,1.20,.414,light);
  }
  if(kind==='knight'){
   // Braided copper beard, parted locks and embossed hammer faces.
   for(const side of [-1,1])for(let i=0;i<9;i++){
    b(side*(.10+(i%2)*.023),1.18+i*.052,.565,.058,.075,.048,i%3?0xc78650:0x77442e);
    b(side*(.30+(i%3)*.023),1.76+i*.045,.381,.05,.08,.048,i%2?0xd09358:0x864a31);
   }
   for(let i=-4;i<=4;i++){b(.77+i*.091,1.91,.514,.078,.038,.045,light);b(.77+i*.091,1.42,.514,.078,.038,.045,0x536b74);}
   for(const x of [.38,1.15])for(const y of [1.48,1.85])stud(x,y,.52,steel);
   rune(.73,1.7,.585,light);rune(.9,1.7,.585,gold);
   for(let i=0;i<7;i++)b(-.44+i*.145,.52,-.505,.065,.055,.03,gold);
  }else{
   // Shield side is its visible plane: rings, rivets and a raised oath knot.
   for(let i=0;i<12;i++){const a=i*Math.PI/6;b(-1.11,1.08+Math.cos(a)*.44,.34+Math.sin(a)*.29,.028,.045,.045,light);}
   b(-1.13,1.08,.34,.075,.25,.25,steel);b(-1.18,1.08,.34,.036,.13,.13,gold);
   for(let i=0;i<8;i++)b(-.33+i*.095,2.17,.47,.05,.026,.024,light);
   for(const side of [-1,1])for(let i=0;i<4;i++)b(side*.39,1.82+i*.07,.36,.037,.03,.034,gold);
  }
 }else if(kind==='mage'){
  // Asymmetric bone ribs, stitched silk and a carved skull on Hel's staff.
  for(let i=0;i<5;i++){b(.19,1.31-i*.08,.38,.35-i*.025,.036,.06,0xc6d5c7);b(-.23,.48+i*.17,.41,.15,.023,.03,0xb49bad);}
  for(let i=0;i<9;i++){const y=1.58+i*.07;b(-.37,y,.355,.052,.10,.045,i%2?0xf1e7ce:0xb3a69a);b(.38,y,.355,.048,.10,.043,i%2?0x52616a:0x242e39);}
  for(const x of [-.87,-.68]){b(x,2.12,.274,.074,.066,.038,0x283c3c);b(x-.008,2.13,.298,.025,.025,.02,0xa9e0c4);}
  for(let i=0;i<5;i++)b(-.89+i*.058,1.98,.249,.035,.09,.03,0xe4e1c6);
  for(let i=-5;i<=5;i++)stud(i*.085,.31,.427,0xc2b8ca);
 }else if(kind==='ranger'){
  // Individual fur tufts, braided strands, a leather quiver and arrow feathers.
  for(const side of [-1,1])for(let i=0;i<13;i++){
   b(side*(.36+(i%3)*.025),1.51+i*.052,.18+(i%2)*.15,.085,.10,.16,i%3?0xe9e9d8:0x9eaead);
   if(i<8)b(side*(.24+(i%2)*.035),1.29+i*.052,.455,.05,.059,.045,i%2?0xd6c58e:0x8b7959);
  }
  for(let i=0;i<6;i++){b(.389, .79+i*.11,-.565,.026,.06,.03,gold);b(.65,.79+i*.11,-.565,.026,.06,.03,gold);}
  for(const x of [.43,.61])for(let i=0;i<5;i++)b(x+(i%2?.04:-.04),1.94+i*.04,-.4,.08,.032,.08,i%2?0xaebdb7:0xeee9cf);
  for(let i=0;i<7;i++)stud(-.76,.74+i*.15,.903);
 }else if(kind==='owl'){
  // Woven blue hems, white beard strands and layered raven flight feathers.
  for(let i=-5;i<=5;i++){rune(i*.085,.43,.433,i%2?gold:0x90b3bc);b(i*.047,1.23+Math.abs(i)*.045,.548,.035,.16,.04,i%2?0xb2c0ba:0xe4e0ca);}
  for(const side of [-1,1])for(let i=0;i<8;i++)b(side*.40,1.67+i*.085,.345,.036,.047,.03,gold);
  for(let i=0;i<8;i++){b(.82,1.65+i*.035,-.22+i*.045,.07,.13,.12,i%2?0x526778:0x273a4b);b(.64,1.78,-.45-i*.04,.19-i*.014,.04,.1,0x3d5061);}
  for(let i=0;i<9;i++)b(-.78,.54+i*.16,.192,.145,.04,.04,i%2?gold:0x483d37);
  rune(-.78,2.56,.218,light);
 }else{
  // Loki's coat is layered leather, with gilded lapels and engraved daggers.
  for(const side of [-1,1]){
   for(let i=0;i<7;i++){b(side*(.14+i*.036),1.40-i*.056,.46,.045,.07,.035,gold);b(side*.27,.71+i*.075,.395,.17,.035,.045,i%2?0x315547:0x6a9575);}
   for(let i=0;i<8;i++){b(side*.67,.53+i*.075,.526,.035,.06,.023,i%2?0xdbe7dd:0x677f87);b(side*.56,2.42+i*.042,.17,.04,.027,.025,light);}
   stud(side*.4,1.45,.357);b(side*.37,.69,.29,.16,.23,.12,0x6c503a);
  }
  b(0,1.23,.482,.09,.14,.04,0x93d6ab);b(0,1.25,.51,.035,.055,.025,0xe6efb9);
 }
 return parts;
}

export function fenrirFurRelief(parts){
 const b=(...p)=>parts.push(p);
 for(const side of [-1,1]){
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const z=-.82+col*.21,y=.76+row*.15,x=side*(.70-Math.abs(row-3.5)*.023);
   b(x,y,z,.085,.19,.12,(row+col)%3===0?0xa9bbc0:(row+col)%3===1?0x657d8e:0x849ba5);
  }
  for(let i=0;i<10;i++){b(side*(.15+i*.036),2.09-i*.033,1.58,.044,.085,.06,i%2?0xc5d3cf:0x718c99);b(side*.73,1.12+i*.065,.78,.05,.039,.055,0xe0c58b);}
  for(let i=0;i<7;i++)b(side*.47,1.50+i*.08,1.22,.065,.12,.13,i%2?0x5a7485:0xbdc9c5);
  b(side*.51,1.67,1.98,.055,.13,.065,0xf0e6cb);
 }
 return parts;
}
