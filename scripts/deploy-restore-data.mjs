import {readdir,mkdir,lstat,rename,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const inside=(root,value)=>value.startsWith(root+path.sep);
export async function restoreData(backupInput,dataInput){
 const source=path.resolve(backupInput),target=path.resolve(dataInput);
 if(source===target||inside(source,target)||inside(target,source))throw Error('Backup e destino precisam ser diretórios separados.');
 const files=[];
 async function inspect(dir,relative=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const full=path.join(dir,entry.name),key=path.join(relative,entry.name),stat=await lstat(full);
   if(stat.isSymbolicLink())throw Error('Backup com link simbólico não é aceito.');
   if(entry.isDirectory())await inspect(full,key);else if(entry.isFile())files.push(key);
  }
 }
 await inspect(source);if(!files.length)throw Error('Backup vazio.');
 await mkdir(target,{recursive:true});
 const previous=path.join(target,'restore-previous-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(previous);
 for(const entry of await readdir(target,{withFileTypes:true})){
  if(entry.name==='backups'||entry.name.startsWith('restore-previous-'))continue;
  const full=path.resolve(target,entry.name),dest=path.resolve(previous,entry.name);
  if(!inside(target,full)||!inside(previous,dest))throw Error('Caminho fora do destino.');
  await rename(full,dest);
 }
 for(const file of files){const from=path.resolve(source,file),to=path.resolve(target,file);if(!inside(source,from)||!inside(target,to))throw Error('Caminho fora do backup.');await mkdir(path.dirname(to),{recursive:true});await copyFile(from,to);}
 return{previous,files};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(!process.argv[2]||!process.argv[3])throw Error('Informe backup e destino.');const result=await restoreData(process.argv[2],process.argv[3]);console.log('Estado anterior preservado em '+result.previous);}
