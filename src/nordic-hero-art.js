import {carveNordicSurfaces,nordicHeroRelief,fenrirFurRelief} from './nordic-hero-detail.js';
import {FENRIR_ART,fenrirSpec} from './fenrir-art.js';
import {voxelTagPortrait} from './tag-character-art.js';
// Independent visual skins for the six Custom Hero archetypes. All gameplay
// identities remain the existing catalog keys; no attributes are defined here.
export const NORDIC_HERO_ART=Object.freeze({
 knight:Object.freeze({name:'Thor',title:'Portador de Mjölnir',description:'Barba de cobre, manto vermelho e o martelo de Asgard. O trovão acompanha cada passo.'}),
 mage:Object.freeze({name:'Hel',title:'Senhora dos dois mundos',description:'Metade vida, metade morte. Seu manto reúne a luz fria e as sombras de Helheim.'}),
 ranger:Object.freeze({name:'Skadi',title:'Caçadora dos picos',description:'Arco de teixo, peles claras e o azul das montanhas. A caçadora conhece cada trilha de gelo.'}),
 turtle:Object.freeze({name:'Tyr',title:'Escudo dos juramentos',description:'O deus de uma só mão veste aço e carrega um grande escudo marcado por seus juramentos.'}),
 owl:Object.freeze({name:'Odin',title:'Peregrino dos corvos',description:'Um olho coberto, uma lança e um corvo atento. O viajante dos Nove Reinos veste azul profundo.'}),
 raccoon:Object.freeze({name:'Loki',title:'Tecelão de artimanhas',description:'Verde esmeralda, ouro e lâminas curtas. Os chifres curvos anunciam o mestre das artimanhas.'}),
 fenrir:FENRIR_ART
});
const specs=new Map(),portraits=new Map();
const GOLD=0xd9bb71,PALE=0xe9dfc2,EYE=0x293b3a,SKIN=0xd4b298,STEEL=0x9bafb1,DARK=0x3d4c50;
const valid=kind=>typeof kind==='string'&&Object.hasOwn(NORDIC_HERO_ART,kind);

export function nordicHeroSpec(kind){
 if(kind==='fenrir')return detailedFenrirSpec();
 if(!valid(kind))return null;if(specs.has(kind))return specs.get(kind);
 const parts=[],legs=[],b=(...p)=>parts.push(p),leg=(x,color=DARK,w=.29,h=.44,z=0)=>legs.push({x,y:h/2+.05,z,w,h,d:.4,color});
 const eye=(x,y=1.91,color=EYE)=>{b(x,y,.409,.135,.16,.055,0xeee6d5);b(x,y-.008,.444,.085,.126,.035,color);b(x,y-.017,.468,.038,.092,.02,0x26343b);b(x-.023,y+.032,.484,.029,.037,.016,PALE);b(x,y+.1,.405,.15,.024,.04,0x756253);};
 const clasp=(x,y,z,color=GOLD)=>{b(x,y,z,.19,.2,.07,color);b(x,y,z+.045,.07,.09,.035,PALE);};
 const body=(cloth,skin=SKIN)=>{
  for(let i=0;i<13;i++){const y=.62+i*.07,w=.73+(i<8?i*.008:(12-i)*.022);b(0,y,0,w,.076,.55,cloth);}
  for(let i=0;i<11;i++){const edge=Math.abs(i-5)/5;b(0,1.5+i*.06,.025,.73-edge*edge*.19,.066,.65-edge*.045,skin);}
  b(0,1.62,.37,.16,.13,.13,skin);b(0,.61,.02,.87,.13,.62,DARK);b(0,.64,.36,.2,.16,.065,GOLD);b(0,.64,.405,.095,.08,.025,PALE);leg(-.24);leg(.24);
  for(let side of [-1,1]){b(side*.36,1.78,.36,.08,.032,.025,0xc59480);for(let y=.7;y<1.4;y+=.12)b(side*.34,y,.294,.027,.075,.024,0xa6ac9c);for(let y=.13;y<.43;y+=.09){b(side*.24-.06,y,.217,.033,.026,.028,GOLD);b(side*.24+.06,y,.217,.033,.026,.028,GOLD);}}
 };
 const arm=(side,cloth,skin=SKIN)=>{b(side*.55,1.25,.02,.27,.3,.34,cloth);b(side*.57,.99,.04,.245,.27,.31,cloth);b(side*.57,.87,.06,.27,.065,.34,GOLD);b(side*.56,.73,.08,.25,.22,.31,skin);for(let i=0;i<3;i++)b(side*.56+(i-1)*.061,.67,.246,.04,.09,.024,0xad8471);};
 const cape=(cloth,hem=cloth)=>{for(let i=-6;i<=6;i++){const x=i*.086;b(x,1.01+Math.abs(i)*.004,-.42-Math.cos(i)*.02,.092,1.09-Math.abs(i)*.012,.12,i%3===0?hem:cloth);b(x,.49+Math.abs(i)*.006,-.43,.09,.16,.14,hem);}b(0,1.56,-.3,1.03,.15,.4,cloth);};
 let fur=SKIN,muzzle=SKIN;
 if(kind==='knight'){
  const red=0xa95443,hair=0xa75f3e,beard=0xc07745;body(0x627f8b);cape(red,0x7f3d39);arm(-1,STEEL);arm(1,STEEL);
  b(0,1.13,.33,.74,.55,.12,STEEL);b(0,1.12,.41,.16,.47,.08,GOLD);for(const side of [-1,1]){b(side*.47,1.48,0,.48,.28,.65,STEEL);clasp(side*.36,1.43,.38);eye(side*.2);b(side*.38,1.83,.03,.16,.66,.66,hair);}
  b(0,2.13,-.04,.85,.22,.72,hair);b(0,1.55,.42,.61,.27,.19,beard);b(0,1.33,.43,.45,.23,.2,hair);b(0,1.18,.43,.25,.14,.16,beard);b(0,1.66,.45,.65,.11,.15,beard);b(0,1.53,.54,.15,.06,.025,0x71452f);
  b(0,2.13,.34,.84,.11,.11,GOLD);b(0,2.2,.38,.2,.21,.12,STEEL);
  // Mjölnir has a short wrapped grip and an unmistakably broad square head.
  b(.77,1.04,.23,.13,1.04,.14,0x7c6045);for(const y of [.68,.86,1.04])b(.77,y,.23,.18,.065,.19,GOLD);
  b(.77,1.67,.23,.94,.56,.55,STEEL);b(.77,1.97,.23,.78,.09,.46,PALE);b(1.27,1.67,.23,.11,.41,.42,DARK);b(.77,1.65,.53,.2,.26,.06,GOLD);b(.73,1.65,.57,.055,.18,.025,0xf3dfa5);b(.82,1.63,.57,.1,.055,.025,0xf3dfa5);
 }else if(kind==='mage'){
  const dead=0x7f9d98,robe=0x534969,black=0x303c42,pale=0xe4ccb8;body(robe,pale);cape(black,0x263238);arm(-1,0x7e677f,pale);arm(1,black,dead);fur=pale;muzzle=dead;
  b(.2,1.81,.035,.4,.69,.67,dead);b(.2,1.6,.377,.4,.24,.055,0x435b59);eye(-.19);eye(.19,1.91,0xc9d7b7);b(.2,1.74,.409,.25,.07,.045,PALE);for(const x of [.12,.22,.32])b(x,1.66,.417,.045,.13,.035,PALE);
  b(-.24,2.13,-.03,.64,.26,.78,0xe2d7bf);b(.27,2.13,-.02,.48,.26,.77,0x323942);b(-.4,1.74,-.05,.2,.8,.74,0xe2d7bf);b(.42,1.74,-.05,.2,.8,.74,0x323942);
  b(-.2,.47,.03,.47,.42,.69,0x7a6482);b(.24,.47,.03,.48,.42,.69,black);b(0,.28,.03,1.04,.15,.75,0x887d96);clasp(0,1.39,.36,0xb9b6bc);
  b(-.77,1.13,.08,.105,1.8,.11,0x73655e);b(-.77,2.08,.08,.42,.31,.29,0xb7c9b8);b(-.77,2.36,.08,.18,.25,.2,PALE);b(-.77,2.1,.25,.18,.14,.045,DARK);b(-.83,2.13,.28,.055,.075,.025,0xb9d7bf);b(-.71,2.13,.28,.055,.075,.025,0xb9d7bf);
  for(const side of [-1,1]){b(side*.39,2.18,.16,.14,.31,.18,0xa6a7ad);b(side*.45,2.34,.13,.18,.11,.17,0xc4bdc5);}
 }else if(kind==='ranger'){
  const blue=0x598897,furWhite=0xdbe0d2,hair=0xb5a579;body(blue);cape(blue,0x3f6475);arm(-1,0x7a989d);arm(1,0x7a989d);
  b(0,2.14,.01,.88,.25,.8,furWhite);for(const side of [-1,1]){b(side*.39,1.9,-.02,.2,.52,.79,furWhite);b(side*.37,1.49,0,.33,.2,.63,furWhite);eye(side*.19);b(side*.26,1.53,.31,.16,.47,.18,hair);for(const y of [1.31,1.47,1.63])b(side*.26,y,.33,.18,.055,.22,0xd5c592);}
  b(0,1.46,.32,.41,.16,.15,furWhite);clasp(0,1.21,.36);b(.52,1.12,-.38,.32,.83,.35,0x7c684c);for(const x of [.43,.61]){b(x,1.75,-.4,.045,.55,.045,GOLD);b(x,2.04,-.4,.13,.15,.09,PALE);}
  // The bow projects forward, with stepped limbs and a taut pale string.
  const x=-.76;b(x,1.2,.45,.13,.3,.17,0x7b6549);for(const side of [-1,1]){b(x,1.2+side*.29,.5,.12,.28,.14,0xb19d72);b(x,1.2+side*.53,.61,.11,.23,.14,GOLD);b(x,1.2+side*.68,.75,.12,.13,.2,PALE);}
  b(x,1.2,.8,.035,1.4,.035,PALE);b(x,1.2,.94,.04,.04,.83,0xb7a27a);b(x,1.2,1.38,.1,.1,.2,STEEL);b(0,1.95,.37,.67,.07,.08,0x9ab0b1);
 }else if(kind==='turtle'){
  const cloth=0x617979,hair=0x866950;body(STEEL);cape(cloth,0x435e61);arm(-1,STEEL);b(.56,1.18,.02,.31,.49,.37,STEEL);b(.56,.91,.05,.3,.11,.36,0xb59c83);fur=SKIN;
  b(0,1.13,.34,.78,.57,.13,0x708b91);b(0,1.15,.43,.2,.52,.06,GOLD);for(const side of [-1,1]){b(side*.5,1.53,.01,.53,.27,.67,STEEL);b(side*.51,1.69,.02,.32,.1,.47,GOLD);eye(side*.2);}
  b(0,2.12,.01,.83,.22,.76,STEEL);b(0,2.12,.43,.78,.12,.12,GOLD);b(0,2.25,.03,.17,.24,.68,DARK);b(0,2.42,.03,.15,.1,.43,GOLD);for(const side of [-1,1])b(side*.36,1.89,.02,.12,.43,.66,STEEL);b(0,1.52,.37,.45,.17,.1,hair);b(0,1.4,.37,.28,.1,.1,hair);
  // The missing right hand is visible; the surviving left hand bears a shield.
  b(-.84,1.08,.34,.2,1.38,1.02,0x556e77);b(-.97,1.08,.34,.08,1.14,.79,STEEL);b(-1.02,1.08,.34,.055,.92,.62,GOLD);b(-1.06,1.08,.34,.045,.56,.17,0xdce3d0);b(-1.06,1.19,.34,.045,.14,.55,0xdce3d0);b(-.84,.42,.34,.16,.2,.6,GOLD);
 }else if(kind==='owl'){
  const blue=0x49697f,hood=0x334d64,hair=0xc7c8bb;body(blue);cape(hood,0x293e52);arm(-1,blue);arm(1,blue);b(0,.46,.02,1.04,.36,.72,blue);b(0,.27,.03,1.1,.13,.77,GOLD);
  b(0,2.14,-.02,.91,.26,.84,hood);b(0,2.35,-.08,.6,.2,.56,hood);for(const side of [-1,1]){b(side*.41,1.84,-.05,.22,.56,.78,hood);b(side*.25,1.63,.34,.16,.46,.15,hair);}eye(-.19);b(.2,1.91,.432,.25,.2,.07,DARK);b(0,1.97,.438,.56,.045,.04,DARK);
  b(0,1.56,.4,.57,.22,.2,hair);b(0,1.33,.42,.43,.23,.19,0xaeb4af);b(0,1.13,.43,.26,.18,.17,hair);clasp(0,1.21,.37);
  b(-.78,1.25,.12,.11,2.3,.12,0x8c7650);b(-.78,2.55,.12,.16,.56,.17,STEEL);b(-.78,2.87,.12,.1,.16,.12,PALE);b(-.78,2.26,.12,.28,.1,.25,GOLD);
  // One shoulder raven has a beak, folded wings and a long tail.
  b(.63,1.75,-.12,.37,.36,.46,0x34414b);b(.63,2,.04,.32,.29,.32,0x293640);b(.63,1.96,.27,.18,.1,.19,0xa4a990);b(.63,1.8,-.45,.21,.1,.35,0x34414b);b(.8,1.74,-.14,.08,.28,.43,0x53606b);b(.53,2.04,.19,.055,.055,.025,PALE);
 }else{
  const green=0x49745c,deep=0x2e5148,hair=0x3e4240;body(green);cape(deep,0x243d37);arm(-1,deep);arm(1,deep);b(0,1.16,.32,.61,.45,.12,0x729477);b(0,1.13,.41,.12,.5,.06,GOLD);for(const side of [-1,1]){eye(side*.18);b(side*.34,1.76,-.05,.17,.65,.69,hair);b(side*.48,1.48,.01,.37,.2,.61,GOLD);}
  b(0,2.12,.01,.82,.22,.75,0x8b9b6c);b(0,2.12,.43,.79,.12,.1,GOLD);b(0,2.3,.34,.18,.28,.16,GOLD);b(0,1.55,.41,.37,.045,.025,0x76574c);
  // Tall upward and inward stepped antlers identify Loki at game-camera scale.
  for(const side of [-1,1]){b(side*.43,2.28,.03,.2,.4,.25,GOLD);b(side*.56,2.56,.04,.18,.31,.22,GOLD);b(side*.5,2.79,.07,.17,.19,.19,0xf0d6a0);b(side*.37,2.91,.08,.25,.13,.17,0xf0d6a0);b(side*.25,3.01,.08,.12,.14,.15,0xf0d6a0);b(side*.67,.82,.44,.1,.8,.14,STEEL);b(side*.67,1.17,.44,.32,.08,.21,GOLD);b(side*.67,1.36,.44,.11,.29,.14,0x7f6949);}
  clasp(0,.87,.34);b(0,1.38,-.45,.31,.37,.12,GOLD);
 }
 // Fine relief motifs and layered locks preserve each original Nordic identity.
 const relief=(x,y,z,c=GOLD,shape='rune')=>{for(let iy=-3;iy<=3;iy++)for(let ix=-2;ix<=2;ix++){const on=shape==='diamond'?Math.abs(ix)+Math.abs(iy)===3:ix===-1||iy===0&&ix<2||iy===ix+1;if(on)b(x+ix*.026,y+iy*.026,z,.026,.026,.018,c);}};
 for(let side of [-1,1]){for(let i=0;i<6;i++){b(side*(.19+i*.027),1.43-i*.012,.409,.029,.038,.024,GOLD);b(side*.32,.73+i*.063,.354,.023,.025,.024,GOLD);}relief(side*.25,1.12,.435,PALE,'diamond');}
 if(kind==='knight'){
  for(let side of [-1,1]){for(let i=0;i<7;i++){b(side*(.13+i*.034),1.44-(i%3)*.035,.555,.045,.14+(i%3)*.032,.05,i%2?0xa75f3e:0xc07745);b(side*.39,1.75+i*.048,.365,.04,.065,.04,0xb47549);}for(let i=0;i<4;i++)b(side*(.4+i*.055),1.57-i*.035,.28,.06,.035,.28,i%2?GOLD:STEEL);}
  for(let x=-.34;x<=.34;x+=.065)for(let z=-.22;z<=.2;z+=.09)b(x,2.23-Math.abs(x)*.16,z,.067,.065,.09,(Math.round(x*100)+Math.round(z*100))%3?0xa75f3e:0xc2814d);relief(.77,1.67,.57,0xe6d299);for(let i=0;i<5;i++)b(.5+i*.13,1.87,.527,.045,.045,.022,DARK);
 }else if(kind==='mage'){
  for(let side of [-1,1]){for(let i=0;i<8;i++)b(side*(.31+(i%2)*.025),1.44+i*.078,.375,.052,.11,.04,side<0?0xe2d7bf:0x343a43);for(let i=0;i<6;i++)b(side*.41,.39+i*.14,.407,.034,.05,.025,side<0?0xc5b5b7:0x99b1aa);}for(let i=0;i<5;i++)b(.11+i*.042,1.71,.45,.023,.066,.016,PALE);relief(-.77,2.11,.28,0xb1cbbf);
 }else if(kind==='ranger'){
  for(let side of [-1,1])for(let i=0;i<10;i++){b(side*(.35+(i%2)*.04),1.5+i*.055,.1,.095,.1,.52,i%3===0?0xbbc8c0:0xe0e4d5);b(side*(.15+i%2*.035),1.32+i*.05,.435,.045,.067,.044,0xc5b788);}for(let i=0;i<9;i++)b(-.76,.57+i*.15,.82,.045,.034,.035,GOLD);relief(0,1.21,.43,0xecddae,'diamond');
 }else if(kind==='turtle'){
  for(let side of [-1,1])for(let i=0;i<6;i++){b(side*(.38+i*.034),1.62-i*.025,.31,.04,.026,.15,GOLD);b(side*.33,1.76+i*.05,.37,.04,.028,.026,0x7a624e);}for(let i=0;i<9;i++){b(-1.09,.65+i*.1,.68,.028,.032,.03,PALE);b(-1.09,.65+i*.1,0,.028,.032,.03,PALE);}relief(0,1.27,.445,0xe3d8b6);
 }else if(kind==='owl'){
  for(let side of [-1,1])for(let i=0;i<8;i++){b(side*(.12+i*.026),1.25+i*.048,.53,.038,.1,.04,i%2?0xa8b4b1:0xd5d4c3);b(side*.29,.44+i*.1,.43,.027,.039,.021,GOLD);}for(let i=0;i<5;i++){b(.81,1.68+i*.047,-.23,.045,.047,.2,i%2?0x46525d:0x6a757c);b(-.78,2.4+i*.07,.221,.028,.035,.022,GOLD);}relief(0,.9,.43,PALE,'diamond');
 }else{
  for(let side of [-1,1]){for(let i=0;i<7;i++){b(side*(.28+i*.017),1.61+i*.061,.347,.045,.085,.048,i%2?0x485048:0x303c38);b(side*.67,.55+i*.095,.519,.027,.033,.022,0xe2dbb9);}for(let i=0;i<5;i++)b(side*(.1+i*.055),2.19,.45,.035,.037,.022,0xe8d199);}relief(0,1.22,.455,0xe7c878);relief(0,.95,.4,0xa8c79a,'diamond');
 }
 // Hair and fur caps are carved into a rounded stepped shell instead of slabs.
 const hairColors=kind==='knight'?[0xa75f3e,0xc07745]:kind==='mage'?[0xe2d7bf,0x323942]:kind==='ranger'?[0xdbe0d2,0xb5a579]:kind==='owl'?[0xc7c8bb]:kind==='raccoon'?[0x3e4240]:[0x866950];
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];if(!hairColors.includes(p[6])||p[3]<.4||p[5]<.5||p[1]<2)continue;parts.splice(i,1);const[x,y,z,w,h,d,c]=p;for(let ix=0;ix<9;ix++)for(let iz=0;iz<6;iz++){const nx=(ix-4)/4,nz=(iz-2.5)/2.5;if(nx*nx+nz*nz>1.7)continue;const drop=(Math.abs(nx)**2+Math.abs(nz)**2)*.035;parts.push([x-w/2+w*(ix+.5)/9,y-drop+((ix+iz)%3)*.009,z-d/2+d*(iz+.5)/6,w/9+.003,h,d/6+.003,c]);}}
 const detailed=carveNordicSurfaces(parts);nordicHeroRelief(kind,detailed);parts.splice(0,parts.length,...detailed);
 const height=Math.max(...parts.map(p=>p[1]+p[4]/2),...legs.map(p=>p.y+p.h/2));
 const result=Object.freeze({key:kind,theme:'nordic-hero',parts:Object.freeze(parts.map(p=>Object.freeze(p))),legs:Object.freeze(legs.map(p=>Object.freeze(p))),wings:Object.freeze([]),fur,muzzle,height,eyeLine:1.91,motion:'humanoid'});specs.set(kind,result);return result;
}

let detailedWolf=null;
function detailedFenrirSpec(){
 if(detailedWolf)return detailedWolf;const source=fenrirSpec(),parts=[],legs=source.legs.map(p=>Object.freeze({...p}));
 // Replace the major rectangular masses with stepped, bevelled cross sections.
 for(const p of source.parts){const[x,y,z,w,h,d,c]=p;if(w>.75&&h>.65&&d>.65){for(let i=0;i<9;i++){const edge=Math.abs(i-4)/4;parts.push([x,y-h/2+h*(i+.5)/9,z,w*(1-edge*edge*.18),h/9+.004,d*(1-edge*edge*.12),c]);}}else parts.push([...p]);}
 const b=(...p)=>parts.push(p);for(let side of [-1,1]){for(let row=0;row<7;row++)for(let j=0;j<5;j++){const y=.98+row*.12,z=.05+j*.15;b(side*(.64+Math.sin(row+j)*.035),y,z,.095,.17,.13,(row+j)%3===0?0xa3b1b5:0x788995);}for(let i=0;i<8;i++){b(side*(.25+i*.03),2.12-i*.039,1.43,.047,.06,.04,i%2?0x839399:0xaebfc0);b(side*.69,1.22+i*.055,.99,.034,.025,.025,0xe2cc91);}for(let i=0;i<4;i++)b(side*(.18+i*.08),1.58,1.99,.044,.075,.036,0x334c57);for(let i=0;i<5;i++)b(side*.39,2.28+i*.07,.99,.055,.063,.025,i%2?0x6d8591:0xaabbbd);}
 const detailed=carveNordicSurfaces(parts);fenrirFurRelief(detailed);parts.splice(0,parts.length,...detailed);
 detailedWolf=Object.freeze({...source,key:'fenrir',theme:'nordic-hero',parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs),motion:'quadruped'});return detailedWolf;
}
export function buildNordicHeroModel(kind,body,voxel){const spec=nordicHeroSpec(kind);if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
const shade=(color,tint)=>'#'+[16,8,0].map(shift=>Math.round(((color>>shift)&255)*tint).toString(16).padStart(2,'0')).join('');
export function nordicHeroPortrait(kind){
 if(kind==='fenrir'){const spec=nordicHeroSpec(kind);if(!portraits.has(kind))portraits.set(kind,voxelTagPortrait([...spec.parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],'nordic-hero-portrait'));return portraits.get(kind);}
 const spec=nordicHeroSpec(kind);if(!spec)return '';if(portraits.has(kind))return portraits.get(kind);
 const parts=[...spec.parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],polygons=[],project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27];
 for(const[x,y,z,w,h,d,color]of parts){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const[corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),color:shade(color,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(80/(maxX-minX),81/(maxY-minY)),ox=(96-(maxX-minX)*scale)/2-minX*scale,oy=(92-(maxY-minY)*scale)/2-minY*scale;
 const svg=`<svg viewBox="0 0 96 96" class="army-portrait nordic-hero-portrait" aria-hidden="true"><path d="m6 82 42-11 42 11-42 12z" fill="#607b6b" opacity=".23"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+ox).toFixed(2)+','+(y*scale+oy).toFixed(2)).join(' ')}" fill="${p.color}"/>`).join('')}</svg>`;portraits.set(kind,svg);return svg;
}
