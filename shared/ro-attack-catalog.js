// Cosmetic attack timing and shape only. Authoritative damage stays in simulation.
const frozen=v=>Object.freeze(v),profile=(family,duration,tint=0xc8ced2,extra={})=>frozen({family,duration,tint,...extra});
export const RO_ATTACK_FAMILIES=frozen(['blade','dagger','fist','arrow','impact','cast','music','flask']);
export const RO_ATTACK_BUDGET=frozen({active:64,families:8,drawCalls:8,frames:8,frameSize:64,atlasBytes:8*64*64*4,maxAtlasBytes:8*8*64*64*4});
export const RO_ATTACK_LINEAGES=frozen({
 dragonknight:profile('blade',.25),imperialguard:profile('blade',.27,0xc6cdd0,{narrow:.8}),
 archmage:profile('cast',.32,0xc1aee7),elementalmaster:profile('cast',.32,0xa9d9d5),
 windhawk:profile('arrow',.25,0xdcd9c9,{travelSpeed:32}),troubadour:profile('music',.34,0xe5c79f),
 cardinal:profile('impact',.28,0xe9ddac),inquisitor:profile('fist',.23,0xdbd7ca),
 meister:profile('impact',.30,0xc1c9cc),biolo:profile('flask',.34,0xb3d49d,{travelSpeed:17}),
 shadowcross:profile('dagger',.22,0xcbd0d6),abysschaser:profile('dagger',.24,0xb9b2ca)
});
export const RO_ATTACK_SKILLS=frozen({
 bash:profile('blade',.26,0xc6cbd0,{weight:1.12}),bowlingbash:profile('impact',.29),dragonbreath:profile('cast',.34,0xffb879),hackandslasher:profile('blade',.25,0xcbd4d6,{weight:1.18}),
 shieldboomerang:profile('impact',.28),overbrand:profile('blade',.27,0xd1d6d3,{narrow:.75}),crossrain:profile('cast',.34,0xf0e2b7),
 firebolt:profile('cast',.29,0xffb582),coldbolt:profile('cast',.29,0xaddfe9),stormgust:profile('cast',.35,0xb4e1ea),chainlightning:profile('cast',.26,0xe4dd9f),crystalimpact:profile('cast',.35,0xb9e6ec),heavensdrive:profile('impact',.31,0xc0ad89),psychicwave:profile('cast',.34,0xc9b3e8),conflagration:profile('cast',.34,0xffb67c),
 doublestrafe:profile('arrow',.24,0xe3e1d7,{travelSpeed:33}),blitzbeat:profile('arrow',.27,0xb9d6d3,{travelSpeed:32}),arrowstorm:profile('arrow',.28,0xe1e1d6,{travelSpeed:34}),cresivebolt:profile('arrow',.25,0xc5dfd9,{travelSpeed:40}),
 musicalstrike:profile('music',.33,0xebc9a0),severerainstorm:profile('arrow',.28,0xc5dcd8,{travelSpeed:32}),rhythmshooting:profile('music',.36,0xe6d09b),
 holylight:profile('cast',.3,0xf0e5bb),magnusexorcismus:profile('cast',.35,0xeae0b7),judex:profile('cast',.3,0xf0e4bc),adoramus:profile('cast',.35,0xf6edcc),
 fingeroffensive:profile('fist',.26,0xe4dbc3),tigercannon:profile('fist',.27,0xdad6c5),explosionblaster:profile('fist',.29,0xece1c3),
 cartrevolution:profile('impact',.30),hammerfall:profile('impact',.31),axetornado:profile('impact',.29,0xc4cbd0),mightySmash:profile('impact',.31,0xcbd0cf),
 demonstration:profile('flask',.34,0xe1bd90,{travelSpeed:19}),cartcannon:profile('impact',.29,0xd9c0a0),mayhemicthorns:profile('cast',.30,0xc0d79d),
 envenom:profile('dagger',.23,0xbacda4),sonicblow:profile('dagger',.25,0xd6d8dd),rollingcutter:profile('dagger',.27,0xc4c9d0),eternalslash:profile('dagger',.25,0xbeb0d6),backstab:profile('dagger',.23),triangleShot:profile('arrow',.26,0xbba9d1,{travelSpeed:31}),abysssquare:profile('cast',.35,0xb9a8d5)
});
const skillAliases=new Map(Object.keys(RO_ATTACK_SKILLS).map(k=>[k.toLowerCase(),k]));
const JOB_LINEAGES={swordsman:'dragonknight',knight:'dragonknight',runeknight:'dragonknight',dragonknight:'dragonknight',crusader:'imperialguard',royalguard:'imperialguard',imperialguard:'imperialguard',mage:'archmage',wizard:'archmage',warlock:'archmage',archmage:'archmage',sage:'elementalmaster',sorcerer:'elementalmaster',elementalmaster:'elementalmaster',archer:'windhawk',hunter:'windhawk',ranger:'windhawk',windhawk:'windhawk',bard:'troubadour',minstrel:'troubadour',troubadour:'troubadour',acolyte:'cardinal',priest:'cardinal',archbishop:'cardinal',cardinal:'cardinal',monk:'inquisitor',sura:'inquisitor',inquisitor:'inquisitor',merchant:'meister',blacksmith:'meister',mechanic:'meister',meister:'meister',alchemist:'biolo',genetic:'biolo',biolo:'biolo',thief:'shadowcross',assassin:'shadowcross',guillotinecross:'shadowcross',shadowcross:'shadowcross',rogue:'abysschaser',shadowchaser:'abysschaser',abysschaser:'abysschaser'};
const NORDIC=frozen({knight:profile('impact',.28,0xd2d8da),mage:profile('cast',.32,0xbfb2d6),ranger:profile('arrow',.25,0xb4d8df,{travelSpeed:30}),turtle:profile('impact',.29,0xc4cecd),owl:profile('cast',.30,0xe1d6aa),raccoon:profile('dagger',.22,0xc1d3be),fenrir:profile('dagger',.24,0xd4dbdd)});
const ELEMENTS={fire:0xffb783,ice:0xb6e2eb,frost:0xb6e2eb,water:0x9cd9e4,lightning:0xe3dfa1,holy:0xf1e5bb,dark:0xbdacd8,poison:0xbdd49b,earth:0xc1aa88,wind:0xb7d9d1,arcane:0xc2b0e2};
const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function roAttackProfile(event={},unit={}){
 event=event||{};unit=unit||{};
 const skillKey=skillAliases.get(String(event.skillKey||'').toLowerCase()),job=event.roJob||event.bonkJob||unit.bonkJob,lineage=event.roLineage||unit.roLineage||JOB_LINEAGES[job];
 let base=RO_ATTACK_SKILLS[skillKey]||(own(RO_ATTACK_LINEAGES,lineage)?RO_ATTACK_LINEAGES[lineage]:own(NORDIC,event.hero||unit.hero)?NORDIC[event.hero||unit.hero]:null);
 if(!skillKey&&['merchant','acolyte','archer','swordsman','mage','thief'].includes(job)){const families={merchant:'impact',acolyte:'impact',archer:'arrow',swordsman:'blade',mage:'cast',thief:'dagger'};base=profile(families[job],base?.duration||.26,base?.tint||0xc8ced2,job==='archer'?{travelSpeed:32}:{});}
 const element=event.element||'physical',kind=event.attackKind||event.kind||'slash';
 if(!base){const family=kind==='projectile'||kind==='arrow'?'arrow':kind==='cast'||kind==='chain'||element!=='physical'?'cast':/claw|bite|wolf|dagger/.test(event.weapon||unit.kind||'')?'dagger':'blade';base=profile(family,family==='cast'?.32:.26,ELEMENTS[element]||0xc6cbd0);}
 let duration=Number.isFinite(event.duration)?event.duration:base.duration;duration=clamp(duration,skillKey==='bash'?.22:.12,skillKey==='bash'?.30:.6);
 const melee=['blade','dagger','fist','impact'].includes(base.family),range=clamp(Number.isFinite(event.range)?event.range:Number.isFinite(event.radius)?event.radius:Number.isFinite(unit.range)?unit.range:melee?4:24,.5,64),visualRange=melee?range:Math.min(range,base.family==='arrow'?2.8:base.family==='music'?3.4:2.4),tint=skillKey==='bash'?0xc6cbd0:ELEMENTS[element]&&element!=='arcane'?ELEMENTS[element]:base.tint;
 return frozen({...base,key:skillKey||lineage||event.hero||unit.hero||base.family,skillKey:skillKey||null,lineage:own(RO_ATTACK_LINEAGES,lineage)?lineage:null,element,tint,duration,range,visualRange,width:melee?visualRange*2*(base.narrow||1):base.family==='arrow'?.72:base.family==='flask'?1.2:2.5,height:base.family==='blade'||base.family==='impact'?.28:base.family==='dagger'?.55:base.family==='fist'?.8:.95,melee,coneAngle:Math.PI/2,travelSpeed:base.travelSpeed||0});
}
