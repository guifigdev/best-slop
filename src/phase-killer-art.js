import {PHASE_KILLER_SKILLS as SKILLS,PHASE_KILLER_ITEMS as ITEMS} from '../shared/phase-killer-catalog.js';
import {voxelTagPortrait} from './tag-character-art.js';

// Appearance is supplied by the viewer-safe snapshot. Never infer an assassin
// from pkRole: the disguised player must retain an ordinary civilian model.
const aliases={hpea:'townsperson',h002:'lightarmor',h004:'mediumarmor',h003:'heavyarmor',h000:'beast',h014:'beast',h015:'revenant',h013:'revenant',h017:'skeleton',h016:'stalker',h00H:'ghost',h019:'zombie'};
const summonKeys=['h01N','h01O','h01P','h01Q','h01R','h01S','h01T','h01U'],models=new Map(),portraits=new Map();
const publicLooks=new Set(['townsperson','lightarmor','mediumarmor','heavyarmor','beast','revenant','skeleton','stalker','ghost','zombie',...summonKeys]);
const appearance=value=>{const raw=typeof value==='string'?value:value?.pkAppearance;return typeof raw==='string'?(Object.hasOwn(aliases,raw)?aliases[raw]:raw.startsWith('phase-killer:')?raw.slice(13):raw):null;};
export function phaseKillerModelKey(unit){const key=appearance(unit);return publicLooks.has(key)?'phase-killer:'+key:null;}
export function phaseKillerSpec(value){
 const key=appearance(value);if(!publicLooks.has(key))return null;if(models.has(key))return models.get(key);
 const parts=[],legs=[],wings=[],b=(...p)=>parts.push(p),leg=(x,z=0,w=.31,h=.5,color=0x4d5751)=>legs.push({x,y:h/2+.04,z,w,h,d:.42,color});let fur=0xc6b197,muzzle=fur,height=2.5,eyeLine=1.86,motion='walk';const pale=0xe5dfc6,dark=0x2b4143;
 if(key==='beast'){
  fur=0x7c9398;muzzle=0xc5d1c4;b(0,1.03,-.18,1.14,1,1.84,fur);b(0,1.31,.53,1.27,1.06,.85,0x5f7e85);b(0,1.74,.86,.99,.77,.89,fur);b(0,1.5,1.46,.81,.44,.73,muzzle);b(0,1.62,1.87,.57,.21,.19,dark);b(0,1.3,1.5,.65,.16,.67,0x647f85);
  for(const side of [-1,1]){b(side*.38,2.19,.69,.31,.59,.34,fur);b(side*.39,2.24,.87,.14,.31,.07,0x587780);b(side*.32,1.85,1.31,.18,.12,.06,0xc2e5d8);b(side*.36,1.4,1.62,.12,.32,.16,pale);b(side*.65,1.45,.27,.34,.61,.6,0xa5b9b3);for(const z of [-.67,.59])leg(side*.42,z,.33,.59,0x607d82);}
  b(0,1.45,-.41,.6,.27,1.05,0xaabcb3);b(0,.95,-1.3,.38,.4,.74,fur);b(0,1.17,-1.71,.35,.43,.4,muzzle);height=2.5;eyeLine=1.85;motion='quadruped';
 }else if(key==='stalker'){
  fur=0x4a4c61;muzzle=0xbab6ad;b(0,.87,-.46,1.38,1.06,1.61,fur);b(0,1.22,-.6,.96,.47,1.2,0x606278);b(0,.93,.6,.87,.67,.85,0x727584);b(0,1.08,1.05,.73,.24,.19,0xa3b8a7);for(const side of [-1,1]){for(const x of [.16,.34])b(side*x,1.12,1.12,.11,.1,.055,0xc3d8af);b(side*.29,.62,1.08,.15,.57,.2,pale);for(const z of [-.95,-.35,.25,.85]){b(side*.84,.82,z,.87,.17,.2,0x767589);b(side*1.21,.62,z,.19,.48,.23,fur);leg(side*1.23,z,.2,.64,0x575a70);}}
  b(0,1.51,-.66,.38,.14,.5,0x9d8f9e);height=1.62;eyeLine=1.12;motion='arachnid';
 }else if(key==='revenant'||key==='ghost'||summonKeys.includes(key)){
  const index=summonKeys.indexOf(key),ghost=key==='ghost',c=ghost?0x9eb9af:key==='revenant'?0x6d7194:[0x55568d,0x756b9e,0x8b6c91,0x646e9b,0x8e669a,0x566e7a,0x688a6b,0x78898c][index],trim=ghost?0xd8e2c8:0xb3c4b7;fur=c;muzzle=trim;motion='float';
  b(0,1.23,0,.85,1.03,.61,c);b(0,.63,0,1.07,.39,.77,c);b(0,.35,-.13,.67,.25,.49,0x596779);b(0,1.96,.04,.76,.72,.71,c);b(0,1.94,.39,.58,.43,.12,0x354951);b(0,2.36,-.03,.91,.26,.81,c);b(0,2.56,-.12,.59,.16,.58,trim);
  for(const side of [-1,1]){b(side*.43,1.98,.01,.22,.66,.75,c);b(side*.67,1.1,.07,.29,.88,.35,c);b(side*.72,.73,.25,.35,.24,.42,trim);b(side*.19,2.02,.47,.13,.13,.045,ghost?0xf0efd4:0xcbe2ce);b(side*.35,.35,0,.19,.49,.3,trim);}
  b(0,1.17,.36,.17,.61,.11,trim);if(!ghost){b(0,2.69,-.12,.2,.24,.21,0xd6d4b1);for(const side of [-1,1]){b(side*.49,2.43,-.1,.17,.44,.23,trim);b(side*.63,2.59,-.1,.34,.13,.2,trim);}}height=ghost?2.64:2.85;eyeLine=2.02;
 }else if(key==='skeleton'){
  fur=0xaeb8a4;muzzle=pale;b(0,1.1,0,.31,1.1,.35,0x899b91);b(0,1.91,.06,.79,.72,.69,fur);b(0,1.57,.4,.55,.21,.17,pale);for(const y of [.86,1.08,1.3])b(0,y,.13,.82,.12,.48,pale);b(0,.63,.01,.87,.2,.59,fur);
  for(const side of [-1,1]){b(side*.64,1.13,.01,.23,.94,.29,fur);b(side*.68,.69,.11,.29,.22,.37,pale);b(side*.19,1.98,.45,.19,.17,.06,dark);b(side*.2,1.96,.49,.08,.085,.025,0xc7e0c8);b(side*.52,1.57,0,.51,.27,.65,0x607482);leg(side*.27,0,.25,.57,fur);}b(0,1.76,.46,.14,.17,.07,dark);for(const x of [-.2,-.07,.07,.2])b(x,1.56,.51,.07,.09,.045,dark);b(0,2.31,.01,.91,.17,.78,0x758b8e);b(0,2.45,.01,.19,.21,.56,pale);b(-.88,1.28,.22,.13,1.36,.13,0x8e7754);b(-.88,1.87,.22,.74,.43,.34,0xb3c4b7);height=2.62;eyeLine=1.98;
 }else{
  const zombie=key==='zombie',armored=key!=='townsperson'&&!zombie,skin=zombie?0x90a18c:0xc7b295,cloth=zombie?0x776a69:armored?{lightarmor:0x7a8b86,mediumarmor:0x70828d,heavyarmor:0x657887}[key]:0x7d8e80,metal=0xabb8ae;fur=skin;muzzle=skin;b(0,1.01,0,.82,.92,.58,cloth);b(0,1.81,.05,.73,.65,.65,skin);b(0,1.63,.41,.24,.16,.14,skin);b(0,.61,.01,.85,.13,.62,0x5a5c49);b(0,.64,.36,.19,.19,.08,0xc3b178);b(0,2.15,-.02,.82,.21,.72,zombie?0x576c5c:0x8e7655);
  for(const side of [-1,1]){b(side*.53,1.05,.01,.29,.68,.35,cloth);b(side*.53,.73,.07,.29,.23,.36,skin);b(side*.18,1.87,.42,.12,.13,.045,zombie?0xc6d1ac:dark);leg(side*.25,0,.31,.52,0x586252);}if(zombie){b(.2,1.72,.43,.25,.13,.06,0x50665b);b(-.24,1.9,-.27,.25,.53,.18,0x647760);b(.27,.72,.37,.23,.31,.09,0x9f8f77);}else if(armored){b(0,1.14,.35,.75,.58,.13,metal);b(0,2.12,.02,.85,.23,.78,metal);for(const side of [-1,1])b(side*.51,1.49,0,.41,.22,.61,metal);if(key!=='lightarmor'){b(0,1.96,.46,.16,.42,.11,0x8ca2a1);for(const side of [-1,1])b(side*.38,1.82,.03,.13,.51,.68,metal);}if(key==='heavyarmor'){b(0,2.34,.02,.17,.32,.62,0xc5b777);for(const side of [-1,1])b(side*.6,1.51,.01,.55,.33,.69,metal);}}else{b(0,.92,.36,.61,.67,.13,0xaa9670);b(0,.59,.39,.68,.14,.16,0xc3b18d);b(-.3,1.91,-.26,.2,.57,.18,0x8c7657);}height=2.55;eyeLine=1.87;
 }
 const data=Object.freeze({key:'phase-killer:'+key,theme:'phase-killer',parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs.map(Object.freeze)),wings:Object.freeze(wings),fur,muzzle,height,eyeLine,motion});models.set(key,data);return data;
}
export function buildPhaseKillerModel(unit,body,voxel){const spec=phaseKillerSpec(unit);if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
export function phaseKillerPortrait(value){const key=appearance(value);if(!publicLooks.has(key))return '';if(portraits.has(key))return portraits.get(key);const s=phaseKillerSpec(key),svg=voxelTagPortrait([...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],'phase-killer-portrait');portraits.set(key,svg);return svg;}

const P=(d,c='light')=>`<path d="${d}" fill="${c}"/>`,L=(d,c='light',w=3)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="square"/>`,R=(x,y,w,h,c='light')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`,C=(x,y,r,c='light')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const glyph={
 phase:()=>P('m20 9 23 4 12 20-14 22-23-4L7 30z','accent')+P('m25 14 13 3 9 16-11 16-13-4-7-15z','shade')+L('M8 33h27m-9-9 9 9-9 9','bright',4),
 shift:()=>P('m10 11 15 9 7-8 7 8 15-9-4 30-18 16-18-16z','accent')+R(20,27,8,5,'bright')+R(36,27,8,5,'bright')+P('m26 38 6-4 6 4-6 6z','shade')+P('m20 39 6 4-4 9zm24 0-6 4 4 9z'),
 human:()=>P('m19 13 13-6 13 6v22l-13 16-13-16z','accent')+R(23,22,6,5,'bright')+R(35,22,6,5,'bright')+L('M25 38h14','shade',3)+P('m16 48 16 7 16-7 6 11H10z'),
 blood:()=>P('m32 6 17 26 2 10-10 15H23L13 42l2-10z','accent')+P('m29 18 8 19-3 12H24l-5-8 3-11z','light')+R(25,34,5,12,'bright'),
 soul:()=>P('m32 7 19 14v20L38 56H23L11 44V24z','accent')+P('m32 13 12 13v13l-9 11h-9l-8-10V27z')+R(21,28,8,9,'shade')+R(35,28,8,9,'shade')+P('m28 39 4-5 4 5z','shade'),
 heart:()=>P('m11 18 13-6 8 10 8-10 13 6v19L32 57 11 37z','accent')+P('m18 22 7-3 7 12 7-12 7 3v12L32 48 18 34z'),
 shield:()=>P('m12 15 20-8 20 8v25L32 58 12 40z','accent')+P('m19 20 13-5 13 5v17L32 49 19 37z','shade')+R(29,22,6,24)+R(22,29,20,6),
 spark:()=>P('m32 6 6 18 19 8-19 7-6 19-7-19-18-7 18-8z','accent')+P('m32 18 3 10 11 4-11 3-3 11-4-11-10-3 10-4z','bright'),
 lightning:()=>P('m39 7-24 27h14l-6 23 25-31H35z','accent')+P('m39 7-8 25h7l-15 25 25-31H35z','bright'),
 wave:()=>L('M7 39 20 23l11 15 12-18 14 14','accent',11)+L('M7 39 20 23l11 15 12-18 14 14','bright',4)+L('M10 50h43','light',3),
 bones:()=>L('M13 47 49 14','accent',9)+C(12,45,6)+C(17,51,6)+C(46,10,6)+C(52,16,6)+L('M18 46 46 19','bright',3),
 sword:()=>P('m28 39 6-33 9 4-2 28-8 9z')+R(18,39,29,5,'accent')+R(29,44,9,12,'shade')+R(27,55,13,4,'accent'),
 staff:()=>L('M19 56 41 15','accent',7)+P('m42 5 13 12-8 15-16-1-6-14z')+P('m41 11 7 7-6 8-9-2-2-8z','bright'),
 axe:()=>L('M17 55 38 13','accent',7)+P('m32 15 20-5 8 20-20 9-10-10z')+P('m46 12 6-2 8 20-8 4z','bright'),
 hammer:()=>L('M30 53V25','accent',9)+P('m10 12 37-3 8 12-6 14-35-3z')+R(18,14,7,15,'bright')+R(37,12,6,18,'accent'),
 orb:()=>P('m32 7 19 12 6 19-15 17H22L7 38l6-19z','accent')+P('m32 12 13 10 5 14-12 13H25L14 36l5-15z')+L('m22 18 15-1','bright',4),
 stone:()=>P('m16 16 24-7 15 17-4 24-26 7-17-20z','accent')+P('m16 16 16 9-7 32-17-20z')+L('m32 25 18 1','bright',3),
 vial:()=>R(25,7,14,12,'accent')+P('M25 19h14v8l9 11v17H16V38l9-11z')+P('M20 38h24v13H20z','accent')+R(23,8,18,7,'shade')+R(24,36,5,14,'bright'),
 beer:()=>R(18,14,30,40,'accent')+R(14,9,37,10)+L('M48 24h9v22h-9','light',5)+R(24,22,6,23,'bright')+R(38,22,4,23,'light'),
 bandage:()=>P('m8 33 13-15 36 16-13 17z','accent')+P('m21 18 9-5 23 11 4 10-13 10z')+L('M20 24 44 36m-30-3 25 12','bright',4),
 kit:()=>R(10,21,44,34,'accent')+L('M23 20V9h18v11','light',5)+R(27,27,10,22)+R(21,33,22,10),
 net:()=>L('M12 13h40v36H12z','accent',5)+L('M20 14v34m12-34v34m12-34v34M13 22h38M13 34h38M13 44h38','light',2)+L('M13 49 7 57m44-8 6 8','bright',3),
 flare:()=>L('M15 53 34 24','accent',9)+P('m36 4 4 11 14-7-5 15 11 5-15 4-3 14-8-13-12 1 5-12-8-6 13-1z')+L('m33 13 6 9','bright',4),
 book:()=>P('m10 14 22-6 22 6v40l-22-6-22 6z','accent')+P('m14 16 16-3v31l-16 4zm20-3 16 3v32l-16-4z')+L('M32 12v34','shade',3),
 crate:()=>P('m8 20 24-10 24 10v30L32 60 8 50z','accent')+P('m8 20 24 10v30L8 50z')+L('M10 22 32 31l22-9M32 31v26','bright',3),
 trap:()=>L('m9 43 12-14 12 14 12-14 11 14','accent',9)+L('m10 43 11-9 12 9 12-9 10 9','bright',3)+P('m14 49 18-4 18 4-18 10z'),
 sprint:()=>P('m9 13 13 9-8 12 14 17 13-5 10-12-14-4-6-16z','accent')+L('M8 42h17M5 50h23M8 30h9','light',4)+P('m30 13 15-4 7 8-10 7z'),
 eye:()=>P('m5 32 15-14 24 0 15 14-15 14H20z','accent')+C(32,32,12)+C(32,32,6,'shade')+R(29,25,4,5,'bright'),
 poison:()=>P('m32 7 18 22-3 19-15 11-15-11-3-19z','accent')+R(21,27,8,8,'shade')+R(35,27,8,8,'shade')+P('m28 40 4-7 4 7z','shade')+L('M25 48h14','bright',3),
 fire:()=>P('m34 6 3 20 12-9-2 20 9 7-7 13H17L8 43l13-19 3 16z','accent')+P('m32 28 4 13 9-7-4 17H25l-6-9z','bright'),
 snow:()=>L('M32 8v48M11 20l42 24M11 44l42-24','light',4)+P('m32 20 12 12-12 12-12-12z','accent')+P('m32 26 6 6-6 6-6-6z','bright'),
 armor:()=>P('m21 10 11 7 11-7 13 10-10 10 2 24H16l2-24L8 20z','accent')+P('m23 21 9 5 9-5 2 26H21z')+R(29,26,6,20,'bright'),
 fang:()=>P('m8 14 17 5 7-10 7 10 17-5-5 28-19 17-19-17z','accent')+R(20,27,8,5,'bright')+R(36,27,8,5,'bright')+P('m19 39 7 3-5 10zm26 0-7 3 5 10z'),
 web:()=>L('M32 8v48M8 32h48M15 15l34 34M15 49l34-34M32 14 50 32 32 50 14 32zM32 23l9 9-9 9-9-9z','light',2)+C(32,32,5,'accent'),
 portal:()=>P('M12 54V24L32 6l20 18v30H40V26l-8-8-8 8v28z','accent')+P('m28 27 8-1 6 13-10 15-9-15z')+L('M28 34h9','bright',3),
 slash:()=>P('m10 50 9-19L44 8l-9 19zm12 6 9-19L56 14l-9 19z','accent')+P('m10 50 21-18 13-24-9 19z','bright'),
 skull:()=>P('m19 10 26 0 10 12-4 23-10 5v8H23v-8l-10-5-4-23z')+R(17,25,12,12,'shade')+R(35,25,12,12,'shade')+P('m28 42 4-9 4 9z','accent')+L('M27 48v8m10-8v8','accent',3),
 tree:()=>R(27,34,10,24,'accent')+P('m32 5 19 18-7 4 13 16H7l13-16-7-4z')+P('m32 11 9 13-4 3 8 10H19l9-10-4-3z','bright'),
 boot:()=>P('M15 9h23v26l17 8v14H12V40l3-12z','accent')+R(20,13,13,24)+L('M17 49h31','bright',3)+R(14,55,41,5,'shade')
};
const small=(picture,scale=.5,x=30,y=28)=>`<g transform="translate(${x} ${y}) scale(${scale})">${picture}</g>`;
const skillPicture=family=>{
 const mapping={phase:['arcane','phase'],antiphase:['arcane','phase'],shift:['blood','shift'],normalize:['steel','human'],collectSoul:['death','soul'],consumeSoul:['death','soul'],sprint:['nature','sprint'],flare:['gold','flare'],improvements:['blood','book'],upgradeAttack:['steel','sword'],upgradeSpeed:['nature','sprint'],upgradeMana:['arcane','orb'],upgradeArmor:['steel','shield'],upgradeHealth:['blood','heart'],bloodVial:['blood','vial'],killerBloodVial:['blood','vial'],bloodSteal:['blood','blood'],bloodSoul:['death','soul'],bloodPower:['gold','blood'],bloodForge:['blood','hammer'],invoke:['arcane','spark'],fade:['death','eye'],phaseSlash:['arcane','slash'],powerStrike:['blood','fang'],aetherRipple:['arcane','wave'],rendingBlow:['steel','axe'],boneBlast:['death','bones'],aetherPulse:['arcane','wave'],novaStrike:['arcane','spark'],teleport:['arcane','portal'],transmaterialize:['death','portal'],materialize:['death','human'],web:['death','web'],sting:['nature','poison'],creep:['death','eye'],illusion:['arcane','human'],unnaturalStrength:['death','fang'],soulExpirum:['death','soul'],bandages:['nature','bandage'],medicalKit:['nature','kit'],beer:['gold','beer'],rx:['arcane','vial'],matches:['fire','fire'],molotov:['fire','vial'],dynamite:['fire','crate'],poison:['nature','poison'],riftBomb:['arcane','vial'],elixir:['blood','vial'],superKit:['arcane','kit'],net:['steel','net'],phaseCube:['arcane','crate'],phaseSphere:['arcane','orb'],perfectPhaseSphere:['arcane','orb'],impeder:['arcane','eye'],barricades:['steel','crate'],poisonCocktail:['nature','vial'],netTrap:['steel','trap'],poisonSpikeTrap:['nature','trap'],locator:['storm','eye'],smoke:['death','vial'],disappear:['death','eye'],healing:['nature','heart'],arcanum:['arcane','stone'],superImpeder:['arcane','eye'],xrVial:['death','vial'],aethralLance:['arcane','lightning'],stoneLightning:['storm','stone'],cripple:['death','poison'],purge:['storm','lightning'],destructionBlast:['fire','staff'],omnistaffBlast:['arcane','staff'],stimulus:['blood','vial'],stimulusJoint:['nature','fire'],ultraStim:['blood','vial'],soulSkull:['death','skull'],torchPlace:['fire','fire'],bonfirePlace:['fire','crate'],storageCube:['arcane','crate'],arcaneShield:['arcane','shield'],riftStrike:['arcane','spark'],equipLightArmor:['steel','armor'],equipMediumArmor:['steel','armor'],equipHeavyArmor:['steel','armor']},entry=mapping[family]||['arcane','spark'];let paths=glyph[entry[1]]();
 if(['antiphase','bloodPower','perfectPhaseSphere','riftStrike'].includes(family))paths+=small(glyph.lightning(),.37,32,31);
 if(['killerBloodVial','bloodSoul','soulExpirum','xrVial'].includes(family))paths+=small(glyph.soul(),.37,32,31);
 if(['illusion','normalize'].includes(family))paths=small(glyph.human(),.8,-2,7)+small(glyph.human(),.64,28,20);
 if(['powerStrike','aetherRipple','superImpeder','ultraStim','equipHeavyArmor'].includes(family))paths+=L('M6 8h8M6 8v8M50 8h8v8','bright',3);
 return Object.freeze([entry[0],paths]);
};
export const PHASE_KILLER_SKILL_ILLUSTRATIONS=Object.freeze(Object.fromEntries(Object.values(SKILLS).map(s=>[s.key,skillPicture(s.family)])));
function itemPicture(item){
 const name=item.name.toLowerCase().replaceAll('ægis','aegis');let palette='gold',picture='orb',extra='';
 if(item.internal){palette='steel';picture='book';extra=small(glyph.crate(),.38,30,30);}
 else if(item.innate&&item.skills[0])return PHASE_KILLER_SKILL_ILLUSTRATIONS[item.skills[0]]||skillPicture(SKILLS[item.skills[0]]?.family);
 else if(/sword|aegis blade/.test(name)){palette='steel';picture='sword';}
 else if(/glaive/.test(name)){palette='steel';picture='slash';}
 else if(/axe/.test(name)){palette='steel';picture='axe';}
 else if(/hammer/.test(name)){palette='steel';picture='hammer';}
 else if(/cleaver/.test(name)){palette='blood';picture='axe';extra=R(35,8,17,23,'bright');}
 else if(/staff/.test(name)){palette='arcane';picture='staff';}
 else if(/bandages/.test(name)){palette='nature';picture='bandage';}
 else if(/medical|super kit/.test(name)){palette=name.includes('super')?'arcane':'nature';picture='kit';}
 else if(/beer/.test(name)){palette='gold';picture='beer';}
 else if(/vial|elixir|stimulus syringe|ultra stim/.test(name)){palette=/cyanide|unstable/.test(name)?'nature':/rx|xr/.test(name)?'arcane':'blood';picture='vial';}
 else if(/suit.*armor/.test(name)){palette='steel';picture='armor';if(name.includes('heavy'))extra=R(9,20,7,17,'bright')+R(48,20,7,17,'bright');else if(name.includes('medium'))extra=L('M20 39h24','accent',4);}
 else if(/buckler|shield/.test(name)){palette=/arcane|aether/.test(name)?'arcane':'steel';picture='shield';}
 else if(/net trap|spike trap/.test(name)){palette=name.includes('poison')?'nature':'steel';picture='trap';}
 else if(name==='net'){palette='steel';picture='net';}
 else if(/torch|bonfire|matches|match box/.test(name)){palette='fire';picture=name.includes('bonfire')?'crate':'fire';}
 else if(/explosive|rift bomb/.test(name)){palette=name.includes('rift')?'arcane':'fire';picture='crate';extra=small(glyph.fire(),.43,31,1);}
 else if(/cocktail/.test(name)){palette=name.includes('poison')?'nature':'fire';picture='vial';extra=small(glyph.fire(),.46,32,2);}
 else if(/barricade|storage cube|phase cube/.test(name)){palette=/storage|phase/.test(name)?'arcane':'steel';picture='crate';}
 else if(/capsule/.test(name)){palette='nature';picture='poison';}
 else if(item.category==='book'){palette='gold';picture='book';if(/blood|diary/.test(name)){palette='blood';extra=small(glyph.blood(),.37,29,24);}else if(/scientist|manual/.test(name))extra=small(glyph.vial(),.34,31,26);else if(/engraved/.test(name))picture='stone';else if(/scrap/.test(name)){picture='book';extra=L('m7 39 10-7 8 8 10-7 10 8 11-8','shade',4);}}
 else if(/soul stone/.test(name)){palette='death';picture='stone';extra=small(glyph.soul(),.4,31,29);if(name.includes('charged'))extra+=L('M6 8h10M6 8v10','bright',3);if(name.includes('saturated'))extra+=L('M6 8h10M6 8v10M48 8h10v10','bright',3);}
 else if(/stone|marble|chunk|fragment|crystal/.test(name)){palette=/light|crystal/.test(name)?'gold':'arcane';picture='stone';if(name.includes('fragment'))extra=P('m6 42 10-3 6 9-9 9z','bright');}
 else if(/locator|impeder/.test(name)){palette='storm';picture='eye';}
 else if(/soul skull/.test(name)){palette='death';picture='skull';}
 else if(/cigarette|stimulus joint/.test(name)){palette='nature';picture='crate';extra=L('M17 13v28m10-28v28m10-28v28m10-28v28','light',4);}
 else if(/power orb|master orb/.test(name)){palette='arcane';picture='orb';const motif=/mundane/.test(name)?'crate':/survival/.test(name)?'heart':/weapon/.test(name)?'sword':/armor/.test(name)?'shield':/research/.test(name)?'book':/aether/.test(name)?'phase':'spark';extra=small(glyph[motif](),.42,31,30);if(name.includes('master'))extra+=L('M5 9h10M5 9v10M49 9h10v10','bright',3);}
 else if(/sphere|orb|essence/.test(name)){palette=/dark/.test(name)?'death':/life/.test(name)?'blood':'arcane';picture='orb';}
 else if(/cookie/.test(name)){palette='gold';picture='orb';extra=C(23,24,4,'shade')+C(39,29,5,'shade')+C(28,43,4,'shade');}
 else if(/wings/.test(name)){palette='nature';picture='sprint';}
 else if(/tree/.test(name)){palette='nature';picture='tree';}
 else if(/boot|tyrany/.test(name)){palette='steel';picture='boot';}
 else if(/fluid/.test(name)){palette='arcane';picture='vial';}
 else if(/chaos/.test(name)){palette='death';picture='phase';extra=small(glyph.fire(),.4,32,32);}
 else if(/hacks/.test(name)){palette='gold';picture='book';extra=L('m20 25 7 6 16-15m-23 24h21','shade',4);}
 if(/fire|destruction/.test(name)){palette='fire';extra+=small(glyph.fire(),.4,32,31);}else if(/ice/.test(name)){palette='ice';extra+=small(glyph.snow(),.4,32,31);}else if(/lightning|energy/.test(name)){palette='storm';extra+=small(glyph.lightning(),.38,32,31);}else if(/life/.test(name)){palette='nature';extra+=small(glyph.heart(),.38,32,31);}else if(/death|cyanide|poison/.test(name)){palette='death';extra+=small(glyph.poison(),.38,32,31);}else if(/stasis/.test(name)){palette='ice';extra+=small(glyph.web(),.38,32,31);}else if(/omni|perfect|aegis/.test(name)){palette='arcane';extra+=small(glyph.spark(),.4,32,31);}else if(/dark/.test(name)){palette='death';extra+=small(glyph.eye(),.38,32,31);}
 return Object.freeze([palette,glyph[picture]()+extra]);
}
export const PHASE_KILLER_ITEM_ILLUSTRATIONS=Object.freeze(Object.fromEntries(Object.values(ITEMS).map(item=>[item.key,itemPicture(item)])));
