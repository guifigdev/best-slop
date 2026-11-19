import {createGameServer} from './game-server.js';
const app=createGameServer();
const address=await app.listen();
console.log(`Custom Hero multiplayer: http://localhost:${address.port}`);
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>app.drain());
