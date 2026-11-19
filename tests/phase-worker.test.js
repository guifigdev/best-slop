import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('hosted Worker serves the same built game and routes Phase API before SPA fallback',async()=>{
 const source=await readFile(new URL('../server/worker.js',import.meta.url),'utf8');
 assert.match(source,/handlerPhaseRequest\(request,env\)/);
 // Import the deterministic bundle when available; source tests do not depend
 // on a stale dist directory from another checkout.
 let worker;try{worker=(await import('../dist/server/index.js')).default;}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND')return;throw error;}
 const home=await worker.fetch(new Request('https://game.example/'),{});assert.equal(home.status,200);assert.match(home.headers.get('Content-Type'),/text\/html/);const html=await home.text();assert.match(html,/<div id="app">/);
 const asset=html.match(/src="([^"]+\.js)"/)[1],script=await worker.fetch(new Request('https://game.example'+asset),{});assert.equal(script.status,200);assert.match(script.headers.get('Cache-Control'),/immutable/);assert.ok((await script.text()).length>100000);
 const cached=await worker.fetch(new Request('https://game.example'+asset,{headers:{'If-None-Match':script.headers.get('ETag')}}),{});assert.equal(cached.status,304);
 assert.equal((await worker.fetch(new Request('https://game.example/missing.png'),{})).status,404);
 assert.equal((await worker.fetch(new Request('https://game.example/',{method:'POST'}),{})).status,405);
 const api=await worker.fetch(new Request('https://game.example/api/phase/ALDEIA'),{});assert.notEqual(api.headers.get('Content-Type'),'text/html; charset=utf-8');assert.equal(api.status,503);
});
