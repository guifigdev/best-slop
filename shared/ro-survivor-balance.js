import {DUNGEON_SPECIES} from './dungeon-catalog.js';
import {MONSTER_HABITATS} from './ragnarok-habitats.js';

// Fixed level/region budgets: never scale enemies against equipment or DPS.
// Newly spawned enemies use these values; existing HP never changes on level-up.
export function roSurvivorEnemyBudget({key,level=1,progress=0,elapsed=0,activity='adventure',boss=false,guardian=false,elite=false}={}){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),tower=activity==='tower',lv=clamp(Number(level)||1,1,150),region=clamp(Number(progress)||0,0,tower?99:11),time=clamp(Math.floor((Number(elapsed)||0)/90),0,12),species=DUNGEON_SPECIES[key]||{},role=MONSTER_HABITATS[key]?.role;
 const buildScale=1+(lv-1)*(boss?.085:.065),regionScale=1+region*(tower?.12:.55),timeScale=1+time*.055;
 const roleScale=role==='heavy'?1.65:role==='swarm'?.8:role==='caster'?.95:1;
 const speciesScale=clamp(Math.sqrt(Math.max(.25,species.hp||1))*.65+roleScale*.35,.75,1.85);
 const base=boss?(tower?3400:4800):guardian?1050:elite?650:150;
 return {hp:Math.round(base*buildScale*regionScale*timeScale*(boss||guardian?1:speciesScale)),armor:boss?6+region*.5:guardian?4+region*.4:elite?4:clamp((species.armor||0)*.5,0,8),level:Math.min(150,Math.max(1,Math.round(lv*.8+region*2))),damage:(boss?30:guardian?22:elite?15:9)*(1+region*(tower?.045:.3)+time*.04),speedScale:1+Math.min(tower?10:region,10)*.035};
}
