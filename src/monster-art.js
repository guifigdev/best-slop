// Original voxel silhouettes. These body parts are merged by the view into one
// coloured mesh; the existing four legs and 8 Hz body clips supply locomotion.
export function buildMonster(kind,body,voxel){
 if(!['lion','rhino','griffin','chimera','dragon','sphinx'].includes(kind))return null;
 const box=(x,y,z,w,h,d,c)=>voxel(body,x,y,z,w,h,d,c);
 const eyes=(x,y,z,glow=0x293b35)=>{for(const side of [-1,1]){box(x+side*.3,y,z,.14,.16,.06,glow);box(x+side*.31,y+.04,z+.035,.035,.04,.02,0xf1f1d6);}};
 const tail=(fur,tip=fur)=>{box(0,.94,-.99,.25,.25,.8,fur);box(.12,1.08,-1.4,.24,.26,.35,fur);box(.2,1.25,-1.57,.34,.34,.34,tip);};
 const featherWings=(feather=0xe5e1c8,shadow=0xaeb9aa)=>{for(const side of [-1,1]){box(side*.69,1.45,-.12,.42,.38,1.3,shadow);box(side*1.06,1.68,-.2,.55,.2,1.25,feather);box(side*1.47,1.88,-.33,.45,.17,.98,feather);box(side*1.78,2.03,-.47,.28,.15,.68,0xf2ebcf);for(let i=0;i<3;i++)box(side*(.95+i*.27),1.53+i*.16,-.75-i*.03,.2,.17,.55,shadow);}};
 const batWings=(skin=0xa96255,rib=0xd5b875)=>{for(const side of [-1,1]){box(side*.68,1.45,-.08,.3,.45,.95,rib);box(side*1.04,1.72,-.15,.55,.17,1.2,rib);box(side*1.43,2.0,-.26,.42,.16,.93,rib);box(side*1.71,2.23,-.4,.24,.16,.55,rib);box(side*1.04,1.51,-.31,.47,.28,1.05,skin);box(side*1.42,1.73,-.46,.35,.38,.76,skin);box(side*1.1,1.23,-.58,.3,.2,.5,skin);}};
 let fur,muzzle;
 if(kind==='lion'){
  fur=0xd6ac65;muzzle=0xefd8a1;
  box(0,.94,-.05,1.03,.94,1.65,fur);box(0,.7,.22,.86,.4,1.22,0xe4c58c);
  box(0,1.54,.56,1.28,1.2,.85,0x8e6140);box(0,2.08,.56,1.07,.3,.8,0xc28a45);
  for(const side of [-1,1]){box(side*.61,1.58,.63,.25,.85,.76,0xae773d);box(side*.49,2.02,.64,.3,.3,.35,0xd4a15b);box(side*.51,1.08,.59,.28,.3,.67,0x76573b);}
  box(0,1.62,.85,.9,.82,.7,fur);box(0,1.4,1.26,.75,.37,.33,muzzle);box(0,1.49,1.45,.24,.15,.07,0x51443a);
  eyes(0,1.78,1.22);tail(fur,0x92673d);box(0,1.15,1.35,.3,.14,.2,0x9a7045);
 }
 if(kind==='rhino'){
  fur=0x929f9b;muzzle=0xb0b7ab;
  box(0,1.0,-.1,1.27,1.13,1.93,fur);box(0,1.55,-.2,1.12,.27,1.59,0xa6b1a8);box(0,.86,.95,1.12,.83,1.05,0x8c9b96);
  box(0,.82,1.45,.92,.52,.45,muzzle);box(0,1.16,1.54,.35,.35,.36,0xd4cba9);box(0,1.46,1.62,.26,.34,.26,0xe8dfbc);box(0,1.74,1.69,.15,.28,.17,0xf1e8c9);
  box(0,1.25,1.01,.2,.28,.25,0xc7c0a6);for(const side of [-1,1]){box(side*.48,1.64,.64,.29,.4,.25,0x778983);box(side*.48,1.72,.78,.16,.2,.06,0xb1bab0);box(side*.63,.95,-.17,.1,.67,1.23,0x7e908a);}
  eyes(0,1.23,1.48);box(0,.96,-1.18,.18,.18,.47,0x7c8c87);box(0,.86,-1.44,.2,.3,.14,0x657b71);
 }
 if(kind==='griffin'){
  fur=0xd2b174;muzzle=0xe8b956;
  box(0,.94,-.13,1.03,.95,1.64,fur);box(0,1.14,.55,.96,1.0,.8,0xdedbc3);box(0,1.83,.74,.85,.83,.8,0xede9d3);
  box(0,2.27,.47,.27,.34,.48,0xe4dec5);box(0,2.11,1.15,.85,.17,.18,0xb9c3b6);box(0,1.77,1.3,.59,.34,.55,muzzle);box(0,1.55,1.48,.3,.3,.27,0xb48a39);
  eyes(0,1.96,1.17);for(const side of [-1,1]){box(side*.43,1.37,.8,.18,.55,.45,0xbfc6b5);box(side*.46,1.12,.66,.16,.24,.3,0xf4ecd4);}
  featherWings();tail(fur,0xa07b47);
 }
 if(kind==='chimera'){
  fur=0xa37b75;muzzle=0xd0b69a;
  box(0,.94,-.17,1.18,.95,1.72,fur);box(0,1.2,.3,1.15,.7,1.12,0x8e6767);batWings(0x875c79,0xbca18b);
  // Three different heads: central lion, left horned goat, right serpent.
  box(0,1.72,.82,.82,.83,.78,0xbb8f64);box(0,1.49,1.25,.62,.34,.35,0xe0c79d);box(0,1.59,1.46,.2,.13,.06,0x53433e);eyes(0,1.88,1.22,0xe1ce80);
  box(-.61,1.54,.72,.53,.68,.6,0xb9b9a3);box(-.61,1.35,1.08,.42,.31,.3,0xe0d6b9);for(const x of [-.81,-.42]){box(x,2.0,.53,.16,.42,.19,0xc8b78f);box(x-.04,2.2,.45,.18,.16,.25,0x9d8f75);}for(const x of [-.78,-.44])box(x,1.7,1.04,.085,.12,.05,0x424b3b);
  box(.6,1.48,.52,.38,.96,.38,0x719a7e);box(.6,1.94,.86,.53,.42,.68,0x8db090);box(.6,1.89,1.23,.46,.15,.2,0xc7d6a0);for(const x of [.44,.76])box(x,2.03,1.19,.07,.1,.06,0xf0d580);box(.6,1.79,1.28,.07,.06,.22,0xc88472);
  box(0,1.0,-1.13,.25,.25,.8,0x668a74);box(.15,1.21,-1.52,.25,.4,.3,0x85a687);box(.23,1.48,-1.55,.31,.25,.35,0x9bb18b);box(.23,1.47,-1.76,.07,.06,.2,0xd09575);
 }
 if(kind==='dragon'){
  fur=0x719c81;muzzle=0xb5c69b;
  box(0,.96,-.17,1.08,1.04,1.68,fur);box(0,1.4,.48,.8,1.15,.79,0x739f83);box(0,2.0,.84,.96,.7,.9,0x86af8e);
  box(0,1.8,1.36,.72,.38,.46,muzzle);box(0,1.68,1.45,.71,.1,.38,0x954e48);box(0,1.6,1.4,.69,.12,.43,0x9bb68c);
  for(const side of [-1,1]){box(side*.39,2.46,.53,.2,.43,.22,0xd8d0aa);box(side*.45,2.67,.4,.15,.15,.33,0xf2e0b5);box(side*.25,1.71,1.55,.1,.18,.08,0xeee4be);box(side*.43,2.15,1.17,.23,.2,.12,0x517a63);}
  eyes(0,2.12,1.31,0xefc37e);batWings(0xb66c59,0xceb586);
  box(0,.91,-1.14,.42,.4,.8,0x688e74);box(0,.97,-1.7,.3,.29,.55,0x81a083);box(0,1.12,-2.07,.2,.23,.37,0xc59460);
  for(let i=0;i<4;i++)box(0,1.65-i*.03,.08-i*.39,.18,.29,.22,i%2?0xc48b57:0xdbb473);box(0,1.09,.55,.62,.7,.18,0xb8c89d);
 }
 if(kind==='sphinx'){
  fur=0xd4b779;muzzle=0xedd6a4;
  box(0,.94,-.15,1.08,.91,1.75,fur);box(0,1.32,.64,.9,1.05,.71,0xc69e5d);box(0,1.86,.7,.9,.9,.75,0xe0bc76);
  // Blue-and-gold striped nemes; the face stays animal-like, not a human face.
  box(0,2.34,.64,1.14,.22,.83,0x487e91);for(const side of [-1,1]){box(side*.53,1.8,.59,.27,1.03,.79,0x497e8e);for(let i=0;i<4;i++)box(side*.55,2.15-i*.22,.99,.3,.1,.055,0xdfba6e);box(side*.62,1.25,.59,.34,.25,.77,0xc69f5b);}
  box(0,1.84,1.1,.73,.62,.08,0xecd5a1);box(0,1.56,1.29,.61,.28,.31,muzzle);box(0,1.64,1.47,.19,.12,.06,0x67513a);eyes(0,1.98,1.17,0x314e58);
  box(0,1.27,1.05,.2,.36,.22,0x46778a);box(0,1.07,.5,1.13,.22,.95,0x4e8292);box(0,1.22,.97,.46,.2,.16,0xf0d58e);box(0,2.55,.72,.23,.26,.19,0xe7c779);tail(fur,0x997644);
 }
 return{fur,muzzle};
}
