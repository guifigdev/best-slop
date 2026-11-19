import {build as viteBuild} from 'vite';
import {build as bundle} from 'esbuild';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
await viteBuild({build:{outDir:'dist/client',emptyOutDir:true}});
const assets={};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json'};
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
