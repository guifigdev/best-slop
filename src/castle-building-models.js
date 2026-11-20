import * as T from 'three';
import {CASTLE_BUILDINGS,CASTLE_RACES} from '../shared/castle-catalog.js';

// Both the 3D model and the inventory portrait use this original voxel spec.
const specs=new Map(),geometryCache=new Map(),portraits=new Map();
const races=['human','elf','nightelf','orc','undead','naga','north','chaos','corrupted','mech'];
const mech={h09T:'power',h069:'scrapyard',h06J:'generator',h05R:'generator',h05T:'gunsmith',h09P:'arsenal',h05U:'sawmill',h05M:'demolition',h05J:'aircraft',h09L:'bomber',h05V:'golem',h097:'golem',h05X:'tank',h09J:'minelayer',h09I:'assault',h09B:'heavy',h09H:'rocket',h05L:'coil',h008:'treasury'};
const basePalette={stone:0xb8b79e,wood:0x85664e,iron:0xa7b8b5,dark:0x334847,ivory:0xe6dfc5,gold:0xdfbc6d,water:0x70b9c4,glow:0xb7dced,fire:0xf2ab50};
function paletteFor(race){return{...basePalette,accent:new T.Color(CASTLE_RACES[race]?.color||'#91b69c').getHex(),...({mech:{stone:0x8c9e9c,accent:0x93b7a4,dark:0x344f53},undead:{stone:0x686c7b,wood:0x6a5b64,glow:0xa9cca1},chaos:{stone:0x625668,dark:0x342e40,glow:0xee9c65},corrupted:{stone:0x705f77,wood:0x66526b,glow:0xb4db70},north:{stone:0xa3c6ce,ivory:0xe9efdf,glow:0xb9e8f4},nightelf:{stone:0x898697,wood:0x6b6172,glow:0xc6c8ed},naga:{stone:0x81aaa2,water:0x67adbd,gold:0xd6cb8b}}[race]||{})};}
function familyFor(key,b){
 const n=b.name.toLowerCase();if(b.race==='mech')return mech[key.split('_')[1]]||'workshop';
 const rules=[['treasury',/treasure/],['mushroom',/mushroom/],['volcano',/volcano/],['launcher',/eraser|launcher|freezer|artillery/],['igloo',/igloo/],['portal',/portal|gate/],['boneaviary',/cemetery/],['aviary',/gryphon|nest|falcon/],['cage',/cage/],['mine',/mine/],['graveyard',/crypt|graveyard/],['bones',/skull|bone/],['cart',/hay cart/],['granary',/granary/],['stable',/farm/],['butchery',/slaughter/],['glacier',/rocks|glacier|claws/],['pool',/pool|well|spring|fountain|spawning/],['pyramid',/pyram/],['statue',/statue|guardian|forgotten/],['totem',/totem|serpent rock/],['obelisk',/obelisk/],['tower',/tower|lantern|protector|turret/],['chapel',/church|chapel/],['shrine',/shrine|altar|oracle/],['academy',/school|academy|hjordhejmen|temple|palace|voodoo/],['siege',/siege|weapon lab/],['range',/archery|sniper|marksmen|gunner|hunter|ranger|amazon|trapper/],['hut',/hut|tent/],['village',/camp|village/],['fortress',/citadel|stronghold|fortress/],['city',/city|mansion|guild/],['hall',/hall|barracks|house/],['grove',/glade/]];
 if(b.race==='corrupted'&&/ancient/.test(n))return 'livingtree';return rules.find(([,rule])=>rule.test(n))?.[0]||'shrine';
}
export function buildingModelSpec(key,definition){
 const b=definition||(Object.hasOwn(CASTLE_BUILDINGS,key)?CASTLE_BUILDINGS[key]:null);if(!b||typeof b.name!=='string')return null;
 const signature=key+'|'+b.name+'|'+b.race+'|'+b.footprint?.w+'|'+b.footprint?.d;if(specs.has(signature))return specs.get(signature);
 const family=familyFor(key,b),race=b.race||'human',p=paletteFor(race),boxes=[],siblings=Object.keys(CASTLE_BUILDINGS).filter(k=>CASTLE_BUILDINGS[k].race===race&&familyFor(k,CASTLE_BUILDINGS[k])===family).sort(),index=Math.max(0,siblings.indexOf(key)),culture=races.indexOf(race),name=b.name.toLowerCase(),rank=Math.max(0,(b.visualProfile?.tier||1)-1),rise=.18*(index%4),span=.56+(index%3)*.1;
 const add=(x,y,z,w,h,d,color='stone',part=family)=>boxes.push({x,y,z,w,h,d,color:p[color]??color,part});
 const roof=(x,y,z,w,d,color='accent',steps=3)=>{for(let i=0;i<steps;i++)add(x,y+i*.2,z,w*(1-i/(steps+.5)),.22,d*(1-i/(steps+.5)),color,'roof');};
 const house=(x,z,w=.65,d=.58,h=1.05,color='stone')=>{add(x,.3+h/2,z,w,h,d,color,'hall');roof(x,.3+h,z,w+.08,d+.08);add(x,.64,z+d/2+.005,w*.3,.65,.025,'dark','door');};
 const chimney=(x,z,h=2.6)=>{add(x,.3+h/2,z,.15,h,.16,'dark','chimney');add(x,.34+h,z,.22,.14,.23,'iron','chimney');};
 const pillar=(x,z,h=2.4,w=.15,color='stone')=>{add(x,.3+h/2,z,w,h,w,color,'pillar');add(x,.34+h,z,w+.08,.14,w+.08,'gold','capital');};
 const tank=(x,z,w=.46,d=.6,h=.5)=>{add(x,.4,z,w,h,d,'iron','tank');for(const s of [-1,1])add(x+s*w*.48,.3,z,.1,.25,d*.94,'dark','tracks');add(x,.4+h*.6,z-.02,w*.58,.27,d*.45,'accent','turret');add(x,.4+h*.6,z+d*.42,.07,.09,d*.55,'dark','barrel');};
 const statue=(x,z)=>{add(x,.42,z,.35,.3,.35,'stone','plinth');for(const s of [-1,1]){add(x+s*.085,.75,z,.12,.44,.17,'iron','statue-leg');add(x+s*.22,1.22,z,.14,.65,.18,'iron','statue-arm');}add(x,1.22,z,.33,.58,.25,'iron','statue-body');add(x,1.68,z,.22,.28,.22,'ivory','statue-head');add(x,1.95,z,.12,.18,.12,'glow','statue-crown');};
 const ring=(x,z,r=.35,y=.42,color='stone',count=12)=>{for(let i=0;i<count;i++){const a=i/count*Math.PI*2;add(x+Math.cos(a)*r,y,z+Math.sin(a)*r,.17,.2,.17,color,'rim');}};
 const fence=(z=.35,count=5)=>{for(let i=0;i<count;i++)add(-.4+i*.8/(count-1),.62,z,.055,.65,.055,'wood','fence');add(0,.7,z,.86,.07,.07,'wood','fence');};
 add(0,.13,0,.98,.24,.98,'stone','foundation');
 // Cultural foundations change volume; they are not colored banners.
 if(race==='naga')add(0,.27,0,.9,.07,.9,'water','tidal-basin');
 else if(race==='corrupted')for(const s of [-1,1])add(s*.27,.32,s*.25,.42,.23,.19,'wood','root');
 else if(race==='north')for(const s of [-1,1])add(s*.34,.3,-.3,.17,.28,.23,'ivory','snow-bank');
 else if(race==='undead')for(const s of [-1,1])add(s*.36,.31,.28,.14,.28,.24,'dark','buttress');
 else if(race==='nightelf')add(-.32,.32,-.27,.22,.25,.32,'wood','living-root');
 else if(race==='chaos')for(const s of [-1,1])add(s*.33,.31,0,.16,.25,.68,'dark','basalt-foot');
 else if(race==='elf')add(0,.31,-.35,.76,.17,.17,'ivory','marble-step');
 else if(race==='orc')for(const s of [-1,1])add(s*.32,.34,-.3,.15,.34,.15,'wood','stake');
 else if(race==='mech')add(0,.28,0,.9,.09,.86,'dark','steel-deck');
 switch(family){
 case 'aircraft':case 'bomber':{
  const bomber=family==='bomber';add(-.12,.83,-.08,.58,1.1,.68,'iron','hangar');roof(-.12,1.4,-.08,.64,.74,'accent',bomber?2:4);add(-.12,.77,.27,.45,.85,.03,'dark','hangar-door');add(.3,.36,.13,.27,.1,.55,'iron','heliport');add(.3,.42,.12,.22,.025,.04,'ivory','heliport-mark');add(.3,.42,.12,.04,.025,.2,'ivory','heliport-mark');chimney(-.34,-.3,bomber?2.3:2.7);add(.24,1.86,-.06,.13,.23,.28,'glow','cockpit');add(.24,1.7,-.06,.36,.07,.23,'ivory','aircraft-wings');add(.24,1.87,-.06,.5,.045,.045,'dark','rotor');if(bomber){for(const s of [-1,1])add(.24+s*.12,1.58,-.06,.06,.13,.16,'fire','bomb-rack');add(.32,.9,-.27,.14,.8,.2,'iron','fuel-tank');}break;
 }
 case 'golem':{
  const precious=/precious/.test(name);add(-.12,.68,-.08,.63,.76,.62,'stone','forge');add(-.12,.69,.24,.34,.42,.03,'fire','furnace');add(-.12,1.16,-.05,.3,.2,.4,'iron','anvil');chimney(-.31,-.29,precious?2.4:1.95);statue(.22,.1);if(precious){for(const s of [-1,1]){pillar(s*.36,-.2,2.45,.12,'gold');add(s*.36,2.96,-.2,.14,.3,.14,'glow','crystal');}add(0,2.65,-.24,.75,.12,.18,'gold','gantry');}break;
 }
 case 'demolition':
  add(-.18,.72,-.15,.48,.85,.45,'stone','bunker');add(-.18,1.2,-.15,.58,.2,.55,'dark','blast-roof');for(const s of [-1,1]){add(.2,.64,s*.22,.25,.65,.25,'fire','explosive-vat');add(.2,1,s*.22,.18,.13,.18,'dark','vat-cap');add(.2,.6,s*.22,.27,.06,.27,'gold','hazard-band');}add(-.22,.65,.31,.28,.35,.23,'wood','dynamite-crate');for(let i=0;i<3;i++)add(-.3+i*.075,.9,.31,.04,.24,.05,'fire','dynamite');chimney(-.28,-.26,2.2);break;
 case 'gunsmith':
  house(-.13,-.1,.57,.55,.95);add(.28,.65,.05,.14,.7,.5,'wood','gun-rack');for(let i=0;i<3;i++)add(.28,.86,-.09+i*.16,.045,.75,.045,'iron','rifle');add(-.1,.53,.34,.45,.25,.19,'iron','workbench');chimney(-.33,-.28,1.9);break;
 case 'arsenal':
  add(0,.94,-.12,.84,1.25,.58,'iron','armory');roof(0,1.6,-.12,.9,.64,'dark',2);for(const s of [-1,1]){add(s*.3,.73,.25,.22,.9,.3,'accent','weapon-bay');for(let i=0;i<2;i++)add(s*.3,.86,.25+i*.1,.055,1.05,.055,'iron','rifle');chimney(s*.31,-.27,2.35);}add(0,.68,.24,.23,.85,.05,'gold','vault-door');break;
 case 'sawmill':
  add(-.18,.68,-.12,.5,.8,.57,'wood','mill');roof(-.18,1.14,-.12,.62,.68,'iron',2);add(.22,.5,.06,.32,.26,.7,'dark','conveyor');for(let i=0;i<4;i++)add(.22,.72,-.2+i*.15,.28,.19,.1,'wood','logs');add(.22,1,.05,.035,.6,.4,'ivory','saw');for(let i=0;i<4;i++)add(.22,.81+i*.13,.27,.065,.08,.08,'iron','saw-teeth');chimney(-.34,-.28,2.1);break;
 case 'tank':case 'assault':case 'heavy':case 'rocket':case 'minelayer':{
  const heavy=family==='heavy',rocket=family==='rocket',mines=family==='minelayer',assault=family==='assault';add(-.07,.74,-.19,.76,1,.43,'iron','assembly-hall');add(-.07,1.32,-.18,.84,.2,.52,'accent','factory-roof');add(-.07,.72,.035,.55,.76,.025,'dark','assembly-bay');tank(.03,.24,heavy?.66:.5,.42,heavy?.65:.4);if(rocket){for(const s of [-1,1])add(.03+s*.13,1.14,.23,.085,.55,.1,'fire','rocket');add(.03,.91,.21,.45,.18,.3,'dark','launcher');}if(mines){add(-.31,.6,.25,.19,.32,.35,'wood','mine-crate');for(let i=0;i<3;i++)add(-.31,.82,.13+i*.11,.15,.09,.09,'gold','mine');}if(assault){add(.32,1,-.18,.18,1.4,.17,'dark','crane-column');add(.17,1.71,-.18,.51,.12,.16,'gold','crane');}chimney(-.33,-.29,heavy?2.7:rocket?2.3:mines?1.8:2.05);if(heavy){add(.31,1.08,-.2,.17,1.65,.2,'dark','reinforcement');add(.02,1.91,-.18,.8,.15,.22,'gold','gantry');}break;
 }
 case 'power':
  for(const s of [-1,1]){add(s*.23,1.05,-.1,.28,1.5,.32,'iron','reactor');for(let i=0;i<4;i++)add(s*.23,.6+i*.32,-.1,.38,.08,.4,'dark','cooling-fin');add(s*.23,1.95,-.1,.17,.3,.2,'glow','power-core');}add(0,.69,.3,.55,.72,.22,'accent','control-room');add(0,1.1,.3,.4,.13,.24,'gold','switchboard');break;
 case 'generator':{
  const red=/red/.test(name);for(const s of [-1,1]){pillar(s*.3,0,red?2.1:1.65,.19,'iron');add(s*.3,red?2.62:2.17,0,.24,.28,.24,red?'fire':'glow','coil-terminal');}add(0,.62,0,.36,.6,.4,'dark','generator');add(0,1.3,0,.25,.55,.25,red?'fire':'glow','shield-core');if(red){add(0,2.47,0,.75,.12,.17,'iron','bridge');add(0,.43,.3,.6,.15,.22,'fire','battery');}break;
 }
 case 'scrapyard':
  for(let i=0;i<7;i++)add((i%3-1)*.24,.42+Math.floor(i/3)*.22,(Math.floor(i/3)-1)*.22,.27,.26,.28,i%2?'iron':'dark','scrap');tank(-.15,.28,.36,.25,.22);add(.3,1.05,-.21,.12,1.55,.12,'iron','hoist');add(.12,1.86,-.21,.48,.1,.12,'gold','hoist-arm');break;
 case 'coil':
  pillar(0,0,2.6,.27,'iron');for(let i=0;i<5;i++)add(0,.75+i*.34,0,.58-i*.06,.09,.58-i*.06,'gold','coil-fin');add(0,3.15,0,.25,.35,.25,'glow','energy-tip');break;
 case 'treasury':
  add(0,.65,0,.74,.65,.57,'wood','chest');for(let i=0;i<3;i++)add(0,1.04+i*.1,0,.74-i*.09,.12,.58-i*.12,'gold','chest-lid');for(const s of [-1,1])add(s*.24,.72,0,.07,.8,.61,'iron','chest-band');add(0,.78,.3,.13,.2,.08,'gold','lock');for(let i=0;i<2+culture%4;i++)add(-.3+i*.17,.38,-.32,.13,.13,.12,'gold','coin-stack');if(culture>4)for(const s of [-1,1])pillar(s*.36,-.22,1.3+(culture-5)*.13,.1);break;
 case 'chapel':
  house(0,0,.63,.8,1.15+rise+rank*.2);pillar(-.26,-.2,2.2+rank*.45,.24);roof(-.26,2.7+rank*.45,-.2,.36,.4,'accent',2);add(-.26,3.22+rank*.45,-.2,.07,.43,.07,'gold','bell-spire');if(rank){house(.3,.08,.26,.6,.8);add(-.26,2.25,-.02,.11,.27,.05,'gold','bell');}break;
 case 'pool':
  add(0,.33,0,.82,.1,.8,'water','pool');ring(0,0,.35,.43,'stone',10+index);if(/royal|lernaean|wonders|blood/.test(name)){for(const s of [-1,1])pillar(s*.3,-.25,1.7+rise,.12);add(0,1.1,-.18,.21,1.1,.2,/blood/.test(name)?'fire':'glow','fountain');}else{add(-.2,.85,-.21,.22,.9,.23,'stone','well-column');roof(-.2,1.35,-.21,.36,.36,'accent',2+index%2);}if(/spawning/.test(name))for(let i=0;i<3;i++)add(-.22+i*.22,.56,.23,.12,.2,.14,'ivory','eggs');if(/reptile/.test(name))add(.15,.63,.07,.45,.17,.2,'accent','reptile-perch');break;
 case 'pyramid':
  for(let i=0;i<6;i++)add(0,.4+i*.29,0,.88-i*.12,.3,.88-i*.12,'stone','pyramid-step');add(0,2.25,0,.17,.2,.17,'gold','pyramid-crown');break;
 case 'portal':{
  const arch=1+index%3,top=2.1+rank*.3+rise;for(const s of [-1,1]){pillar(s*.31,0,top,.19);for(let i=0;i<arch;i++)add(s*(.31-i*.055),top+.43+i*.17,0,.19,.18,.23,'accent','arch-step');}add(0,.6,0,.4,.32,.26,'glow','portal-sill');if(/abyss|hell|demon/.test(name))for(const s of [-1,1])add(s*.39,.7,.28,.12,.8,.15,'dark','horn');if(rank||/dragonhawk/.test(name))add(0,top+.82,0,.23,.25,.27,'gold','keystone');break;
 }
 case 'cage':
  for(const s of [-1,1])for(let i=0;i<4;i++)add(s*.36,1.05,-.3+i*.2,.05,1.5+rank*.25,.06,'iron','cage-bars');for(const z of [-.3,.3])add(0,1.85+rank*.25,z,.8,.15,.15,'dark','cage-roof');add(0,.4,0,.6,.15,.55,'fire','cage-floor');if(rank){add(0,2.15,-.1,.34,.32,.4,'accent','demon-lock');pillar(0,-.3,2.6,.12,'dark');}break;
 case 'aviary':case 'boneaviary':
  for(const s of [-1,1])pillar(s*.29,-.04,1.5+rise+rank*.2,.15,family==='boneaviary'?'ivory':'wood');add(0,1.88+rise+rank*.2,0,.86,.16,.6,family==='boneaviary'?'ivory':'wood','perch');for(let i=0;i<6+index;i++){const a=i*Math.PI*2/(6+index);add(Math.sin(a)*.29,2.08+rise,Math.cos(a)*.2,.18,.18,.16,'gold','nest');}add(0,2.18+rise,0,.18,.28,.21,'ivory','egg');if(/dragon|azure/.test(name))for(const s of [-1,1])add(s*.35,2.35+rise,0,.19,.45,.2,'accent','wing-spire');break;
 case 'statue':
  statue(0,0);for(let i=0;i<index%3+1;i++)add(0,.4+i*.13,-.22,.65-i*.12,.14,.4,'stone','pedestal');if(/guardian|forgotten/.test(name))for(const s of [-1,1])add(s*.32,1.2,0,.2,1.2,.35,'accent','statue-wings');if(/coral/.test(name))for(const s of [-1,1]){add(s*.3,1,0,.15,1.2,.15,'accent','coral');add(s*.2,1.4,0,.35,.15,.18,'ivory','coral-arm');}break;
 case 'mine':
  for(let i=0;i<4;i++)add((i%2-.5)*.38,.5+Math.floor(i/2)*.45,-.12,.48,.6,.58,'stone','mine-rock');add(0,.67,.2,.36,.7,.05,'dark','mine-mouth');for(const s of [-1,1])add(s*.21,.75,.22,.1,1,.1,'wood','pit-prop');add(0,1.27,.22,.54,.13,.15,'wood','pit-lintel');for(const s of [-1,1])add(s*.12,.32,.33,.04,.05,.3,'iron','mine-track');break;
 case 'graveyard':
  for(let i=0;i<3+index;i++){const x=(i%3-1)*.26,z=Math.floor(i/3)*.35-.17;add(x,.4,z,.18,.12,.4,'dark','grave');add(x,.72,z-.16,.21,.6,.13,'stone','headstone');}if(/crypt/.test(name)){add(0,.9,-.14,.55,1.1,.5,'stone','crypt');roof(0,1.5,-.14,.68,.6,'dark',3);add(0,.72,.12,.24,.65,.03,'dark','crypt-door');}break;
 case 'bones':
  for(let i=0;i<4+index%3;i++){const x=(i%3-1)*.23,y=.55+Math.floor(i/3)*.4;add(x,y,-.05,.23,.27,.24,'ivory','skull');add(x,y,.078,.13,.09,.025,'dark','eye-sockets');}if(/temple|shrine/.test(name)){for(const s of [-1,1])pillar(s*.34,-.25,1.85+rank*.2,.11,'ivory');add(0,2.25+rank*.2,-.25,.85,.2,.22,'accent','bone-arch');}break;
 case 'cart':
  add(0,.74,0,.72,.35,.56,'wood','cart');for(const s of [-1,1])for(const z of [-.2,.2])add(s*.39,.54,z,.12,.36,.25,'dark','wheel');for(let i=0;i<3;i++)add(0,1+i*.16,0,.65-i*.13,.18,.52-i*.12,'accent','hay');add(0,.64,.35,.1,.1,.27,'wood','handle');break;
 case 'granary':
  for(const s of [-1,1]){add(s*.24,1,-.1,.36,1.4,.48,'wood','silo');roof(s*.24,1.77,-.1,.47,.57,'dark',3);}add(0,.65,.29,.62,.55,.24,'accent','feed-bay');break;
 case 'stable':
  house(-.23,-.12,.38,.56,.9+rise);fence(.35,5+index%2);add(.2,.47,.1,.32,.2,.35,'wood','trough');if(/offensive/.test(name))for(let i=0;i<3;i++)add(.14+i*.1,1,.02,.055,1,.07,'iron','spear-rack');else if(/defensive/.test(name))for(let i=0;i<3;i++)add(.1+i*.12,1,.04,.1,.6,.18,'iron','shield-rack');else if(/spellbreaker/.test(name)){pillar(.25,-.13,2.2,.12);add(.25,2.7,-.13,.25,.25,.25,'glow','runestone');}else if(/tainted/.test(name))add(.25,1,-.18,.3,1.4,.25,'dark','silo');break;
 case 'butchery':
  house(-.1,-.06,.7,.65,1.45);chimney(-.31,-.3,2.5);add(.28,1.1,.27,.12,1.6,.12,'iron','hoist');add(.06,1.9,.27,.55,.12,.12,'iron','hoist');add(-.07,1.32,.27,.3,.65,.23,'accent','hanging-carcass');break;
 case 'glacier':
  for(let i=0;i<3+index%3;i++){const x=(i%3-1)*.25,z=Math.floor(i/3)*.34-.12,h=1.1+(i%2)*.7+rise+rank*.15;add(x,.35+h/2,z,.25,h,.3,'stone','ice-spire');add(x,.4+h,z,.16,.2,.19,'glow','ice-tip');}if(/claws/.test(name))for(const s of [-1,1]){add(s*.34,1.7,.26,.14,1.1,.17,'ivory','claw');add(s*.27,2.33,.26,.2,.2,.17,'ivory','claw-tip');}break;
 case 'igloo':
  for(let i=0;i<5;i++)add(0,.4+i*.25,-.07,.86-i*.12,.27,.76-i*.09,'ivory','igloo-layer');add(0,.54,.32,.35,.5,.31,'stone','igloo-entrance');add(0,.47,.483,.2,.35,.025,'dark','entrance');break;
 case 'mushroom':
  add(0,.86,0,.25,1.1,.25,'ivory','stem');add(0,1.36,0,.73,.13,.68,'dark','frost-gills');for(let i=0;i<4;i++)add(0,1.48+i*.13,0,.88-i*.17,.15,.82-i*.15,i%2?'glow':'stone','mushroom-cap');for(const s of [-1,1]){add(s*.23,1.69,.12,.12,.09,.14,'ivory','cap-speckle');add(s*.31,1.26,0,.055,.29,.075,'glow','icicle');add(s*.32,.55,-.24,.09,.5,.1,'ivory','small-stem');add(s*.32,.83,-.24,.28,.16,.27,'glow','small-cap');}add(.07,1.99,-.04,.12,.19,.12,'ivory','frost-spore');break;
 case 'livingtree':
  add(0,1.1,0,.35,1.65,.4,'wood','trunk');for(const s of [-1,1]){add(s*.27,.5,.18,.4,.3,.3,'wood','root');add(s*.32,1.7,0,.4,.25,.29,'wood','branch');add(s*.34,2.1,0,.3,.7+rank*.2,.4,'accent','crown');}add(0,2.45+rise,0,.6,.55+rank*.2,.6,'accent','canopy');add(0,1.55,.21,.23,.18,.03,'glow','tree-face');if(/annihilation/.test(name))for(const s of [-1,1])pillar(s*.35,-.22,3.2,.12,'dark');if(/nether|shadow/.test(name))add(0,2.98+rise,0,.18,.45+rank*.2,.2,'glow','tree-spire');break;
 case 'totem':
  add(0,1.3,0,.32,2,.33,'wood','totem');for(let i=0;i<3+index%2;i++)add(0,.67+i*.53,0,.49,.18,.41,i%2?'ivory':'accent','carved-face');add(0,2.55,0,.8,.16,.22,'ivory','totem-wings');if(/stasis/.test(name))for(const s of [-1,1])pillar(s*.34,-.15,1.9,.1,'glow');break;
 case 'obelisk':
  for(let i=0;i<4;i++)add(0,.55+i*.55,0,.45-i*.07,.57,.45-i*.07,'stone','obelisk');add(0,2.88,0,.14,.2,.14,'glow','beacon');for(let i=0;i<index+1;i++)add((i%2?1:-1)*.29,.55+Math.floor(i/2)*.32,-.2,.17,.35,.2,'accent','satellite');break;
 case 'tower':
  add(0,1.25,0,.45,1.9+rise,.46,'stone','tower');add(0,2.29+rise,0,.83,.24,.78,'accent','watch-platform');for(const s of [-1,1])for(const z of [-.28,.28])add(s*.29,2.6+rise,z,.15,.42,.17,'ivory','battlement');if(/anti air/.test(name))for(const s of [-1,1])add(s*.16,2.83+rise,.05,.08,.55,.3,'iron','anti-air-barrel');else{add(0,2.65+rise,.32,.14,.2,.47,'dark','turret');add(0,2.95+rise,0,.18,.3,.18,'glow','beacon');}break;
 case 'launcher':
  add(0,.74,0,.72,.8,.61,'stone','launcher-base');for(const s of [-1,1])pillar(s*.29,-.18,1.7+rank*.32+rise,.12,'dark');for(let i=0;i<1+rank;i++)add((i-rank/2)*.23,1.4+rank*.2+rise,.04,.16,.27,.7,'iron','launcher-barrel');add(0,1.85+rank*.32+rise,-.14,.4,.3,.3,'glow','launcher-core');break;
 case 'volcano':
  for(let i=0;i<5;i++)add(0,.4+i*.25,0,.94-i*.14,.28,.9-i*.13,'dark','basalt-cone');add(0,1.57,0,.32,.07,.32,'fire','magma-crater');for(const s of [-1,1])add(s*.13,1.77,0,.08,.35,.1,'fire','magma-spurt');break;
 case 'siege':
  house(-.19,-.12,.43,.66,1.1+rise);add(.2,.65,.09,.32,.4,.58,'iron','artillery');add(.2,.9,.21,.13,.17,.5,'dark','cannon-barrel');for(const s of [-1,1])add(.2+s*.18,.47,.07,.1,.3,.3,'wood','cannon-wheel');add(0,1.85+rise,-.2,.8,.12,.16,'wood','gantry');for(const s of [-1,1])pillar(s*.35,-.2,1.5+rise,.08,'wood');break;
 case 'range':
  house(-.23,-.1,.36,.7,1+rank*.2+rise);for(let i=0;i<2+rank;i++){const z=-.26+i*.22;add(.25,.79,z,.06,.95,.07,'wood','target-post');add(.25,1.31,z,.2,.3,.12,'ivory','target');add(.25,1.31,z+.07,.09,.13,.03,'accent','bullseye');}if(/tower|gunner|amazon/.test(name)){pillar(.26,-.27,2.6+rank*.2,.18);add(.26,2.9+rank*.2,-.27,.4,.16,.42,'accent','range-lookout');}break;
 case 'hut':
  add(0,.72,0,span,.85,.66,'wood','hut');roof(0,1.22,0,span+.13,.8,'accent',3+index%3);add(0,.64,.34,.22,.65,.04,'dark','door');if(/tent/.test(name))for(const s of [-1,1])pillar(s*.32,.25,1.9,.07,'ivory');if(/voodoo|troll/.test(name))add(.32,1.1,-.2,.14,1.4,.16,'ivory','ritual-pole');break;
 case 'village':
  for(let i=0;i<2+Math.min(2,index);i++){const x=(i%2-.5)*.44,z=(Math.floor(i/2)-.5)*.43;house(x,z,.34,.34,.58+(i%2)*.23);}break;
 case 'fortress':
  house(0,-.02,.65,.64,1.3+rise+rank*.15);for(const s of [-1,1]){pillar(s*.32,.28,2.1+rise,.2);add(s*.32,2.62+rise,.28,.3,.18,.3,'accent','battlement');}if(/greater|stronghold/.test(name))add(0,2.75+rise,-.12,.35,.65,.35,'stone','keep');break;
 case 'city':
  for(let i=0;i<3+index%2;i++){const x=(i%2-.5)*.43,z=(Math.floor(i/2)-.5)*.4,h=.9+(i%3)*.4+rank*.2;house(x,z,.37,.36,h);}pillar(0,0,2.7+rise,.12);break;
 case 'hall':
  house(0,-.06,.7,.7,1.05+rise+rank*.15);for(let i=0;i<2+index%3;i++)pillar(-.3+i*.6/(1+index%3),.33,1.7+rise,.08,'ivory');add(0,2.21+rise,.31,.76,.15,.19,'accent','portico');if(/superior|eldest/.test(name))for(const s of [-1,1])pillar(s*.34,-.27,2.8,.12);break;
 case 'academy':
  house(-.13,-.02,.55,.65,1.2+rise);pillar(.27,-.17,2.2+rank*.3+rise,.21);roof(.27,2.7+rank*.3+rise,-.17,.35,.36,'accent',3);add(.27,3.42+rank*.3+rise,-.17,.12,.2,.14,'glow','arcane-tip');if(/supreme|palace|necromancy/.test(name))for(const s of [-1,1])add(s*.33,.83,.3,.13,1.05,.15,'glow','rune-stone');break;
 case 'grove':
  for(const s of [-1,1]){pillar(s*.3,-.1,1.7,.13,'wood');roof(s*.3,2.2,-.1,.4,.45,'accent',3);}ring(0,.12,.24,.36,'ivory',8);add(0,.58,.12,.2,.35,.2,'glow','moonwell');break;
 default:
  add(0,.49,0,.76,.28,.7,'stone','altar');for(const s of [-1,1])pillar(s*.29,-.2,1.5+rise+rank*.25,.13);add(0,1.15+rise,.05,.3,.6,.3,'glow','relic');add(0,1.65+rise,.05,.44,.12,.42,'gold','relic-crown');if(/justice|heroic|destruction/.test(name)){pillar(0,-.3,2.6+rank*.15,.16);add(0,3.08+rank*.15,-.3,.3,.23,.25,'accent','relic-spire');}if(/gjallarhorn/.test(name))add(0,2.1,.1,.65,.25,.23,'ivory','great-horn');
 }
 // Functional details belong to the model itself, so recruitment portraits and
 // world buildings show the same readable support silhouette.
 const raw=b.rawId||key.split('_')[1];
 if(raw==='h010'){add(-.22,2.24,.1,.17,.2,.23,'gold','horn-mouth');add(.2,2.12,.1,.22,.1,.15,'gold','horn-neck');add(.34,2.27,.1,.15,.27,.18,'ivory','horn-bell');}
 else if(raw==='h05G'){for(const side of [-1,1]){add(side*.17,1.67,.25,.1,.42,.12,'gold','heroic-figure');add(side*.17,1.98,.25,.13,.16,.13,'ivory','heroic-head');}}
 else if(raw==='h00N'||raw==='h00M'){for(const side of [-1,1]){add(side*.3,.48,.29,.24,.18,.2,'water','wave-crest');add(side*.38,.67,.29,.11,.3,.14,'glow','wave-tip');}}
 else if(raw==='h00I'){add(0,2.44,0,.14,.19,.14,'glow','conversion-focus');}
 else if(raw==='h05I'){for(let i=0;i<3;i++)add(-.3+i*.21,.39,.32,.18,.17+i*.07,.19,'dark','ruined-masonry');}
 else if(['h01M','h01W','h01X'].includes(raw)){add(0,2.37+rise,0,.2,.28,.2,'dark','void-core');for(const side of [-1,1])add(side*.22,2.37+rise,0,.12,.41,.16,'fire','void-conductor');}
 else if(raw==='h01F'){for(const side of [-1,1])add(side*.24,.38,.13,.11,.08,.42,'fire','magma-channel');}
 else if(raw==='h01E'){for(const side of [-1,1])add(side*.4,1.08,.19,.11,1.4,.14,'dark','destruction-spike');}
 else if(raw==='h059'){add(0,2.82,.13,.7,.08,.09,'gold','justice-beam');for(const side of [-1,1]){add(side*.28,2.56,.13,.03,.48,.03,'iron','scales-chain');add(side*.28,2.31,.13,.23,.08,.23,'gold','scales-pan');}}
 else if(raw==='h00Z'){add(0,2.76,.15,.12,.65,.12,'glow','restoration-sigil');add(0,2.8,.15,.42,.12,.12,'glow','restoration-sigil');}
 else if(raw==='h01Q'){for(const side of [-1,1])add(side*.27,1.1,.34,.16,.8,.12,'glow','decay-vent');}
 else if(raw==='h02N'){add(.19,2.6,.05,.3,.25,.26,'accent','serpent-head');for(const side of [-1,1])add(.19+side*.09,2.41,.17,.04,.18,.04,'ivory','serpent-fang');}
 else if(['h048','h03L'].includes(raw)){for(const side of [-1,1])add(side*.34,1.09,.22,.12,.74,.13,'glow','ice-reservoir');}
 else if(raw==='h03O'){add(0,3.16,0,.24,.5,.24,'glow','world-freezer-core');for(const side of [-1,1]){add(side*.25,3.16,0,.24,.1,.1,'ivory','frost-ray');add(0,3.16,side*.25,.1,.1,.24,'ivory','frost-ray');}}
 else if(raw==='h04T'){add(0,2.2,.12,.63,.31,.21,'ivory','eye-shell');add(0,2.2,.24,.28,.24,.05,'glow','eye-iris');add(0,2.2,.275,.07,.24,.03,'dark','eye-pupil');}
 else if(raw==='h04R'){for(const side of [-1,1])for(let i=0;i<3;i++)add(side*(.33-i*.07),.45+i*.31,.27,.16,.38,.18,i%2?'accent':'wood','tentacle');}
 else if(raw==='h07H'){for(const side of [-1,1])add(side*.3,1.7,.17,.23,.2,.24,'accent','protective-leaves');}
 else if(raw==='h07I'){add(0,3.48,0,.13,.49,.13,'glow','star-ray');add(0,3.48,0,.45,.13,.13,'glow','star-ray');add(0,3.48,0,.13,.13,.42,'glow','star-ray');}
 else if(['h06J','h05R'].includes(raw)){const c=raw==='h05R'?'fire':'glow';for(const side of [-1,1]){add(side*.23,2.64,.16,.13,.35,.12,c,'shield-arc');add(side*.12,2.86,.16,.17,.12,.12,c,'shield-arc');}add(0,2.29,.16,.13,.19,.12,c,'shield-point');}
 // Family siblings gain a visible structural wing, not just a different icon.
 if(index>0&&race!=='mech'&&family!=='treasury'){const side=index%2?1:-1,height=.55+index*.21;add(side*.36,.3+height/2,-.27,.22,height,.24,'stone','expansion-wing');add(side*.36,.35+height,-.27,.29,.13,.3,'accent','expansion-roof');}
 const w=b.footprint?.w||3,d=b.footprint?.d||3,scaled=boxes.map(box=>{const bw=box.w*w,bd=box.d*d;return Object.freeze({...box,x:Math.max(-w/2+bw/2,Math.min(w/2-bw/2,box.x*w)),z:Math.max(-d/2+bd/2,Math.min(d/2-bd/2,box.z*d)),w:bw,d:bd});});
 const spec=Object.freeze({key,name:b.name,race,family,boxes:Object.freeze(scaled),height:Math.max(...scaled.map(a=>a.y+a.h/2)),footprint:Object.freeze({w,d})});specs.set(signature,spec);return spec;
}

let material=null,meshUsers=0;
function makeGeometry(spec){
 const unit=new T.BoxGeometry(1,1,1).toNonIndexed(),p=unit.attributes.position,n=unit.attributes.normal,count=p.count*spec.boxes.length,positions=new Float32Array(count*3),normals=new Float32Array(count*3),colors=new Float32Array(count*3),color=new T.Color();
 let cursor=0;for(const box of spec.boxes){color.setHex(box.color);for(let i=0;i<p.count;i++){positions[cursor]=box.x+p.getX(i)*box.w;normals[cursor]=n.getX(i);colors[cursor++]=color.r;positions[cursor]=box.y+p.getY(i)*box.h;normals[cursor]=n.getY(i);colors[cursor++]=color.g;positions[cursor]=box.z+p.getZ(i)*box.d;normals[cursor]=n.getZ(i);colors[cursor++]=color.b;}}
 unit.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
export function createCastleBuildingArt(key,definition){
 const spec=buildingModelSpec(key,definition);if(!spec)return null;const cacheKey=key+'|'+spec.name+'|'+spec.footprint.w+'|'+spec.footprint.d;let cached=geometryCache.get(cacheKey);if(!cached){cached={geometry:makeGeometry(spec),users:0};geometryCache.set(cacheKey,cached);}cached.users++;meshUsers++;material??=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});const mesh=new T.Mesh(cached.geometry,material);mesh.name='castle-building-'+key;mesh.castShadow=true;mesh.receiveShadow=true;let disposed=false;
 mesh.userData.buildingArt=true;mesh.userData.height=spec.height;mesh.userData.family=spec.family;mesh.userData.dispose=()=>{if(disposed)return;disposed=true;if(--cached.users===0){cached.geometry.dispose();geometryCache.delete(cacheKey);}if(--meshUsers===0){material.dispose();material=null;}};return mesh;
}
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function castleBuildingPortrait(key,definition){
 const spec=buildingModelSpec(key,definition);if(!spec)return '';const cacheKey=key+'|'+spec.name;if(portraits.has(cacheKey))return portraits.get(cacheKey);
 const max=Math.max(spec.footprint.w,spec.footprint.d),scale=67/Math.max(max,spec.height*1.35),project=([x,y,z])=>[64+(x-z)*.77*scale,109+(x+z)*.35*scale-y*scale],faces=[];
 for(const b of spec.boxes){const x0=b.x-b.w/2,x1=b.x+b.w/2,y0=b.y-b.h/2,y1=b.y+b.h/2,z0=b.z-b.d/2,z1=b.z+b.d/2,c=new T.Color(b.color);for(const [points,shade]of [[[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],.83],[[[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],.64],[[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1]])faces.push({depth:b.x+b.z+b.y*.02,points:points.map(p=>project(p).map(v=>v.toFixed(2)).join(',')).join(' '),fill:'#'+c.clone().multiplyScalar(shade).getHexString()});}
 faces.sort((a,b)=>a.depth-b.depth);const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${esc(spec.name)}"><title>${esc(spec.name)}</title>${faces.map(f=>`<polygon points="${f.points}" fill="${f.fill}"/>`).join('')}</svg>`;portraits.set(cacheKey,svg);return svg;
}
