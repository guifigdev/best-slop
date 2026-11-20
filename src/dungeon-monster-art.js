// Original cave fauna. The renderer merges static parts and animates only the
// returned limbs/wings through its existing eight-frame clips.
const cache=new Map();
export const DUNGEON_VISUAL_SPECIES=Object.freeze(['cavebat','scarab','spider','snake','worm','slime','rat','broodmother','stonebeast','guardian','mimic','archer','firemage']);
const aliases={cave_bat:'cavebat',cavespider:'spider',cave_spider:'spider',cave_scarab:'scarab',cave_rat:'rat',cave_snake:'snake',cave_worm:'worm',spittingworm:'worm',brood_matron:'broodmother',stoneguardian:'guardian',stone_beast:'stonebeast',cave_slime:'slime'};
function resolve(value){const raw=typeof value==='string'?value:!value?.hero?value?.dungeonSpecies:null,key=aliases[raw]||raw;return DUNGEON_VISUAL_SPECIES.includes(key)?key:null;}
export function dungeonMonsterModelKey(unit){const key=resolve(unit);return key?'dungeon:'+key:null;}
export function dungeonMonsterSpec(value){
const key=resolve(value);if(!key)return null;if(cache.has(key))return cache.get(key);
 const parts=[],legs=[],wings=[],b=(...p)=>parts.push(p),leg=(x,z,color,w=.14,h=.4,d=.23,y=h/2)=>legs.push({x,y,z,w,h,d,color});
 const dark=0x243344,bone=0xd9cfab,glow=0xa6dbb0,fur=({cavebat:0x6c607e,scarab:0x5b7771,spider:0x63526e,snake:0x70855e,worm:0xb3a185,slime:0x79a893,rat:0x8e8275,broodmother:0x754c68,stonebeast:0x8c9186,guardian:0x7b8892,mimic:0x846444,archer:0x83937b,firemage:0x9a6958})[key];
 const eye=(x,y,z,c=glow)=>b(x,y,z,.1,.1,.05,c);
 let height=1.3,eyeLine=.8,motion='insect';
 if(key==='cavebat'){
  b(0,.83,0,.48,.76,.55,fur);b(0,1.25,.17,.65,.5,.46,fur);for(const s of [-1,1]){b(s*.22,1.7,.12,.17,.48,.2,fur);eye(s*.15,1.3,.42,0xefbf99);b(s*.13,1.03,.43,.065,.2,.08,bone);wings.push({side:s,pivot:[s*.22,.97,-.05],parts:[[s*.42,0,0,.83,.12,.68,fur],[s*.86,.13,-.08,.5,.1,.52,0xa0788c],[s*1.15,.28,-.15,.3,.1,.36,0xb09aa3],[s*.73,-.19,-.18,.33,.25,.36,0x4b485f],[s*.35,.07,.21,.72,.06,.07,bone]]});}height=1.95;eyeLine=1.3;motion='fly';
 }else if(key==='scarab'){
  b(0,.62,-.15,1.2,.5,1.38,fur);for(const s of [-1,1]){b(s*.31,.94,-.23,.55,.26,1.1,0x8eaa89);for(const z of [-.64,0,.53]){b(s*.68,.42,z,.35,.14,.15,fur);leg(s*.86,z,dark,.12,.48);}b(s*.28,.43,1.04,.16,.26,.35,bone);b(s*.15,.38,1.21,.26,.14,.15,bone);eye(s*.26,.72,.88);}b(0,.64,.61,.76,.37,.65,fur);b(0,.94,-.25,.07,.34,1.2,dark);b(0,.88,.65,.44,.16,.48,0xa8ba97);height=1.16;eyeLine=.72;
 }else if(key==='spider'||key==='broodmother'){
  const mother=key==='broodmother';b(0,.76,-.42,mother?1.6:1.12,mother?1.08:.68,mother?1.65:1.12,fur);b(0,.61,.47,.7,.55,.7,fur);for(const s of [-1,1]){for(let i=0;i<4;i++){const z=-.75+i*.44;b(s*(.58+i%2*.12),.69,z,.5,.16,.18,fur);b(s*(.91+i%2*.12),.55,z,.13,.35,.16,dark);leg(s*(1.01+i%2*.12),z,dark,.13,.5,.21);}b(s*.18,.36,.88,.1,.36,.12,bone);for(let i=0;i<3;i++)eye(s*(.1+i*.1),.71+i%2*.13,.84,mother?0xedbd8b:0xbbe3b3);}if(mother)for(let i=0;i<5;i++)b((i%3-1)*.37,1.15+(i%2)*.2,-.6+Math.floor(i/3)*.5,.25,.3,.27,0xd3bc9d);height=mother?1.6:1.1;eyeLine=.81;
 }else if(key==='snake'){
  for(let i=0;i<7;i++)b(Math.sin(i*.85)*.42,.23+i*.018,-1.1+i*.28,.38,.31,.42,i%2?0x9baf80:fur);b(.14,.84,.65,.35,1,.39,fur);b(.14,1.4,.76,.67,.45,.55,fur);b(.14,1.21,1.02,.52,.1,.25,bone);for(const s of [-1,1]){eye(.14+s*.23,1.49,1.055,0xe3d090);b(.14+s*.16,1.18,1.11,.065,.22,.065,bone);}b(.14,1.14,1.3,.035,.04,.3,0xc78991);height=1.65;eyeLine=1.47;motion='slither';
 }else if(key==='worm'){
  for(let i=0;i<6;i++){const y=.27+i*.2,z=-.9+i*.3,w=.55+i*.1;b(Math.sin(i*.45)*.16,y,z,w,.4,.43,i%2?fur:0x8c806f);}b(.08,1.5,.77,1.14,.66,.75,fur);b(.08,1.48,1.17,.83,.36,.03,dark);for(const s of [-1,1])for(let i=0;i<3;i++){b(.08+s*(.17+i*.13),1.71,1.2,.09,.23,.11,bone);b(.08+s*(.17+i*.13),1.25,1.2,.09,.18,.11,bone);}for(const s of [-1,1])eye(.08+s*.3,1.79,1.05,0xdfa9a2);height=1.86;eyeLine=1.77;motion='slither';
 }else if(key==='slime'){
  for(let i=0;i<4;i++)b(0,.22+i*.25,0,1.4-i*.25,.3,1.2-i*.2,i%2?fur:0xa5c5a7);for(const s of [-1,1])eye(s*.2,.72,.44,0x29464b);b(0,.53,.5,.26,.055,.04,dark);b(-.17,.7,-.1,.23,.27,.22,bone);height=1.13;eyeLine=.72;motion='slither';
 }else if(key==='rat'){
  b(0,.55,0,.67,.54,1.1,fur);b(0,.78,.55,.56,.52,.58,fur);b(0,.61,.95,.35,.23,.34,0xbda694);for(const s of [-1,1]){b(s*.23,1.1,.37,.26,.37,.18,0xbaa298);eye(s*.2,.86,.87,0x292f37);leg(s*.27,-.35,fur,.14,.28);leg(s*.25,.36,fur,.14,.28);b(s*.29,.64,.99,.37,.035,.04,bone);}for(let i=0;i<4;i++)b(Math.sin(i*.7)*.23,.34,-.72-i*.26,.13,.12,.34,0xaa8e8e);height=1.3;eyeLine=.85;motion='scurry';
 }else if(key==='archer'||key==='firemage'){
  const mage=key==='firemage';b(0,1.05,0,.62,.9,.48,fur);b(0,1.73,.08,.5,.48,.46,bone);b(0,1.79,.32,.41,.17,.05,dark);for(const side of [-1,1]){eye(side*.13,1.81,.36,mage?0xffc78b:glow);leg(side*.21,0,dark,.19,.6,.27);b(side*.43,1.06,.05,.2,.63,.24,fur);}if(mage){for(let i=0;i<3;i++)b(0,.4+i*.16,0,.9-i*.12,.19,.7-i*.09,fur);b(-.61,1.12,.14,.1,1.8,.1,0x77604b);b(-.61,2.15,.14,.29,.39,.3,0xf2bd76);b(0,2.09,.02,.64,.22,.57,fur);b(0,2.27,.02,.35,.16,.31,0x987d68);}else{b(.63,1.17,.19,.09,1.2,.1,bone);b(.51,1.79,.19,.32,.09,.1,bone);b(.51,.55,.19,.32,.09,.1,bone);b(.39,1.17,.19,.035,1.16,.04,0xb8aa8f);b(-.35,1.25,-.31,.23,.6,.32,0x75664f);}height=mage?2.4:2.03;eyeLine=1.81;motion='walk';
 }else if(key==='mimic'){
  b(0,.58,0,1.18,.67,.82,fur);b(0,1.11,-.05,1.24,.25,.88,0xab8b56);b(0,.91,.4,1.04,.28,.04,dark);for(let i=0;i<5;i++)b(-.4+i*.2,.92,.45,.1,.22,.1,bone);b(0,.65,.55,.28,.12,.43,0xb67e90);for(const s of [-1,1]){eye(s*.28,1.18,.42,0xe1ce96);leg(s*.43,-.15,dark,.16,.35);}height=1.35;eyeLine=1.18;
 }else{
  const guardian=key==='guardian';b(0,1.1,0,1.15,1.25,.85,fur);b(0,2,.1,.8,.65,.72,fur);for(const s of [-1,1]){b(s*.85,1,.03,.45,1.3,.55,fur);b(s*.9,.52,.25,.5,.4,.65,0x646f73);leg(s*.37,0,0x657279,.35,.56,.5);eye(s*.21,2.09,.49,guardian?0xa8daed:0xc8dab0);b(s*.43,2.18,-.08,.24,.55,.37,guardian?0xaabfc5:0x7d886f);}b(0,1.24,.46,.28,.55,.12,glow);if(!guardian)for(let i=0;i<4;i++)b((i%2-.5)*.55,1.8+Math.floor(i/2)*.35,-.29,.27,.42,.3,0xa3ad8f);height=2.6;eyeLine=2.08;motion='heavy';
 }
 const profile=Object.freeze({key,parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs.map(Object.freeze)),wings:Object.freeze(wings.map(w=>Object.freeze({...w,parts:Object.freeze(w.parts.map(Object.freeze))}))),fur,height,eyeLine,motion});cache.set(key,profile);return profile;
}
export function buildDungeonMonster(value,body,voxel){const spec=dungeonMonsterSpec(value);if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
