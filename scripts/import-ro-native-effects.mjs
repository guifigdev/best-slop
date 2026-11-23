// Reproducible data import; no upstream renderer source is copied. Production
// receives only local hashed JSON/PNG URLs, never requests the public server.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillIsCurated} from '../shared/ro-skill-policy.js';
import {buildRoNativeEffectManifest,validateRoNativeStr,roNativeResourceToken} from '../shared/ro-native-effect-manifest.js';
const root=fileURLToPath(new URL('../',import.meta.url)),args=Object.fromEntries(process.argv.slice(2).map(s=>{const at=s.indexOf('=');return at<0?[s.replace(/^--/,''),true]:[s.slice(0,at).replace(/^--/,''),s.slice(at+1)];}));
const out=path.resolve(root,args.out||'src/assets/ro-native-effects'),cache=path.join(root,'outputs/ro-native-effects/http-cache'),base='https://assets.latam-tools.com.br',limit=Number(args['max-mb']||25)*1024*1024,errors=[],textureCache=new Map();let bytes=0,decodedBytes=0;
const hash=b=>createHash('sha256').update(b).digest('hex'),safeWrite=async(file,data)=>{await mkdir(path.dirname(file),{recursive:true});await writeFile(file,data);};
async function request(route){
 const url=base+route,file=path.join(cache,hash(url));if(!args.refresh)try{return await readFile(file);}catch{}
 const result=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!result.ok)throw Error(result.status+' '+route);const value=Buffer.from(await result.arrayBuffer());if(value.length>16*1024*1024)throw Error('Oversized response '+route);await safeWrite(file,value);return value;
}
const [skillMap,table]=await Promise.all(['/effect/skill-map','/effect/table'].map(async p=>JSON.parse((await request(p)).toString()))),manifest=buildRoNativeEffectManifest(RO_SKILLS,skillMap,table);
const requested=args.skills?String(args.skills).split(','):null,curated=Object.values(RO_SKILLS).filter(s=>roSkillIsCurated(s)&&(!requested||requested.includes(s.key))),selected=new Set(curated.flatMap(s=>Object.values(manifest.skills[s.key]?.phases||{}).flat().filter(p=>p.type==='STR').map(p=>p.file)));
const priority=['crashearth','stormgust','lord','magnus','quagmire','firewall1','heal','glasswall'];const files=[...selected].sort((a,b)=>(priority.includes(a)?priority.indexOf(a):999)-(priority.includes(b)?priority.indexOf(b):999)||a.localeCompare(b));
async function texture(name,file){
 const token=roNativeResourceToken(name),folder=file.includes('/')?file.slice(0,file.lastIndexOf('/')+1):'',first=folder&&!token.startsWith(folder)?folder+token:token;
 if(textureCache.has(first))return textureCache.get(first);
 const pending=(async()=>{let value,source=first;try{value=await request('/effect/texture?file='+encodeURIComponent(first));}catch(error){if(first===token)throw error;source=token;value=await request('/effect/texture?file='+encodeURIComponent(token));}
  if(value.length<24||value.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not PNG '+source);
  const width=value.readUInt32BE(16),height=value.readUInt32BE(20);if(!width||!height||width>4096||height>4096)throw Error('Oversized texture '+source);
  const target='textures/'+hash(value).slice(0,24)+'.png';return{target,source,value,width,height};
 })();textureCache.set(first,pending);return pending;
}
const committedTextures=new Set();
for(const file of files){
 try{
  const data=validateRoNativeStr(JSON.parse((await request('/effect/str?file='+encodeURIComponent(file))).toString())),raw=Buffer.from(JSON.stringify(data)),names=[...new Set(data.layers.flatMap(l=>l.textures))],textures=[];
  for(let i=0;i<names.length;i+=4)textures.push(...await Promise.all(names.slice(i,i+4).map(async name=>({name,...await texture(name,file)}))));
  const unique=[...new Map(textures.filter(t=>!committedTextures.has(t.target)).map(t=>[t.target,t])).values()],additional=raw.length+unique.reduce((n,t)=>n+t.value.length,0);if(bytes+additional>limit)throw Error('Package byte budget exceeded');
  const target='effects/'+hash(raw).slice(0,24)+'.json';await safeWrite(path.join(out,target),raw);bytes+=raw.length;
  for(const t of unique){await safeWrite(path.join(out,t.target),t.value);committedTextures.add(t.target);bytes+=t.value.length;decodedBytes+=t.width*t.height*4;}
  manifest.effects[file]={file,fps:data.fps,maxKey:data.maxKey,duration:(data.maxKey+1)/data.fps,layerCount:data.layers.length,keyframeCount:data.layers.reduce((n,l)=>n+l.animations.length,0),data:target,sha256:hash(raw),bytes:raw.length,textures:Object.fromEntries(textures.map(t=>[t.name,t.target])),textureInfo:Object.fromEntries(textures.map(t=>[t.name,{source:t.source,width:t.width,height:t.height,sha256:hash(t.value)}]))};
  console.log('Imported',file,'layers',data.layers.length,'textures',names.length,'bytes',additional);
 }catch(error){errors.push({file,error:String(error.message||error)});console.log('Unavailable',file,String(error.message||error));}
}
manifest.coverage={...manifest.coverage,requestedStrFiles:files.length,packagedStrFiles:Object.keys(manifest.effects).length,packagedTextures:committedTextures.size,packageBytes:bytes,decodedTextureBytes:decodedBytes,skillsWithPackagedStr:Object.values(manifest.skills).filter(s=>Object.values(s.phases).flat().some(p=>p.type==='STR'&&manifest.effects[p.file])).length};manifest.unavailable=errors;delete manifest.files;
await safeWrite(path.join(out,'manifest.json'),JSON.stringify(manifest));
await safeWrite(path.join(out,'PROVENANCE.txt'),'Data imported from '+base+' /effect/skill-map, /effect/table, /effect/str and /effect/texture.\nSoftware: https://github.com/adsonpleal/ragassets (MIT). Game artwork: Ragnarok Online, Gravity; the MIT software license does not license game artwork.\nNo renderer implementation copied. STR data and PNG artwork retain original timing, palette, layers and blending metadata.\n');
if(!args['no-bridge']){
 const bridge=path.join(root,'src/ro-native-effect-assets.js'),relative=filename=>'./'+path.relative(path.dirname(bridge),path.join(out,filename)).replaceAll('\\','/');
 const descriptor=(file,d)=>JSON.stringify(file)+':{...RO_NATIVE_EFFECT_MANIFEST.effects['+JSON.stringify(file)+'],url:new URL('+JSON.stringify(relative(d.data))+',import.meta.url).href,textures:{'+Object.entries(d.textures).map(([name,url])=>JSON.stringify(name)+':new URL('+JSON.stringify(relative(url))+',import.meta.url).href').join(',')+'}}';
 await safeWrite(bridge,'// Generated by scripts/import-ro-native-effects.mjs. Keep asset URLs literal for Vite.\nexport const RO_NATIVE_EFFECT_MANIFEST='+JSON.stringify(manifest)+';\nexport const RO_NATIVE_EFFECT_ASSETS={'+Object.entries(manifest.effects).map(([f,d])=>descriptor(f,d)).join(',')+'};\n');
}
console.log(JSON.stringify(manifest.coverage));
