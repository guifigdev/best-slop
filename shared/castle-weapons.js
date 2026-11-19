export function castleWeaponCanTarget(weapon,target){
 const flags=weapon.targets||[];
 return target.castleStructure?flags.includes('structure'):flags.includes(target.flying?'air':'ground');
}
export function castleWeaponFor(unit,target){
 if(Array.isArray(unit.weapons))return unit.weapons.find(w=>castleWeaponCanTarget(w,target))||null;
 if(target.castleStructure)return unit;
 return (target.flying?unit.canHitAir:unit.canHitGround!==false)?unit:null;
}
export function castleTargetSummary(unit){
 const weapons=unit.weapons;
 const air=weapons?weapons.some(w=>w.targets.includes('air')):!!(unit.canHitAir??unit.targetsAir);
 const ground=weapons?weapons.some(w=>w.targets.includes('ground')):unit.canHitGround!==false;
 const structures=weapons?weapons.some(w=>w.targets.includes('structure')):true;
 return [ground?'terrestres':null,air?'voadoras':null,structures?'estruturas':null].filter(Boolean).join(', ')||'sem ataque básico';
}
