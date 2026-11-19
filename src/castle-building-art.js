export {buildingModelSpec,createCastleBuildingArt,castleBuildingPortrait} from './castle-building-models.js';
// Legacy decoration API retained for existing standalone consumers.
export function decorateCastleBuilding(block,profile,{w,d,accent,team}){
 const z=d*.5+.05,wood=0x796149,iron=0xc9d9d7,gold=0xe8c779,dark=0x30443d;
 // A front plaque makes the unit's weapon readable from the default camera.
 block(0,2.38,z,w*.48,1.15,.12,dark);block(-w*.18,1.55,z,.09,1.6,.09,wood);block(w*.18,1.55,z,.09,1.6,.09,wood);
 const b=(x,y,bw,bh,color,depth=.11)=>block(x,y+1.2,z+.12,bw,bh,depth,color);
 if(profile.variant==='turret'){b(0,1.2,.18,.65,iron);b(0,1.55,.55,.15,gold);b(0,.9,.35,.15,iron);
 }else if(profile.variant==='sword'){
  b(0,1.3,.17,.95,iron);b(0,1.85,.1,.2,0xf1ead4);b(0,.9,.65,.12,gold);b(0,.68,.13,.35,wood);b(-.45,1.25,.33,.55,team,.16);
 }else if(profile.variant==='rifle'){
  b(-.15,1.03,.65,.22,wood);b(.22,1.22,.17,.52,iron);b(.35,1.5,.12,.36,dark);b(.02,1.31,.18,.12,gold);b(-.4,.91,.2,.38,wood);
 }else if(profile.variant==='bow'){
  b(-.25,1.31,.12,.6,wood);b(-.11,1.7,.25,.12,gold);b(-.11,.92,.25,.12,gold);b(.04,1.31,.045,.82,ivory);b(.28,1.3,.07,.87,iron);b(.28,1.8,.17,.18,gold);
 }else if(profile.variant==='staff'||profile.variant==='orb'){
  b(0,1.2,.13,.87,wood);b(0,1.75,.4,.36,accent,.24);b(0,2.03,.17,.2,gold);b(-.27,1.63,.1,.29,gold);b(.27,1.63,.1,.29,gold);
 }else if(profile.variant==='wings'){
  for(const side of [-1,1]){b(side*.24,1.4,.38,.18,ivory);b(side*.43,1.57,.24,.18,ivory);b(side*.52,1.74,.12,.18,gold);}b(0,1.28,.22,.52,accent);
 }else if(profile.variant==='horns'||profile.variant==='paw'){
  b(0,1.18,.45,.35,accent,.22);for(const side of [-1,1]){b(side*.28,1.53,.2,.4,ivory);b(side*.4,1.78,.16,.18,gold);}if(profile.variant==='paw')for(const x of [-.27,0,.27])b(x,1.7,.16,.2,ivory);
 }else if(profile.variant==='gauntlet'){
  b(0,1.24,.55,.5,iron,.22);for(const x of [-.25,0,.25])b(x,1.6,.2,.25,gold,.25);b(.35,1.15,.2,.25,iron,.25);
 }else if(profile.variant==='cannon'){
  b(0,1.2,.8,.27,iron,.3);b(.45,1.25,.15,.39,dark,.38);for(const x of [-.25,.25])b(x,.94,.22,.3,wood,.2);
 }else if(profile.variant==='coins'){
  for(let i=0;i<3;i++)b((i-1)*.24,1.1+i%2*.15,.23,.38,gold,.18);
 }else if(profile.variant==='cross'){
  b(0,1.35,.18,.9,ivory);b(0,1.4,.7,.17,ivory);
 }
 // Functional silhouettes: pens, target ranges, artillery bays and roof runes.
 if(['giant','beast','aviary'].includes(profile.role)){
  for(const side of [-1,1]){block(side*w*.4,.55,d*.4,.16,.85,.16,wood);block(side*w*.4,.55,0,.16,.85,.16,wood);block(side*w*.4,.72,d*.2,.12,.13,d*.5,wood);}block(w*.28,.35,d*.29,.36,.3,.42,gold);
  if(profile.role==='aviary'){block(0,3.45,0,w*.55,.14,.16,wood);for(const side of [-1,1])block(side*w*.24,3.65,0,.25,.3,.25,ivory);}
 }else if(profile.role==='ranged'){
  block(-w*.34,.4,d*.33,.12,.8,.12,wood);block(-w*.34,.95,d*.33,.46,.5,.16,ivory);block(-w*.34,.95,d*.43,.18,.18,.05,accent);
 }else if(profile.role==='siege'){
  block(w*.28,.68,0,.43,.43,d*.7,iron);block(w*.28,.68,d*.37,.5,.5,.15,dark);for(const front of [-1,1])block(w*.28,.32,front*d*.23,.5,.35,.3,wood);
 }else if(profile.role==='arcane'){
  for(const side of [-1,1]){block(side*w*.3,2.45,0,.16,.5,.18,accent);block(side*w*.3,2.77,0,.2,.2,.2,gold);}
 }
 for(let i=0;i<profile.tier;i++)block((i-(profile.tier-1)/2)*.24,3.3,z+.14,.14,.14,.12,gold);
}
const ivory=0xe1dcc3;
