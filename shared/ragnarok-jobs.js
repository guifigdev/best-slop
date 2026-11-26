import {RO_EQUIPMENT} from './ragnarok-equipment.js';
import {RO_COMPANION_SKILLS,RO_COMPANION_LINEAGE_SKILLS} from './ro-companion-skills.js';
import {RO_DOUBLE_ATTACK_SKILL} from './ro-double-attack.js';
import {localizeRoSkills} from './ro-skill-names-pt.js';
// Class progression follows the original first/second/third/fourth job lines.
// Survivor damage budgets are local; attack identity never comes from loot.
import {RO_NATURE_SKILLS} from './ro-nature-skills.js';
import {roAttributeCost as attributeCost,roAttributePointsForLevel as attributePointsForLevel,roAttributeCap,roAttributeBudget} from './ro-progression.js';
import {RO_EXPANDED_SKILLS,RO_LINEAGE_SKILL_KEYS,RO_LINEAGE_SKILL_TIERS} from './ro-expanded-skills.js';
export {attributeCost,attributePointsForLevel};
const line=(key,hero,focus,jobs,names,weapon,attack,skills,description)=>Object.freeze({key,hero,focus,jobs:Object.freeze(jobs.split(',')),names:Object.freeze(names.split(',')),weapon,attack:Object.freeze(attack),skills:Object.freeze([...new Set([...skills,...(RO_LINEAGE_SKILL_KEYS[key]||[]),...Object.keys(RO_COMPANION_LINEAGE_SKILLS[key]||{})])]),skillTiers:Object.freeze({...RO_LINEAGE_SKILL_TIERS[key],...RO_COMPANION_LINEAGE_SKILLS[key]}),description});
const attack=(kind,element,damage,cooldown,range,extra={})=>({kind,element,damage,cooldown,range,...extra});
export const RO_LINEAGES=Object.freeze(Object.fromEntries([
 line('dragonknight','knight','str','swordsman,knight,runeknight,dragonknight','Espadachim,Cavaleiro,Cavaleiro Rúnico,Cavaleiro Dracônico','Espada',attack('slash','physical',22,.8,5),['bash','bowlingbash','dragonbreath','hackandslasher'],'Espadas, golpes amplos e o sopro dos dragões.'),
 line('imperialguard','turtle','vit','swordsman,crusader,royalguard,imperialguard','Espadachim,Templário,Guardião Real,Guarda Imperial','Lança e escudo',attack('slash','physical',20,.9,5.5),['bash','shieldboomerang','overbrand','crossrain'],'Escudos, lanças e resistência para enfrentar grupos.'),
 line('archmage','mage','int','mage,wizard,warlock,archmage','Mago,Bruxo,Arcano,Arquimago','Cajado',attack('projectile','fire',17,1.65,24,{speed:15}),['fireball','stormgust','chainlightning','crystalimpact'],'Magias elementais, congelamento e tempestades.'),
 line('elementalmaster','owl','int','mage,sage,sorcerer,elementalmaster','Mago,Sábio,Feiticeiro,Mestre Elemental','Livro elemental',attack('projectile','fire',17,1.65,23,{speed:15}),['fireball','heavensdrive','psychicwave','conflagration'],'Combina terra, gelo, fogo e ondas psíquicas.'),
 line('windhawk','ranger','dex','archer,hunter,ranger,windhawk','Arqueiro,Caçador,Sentinela,Falcão do Vento','Arco',attack('projectile','physical',17,.7,28,{speed:32}),['doublestrafe','blitzbeat','arrowstorm','cresivebolt'],'Flechas velozes, falcões e rajadas perfurantes.'),
 line('troubadour','ranger','dex','archer,bard,minstrel,troubadour','Arqueiro,Bardo,Trovador,Trovador Celestial','Arco e instrumento',attack('projectile','physical',16,.75,26,{speed:29}),['doublestrafe','musicalstrike','severerainstorm','rhythmshooting'],'Flechas e ondas musicais que varrem a horda.'),
 line('cardinal','owl','int','acolyte,priest,archbishop,cardinal','Noviço,Sacerdote,Arcebispo,Cardeal','Maça sagrada',attack('slash','holy',23,.9,4.6),['holylight','magnusexorcismus','judex','adoramus'],'Luz sagrada, áreas consagradas e recuperação.'),
 line('inquisitor','knight','str','acolyte,monk,sura,inquisitor','Noviço,Monge,Shura,Inquisidor','Soqueira',attack('slash','physical',16,.52,3.8),['holylight','fingeroffensive','tigercannon','explosionblaster'],'Combos rápidos e explosões de energia espiritual.'),
 line('meister','knight','str','merchant,blacksmith,mechanic,meister','Mercador,Ferreiro,Mecânico,Mestre Ferreiro','Machado',attack('slash','physical',28,1.05,5.2),['cartrevolution','hammerfall','axetornado','mightySmash'],'Carrinhos, martelos e máquinas de combate.'),
 line('biolo','mage','int','merchant,alchemist,genetic,biolo','Mercador,Alquimista,Bioquímico,Biólogo','Frascos e machado',attack('slash','physical',23,.85,4.7),['cartrevolution','demonstration','cartcannon','mayhemicthorns'],'Frascos incendiários, canhões e espinhos vivos.'),
 line('shadowcross','raccoon','agi','thief,assassin,guillotinecross,shadowcross','Gatuno,Mercenário,Sicário,Sicário das Sombras','Adagas duplas',attack('slash','physical',13,.42,3.7),['envenom','sonicblow','rollingcutter','eternalslash'],'Duas armas, veneno, cortes giratórios e críticos.'),
 line('abysschaser','raccoon','dex','thief,rogue,shadowchaser,abysschaser','Gatuno,Arruaceiro,Renegado,Perseguidor do Abismo','Adaga',attack('slash','physical',18,.63,4.2),['envenom','backstab','triangleShot','abysssquare'],'Ataques traiçoeiros, projéteis e áreas sombrias.')
].map(p=>[p.key,p])));
export const roLineage=key=>typeof key==='string'&&Object.hasOwn(RO_LINEAGES,key)?RO_LINEAGES[key]:RO_LINEAGES.dragonknight;
export const roJob=(lineage,tier=0)=>{const p=roLineage(lineage),i=Math.max(0,Math.min(3,Math.floor(tier)||0));return {key:p.jobs[i],name:p.names[i],tier:i,lineage:p.key,next:p.names[i+1]||null};};
const spell=(key,name,tier,skill,description,profile)=>Object.freeze({key,name,tier,skill,description,...profile});
export const RO_SKILLS=localizeRoSkills({...RO_NATURE_SKILLS,...RO_EXPANDED_SKILLS,...RO_COMPANION_SKILLS,mg_lightningbolt:{...RO_EXPANDED_SKILLS.mg_lightningbolt,description:'Relâmpagos atingem o alvo de cima para baixo. A quantidade aumenta com o nível.'},mg_sight:{...RO_EXPANDED_SKILLS.mg_sight,kind:'buff',damage:0,range:0,role:'reveal',description:'Uma chama orbita o personagem por 10 s e revela inimigos escondidos a até 3 m. Não causa dano. Permite usar Supernova.',mechanics:{duration:10,revealRadius:3}},wz_sightrasher:{...RO_EXPANDED_SKILLS.wz_sightrasher,description:'Requer Chama Reveladora ativa. Espalha o fogo ao redor e empurra inimigos comuns. Consome a chama.',mechanics:{knockback:2}},mg_napalmbeat:{...RO_EXPANDED_SKILLS.mg_napalmbeat,range:9,description:'Explosão espiritual sobre o alvo em uma área pequena. O dano é dividido entre os inimigos atingidos.'},ws_meltdown:{...RO_EXPANDED_SKILLS.ws_meltdown,kind:'buff',damage:0,range:0,role:'weapon_enchant',description:'Fortalece os golpes da arma por 15–60 s. Ataques básicos podem quebrar a proteção do inimigo por 5 s; a ativação não causa dano.',mechanics:{duration:60,chance:.1,status:{armorBreak:.25},statusDuration:5}},sm_magnum:{...RO_EXPANDED_SKILLS.sm_magnum,range:2},gc_counterslash:{...RO_EXPANDED_SKILLS.gc_counterslash,range:1,description:'Pancada ao redor do personagem, com uma descarga de energia e fragmentos do chão. A área aumenta nos níveis mais altos.'},gc_crossimpact:{...RO_EXPANDED_SKILLS.gc_crossimpact,range:2.4,description:'Sete cortes concentrados em um único alvo.',mechanics:{...RO_EXPANDED_SKILLS.gc_crossimpact.mechanics,hits:7}},tf_double:RO_DOUBLE_ATTACK_SKILL,tf_detoxify:{...RO_EXPANDED_SKILLS.tf_detoxify,description:'Remove o envenenamento. Não recupera vida nem remove lentidão.',mechanics:{cleanse:'poison'}},...Object.fromEntries([
 spell('bash','Bash',0,'cleave','Golpe concentrado à frente.',attack('slash','physical',35,1.5,6)),
 spell('bowlingbash','Bowling Bash',1,'shockwave','Impacto amplo que abre espaço na horda.',attack('pulse','physical',42,2.8,7)),
 spell('dragonbreath','Dragon Breath',2,'fireball','Sopro ardente com explosão e queimadura.',attack('projectile','fire',40,2.2,25,{speed:19,radius:4.5,pierce:3})),
 spell('hackandslasher','Hack and Slasher',3,'whirlwind','Cortes dracônicos de grande alcance.',attack('slash','physical',75,1.4,9)),
 spell('shieldboomerang','Shield Boomerang',1,'thorns','Escudo arremessado que atravessa e retorna.',attack('projectile','physical',31,1.6,21,{speed:21,pierce:5,returning:true})),
 spell('overbrand','Overbrand',2,'cleave','Varredura de lança contra vários inimigos.',attack('slash','physical',58,1.7,8)),
 spell('crossrain','Cross Rain',3,'holylight','Onda sagrada em torno do guardião.',attack('pulse','holy',80,3,10)),
 spell('firebolt','Fire Bolt',0,'fireball','Lanças de fogo caem do céu sobre o alvo. A quantidade aumenta com o nível.',attack('projectile','fire',18,1.3,25,{speed:23,radius:2.8})),
 spell('coldbolt','Cold Bolt',0,'frostbolt','Lanças de gelo caem do céu sobre o alvo, deixando cristais e vapor frio.',attack('projectile','ice',20,1.3,26,{speed:25,pierce:3})),
 spell('stormgust','Storm Gust',1,'frostnova','Nevasca circular desacelera quem se aproxima.',attack('pulse','ice',29,2.7,8)),
 spell('chainlightning','Chain Lightning',2,'bolt','Corrente elétrica salta entre os alvos.',attack('chain','lightning',24,1.7,24)),
 spell('crystalimpact','Crystal Impact',3,'frostnova','Impacto de gelo de grande área.',attack('pulse','ice',95,3.3,12)),
 spell('heavensdrive','Heaven’s Drive',1,'shockwave','A terra se ergue em uma onda ao redor.',attack('pulse','earth',38,2.5,8)),
 spell('psychicwave','Psychic Wave',2,'shockwave','Onda psíquica ampla contra multidões.',attack('pulse','arcane',55,2.8,10)),
 spell('conflagration','Conflagration',3,'fireball','Explosões elementais grandes e persistentes.',attack('projectile','fire',65,2.5,29,{speed:22,radius:6})),
 spell('doublestrafe','Double Strafe',0,'multishot','Disparos de flecha rápidos e perfurantes.',attack('projectile','physical',18,.9,29,{speed:33,pierce:2})),
 spell('blitzbeat','Blitz Beat',1,'multishot','Rasante do falcão atravessa vários inimigos.',attack('projectile','wind',38,2,26,{speed:32,pierce:8})),
 spell('arrowstorm','Arrow Storm',2,'multishot','Flechas pesadas atravessam toda a formação.',attack('projectile','physical',42,1.5,30,{speed:34,pierce:7})),
 spell('cresivebolt','Cresive Bolt',3,'multishot','Tiro concentrado de alcance extremo.',attack('projectile','wind',88,1.8,36,{speed:40,pierce:12})),
 spell('musicalstrike','Musical Strike',1,'shockwave','Acorde cortante atravessa inimigos.',attack('projectile','physical',31,1.3,26,{speed:25,pierce:4})),
 spell('severerainstorm','Severe Rainstorm',2,'multishot','Rajadas perfurantes de longa distância.',attack('projectile','wind',40,1.25,30,{speed:32,pierce:6})),
 spell('rhythmshooting','Rhythm Shooting',3,'shockwave','Batida poderosa afasta todos ao redor.',attack('pulse','wind',80,2.8,11)),
 spell('holylight','Holy Light',0,'holylight','Luz sagrada atinge de longe.',attack('projectile','holy',23,1.3,24,{speed:24,pierce:2})),
 spell('magnusexorcismus','Magnus Exorcismus',1,'holylight','Área sagrada que atinge a horda.',attack('pulse','holy',35,2.7,9)),
 spell('judex','Judex',2,'holylight','Julgamento sagrado perfura grupos.',attack('projectile','holy',45,1.3,26,{speed:25,pierce:6})),
 spell('adoramus','Adoramus',3,'holylight','Explosão de luz consagrada.',attack('pulse','holy',100,3,12)),
 spell('fingeroffensive','Finger Offensive',1,'multishot','Esferas espirituais atravessam a horda.',attack('projectile','holy',33,1.5,24,{speed:28,pierce:4})),
 spell('tigercannon','Tiger Cannon',2,'shockwave','Explosão espiritual de curto alcance.',attack('pulse','physical',60,2.4,7)),
 spell('explosionblaster','Explosion Blaster',3,'shockwave','Impacto espiritual devastador.',attack('pulse','holy',110,3,10)),
 spell('cartrevolution','Cart Revolution',0,'whirlwind','Giro de carrinho atinge os inimigos próximos.',attack('pulse','physical',29,2.1,6)),
 spell('hammerfall','Hammer Fall',1,'shockwave','Martelada em uma área de 5×5 células. Tenta atordoar inimigos comuns; não causa dano nem empurra.',attack('pulse','physical',0,2.4,2,{mechanics:{noDamage:true,status:{stun:4.5}}})),
 spell('axetornado','Axe Tornado',2,'whirlwind','Gira o corpo e o machado, cortando inimigos próximos em um turbilhão de vento.',attack('pulse','physical',48,1.7,2,{mechanics:{hits:1}})),
 spell('mightySmash','Mighty Smash',3,'shockwave','Golpe mecânico de grande impacto.',attack('pulse','physical',105,2.8,10)),
 spell('demonstration','Demonstration',1,'fireball','Frascos de fogo incendeiam grupos.',attack('projectile','fire',30,1.6,24,{speed:19,radius:3.7})),
 spell('cartcannon','Cart Cannon',2,'fireball','Projéteis explosivos lançados do carrinho.',attack('projectile','fire',45,1.7,28,{speed:28,radius:4.5})),
 spell('mayhemicthorns','Mayhemic Thorns',3,'poison','Espinhos venenosos atravessam a multidão.',attack('projectile','poison',60,1.2,30,{speed:25,pierce:10})),
 spell('envenom','Envenom',0,'poison','Corte envenenado de curto alcance.',attack('slash','poison',25,1.2,5)),
 spell('sonicblow','Sonic Blow',1,'cleave','Sequência veloz de golpes concentrados.',attack('slash','physical',46,1.4,5.5)),
 spell('rollingcutter','Rolling Cutter',2,'whirlwind','Gira o corpo e as lâminas contra inimigos próximos. A área aumenta com o nível.',attack('pulse','physical',44,1.4,1)),
 spell('eternalslash','Eternal Slash',3,'cleave','Corte sombrio de longo arco.',attack('slash','dark',92,1.35,8)),
 spell('backstab','Back Stab',1,'cleave','Punhalada poderosa em arco curto.',attack('slash','physical',48,1.5,5)),
 spell('triangleShot','Triangle Shot',2,'multishot','Projéteis sombrios atravessam a formação.',attack('projectile','dark',43,1.2,28,{speed:31,pierce:5})),
 spell('abysssquare','Abyss Square',3,'shockwave','O abismo explode ao redor do renegado.',attack('pulse','dark',98,3,12))
].map(s=>[s.key,Object.freeze({...RO_EXPANDED_SKILLS[s.key],...s,manaCost:2+(s.tier||0)*2})]))});
export const roSkillTier=(lineage,key)=>roLineage(lineage).skillTiers[key]??RO_SKILLS[key]?.tier??3;
export function roBasicAttack(u){const equipped=RO_EQUIPMENT[u.roInventory?.find(i=>i.id===u.roEquipment?.weapon)?.key],reach={dagger:1.4,katar:1.1,sword:2.1,spear:2.8,axe:2.1,mace:1.7,knuckle:1};const p=roLineage(u.roLineage),tier=Math.max(0,Math.min(3,u.roTier||0));return {key:'basic',name:(p.focus==='int'&&p.jobs[0]==='mage'?'Bola de Fogo':p.key==='shadowcross'&&tier===0?'Adaga':p.weapon)+' · ataque de classe',skill:p.attack.element==='fire'?'fireball':p.attack.kind==='projectile'?'multishot':'cleave',description:['meister','biolo'].includes(p.key)?'Machadada de cima para baixo; o dano e o empurrão vêm do círculo de impacto no chão.':'Ataque característico. Equipamentos alteram os atributos, preservando este ataque.',...p.attack,...(p.attack.kind==='slash'&&!['meister','biolo'].includes(p.key)?{range:reach[equipped?.weaponType]||({shadowcross:1.4,abysschaser:1.4,inquisitor:1,cardinal:1.7}[p.key]||2.1)}:{}),...(['meister','biolo'].includes(p.key)?{mechanics:{knockback:1.7},slam:true}:{}),damage:p.attack.damage*(1+tier*.28),cooldown:p.attack.cooldown};}
export function advanceRoJob(u,tier){const j=roJob(u.roLineage,tier);const previous=u.roTier||0;u.roTier=j.tier;if(previous!==j.tier||!Number.isInteger(u.roJobLevel)){u.roJobLevel=1;u.roJobXp=0;}if(u.roLineage==='shadowcross'&&previous<1&&j.tier>=1&&Array.isArray(u.roInventory)){const item={id:'job-dagger-'+u.id,key:'knife',cards:[]};if(!u.roEquipment.offhand&&!u.roInventory.some(i=>i.id===item.id)){u.roInventory.push(item);u.roEquipment.offhand=item.id;}}u.bonkJob=j.key;u.name=j.name;return j;}
export function initializeRoJob(u,key){const p=roLineage(key);u.roLineage=p.key;u.attributes={str:1,agi:1,vit:5,int:1,dex:5,luk:1,[p.focus]:9};u.roProgressionVersion=2;u.attributePoints=roAttributeBudget(1);for(const value of Object.values(u.attributes))for(let n=1;n<value;n++)u.attributePoints-=attributeCost(n);advanceRoJob(u,0);}
export function spendRoAttribute(u,key){if(!Object.hasOwn(u.attributes||{},key)||!['str','agi','vit','int','dex','luk'].includes(key))return false;const cost=attributeCost(u.attributes[key]);if(u.attributes[key]>=roAttributeCap(u)||u.attributePoints<cost)return false;u.attributes[key]++;u.attributePoints-=cost;return true;}
