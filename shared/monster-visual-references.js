// Direct visual references requested by the project owner. Combat values remain
// the game's own values; these keys describe a voxel reconstruction of the art.
export const RAGNAROK_VOXEL_REFERENCES=Object.freeze(Object.fromEntries([
 ['familiar',1005,'Familiar'],['thiefbug',1051,'Besouro-Ladrão'],
 ['tarou',1175,'Tarou'],['archerskeleton',1016,'Esqueleto Arqueiro'],
 ['icetitan',1788,'Ice Titan'],['kasa',1833,'Kasa'],
 ['salamander',1831,'Salamander'],['poring',1002,'Poring'],['marin',1242,'Marin'],
].map(([key,id,name])=>[key,Object.freeze({key,id,name,url:`https://www.divine-pride.net/database/monster/${id}`,sprite:`https://static.divine-pride.net/images/mobs/png/${id}.png`})])));
const common=Object.freeze({cavebat:'familiar',scarab:'thiefbug',rat:'tarou',archer:'archerskeleton',firemage:'kasa',slime:'poring'});
export function monsterVisualReference(species,biome){
 if(biome==='frost'&&['guardian','stonebeast'].includes(species))return 'icetitan';
 if(biome==='forge'&&species==='stonebeast')return 'salamander';
 if(biome==='frost'&&species==='slime')return 'marin';
 return Object.hasOwn(common,species)?common[species]:null;
}
export function monsterReferenceName(key,fallback){return RAGNAROK_VOXEL_REFERENCES[key]?.name||fallback;}
