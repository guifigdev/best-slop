// Castle Fight builders have their own identities; combat heroes keep their art.
// Portraits use these same boxes and colours, so species and faction stay in sync.
const palettes={
 orc:{fur:0x9c7757,muzzle:0xbca078,cloth:0x5c7651,trim:0xc7a56a,eye:0x334437,ivory:0xeee1bd},
 undead:{fur:0x394957,muzzle:0x849b9c,cloth:0x536b72,trim:0xb8cabb,eye:0x9be3ce,ivory:0xe9ead0},
 chaos:{fur:0xc99555,muzzle:0xe3c38a,cloth:0x825848,trim:0xe0b566,eye:0x463c35,ivory:0xf5dfb0},
 corrupted:{fur:0x687266,muzzle:0xa8b399,cloth:0x6e577e,trim:0xb4a6bd,eye:0xcab8e5,ivory:0xe5e3c8}
};

function geometry(key){
 if(typeof key!=='string'||!Object.hasOwn(palettes,key))return null;
 const c=palettes[key];
 const boxes=[],wings=[],box=(...p)=>boxes.push(p),leg=(x,z,w=.27,h=.44,d=.34,color=c.fur,y=.28)=>({x,y,z,w,h,d,color});
 let legs=[leg(-.35,-.48),leg(.35,-.48),leg(-.35,.48),leg(.35,.48)],height=2.3,eyeLine=1.65;
 const eyes=(y,z,spacing=.3)=>{for(const side of [-1,1]){box(side*spacing,y,z,.14,.18,.055,c.eye);box(side*spacing-.025,y+.04,z+.035,.035,.045,.02,c.ivory);}};
 const clasp=(y,z)=>{box(0,y,z,.25,.22,.08,c.trim);box(0,y,z+.05,.09,.1,.03,c.cloth);};
 if(key==='orc'){
  // A broad boar snout, two ivory tusks and a bristle ridge, rather than horns.
  box(0,.93,-.06,1.08,.96,1.57,c.fur);box(0,1.48,.6,1.03,.83,.88,c.fur);
  box(0,1.28,1.1,.8,.43,.5,c.muzzle);box(0,1.32,1.385,.67,.32,.12,0x997557);
  for(const side of [-1,1]){box(side*.42,2.0,.48,.35,.38,.3,c.fur);box(side*.42,2.03,.65,.17,.2,.035,0x715c49);box(side*.41,1.18,1.21,.17,.38,.22,c.ivory);box(side*.46,1.39,1.24,.13,.23,.16,c.ivory);box(side*.17,1.34,1.455,.11,.08,.025,0x534a3b);}
  eyes(1.69,1.065,.34);for(let i=0;i<5;i++)box(0,1.52,-.62+i*.28,.18,.3,.18,0x615440);
  box(0,.97,.03,1.13,.34,1.45,c.cloth);box(0,1.15,.82,.73,.13,.12,c.ivory);clasp(.98,.87);
  // A mason's mallet is worn at the hip, away from the face and tusks.
  box(-.68,.76,.0,.12,.9,.12,0x92734f);box(-.68,1.25,.0,.55,.27,.29,0x85938b);box(-.68,1.25,.16,.25,.17,.04,c.trim);
  box(0,1.02,-.99,.18,.17,.38,c.fur);height=2.27;eyeLine=1.69;
 }
 if(key==='undead'){
  // Upright raven: no mammal muzzle, ears or four-legged body template.
  box(0,1.02,-.04,.88,1.12,.8,c.fur);box(0,1.79,.13,.86,.79,.75,c.fur);
  box(0,1.6,.67,.34,.28,.43,c.muzzle);box(0,1.5,.91,.24,.18,.2,0xa5b8ae);
  eyes(1.88,.535,.26);box(0,2.19,.02,.4,.18,.34,0x526570);box(0,2.32,-.08,.24,.16,.25,c.fur);
  box(0,.8,.15,.94,.35,.71,c.cloth);box(0,1.01,.5,.63,.13,.1,c.ivory);clasp(.84,.54);
  box(0,.68,-.58,.5,.18,.46,0x2e3d48);box(0,.61,-.84,.34,.13,.23,0x4a5e68);
  for(const side of [-1,1])wings.push({side,pivot:[side*.42,1.2,-.04],parts:[[side*.12,0,-.04,.29,.87,.61,0x2d3d49],[side*.16,-.31,.09,.25,.29,.4,0x526874],[side*.15,.2,.15,.28,.16,.36,c.muzzle]]});
  // Mortar scrolls and a pale belt distinguish the spectral architect.
  box(.57,.85,-.05,.25,.6,.35,c.cloth);box(.57,1.2,-.05,.23,.13,.32,c.ivory);box(.57,.9,.15,.17,.22,.06,c.trim);
  legs=[leg(-.22,.13,.23,.26,.42,c.muzzle,.2),leg(.22,.13,.23,.26,.42,c.muzzle,.2)];height=2.5;eyeLine=1.88;
 }
 if(key==='chaos'){
  // Square flame-coloured mane and a cream muzzle remain unmistakably leonine.
  box(0,.96,-.08,1.03,.94,1.57,c.fur);box(0,1.57,.54,1.32,1.17,.83,0x975b3c);
  box(0,2.13,.53,1.03,.25,.76,0xc97c42);for(const side of [-1,1]){box(side*.61,1.6,.56,.25,.86,.73,0xb16a3b);box(side*.48,2.04,.62,.27,.27,.32,c.fur);box(side*.53,1.12,.57,.25,.33,.67,0x85563a);}
  box(0,1.61,.88,.87,.78,.66,c.fur);box(0,1.39,1.27,.73,.35,.3,c.muzzle);box(0,1.49,1.445,.23,.14,.065,0x594236);eyes(1.77,1.225,.29);
  box(0,1.02,-1.12,.23,.24,.71,c.fur);box(.08,1.17,-1.49,.27,.37,.3,0x975b3c);
  box(0,.94,-.08,1.09,.31,1.2,c.cloth);box(0,1.12,.62,.77,.12,.13,c.ivory);clasp(.96,.72);
  // Ember forge apron, tongs and a glowing forge stone, rather than spell VFX.
  box(-.64,.88,-.1,.27,.56,.48,c.cloth);box(-.66,1.2,-.1,.29,.16,.32,0xe3a24f);for(const x of [.57,.7])box(x,.92,.05,.055,.7,.07,0x8d9585);box(.635,1.27,.05,.2,.07,.08,c.trim);
  height=2.33;eyeLine=1.77;
 }
 if(key==='corrupted'){
  // Narrow wolf muzzle, tall dark ears, pale cheek tufts and a long brush tail.
  box(0,.94,-.08,.96,.91,1.52,c.fur);box(0,1.55,.51,.91,.84,.78,c.fur);
  box(0,1.34,1.0,.59,.33,.45,c.muzzle);box(0,1.31,1.28,.35,.24,.18,c.muzzle);box(0,1.38,1.405,.23,.13,.06,0x3c4842);
  for(const side of [-1,1]){box(side*.32,2.12,.37,.27,.55,.29,c.fur);box(side*.32,2.15,.54,.13,.34,.04,0x493d55);box(side*.48,1.47,.74,.23,.4,.38,c.muzzle);}
  eyes(1.72,.93,.28);box(0,.99,-1.09,.36,.37,.8,c.fur);box(0,1.05,-1.53,.4,.39,.38,0x88917a);
  box(0,.97,.06,1.02,.32,1.19,c.cloth);box(0,1.15,.7,.71,.12,.11,c.ivory);clasp(.99,.77);
  // Root-bound satchel and pruned violet branches echo the corrupted faction.
  box(-.62,.9,-.11,.25,.62,.46,c.cloth);for(const z of [-.25,-.05]){box(-.63,1.4,z,.08,.48,.08,0x5c5348);box(-.63,1.65,z,.24,.14,.19,0x9280a3);}height=2.45;eyeLine=1.72;
 }
 return{boxes,fur:c.fur,muzzle:c.muzzle,wings,legs,height,eyeLine};
}

export function buildCastleBuilderModel(unit,body,voxel){
 const model=geometry(unit?.castleBuilderKey);if(!model)return null;
 for(const part of model.boxes)voxel(body,...part);
 const{boxes,...descriptor}=model;return descriptor;
}

const portraitCache=new Map();
export function castleBuilderPortrait(key,fallback=''){
 if(portraitCache.has(key))return portraitCache.get(key);
 const model=geometry(key);if(!model)return fallback;
 const c=palettes[key],boxes=[...model.boxes,...model.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])];
 for(const wing of model.wings)for(const[x,y,z,w,h,d,color]of wing.parts)boxes.push([x+wing.pivot[0],y+wing.pivot[1],z+wing.pivot[2],w,h,d,color]);
 // Front orthographic projection keeps faces readable at small HUD sizes.
 const hex=n=>'#'+n.toString(16).padStart(6,'0');
 const shapes=boxes.sort((a,b)=>(a[2]+a[5]/2)-(b[2]+b[5]/2)).map(([x,y,z,w,h,d,color])=>`<rect x="${(48+(x-w/2)*29).toFixed(2)}" y="${(86-(y+h/2)*29).toFixed(2)}" width="${(w*29).toFixed(2)}" height="${(h*29).toFixed(2)}" fill="${hex(color)}"/>`).join('');
 const svg=`<svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="90" height="90" rx="9" fill="${hex(c.cloth)}" opacity=".15"/><path d="M19 84h58l-10 6H29z" fill="${hex(c.cloth)}" opacity=".25"/>${shapes}</svg>`;
 portraitCache.set(key,svg);return svg;
}
