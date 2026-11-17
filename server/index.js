import http from 'node:http';
import {WebSocketServer} from 'ws';
import {randomUUID} from 'node:crypto';
import {ARENAS} from '../shared/arenas.js';
import {Game} from '../shared/simulation.js';
const port=Number(process.env.PORT||2567),rooms=new Map();
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({service:'Custom Hero',rooms:rooms.size}));});
const wss=new WebSocketServer({server,maxPayload:4096});
wss.on('connection',ws=>{
 const id=randomUUID();let room=null,budget=0;
 ws.on('message',raw=>{if(++budget>90)return;try{const msg=JSON.parse(raw.toString());if(msg.type==='join'&&!room){const code=String(msg.room||'').trim().toUpperCase();if(!/^[A-Z0-9]{3,12}$/.test(code))throw Error('Use uma sala com 3 a 12 letras ou números.');let r=rooms.get(code);if(!r){if(rooms.size>=64)throw Error('Servidor cheio.');r={game:new Game(),clients:new Map()};if(Object.hasOwn(ARENAS,msg.arena)){r.game.startingArena=msg.arena;r.game.setArena(msg.arena);}rooms.set(code,r);}if(!r.game.addPlayer(id,msg.hero,msg.name))throw Error('Sala em andamento, cheia ou herói inválido. Escolha outra sala.');room=r;r.clients.set(id,ws);ws.send(JSON.stringify({type:'joined',id,room:code}));}else if(room&&msg.type==='command'){if(!room.game.command(id,msg.command))ws.send(JSON.stringify({type:'rejected',message:'Comando recusado: confira estoque, ouro, nível, pontos, alvo ou fase.'}));}}catch(e){ws.send(JSON.stringify({type:'error',message:e.message}));}});
 ws.on('close',()=>{if(room){room.clients.delete(id);const u=room.game.player(id);if(u){room.game.units=room.game.units.filter(x=>x.owner!==id);delete room.game.players[id];}for(const [code,r]of rooms)if(!r.clients.size)rooms.delete(code);}});
 ws.on('error',()=>{});ws.resetBudget=()=>budget=0;
});
setInterval(()=>{for(const r of rooms.values()){r.game.tick(1/30);const data=JSON.stringify({type:'state',state:r.game.snapshot()});for(const ws of r.clients.values())if(ws.readyState===1&&ws.bufferedAmount<128000)ws.send(data);}},1000/30);
setInterval(()=>{for(const ws of wss.clients)ws.resetBudget();},1000);
server.listen(port,'0.0.0.0',()=>console.log(`Custom Hero multiplayer: http://localhost:${port}`));
