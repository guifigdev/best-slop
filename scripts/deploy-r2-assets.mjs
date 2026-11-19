import {readFile,readdir,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseDeployEnv} from './doctor-deploy.mjs';

export function r2AssetPlan(env,input){
 const directory=path.resolve(input),endpoint=new URL(env.R2_ENDPOINT||'https://invalid.example'),prefix=String(env.R2_ASSET_PREFIX||'games').replace(/^\/+|\/+$/g,'');
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.r2.cloudflarestorage.com')||endpoint.pathname!=='/'||endpoint.username||endpoint.password)throw Error('Use R2_ENDPOINT HTTPS sem /bucket, caminho ou credenciais.');
 if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(env.R2_BUCKET||''))throw Error('Configure R2_BUCKET.');
 if(!prefix||!prefix.split('/').every(p=>/^[a-zA-Z0-9_-]+$/.test(p)))throw Error('R2_ASSET_PREFIX contém caminho inválido.');
 for(const key of ['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY'])if(!env[key])throw Error(`Configure ${key} no .env ou nos secrets do CI.`);
 return{directory,endpoint:endpoint.origin,prefix,bucket:env.R2_BUCKET,args:['s3','sync',path.join(directory,'assets'),`s3://${env.R2_BUCKET}/${prefix}/assets/`,'--endpoint-url',endpoint.origin,'--cache-control','public,max-age=31536000,immutable','--only-show-errors']};
}
async function main(){
 const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1];let env={...process.env};
 if(args.includes('--env'))env={...parseDeployEnv(await readFile(get('--env'),'utf8')),...Object.fromEntries(Object.entries(process.env).filter(([k,v])=>v&&['R2_ENDPOINT','R2_BUCKET','R2_ASSET_PREFIX','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY'].includes(k)))};
 const plan=r2AssetPlan(env,get('--directory')||'dist/client');if(!(await stat(path.join(plan.directory,'assets'))).isDirectory())throw Error('Build ausente: execute npm run build primeiro.');
 const files=await readdir(path.join(plan.directory,'assets'));if(!files.some(file=>file.endsWith('.js')))throw Error('Build não contém o JavaScript do jogo.');
 const result=spawnSync('aws',plan.args,{shell:false,stdio:'inherit',env:{...process.env,AWS_ACCESS_KEY_ID:env.AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY:env.AWS_SECRET_ACCESS_KEY,AWS_DEFAULT_REGION:'auto',AWS_EC2_METADATA_DISABLED:'true',AWS_REQUEST_CHECKSUM_CALCULATION:'when_required'}});
 if(result.error)throw Error('AWS CLI não encontrado; consulte docs/CONFIGURACOES.md.');
 if(result.status)process.exitCode=result.status;else console.log(`Assets publicados no prefixo ${plan.prefix}/assets/; arquivos antigos foram mantidos.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
