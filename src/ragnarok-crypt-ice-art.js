// Direct voxel studies of Ragnarok sprites: Mummy 1041, Whisper 1179,
// Siroma 1776 and Gazeti 1778. Art does not define combat statistics.
export const RAGNAROK_CRYPT_ICE_KINDS=Object.freeze(['mummy','whisper','siroma','gazeti']);
const models=new Map();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

export function ragnarokCryptIceSpec(key){
 if(!RAGNAROK_CRYPT_ICE_KINDS.includes(key))return null;
 if(models.has(key))return models.get(key);
 const parts=[],legs=[],wings=[],add=(...p)=>parts.push(p),leg=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 const oval=(x,y,z,rx,ry,rz,palette,ny=9,nz=9)=>{
  const dy=ry*2/ny,dz=rz*2/nz;
  for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
   const fy=(j+.5)/ny*2-1,fz=(k+.5)/nz*2-1,q=1-fy*fy-fz*fz;
   if(q<=.035)continue;const width=Math.round(Math.sqrt(q)*rx*2/.07)*.07;
   if(width>.025)add(x,y+fy*ry,z+fz*rz,width,dy+.004,dz+.004,palette[Math.min(palette.length-1,Math.floor((fy+1)*.5*palette.length))]);
  }
 };
 const rod=(a,b,width,c,step=.1)=>{const n=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>b[i]-v))/step));for(let i=0;i<=n;i++)add(...a.map((v,j)=>v+(b[j]-v)*i/n),width,width,width,c);};
 let fur=0xbca283,eyeLine=1.8,motion='walk';
 if(key==='mummy'){
  const shadow=0x756556,dark=0x463d38,wrap=0xc5ac88,light=0xe0c8a3;fur=wrap;
  // Thin, bent torso and the forward head retain the shambling sprite pose.
  oval(0,1.36,-.10,.32,.60,.28,[shadow,0x9f876c,wrap],9,7);
  for(let j=0;j<10;j++){
   const y=.86+j*.105,xx=j>5?.035:0,w=.56+Math.sin(j*.47)*.08;
   add(xx,y,.205,w,.075,.075,j%3?wrap:light);
   add(-.28,y,-.075,.08,.075,.38,j%2?0xb79b78:light);
   add(.28,y,-.075,.08,.075,.38,j%2?light:0xb79b78);
   if(j%2===0)add(.055,y+.035,.253,.17,.025,.028,0x8a715b);
  }
  oval(0,2.03,.25,.29,.37,.29,[0xa78c6f,wrap,light],8,8);
  for(let j=0;j<5;j++){
   add(0,1.82+j*.105,.506,.48,.072,.065,j%2?light:wrap);
   add(-.263,1.84+j*.10,.25,.065,.073,.43,j%2?wrap:light);
   add(.263,1.84+j*.10,.25,.065,.073,.43,j%2?light:wrap);
  }
  add(0,2.10,.55,.45,.13,.035,dark);
  for(const s of [-1,1]){add(s*.12,2.12,.574,.075,.065,.02,0x201f22);add(s*.12,2.12,.587,.028,.025,.012,0xb5a27d);}
  // Diagonal overlapping strips over the cap and mouth are stepped voxels.
  rod([-.23,2.22,.48],[.23,2.35,.37],.075,light,.075);
  rod([-.22,1.93,.53],[.23,1.81,.53],.07,0xd1b58f,.07);
  for(const side of [-1,1]){
   const ax=side*.40;
   rod([side*.29,1.75,-.03],[side*.43,1.30,.11],.18,shadow,.13);
   rod([side*.43,1.30,.11],[side*.46,.86,.29],.16,wrap,.12);
   for(let i=0;i<7;i++)add(ax+side*i*.009,1.62-i*.105,.07+i*.029,.205,.065,.205,i%2?light:0xb29a7d);
   add(side*.47,.82,.33,.19,.23,.22,0x9e856a);
   for(let i=0;i<3;i++)add(side*(.43+i*.035),.71,.40,.045,.16,.055,light);
   add(side*.19,.65,-.04,.22,.52,.24,0xbba07d);
   for(let i=0;i<5;i++)add(side*.19,.46+i*.1,.098,.24,.047,.045,i%2?light:0x8d765d);
   leg(side*.19,.23,.07,.235,.46,.41,wrap);
   // Loose strips and ripped lower wraps break the cylindrical outline.
   add(side*.32,1.14,.27,.07,.34,.05,light);add(side*.36,.99,.29,.13,.065,.05,light);
  }
  eyeLine=2.12;motion='walk';
 }else if(key==='whisper'){
  const white=0xf4e8e0,cream=0xe0cec6,pink=0xc4aaa7,shadow=0x9f8585;fur=white;
  // The upper hood is a dome; long folds pull into a ragged, trailing sheet.
  oval(0,1.43,-.10,.59,.61,.38,[cream,0xeadbd3,white],10,9);
  for(let i=0;i<9;i++){
   const x=(i-4)*.13,edge=Math.abs(i-4)/4,top=1.52-edge*.22,bottom=.26+edge*.18+(i%3)*.11;
   for(let j=0;j<5;j++){
    const t=j/4,y=bottom+(top-bottom)*(t+.05),trail=(1-t)*(.13+edge*.23),zz=.04+trail+(i%2?.04:-.04);
    add(x+(1-t)*.12,y,zz,.145,(top-bottom)/4+.025,.30+(1-t)*.10,[white,cream,white,0xe8d8d0][i%4]);
   }
   if(i%2===0){add(x+.13,bottom-.09,.30+edge*.08,.16,.23,.31,cream);add(x+.18,bottom-.22,.35+edge*.10,.10,.13,.23,pink);}
  }
  // Heavy diagonal brow slits are the defining face in the reference sprite.
  rod([-.36,1.50,.305],[-.12,1.29,.38],.10,shadow,.075);
  rod([.12,1.29,.38],[.35,1.48,.31],.10,shadow,.075);
  for(const s of [-1,1])add(s*.22,1.34,.404,.11,.15,.03,0x776769);
  add(0,1.06,.416,.20,.15,.025,0xae9291);
  // A wind-swept tongue of cloth points behind the right hem, not a tail bone.
  for(let j=0;j<5;j++)add(.42+j*.10,.56-j*.07,-.04-j*.07,.26-j*.028,.19-j*.018,.31, j%2?cream:white);
  eyeLine=1.42;motion='float';
 }else if(key==='siroma'){
  const lavender=0xb7afd0,grey=0x857d9d,white=0xf1eceb,pale=0xd6d1e8,dark=0x444052;fur=pale;
  oval(0,.94,-.01,.69,.72,.59,[grey,lavender,pale,white],11,11);
  // Pointed icy fur follows the round outline, rather than a square collar.
  for(let i=0;i<20;i++){
   const a=i*Math.PI/10,x=Math.sin(a)*.59,z=Math.cos(a)*.45,y=.94+Math.cos(a*2)*.12;
   for(let j=0;j<3;j++)add(x+Math.sin(a)*j*.075,y+j*.075,z+Math.cos(a)*j*.065,.22-j*.05,.22-j*.04,.21-j*.045,j===2?white:lavender);
  }
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,x=Math.sin(a)*.43,z=Math.cos(a)*.34;
   for(let j=0;j<3;j++)add(x+Math.sin(a)*j*.06,1.40+j*.12,z+Math.cos(a)*j*.04,.23-j*.055,.18-j*.025,.22-j*.05,j===2?white:pale);
  }
  // Creamy forehead marking, wide round eyes and friendly open smile.
  add(0,1.40,.496,.34,.18,.13,0xf4f0b6);add(0,1.54,.42,.19,.15,.12,0xfff8cd);add(0,1.28,.557,.21,.12,.09,0xf4f0b6);
  for(const s of [-1,1]){
   add(s*.27,1.16,.553,.26,.30,.10,grey);add(s*.27,1.17,.613,.19,.23,.055,white);
   add(s*.27,1.17,.65,.11,.15,.04,0x827a9a);add(s*.27-.025,1.22,.678,.045,.055,.02,0xf4eff4);
   add(s*.46,.86,.499,.20,.11,.07,0xc6b4c4);
  }
  add(0,.78,.602,.70,.23,.08,dark);add(0,.69,.65,.55,.08,.035,0x9a809e);
  for(let i=0;i<5;i++)add((i-2)*.105,.86,.66,.075,.085,.04,0xf3eeee);
  for(const s of [-1,1])for(const z of [-.27,.32]){leg(s*.40,.16,z,.22,.28,.30,0x8a7080);add(s*.40,.18,z+.14,.20,.085,.12,0xcda9b2);}
  eyeLine=1.18;motion='scurry';
 }else if(key==='gazeti'){
  const deep=0x44597f,blue=0x6986ad,pale=0xa1bddc,white=0xd8e7ef,dark=0x27334f;fur=blue;
  // A long, pointed floating crystal face, assembled as alternating facets.
  for(let j=0;j<14;j++){
   const t=j/13,y=.30+j*.17,w=.37+Math.sin(t*Math.PI)*.85,d=.49+Math.sin(t*Math.PI)*.39;
   for(const side of [-1,1]){
    add(side*w*.25,y,-.05,w*.5,.185,d,side<0?(j%3?blue:pale):(j%3?deep:blue));
    add(side*w*.43,y,.15,w*.20,.16,d*.62,j%2?pale:blue);
   }
  }
  for(const [x,base,h]of [[-.34,2.08,.60],[.03,2.25,.74],[.38,2.04,.65]])for(let j=0;j<5;j++)add(x,base+j*h/5,-.05,.29-j*.043,h/5+.025,.39-j*.045,j%2?pale:blue);
  // White left edge and sharply projecting long nose match the lopsided mask.
  for(let j=0;j<10;j++){const y=1.10+j*.16;add(-.39+j*.028,y,.40,.14,.18,.27,j%2?white:pale);}
  for(let j=0;j<8;j++)add(-.05,1.25+j*.17,.49+j*.01,.27-j*.015,.18,.24, j%3?blue:white);
  for(const side of [-1,1]){
   const x=side*.31,y=side<0?1.51:1.56;
   add(x,y,.522,.34,.22,.09,dark);add(x,y+.005,.58,.23,.13,.045,white);add(x+side*.015,y+.005,.611,.105,.12,.025,0x5c76ac);add(x+side*.01,y+.02,.63,.05,.065,.018,0x29354e);
   rod([x-side*.18,y+.16,.51],[x+side*.16,y+.21,.44],.085,pale,.09);
  }
  add(0,.91,.527,.85,.39,.11,dark);add(0,.67,.48,.68,.14,.18,deep);
  for(let i=0;i<5;i++){
   const x=(i-2)*.155;add(x,1.10,.609,.13,.19,.10,pale);add(x,1.02,.637,.075,.13,.07,white);
   if(i%2===0){add(x,.70,.61,.13,.21,.10,pale);add(x,.80,.633,.07,.14,.07,white);}
  }
  // Floating broken crystal chips frame the head. They remain part of the
  // immutable silhouette; the whole head uses the existing floating rig.
  for(const [x,y,z,size]of [[-1.0,1.86,.04,.20],[1.0,2.02,-.12,.23],[-.94,1.03,.15,.16],[.95,1.31,.19,.18],[-.85,.60,-.06,.14],[.79,.44,.08,.14]]){
   add(x,y,z,size,size*1.32,size*.7,pale);add(x-size*.13,y+size*.50,z+.025,size*.62,size*.38,size*.64,white);add(x+size*.12,y-size*.58,z,size*.50,size*.33,size*.55,blue);
  }
  eyeLine=1.55;motion='float';
 }
 const height=Math.max(...parts.map(p=>p[1]+p[4]/2),...legs.map(p=>p.y+p.h/2))+.015;
 const spec=freeze({key,parts,legs,wings,fur,height,eyeLine,motion});models.set(key,spec);return spec;
}
