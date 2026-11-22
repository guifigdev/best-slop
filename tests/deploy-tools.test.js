import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp,rm,stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {parseDeployEnv,assessDeployConfig} from '../scripts/doctor-deploy.mjs';
import {snapshotData} from '../scripts/deploy-snapshot.mjs';
import {restoreData} from '../scripts/deploy-restore-data.mjs';
import {r2AssetPlan} from '../scripts/deploy-r2-assets.mjs';
import gateway from '../deploy/assets-worker.js';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const valid={DOMAIN:'play.gfig.space',PUBLIC_ORIGIN:'https://play.gfig.space',ALLOWED_ORIGINS:'https://play.gfig.space',ACME_EMAIL:'ops@gfig.space'};
async function temporary(t){const base=path.resolve(os.tmpdir()),dir=await mkdtemp(path.join(base,'custom-hero-deploy-test-'));t.after(async()=>{assert.ok(path.resolve(dir).startsWith(base+path.sep));await rm(dir,{recursive:true,force:true});});return dir;}
test('deployment doctor validates independent origin, numeric and public-secret configuration without disclosing secret values',()=>{
 assert.equal(assessDeployConfig(valid).ok,true);
 for(const change of [{PUBLIC_ORIGIN:'http://play.gfig.space'},{PUBLIC_ORIGIN:'https://other.gfig.space'},{ALLOWED_ORIGINS:'*'},{ROOM_SNAPSHOT_HZ:'Infinity'},{DRAIN_TIMEOUT_SECONDS:'300'},{VITE_SECRET_TOKEN:'never-disclose-this'}]){const result=assessDeployConfig({...valid,...change});assert.equal(result.ok,false);assert.ok(!JSON.stringify(result).includes('never-disclose-this'));}
 const base=assessDeployConfig({...valid,R2_ENDPOINT:'https://account.r2.cloudflarestorage.com',R2_BUCKET:'clients'});assert.equal(base.ok,true);assert.equal(base.checks.find(c=>c.id==='r2').state,'optional_incomplete');
 assert.equal(assessDeployConfig({...valid,VITE_ASSET_BASE_URL:'https://assets.gfig.space/games/'}).ok,false);
 assert.equal(assessDeployConfig({...valid,VITE_ASSET_BASE_URL:'https://assets.gfig.space/games/'},{assetsAlreadyPublished:true}).ok,true);assert.equal(assessDeployConfig({...valid,VITE_SERVER_URL:'wss://user:secret@play.gfig.space/ws'}).ok,false);
 const parsed=parseDeployEnv('# config\nPUBLIC_ORIGIN="https://play.gfig.space"\nAWS_SECRET_ACCESS_KEY=literal$not_a_command\n');assert.equal(parsed.PUBLIC_ORIGIN,valid.PUBLIC_ORIGIN);assert.equal(parsed.AWS_SECRET_ACCESS_KEY,'literal$not_a_command');assert.throws(()=>parseDeployEnv('not dotenv'));
});
test('live SQLite WAL backup is consistent and restore preserves the displaced state instead of mixing old WAL with the restored database',async t=>{
 const folder=await temporary(t),data=path.join(folder,'data');await mkdir(data);const file=path.join(data,'rooms.sqlite'),writer=new DatabaseSync(file);writer.exec('PRAGMA journal_mode=WAL;CREATE TABLE rooms(id INTEGER);INSERT INTO rooms VALUES(1)');assert.ok((await stat(file+'-wal')).size>0);await writeFile(path.join(data,'meta.json'),'{"version":1}');
 let snapshot;try{snapshot=await snapshotData(data,{stamp:'first'});writer.exec('INSERT INTO rooms VALUES(2)');}finally{writer.close();}
 assert.ok(snapshot.files.includes('rooms.sqlite'));assert.ok(!snapshot.files.some(f=>f.endsWith('-wal')));const check=new DatabaseSync(path.join(snapshot.directory,'rooms.sqlite'));try{assert.equal(check.prepare('SELECT count(*) n FROM rooms').get().n,1);}finally{check.close();}
 const external=path.join(folder,'external');await cp(snapshot.directory,external,{recursive:true});const restored=await restoreData(external,data),now=new DatabaseSync(file),before=new DatabaseSync(path.join(restored.previous,'rooms.sqlite'));try{assert.equal(now.prepare('SELECT count(*) n FROM rooms').get().n,1);assert.equal(before.prepare('SELECT count(*) n FROM rooms').get().n,2);}finally{now.close();before.close();}assert.equal(await readFile(path.join(data,'meta.json'),'utf8'),'{"version":1}');
 await assert.rejects(restoreData(snapshot.directory,data),/separados/);await assert.rejects(snapshotData(data,{stamp:'../../escape'}),/inválido/);
});
test('R2 asset publishing uses a bounded prefix and keeps credentials out of arguments',()=>{
 const config={R2_ENDPOINT:'https://account.r2.cloudflarestorage.com',R2_BUCKET:'clients',R2_ASSET_PREFIX:'games',AWS_ACCESS_KEY_ID:'access-key',AWS_SECRET_ACCESS_KEY:'private-secret'},plan=r2AssetPlan(config,'dist/client');assert.ok(plan.args.includes('s3://clients/games/assets/'));assert.ok(!JSON.stringify(plan.args).includes('private-secret'));assert.ok(!plan.args.includes('--delete'));
 for(const change of [{R2_ENDPOINT:config.R2_ENDPOINT+'/clients'},{R2_ASSET_PREFIX:'games/../../clients'},{R2_ASSET_PREFIX:'games;echo bad'},{R2_ENDPOINT:'https://key:secret@account.r2.cloudflarestorage.com'}])assert.throws(()=>r2AssetPlan({...config,...change},'dist/client'));
});
test('asset gateway serves only the public compiled prefix and applies exact-origin CORS without making client records reachable',async()=>{
 const requested=[],env={PUBLIC_ASSET_ORIGINS:'https://play.gfig.space',CLIENTS_BUCKET:{async get(key){requested.push(key);return{body:new Response('compiled-game').body,size:13,httpEtag:'"asset-version"',writeHttpMetadata(headers){headers.set('Content-Type','text/javascript');}};}}};
 const root='https://assets.gfig.space',request=(key,options={})=>gateway.fetch(new Request(root+key,options),env);
 for(const key of ['/clients/private.json','/games/private.json','/custom-hero/backups/a.sqlite','/games/assets/%2e%2e/%2e%2e/private.json'])assert.equal((await request(key)).status,404);assert.deepEqual(requested,[]);
 assert.equal((await request('/games/assets/index-AbCd1234.js',{headers:{Origin:'https://attacker.invalid'}})).status,403);assert.equal(requested.length,0);
 const good=await request('/games/assets/index-AbCd1234.js',{headers:{Origin:'https://play.gfig.space'}});assert.equal(good.status,200);assert.equal(await good.text(),'compiled-game');assert.equal(good.headers.get('Access-Control-Allow-Origin'),'https://play.gfig.space');assert.equal(good.headers.get('Vary'),'Origin');assert.match(good.headers.get('Cache-Control'),/immutable/);
 const cached=await request('/games/assets/index-AbCd1234.js',{headers:{'If-None-Match':'W/"asset-version"'}});assert.equal(cached.status,304);const head=await request('/games/assets/index-AbCd1234.js',{method:'HEAD'});assert.equal(await head.text(),'');const options=await request('/games/assets/index-AbCd1234.js',{method:'OPTIONS',headers:{Origin:'https://play.gfig.space'}});assert.equal(options.status,204);
});

test('a failed Compose activation rolls back before exiting, even when dependency startup fails before health polling',async t=>{
 const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';if(spawnSync(bash,['--version']).error){t.skip('Bash not installed');return;}
 const folder=await temporary(t),envFile=path.join(folder,'runtime.env'),log=path.join(folder,'docker.log'),harness=path.join(folder,'harness.sh');await writeFile(envFile,'PUBLIC_ORIGIN=https://play.gfig.space\n');
 await writeFile(harness,`#!/usr/bin/env bash
set -euo pipefail
docker() {
 printf '%s | image=%s\\n' "$*" "\${GAME_IMAGE:-}" >> "$DOCKER_LOG"
 if [[ "$1" == inspect && "$*" == *'.Image'* ]]; then echo sha256:previous; return 0; fi
 if [[ "$1" == inspect && "$*" == *'.State.Running'* ]]; then echo false; return 0; fi
 if [[ "$1" == compose && "$*" == *' ps -q game'* ]]; then echo previous-container; return 0; fi
 if [[ "$1" == compose && "$*" == *' up -d '* ]]; then [[ "\${GAME_IMAGE:-}" == sha256:previous ]]; return; fi
 return 0
}
flock() { return 0; }
source "$1" --env "$2" --image registry.invalid/game:new
`);
 const script=fileURLToPath(new URL('../scripts/deploy.sh',import.meta.url)),result=spawnSync(bash,[harness,script,envFile],{encoding:'utf8',timeout:10000,env:{...process.env,XDG_STATE_HOME:folder,DOCKER_LOG:log}});assert.equal(result.status,1,result.stderr);const lines=(await readFile(log,'utf8')).split('\n');assert.ok(lines.some(line=>line.includes('pull caddy')));assert.ok(lines.some(line=>line.includes('up -d')&&line.endsWith('image=registry.invalid/game:new')));assert.ok(lines.some(line=>line.includes('up -d')&&line.endsWith('image=sha256:previous')));assert.match(result.stderr,/Imagem anterior/);
});


test('private env checks use its exact owner offline and host-proxy mode starts only the game',async t=>{
 const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';if(spawnSync(bash,['--version']).error){t.skip('Bash not installed');return;}
 for(const mode of ['standalone','host']){
  const folder=await temporary(t),envFile=path.join(folder,'private.env'),log=path.join(folder,'docker.log'),harness=path.join(folder,'harness.sh');await writeFile(envFile,'PUBLIC_ORIGIN=https://play.gfig.space\n',{mode:0o600});
  await writeFile(harness,`#!/usr/bin/env bash
set -euo pipefail
docker() {
 printf '%s\\n' "$*" >> "$DOCKER_LOG"
 if [[ "$1" == run && "$*" == *'--proxy-mode'* ]]; then echo "$TEST_PROXY_MODE"; return 0; fi
 if [[ "$1" == inspect && "$*" == *'.State.Health'* ]]; then echo healthy; return 0; fi
 if [[ "$1" == inspect && "$*" == *'.State.Running'* ]]; then echo false; return 0; fi
 if [[ "$1" == inspect && "$*" == *'.Image'* ]]; then echo sha256:previous; return 0; fi
 if [[ "$1" == compose && "$*" == *' ps -q game'* ]]; then echo game-container; return 0; fi
 return 0
}
flock() { return 0; }
source "$1" --env "$2" --image registry.invalid/game:new
`);
  const script=fileURLToPath(new URL('../scripts/deploy.sh',import.meta.url)),result=spawnSync(bash,[harness,script,envFile],{encoding:'utf8',timeout:10000,env:{...process.env,XDG_STATE_HOME:folder,DOCKER_LOG:log,TEST_PROXY_MODE:mode}});assert.equal(result.status,0,result.stderr);const lines=(await readFile(log,'utf8')).trim().split('\n'),checks=lines.filter(l=>l.startsWith('run '));assert.equal(checks.length,3);for(const line of checks){assert.match(line,/--user \d+:\d+/);assert.match(line,/--network none --read-only --cap-drop ALL --security-opt no-new-privileges:true/);assert.match(line,/dst=\/configuration.env,readonly/);}assert.equal(lines.some(l=>l.includes('pull caddy')),mode==='standalone');const activation=lines.find(l=>l.includes(' up -d '));assert.equal(activation.endsWith(' game'),mode==='host');
 }
});

test('proxy configuration rejects unknown modes and non-loopback port values without changing the application image user',async()=>{
 for(const change of [{REVERSE_PROXY_MODE:'host'},{REVERSE_PROXY_MODE:'standalone'},{GAME_BIND_PORT:'2567'}])assert.equal(assessDeployConfig({...valid,...change}).ok,true);
 for(const change of [{REVERSE_PROXY_MODE:'other'},{GAME_BIND_PORT:'0'},{GAME_BIND_PORT:'65536'},{GAME_BIND_PORT:'2567:80'}])assert.equal(assessDeployConfig({...valid,...change}).ok,false);
 const compose=await readFile(new URL('../deploy/compose.yaml',import.meta.url),'utf8');assert.match(compose,/127\.0\.0\.1:\$\{GAME_BIND_PORT:-2567\}:2567/);const dockerfile=await readFile(new URL('../deploy/Dockerfile',import.meta.url),'utf8');assert.match(dockerfile,/USER node/);
});
