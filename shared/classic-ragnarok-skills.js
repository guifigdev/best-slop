import {RO_METEOR_TIMING} from './ro-meteor.js';
export const CLASSIC_RO_MONSTER_SKILLS=Object.freeze({rhino:['ro_bash'],dragon:['ro_meteor'],sphinx:['ro_magnus','ro_sanctuary','ro_magnificat','ro_angelus'],lion:['ro_impositio'],hare:['ro_increaseagi'],chimera:['ro_homunculus'],griffin:['ro_falcon'],valkyrie:['ro_valkyrie']});
export const CLASSIC_RO_AURAS=Object.freeze({ro_increaseagi:'endurance',ro_magnificat:'brilliance',ro_impositio:'packaura',ro_angelus:'devotion'});
export function classicRagnarokSkills(skill){
 const summon=(name,kind,count,hp,damage,range,speed,flying)=>skill(name,'active',190,'self',{summonKind:kind,summonName:name,summonCount:count,summonHp:hp,summonDamage:damage,summonRange:range,summonSpeed:speed,summonFlying:flying,summonDuration:28,mana:100,cooldown:34},'Invoca aliados por 28s. Recebem auras; um novo chamado substitui os anteriores desta habilidade.');
 const list={
  ro_bash:skill('Bash · Golpe fulminante','active',180,'enemy',{damage:[45,65,85,105,125],atkCoefficient:[.4,.5,.6,.7,.8],castRange:3.2,stun:[.7,.9,1.1,1.3,1.5],heroStun:.4,mana:55,cooldown:7},'Golpe físico próximo com corte vertical e atordoamento breve. Escala com ATQ.'),
  ro_meteor:skill('Chuva de Meteoros','active',200,'ground',{damage:[22,30,38,46,54],matkCoefficient:[.15,.2,.25,.3,.35],radius:3.2,pulses:3,duration:2.3,mana:120,cooldown:19},'Grandes pedras em chamas caem do céu sobre a área marcada, em três impactos sucessivos de dano mágico de fogo.'),
  ro_magnus:skill('Magnus Exorcismus','active',200,'self',{damage:[16,22,28,34,40],matkCoefficient:[.12,.16,.2,.24,.28],radius:5,pulses:4,duration:4,mana:110,cooldown:22},'Cria uma área sagrada fixa por 4s, com quatro pulsos de dano mágico contra inimigos.'),
  ro_sanctuary:skill('Sanctuary','active',190,'ground',{heal:[32,45,58,71,84],radius:4.5,pulses:5,duration:5,mana:110,cooldown:23},'Santuário fixo com cinco pulsos de cura para aliados e invocações. Não afeta adversários.'),
  ro_increaseagi:skill('Increase AGI · Aura de agilidade','passive',190,'self',{attackSpeed:[.05,.1,.15,.2,.25],moveSpeed:[.1,.2,.3,.35,.4],radius:9},'Aliados e invocações em 9m ganham velocidade de ataque e movimento. Compartilha o limite com Fôlego de Sleipnir.'),
  ro_magnificat:skill('Magnificat · Aura de mana','passive',190,'self',{manaRegen:[.75,1.5,2.25,3,3.75],radius:9},'Concede regeneração de mana a aliados em 9m. Usa apenas a aura mais forte da mesma família.'),
  ro_impositio:skill('Impositio Manus · Aura de ataque','passive',190,'self',{damageBonus:[.06,.09,.12,.15,.18],radius:9},'Fortalece o dano físico de aliados e invocações em 9m. Compartilha o limite com Uivo da Matilha.'),
  ro_angelus:skill('Angelus · Aura protetora','passive',190,'self',{armor:[1.5,3,4.5,6,7.5],radius:9},'Aumenta a armadura de aliados e invocações em 9m. Usa apenas a aura mais forte da mesma família.'),
  ro_homunculus:summon('Homunculus de apoio','ro_poporing',1,[280,380,480,580,680],[18,26,34,42,50],1.4,4.5,false),
  ro_falcon:summon('Falcões guardiões','raven',2,[130,180,230,280,330],[14,20,26,32,38],5,5.8,true),
  ro_valkyrie:summon('Valquíria invocada','valkyrie',1,[420,560,700,840,980],[24,34,44,54,64],1.7,4.1,false)
 };
 for(const [key,s]of Object.entries(list))Object.assign(s,{allowedArchetypes:['physical_melee','physical_ranged','magic'],weaponRequirement:null,skillStyle:CLASSIC_RO_AURAS[key]?'utility':key==='ro_bash'?'physical':'magic',compatibilityLabel:CLASSIC_RO_AURAS[key]?'Utilidade':'Ragnarok',damageType:key==='ro_bash'?'physical':key==='ro_meteor'||key==='ro_magnus'?'magic':null,source:'https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml',minDungeonFloor:3,balanceNote:'Adaptação para o coliseu, com cinco níveis próprios.'});
 return list;
}
const allies=(g,u,p,r)=>g.units.filter(v=>v.alive&&v.team===u.team&&v.challenge===u.challenge&&Math.hypot(v.x-p.x,v.z-p.z)<=r);
const visual=(g,u,key,p,r,target)=>g.fx('roAttack',p.x,p.z,{source:u.id,target:target?.id,tx:target?.x??p.x,tz:target?.z??p.z,skillKey:key,roJob:'archmage',range:r,radius:r,direction:u.facing||0});
export const classicRagnarokMethods={
 canCastClassicRo(u,key,s,t){if(key==='ro_bash')return !!t&&Math.hypot(t.x-u.x,t.z-u.z)<=s.castRange;if(key==='ro_sanctuary')return true;return true;},
 castClassicRo(u,key,s,c,t){
  if(key==='ro_bash'){u.facing=Math.atan2(t.x-u.x,t.z-u.z);this.hit(t,s.damage+(u.hero?(u.damage||0)*s.atkCoefficient:0),u);if(t.alive&&(t.avatar||0)<=this.time){t.stun=Math.max(t.stun,t.hero?s.heroStun:s.stun);this.cancelChannel(t);}visual(this,u,'bash',u,s.castRange,t);return true;}
  if(!['ro_meteor','ro_magnus','ro_sanctuary'].includes(key))return false;
  this.roClassicEffects=(this.roClassicEffects||[]).filter(e=>!(e.owner===u.id&&e.key===key));if(this.roClassicEffects.length>=32)this.roClassicEffects.shift();
  const meteor=key==='ro_meteor',id=this.id();
  this.roClassicEffects.push({id,owner:u.id,key,s:{...s},x:key==='ro_magnus'?u.x:c.x,z:key==='ro_magnus'?u.z:c.z,next:this.time+(meteor?RO_METEOR_TIMING.fall:0),pulse:0,phase:this.phase,wave:this.wave});
  if(meteor)this.fx('roMeteorFall',c.x,c.z,{source:u.id,skillKey:key,radius:s.radius,duration:RO_METEOR_TIMING.fall,element:'fire',showerId:id+':0'});return true;
 },
 tickClassicRoEffects(){
  this.roClassicEffects=(this.roClassicEffects||[]).filter(e=>{const u=this.units.find(v=>v.id===e.owner);if(!u?.alive||!u.skills.includes(e.key)||this.phase!==e.phase||this.wave!==e.wave)return false;if(this.time<e.next)return true;const s=e.s,p=e;
   if(e.key==='ro_sanctuary'){for(const v of allies(this,u,p,s.radius))this.heal(v,s.heal*(u.magicPower||1),u);visual(this,u,'sanctuary',p,s.radius);}
   else{const meteor=e.key==='ro_meteor',element=meteor?'fire':'holy';for(const v of this.enemies(u).filter(v=>Math.hypot(v.x-p.x,v.z-p.z)<=s.radius))this.hit(v,this.spellDamage(u,s.damage,element,e.key),u,true,false,false,false,element);if(meteor)this.fx('roMeteorImpact',p.x,p.z,{source:u.id,skillKey:e.key,radius:s.radius,duration:.85,element:'fire',showerId:e.id+':'+e.pulse});else visual(this,u,'magnusexorcismus',p,s.radius);}
   e.pulse++;e.next=this.time+(e.key==='ro_meteor'?RO_METEOR_TIMING.classicInterval:1);if(e.key==='ro_meteor'&&e.pulse<s.pulses)this.fx('roMeteorFall',e.x,e.z,{source:u.id,skillKey:e.key,radius:s.radius,duration:RO_METEOR_TIMING.classicInterval,element:'fire',showerId:e.id+':'+e.pulse});return e.pulse<s.pulses;
  });
 }
};
