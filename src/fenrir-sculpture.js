// A powerful wolf silhouette with deliberate dark-to-light fur bands.
export function sculptFenrir(){
 const parts=[],legs=[],fur=0x242033,dark=0x13121f,pale=0x9790ac,ivory=0xddd5c6,steel=0x6e6887,edge=0xb8aec9;
 const b=(...p)=>parts.push(p),palette=[0xaaa2b8,0x82788f,0x53455e,0x33283f,fur,dark,dark];
 const mass=(x,y,z,w,h,d,n=7)=>{const columns=Math.ceil(d/.20);for(let i=0;i<n;i++)for(let j=0;j<columns;j++){const t=(i+.5)/n*2-1,v=(j+.5)/columns*2-1,profile=t*t*.88+v*v*.88;if(profile>.97)continue;b(x,y-h/2+h*(i+.5)/n,z-d/2+d*(j+.5)/columns,w*Math.sqrt(Math.max(.08,1-profile)),h/n+.006,d/columns+.006,palette[Math.min(6,Math.floor(i/n*7))]);}};
 // Narrow waist, broad pectorals and a heavy raised shoulder ridge.
 mass(0,1.19,-.30,1.25,.98,1.88);mass(0,1.40,.48,1.63,1.25,1.03);mass(0,1.13,-1.03,1.19,1,.72,5);
 mass(0,1.76,.77,1.12,1.05,.77);mass(0,2.10,1.09,.99,.75,.87);
 for(let i=0;i<5;i++){const z=1.41+i*.12;b(0,1.87+i*.012,z,.73-i*.065,.28-i*.024,.15,i<2?0x675b78:pale);b(0,1.63+i*.018,z,.57-i*.04,.13,.15,0x55465f);}
 b(0,1.80,1.90,.54,.065,.40,dark);b(0,1.95,2.05,.45,.18,.19,0x11111b);b(-.075,2.02,2.15,.16,.03,.025,0x696179);
 for(const side of [-1,1]){
  b(side*.39,2.14,1.45,.20,.095,.045,0xc49bff);b(side*.39,2.14,1.48,.045,.075,.018,dark);b(side*.39,2.17,1.49,.045,.025,.014,ivory);
  for(let row=0;row<6;row++){const w=.31-row*.041;b(side*(.38+row*.006),2.46+row*.078,.88,w,.09,.33-row*.031,row<4?fur:dark);if(row<4)b(side*.39,2.47+row*.078,1.054-row*.016,w*.5,.06,.024,0x6c4c83);}
  b(side*.33,1.73,1.71,.09,.29,.11,ivory);for(let i=0;i<3;i++)b(side*(.22+i*.08),1.75,1.85+i*.07,.06,.12-i*.02,.07,ivory);
  // Flowing, symmetrical ruff: no speckled checkerboard fur.
  for(let i=0;i<6;i++)b(side*(.54+(5-i)*.032),1.71+i*.07,.48+i*.12,.20,.30-i*.015,.23,i<3?0x33283f:0x44334f);
  for(let i=0;i<5;i++)b(side*(.57-i*.045),1.05+i*.095,.97,.16,.22,.12,palette[Math.min(4,i)]);
 }
 for(let i=0;i<10;i++){const z=-1.10+i*.20,y=1.70+(z>.0?.25:0);b(0,y,z,.35,.16,.27,dark);}
 for(let i=0;i<9;i++){const t=i/8;mass(Math.sin(t*2)*.14,1.04+Math.sin(t*1.8)*.57,-1.27-t*1.20,.44*(1-t*.65),.35*(1-t*.35),.26,3);}
 const link=(put,x,y,z,turn=false,size=.19)=>{const thick=.047;if(turn){put(x-size/2,y,z,thick,size*.8,.10,steel);put(x+size/2,y,z,thick,size*.8,.10,edge);put(x,y-size*.4,z,size,thick,.10,steel);put(x,y+size*.4,z,size,thick,.10,edge);}else{put(x,y,z-size/2,.10,size*.8,thick,steel);put(x,y,z+size/2,.10,size*.8,thick,edge);put(x,y-size*.4,z,.10,thick,size,steel);put(x,y+size*.4,z,.10,thick,size,edge);}};
 // Thick collar, snapped hanging chains and a small Gleipnir rune clasp.
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;b(Math.sin(a)*.68,1.48+Math.cos(a)*.48,.88,.15,.15,.16,i%2?steel:edge);}
 b(0,.97,1.04,.26,.24,.09,steel);b(0,.97,1.10,.035,.16,.025,0xd3b0ff);
 for(const side of [-1,1])for(let i=0;i<5;i++)link(b,side*(.76+i*.075),1.42-i*.17,.70-i*.04,i%2===0,.20);
 for(const side of [-1,1])for(const z of [-.94,.61]){
  const front=z>0,x=side*(front?.55:.46),local=[],put=(...p)=>local.push(Object.freeze(p));
  put(0,.22,0,front?.46:.40,.69,.43,fur);put(side*.045,.43,-.04,front?.51:.44,.32,.49,0x33283f);put(0,-.20,.12,.47,.26,.62,0x675b78);put(0,-.34,.18,.46,.08,.57,dark);
  for(let toe=-1;toe<=1;toe++){put(toe*.14,-.18,.42,.11,.14,.16,0x44334f);put(toe*.14,-.25,.51,.06,.065,.13,ivory);}
  if(front){for(const sign of [-1,1]){put(sign*.26,.03,.02,.075,.15,.49,steel);put(0,.03,.02+sign*.26,.52,.15,.075,edge);}for(let i=0;i<3;i++)link(put,side*(.30+i*.12),-.06-i*.08,-.02-i*.14,i%2===0,.17);}
  legs.push(Object.freeze({x,y:.42,z,w:.46,h:.93,d:.62,color:fur,parts:Object.freeze(local)}));
 }
 return{key:'fenrir',theme:'nordic-hero',parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs),wings:Object.freeze([]),fur,muzzle:pale,height:3.02,eyeLine:2.14,motion:'quadruped'};
}
