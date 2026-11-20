// Direct visual references requested by the project owner. Combat values remain
// the game's own values; these keys describe a voxel reconstruction of the art.
export const RAGNAROK_VOXEL_REFERENCES=Object.freeze(Object.fromEntries([
 ['familiar',1005,'Familiar','Morcego do Véu'],['thiefbug',1051,'Thief Bug','Escaravelho Saqueador'],
 ['tarou',1175,'Tarou','Taruk'],['archerskeleton',1016,'Archer Skeleton','Arqueiro Ossífero'],
 ['icetitan',1788,'Ice Titan','Colosso da Geada'],['kasa',1833,'Kasa','Asa de Brasa'],
 ['salamander',1831,'Salamander','Salamandra Incandescente'],['poring',1002,'Poring','Porim'],['marin',1242,'Marin','Marim Boreal'],
 ['spore',1014,'Spore','Esporo Saltitante'],['mandragora',1020,'Mandragora','Mandrágora Selvagem'],
 ['willow',1010,'Willow','Salgueiro Andante'],['elderwillow',1033,'Elder Willow','Salgueiro das Brasas'],
 ['scorpion',1001,'Scorpion','Escorpião de Cobre'],['andre',1095,'Andre','Formiga Escavadora'],
 ['hode',1127,'Hode','Verme das Dunas'],['golem',1040,'Golem','Golem de Basalto'],
 ['mummy',1041,'Mummy','Múmia Errante'],['whisper',1179,'Whisper','Sussurro do Véu'],
 ['siroma',1776,'Siroma','Siro Glacial'],['gazeti',1778,'Gazeti','Olho Glacial'],
].map(([key,id,sourceName,name])=>[key,Object.freeze({key,id,sourceName,name,url:`https://www.divine-pride.net/database/monster/${id}`,sprite:`https://static.divine-pride.net/images/mobs/png/${id}.png`})])));
const common=Object.freeze({cavebat:'familiar',scarab:'thiefbug',rat:'tarou',archer:'archerskeleton',firemage:'kasa',slime:'poring'});
export function monsterVisualReference(species,biome){
 if(Object.hasOwn(RAGNAROK_VOXEL_REFERENCES,species))return species;
 if(biome==='frost'&&['guardian','stonebeast'].includes(species))return 'icetitan';
 if(biome==='forge'&&species==='stonebeast')return 'salamander';
 if(biome==='frost'&&species==='slime')return 'marin';
 return Object.hasOwn(common,species)?common[species]:null;
}
export function monsterReferenceName(key,fallback){return RAGNAROK_VOXEL_REFERENCES[key]?.name||fallback;}
