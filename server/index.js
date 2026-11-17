import http from 'node:http';
import {WebSocketServer} from 'ws';
import {randomUUID} from 'node:crypto';
import {ARENAS} from '../shared/arenas.js';
import {Game} from '../shared/simulation.js';
import {Matchmaker} from './matchmaking.js';
const port=Number(process.env.PORT||2567),rooms=new Map(),peers=new Map();
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({service:'Custom Hero',rooms:rooms.size}));});
const wss=new WebSocketServer({server,maxPayload:4096});
function send(peer,data){if(peer?.ws.readyState===1&&peer.ws.bufferedAmount<256000)peer.ws.send(JSON.stringify(data));}
function attach(peer,room,code){peer.room=room;room.clients.set(peer.id,peer);send(peer,{type:'joined',id:peer.id,room:code,state:room.game.snapshot()});}
const matchmaker=new Matchmaker((parties,options)=>{const code=`WAR-${randomUUID().slice(0,8)}`,r={game:new Game(Date.now()>>>0,options),clients:new Map()};for(const [i,p]of parties.entries())for(const u of p.players){const peer=peers.get(u.id);r.game.addPlayer(u.id,u.hero,u.name,false,i+1);attach(peer,r,code);}rooms.set(code,r);});
function broadcastParties(){for(const p of matchmaker.parties.values()){const state=matchmaker.state(p);for(const u of p.players)send(peers.get(u.id),{type:'party',party:state,id:u.id});}}
wss.on('connection',ws=>{
 const id=randomUUID(),peer={id,ws,room:null};peers.set(id,peer);let budget=0;
 ws.on('message',raw=>{if(++budget>90)return;try{const msg=JSON.parse(raw.toString());
  if(!peer.room&&msg.type==='partyCreate'){matchmaker.create(id,msg);broadcastParties();}
  else if(!peer.room&&msg.type==='partyJoin'){matchmaker.join(id,msg.code,msg);broadcastParties();}
  else if(!peer.room&&msg.type==='partyLeave'){matchmaker.leave(id);send(peer,{type:'party',party:null,id});broadcastParties();}
  else if(!peer.room&&msg.type==='queue'){matchmaker.queue(id);broadcastParties();}
  else if(!peer.room&&msg.type==='cancelQueue'){matchmaker.cancel(id);broadcastParties();}
  else if(msg.type==='join'&&!peer.room){if(matchmaker.party(id))throw Error('Saia da party antes de entrar em uma sala.');const code=String(msg.room||'').trim().toUpperCase();if(!/^[A-Z0-9]{3,12}$/.test(code))throw Error('Use uma sala com 3 a 12 letras ou números.');let r=rooms.get(code);if(!r){if(rooms.size>=64)throw Error('Servidor cheio.');r={game:new Game(7381,msg.options),clients:new Map()};if(Object.hasOwn(ARENAS,msg.arena)){r.game.startingArena=msg.arena;r.game.setArena(msg.arena);}rooms.set(code,r);}if(!r.game.addPlayer(id,msg.hero,msg.name))throw Error('Sala em andamento, cheia ou herói inválido. Escolha outra sala.');attach(peer,r,code);}
  else if(peer.room&&msg.type==='command'){if(!peer.room.game.command(id,msg.command))send(peer,{type:'rejected',message:'Comando recusado: confira estoque, ouro, nível, pontos, alvo ou fase.'});}
 }catch(e){send(peer,{type:'error',message:e.message});}});
 ws.on('close',()=>{matchmaker.leave(id);broadcastParties();peers.delete(id);if(peer.room){peer.room.clients.delete(id);const u=peer.room.game.player(id);if(u){u.bot=true;u.name+=' (IA · desconectado)';}for(const [code,r]of rooms)if(!r.clients.size)rooms.delete(code);}});
 ws.on('error',()=>{});ws.resetBudget=()=>budget=0;
});
let frame=0;setInterval(()=>{frame++;for(const r of rooms.values()){r.game.tick(1/30);if(frame%3===0){const state=r.game.snapshot();for(const peer of r.clients.values())send(peer,{type:'state',state});}}},1000/30);
setInterval(()=>{for(const ws of wss.clients)ws.resetBudget();},1000);
server.listen(port,'0.0.0.0',()=>console.log(`Custom Hero multiplayer: http://localhost:${port}`));
