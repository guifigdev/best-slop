import {RO_TOWN_SERVICE_TYPES} from '../shared/ro-town-services.js';
export const isRoTownNpc=o=>RO_TOWN_SERVICE_TYPES.includes(o?.type);
export function roTownNpcParts(o){
 const parts=[],add=(x,y,z,w,h,d,c,a=0)=>parts.push([x,y,z,w,h,d,c,a]),kafra=o.type==='kafra',healer=o.type==='healer',smith=o.type==='blacksmith',coat=kafra?0x3e6696:healer?0xe5e7ce:smith?0x73533e:0x607b5b;
 add(0,.07,0,2.5,.14,2.3,0xb8aa80);add(-.18,.4,0,.27,.65,.35,0x4d413b);add(.18,.4,0,.27,.65,.35,0x4d413b);add(0,1.05,0,.75,.85,.5,coat);add(0,1.66,0,.48,.5,.45,0xe1b68d);add(0,1.94,.02,.55,.18,.49,kafra?0xd8d0b6:0x694c32);add(-.48,1.12,0,.22,.65,.3,coat);add(.48,1.12,0,.22,.65,.3,coat);
 if(kafra||healer){add(0,1.02,.28,.48,.75,.05,0xf0eed6);add(0,1.95,.02,.65,.11,.53,0xf5f0d6);add(0,1.45,.3,.18,.14,.08,0xb64f51);}
 if(kafra){for(const x of [-.55,.55])add(x,.5,-.7,.9,.7,.6,0x97723f);add(0,.85,-.7,1.9,.12,.7,0xc0a266);}
 else if(smith){add(.75,.65,.9,.7,.8,.65,0x504f52);add(.75,1.1,.9,1.1,.2,.55,0x8b8d8c);add(.75,1.05,.57,.35,.25,.3,0x727d80);add(-.75,.5,.7,.5,.7,.5,0x795d40);add(-.75,.87,.7,.36,.15,.37,0xf1ac49);}
 else if(!healer){add(0,.72,1.05,2.4,1.1,.65,0x806447);add(0,1.32,1.05,2.6,.15,.85,0xc2a570);for(const x of [-1.1,1.1])add(x,1.8,.2,.12,2.8,.12,0x745b3a);for(let i=0;i<6;i++)add(-1.05+i*.42,3.1,.4,.42,.15,2.5,i%2?0xddd1a5:o.type==='potionShop'?0x657d9b:0x956955);if(o.type==='potionShop')for(let i=0;i<5;i++){const x=-.9+i*.45;add(x,1.57,1.1,.22,.38,.22,i%2?0x74aebc:0xc16f65);add(x,1.81,1.1,.13,.12,.13,0xd9c59b);}else{add(-.6,1.56,1.1,.8,.18,.22,0xb9cbd0,-.5);add(.5,1.65,1.1,.6,.65,.18,0x889a9f);}}
 else{add(.65,1.3,.2,.18,1.7,.18,0xd3b56e);add(.65,1.94,.2,.5,.16,.18,0xece8b8);}
 return parts;
}
