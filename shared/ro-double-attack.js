// LATAM client TF_DOUBLE description: 7% chance and +1% hit per native rank.
// https://www.divine-pride.net/database/skill/48/LATAM
export const RO_DOUBLE_ATTACK_SKILL=Object.freeze({key:'tf_double',name:'Ataque Duplo',tier:0,skill:'doubleattack',description:'Com adagas, 7% de chance por nível de acertar duas vezes. O golpe duplo ganha +1% de precisão por nível. Com Katar, fortalece o golpe da mão esquerda.',kind:'passive',element:'physical',damage:0,cooldown:0,range:0,manaCost:0,role:'double_attack_passive',sourceId:48,sourceAegis:'TF_DOUBLE',sourceMaxLevel:10,source:'https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml',reference:'https://www.divine-pride.net/database/skill/48/LATAM',mechanics:Object.freeze({proc:Object.freeze({type:'doubleAttack',basicOnly:true})}),sourceJobs:Object.freeze(['Thief']),sourceJob:'Thief'});
export function roDoubleAttack(unit,stats,random=Math.random){
 const learned=Math.max(0,Math.min(10,Math.floor(unit?.bonkBuild?.weapons?.tf_double||0))),granted=Math.max(0,Math.min(10,stats.itemDoubleAttackLevel||0)),rank=Math.max(learned,granted),type=stats.weaponType;
 if(rank&&(type==='dagger'||granted)&&random()<Math.min(.7,rank*.07))return{hits:2,multiplier:2,accuracy:rank*.01,proc:'TF_DOUBLE'};
 if(type==='katar')return{hits:2,multiplier:1+(1+2*learned)/100,accuracy:0,proc:null};
 return{hits:1,multiplier:1,accuracy:0,proc:null};
}
