// Spatial and art choices for this voxel adaptation; combat data stays intact.
const supportLabels={h05G:['Santuário de duplicação','mirror'],h010:['Chifre de batalha','horn'],h001:['Artilharia de cerco','cannon'],h00N:['Guardião das marés','wave'],h00M:['Oráculo das sereias','conch'],h00I:['Pirâmide arcana','orb'],h05I:['Ruína de magia caótica','orb'],h01M:['Aniquilador arcano','cannon'],h01W:['Aniquilador arcano','cannon'],h01X:['Aniquilador arcano','cannon'],h01F:['Vulcão de erupções','flame'],h01E:['Santuário de destruição','orb'],h059:['Santuário de justiça','scales'],h00Z:['Cidade de ressurreição','cross'],h01Q:['Cidade de decadência','skull'],h01P:['Pilha de ossos','skull'],h056:['Santuário dos mortos','skull'],h02R:['Totem de bênçãos','totem'],h02N:['Rocha da serpente','fangs'],h047:['Defesa antiaérea glacial','frostcap'],h048:['Lançador glacial','cannon'],h03L:['Lançador glacial maior','cannon'],h03O:['Congelador mundial','snowflake'],h04T:['Olho da corrupção','eye'],h04R:['Santuário de tentáculos','tentacles'],h07H:['Obelisco de proteção','leaves'],h08P:['Clareira restauradora','moonwell'],h07I:['Obelisco de estrelas','star'],h09T:['Usina de energia','power'],h06J:['Gerador de escudo azul','shield'],h05R:['Gerador de escudo vermelho','shield']};
export function castleBuildingProfile(building,unit){
 const name=(unit?.name||'').toLowerCase(),effect=building.castleEffect?.type,tier=building.legendary||/ancient|royal|mighty|king|heavy|adamant|elder|champion/.test(name)?3:building.requiresBuilding?2:1;
 let role='support',label='Santuário',w=2,d=2,variant='orb';
 if(!unit){
  if(effect==='tower'){role='tower';label='Torre defensiva';w=d=1.5;variant='turret';}
  else if(effect==='income'){role='treasury';label='Tesouraria';variant='coins';}
  else if(effect==='heal'){role='healer';label='Templo de cura';w=d=2.5;variant='cross';}
  const support=supportLabels[building.rawId];if(support){label=support[0];variant=support[1];}
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
