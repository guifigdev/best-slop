// Pure voxel descriptors shared by the hero renderer, NPCs and portrait palette.
// Colours follow the existing animal portraits, not a class-colour replacement.
const common={trim:0xd5bc7d,eye:0x304238,ivory:0xe4dfc8};
export const HERO_VISUALS=Object.freeze({
 knight:Object.freeze({...common,fur:0xb9946c,muzzle:0xc7a580,cloth:0x536d79,ear:0x9d7c57,nose:0x665246}),
 mage:Object.freeze({...common,fur:0xdfd9cf,muzzle:0xefe9df,cloth:0x697895,ear:0xcfaaa4,nose:0xb78d8b}),
 ranger:Object.freeze({...common,fur:0xd59158,muzzle:0xeee0bd,cloth:0x608777,ear:0x6c5444,nose:0x51473e}),
 turtle:Object.freeze({...common,fur:0xa3bd88,muzzle:0xc8d4a5,cloth:0x5f7e80,ear:0x66866b,nose:0x66866b,shell:0x66866b,scute:0x9db184}),
 owl:Object.freeze({...common,fur:0xa68a65,muzzle:0xe0d2ac,cloth:0x617a88,ear:0x8d7658,nose:0xdeb466,face:0xe8d9b6,wing:0x7d725b}),
 raccoon:Object.freeze({...common,fur:0xb5ad98,muzzle:0xdfd9bf,cloth:0x716d83,ear:0xa7a08d,nose:0x45504a,mask:0x4a5550,tail:0x7d8880})
});

export function buildHeroModel(kind,body,voxel){
 if(!Object.hasOwn(HERO_VISUALS,kind))return null;
 const c=HERO_VISUALS[kind],b=(...parts)=>voxel(body,...parts),wings=[];
 const leg=(x,z,w=.27,h=.5,d=.3,color=c.fur,y=.3)=>({x,y,z,w,h,d,color});
 let legs=[leg(-.32,-.48),leg(.32,-.48),leg(-.32,.48),leg(.32,.48)],height=2.2,eyeLine=1.68;
 function eyes(x,y,z,spacing=.3){for(const sign of [-1,1]){b(x+sign*spacing,y,z,.13,.17,.045,c.eye);b(x+sign*spacing-.025,y+.035,z+.027,.035,.045,.02,c.ivory);}}
 function brooch(x,y,z){b(x,y,z,.2,.2,.07,c.trim);b(x,y,z+.045,.07,.12,.025,c.cloth);}
 function circlet(y,z,width=.99){b(0,y,z,width,.1,.07,c.trim);b(0,y+.03,z+.045,.14,.17,.035,0xe5d19b);}
 if(kind==='knight'){
  // Broad blunt snout, low ears and long barrel body: a capybara silhouette.
  b(0,.94,-.04,1.02,.96,1.55,c.fur);b(0,1.5,.62,1.05,.86,.93,c.fur);b(0,1.28,1.17,.84,.42,.48,c.muzzle);
  for(const x of [-.4,.4]){b(x,2.03,.52,.28,.28,.27,c.ear);b(x,2.05,.67,.12,.14,.035,c.muzzle);}eyes(0,1.68,1.105,.37);
  for(const x of [-.2,.2])b(x,1.38,1.425,.09,.08,.025,c.nose);b(0,1.16,1.43,.46,.035,.025,c.nose);
  b(0,.91,.08,1.07,.31,1.58,c.cloth);b(0,1.08,.87,.68,.12,.16,c.ivory);brooch(0,.95,.9);circlet(1.94,1.03,.97);
  b(-.68,.97,.4,.16,.84,.82,c.cloth);b(-.79,.98,.4,.06,.58,.56,c.trim);b(-.83,.99,.4,.05,.27,.24,0x9bb8b9);
 }
 if(kind==='mage'){
  // Upright rabbit with two long ears, small nose and cotton tail.
  b(0,.95,-.05,.8,1.05,1.1,c.fur);b(0,1.57,.39,.94,.84,.77,c.fur);b(0,1.38,.83,.55,.33,.26,c.muzzle);
  for(const x of [-.29,.29]){b(x,2.34,.29,.26,.94,.26,c.fur);b(x,2.37,.445,.115,.66,.04,c.ear);}eyes(0,1.69,.8,.28);
  b(0,1.46,1.0,.13,.1,.06,c.nose);b(0,1.29,.99,.18,.035,.025,0x9d8e82);b(0,.86,-.73,.39,.39,.34,c.muzzle);
  b(0,.92,.03,.88,.45,1.16,c.cloth);b(0,1.12,.62,.65,.14,.12,c.ivory);brooch(0,.96,.65);circlet(1.96,.78,.83);
  b(-.59,1.04,.25,.105,1.75,.11,0x9e845b);b(-.59,2.02,.25,.34,.37,.33,0xafc8d8);b(-.59,2.05,.43,.13,.17,.025,0xe8d6a2);
  legs=[leg(-.29,.26,.29,.38,.52,c.fur,.25),leg(.29,.26,.29,.38,.52,c.fur,.25)];height=2.9;eyeLine=1.7;
 }
 if(kind==='ranger'){
  // Fox: narrow stepped muzzle, dark ear interiors and a large cream-tipped tail.
  b(0,.92,-.07,.88,.89,1.4,c.fur);b(0,1.48,.49,.87,.81,.72,c.fur);b(0,1.3,.93,.59,.32,.42,c.muzzle);b(0,1.28,1.18,.34,.22,.2,c.muzzle);b(0,1.33,1.305,.18,.12,.055,c.nose);
  for(const x of [-.31,.31]){b(x,2.05,.36,.27,.49,.29,c.fur);b(x,2.08,.53,.13,.28,.04,c.ear);}eyes(0,1.62,.87,.28);
  b(0,1.0,-1.05,.47,.47,.88,c.fur);b(0,1.13,-1.56,.5,.48,.42,c.muzzle);b(0,.97,-1.77,.33,.28,.16,0xf4e8c9);
  b(0,.97,.08,.95,.3,1.12,c.cloth);b(0,1.14,.64,.63,.13,.11,c.ivory);brooch(0,.99,.7);circlet(1.85,.85,.82);
  b(.55,1.06,-.2,.25,.78,.45,0x957b54);for(const z of [-.33,-.13]){b(.57,1.56,z,.06,.37,.06,0xd5c393);b(.57,1.77,z,.14,.13,.1,0xdde6d5);}height=2.35;eyeLine=1.63;
 }
 if(kind==='turtle'){
  // Low quadruped with shell plates. The head is not the capybara head template.
  b(0,.8,-.04,.96,.61,1.43,c.fur);b(0,1.16,-.25,1.32,.78,1.52,c.shell);b(0,1.59,-.25,.94,.22,1.08,c.scute);
  for(const x of [-.34,0,.34])for(const z of [-.59,-.25,.09])b(x,1.72-(Math.abs(x)>.2?.04:0),z,.3,.09,.3,(x===0&&z===-.25)?c.muzzle:c.scute);
  b(0,1.12,.78,.78,.55,.78,c.fur);b(0,.98,1.18,.67,.27,.23,c.muzzle);eyes(0,1.25,1.18,.25);b(0,.99,1.31,.4,.035,.025,c.nose);
  b(0,.77,.76,.88,.17,.46,c.cloth);brooch(0,.8,1.02);circlet(1.4,1.11,.72);legs=[leg(-.43,-.48,.29,.35,.35,c.fur,.24),leg(.43,-.48,.29,.35,.35,c.fur,.24),leg(-.43,.48,.29,.35,.35,c.fur,.24),leg(.43,.48,.29,.35,.35,c.fur,.24)];height=1.94;eyeLine=1.25;
 }
 if(kind==='owl'){
  // A compact vertical owl: large facial discs, a stepped beak, feather tufts,
  // two talons and folded wings. Deliberately no long body or mammalian muzzle.
  b(0,1.02,-.03,.96,1.14,.81,c.fur);b(0,1.76,.1,1.11,.94,.79,c.fur);b(0,.82,.4,.74,.77,.14,c.muzzle);
  for(const x of [-.285,.285]){b(x,1.79,.525,.49,.53,.075,c.face);b(x,1.8,.58,.19,.25,.06,c.eye);b(x-.03,1.85,.622,.055,.065,.025,c.ivory);b(x*1.32,2.28,.04,.26,.38,.3,c.fur);b(x*1.45,2.46,-.02,.17,.16,.25,c.ear);}
  b(0,1.49,.66,.24,.28,.28,c.nose);b(0,1.36,.785,.13,.14,.16,0xc79f55);b(0,1.26,.87,.08,.09,.07,0xe8c374);
  b(0,.72,.12,1.0,.29,.72,c.cloth);b(0,.93,.5,.73,.12,.1,c.ivory);brooch(0,.77,.53);circlet(2.16,.5,1.02);b(0,.68,-.55,.56,.18,.38,c.wing);
  for(const side of [-1,1])wings.push({side,pivot:[side*.45,1.16,-.02],parts:[[side*.11,0,-.03,.27,.85,.62,c.wing],[side*.14,-.3,.08,.24,.3,.43,c.fur],[side*.14,.2,.08,.26,.18,.53,c.muzzle]]});
  for(const x of [-.23,.23])b(x,.42,.1,.1,.28,.12,c.nose);
  legs=[leg(-.23,.1,.23,.24,.4,c.nose,.2),leg(.23,.1,.23,.24,.4,c.nose,.2)];height=2.6;eyeLine=1.8;
 }
 if(kind==='raccoon'){
  // Mask, pale eye apertures and alternating tail rings make the species clear.
  b(0,.91,-.07,.94,.89,1.35,c.fur);b(0,1.5,.47,1.0,.83,.79,c.fur);b(0,1.32,.94,.62,.32,.31,c.muzzle);b(0,1.4,1.14,.21,.14,.055,c.nose);
  b(0,1.64,.895,.97,.29,.07,c.mask);for(const x of [-.29,.29]){b(x,1.64,.945,.2,.18,.045,0xe7ead2);b(x,1.66,.978,.085,.14,.025,c.eye);b(x,2.02,.31,.28,.31,.28,c.ear);b(x,2.05,.48,.13,.15,.035,c.mask);}
  for(let i=0;i<6;i++)b(0,.88+Math.max(0,i-2)*.045,-.9-i*.2,.39,.37,.22,i%2?c.mask:c.tail);
  b(0,.91,.05,1.0,.31,1.2,c.cloth);b(0,1.09,.7,.66,.12,.13,c.ivory);brooch(0,.94,.76);circlet(1.89,.86,.91);height=2.25;eyeLine=1.66;
 }
 return{fur:c.fur,muzzle:c.muzzle,wings,legs,eyeLine,height};
}
