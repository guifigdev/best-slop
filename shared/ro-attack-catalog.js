import {RO_SKILLS} from './ragnarok-jobs.js';
// Cosmetic attack timing and shape only. Authoritative damage stays in simulation.
const frozen=v=>Object.freeze(v),profile=(family,duration,tint=0xc8ced2,extra={})=>frozen({family,duration,tint,...extra});
export const RO_ATTACK_FAMILIES=frozen(['blade','dagger','fist','arrow','impact','cast','music','flask']);
export const RO_ATTACK_BUDGET=frozen({active:64,instances:128,families:8,drawCalls:8,frames:12,frameSize:64,atlasBytes:12*64*64*4,maxAtlasBytes:26*12*64*64*4});
export const RO_ATTACK_LINEAGES=frozen({
 dragonknight:profile('blade',0.54,0xffffff,{motion:'overhead',opacity:.94}),imperialguard:profile('blade',0.43,0xc6cdd0,{narrow:.8}),
 archmage:profile('cast',0.51,0xc1aee7),elementalmaster:profile('cast',0.51,0xa9d9d5),
 windhawk:profile('arrow',0.40,0xdcd9c9,{travelSpeed:32}),troubadour:profile('music',0.54,0xe5c79f),
 cardinal:profile('impact',0.45,0xe9ddac),inquisitor:profile('fist',0.37,0xdbd7ca),
 meister:profile('impact',0.48,0xc1c9cc),biolo:profile('flask',0.54,0xb3d49d,{travelSpeed:17}),
 shadowcross:profile('dagger',0.48,0xcbd0d6,{motion:'daggerStreaks',opacity:.82}),abysschaser:profile('dagger',0.50,0xcbd0d6,{motion:'daggerStreaks',opacity:.82})
});
const ORIGINAL_ATTACK_SKILLS=frozen({
 bash:profile('blade',0.60,0xffffff,{motion:'overhead',opacity:1,impactFlash:true}),bowlingbash:profile('blade',0.60,0xffffff,{motion:'overhead',opacity:1,impactFlash:true}),dragonbreath:profile('cast',0.54,0xffb879),hackandslasher:profile('blade',0.40,0xcbd4d6,{weight:1.18}),
 shieldboomerang:profile('impact',0.45),overbrand:profile('blade',0.43,0xd1d6d3,{narrow:.75}),crossrain:profile('cast',0.54,0xf0e2b7),
 firebolt:profile('cast',0.46,0xffb582),coldbolt:profile('cast',0.46,0xaddfe9),stormgust:profile('cast',0.56,0xb4e1ea),chainlightning:profile('cast',0.42,0xe4dd9f),crystalimpact:profile('cast',0.56,0xb9e6ec),heavensdrive:profile('impact',0.50,0xc0ad89),psychicwave:profile('cast',0.54,0xc9b3e8),conflagration:profile('cast',0.54,0xffb67c),
 doublestrafe:profile('arrow',0.38,0xe3e1d7,{travelSpeed:33}),blitzbeat:profile('arrow',0.43,0xb9d6d3,{travelSpeed:32}),arrowstorm:profile('arrow',0.45,0xe1e1d6,{travelSpeed:34}),cresivebolt:profile('arrow',0.40,0xc5dfd9,{travelSpeed:40}),
 musicalstrike:profile('music',0.53,0xebc9a0),severerainstorm:profile('arrow',0.45,0xc5dcd8,{travelSpeed:32}),rhythmshooting:profile('music',0.56,0xe6d09b),
 holylight:profile('cast',0.48,0xf0e5bb),magnusexorcismus:profile('cast',0.56,0xeae0b7),judex:profile('cast',0.48,0xf0e4bc),adoramus:profile('cast',0.56,0xf6edcc),
 fingeroffensive:profile('fist',0.42,0xe4dbc3),tigercannon:profile('fist',0.43,0xdad6c5),explosionblaster:profile('fist',0.46,0xece1c3),
 cartrevolution:profile('impact',0.48),hammerfall:profile('impact',0.50),axetornado:profile('impact',0.46,0xc4cbd0),mightySmash:profile('impact',0.50,0xcbd0cf),
 demonstration:profile('flask',0.54,0xe1bd90,{travelSpeed:19}),cartcannon:profile('impact',0.46,0xd9c0a0),mayhemicthorns:profile('cast',0.48,0xc0d79d),
 envenom:profile('dagger',0.49,0xcbd0d6,{motion:'daggerStreaks',opacity:.82}),sonicblow:profile('dagger',0.40,0xd6d8dd),rollingcutter:profile('dagger',0.43,0xc4c9d0),eternalslash:profile('dagger',0.40,0xbeb0d6),backstab:profile('dagger',0.50,0xcbd0d6,{motion:'daggerStreaks',opacity:.82}),triangleShot:profile('arrow',0.42,0xbba9d1,{travelSpeed:31}),abysssquare:profile('cast',0.56,0xb9a8d5)
});

const JOB_LINEAGES={swordsman:'dragonknight',knight:'dragonknight',runeknight:'dragonknight',dragonknight:'dragonknight',crusader:'imperialguard',royalguard:'imperialguard',imperialguard:'imperialguard',mage:'archmage',wizard:'archmage',warlock:'archmage',archmage:'archmage',sage:'elementalmaster',sorcerer:'elementalmaster',elementalmaster:'elementalmaster',archer:'windhawk',hunter:'windhawk',ranger:'windhawk',windhawk:'windhawk',bard:'troubadour',minstrel:'troubadour',troubadour:'troubadour',acolyte:'cardinal',priest:'cardinal',archbishop:'cardinal',cardinal:'cardinal',monk:'inquisitor',sura:'inquisitor',inquisitor:'inquisitor',merchant:'meister',blacksmith:'meister',mechanic:'meister',meister:'meister',alchemist:'biolo',genetic:'biolo',biolo:'biolo',thief:'shadowcross',assassin:'shadowcross',guillotinecross:'shadowcross',shadowcross:'shadowcross',rogue:'abysschaser',shadowchaser:'abysschaser',abysschaser:'abysschaser'};
const NORDIC=frozen({knight:profile('impact',0.45,0xd2d8da),mage:profile('cast',0.51,0xbfb2d6),ranger:profile('arrow',0.40,0xb4d8df,{travelSpeed:30}),turtle:profile('impact',0.46,0xc4cecd),owl:profile('cast',0.48,0xe1d6aa),raccoon:profile('dagger',0.48,0xffffff,{motion:'daggerStreaks',opacity:.94}),fenrir:profile('dagger',0.38,0xd4dbdd)});
const ELEMENTS={fire:0xffb783,ice:0xb6e2eb,frost:0xb6e2eb,water:0x9cd9e4,lightning:0xe3dfa1,holy:0xf1e5bb,dark:0xbdacd8,poison:0xbdd49b,earth:0xc1aa88,wind:0xb7d9d1,arcane:0xc2b0e2};

const elementMotion=element=>({fire:'fireorb',ice:'icecrystal',frost:'icecrystal',water:'icecrystal',lightning:'lightning',holy:'holy',earth:'earth',poison:'poison',dark:'dark',wind:'rune',arcane:'rune'})[element]||'rune';
const modernProfile=skill=>{
 const m=skill.mechanics||{},element=skill.element||'physical',tint=ELEMENTS[element]||0xc8ced2,kind=skill.kind;
 if(kind==='heal')return profile('cast',.72,0xbce7a5,{motion:'heal',plane:'vertical',stationary:true,centered:true,utility:true,opacity:.86});
 if(kind==='buff')return profile('cast',.72,m.shieldPercent||m.modifiers?.damageReduction?0x9bdfce:0xf0d7a1,{motion:m.shieldPercent||m.modifiers?.armor||m.modifiers?.damageReduction?'shield':'rune',plane:'vertical',stationary:true,centered:true,utility:true,opacity:.8});
 if(kind==='zone')return profile('cast',.70,tint,{motion:element==='fire'?'firefield':element==='ice'||element==='water'?'icefield':'runezone',anchor:'target',stationary:true,centered:true,utility:true,opacity:.8});
 if(kind==='summon')return profile('cast',.72,tint,{motion:'summon',stationary:true,centered:true,utility:true,opacity:.82});
 if(kind==='passive')return profile('cast',.48,tint,{motion:'rune',stationary:true,centered:true,utility:true});
 if(skill.key==='lg_earthdrive')return profile('cast',.8,0xb89d7b,{motion:'earth',stationary:true,centered:true,utility:true,opacity:0});
 const original=ORIGINAL_ATTACK_SKILLS[skill.key];
 if(original&&original.family!=='cast')return original;
 if(element!=='physical'&&element!=='wind'||kind==='chain')return profile('cast',.52,tint,{motion:elementMotion(element),plane:kind==='projectile'?'vertical':'ground',travelSpeed:kind==='projectile'?Math.min(28,skill.speed||22):0,centered:kind!=='projectile',opacity:.86});
 if(original)return original;
 if(kind==='projectile')return profile('arrow',.43,tint,{travelSpeed:Math.min(40,skill.speed||29)});
 return profile(kind==='pulse'?'impact':'blade',.48,tint,{autoFamily:kind==='slash'||kind==='dash'});
};
export const RO_ATTACK_SKILLS=frozen(Object.fromEntries(Object.values(RO_SKILLS).map(skill=>[skill.key,modernProfile(skill)])));
const skillAliases=new Map(Object.keys(RO_ATTACK_SKILLS).map(k=>[k.toLowerCase(),k]));
const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function roAttackProfile(event={},unit={}){
 event=event||{};unit=unit||{};
 const skillKey=skillAliases.get(String(event.skillKey||'').toLowerCase()),job=event.roJob||event.bonkJob||unit.bonkJob,lineage=event.roLineage||unit.roLineage||JOB_LINEAGES[job];
 let base=RO_ATTACK_SKILLS[skillKey]||(own(RO_ATTACK_LINEAGES,lineage)?RO_ATTACK_LINEAGES[lineage]:own(NORDIC,event.hero||unit.hero)?NORDIC[event.hero||unit.hero]:null);
 if(!skillKey&&['merchant','acolyte','archer','swordsman','mage','thief'].includes(job)){const families={merchant:'impact',acolyte:'impact',archer:'arrow',swordsman:'blade',mage:'cast',thief:'dagger'};base=profile(families[job],base?.duration||.26,base?.tint||0xc8ced2,job==='archer'?{travelSpeed:32}:job==='swordsman'?{motion:'overhead',opacity:.94}:job==='thief'?{motion:'daggerStreaks',opacity:.82}:{});}
 if(!skillKey&&['meister','biolo'].includes(lineage))base=profile('impact',.68,0xffffff,{motion:'axeSlam',plane:'vertical',opacity:1,forwardOffset:1.1});
 if(base&&['blade','dagger','impact','fist'].includes(base.family)&&base.motion!=='axeSlam'&&(!skillKey||['slash','dash'].includes(RO_SKILLS[skillKey]?.kind))&&(lineage||skillKey))base=profile('blade',.60,0xffffff,{motion:'overhead',opacity:1,impactFlash:!!skillKey});
 const definition=RO_SKILLS[skillKey],element=event.element||definition?.element||'physical',kind=event.attackKind||event.kind||definition?.kind||'slash';
 if(event.bonk===true&&event.type!=='roAttack'&&!base?.utility&&['fireball','frostnova','poison','bolt'].includes(event.type)){const motion=event.type==='fireball'?'firefield':event.type==='frostnova'?'icefield':event.type==='poison'?'poison':'lightning';base=profile('cast',.55,ELEMENTS[event.type==='fireball'?'fire':event.type==='frostnova'?'ice':event.type==='poison'?'poison':'lightning'],{motion,stationary:true,centered:true,opacity:.8});}
 if(base?.autoFamily&&lineage&&RO_ATTACK_LINEAGES[lineage])base={...RO_ATTACK_LINEAGES[lineage],duration:base.duration};
 if((!skillKey||definition?.kind==='projectile')&&['cast','chain','projectile'].includes(kind)&&element!=='physical'&&(!skillKey||!ORIGINAL_ATTACK_SKILLS[skillKey]||base.family==='cast'))base={...base,family:'cast',motion:elementMotion(element),plane:kind==='projectile'?'vertical':'ground',travelSpeed:kind==='projectile'?Math.min(28,event.speed||definition?.speed||22):0,opacity:.86};
 if(!base){const family=kind==='projectile'||kind==='arrow'?'arrow':kind==='cast'||kind==='chain'||element!=='physical'?'cast':/claw|bite|wolf|dagger/.test(event.weapon||unit.kind||'')?'dagger':'blade';base=profile(family,family==='cast'?.32:.26,ELEMENTS[element]||0xc6cbd0);}
 const overhead=base.motion==='overhead',daggers=base.motion==='daggerStreaks';let duration=Number.isFinite(event.duration)?event.duration:base.duration;duration=clamp(duration,overhead?.50:daggers?.44:.30,overhead?.72:base.motion==='axeSlam'?.72:daggers?.60:base.utility?.85:.65);
 const melee=['blade','dagger','fist','impact'].includes(base.family),range=clamp(Number.isFinite(event.range)?event.range:Number.isFinite(event.radius)?event.radius:Number.isFinite(unit.range)?unit.range:melee?4:24,.5,64),visualRange=definition?.kind==='zone'?clamp((event.radius||definition.mechanics?.radius||definition.radius||3)*2,2,18):overhead?Math.min(range,2.8):daggers?Math.min(range,2.3):melee?range:Math.min(range,base.family==='arrow'?4.0:base.family==='music'?4.4:3.8),tint=overhead||daggers?0xffffff:ELEMENTS[element]&&element!=='arcane'?ELEMENTS[element]:base.tint;
 return frozen({...base,key:skillKey||lineage||event.hero||unit.hero||base.family,skillKey:skillKey||null,lineage:own(RO_ATTACK_LINEAGES,lineage)?lineage:null,element,tint,duration,range,visualRange,width:base.motion==='axeSlam'?3.8:definition?.kind==='zone'?visualRange:overhead?3.8:daggers?2.7:melee?visualRange*2*(base.narrow||1):base.family==='arrow'?1.6:base.family==='flask'?2.4:base.plane==='vertical'?base.utility?2.8:1.8:3.8,plane:overhead||daggers||base.family==='flask'?'vertical':base.plane||'ground',sweepAngle:overhead?Math.PI*2/3:0,verticalHeight:base.motion==='axeSlam'?4.5:overhead?4.3:daggers?3:base.family==='flask'?2.6:base.plane==='vertical'?base.utility?2.8:2.4:0,forwardOffset:base.forwardOffset||(overhead?.45:0),opacity:base.opacity??1,height:base.motion==='axeSlam'?.12:overhead?.20:base.plane==='vertical'?.35:base.family==='blade'||base.family==='impact'?1.15:base.family==='dagger'?1.1:base.family==='fist'?1.25:1.35,melee,coneAngle:Math.PI/2,travelSpeed:base.travelSpeed||0});
}
