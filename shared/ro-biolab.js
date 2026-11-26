import {roMvpDomainProps} from './ro-mvp-domain.js';
// Enemy identities/spawns: rAthena npc/re/mobs/dungeons/lhz_dun.txt.
// Room layouts and combat budgets are adaptations for this game.
export const RO_BIOLAB_FLOORS=Object.freeze([
 {key:'biolab-1',name:'Laboratório de Somatologia · 1º andar',scene:'geffen',habitat:'biolab',mvp:'tower_1658',style:'biolab',biolabFloor:1,threatProgress:10,recommendedLevel:70,species:['remover','anopheles','metaling','tower_1652','tower_1653','tower_1656'],description:'Setor de contenção: tanques de pesquisa, tubos rompidos e os primeiros experimentos humanos.',landmarks:['Recepção abandonada','Câmaras de contenção','Escadaria do laboratório'],featured:['remover','anopheles','metaling','tower_1652','tower_1653','tower_1656'],transition:'As portas blindadas levam ao setor de experimentos humanos.',adaptation:'Egnigem guarda a passagem nesta expedição; seu MVP original habita o segundo andar.'},
 {key:'biolab-2',name:'Laboratório de Somatologia · 2º andar',scene:'geffen',habitat:'biolab',mvp:'tower_1658',style:'biolab',biolabFloor:2,threatProgress:14,recommendedLevel:95,species:['tower_1652','tower_1653','tower_1654','tower_1655','tower_1656','tower_1657','remover'],description:'Ala dos cobaias: espadachim, gatuna, mercador, noviço, arqueiro e mago lutam em conjunto.',landmarks:['Enfermaria experimental','Sala de autópsia','Câmara de Egnigem'],featured:['tower_1652','tower_1653','tower_1654','tower_1655','tower_1656','tower_1657'],transition:'A última escada desce até os espectros das classes transcendentes.'},
 {key:'biolab-3',name:'Laboratório de Somatologia · 3º andar',scene:'geffen',habitat:'biolab',mvp:'bio_eremes',style:'biolab',biolabFloor:3,threatProgress:18,recommendedLevel:130,species:['tower_1634','tower_1635','tower_1636','tower_1637','tower_1638','tower_1639'],description:'Setor proibido: Seyren, Eremes, Howard, Margaretha, Cecil e Kathryne patrulham as câmaras escuras.',landmarks:['Galeria das memórias','Câmaras dos transcendentes','Cela de Eremes'],featured:['tower_1634','tower_1635','tower_1636','tower_1637','tower_1638','tower_1639'],transition:'A escada de emergência retorna às cobaias do segundo andar.'}
].map(Object.freeze));
export function generateRoBiolab(seed,route){
 const obstacles=[],decorations=roMvpDomainProps(route),objects=[],paths=[...(route.spokes||[]),{from:route.entry,to:{x:0,z:0},width:16}];
 // A central junction and six side rooms, all joined by wide hallways.
 const rooms=[{x:0,z:0,w:76,d:76},...[-66,0,66].flatMap(z=>[-1,1].map(side=>({x:side*69,z,w:38,d:38})))];
 const open=(x,z)=>rooms.some(r=>Math.abs(x-r.x)<r.w/2+4&&Math.abs(z-r.z)<r.d/2+4)||Math.abs(x)<12||Math.abs(z)<10||[-66,66].some(a=>Math.abs(z-a)<8);
 for(let z=-111;z<=111;z+=6)for(let x=-111;x<=111;x+=6){if(open(x,z))continue;obstacles.push({id:'lab-wall:'+x+':'+z,type:'lab-wall',x,z,w:6,d:6,h:96,alive:true});}
 for(const [i,r]of rooms.entries()){
  for(const side of [-1,1]){const x=r.x+side*(r.w/2-7),z=r.z-10,model=(i+route.biolabFloor)%3===0?'tank':'table';decorations.push({id:'lab-prop-'+i+'-'+side,type:'biolab-prop',model,x,z,w:3,d:5,h:5});obstacles.push({id:'lab-solid-'+i+'-'+side,type:'lab-equipment',x,z,w:3,d:5,h:5,alive:true});}
  if(i>0)objects.push({id:'lab-chest-'+i,type:'chest',x:r.x,z:r.z+8,cost:60+route.biolabFloor*20,used:false});
 }
 return {terrainVersion:4,seed,stageKey:'geffen',biome:'void',habitat:'biolab',route,theme:'void',minX:-115,maxX:115,minZ:-115,maxZ:115,width:230,depth:230,spawn:{...route.entry},center:{x:0,z:0},landmarks:[],obstacles,decorations,objects,paths,scaleUnit:'metres',revision:1,enclosed:{style:'biolab',size:6,cellCount:obstacles.filter(o=>o.type==='lab-wall').length}};
}
const identities={1652:{skill:'bash',range:3.5,element:'physical',factor:1.5},1653:{skill:'envenom',range:3,element:'poison',factor:1.2},1654:{skill:'mammonite',range:3.5,element:'physical',factor:1.8},1655:{skill:'heal',range:16},1656:{skill:'doublestrafe',range:15,element:'physical',factor:1.25},1657:{skill:'firebolt',range:14,element:'fire',factor:1.5},1634:{skill:'bowlingbash',range:4,element:'physical',factor:2},1635:{skill:'sonicblow',range:3.5,element:'poison',factor:2},1636:{skill:'hammerfall',range:4,element:'physical',factor:0},1637:{skill:'heal',range:18},1638:{skill:'doublestrafe',range:18,element:'physical',factor:1.6},1639:{skill:'stormgust',range:16,element:'ice',factor:1.7},1647:{skill:'sonicblow',range:4,element:'poison',factor:2.4}};
export function tickRoBiolabEnemy(game,enemy,heroes,{effect,damage}={}){
 if(!game.bonk.map.route?.biolabFloor||!enemy.alive)return;
 const id=enemy.roSourceId,profile=identities[id],now=game.bonk.elapsed;if(!profile||enemy.roSkillStunUntil>now||enemy.roCritStaggerUntil>now)return;
 const cast=enemy.roBiolabCast;
 if(cast){if(now<cast.until)return;delete enemy.roBiolabCast;const target=heroes.find(u=>u.id===cast.target&&u.alive);if(profile.skill==='heal'){const friends=game.units.filter(u=>u.bonkEnemy&&u.alive&&Math.hypot(u.x-enemy.x,u.z-enemy.z)<profile.range).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);const ally=friends[0];if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.12);effect('heal',ally,{source:enemy.id,target:ally.id,duration:.5});}return;}
  if(!target||Math.hypot(target.x-enemy.x,target.z-enemy.z)>profile.range+1)return;
  const area=profile.skill==='stormgust',victims=area?heroes.filter(u=>u.alive&&Math.hypot(u.x-cast.x,u.z-cast.z)<3):[target];
  effect('roAttack',enemy,{source:enemy.id,target:target.id,tx:target.x,tz:target.z,skillKey:profile.skill,roWeaponKey:profile.skill,element:profile.element,duration:.65,range:profile.range,radius:area?3:0,enemy:true});
  for(const v of victims){if((v.bonkJumpHeight||0)>.7)continue;if(profile.factor>0)damage(v,enemy.damage*profile.factor,enemy,profile.element);if(profile.skill==='hammerfall')v.roHitStunUntil=Math.max(v.roHitStunUntil||0,now+.6);}
  return;
 }
 if(now<(enemy.roBiolabReadyAt??3))return;
 const target=heroes.filter(u=>u.alive).sort((a,b)=>Math.hypot(a.x-enemy.x,a.z-enemy.z)-Math.hypot(b.x-enemy.x,b.z-enemy.z))[0];if(!target||Math.hypot(target.x-enemy.x,target.z-enemy.z)>profile.range)return;
 const delay=profile.skill==='stormgust'?1.1:profile.range>8?.8:.5;enemy.roBiolabReadyAt=now+(enemy.bonkEnraged?3.3:5.5);enemy.roBiolabCast={until:now+delay,target:target.id,x:target.x,z:target.z};
 effect('monsterWarning',enemy,{source:enemy.id,target:target.id,skill:profile.skill,skillName:profile.skill==='heal'?'Curar':profile.skill,element:profile.element||'holy',duration:delay});
}
