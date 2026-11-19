// Spatial and art choices for this voxel adaptation; combat data stays intact.
export function castleBuildingProfile(building,unit){
 const name=(unit?.name||'').toLowerCase(),effect=building.castleEffect?.type,tier=building.legendary||/ancient|royal|mighty|king|heavy|adamant|elder|champion/.test(name)?3:building.requiresBuilding?2:1;
 let role='support',label='Santuário',w=2,d=2,variant='orb';
 if(!unit){
  if(effect==='tower'){role='tower';label='Torre defensiva';w=d=1.5;variant='turret';}
  else if(effect==='income'){role='treasury';label='Tesouraria';variant='coins';}
  else if(effect==='heal'){role='healer';label='Templo de cura';w=d=2.5;variant='cross';}
 }else if(/heavy tank|assault tank/.test(name)){
  role='siege';label='Hangar de máquinas pesadas';w=4;d=3.5;variant='cannon';
 }else if(/hydra|magnataur|wandigoo|golem|annihilator|hrimthrusa|royal guard|^infernal$/.test(name)){
  role='giant';label='Viveiro de grandes criaturas';w=4;d=3.5;variant=/golem|annihilator|infernal/.test(name)?'gauntlet':'horns';
 }else if(/tank|machine|shredder|glaive|ballista|catapult|mortar/.test(name)){
  role='siege';label='Oficina de cerco';w=3.5;d=3;variant='cannon';
 }else if(unit.flying){
  role='aviary';label='Viveiro aéreo';w=/drake|dragon|wyrm|wyvern|gryphon/.test(name)?4:3;d=3;variant='wings';
 }else if(/kodo|bear|wolf|felhound|ent\b|treant|hound/.test(name)){
  role='beast';label='Estábulo de bestas';w=d=3;variant='paw';
 }else if(['magic','spells'].includes(unit.attackType)||/sorcer|wizard|warlock|shaman|priest|witch|druid|necromancer|lich|banshee|queen|void/.test(name)){
  role='arcane';label='Escola arcana';w=d=2.5;variant='staff';
 }else if((unit.sourceStats?.range||0)>200||unit.range>1.2){
  role='ranged';label='Quartel de atiradores';w=d=2.5;variant=/sniper|marksman|gunner/.test(name)?'rifle':'bow';
 }else{role='warrior';label='Quartel de guerreiros';w=d=2.5;variant='sword';}
 return {role,label,variant,tier,footprint:{w,d}};
}
