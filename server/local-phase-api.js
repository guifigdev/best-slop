import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {handlerPhaseRequest} from './phase-rooms.js';
import {handlerRagnarokRequest} from './ro-accounts.js';

// Local preview alone owns this SQLite adapter. Production uses the D1 binding
// and Sites applies the schema migration before the Worker is deployed.
export function migrateLocalPhaseDatabase(db){
 db.exec('CREATE TABLE IF NOT EXISTS local_preview_migrations (name TEXT PRIMARY KEY)');
 const journal=JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
 for(const entry of journal.entries){const name=entry.tag;if(db.prepare('SELECT name FROM local_preview_migrations WHERE name=?').get(name))continue;
  db.exec('BEGIN');try{
   // Early previews created this legacy table before the tracked migration
   // existed. Preserve their characters/cards and add only the nullable key.
   if(name==='0001_ro_accounts'){const columns=db.prepare('PRAGMA table_info(ro_accounts)').all();if(columns.length&&!columns.some(column=>column.name==='site_user_id'))db.exec('ALTER TABLE ro_accounts ADD COLUMN site_user_id TEXT');}
   const sql=readFileSync(new URL('../drizzle/'+name+'.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','').replace('CREATE TABLE phase_rooms','CREATE TABLE IF NOT EXISTS phase_rooms').replace('CREATE INDEX phase_rooms_expires_at_idx','CREATE INDEX IF NOT EXISTS phase_rooms_expires_at_idx');db.exec(sql);
   db.prepare('INSERT INTO local_preview_migrations(name) VALUES(?)').run(name);db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
}
export function localPhaseApi(){
 let db;
 return{name:'phase-killer-local-api',configureServer(server){
  mkdirSync('outputs',{recursive:true});db=new DatabaseSync('outputs/phase-preview.sqlite');
  migrateLocalPhaseDatabase(db);
  const DB={prepare(sql){return{bind(...args){return{async first(){return db.prepare(sql).get(...args)||null;},async run(){return{meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}};
  server.middlewares.use(async(req,res,next)=>{
   if(!req.url?.startsWith('/api/phase')&&!req.url?.startsWith('/api/ragnarok'))return next();
   try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const request=new Request('http://'+(req.headers.host||'localhost')+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})});const response=await handlerRagnarokRequest(request,{DB})||await handlerPhaseRequest(request,{DB});
    if(!response)return next();res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
   }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'Não foi possível processar a sala local.'}));}
  });server.httpServer?.once('close',()=>db.close());
 }};
}
