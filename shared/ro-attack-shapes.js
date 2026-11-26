// Server-owned hit shapes. Cosmetic weapon ribbons never determine damage.
export function roAxeImpact(unit,weapon,stats={},level=1){
 const direction=unit.facing||0,reach=(weapon.key==='basic'?2.6:Math.min(2.6,(weapon.range||4)*.52))*(stats.area||1);
 return{x:unit.x+Math.sin(direction)*reach,z:unit.z+Math.cos(direction)*reach,radius:2.6*(stats.area||1)*(1+Math.max(0,level-1)*.06)};
}
export const roSkillPierces=weapon=>weapon.key!=='basic'&&!(weapon.radius>.5);
export const roShortAreaSkill=weapon=>weapon.key!=='basic'&&weapon.range<=6&&['projectile','chain'].includes(weapon.kind)&&!(weapon.radius>.5);
export const roDebuffAreaSkill=weapon=>weapon.key!=='basic'&&weapon.kind==='projectile'&&['armor_break','blind','silence','weaken','slow','root','stun'].includes(weapon.role);
export function roStrongestTarget(a,b,origin){
 const rank=u=>u.bonkBoss?3:u.bonkGuardian!==undefined?2:u.bonkElite?1:0;
 return rank(b)-rank(a)||(b.maxHp||b.hp||0)-(a.maxHp||a.hp||0)||Math.hypot(a.x-origin.x,a.z-origin.z)-Math.hypot(b.x-origin.x,b.z-origin.z);
}
