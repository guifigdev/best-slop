// Original training/mount identities; persistent allied fighters are an explicit
// survivor adaptation. Mount training also exposes a manual riding toggle.
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const source='https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml';
const training=(key,name,tier,id,aegis,max,sourceJobs,companion,damage,interval,description)=>({key,name,tier,sourceId:id,sourceAegis:aegis,sourceMaxLevel:max,sourceJobs,sourceJob:sourceJobs[0],source,adapted:true,kind:['peco','dragon'].includes(companion)||key==='ra_wugrider'?'mount':'passive',role:'companion',skill:'summon',element:'physical',damage,cooldown:0,manaCost:0,range:18,description,mechanics:{companion,interval,radius:companion==='dragon'?1.8:1.1,modifiers:{}}});
export const RO_COMPANION_SKILLS=freeze({
 ht_falcon:training('ht_falcon','Adestrar Falcão',1,127,'HT_FALCON',1,['Hunter'],'falcon',7,1.3,'Mantém um falcão aliado visível que acompanha você e dá rasantes nos inimigos próximos. Passiva: não ocupa espaço de ativa nem gasta SP. Nesta adaptação pode acompanhar o Worg.'),
 ra_wugmastery:training('ra_wugmastery','Adestrar Worg',2,2240,'RA_WUGMASTERY',1,['Ranger'],'worg',11,1.4,'Mantém um Worg aliado que acompanha você e morde inimigos próximos. Aqui o chamado é uma passiva permanente, sem SP ou espaço de ativa; não é uma montaria.'),
 rk_dragontraining:training('rk_dragontraining','Adestrar Dragão',2,2007,'RK_DRAGONTRAINING',5,['Rune_Knight'],'dragon',14,1.7,'Aprender chama seu Ferus e monta automaticamente. Use a habilidade para montar ou desmontar; a pé, ele acompanha você e ataca inimigos próximos.'),
 ra_wugrider:training('ra_wugrider','Montaria em Worg',2,2241,'RA_WUGRIDER',3,['Ranger'],'worg',11,1.4,'Aprender chama seu Worg e monta automaticamente. Use a habilidade para montar ou desmontar; a pé, ele continua como companheiro.'),
 kn_riding:training('kn_riding','Montaria · Peco aliado',1,63,'KN_RIDING',1,['Knight','Crusader'],'peco',8,1.6,'Aprender chama seu Peco Peco e monta automaticamente. Use a habilidade para montar ou desmontar; a pé, ele acompanha você e bica inimigos próximos.'),
});
export const RO_COMPANION_LINEAGE_SKILLS=freeze({dragonknight:{kn_riding:1},imperialguard:{kn_riding:1}});
export const RO_COMPANION_MASTERY=freeze({ht_steelcrow:{companion:'falcon',perLevel:.06},ra_toothofwug:{companion:'worg',perLevel:.06}});
