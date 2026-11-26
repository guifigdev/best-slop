import {roMvpPressure} from './ro-mvp-pressure.js';
import {roDifficulty} from './ro-difficulty.js';
import {DUNGEON_SPECIES} from './dungeon-catalog.js';
import {MONSTER_HABITATS} from './ragnarok-habitats.js';
import {RO_MONSTER_PROPERTIES} from './ro-monster-properties-data.js';
// Fixed encounter requirements. Levelling or changing gear never buffs enemies.
export function roSurvivorEnemyBudget({key,progress=0,elapsed=0,activity='adventure',difficulty='normal',boss=false,guardian=false,elite=false}={}){
 const mvp=boss?roMvpPressure(key):{hp:1,damage:1,speed:1},preset=roDifficulty(difficulty),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),tower=activity==='tower',region=clamp(Number(progress)||0,0,tower?100:21),species=DUNGEON_SPECIES[key]||{},record=MONSTER_HABITATS[key],source=RO_MONSTER_PROPERTIES[record?.sourceId],threat=Math.max(tower?12+region*1.45:5+region*7,(source?.level||1)*(boss?.7:.45)),role=record?.role,roleScale=role==='heavy'?1.4:role==='swarm'?.8:role==='caster'?.95:1,body=clamp(Math.sqrt(Math.max(.25,species.hp||1))*.55+roleScale*.45,.75,1.7),regionScale=1+region*(tower?.065:.2),base=boss?(tower?4600:4300):guardian?700:elite?350:110;
 const ordinary=!boss&&!guardian;
 return {hp:Math.round(base*(1+threat*(boss?.10:.075))*regionScale*(boss||guardian?1:body)*preset.hp*(boss?1.8:1.25)*mvp.hp*(ordinary?1.4:1)),armor:boss?12+region:guardian?6+region*.5:clamp((species.armor||0)*.5,0,8),level:Math.min(150,Math.round(threat)),damage:(boss?100:guardian?65:elite?50:34)*(1+threat*.035)*(1+region*(tower?.035:.10))*(boss?1.25:1.35)*mvp.damage*(ordinary?1.25:1),speedScale:(1+Math.min(region,10)*.02)*preset.speed*mvp.speed*(ordinary?1.1:1)};
}
