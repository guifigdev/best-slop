import {PHASE_KILLER_SKILLS,PHASE_KILLER_ITEMS} from '../shared/phase-killer-catalog.js';
import {PHASE_KILLER_SKILL_ILLUSTRATIONS,PHASE_KILLER_ITEM_ILLUSTRATIONS} from './phase-killer-art.js';
import {FENRIR_SKILL_ILLUSTRATIONS as packArt} from './fenrir-art.js';
import {KODO_TAG_SKILLS} from '../shared/kodo-tag-catalog.js';
import {SKILLS,ITEMS} from '../shared/catalog.js';
import {WARLOCK_SKILLS,WARLOCK_ITEMS,WARLOCK_MASTERIES} from '../shared/warlock-catalog.js';
import {TREE_TAG_SKILLS,TREE_TAG_ITEMS,TREE_TAG_WORKER_SKILLS} from '../shared/tree-tag-catalog.js';
import {CASTLE_ITEMS} from '../shared/castle-catalog.js';

// Original miniature paintings made from angular SVG shapes. The central
// picture describes an action or object; it is never a hashed decoration used
// to disguise a missing illustration. No Warcraft textures are imported.
const palettes={
 fire:['#482d2d','#f6c783','#da7750','#ffe5a7'],
 ice:['#263d4c','#b7e1e2','#6eacbe','#e4f1de'],
 storm:['#293849','#ded6aa','#799db9','#fff0b3'],
 nature:['#30453b','#d1dfaf','#83aa78','#f0e8bb'],
 death:['#393246','#dabdd8','#a47ba8','#eee1c6'],
 steel:['#35464a','#d7ddce','#8eacaf','#f2dfac'],
 gold:['#483e32','#e4ce96','#b99959','#fff0be'],
 arcane:['#323850','#cdc6e4','#9299c6','#f2e6bb'],
 blood:['#4b303b','#e3b4a4','#ba7780','#ffe0b0']
};
const P=(d,c='light',extra='')=>`<path d="${d}" fill="${c}" ${extra}/>`;
const L=(d,c='light',w=3)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter"/>`;
const R=(x,y,w,h,c='light')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const C=(x,y,r,c='light')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const G=(content,x=0,y=0,s=1,angle=0)=>`<g transform="translate(${x} ${y}) scale(${s}) rotate(${angle} 32 32)">${content}</g>`;
const ray=(x,y,s=1)=>G(P('m31 6-15 29h14l-6 23 24-32H34l9-20z'),x,y,s);
const spark=(x,y,s=1)=>G(P('m32 8 5 17 15 7-15 6-5 17-6-17-15-6 15-7z'),x,y,s);
const arrow=(angle=0)=>G(L('M11 49 47 13','shade',6)+L('M11 49 47 13','light',3)+P('m37 10 17-1-1 17z','bright')+L('m12 35 13 1 1 13','accent',3),0,0,1,angle);
const sword=(angle=0)=>G(P('m27 39 5-32 8 1 2 32-8 7z','light')+P('m32 7 8 1-6 36-4-4z','bright')+R(19,39,29,5,'accent')+R(29,44,9,12,'shade')+R(27,55,13,4,'accent'),0,0,1,angle);
const axe=()=>P('m28 20 22-10 8 19-18 10-12-10z','light')+P('m42 12 8-2 8 19-8 4z','bright')+L('M34 27 16 55','accent',8)+L('M22 44 28 48','shade',3);
const hammer=()=>P('m12 13 33-6 12 14-6 15-34 5L7 28z','light')+P('m12 13 33-6 6 12-34 7L7 28z','bright')+P('m17 26 34-7v17l-34 5z','accent')+P('m29 39 10-2-8 23-9-4z','shade')+L('M27 47 34 49','bright',2);
const shield=()=>P('m13 11 19-6 20 6v27L32 59 13 38z','accent')+P('m18 15 14-5 15 5v21L32 51 18 36z','light')+P('m32 10 15 5v21L32 51z','shade')+R(29,15,6,30,'bright')+R(21,26,23,6,'bright');
const flame=()=>P('m32 4 7 17 9-9 7 21-3 15-20 13-21-13-3-16 11-16 1 17z','accent')+P('m32 19 5 16 7-6 3 13-15 14-13-13 7-17 1 14z','light')+P('m32 35 7 11-7 8-7-8z','bright');
const orb=()=>P('m20 12 22-2 14 15-3 21-19 12-21-10-7-20z','shade')+P('m21 17 17-2 13 13-4 17-16 8-15-9-4-15z','accent')+P('m21 17 17-2-11 16-15-2z','light')+P('m27 31 11-16 13 13-4 17-16 8z','bright');
const boltOrb=()=>G(orb(),4,6,.78)+G(ray(0,0),-1,-1,.6);
const snow=()=>L('M32 7v50M10 19l44 26M10 45l44-26','light',4)+L('m25 11 7 7 7-7m-14 42 7-7 7 7M11 27l10-1-1-10m23 32 1-10 10-1M11 37l10 1-1 10m23-32 1 10 10 1','accent',3)+P('m32 24 8 8-8 8-8-8z','bright');
const crystal=()=>P('m32 5 18 17-4 25-14 13-15-13-4-25z','accent')+P('m32 5-4 25 4 30-15-13-4-25z','light')+P('m32 5 18 17-22 8z','bright')+L('m28 30 18 17','shade',2);
const skull=()=>P('m15 11 16-6 18 7 7 19-8 13-1 11H19V44L8 31z','light')+P('m32 7 17 5 7 19-8 13-1 11H32z','accent')+P('m16 25 13 4-2 10-11-2zm33 0-13 4 2 10 11-2z','shade')+P('m32 35 5 9H27z','shade')+L('M25 48v9m7-9v9m7-9v9','shade',3);
const heart=()=>P('m32 19 8-9 13 3 6 13-4 14-23 20L9 40 5 26l7-13 12-3z','accent')+P('m32 19-8-9-12 3-7 13 4 14 23 20z','light')+L('m14 30 9 1 5-8 8 17 5-9h9','bright',3);
const book=()=>P('m9 12 20-3 3 5 4-5 20 3v43l-21-3-3 5-4-5-19 3z','accent')+P('m14 16 14-2v34l-14 2zm23-2 14 2v34l-14-2z','light')+R(30,15,5,39,'shade')+L('m17 24 8-1m-8 8 8-1m15-8 8 1m-8 7 8 1','bright',2);
const boot=()=>P('M20 9h23v26l12 9v12H11V40l9-8z','accent')+P('M24 13h14v23l-13 8H15v-3l9-8z','light')+R(11,51,44,6,'shade')+L('M26 22h10m-10 6h10m-10 6h8','bright',3);
const footprint=()=>P('m21 26 12 4 2 17-9 10-11-5-2-13z','light')+R(16,13,7,10,'accent')+R(26,16,7,10,'accent')+R(10,21,6,8,'accent')+R(33,23,6,7,'accent');
const potion=()=>R(24,6,17,7,'accent')+P('M25 14h15v11l11 12v19H13V37l12-12z','light')+P('M17 38h30v14H17z','accent')+L('M22 43h7m7 5h7','bright',3)+R(29,16,5,15,'bright');
const cup=()=>P('M15 17h35l-5 19-13 10-12-10z','accent')+P('m15 17 17-7 18 7-18 7z','bright')+P('M24 23h8v17l-8-7z','light')+R(29,44,7,10,'light')+R(20,54,25,5,'accent');
const wing=()=>P('m8 42 7-24 18-9 17 2-13 8-5 7 15-7-8 11-13 6 13-2-10 10-14 4-9 10z','light')+L('m15 42 12-12','accent',3);
const eye=()=>P('m5 32 13-15 14-5 15 5 13 15-13 15-15 5-14-5z','light')+P('m5 32 13-15 14-5 15 5 13 15-13 6-15 4-14-4z','accent')+C(32,32,12,'shade')+P('m32 21 5 11-5 11-5-11z','bright')+R(35,23,4,4,'light');
const horn=()=>P('m10 16 15-5 3 12 14 8 16-1-9 16-19 6-14-12z','accent')+P('m10 16 15-5 3 12-14 9z','bright')+P('m17 30 13 15 19-5-7 6-12 6-14-12z','light')+L('m26 24-8 6m16 0-8 9','shade',3);
const raven=()=>P('m13 13 19 7 16-13-2 18 15 7-17 5-5 16-8-10-16 10 5-22-14-6 18-1z','shade')+P('m32 20 16-13-2 18 15 7-17 5z','light')+P('m20 31 12 9 7 13-8-10-16 10z','accent')+R(42,23,4,4,'bright');
const wolf=()=>P('m10 8 17 13 10-2L54 7l-2 31-20 21-21-21z','accent')+P('m10 8 17 13-13 9zm44-1-17 12 14 11z','bright')+P('m18 36 14 8 14-8-14 23z','light')+P('m24 28 5 2-1 5-6-3zm16 0-5 2 1 5 6-3z','shade')+P('m27 41 10 0-5 7z','shade');
const cat=()=>P('m10 10 17 12h11l16-12-3 29-19 20-20-20z','light')+P('m10 10 17 12-12 7zm44 0-16 12 12 7z','accent')+P('m20 29 9 3-3 5-7-3zm24 0-9 3 3 5 7-3z','shade')+P('m28 42 8 0-4 5z','accent')+L('m22 43-14-3m14 8-14 2m34-7 14-3m-14 8 14 2','bright',2);
const goat=()=>P('m17 22 15-6 15 6 5 21-20 17-20-17z','light')+L('m20 25-10-7V6l11 5m23 14 10-7V6l-11 5','accent',6)+P('m23 33 7 3-5 3-5-3zm18 0-7 3 5 3 5-3z','shade')+P('m27 46 10 0-5 14z','accent');
const fist=()=>P('m13 31 5-17 8 1 5-7 8 3 7 10 7 2 2 19-13 15-20 1-13-17z','accent')+P('m18 14 8 1 5-7 8 3 7 10-3 14-19 5-11-9z','light')+L('M25 17v15m8-18v18m8-12v11','shade',3)+P('m24 40 19-5-1 16-15 6z','bright');
const helmet=()=>P('m15 23 8-15h18l9 15v24l-9 9H23l-9-9z','accent')+P('m23 8 9 0v45l-9 3-9-9 1-24z','light')+R(16,27,33,9,'shade')+R(29,20,7,29,'bright');
const clock=()=>C(32,34,22,'accent')+C(32,34,16,'shade')+R(26,5,12,9,'light')+L('M32 20v15l11 7','bright',4)+L('M17 15 12 10m35 5 5-5','light',4);
const chain=()=>L('m10 48 8-10m5-5 8-10m5-5 10-9','shade',10)+L('m10 48 8-10m5-5 8-10m5-5 10-9','light',5)+L('m32 42 6 10 11 1 7-10-3-9','accent',7);
const ring=()=>P('m14 17 13-7 20 7 8 16-9 18-18 6-16-13-4-14z','accent')+P('m21 23 11-5 11 6 4 11-8 11-10 2-11-10z','shade')+P('m27 10 5-7 8 4 7 10-15 5-10-7z','bright');
const cloak=()=>P('m23 8 9 8 9-8 8 15 9 32-19-6-7 7-9-7-17 6 8-32z','accent')+P('m23 8 9 8-9 33-17 6 8-32z','light')+P('m32 16 9-8 8 15 9 32-19-6z','shade')+C(32,20,4,'bright');
const staff=()=>L('M23 57 34 18','shade',8)+L('M25 57 36 18','accent',3)+P('m25 16 9-12 16 6-3 14-18 6z','light')+P('m34 4 16 6-3 14-10-5z','bright');
const bow=()=>L('M17 8 42 16 50 32 42 49 17 57','accent',6)+L('M17 8 28 32 17 57','light',2)+L('M12 32h39','bright',3)+P('m46 25 12 7-12 7z','bright');
const tree=()=>R(28,34,9,22,'accent')+P('m32 6 15 12-6 4 14 14-12 0 11 9H9l12-9H9l14-14-6-4z','light')+L('m32 43-12 12m16-12 10 12','shade',3);
const cloud=()=>P('m9 45-5-11 6-8 9-1 3-13 16-5 10 10 2 9 10 5-2 14-12 6H20z','accent')+P('m10 26 9-1 3-13 16-5-4 14-14 11-14 7-2-5z','light')+L('M19 48v8m13-6v9m12-11v8','bright',3);
const swirl=()=>L('m52 17-15-9-18 4L8 29l6 18 18 9 17-7 7-16-8-14-14-3-10 9 1 14 10 7 10-8-3-10-9-2-4 7','accent',7)+L('m52 17-15-9-18 4L8 29','light',3)+C(35,33,4,'bright');
const wall=()=>P('m7 25 13-10 14 6 13-10 11 7v34L44 59 30 53 18 58 7 50z','light')+P('m20 15 14 6v32l-16 5z','accent')+P('m47 11 11 7v34l-14 7z','accent')+L('M8 37 20 29 34 34 47 26 57 31','bright',3);
const net=()=>L('m9 15 43-5 6 40-46 8zM9 15l49 35M10 30l33 24M23 12l33 23M11 45l36-34M18 57l36-31M34 56l22-18','light',3)+C(10,15,4,'accent')+C(52,10,4,'bright');
const explosion=()=>P('m31 4 7 17 17-9-5 17 11 6-16 6 7 17-17-8-8 12-5-16-18 1 12-14-9-14 17 4z','accent')+P('m32 18 5 10 11-3-7 10 5 9-12-3-6 9-1-12-10-5 12-4z','bright');
const arrows=()=>G(arrow(),-4,5,.6)+G(arrow(),14,0,.63)+G(arrow(),3,-8,.66);
const badge=(glyph,small,x=33,y=32,scale=.43)=>glyph+G(small,x,y,scale);

// Per-key compositions are intentionally explicit: related abilities can share
// material language while still depicting their different targeting/mechanics.
const survivalSkills={
 doubleattack:['steel',G(sword(-32),-5,-1,.75)+G(sword(-32),18,9,.75)],
 violentforce:['blood',fist()+L('m7 17 5 6m41-17 7 4M8 48l4-3','bright',3)],
 hurricane:['storm',swirl()+G(sword(-45),13,12,.57)],
 manabreak:['arcane',crystal()+P('m37 3-15 27 11 6-13 26 29-32-13-6 11-21z','shade')],
 bolt:['storm',hammer()+G(ray(0,0),-5,23,.51)],
 stomp:['gold',G(boot(),5,-6,.8)+L('m6 51 13-5 13 5 15-5 12 6','bright',4)],
 heal:['nature',cup()+G(tree(),5,-5,.65)],
 chain:['storm',L('m7 18 14 15 16-13 17 18','accent',8)+L('m7 18 14 15 16-13 17 18','bright',3)+C(7,18,5,'light')+C(54,38,5,'light')],
 blizzard:['ice',G(snow(),2,-1,.85)+L('m12 45-4 11m18-7-3 10m22-13-3 11','accent',3)],
 summon:['nature',G(wolf(),-1,8,.67)+G(wolf(),23,-2,.68)],
 multishot:['steel',arrows()],
 avatar:['gold',shield()+G(sword(),22,-3,.45)],
 critical:['blood',G(axe(),0,5,.88)+G(explosion(),-3,-3,.45)],
 vampiric:['death',badge(heart(),wolf(),32,1,.44)],
 endurance:['nature',G(boot(),0,1,.85)+L('M6 22h13M3 32h15M5 43h10','bright',4)],
 thorns:['nature',tree()+L('m14 35-6-9m14 2-8-9m29 15 8-10m-13-2 8-10','bright',4)],
 shockwave:['gold',L('M5 46 15 35 23 44 34 24 43 37 58 20','light',6)+L('M9 55h46','accent',3)],
 bash:['storm',G(hammer(),-3,1,.84)+G(spark(0,0),24,26,.5)],
 devotion:['steel',G(shield(),2,1,.91)+L('m5 21 3-10m48 0 3 10M8 52l4 6m40-6-4 6','accent',3)],
 brilliance:['arcane',cup()+G(eye(),12,-1,.62)],
 fireball:['fire',G(flame(),13,3,.76)+L('m4 15 14 9M4 29l12 5M8 43l9-1','light',4)],
 frostnova:['ice',G(snow(),12,12,.64)+L('m9 26-5 6 5 6m46-12 5 6-5 6M26 9l6-5 6 5m-12 46 6 5 6-5','light',4)],
 dash:['nature',G(footprint(),11,-4,.9)+L('m5 25 17 5M4 38l17 3M6 50h13','accent',5)],
 evasion:['nature',G(cloak(),8,4,.76)+L('m4 22 13 6M3 38h13m-9 14 11-7','light',3)],
 cleave:['steel',G(axe(),0,0,.85)+L('m7 16 9-9 16-2 15 6 10 15','bright',5)],
 bounce:['gold',G(arrow(),-5,-3,.6)+G(arrow(80),23,9,.55)+L('m6 52 25-17 24 17','bright',3)],
 blink:['arcane',L('M12 54V22L32 7l20 15v32M20 54V26l12-9 12 9v28','accent',5)+G(footprint(),17,17,.5)],
 swap:['arcane',L('m7 20h42l-8-8m8 8-8 8M57 45H15l8-8m-8 8 8 8','light',5)+G(orb(),11,12,.42)],
 icewall:['ice',wall()+G(snow(),16,15,.47)],
 forcepush:['storm',L('M7 18h23l-6-8m6 8-6 8M5 33h43l-8-8m8 8-8 8M7 49h23l-6-8m6 8-6 8','light',5)],
 hook:['steel',chain()+P('m38 29 15-6 8 14-7 15-12 1-7-9 7-3 5 4 7-8-9-4z','accent')],
 gravity:['death',swirl()+P('m18 12-8-3-2 9 8-2zm30 37 9 3 1-9-8 1z','bright')],
 poison:['nature',G(wolf(),2,-1,.9)+P('m26 41 4 1-3 13-5-1zm12 0 4-1 4 13-5 1z','bright')],
 drain:['death',G(heart(),-2,2,.52)+G(heart(),28,20,.5)+L('m18 46 24-23m-3-6 5 5-1 8','light',4)],
 shield:['arcane',cloak()+G(shield(),15,18,.5)],
 flamebreath:['fire',P('m9 27 15-12 12 9-2 14-15 8-10-7z','shade')+G(flame(),31,-4,.64)+L('m24 29 12-6m-12 12 15 4','bright',4)],
 venomcloud:['nature',cloud()+G(skull(),22,16,.5)],
 stormdive:['storm',G(wing(),-1,-3,.63)+G(wing(),28,-3,.63)+G(sword(20),15,16,.65)],
 stonehide:['steel',wall()+G(shield(),13,17,.55)],
 battlecry:['gold',horn()+L('m48 14 8-6m-3 12 8-1M33 8l1-6','bright',3)],
 hornrush:['gold',G(goat(),9,2,.85)+L('m3 23 14 4m-14 13h12m-9 12 12-5','accent',4)],
 warlockfire:['fire',G(orb(),10,2,.83)+G(flame(),7,-5,.65)],
 warlockfrost:['ice',G(orb(),7,4,.86)+G(snow(),5,1,.65)],
 rage:['blood',G(fist(),6,7,.77)+G(flame(),-1,-3,.48)+L('M8 48 5 55m46-12 6 5','bright',4)],
 odinsravens:['arcane',G(raven(),-1,10,.65)+G(raven(),23,-3,.65)],
 thorsgoats:['storm',G(goat(),-1,10,.65)+G(goat(),23,-3,.65)+G(ray(0,0),17,22,.4)],
 freyjascat:['nature',cat()+G(spark(0,0),26,29,.4)],
 helguard:['death',G(skull(),11,0,.68)+G(shield(),-2,25,.61)],
 gungnir:['gold',G(arrow(-10),2,-2,1)+L('m4 44 19-11m-13 22 20-11','accent',3)],
 thorsjudgment:['storm',G(hammer(),16,18,.65)+ray(-3,-9,.71)+G(explosion(),3,31,.48)],
 freyjasgrace:['nature',G(heart(),12,12,.65)+G(wing(),-7,-6,.69)+G(wing(),34,-5,.55)],
 helsfrost:['death',snow()+G(skull(),18,16,.48)],
 firesteps:['fire',G(footprint(),-1,4,.68)+G(footprint(),23,-6,.68)+G(flame(),24,29,.43)],
 froststeps:['ice',G(footprint(),-1,4,.68)+G(footprint(),23,-6,.68)+G(snow(),24,29,.43)],
 auraflame:['fire',G(heart(),9,12,.72)+G(flame(),8,-4,.76)],
 icepulse:['ice',G(crystal(),17,16,.48)+L('m16 14-9 9v18l9 9m32-36 9 9v18l-9 9M23 7h18M23 57h18','light',4)]
};
const survivalItems={
 vitality:['gold',P('M8 19h48v30H8z','accent')+P('M8 25h48v17H8z','shade')+R(24,17,19,35,'light')+R(29,23,9,22,'shade')+R(29,32,20,5,'bright')],
 blade:['steel',P('m14 54 3-27 10-16 4 3-4 27-6 15zm16 3 1-31L43 8l5 3-9 30-3 17zm16-5 5-25 9-9 3 3-9 29z','light')],
 mana:['arcane',crystal()],armor:['steel',ring()],mask:['death',skull()],
 talisman:['gold',P('m17 10 15 7 15-7-4 22-11 28-13-28z','accent')+G(raven(),15,14,.5)+L('m14 7 4 11m32-11-4 11','light',3)],
 gloves:['gold',G(fist(),-6,8,.7)+G(fist(),25,-1,.57)],
 crown:['gold',P('m8 16 13 13L32 7l11 22 13-13-5 35H13z','light')+R(13,44,38,9,'accent')+P('m32 28 7 9-7 8-7-8z','bright')],
 staff:['arcane',staff()],bow:['ice',bow()],boots:['nature',boot()],
 charm:['arcane',P('m14 12 18-7 18 7-3 28-15 20-16-20z','accent')+P('m19 16 13-6 12 6-2 22-10 14-11-14z','light')+L('M27 21v20m0-17 11 7-11 7m11-17v20','shade',3)],
 shell:['nature',P('m14 15 18-8 18 10 8 19-14 18-17 4L9 43 6 27z','accent')+L('m14 15 13 12 23-10M6 27l21 0v18l17 9M9 43l18 2-4 13m4-13 23-28','light',3)],
 ember:['fire',G(ring(),5,4,.83)+G(flame(),12,11,.63)],
 scarf:['ice',cloak()+G(snow(),19,22,.43)],
 solar:['fire',G(sword(-30),2,2,.92)+G(flame(),22,-1,.53)],
 stormcoil:['storm',L('M22 10v45m21-45v45','accent',5)+L('m15 17 34 0-34 9h34l-34 9h34l-34 9h34','light',4)+G(ray(0,0),23,24,.45)],
 mirror:['steel',shield()+P('m23 21 8-5 13 6-6 19-7 5-9-14z','light')+L('m27 22 10 14m-11-5 7 10','bright',2)],
 restoration:['gold',P('m19 20 13-9 14 9 3 22 8 9H8l9-9z','light')+R(26,5,13,9,'accent')+R(27,51,11,8,'accent')+L('M31 24v18m-7-9h15','shade',3)],
 potion:['nature',potion()+L('M32 37v12m-6-6h12','bright',3)],
 manapot:['arcane',potion()+G(crystal(),23,29,.3)],
 xpbook:['gold',book()+G(spark(0,0),17,17,.48)],
 epicbook:['arcane',book()+G(raven(),15,16,.5)]
};
for(const [key,item]of Object.entries(ITEMS))if(item.attributeTome){
 const {attribute,amount}=item.attributeTome,palette=({str:'blood',int:'arcane',dex:'nature',luk:'gold',vit:'steel',agi:'storm'})[attribute];
 const emblem=({str:fist(),int:crystal(),dex:bow(),luk:spark(0,0),vit:shield(),agi:boot()})[attribute];
 survivalItems[key]=[palette,book()+G(emblem,19,17,.42)+R(35,45,24,15,'shade')+`<text x="47" y="56" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="bright">${amount}</text>`];
}
Object.assign(survivalItems,{
 runesword:['steel',sword(-25)+L('m34 16-8 6 8 6-8 6','accent',3)],
 thunderaxe:['storm',G(hammer(),-2,5,.85)+G(ray(0,0),24,0,.5)],
 ravenspear:['steel',L('m13 57 29-42','accent',6)+P('m42 5 12 19-22 1z','light')+G(raven(),-6,11,.48)],
 seidrwand:['arcane',staff()+G(crystal(),29,1,.42)],
 moonbow:['ice',bow()+P('M16 7a12 12 0 1 0 9 19A13 13 0 0 1 16 7','bright')],
 helblade:['death',G(sword(-35),8,12,.72)+G(skull(),-1,-5,.5)],
 runemail:['steel',P('m15 11 11-6h12l12 6 9 15-11 7-6-7v32H22V26l-6 7-11-7z','accent')+L('M26 16v35m12-35v35M22 28h20M22 40h20','light',3)]
});

const warlockSkills={
 fireball:['fire',G(flame(),14,4,.75)+L('m6 13 11 10M3 29l13 5M7 46l11-2','bright',4)],
 lightning:['storm',ray(0,0)+C(15,45,5,'accent')],
 homing:['arcane',L('m10 45-3-14 7-15 19-7 16 8','accent',6)+P('m41 9 17 13-18 9z','light')+G(eye(),13,19,.54)],
 boomerang:['gold',P('m8 19 19-12 30 32-8 14-21-27-12 11z','light')+P('m8 19 19-12 1 19-12 11z','accent')+L('m7 46 7 8 14 2','bright',3)],
 arc:['arcane',L('m7 46 4-24 13-12 17 3 14 18','accent',8)+L('m7 46 4-24 13-12 17 3 14 18','bright',3)+G(orb(),33,23,.43)],
 teleport:['arcane',L('M9 53V25L30 8l21 17v28M17 53V29L30 18l13 11v24','light',4)+G(footprint(),21,21,.48)],
 thrust:['steel',G(arrow(0),7,-3,.9)+L('m4 37 16-4M4 49l15-7','accent',5)],
 swap:['arcane',G(orb(),-4,-2,.52)+G(orb(),33,32,.45)+L('m34 13 17 4-1 13m-23 19L9 45l2-14','light',4)],
 drain:['blood',G(heart(),-4,20,.5)+G(skull(),32,-1,.49)+L('m19 38 24-16m-11 0 11 0-2 11','light',4)],
 spray:['fire',P('m7 25 11-6 8 13-8 13L7 39z','shade')+G(flame(),20,-7,.49)+G(flame(),33,14,.48)+G(flame(),20,32,.44)],
 bouncer:['arcane',L('m8 48 14-30 17 30 16-30','accent',5)+G(orb(),35,-5,.43)+L('M6 53h52','light',3)],
 meteor:['fire',G(orb(),-2,29,.6)+P('m30 30 15-25 4 20 12-3-15 23z','light')+G(flame(),23,-6,.62)],
 splitter:['arcane',L('M9 53 32 30 32 7M32 30 55 53','accent',7)+G(orb(),18,-8,.38)+G(orb(),-8,39,.38)+G(orb(),39,39,.38)],
 windwalk:['nature',G(footprint(),15,8,.75)+L('M5 17h25M3 30h22M5 43h16','light',4)+G(cloud(),25,-5,.48)],
 repeater:['storm',G(arrow(),-4,27,.48)+G(arrow(),9,11,.48)+G(arrow(),23,-5,.48)],
 burst:['fire',explosion()+L('M32 22v16m-8-8h16','shade',4)+C(32,30,5,'bright')],
 shield:['steel',shield()+L('m8 18-4 9m52-9 4 9','light',3)],
 timeshift:['arcane',clock()+L('m7 30-3 13 12 8m-5-12 5 12 10-9','bright',3)],
 rush:['storm',G(footprint(),22,-1,.75)+P('m7 20 14 11-14 12h10l13-12-13-11z','light')],
 mirror:['arcane',G(shield(),-5,6,.7)+G(shield(),28,-3,.63)+L('M31 9v47','bright',2)],
 vector:['storm',L('M11 49V15m0 34h39m-39 0 35-34','accent',4)+P('m4 21 7-15 7 15zm40 21 14 7-14 7zm-8-31 20-6-6 20z','light')],
 dome:['arcane',P('M7 45V34L17 17 32 9l15 8 10 17v11z','accent')+L('M7 45h50M32 10 21 33v12m11-35 11 23v12M9 30h46','light',3)+C(32,41,5,'bright')],
 disable:['death',L('M12 13h40v42H12zM22 14v40m10-40v40m10-40v40','light',4)+G(orb(),19,20,.4)],
 gravity:['death',swirl()+G(orb(),-5,29,.4)+G(orb(),40,-5,.33)],
 link:['blood',G(heart(),-5,4,.55)+G(heart(),30,26,.55)+L('m19 35 7-7 10 10 9-9','bright',4)],
 control:['death',P('m15 20 8-10 10 2 3 12 10-4 9 11-9 14-17 2-18-9z','light')+L('M18 13 8 5m25 7 6-8m11 20 10-5M17 49l-6 11m25-12 5 12','accent',3)],
 scourge:['blood',L('m13 13 15 13-8 14 19 3 12-13','light',6)+P('m9 8 12 2-8 11zm37 17 13-2-6 13z','accent')+G(explosion(),21,29,.43)],
 bane:['death',G(skull(),5,7,.81)+L('M8 10 55 55','accent',6)+G(spark(0,0),34,-3,.4)],
 ritual:['death',L('m32 8 22 40H10zM9 48l23 10 23-10M20 29h24','accent',4)+G(skull(),20,21,.42)],
 redemption:['nature',G(heart(),12,20,.65)+G(wing(),-7,-5,.64)+G(wing(),30,-5,.64)+G(spark(0,0),18,-3,.4)]
};
const warlockItems={
 boots:['nature',G(boot(),5,1,.91)+L('M4 19h15M3 32h13','bright',3)],
 pendant:['arcane',L('M12 8 18 31 32 43 46 31 52 8','accent',4)+G(crystal(),17,21,.48)],
 cape:['nature',cloak()+L('m17 35 6-8m23 14-7-10','bright',2)],
 helmet:['steel',helmet()],staff:['fire',staff()+G(flame(),24,-5,.45)],
 jordan:['arcane',ring()+G(crystal(),21,-3,.42)],
 blood_sword:['blood',sword(-25)+G(heart(),29,29,.44)],
 aegis:['gold',shield()+G(spark(0,0),14,18,.51)],
 lava_treads:['fire',G(boot(),4,-4,.78)+G(flame(),-6,32,.45)+G(flame(),32,30,.45)],
 watch:['gold',clock()+L('M10 50 4 56m51-6 5 6','bright',3)],
 cursed_pendant:['death',L('M13 8 21 31 32 43 45 31 51 8','accent',4)+G(skull(),16,23,.5)],
 warden:['steel',G(helmet(),17,-2,.63)+G(shield(),-4,24,.61)],
 mask:['death',skull()+L('m9 12-5-5m50 5 5-5M14 50l-5 6m39-6 5 6','accent',3)],
 scroll:['fire',P('M13 10h35l6 9-4 5v29H16V22l-7-2z','light')+L('M17 15h27M20 47h23','accent',3)+G(flame(),17,18,.48)]
};
const masteries={
 duration:['gold',clock()+G(spark(0,0),34,30,.4)],
 range:['storm',bow()+L('M5 10h13m27 44h14','bright',3)],
 lifesteal:['blood',heart()+G(sword(35),25,20,.48)],
 jack:['arcane',G(clock(),-6,-5,.55)+G(bow(),30,0,.5)+G(heart(),13,31,.49)]
};
const treeSkills={
 destroyTrees:['nature',G(tree(),20,2,.72)+G(axe(),-4,20,.7)],
 blink:['nature',L('M10 53V25L32 6l22 19v28','accent',5)+G(tree(),17,15,.52)],
 ungrow:['nature',G(tree(),4,0,.86)+P('m9 42 13 0-6 10z','bright')+L('M15 27v18','bright',4)],
 trueSight:['gold',eye()+G(spark(0,0),36,-4,.4)],
 infernalDestroy:['fire',G(tree(),19,2,.72)+G(fist(),-6,22,.65)],
 ensnare:['nature',net()+G(footprint(),14,18,.5)],
 speedFlames:['fire',G(footprint(),13,-2,.74)+G(flame(),-6,24,.56)+L('M4 19h15M3 31h12','light',3)],
 scout:['death',G(eye(),2,23,.8)+G(wing(),-6,-5,.58)+G(wing(),31,-5,.56)],
 fireSwarm:['fire',G(flame(),-7,18,.49)+G(flame(),17,-8,.49)+G(flame(),35,27,.49)],
 elemental:['fire',G(fist(),2,14,.87)+G(flame(),9,-8,.72)],
 lightningTrap:['storm',P('m6 46 26-14 26 14-26 14z','accent')+L('m12 44 20-11 20 11M32 33v22','light',3)+G(ray(0,0),17,-6,.61)],
 nuclear:['fire',C(32,34,24,'accent')+C(32,34,18,'shade')+P('m30 17-8 15h20l-8-15zm-17 22 18 1-9 15zm37 0-18 1 9 15z','bright')+C(32,35,4,'light')],
 shockwave:['gold',L('m5 45 11-9 8 7 10-22 11 13 13-12','light',5)+L('M8 55h48','accent',3)+G(tree(),-6,-9,.41)],
 immolation:['fire',G(flame(),4,2,.87)+G(shield(),15,23,.49)],
 avatar:['fire',G(helmet(),9,16,.72)+G(flame(),7,-7,.76)],
 attributeBonus:['gold',P('m32 7 22 13v25L32 58 10 45V20z','accent')+L('M32 18v29M18 32h28','bright',6)+G(spark(0,0),33,34,.31)]
};
const treeItems={
 I000:['nature',P('M26 22h12v36H26z','accent')+G(eye(),10,-4,.7)+L('M18 57h28','light',3)],
 I001:['blood',G(fist(),-5,9,.7)+G(fist(),25,-1,.57)+G(flame(),18,33,.4)],
 I002:['arcane',cloak()+G(crystal(),21,21,.43)],
 I003:['fire',shield()+G(flame(),17,17,.48)],
 I004:['death',axe()+G(skull(),-2,23,.47)],
 I005:['fire',P('M25 24h13v11l11 9-6 14H20l-7-14 12-9z','accent')+R(24,21,16,5,'bright')+G(cloud(),13,-8,.62)+R(25,43,15,7,'light')],
 I006:['arcane',G(orb(),7,0,.8)+P('m19 47 13-5 13 5 6 11H13z','accent')],
 I00B:['gold',crystal()+G(eye(),17,24,.47)],
 I00D:['fire',P('m13 17 19-10 18 13 5 23-21 17-23-16z','shade')+L('m32 8-4 18 9 12-3 20m-6-32-14-7m23 19 17-11','light',4)+G(flame(),28,-6,.49)]
};
const castleItems={
 explode_mine:['fire',P('m12 25 20-8 20 8v24l-20 10-20-10z','shade')+L('M20 18V9h24v9','accent',4)+G(explosion(),15,18,.51)],
 tech_tent:['steel',P('m32 8 26 45H6z','accent')+P('m32 8 10 45H21z','light')+P('m32 32 8 21H24z','shade')+G(hammer(),-5,30,.43)],
 bassline:['arcane',R(12,9,40,48,'accent')+R(16,14,32,38,'shade')+C(32,36,13,'light')+C(32,36,7,'accent')+R(22,17,20,5,'light')+L('M5 26v18m54-18v18','bright',3)],
 nuke_launcher:['fire',P('m12 41 12-7 21 0 9 14-10 10H16z','shade')+P('m22 29 17-22 12 4-9 26z','accent')+P('m39 7 12 4 3 11-12-5z','light')+L('M14 39 7 28m10 8-4-13','bright',3)],
 repair_rune:['nature',G(crystal(),6,3,.83)+G(hammer(),18,18,.56)],
 double_damage:['blood',G(sword(-25),-5,0,.76)+G(sword(-25),20,8,.76)],
 quad_damage:['blood',G(sword(-30),-7,-5,.58)+G(sword(-30),18,-5,.58)+G(sword(-30),-7,28,.58)+G(sword(-30),18,28,.58)],
 chain_orb:['storm',G(orb(),9,8,.78)+G(ray(0,0),2,-4,.68)+L('m6 49 9-4m36-36 8-4','accent',3)],
 stone_scroll:['steel',P('M13 10h35l6 9-4 5v29H16V22l-7-2z','light')+G(shield(),18,18,.48)+L('M18 15h26','accent',3)],
 cheese:['gold',P('m8 30 26-20 23 18v25H8z','light')+P('m8 30 26-20 23 18-24 7z','bright')+P('m33 35 24-7v25H33z','accent')+C(20,40,5,'accent')+C(43,23,4,'accent')+C(44,43,4,'shade')+C(14,51,3,'accent')],
 bass_drums:['gold',P('m11 18 21-7 22 7v30l-22 10-21-10z','accent')+P('m11 18 21-7 22 7-22 9z','light')+L('M11 19 32 50 54 19M11 48 32 28l22 20','shade',3)+L('M10 7 48 31M54 7 18 31','bright',4)],
 greater_blast_staff:['storm',G(staff(),1,3,.91)+G(ray(0,0),24,-4,.51)+G(spark(0,0),-4,32,.4)],
 blast_staff:['arcane',staff()+G(orb(),20,-1,.45)],
 gold_pickup:['gold',P('m8 40 14-8 14 8v14H8zm23-15 14-8 14 8v26H31z','accent')+P('m8 40 14-8 14 8-14 7zm23-15 14-8 14 8-14 7z','bright')+L('M8 48h27M32 36h26m-26 8h26','light',3)]
};
const castleAbilities={
 blink:['arcane',L('M12 53V25L32 7l20 18v28','light',5)+G(boot(),19,19,.47)],
 cancel:['blood',G(hammer(),-5,16,.64)+L('M15 13 51 49M51 13 15 49','bright',7)],
 repair:['nature',G(hammer(),-3,7,.85)+L('M45 36v20m-10-10h20','bright',5)],
 rescue:['storm',G(explosion(),3,20,.87)+ray(7,-8,.72)]
};

const registry=new Map(),cache=new Map();
const normalize=game=>['survival','campaign','best','tower','war','linewars','customhero','hero'].includes(game)?'survival':game==='treeTag'||game==='tree_tag'?'treetag':game==='castleFight'||game==='castle_fight'?'castlefight':game;
function register(game,kind,catalog,drawings){for(const [key,definition]of Object.entries(catalog)){const drawing=drawings[key];if(!drawing)throw Error(`Missing illustration: ${game}/${kind}/${key}`);const [palette,paths]=drawing;registry.set(`${game}/${kind}/${key}`,Object.freeze({game,kind,key,name:definition.name||key,palette,paths}));}}
Object.assign(survivalSkills,{fenrirfang:packArt.fenrirFang,scarabs:packArt.scarabSwarm,packaura:packArt.packAura,runicbarrier:packArt.runicBarrier,spiritward:packArt.spiritWard,weakeninghowl:packArt.weakeningHowl,lifeaura:['nature',L('M32 54V18m0 19L16 25m16 18 17-15','accent',5)+P('m32 17-7-9 7-5 7 5z','bright')+P('m15 21-8 3 8 11 9-3z','light')+P('m50 24 8 5-9 11-9-5z','light')]});
register('phasekiller','skill',PHASE_KILLER_SKILLS,PHASE_KILLER_SKILL_ILLUSTRATIONS);register('phasekiller','item',PHASE_KILLER_ITEMS,PHASE_KILLER_ITEM_ILLUSTRATIONS);
register('survival','skill',SKILLS,survivalSkills);register('survival','item',ITEMS,survivalItems);
register('warlock','skill',WARLOCK_SKILLS,Object.fromEntries(Object.entries(WARLOCK_SKILLS).map(([key,s])=>[key,warlockSkills[s.family]])));
register('warlock','item',WARLOCK_ITEMS,warlockItems);register('warlock','mastery',WARLOCK_MASTERIES,masteries);
register('treetag','skill',TREE_TAG_SKILLS,treeSkills);
register('treetag','skill',TREE_TAG_WORKER_SKILLS,{regrow:['nature',tree()+G(spark(0,0),25,-4,.45)],detonate:['arcane',orb()+G(explosion(),-5,18,.65)]});
register('kodotag','skill',KODO_TAG_SKILLS,{harvest:['gold',L('M19 56 40 16','accent',8)+P('m18 17 17-9 23 12-6 11-16-9-13 7z','light')+R(8,44,9,9,'bright')+R(45,39,11,11,'accent')]});register('treetag','item',TREE_TAG_ITEMS,treeItems);
register('castlefight','item',CASTLE_ITEMS,castleItems);register('castlefight','skill',Object.fromEntries(Object.keys(castleAbilities).map(k=>[k,{name:k}])),castleAbilities);
export function gameIllustrationSpec(game,kind,key){return registry.get(`${normalize(game)}/${kind}/${key}`)||null;}
export function illustrationCatalog(){return Array.from(registry.values());}
export function gameIllustration(game,kind,key){
 const spec=gameIllustrationSpec(game,kind,key);if(!spec)return '';const id=`${spec.game}/${kind}/${key}`;if(cache.has(id))return cache.get(id);
 const [bg,light,accent,bright]=palettes[spec.palette],colors={light,accent,bright,shade:bg};
 const picture=spec.paths.replace(/(?:fill|stroke)="(light|accent|bright|shade)"/g,(match,color)=>match.replace(color,colors[color]));
 const svg=`<svg viewBox="0 0 64 64" aria-hidden="true" class="technique-illustration game-illustration" data-illustration="${id}"><rect width="64" height="64" rx="8" fill="${bg}"/><path d="M5 6h54v18L5 42z" fill="${light}" opacity=".06"/><path d="m5 53 27-9 27 9-27 9z" fill="${accent}" opacity=".13"/><g class="illustration-subject">${picture}</g><path d="M8 3h48l5 5v48l-5 5H8l-5-5V8z" fill="none" stroke="${light}" stroke-opacity=".34"/><path d="M9 4h45M4 10v40" fill="none" stroke="${bright}" stroke-opacity=".15"/></svg>`;cache.set(id,svg);return svg;
}
