// Co-op companions use the same movement, mana, damage and cooldown rules.
export function roCompanionThink(game,unit){
 if(!unit.roomBot||!unit.alive)return;
 const b=game.bonk;if(b.elapsed<(unit.bonkAiAt||0))return;unit.bonkAiAt=b.elapsed+.28;
 if(unit.bonkOffer?.choices?.length)game.bonkCommand(unit,{type:'bkChoose',choiceId:unit.bonkOffer.choices[0].id});
 const focus=['str','agi','vit','int','dex','luk'].includes(unit.roAiFocus)?unit.roAiFocus:'vit';
 if(unit.attributePoints)game.bonkCommand(unit,{type:'bkAttribute',attribute:focus});
 const humans=game.heroes().filter(u=>u.bonkHero&&!u.bot&&u.alive&&!u.bonkDisconnected),lead=humans.sort((a,c)=>Math.hypot(a.x-unit.x,a.z-unit.z)-Math.hypot(c.x-unit.x,c.z-unit.z))[0];
 if(!lead)return;
 const angle=unit.seat*2.4,target={x:lead.x+Math.sin(angle)*3,z:lead.z+Math.cos(angle)*3},distance=Math.hypot(target.x-unit.x,target.z-unit.z);
 let dx=distance>1?target.x-unit.x:0,dz=distance>1?target.z-unit.z:0;
 for(const e of game.units){if(!e.bonkEnemy||!e.alive)continue;const x=unit.x-e.x,z=unit.z-e.z,d=Math.hypot(x,z);if(d>0&&d<2.7){dx+=x/d*(2.7-d)*3;dz+=z/d*(2.7-d)*3;}}
 unit.bonkMove={dx,dz};unit.bonkMoveAt=b.elapsed;
}
