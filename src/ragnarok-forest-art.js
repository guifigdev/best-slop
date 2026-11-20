// Geometric reconstructions studied from Ragnarok's Spore, Mandragora and
// Willow sprites. Shared by the live actor rig, previews and army portraits.
export const RAGNAROK_FOREST_KINDS=Object.freeze(['spore','mandragora','willow','elderwillow']);
const cache=new Map();
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export function ragnarokForestSpec(key){
 if(!RAGNAROK_FOREST_KINDS.includes(key))return null;if(cache.has(key))return cache.get(key);
 const parts=[],legs=[],wings=[],flames=[],b=(...p)=>parts.push(p),leg=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 const oval=(x,y,z,rx,ry,rz,palette,ny=7,nz=9)=>{
  const sy=ry*2/ny,sz=rz*2/nz;
  for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
   const yy=(j+.5)/ny*2-1,zz=(k+.5)/nz*2-1,q=1-yy*yy-zz*zz;if(q<.04)continue;
   const width=Math.round(rx*2*Math.sqrt(q)/.07)*.07;if(width>.03)b(x,y+yy*ry,z+zz*rz,width,sy+.004,sz+.004,palette[Math.min(palette.length-1,Math.floor((yy+1)*.5*palette.length))]);
  }
 };
 const rod=(a,c,w,color,step=.12)=>{const n=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>c[i]-v))/step));for(let i=0;i<=n;i++){const t=i/n;b(...a.map((v,j)=>v+(c[j]-v)*t),w,w,w,color);}};
 let fur=0,height=2,eyeLine=1,motion='walk';
 if(key==='spore'){
  fur=0xd9ba85;height=2.28;eyeLine=.97;motion='scurry';
  // Creamy pear-shaped stalk and round belly below a broad red umbrella.
  oval(0,.54,.10,.46,.45,.38,[0x96734e,0xc3a376,0xead29d,0xffe7b4],7,8);
  oval(0,1.01,-.02,.29,.62,.27,[0xb89970,0xddc39a,0xf3dcb1],8,7);
  oval(0,1.68,-.07,1.12,.43,.98,[0x793e37,0xa45243,0xbd6251,0xd48b66],8,13);
  // Flat pale rim and numerous separate radial gills remain visible from below.
  for(let i=0;i<20;i++){
   const a=i*Math.PI/10,x=Math.sin(a),z=Math.cos(a);
   b(x*.97,1.46,-.07+z*.86,.28,.095,.23,0xf2d3a1);
   for(let j=0;j<2;j++)b(x*(.45+j*.25),1.41-j*.025,-.07+z*(.4+j*.22),.12,.075,.13,i%2?0x9c6e52:0xe6ba83);
  }
  // Raised cap scales are irregular cream-edged brown plates, as in the sprite.
  for(const [x,y,z,s]of [[-.55,1.91,-.23,.29],[.27,2.04,-.25,.31],[.65,1.83,.18,.27],[-.17,2.10,.17,.25],[-.70,1.70,.42,.23],[.08,1.78,.72,.21],[-.22,1.88,-.68,.21]]){
   b(x,y,z,s+.09,.10,s+.07,0xe1b68b);b(x,y+.06,z,s,.09,s,0x875046);b(x-.025,y+.105,z-.025,s*.60,.045,s*.5,0xba7c62);
  }
  for(const s of [-1,1]){
   b(s*.16,.99,.263,.075,.11,.04,0x6d4b39);b(s*.16,.70,.44,.16,.08,.035,0xf0c8a2);
   b(s*.48,.70,.06,.19,.28,.23,0xddba81);b(s*.55,.60,.11,.18,.16,.22,0xf2d5a0);
   leg(s*.23,.13,.15,.25,.26,.37,0xc29a68);
  }
  b(0,.84,.285,.13,.045,.035,0x916342);
 }else if(key==='mandragora'){
  fur=0xa3a572;height=2.45;eyeLine=.77;motion='insect';
  // Two distinct pale-green root bulbs, with a dark, open lower mouth.
  oval(0,.67,.13,.49,.49,.39,[0x5e6650,0x8a9460,0xbac38b,0xd4d5a3],8,9);
  oval(-.04,1.53,-.07,.36,.39,.31,[0x75744f,0x9d9b68,0xd7ca91],7,8);
  for(const s of [-1,1]){
   b(s*.14,1.57,.241,.13,.11,.04,0x493b37);b(s*.14,1.60,.266,.055,.04,.018,0xf2e1b2);
   b(s*.15,.91,.488,.12,.10,.04,0x6a5346);
   leg(s*.24,.14,.10,.16,.28,.30,0x8c4b46);
  }
  oval(0,.65,.496,.21,.22,.065,[0x3f3134,0x4e393a,0x775c4c],5,5);
  b(-.12,.80,.55,.075,.09,.035,0xe8d0a0);b(.12,.79,.55,.075,.09,.035,0xe8d0a0);
  // A leafy ruff separates the upper head and lower bulb; pointed yellow-green
  // leaves alternate with the long red tuber roots, not a humanoid robe.
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,x=Math.sin(a),z=Math.cos(a);
   for(let j=0;j<3;j++)b(x*(.30+j*.10),1.20-j*.11,z*(.28+j*.10),.24-j*.055,.16-j*.025,.22-j*.045,[0xc6ca85,0xa8b26e,0x7c8b54][j]);
  }
  for(const side of [-1,1]){
   const roots=[[[side*.22,1.79,-.13],[side*.48,1.98,-.21],[side*.70,1.78,-.20],[side*.82,1.39,-.18]],[[side*.31,1.14,-.08],[side*.69,1.06,.05],[side*.92,.77,.15],[side*1.05,.91,.31]],[[side*.30,.60,-.12],[side*.66,.38,-.10],[side*.82,.18,.05]]];
   for(const line of roots)for(let i=0;i<line.length-1;i++)rod(line[i],line[i+1],i===line.length-2?.075:.13,i%2?0xb86c60:0x8a4d4e,.15);
   b(side*.47,2.01,-.19,.25,.10,.25,0xe1a397);
   b(side*.52,.76,.16,.27,.17,.29,0xbac17e);
  }
  rod([-.08,1.85,-.08],[.02,2.17,-.22],.13,0x98555a);rod([.02,2.17,-.22],[.22,2.27,-.28],.10,0xc48477);
 }else{
  const elder=key==='elderwillow',wood=elder?[0x612b2a,0x8a3c34,0xb75948,0xd78968]:[0x59403c,0x77534c,0x9c7365,0xbd9580],dark=elder?0x2c2028:0x33292e;
  fur=wood[2];height=3.04;eyeLine=1.72;motion='heavy';
  // Eleven masonry-free bark courses around an actual inset face cavity.
  // The negative holes are cut out of the front shell; darker inner wood is
  // behind the opening, rather than painted onto a flat rectangular trunk.
  for(let j=0;j<10;j++)for(let i=0;i<12;i++){
   const a=i*Math.PI/6,x=Math.sin(a)*.47,z=Math.cos(a)*.42,y=.47+j*.18,front=z>.29;
   const eyeHole=front&&j>=6&&j<=7&&Math.abs(x)>.10&&Math.abs(x)<.44,mouthHole=front&&j>=2&&j<=4&&Math.abs(x)<.39;
   if(eyeHole||mouthHole)continue;
   const groove=(i*7+j*3)%11===0;
   b(x,y,z,.30+(j%3===0?.015:0),.19,.29,groove?wood[0]:wood[1+i%3]);
  }
  b(0,1.66,.25,.82,.43,.10,dark);b(0,1.05,.26,.61,.63,.10,dark);
  for(const s of [-1,1]){
   b(s*.24,1.78,.323,.16,.12,.035,elder?0x130e18:0x221c23);
   b(s*.24,1.92,.48,.31,.13,.16,wood[3]);b(s*.11,1.88,.46,.14,.22,.16,wood[2]);
   b(s*.12,1.01,.36,.12,.14,.08,wood[2]);b(s*.26,.82,.38,.17,.21,.13,wood[3]);
   // Twisting arm roots wrap the sides, with split fingers at ground level.
   const arm=[[s*.50,1.34,0],[s*.73,1.05,.04],[s*.78,.63,.15],[s*.66,.36,.32]];
   for(let i=0;i<3;i++)rod(arm[i],arm[i+1],.20-i*.025,wood[1+i%3],.16);
   rod([s*.66,.36,.32],[s*.85,.20,.47],.12,wood[2]);rod([s*.66,.36,.32],[s*.56,.17,.58],.12,wood[3]);
   leg(s*.30,.16,.06,.34,.32,.67,wood[1]);
   rod([s*.39,.42,-.08],[s*.74,.15,-.46],.17,wood[2],.16);
  }
  b(0,1.43,.51,.18,.32,.17,wood[3]);b(0,.65,.47,.31,.13,.15,wood[2]);
  // Uneven splintered crown, hollow top, and narrow side twigs.
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,x=Math.sin(a)*.45,z=Math.cos(a)*.41,h=.30+((i*3)%4)*.12;
   b(x,2.17+h/2,z,.21,h,.20,wood[1+i%3]);
   for(let j=0;j<3;j++)b(x+.015*j,2.17+h+j*.065,z,.14-j*.035,.08,.14-j*.035,wood[2]);
  }
  b(0,2.11,0,.57,.08,.48,dark);
  for(const s of [-1,1]){
   rod([s*.44,1.99,-.02],[s*.65,2.27,-.08],.105,wood[1],.14);rod([s*.65,2.27,-.08],[s*.75,2.52,-.06],.07,wood[2],.14);
  }
  // The green vine crosses the chest and coils round the stump's shoulders.
  for(let i=0;i<10;i++){const x=(i-4.5)*.12,y=1.30+Math.abs(i-4.5)*.07,z=.50-Math.abs(i-4.5)*.025;b(x,y,z,.11,.075,.075,0x567154);if(i%3===0){b(x+.045,y+.09,z,.16,.10,.07,0x7c9860);b(x+.11,y+.13,z,.09,.08,.07,0x9eaa70);}}
  if(elder){b(-.22,1.73,.345,.055,.055,.035,0xe6a05e);b(.22,1.73,.345,.055,.055,.035,0xe6a05e);flames.push({x:-.44,y:2.05,z:-.24,scale:.35},{x:.38,y:2.16,z:-.22,scale:.3});}
 }
 const spec=freeze({key,parts,legs,wings,flames,fur,height,eyeLine,motion});cache.set(key,spec);return spec;
}
