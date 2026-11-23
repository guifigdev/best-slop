// Asset metadata only. Source skill IDs and visual effect IDs are separate
// namespaces; a skill can have independent cast, hit and ground animations.
const PHASES={cast:'effectId',hit:'hitEffectId',ground:'groundEffectId'};
export function roNativeResourceToken(value){
 if(typeof value!=='string'||!value||value.length>512||/[\x00-\x1f]/.test(value))throw Error('Invalid native resource name');
 // Client table strings can be CP949 bytes stored as Latin-1 code points.
 // Decode only an unambiguous Hangul result; genuine Unicode stays untouched.
 if(/[^\x00-\x7f]/.test(value)&&[...value].every(c=>c.charCodeAt(0)<=255))try{const decoded=new TextDecoder('euc-kr',{fatal:true}).decode(Uint8Array.from(value,c=>c.charCodeAt(0)));if(/[\uac00-\ud7af]/.test(decoded))value=decoded;}catch{}
 const token=value.replaceAll('\\','/').replace(/^data\/texture\/effect\//i,'').replace(/^effect\//i,'');
 if(token.startsWith('/')||token.includes(':')||token.split('/').some(part=>!part||part==='.'||part==='..'))throw Error('Unsafe native resource path');
 return token;
}
export function buildRoNativeEffectManifest(catalog,skillMap,effectTable){
 const skills={},files=new Set();let mapped=0,withStr=0,withVisuals=0;
 for(const skill of Object.values(catalog)){
  if(!Number.isInteger(skill.sourceId))continue;
  const mapping=skillMap[String(skill.sourceId)],phases={cast:[],hit:[],ground:[]};
  if(mapping)mapped++;
  for(const [phase,field]of Object.entries(PHASES)){
   const effectId=mapping?.[field];if(!Number.isInteger(effectId))continue;
   for(const row of effectTable[String(effectId)]||[]){
    const part={...row,effectId};
    if(part.type==='STR'&&part.file){try{
     part.file=roNativeResourceToken(part.file).replace(/\.str$/i,'');
     if(part.file.includes('%d')){
      const [low,high]=part.rand||[];if(!Number.isInteger(low)||!Number.isInteger(high)||high<low||high-low>16)continue;
      for(let variant=low;variant<=high;variant++){const file=part.file.replaceAll('%d',String(variant));files.add(file);phases[phase].push({...part,file,variantGroup:part.file,variant});}continue;
     }
     files.add(part.file);
    }catch{continue;}}
    phases[phase].push(part);
   }
  }
  const parts=Object.values(phases).flat();if(parts.some(p=>p.type))withVisuals++;if(parts.some(p=>p.type==='STR'))withStr++;
  skills[skill.key]={sourceId:skill.sourceId,sourceAegis:skill.sourceAegis||null,phases};
 }
 return{version:1,source:{base:'https://assets.latam-tools.com.br',skillMap:'/effect/skill-map',effectTable:'/effect/table',catalog:'https://github.com/adsonpleal/ragassets',assetCopyright:'Ragnarok Online game artwork © Gravity; software license does not license game artwork.'},skills,effects:{},coverage:{sourceSkills:Object.keys(skills).length,mappedSkills:mapped,withVisualParts:withVisuals,withStr,uniqueStrFiles:files.size},files:[...files].sort()};
}
export function validateRoNativeStr(value){
 if(!value||!Number.isFinite(value.fps)||value.fps<=0||value.fps>240||!Number.isInteger(value.maxKey)||value.maxKey<0||value.maxKey>100000||!Array.isArray(value.layers)||value.layers.length>1024)throw Error('Invalid native STR header');
 let keys=0;for(const layer of value.layers){
  if(!Array.isArray(layer.textures)||!Array.isArray(layer.animations)||layer.textures.length>2048)throw Error('Invalid native STR layer');
  for(const texture of layer.textures)roNativeResourceToken(texture);
  keys+=layer.animations.length;if(keys>100000)throw Error('Native STR exceeds keyframe budget');
  for(const key of layer.animations){
   if(!Number.isInteger(key.frame)||key.frame<0||!Number.isInteger(key.type)||![0,1].includes(key.type))throw Error('Invalid native STR keyframe');
   for(const [field,length]of [['pos',2],['uv',8],['xy',8],['color',4]])if(!Array.isArray(key[field])||key[field].length!==length||!key[field].every(Number.isFinite))throw Error('Invalid native STR vector '+field);
   for(const field of ['aniframe','anitype','delay','angle','srcalpha','destalpha','mtpreset'])if(!Number.isFinite(key[field]))throw Error('Invalid native STR scalar '+field);
  }
 }
 return value;
}
