import {roLineage} from './ragnarok-jobs.js';
// Keep old learned skills loadable; curate only new offers and library learning.
const support=new Set(['sm_endure','al_blessing','al_incagi','al_angelus','mg_safetywall','al_pneuma','pr_kyrie','pr_magnificat','pr_aspersio']);
const redundant=new Set(['attack_buff','mixed_buff','crit_buff','mastery','precision_passive','defense_passive','holy_passive','proc_passive','autospell_passive']);
const nonsurvivor=new Set(['sm_provoke','pr_slowpoison','tf_throwstone','ac_chargearrow','ra_wugrider','nc_license','nc_mainframe','sc_bodypaint','sc_enervation','sc_groomy','sc_ignorance','sc_laziness','sc_unlucky','sc_weakness']);
export function roSkillIsCurated(skill){
 if(!skill||nonsurvivor.has(skill.key))return false;
 if(support.has(skill.key))return true;
 if(skill.kind==='buff')return !!(skill.mechanics?.proc||skill.mechanics?.status);
 if(redundant.has(skill.role))return false;
 return true;
}
export function roSkillIsAvailable(unit,skill){
 if(!roSkillIsCurated(skill))return false;
 return unit?.roSkillMode!=='class'||roLineage(unit.roLineage).skills.includes(skill.key);
}
