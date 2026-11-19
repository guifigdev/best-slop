export function overlayPausesGame(state,{shop=false}={}){
 return !(shop&&state?.options?.mode==='linewars'&&state.phase==='wave');
}
export function fountainRecoveryText(hero){
 const values=`Vida ${Math.ceil(hero.hp)} / ${Math.ceil(hero.maxHp)} · Mana ${Math.floor(hero.mana||0)} / ${Math.floor(hero.maxMana||0)}`;
 return (!hero.nearFountain?'Aproxime-se da área da fonte.':hero.fountainHealing||hero.fountainMana?'Fonte recuperando seu herói.':'Vida e mana recuperadas.')+' '+values;
}
