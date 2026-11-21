// Male costume studies from GungHo's official Thief and Assassin sprite/illustration
// sheets. These are authored voxel sculpts and pose studies, not extracted ACTs.
const P=.052,SKIN=0xe6b69b,SKIN_DARK=0xb77d66,CREAM=0xe6d4b4,INK=0x352a32,STEEL=0xa6b2b9;
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;},cache=new Map();
export const RO_THIEF_ART_SOURCES=freeze({thief:'https://ragnarokonline.gungho.jp/gameguide/character/thief/thief.html',assassin:'https://ragnarokonline.gungho.jp/gameguide/character/thief/assassin.html',policy:'Authored male voxel costume and combat-pose studies from official static sprite sheets; no binary ACT animation extraction.'});

export function roThiefJobSpec(key){
 if(!['thief','assassin'].includes(key))return null;if(cache.has(key))return cache.get(key);
 const assassin=key==='assassin',parts=[],legs=[],arms=[],cloth=assassin?0x65445f:0x826657,dark=assassin?0x412f45:0x4d3c3b,hair=assassin?0xe2dce0:0xa74932,bronze=assassin?0xb48b64:0xa57d56,features=['face','layered-hair',assassin?'katar':'dagger','official-male-costume',assassin?'crossed-ivory-wraps':'boned-leather-vest',assassin?'split-waist-panels':'baggy-knee-trousers',assassin?'trailing-scarf':'forehead-goggles'];
 const b=(x,y,z,w,h,d,c)=>{parts.push([x*P,y*P,z*P,w*P,h*P,d*P,c]);};
 // Lower-leg cylinders are the existing two-leg locomotion rig; ornament stays
 // on the authored sculpture so portraits and the world share the same costume.
 for(const side of [-1,1]){
  legs.push({x:side*2.7*P,y:4.3*P,z:0,w:3.5*P,h:8.6*P,d:4.2*P,color:assassin?dark:CREAM});
  for(let row=0;row<7;row++){const y=8.8+row*.85,w=assassin?3.5:4.4+Math.sin(row/6*Math.PI)*1.1;b(side*2.8,y,0,w,.93,4.5, row%3===0?dark:cloth);}
  if(assassin){
   for(let row=0;row<8;row++){const y=2+row*.9;b(side*2.7,y,2.3,3.1,.52,.55,CREAM);b(side*(2.7+.65*Math.sin(row)),y+.4,2.55,1.4,.55,.4,0xc1b29c);}
   b(side*2.7,1,1.2,4.2,1.8,6.2,0x65404b);b(side*2.7,1.9,2.8,3.7,.65,2.4,0x8a5c64);b(side*2.7,.2,1.1,4.35,.5,6.4,INK);
  }else{
   for(let row=0;row<7;row++)b(side*2.7,1.6+row*.92,2.3,3.2,.95,.7,row%3===0?0xd6c3a7:0xf0dfc3);
   b(side*2.7,1.1,1.35,4.3,1.8,6.4,0xb89c7e);b(side*2.7,1.55,3,3.8,.65,2.5,0xd6bd99);b(side*2.7,.2,1.1,4.4,.45,6.5,0x6e594b);
   b(side*2.8,8.4,0,4.5,1,5,0x493b36);
   for(let row=-2;row<=2;row++){const w=3.4-Math.abs(row)*.56;b(side*2.8,9.9+row*.52,2.65,w,.58,.55,row%2?0xb28d63:0x9a744e);}
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7;b(side*2.8+Math.sin(a)*.9,9.9+Math.cos(a)*.95,3,.42,.5,.26,0x735638);}
  }
 }
 // Narrow waist and high, sprite-like torso rather than a generic tunic.
 for(let row=0;row<10;row++){const y=13.4+row*.86,w=7.2+Math.sin(row/9*Math.PI)*1.8;b(0,y,0,w,.94,5.2,row%3===0?dark:cloth);}
 b(0,22.5,0,5.5,2,4,SKIN);b(0,13,0,9.4,1.15,5.8,assassin?0x927468:0xbaa28a);b(0,12.8,3.2,2,1.2,.5,bronze);b(0,12.8,3.55,.9,.65,.25,INK);
 if(assassin){
  // Crossed bandages cover the chest, with purple visible between the wraps.
  for(const side of [-1,1])for(let row=0;row<12;row++){const x=side*(-3.8+row*.67),y=14.1+row*.62;b(x,y,3.08,1.65,1.25,.7,row%3===0?0xd0bd9d:CREAM);b(x,y+.55,3.48,1.4,.2,.15,0xf0dfc3);}
  for(const side of [-1,1])for(let strip=0;strip<4;strip++){const x=side*(2.7+strip*.58),length=8.3+(strip%3)*1.1;for(let row=0;row<Math.ceil(length);row++)b(x,11.8-row*.82,2.9+(strip%2)*.2,.7,.94,.65,strip%2?0x7b4d6b:0x5d3d58);b(x,12.1-length*.82,3.1,.8,.45,.8,0xb79493);}
  // The male reference has scarf tails behind the collar, not a broad cape.
  b(0,23.4,-.2,8.1,2.2,5.3,0x714d66);b(-1,23.5,2.85,4.2,1.6,.7,0x8b626f);
  for(let tail=0;tail<2;tail++)for(let row=0;row<11;row++)b(-2.3+tail*3.6+Math.sin(row*.3+tail)*.4,22.8-row*.7,-3.9-row*.23,tail?1.5:2.1,.9,.72,row%4===0?0xa27b84:0x7f536b);
 }else{
  b(0,22,0,6.2,2.5,4.8,0x8b8070);b(0,21.1,3.1,7.8,1,.8,CREAM);
  for(let x=-3;x<=3;x++){const y=17.2,h=6.6-Math.abs(x)*.17;b(x,y,2.92,.72,h,.55,x%2?0xa58a75:0x6d544b);b(x+.3,y,3.25,.16,h-.3,.16,0xc0a58b);}
  b(0,13.7,3,8.6,1,.65,0xb2997e);b(0,19.8,3.17,7.7,.6,.55,0xb39b84);
 }
 // Bevelled head, compact eyes and ears retain the RO pixel proportion.
 for(let row=0;row<9;row++){const widths=[5.2,7.2,8.5,9.1,9.5,9.5,9.1,8.4,6.7];b(0,24+row,.35,widths[row],1.12,6.4,row<2?SKIN_DARK:SKIN);}
 for(const side of [-1,1]){b(side*4.85,27.9,.2,1.1,2.5,1.8,SKIN);b(side*2.05,28.1,3.65,1.8,1.9,.5,0xf2e5d5);b(side*2.05,28,3.97,.88,1.7,.35,assassin?0x805c64:0x5d4d3d);b(side*2.05,27.8,4.2,.45,1.1,.18,INK);b(side*2.25,28.6,4.3,.3,.45,.15,0xffefdc);b(side*2,29.5,3.75,1.9,.43,.4,assassin?0x9d969f:0x7b3a2c);}
 b(0,26.8,3.9,.9,1.1,.7,SKIN);b(0,25.5,3.8,1.55,.3,.23,SKIN_DARK);
 for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++){if(Math.abs(x)===4&&Math.abs(z)>1)continue;const y=33.4-Math.abs(x)*.18-Math.abs(z)*.2;b(x,y,z,1.08,2.2,1.08,(x+z+12)%4===0?assassin?0xf5edef:0xc36b45:hair);}
 if(assassin){
  for(let lock=0;lock<9;lock++){const x=lock-4,len=3.1+(lock<5?(4-lock)*.75:0);b(x,32.1-len*.5,3.5,1.05,len,1.1,lock%3===0?0xf4ebed:hair);for(let row=0;row<3;row++)b(x+.2*row,34.5+row*.75+(lock%3)*.25,-.3,1.1-row*.22,.9,1.4,lock%2?0xe7e1e4:0xc3bdc8);}
  for(const side of [-1,1])for(let row=0;row<5;row++)b(side*4.25,31.3-row*.65,-.2,1.2,.82,4.7,row%2?0xc3bdc8:hair);
 }else{
  b(0,30.65,0,10.2,1.75,7.1,0xc5b59d);b(0,31.5,3.68,9,1.05,.55,0x8d6a4f);
  for(const side of [-1,1]){for(let row=-2;row<=2;row++){const w=3.3-Math.abs(row)*.6;b(side*2.6,32.25+row*.52,4.05,w,.6,.85,0x906748);}b(side*2.6,32.25,4.6,2,1.8,.35,0xc6ae88);b(side*2.9,32.7,4.84,.7,.7,.18,0xeee2c7);}b(0,32.25,4.45,1.8,.4,.4,bronze);
  for(let lock=0;lock<11;lock++){const x=(lock-5)*.9,height=2.8+(lock%3)*.8;for(let row=0;row<Math.ceil(height);row++)b(x+(row*.13)*(lock%2?1:-1),34.1+row*.72,-.25+(lock%3)*.6,1.1-row*.16,.95,1.4,lock%3===0?0xc9663e:hair);}
 }
 // Two independent shoulder/forearm/weapon groups are baked only once.
 for(const side of [-1,1]){
  const start=parts.length,pivot=[side*5.6*P,21*P,0];
  for(let row=0;row<4;row++){const width=4.2-Math.abs(row-1)*.65;b(side*5.45,21.7-row*.48,-.1,width,.65,4.3-row*.12,row%2?bronze:assassin?0xc09e79:0x8b694b);for(let rib=0;rib<4;rib++)b(side*(4.2+rib*.72),21.6-row*.48,2.1-rib*.09,.45,.22,.25,assassin?0xd6bb8d:0xc29a68);}
  b(side*6.1,18.8,.25,2.45,4.8,3.1,SKIN);b(side*6.45,15.7,1.05,2.5,3.2,2.9,SKIN);b(side*6.5,14.7,1.9,2.85,1.5,3.1,assassin?0x755361:0x684b3f);b(side*6.5,13.3,2.2,2.7,1.8,2.8,assassin?0x594254:0x61483c);
  for(let finger=0;finger<3;finger++)b(side*6.5+(finger-1)*.62,12.7,3.5,.5,.9,.6,SKIN_DARK);
  if(assassin){
   for(let row=0;row<4;row++)b(side*6.4,16+row*.72,2.52,2.8,.44,.5,row%2?CREAM:0xc6b29d);
   b(side*6.5,13.7,3.4,3.9,1.6,2.3,bronze);b(side*6.5,13.7,4.5,2.7,1.2,.7,0x6d5960);
   for(let row=0;row<11;row++){const width=3.3-row*.23,x=side*(6.5+row*.035),z=5+row*.8;b(x,13.9+row*.09,z,width,.62,.95,STEEL);b(x-width*.28,14.3+row*.09,z,.35,.24,.93,0xe2e6e4);b(x,14.3+row*.09,z,.3,.2,.96,0xc4cbd0);}
   b(side*6.5,13.8,4,5,.55,.7,0xd1b477);b(side*6.5,13.8,3.65,1.3,2.2,.5,bronze);
  }else if(side===1){
   b(6.5,13.5,3.8,1.1,1.5,3.4,0x704b35);for(let row=0;row<7;row++){const x=6.4-row*.15,y=14+row*.38,z=5.5+row*.72,width=2.5-row*.23;b(x,y,z,width,.62,.9,STEEL);b(x-width*.3,y+.4,z,.35,.25,.85,0xe2e5de);}b(6.5,13.7,5,4,.6,.7,bronze);
  }
  const indices=parts.slice(start).map((_,i)=>start+i);arms.push({key:side===1?'right':'left',side,pivot,indices,parts:indices.map(i=>{const p=parts[i];return[p[0]-pivot[0],p[1]-pivot[1],p[2]-pivot[2],...p.slice(3)];})});
 }
 const indices=arms.flatMap(a=>a.indices),weaponRig={kind:assassin?'dual-katar':'dagger-thrust',job:key,pivot:[0,0,0],indices,parts:indices.map(i=>[...parts[i]]),arms};
 const result=freeze({key,theme:'ragnarok-job',parts,legs,wings:[],weaponRig,fur:SKIN,muzzle:SKIN,height:Math.max(...parts.map(p=>p[1]+p[4]/2)),eyeLine:28.1*P,motion:'humanoid',features,reference:RO_THIEF_ART_SOURCES[key]});cache.set(key,result);return result;
}
