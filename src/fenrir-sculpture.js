// The wolf's shape is built from tapered cross-sections, not armour-shaped
// boxes. Small surface tufts reinforce its silhouette without separate draws.
export function sculptFenrir(){
 const parts=[],legs=[],fur=0x788995,dark=0x435766,pale=0xb9c5c5,ivory=0xeee7ce,gold=0xbda574;
 const b=(...p)=>parts.push(p),mass=(x,y,z,w,h,d,c,n=7)=>{const columns=n===3?1:Math.ceil(d/.17);for(let i=0;i<n;i++)for(let j=0;j<columns;j++){const t=(i+.5)/n*2-1,v=(j+.5)/columns*2-1,profile=t*t*.9+(columns>1?v*v*.9:0);if(profile>.97)continue;const width=Math.sqrt(Math.max(.08,1-profile));b(x,y-h/2+h*(i+.5)/n,z-d/2+d*(j+.5)/columns,w*width,h/n+.005,d/columns+.006,i===n-1?pale:i<2?dark:c);}};
 mass(0,1.12,-.28,1.08,.88,1.83,fur);mass(0,1.29,.49,1.23,1.13,1.02,fur);mass(0,1.04,-.94,.91,.86,.7,fur,5);
 mass(0,1.65,.77,.89,.96,.77,fur);mass(0,1.98,1.04,.85,.68,.85,fur,7);
 for(let i=0;i<5;i++){const z=1.35+i*.12;b(0,1.76+i*.012,z,.69-i*.055,.29-i*.022,.145,pale);b(0,1.53+i*.018,z,.54-i*.035,.12,.145,fur);}
 b(0,1.70,1.82,.5,.065,.38,0x293b46);b(0,1.85,1.96,.43,.17,.17,0x263944);b(-.075,1.92,2.055,.16,.035,.024,0x9fb5b9);
 for(const side of [-1,1]){
  b(side*.34,2.02,1.38,.18,.095,.045,0xc8f1e5);b(side*.34,2.015,1.412,.044,.07,.018,0x253b45);b(side*.34,2.055,1.427,.04,.026,.014,ivory);
  for(let i=0;i<4;i++)b(side*(.26+i*.055),2.1-i*.027,1.37,.07,.055,.06,dark);
  for(let row=0;row<6;row++){const w=.28-row*.036;b(side*(.34+row*.007),2.31+row*.075,.85,w,.09,.3-row*.027,row<4?fur:pale);if(row<4)b(side*.35,2.32+row*.075,1.016-row*.014,w*.5,.06,.027,dark);}
  for(let i=0;i<3;i++){b(side*(.22+i*.075),1.64,1.76+i*.075,.055,.12-i*.02,.07,ivory);}
  b(side*.31,1.62,1.58,.09,.28,.11,ivory);b(side*.31,1.49,1.62,.055,.1,.07,ivory);
  // Cheek ruffs taper backward along the neck, leaving the muzzle narrow.
  for(let i=0;i<7;i++){const z=.5+i*.105,x=side*(.49+(6-i)*.025);b(x,1.57+i*.065,z,.18,.26-i*.01,.2,i%3===0?pale:fur);}
  for(let row=0;row<5;row++)for(let col=0;col<9;col++){
   const z=-1.04+col*.21,shoulder=z>.12,cy=shoulder?1.29:1.12,h=shoulder?1.13:.88,d=shoulder?1.02:1.83,cz=shoulder?.49:-.28,w=shoulder?1.23:1.08,t=(row-2)*.27,v=(z-cz)/(d*.5),profile=.9*(t*t+v*v);if(profile>.94)continue;const y=cy+t*h*.5,x=side*(w*.5*Math.sqrt(1-profile)+.008);
   b(x,y,z,.12,.16,.15,(row+col)%5===0?pale:(row+col)%3===0?0x607684:0x899ca4);
  }
  for(let i=0;i<8;i++)b(side*(.16+i*.045),1.02+i*.078,1.02,.07,.17,.1,i%2?pale:0xd0d5cb);
 }
 for(let row=0;row<9;row++)for(let col=-1;col<=1;col++){const z=-1.05+row*.205,x=col*.17,shoulder=z>.12,cy=shoulder?1.29:1.12,h=shoulder?1.13:.88,d=shoulder?1.02:1.83,cz=shoulder?.49:-.28,v=(z-cz)/(d*.5),top=cy+h*.5*Math.sqrt(Math.max(.05,1-v*v*.9))-Math.abs(col)*.06;b(x,top+.025,z,.14,.13+(row%3)*.025,.23,(row+col)%3===0?pale:dark);}
 for(let i=0;i<10;i++){const t=i/9,z=-1.15-t*1.22,y=.9+Math.sin(t*1.8)*.66,w=.36*(1-t*.72);mass(Math.sin(t*2.2)*.12,y,z,w,.35*(1-t*.45),.25,i>6?pale:fur,3);}
 // Gleipnir is a thin collar and a small rune charm, not a breastplate.
 for(let i=0;i<11;i++){const a=i/10*Math.PI*2;b(Math.sin(a)*.59,1.34+Math.cos(a)*.43,.81,.085,.1,.1,i%3===0?ivory:gold);}
 b(0,.91,1.025,.17,.19,.055,gold);b(0,.91,1.06,.028,.12,.02,ivory);b(.025,.94,1.065,.07,.025,.015,ivory);
 for(const side of [-1,1])for(const z of [-.86,.59]){
  const x=side*.43,local=[],put=(...p)=>local.push(Object.freeze(p));
  put(0,.12,0,.29,.55,.32,dark);put(side*.035,.28,-.04,.34,.22,.39,fur);put(0,-.22,.11,.36,.21,.54,pale);put(0,-.32,.18,.34,.07,.48,dark);
  for(let toe=-1;toe<=1;toe++){put(toe*.103,-.2,.365,.08,.12,.12,fur);put(toe*.103,-.255,.44,.048,.055,.1,ivory);}
  for(let i=0;i<3;i++)put(side*.16,.24-i*.1,.04,.07,.12,.17,pale);
  legs.push(Object.freeze({x,y:.37,z,w:.32,h:.7,d:.4,color:dark,parts:Object.freeze(local)}));
 }
 return{key:'fenrir',theme:'nordic-hero',parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs),wings:Object.freeze([]),fur,muzzle:pale,height:2.77,eyeLine:2.02,motion:'quadruped'};
}
