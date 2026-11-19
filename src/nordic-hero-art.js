import {FENRIR_ART,fenrirSpec,fenrirPortrait} from './fenrir-art.js';
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
 if(kind==='fenrir')return fenrirSpec();
 if(!valid(kind))return null;if(specs.has(kind))return specs.get(kind);
 const parts=[],legs=[],b=(...p)=>parts.push(p),leg=(x,color=DARK,w=.29,h=.44,z=0)=>legs.push({x,y:h/2+.05,z,w,h,d:.4,color});
 const eye=(x,y=1.91,color=EYE)=>{b(x,y,.405,.115,.14,.055,color);b(x-.018,y+.025,.44,.025,.033,.015,PALE);};
 const clasp=(x,y,z,color=GOLD)=>{b(x,y,z,.19,.2,.07,color);b(x,y,z+.045,.07,.09,.035,PALE);};
 const body=(cloth,skin=SKIN)=>{b(0,.98,0,.81,.88,.56,cloth);b(0,1.8,.025,.73,.67,.66,skin);b(0,1.62,.37,.2,.16,.16,skin);b(0,.61,.02,.87,.17,.62,DARK);b(0,.64,.36,.24,.2,.08,GOLD);leg(-.24);leg(.24);};
 const arm=(side,cloth,skin=SKIN)=>{b(side*.56,1.04,.02,.28,.69,.33,cloth);b(side*.56,.74,.06,.29,.23,.35,skin);};
 const cape=(cloth,hem=cloth)=>{b(0,1.06,-.4,1.1,1.13,.19,cloth);b(0,.52,-.44,1.17,.3,.21,hem);b(0,1.56,-.3,1.03,.2,.4,cloth);};
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
 const height=Math.max(...parts.map(p=>p[1]+p[4]/2),...legs.map(p=>p.y+p.h/2));
 const result=Object.freeze({key:kind,theme:'nordic-hero',parts:Object.freeze(parts.map(p=>Object.freeze(p))),legs:Object.freeze(legs.map(p=>Object.freeze(p))),wings:Object.freeze([]),fur,muzzle,height,eyeLine:1.91});specs.set(kind,result);return result;
}

export function buildNordicHeroModel(kind,body,voxel){const spec=nordicHeroSpec(kind);if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
const shade=(color,tint)=>'#'+[16,8,0].map(shift=>Math.round(((color>>shift)&255)*tint).toString(16).padStart(2,'0')).join('');
export function nordicHeroPortrait(kind){
 if(kind==='fenrir')return fenrirPortrait();
 const spec=nordicHeroSpec(kind);if(!spec)return '';if(portraits.has(kind))return portraits.get(kind);
 const parts=[...spec.parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],polygons=[],project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27];
 for(const[x,y,z,w,h,d,color]of parts){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const[corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),color:shade(color,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(80/(maxX-minX),81/(maxY-minY)),ox=(96-(maxX-minX)*scale)/2-minX*scale,oy=(92-(maxY-minY)*scale)/2-minY*scale;
 const svg=`<svg viewBox="0 0 96 96" class="army-portrait nordic-hero-portrait" aria-hidden="true"><path d="m6 82 42-11 42 11-42 12z" fill="#607b6b" opacity=".23"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+ox).toFixed(2)+','+(y*scale+oy).toFixed(2)).join(' ')}" fill="${p.color}"/>`).join('')}</svg>`;portraits.set(kind,svg);return svg;
}
