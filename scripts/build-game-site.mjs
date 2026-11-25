import {build as viteBuild,loadEnv} from 'vite';
import {build as bundle} from 'esbuild';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildRoAudioRelease} from './ro-audio-release.mjs';
import path from 'node:path';
const buildEnv={...loadEnv('production',process.cwd(),'VITE_'),...process.env};
await viteBuild({base:buildEnv.VITE_ASSET_BASE_URL||'/',build:{outDir:'dist/client',emptyOutDir:true,assetsInlineLimit:0}});
await buildRoAudioRelease('dist/client',buildEnv.VITE_ASSET_BASE_URL||'/');
await mkdir('dist/client/guides',{recursive:true});
for(const name of ['COMECE_AQUI_VPS.md','SALAS_ONLINE.md','HOSPEDAGEM.md','CONFIGURACOES.md','MONETIZACAO.md','RELATORIO_EXECUTIVO.md'])try{await copyFile('docs/'+name,'dist/client/guides/'+name);}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir('dist/client/assets/font-licenses',{recursive:true});
for(const name of ['dm-sans-OFL.txt','outfit-OFL.txt','README.txt'])await copyFile('src/assets/fonts/'+name,'dist/client/assets/font-licenses/'+name);
await copyFile('src/assets/ro-equipment-icons/manifest.json','dist/client/assets/ro-equipment-icons-source.json');
await copyFile('src/assets/ro-equipment-icons/PROVENANCE.txt','dist/client/assets/ro-equipment-icons-provenance.txt');
await mkdir('outputs',{recursive:true});
await writeFile('outputs/game-public-config.js','export default '+JSON.stringify({websocketUrl:buildEnv.VITE_SERVER_URL||'',phaseApiBase:buildEnv.VITE_PHASE_API_URL||'',assetBase:buildEnv.VITE_ASSET_BASE_URL||''})+';\n');
const assets={};
const types={'.wav':'audio/wav','.mp3':'audio/mpeg','.mid':'audio/midi','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
async function collect(dir,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const key=prefix+'/'+entry.name,full=path.join(dir,entry.name);
  if(entry.isDirectory())await collect(full,key);
  else{const bytes=await readFile(full);assets[key]={body:bytes.toString('base64'),type:types[path.extname(full)]||'application/octet-stream',etag:'"'+createHash('sha256').update(bytes).digest('hex').slice(0,24)+'"'};}
 }
}
await collect('dist/client');await mkdir('outputs',{recursive:true});
await writeFile('outputs/phase-site-assets.js','export default '+JSON.stringify(assets)+';\n');
await bundle({entryPoints:['server/worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
