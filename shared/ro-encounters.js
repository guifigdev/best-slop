import {MONSTER_HABITATS,RO_HABITATS,habitatSpecies} from './ragnarok-habitats.js';

export const RO_STAGE_HABITATS=Object.freeze({grove:Object.freeze(['meadow','forest']),payon:Object.freeze(['cave']),forge:Object.freeze(['firecave']),glacier:Object.freeze(['icecave']),sands:Object.freeze(['desert']),coast:Object.freeze(['coast']),crypt:Object.freeze(['ruins','haunted']),geffen:Object.freeze(['arcane'])});
const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),hash=(seed,key)=>{let n=Number(seed)>>>0;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
const habitatRecord=key=>Array.isArray(RO_HABITATS)?RO_HABITATS.find(h=>h.key===key):RO_HABITATS[key];
export const habitatName=key=>habitatRecord(key)?.name||key;
export const stageHabitatNames=key=>(RO_STAGE_HABITATS[key]||[]).map(habitatName);
export const roStageSpecies=key=>[...new Set((RO_STAGE_HABITATS[key]||[]).flatMap(h=>habitatSpecies(h,{tier:3,bosses:false})))];
const FEATURED=Object.freeze({meadow:['poring','lunatic','drops'],forest:['spore','poring','willow'],cave:['poporing','tarou','thiefbug'],firecave:['imp','magmaring','kasa'],icecave:['siroma','gazeti','icetitan'],desert:['scorpion','hode','muka'],coast:['kukre','vadon','marina'],ruins:['skeleton','mummy','archerskeleton'],haunted:['whisper','ghoul','dullahan'],arcane:['deviruchi','rideword','clock']});
export function buildRoEncounter(stageKey,seed=1,stageNumber=1){
 if(!own(RO_STAGE_HABITATS,stageKey))throw new RangeError('Unknown habitat region');
 const habitats=RO_STAGE_HABITATS[stageKey],habitat=habitats[hash(seed,stageKey)%habitats.length],tier=Math.min(3,Math.max(1,Math.floor(stageNumber)||1));
 const eligible=habitatSpecies(habitat,{tier,bosses:false}),featured=(FEATURED[habitat]||[]).filter(k=>eligible.includes(k)),rest=eligible.filter(k=>!featured.includes(k)).sort((a,b)=>hash(seed+stageNumber*701,a)-hash(seed+stageNumber*701,b)||a.localeCompare(b));
 const species=[...featured,...rest].slice(0,Math.min(12,6+tier*2));
 if(!species.length)throw new Error('Habitat has no eligible monsters: '+habitat);
 const strongest=habitatSpecies(habitat,{tier:3,bosses:false}),guardianPool=strongest.filter(k=>['heavy','caster'].includes(MONSTER_HABITATS[k]?.role)),guardians=(guardianPool.length?guardianPool:strongest).sort((a,b)=>hash(seed,a)-hash(seed,b)).slice(0,3);
 const bosses=habitatSpecies(habitat,{tier:3,bosses:true});if(!bosses.length)throw new Error('Habitat has no boss: '+habitat);
 return Object.freeze({habitat,habitatName:habitatName(habitat),tier,species:Object.freeze(species),guardians:Object.freeze(guardians),boss:bosses[hash(seed,'boss')%bosses.length]});
}
export function dominantRoHabitat(roster){
 const weights=new Map();for(const m of roster||[]){const data=MONSTER_HABITATS[m.key];if(!data)continue;weights.set(data.primary,(weights.get(data.primary)||0)+Math.max(1,m.count||1));}
 return [...weights].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||'cave';
}
export function habitatScene(key){return habitatRecord(key)?.scene||'payon';}
