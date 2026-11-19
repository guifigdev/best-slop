import {DatabaseSync,backup} from 'node:sqlite';
import {mkdir,readdir,copyFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function snapshotData(input,{stamp=new Date().toISOString().replace(/[:.]/g,'-')}={}){
 const root=path.resolve(input),target=path.join(root,'backups',stamp);
 if(!/^[a-zA-Z0-9_-]+$/.test(stamp))throw Error('Nome de snapshot inválido.');
 await mkdir(target,{recursive:true});const saved=[];
 async function walk(dir,relative=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   if(!relative&&(entry.name==='backups'||entry.name.startsWith('restore-previous-')))continue;
   const source=path.join(dir,entry.name),key=path.join(relative,entry.name),dest=path.join(target,key),stat=await lstat(source);
   if(stat.isSymbolicLink())continue;
   if(entry.isDirectory()){await mkdir(dest,{recursive:true});await walk(source,key);continue;}
   if(!entry.isFile()||/-wal$|-shm$|-journal$/.test(entry.name))continue;
   if(/\.(?:sqlite|sqlite3|db)$/.test(entry.name)){const db=new DatabaseSync(source,{readOnly:true});try{await backup(db,dest);}finally{db.close();}}
   else await copyFile(source,dest);
   saved.push(key);
  }
 }
 await walk(root);return{directory:target,files:saved};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=await snapshotData(process.argv[2]||process.env.DATA_DIR||'/data');console.log(result.directory);}
