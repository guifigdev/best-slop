import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {Game} from '../shared/simulation.js';
const VERSION=1;
const encode=value=>JSON.stringify(value,(_key,v)=>v instanceof Map?{__roomType:'Map',entries:[...v]}:v instanceof Set?{__roomType:'Set',entries:[...v]}:v);
const decode=value=>JSON.parse(value,(_key,v)=>v?.__roomType==='Map'?new Map(v.entries):v?.__roomType==='Set'?new Set(v.entries):v);
export class RoomStore{
 constructor(directory=null){
  if(directory)mkdirSync(directory,{recursive:true});this.persistent=!!directory;this.db=new DatabaseSync(directory?path.join(directory,'game.sqlite'):':memory:');
  this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS game_rooms(code TEXT PRIMARY KEY,version INTEGER NOT NULL,state TEXT NOT NULL,updated_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY);');
  for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()){
   if(this.db.prepare('SELECT name FROM local_migrations WHERE name=?').get(name))continue;
   const sql=readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8').replaceAll('--> statement-breakpoint','');
   this.db.exec('BEGIN');try{this.db.exec(sql);this.db.prepare('INSERT INTO local_migrations(name) VALUES(?)').run(name);this.db.exec('COMMIT');}catch(error){this.db.exec('ROLLBACK');throw error;}
  }
 }
 prepare(sql){const db=this.db;return{bind(...args){return{async first(){return db.prepare(sql).get(...args)||null;},async run(){return{meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}
 save(code,room){const state=encode({game:room.game,messages:room.messages||[],host:room.host,started:room.started,lastActivity:room.lastActivity,members:[...room.members.values()].map(({id,tokenHash,hero,name,disconnectedAt})=>({id,tokenHash,hero,name,disconnectedAt:disconnectedAt||Date.now()}))});if(state.length>24*1024*1024)throw Error('Room checkpoint exceeds limit');this.db.prepare('INSERT INTO game_rooms(code,version,state,updated_at) VALUES(?,?,?,?) ON CONFLICT(code) DO UPDATE SET version=excluded.version,state=excluded.state,updated_at=excluded.updated_at').run(code,VERSION,state,Date.now());}
 load({maxAgeMs=1800000,now=Date.now()}={}){const result=[];for(const row of this.db.prepare('SELECT * FROM game_rooms').all()){
  if(row.version!==VERSION||now-row.updated_at>maxAgeMs)continue;
  try{const saved=decode(row.state),game=new Game(saved.game.worldSeed,saved.game.options);for(const [key,value]of Object.entries(saved.game))if(!['__proto__','prototype','constructor'].includes(key)&&typeof game[key]!=='function')game[key]=value;
   result.push([row.code,{game,messages:saved.messages||[],host:saved.host,started:!!saved.started,lastActivity:saved.lastActivity||row.updated_at,clients:new Map(),members:new Map(saved.members.map(m=>[m.id,{...m,disconnectedAt:m.disconnectedAt??row.updated_at}])),paused:true,restored:true}]);
  }catch{/* An incompatible checkpoint is retained for manual recovery. */}
 }return result;}
 delete(code){this.db.prepare('DELETE FROM game_rooms WHERE code=?').run(code);}
 close(){this.db.close();}
}
