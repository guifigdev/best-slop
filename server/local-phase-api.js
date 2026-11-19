import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {handlerPhaseRequest} from './phase-rooms.js';

// Local preview alone owns this SQLite adapter. Production uses the D1 binding
// and Sites applies the schema migration before the Worker is deployed.
export function localPhaseApi(){
 let db;
 return{name:'phase-killer-local-api',configureServer(server){
  mkdirSync('outputs',{recursive:true});db=new DatabaseSync('outputs/phase-preview.sqlite');
  db.exec(readFileSync(new URL('../drizzle/0000_phase_rooms.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','').replace('CREATE TABLE phase_rooms','CREATE TABLE IF NOT EXISTS phase_rooms').replace('CREATE INDEX phase_rooms_expires_at_idx','CREATE INDEX IF NOT EXISTS phase_rooms_expires_at_idx'));
  const DB={prepare(sql){return{bind(...args){return{async first(){return db.prepare(sql).get(...args)||null;},async run(){return{meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}};
  server.middlewares.use(async(req,res,next)=>{
   if(!req.url?.startsWith('/api/phase'))return next();
   try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const request=new Request('http://'+(req.headers.host||'localhost')+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})});const response=await handlerPhaseRequest(request,{DB});
    if(!response)return next();res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
   }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'Não foi possível processar a sala local.'}));}
  });server.httpServer?.once('close',()=>db.close());
 }};
}
