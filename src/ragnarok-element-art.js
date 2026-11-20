// Voxel reconstructions studied directly from Ragnarok Online's sprite poses.
// Each sculpture uses one cached, merged body plus the existing limb/wing rig.
const models=new Map();
const KEYS=new Set(['icetitan','kasa','salamander','poring','marin']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export function ragnarokElementSpec(key){
 if(!KEYS.has(key))return null;if(models.has(key))return models.get(key);
 const parts=[],legs=[],wings=[],flames=[],add=(...part)=>parts.push(part);
 const ellipsoid=(cx,cy,cz,rx,ry,rz,palette,step=.15)=>{
  const ny=Math.ceil(ry*2/step),nz=Math.ceil(rz*2/step),dy=ry*2/ny,dz=rz*2/nz;
  for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
   const y=(iy+.5)*dy-ry,z=(iz+.5)*dz-rz,q=1-y*y/(ry*ry)-z*z/(rz*rz);if(q<=.035)continue;
   const width=Math.max(step,Math.floor(2*rx*Math.sqrt(q)/step)*step),colour=palette[Math.min(palette.length-1,Math.floor((iy/ny*.62+iz/nz*.38)*palette.length))];
   add(cx,cy+y,cz+z,width,dy+.007,dz+.007,colour);
  }
 };
 const flame=(x,y,z,size=1,axis=0)=>{
  flames.push({x,y:y+.15*size,z,scale:size});
  for(let j=0;j<4;j++){const t=j/3;add(x+Math.sin(j*1.7+axis)*.08*size,y+t*.55*size,z+Math.cos(j*1.4+axis)*.045*size,(.3-t*.2)*size,(.25-t*.06)*size,(.25-t*.16)*size,[0x9e2019,0xe74916,0xff9b23,0xffe07c][j]);}
 };
 let fur=0,eyeLine=1,height=2,motion='walk';
 if(key==='poring'||key==='marin'){
  const ice=key==='marin',p=ice?[0x4f91c7,0x6eb7de,0x9ddaf1,0xc9eff4]:[0xd35e73,0xec8791,0xffa5a7,0xffc7bc];fur=p[1];
  // A low broad base and continuous rounded crown, with a slight forward lean.
  ellipsoid(0,.65,0,.87,.67,.75,p,.11);
  for(const s of [-1,1]){
   add(s*.31,.66,.695,.105,.22,.04,0x342a39);add(s*.31-.02,.705,.723,.035,.055,.025,0xffeee0);
   add(s*.41,.43,.64,.16,.07,.035,ice?0xe0f6f6:0xf5b1ab);
  }
  for(const [x,y]of [[-.15,.39],[-.075,.35],[0,.33],[.075,.35],[.15,.39]])add(x,y,.713,.075,.045,.03,ice?0x355b85:0xa34661);
  // White crescent follows the upper-left dome rather than forming a square patch.
  for(let i=0;i<8;i++){const a=.32+i*.145;add(-Math.sin(a)*.68,.61+Math.cos(a)*.63,.28+i*.035,.13,.105,.08,ice?0xf1ffff:0xffecd4);}
  add(.42,1.53,-.08,.14,.15,.14,p[3]);add(.42,1.61,-.08,.09,.04,.09,0xfff0db);
  height=1.7;eyeLine=.7;motion='slither';
 }else if(key==='icetitan'){
  const dark=0x51446d,shadow=0x75648e,lavender=0xa194ba,light=0xc7c4df,white=0xeae7f2;fur=lavender;
  // The sprite's weight hangs forward: narrow pelvis, a vast bent upper back,
  // shoulders above the face and almost floor-length crystalline forearms.
  ellipsoid(0,1.88,-.23,.79,.86,.61,[shadow,lavender,light],.22);
  ellipsoid(0,1.12,-.07,.48,.55,.43,[dark,shadow,lavender],.22);
  for(const side of [-1,1]){
   ellipsoid(side*.91,2.29,-.13,.56,.61,.56,[shadow,lavender,light],.24);
   ellipsoid(side*1.22,1.51,.11,.40,.76,.43,[shadow,lavender,light],.24);
   ellipsoid(side*1.28,.77,.36,.43,.36,.47,[dark,lavender,light],.23);
   // Stepped, sharp crystalline facets on the shoulder and knuckles.
   for(let i=0;i<5;i++){const x=side*(.54+i*.19),y=2.54+Math.sin(i*.8)*.29,z=-.02+(i%2)*.23;add(x,y,z,.27,.32,.30,light);add(x-side*.045,y+.17,z+.04,.16,.10,.18,white);}
   for(let i=0;i<3;i++){const x=side*(1.02+i*.18);add(x,.72,.68,.17,.27,.24,i%2?light:lavender);add(x,.79,.82,.12,.12,.07,white);}
   // Short, chunky legs stay at the body's edge rather than a human stance.
   legs.push({x:side*.43,y:.41,z:-.04,w:.48,h:.74,d:.58,color:shadow});
   add(side*.45,.20,.24,.58,.31,.75,lavender);add(side*.45,.19,.61,.49,.17,.17,light);
   for(let i=0;i<3;i++){add(side*(.27+i*.16),.30,.34,.12,.20,.34,white);}
  }
  // Its hollow dark face, red pin eyes, long chin and vertical white ribs are iconic.
  add(0,2.22,.43,.66,.73,.25,dark);add(0,2.60,.39,.65,.18,.31,light);add(0,1.95,.50,.48,.18,.23,lavender);
  for(const side of [-1,1]){add(side*.22,2.42,.58,.14,.10,.045,white);add(side*.18,2.39,.615,.07,.045,.035,0xc23e55);add(side*.30,2.18,.60,.10,.38,.11,light);add(side*.20,2.07,.65,.09,.22,.09,white);}
  add(0,2.23,.66,.11,.30,.11,lavender);add(0,2.0,.60,.12,.12,.13,white);
  for(let i=-2;i<=2;i++){add(i*.14,1.66,.46,.075,.46-Math.abs(i)*.03,.11,white);add(i*.14,1.40,.47,.085,.09,.12,light);}
  for(let i=0;i<5;i++){add((i%2-.5)*.44,2.75+(i%3)*.11,-.49+(i%2)*.15,.29,.26,.32,i%2?light:lavender);}
  height=3.15;eyeLine=2.42;motion='heavy';
 }else if(key==='salamander'){
  const red=0x9b282b,scale=0xc13f28,shadow=0x60242c,gold=0xef842b;fur=scale;
  ellipsoid(0,.80,-.17,.55,.45,1.02,[shadow,red,scale],.20);
  ellipsoid(0,.63,.83,.39,.30,.63,[shadow,red,scale],.18);
  add(0,.48,1.40,.42,.19,.58,red);add(0,.60,1.53,.32,.16,.35,scale);add(0,.43,1.53,.39,.08,.46,0xe28642);
  for(const s of [-1,1]){
   add(s*.23,.82,1.02,.18,.19,.31,0x672629);add(s*.26,.79,1.19,.10,.07,.07,0xffd471);
   add(s*.24,.40,1.45,.07,.14,.09,0xffc77b);
   for(const z of [-.66,.62]){
    add(s*.61,.56,z,.47,.26,.38,red);legs.push({x:s*.80,y:.24,z:z+.15,w:.30,h:.40,d:.43,color:scale});
    for(let i=0;i<3;i++)add(s*(.72+i*.09),.10,z+.43,.075,.08,.18,0xf2ab65);
   }
  }
  // Segmented curled tail sweeps outward then curls back at its tapered tip.
  for(let i=0;i<10;i++){const a=i*.23,r=.58+i*.045,x=Math.sin(a)*r,z=-.95-i*.17,y=.73+Math.sin(i*.29)*.19,w=.47-i*.035;add(x,y,z,w,.30-i*.018,.36,i%2?red:scale);if(i<7)add(x,y+.19,z,.17,.13,.21,shadow);}
  for(let i=0;i<5;i++){const z=.40-i*.39;for(const s of [-1,1]){add(s*.30,1.10-Math.abs(i-2)*.015,z,.24,.13,.33,i%2?scale:red);add(s*.16,1.22,z,.11,.22,.17,gold);}}
  for(const [x,y,z,sz]of [[-.47,.93,.55,.7],[.43,1.01,.10,.95],[-.29,1.13,-.49,.85],[.18,1.03,-.95,.65],[0,.80,1.02,.9]])flame(x,y,z,sz,2);
  height=1.85;eyeLine=.8;motion='scurry';
 }else if(key==='kasa'){
  const coal=0x481b20,red=0x9f241c,orange=0xf45d18,yellow=0xffba33,white=0xffe589;fur=red;
  ellipsoid(0,.88,-.11,.40,.32,.75,[coal,red,orange],.16);
  ellipsoid(0,1.10,.63,.29,.30,.42,[coal,red,orange],.16);
  add(0,.98,1.03,.27,.25,.46,red);add(0,.91,1.29,.18,.17,.26,orange);add(0,.84,1.37,.17,.10,.23,yellow);
  for(const s of [-1,1]){add(s*.19,1.21,.91,.10,.07,.08,yellow);add(s*.20,1.04,.82,.12,.24,.17,coal);for(let i=0;i<3;i++)add(s*(.19+i*.04),.73-i*.17,.92-i*.10,.09-i*.015,.29,.12,[orange,yellow,white][i]);}
  // Wings are ragged branching fire, never filled bat membranes. Bone-black
  // branches carry red-to-yellow flame streams with long separate fingers.
  for(const s of [-1,1]){
   const pivot=[s*.26,1.02,-.02],wp=[],w=(x,y,z,ww,hh,dd,c)=>wp.push([x-pivot[0],y-pivot[1],z-pivot[2],ww,hh,dd,c]);
   for(let i=0;i<7;i++){
    const x=s*(.42+i*.20),y=1.15+Math.sin(i*.45)*.20,z=-.1-i*.13;
    w(x,y,z,.31,.16,.24,i<3?coal:red);
    for(let j=0;j<3;j++){w(x+s*j*.07,y+.13+j*.09,z-j*.08,.17-j*.04,.17-j*.035,.20,[red,orange,yellow][j]);}
    if(i%2===0)for(let j=0;j<3;j++)w(x+s*j*.10,y-.1-j*.06,z-.29-j*.14,.15,.11,.28,[red,orange,yellow][j]);
   }
   for(let i=0;i<3;i++){const x=s*(1.72+i*.12);w(x,1.10+i*.13,-.94-i*.10,.17,.12,.26,i===2?white:yellow);}
   wings.push({side:s,pivot,parts:wp});
  }
  // Fiery tail and dangling hooked feet in the sprite's hovering pose.
  for(let i=0;i<7;i++){add(Math.sin(i*.46)*.23,.82+i*.04,-.77-i*.20,.25-i*.02,.17,.32,i%2?orange:red);if(i>3)add(Math.sin(i*.46)*.23,.96+i*.04,-.77-i*.20,.14,.16,.23,yellow);}
  for(const s of [-1,1]){legs.push({x:s*.23,y:.43,z:-.10,w:.14,h:.50,d:.17,color:red});add(s*.25,.23,.02,.22,.12,.30,orange);add(s*.26,.20,.19,.12,.08,.18,yellow);}
  for(const [x,y,z,size]of [[0,1.35,.38,.75],[.18,1.07,-.40,.7],[-.19,1.10,-.69,.75]])flame(x,y,z,size,1);
  height=2.1;eyeLine=1.20;motion='fly';
 }
 const spec=freeze({key,parts,legs,wings,flames,fur,height,eyeLine,motion});models.set(key,spec);return spec;
}
