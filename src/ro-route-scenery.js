import {roExpansionSceneryParts} from './ro-expansion-scenery.js';
import {bonkSceneryParts,bonkMonumentParts} from './bonk-prop-art.js';

const freeze=o=>Object.freeze(o);
export const RO_ROUTE_PALETTES=freeze({
 'snow-village':freeze({soil:0xd9e3df,grass:0xecf0e8,dark:0x456879,stone:0xb5cbce,wood:0x805c49,sky:0xacc9dc,glow:0xffd68b,path:0x9daeb1}),
 'toy-factory':freeze({soil:0x7f6354,grass:0xa99270,dark:0x423b43,stone:0xb6a883,wood:0x8a6046,sky:0x76859b,glow:0xffd77e,path:0xc1a781}),
 clockwork:freeze({soil:0x77725d,grass:0x9c987c,dark:0x41484e,stone:0xb8ad86,wood:0x785b44,sky:0x919eae,glow:0xf8ce78,path:0xb5a283}),
 thanatos:freeze({soil:0x524e68,grass:0x716d86,dark:0x292e43,stone:0x9895af,wood:0x5b4c64,sky:0x747b9e,glow:0xceabf6,path:0x89839d}),
 pastoral:freeze({soil:0x77934f,grass:0x9bb469,dark:0x436345,stone:0xb1ae94,wood:0x826341,sky:0xb8cbbb,glow:0xefdb9e,path:0xbaad7b}),
 bamboo:freeze({soil:0x506c45,grass:0x82935b,dark:0x2e5142,stone:0x9c9e86,wood:0x684d3d,sky:0xa4b6a5,glow:0xf1bc82,path:0xa08b69}),
 'burial-cave':freeze({soil:0x696b59,grass:0x818464,dark:0x3a4944,stone:0x9a9380,wood:0x685140,sky:0x929f99,glow:0xe7b983,path:0x95896e}),
 sograt:freeze({soil:0xc2a36a,grass:0xd4b980,dark:0x88704a,stone:0xb39561,wood:0x795d3e,sky:0xc9bca1,glow:0xf1d29b,path:0xd8bc80}),
 'sandstone-tomb':freeze({soil:0xa38c5d,grass:0xb39d6d,dark:0x69583c,stone:0xc4aa76,wood:0x73563d,sky:0xb6aa91,glow:0xefcf83,path:0xcbb385}),
 arunafeltz:freeze({soil:0xa57758,grass:0xb69a72,dark:0x704a42,stone:0xc7b59a,wood:0x6b4c40,sky:0xc2b4a7,glow:0xeac69d,path:0xcbb18b}),
 'highland-observatory':freeze({soil:0x718c59,grass:0x9eb379,dark:0x4b6155,stone:0xc0c3ac,wood:0x77624a,sky:0xb1c5bd,glow:0xded9a1,path:0xb5b393}),
 glacial:freeze({soil:0xabc5c7,grass:0xe1e7df,dark:0x66858c,stone:0x9cb8bc,wood:0x6c746a,sky:0xb4c7ca,glow:0xd8f3ed,path:0x99b3bb}),
 volcanic:freeze({soil:0x705041,grass:0x89694f,dark:0x453b39,stone:0x76665b,wood:0x5c453a,sky:0xaa9d8f,glow:0xffbe77,path:0xa57957}),
 'mage-ruins':freeze({soil:0x716985,grass:0x958aa6,dark:0x454255,stone:0xa6a0b4,wood:0x65556b,sky:0xb0aabd,glow:0xd2b9f1,path:0xa29bb3}),
 gothic:freeze({soil:0x59665f,grass:0x768474,dark:0x354647,stone:0x949e99,wood:0x5b5650,sky:0x9fada9,glow:0xc9d4d7,path:0x8c9286}),
 'valkyrie-sanctuary':freeze({soil:0xb5b9a4,grass:0xd0d3ba,dark:0x858e82,stone:0xe2e0cc,wood:0x94815b,sky:0xd5d4c1,glow:0xf6dea0,path:0xdcd7ba})
});
export function roRoutePalette(map,fallback){return RO_ROUTE_PALETTES[map?.route?.style]||fallback;}

const MODELS=freeze({pastoral:['prontera-house','prontera-fountain','prontera-gate','prontera-house'],bamboo:['payon-pavilion','payon-pavilion','payon-gate','payon-lanterns'],'burial-cave':['payon-cavemouth','tomb-garden','payon-gate','payon-lanterns'],sograt:['sand-pyramid','desert-well','sand-gate','sand-pyramid'],'sandstone-tomb':['tomb-obelisk','sand-pyramid','sand-gate','tomb-obelisk'],arunafeltz:['rachel-temple','rachel-aqueduct','rachel-temple','desert-well'],'highland-observatory':['juno-observatory','arcane-library','juno-orrery','juno-observatory'],glacial:['ice-crown','ice-spires','ice-cavemouth','ice-spires'],volcanic:['magma-furnace','lava-arch','basalt-throne','magma-furnace'],'mage-ruins':['mage-tower','arcane-library','runic-gate','crystal-orbit'],gothic:['ruined-chapel','tomb-garden','gothic-gate','ruined-chapel'],'valkyrie-sanctuary':['valkyrie-throne','valkyrie-colonnade','valkyrie-arch','valkyrie-throne']});

// The same lateral sites have different architectural silhouettes by region.
// All dimensions fit their existing 11m pocket; the 18m central road stays open.
export function roRouteSceneryParts(style,index,p){
 const expansion=roExpansionSceneryParts(style,p,index);if(expansion)return expansion;
 const models=MODELS[style];if(!models)return null;const model=models[index%models.length];if(!['tomb-obelisk','rachel-temple','rachel-aqueduct','juno-observatory','juno-orrery','valkyrie-throne','valkyrie-colonnade','valkyrie-arch'].includes(model))return bonkSceneryParts(model,p,index);
 const parts=[],b=(x,y,z,w,h,d,c=p.stone,a=0,lit=false)=>parts.push([x,y,z,w,h,d,c,a,lit]),column=(x,z,h=6)=>{b(x,.25,z,1.7,.5,1.7,p.dark);for(let i=0;i<7;i++)b(x,.7+i*(h-.8)/7,z,.9,(h-.8)/7*.95,.9,i%3?p.stone:p.dark);b(x,h,z,1.6,.4,1.6);};
 if(model==='tomb-obelisk'){for(let level=0;level<3;level++)b(0,.18+level*.3,0,5-level*.7,.35,4.8-level*.7,level%2?p.stone:p.dark);for(const side of [-1,1]){for(let j=0;j<8;j++)b(side*1.35,1.3+j*.6,0,.9-j*.045,.6,.95-j*.045,j%3?p.stone:0xab8b58);for(let j=0;j<5;j++){b(side*1.35,1.6+j*.7,.52,.08,.18,.03,p.glow);b(side*1.35+.15,1.64+j*.7,.52,.14,.05,.03,p.dark);}b(side*1.35,6.2,0,.27,.6,.3,p.glow);}b(0,1.1,1.6,1.7,.3,1.2,p.dark);for(let j=0;j<4;j++)b(0,1.4+j*.15,1.6,1.5-j*.12,.2,1-j*.1);}
 if(model==='rachel-temple'){for(let j=0;j<4;j++)b(0,.16+j*.28,0,10-j*.7,.3,8-j*.6,j%2?p.stone:p.dark);for(const x of [-3,3])for(const z of [-2,2])column(x,z,6.3);b(0,5.7,-2,5.2,3.8,.8,p.stone);for(const x of [-1.8,0,1.8]){b(x,5,-1.52,.7,1.9,.06,p.dark);b(x,5.2,-1.47,.4,1.2,.03,0xcaa67b);}for(let j=0;j<6;j++)b(0,6.8+j*.3,0,9-j*1.25,.34,7-j*.8,j%2?0x985a49:0x7b443b);b(0,8.7,0,2.5,.25,1.5,p.glow);}
 if(model==='rachel-aqueduct'){for(const x of [-4,-1.3,1.3,4])column(x,0,5.1);for(let i=0;i<3;i++){const x=-2.7+i*2.7;for(const side of [-1,1])for(let j=0;j<3;j++)b(x+side*(1.1-j*.24),3.8+j*.4,0,.7,.5,1.5,p.stone);}b(0,5.5,0,10.6,.55,2);for(const side of [-1,1])b(0,6,side*.85,10.7,.5,.3,p.dark);b(0,5.8,0,10.4,.08,1.3,0x779c96);}
 if(model==='juno-observatory'){for(let i=0;i<3;i++)b(0,.2+i*.3,0,8-i*.6,.35,7.5-i*.6,i%2?p.stone:p.dark);for(const side of [-1,1]){b(side*2.4,3.7,0,.8,5.5,5.7,p.stone);for(let j=0;j<4;j++)b(side*2.85,1.7+j*1.1,1.8,.06,.5,.3,p.dark);}b(0,5.6,0,5.7,.7,6.5,p.stone);for(let j=0;j<5;j++)b(0,6.1+j*.45,0,5.8-j*.75,.5,5.8-j*.75,j%2?0x82928c:0x6c817b);b(.6,8.1,.3,1,.9,1,p.dark);b(1.2,8.4,.3,3.3,.7,.7,0xc4ad74);b(2.9,8.4,.3,.2,1,1,p.glow);for(const x of [-1,1])b(x,2.5,2.88,.8,1.5,.05,p.glow);}
 if(model==='juno-orrery'){for(let i=0;i<3;i++)b(0,.2+i*.3,0,6.7-i*.8,.35,6.7-i*.8,i%2?p.dark:p.stone);b(0,2.7,0,.7,4,.7,p.stone);for(let ring=0;ring<3;ring++)for(let j=0;j<24;j++){const a=j*Math.PI/12,r=2+ring*.4,x=Math.sin(a)*r,z=Math.cos(a)*r;b(x,4.2+Math.sin(a)*(ring-1)*1.2,z,.2,.2,.52,ring===1?p.glow:0x9e906b,-a);}b(0,4.2,0,1,1,1,p.glow,Math.PI/4);for(let j=0;j<5;j++){const a=j*1.9;b(Math.sin(a)*2.4,4.2+Math.sin(a)*1.2,Math.cos(a)*2.4,.45,.45,.45,j%2?0x779b9a:p.stone);}}
 if(model==='valkyrie-colonnade'||model==='valkyrie-arch'){for(const x of [-3.7,3.7])for(const z of model==='valkyrie-colonnade'?[-2.5,2.5]:[0])column(x,z,7.5);b(0,7.6,0,9.6,.6,model==='valkyrie-colonnade'?7:2.2);for(let j=0;j<5;j++)b(0,8+j*.23,0,8.7-j*1.45,.25,model==='valkyrie-colonnade'?6-j*.65:2.5,p.stone);for(const x of [-3.7,3.7])for(let j=0;j<5;j++)b(x,.9+j*.9,.55,.12,.35,.04,p.glow,0,true);}
 if(model==='valkyrie-throne'){for(let j=0;j<4;j++)b(0,.16+j*.3,0,8-j*.8,.35,7-j*.75,j%2?p.stone:p.dark);for(const part of bonkMonumentParts(1,'geffen',p))b(part[0]*1.35,part[1]*1.35+1,part[2]*1.35,part[3]*1.35,part[4]*1.35,part[5]*1.35,part[6],part[7]||0);for(const side of [-1,1])for(let j=0;j<6;j++){b(side*(1.5+j*.46),5.2+j*.12,-.7,.75,.3,1.1,p.stone,side*.14);b(side*(1.5+j*.46),4.8-j*.28,-.7,.3,.9,1,p.glow);}for(const side of [-1,1])column(side*3,-2.2,7);}
 return parts;
}
