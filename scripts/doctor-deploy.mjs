import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function parseDeployEnv(text){
 const result={};for(const [index,line]of text.split(/\r?\n/).entries()){
  const clean=line.trim();if(!clean||clean.startsWith('#'))continue;
  const match=clean.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);if(!match)throw Error(`Linha ${index+1}: use NOME=valor.`);
  let value=match[2].trim();if(/^['"]/.test(value)){const quote=value[0];if(!value.endsWith(quote))throw Error(`Linha ${index+1}: aspas sem fechamento.`);value=value.slice(1,-1);}else value=value.replace(/\s+#.*$/,'').trim();
  result[match[1]]=value;
 }return result;
}
export function assessDeployConfig(env,{assetsAlreadyPublished=false}={}){
 const checks=[],add=(id,state,message)=>checks.push({id,state,message});
 const domain=env.DOMAIN||'',validDomain=/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(domain);
 add('domain',validDomain&&!/seudominio|example\./i.test(domain)?'ready':'required','DNS: DOMAIN deve ser um hostname real, sem https, porta ou caminho.');
 let origin;try{origin=new URL(env.PUBLIC_ORIGIN);}catch{}
 add('origin',origin?.protocol==='https:'&&origin.hostname===domain&&origin.origin===env.PUBLIC_ORIGIN?'ready':'required','PUBLIC_ORIGIN deve ser https://DOMAIN, sem barra final.');
 add('email',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ACME_EMAIL||'')&&!/seudominio|example\./i.test(env.ACME_EMAIL)?'ready':'required','ACME_EMAIL recebe avisos de certificado; informe um email válido.');
 add('reverse_proxy',['standalone','host'].includes(env.REVERSE_PROXY_MODE||'standalone')?'ready':'required','REVERSE_PROXY_MODE aceita standalone ou host (proxy HTTPS já instalado na VPS).');
 if(env.GAME_BIND_PORT!==undefined&&env.GAME_BIND_PORT!=='')add('game_bind_port',/^\d+$/.test(env.GAME_BIND_PORT)&&Number(env.GAME_BIND_PORT)>=1024&&Number(env.GAME_BIND_PORT)<=65535?'ready':'required','GAME_BIND_PORT deve estar entre 1024 e 65535; acesso apenas no loopback.');
 const allowed=(env.ALLOWED_ORIGINS||env.PUBLIC_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean);
 add('allowed_origins',allowed.includes(env.PUBLIC_ORIGIN)&&allowed.every(value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.origin===value;}catch{return false;}})?'ready':'required','ALLOWED_ORIGINS aceita origens HTTPS exatas separadas por vírgula; sem * nem caminhos.');
 for(const [key,min,max]of [['ROOM_LIMIT',1,1024],['MAX_CLIENTS',1,4096],['ROOM_IDLE_SECONDS',60,86400],['ROOM_RESUME_SECONDS',10,3600],['ROOM_SNAPSHOT_HZ',1,30],['SIMULATION_HZ',10,60],['DRAIN_TIMEOUT_SECONDS',0,120]])if(env[key]!==undefined&&env[key]!=='')add(key,Number.isInteger(Number(env[key]))&&Number(env[key])>=min&&Number(env[key])<=max?'ready':'required',`${key}: inteiro entre ${min} e ${max}.`);
 const leaked=Object.keys(env).filter(k=>k.startsWith('VITE_')&&/(SECRET|TOKEN|PRIVATE|PASSWORD|ACCESS_KEY)/i.test(k)&&env[k]);add('public_secrets',leaked.length?'required':'ready',leaked.length?'Remova segredos de variáveis VITE_; elas entram no navegador.':'Nenhum segredo identificado em variáveis públicas VITE_.');
 for(const [key,protocol]of [['VITE_SERVER_URL','wss:'],['VITE_PHASE_API_URL','https:']])if(env[key]){let u;try{u=new URL(env[key]);}catch{}add(key,u?.protocol===protocol&&!u.username&&!u.password&&!u.search&&!u.hash&&(key!=='VITE_PHASE_API_URL'||u.origin===env[key])?'ready':'required',`${key}: URL de produção ${protocol}, sem credenciais, query ou fragmento; a API usa apenas a origem.`);}
 const r2=['R2_ENDPOINT','R2_BUCKET','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY'],set=r2.filter(k=>env[k]);add('r2',set.length===r2.length?'ready':set.length?'optional_incomplete':'optional','R2 é opcional para backup. Configure os quatro campos juntos; o jogo não depende dele.');
 if(env.VITE_ASSET_BASE_URL){let base;try{base=new URL(env.VITE_ASSET_BASE_URL);}catch{}add('r2_assets',base?.protocol==='https:'&&base.href.endsWith('/')&&!base.search&&!base.hash&&!base.username&&(assetsAlreadyPublished||set.length===r2.length)?'ready':'required','CDN habilitada: VITE_ASSET_BASE_URL precisa terminar em /; build local requer credenciais de publicação. Imagem de CI pode usar --assets-published.');}
 return{ok:!checks.some(c=>c.state==='required'),checks};
}
async function main(){
 const args=process.argv.slice(2),index=args.indexOf('--env'),file=index>=0?args[index+1]:'.env';let env;
 try{env=parseDeployEnv(await readFile(file,'utf8'));}catch(error){console.error(`Não foi possível ler ${file}: ${error.message}`);process.exitCode=1;return;}
 const result=assessDeployConfig(env,{assetsAlreadyPublished:args.includes('--assets-published')});
 const builtIndex=args.indexOf('--built-index');if(builtIndex>=0){const html=await readFile(args[builtIndex+1],'utf8'),base=env.VITE_ASSET_BASE_URL||'/',matches=html.includes(base+'assets/');result.checks.push({id:'cdn_build',state:matches?'ready':'required',message:'A base de assets do build precisa coincidir com VITE_ASSET_BASE_URL do .env.'});if(!matches)result.ok=false;}
 if(args.includes('--proxy-mode')){if(result.ok)console.log(env.REVERSE_PROXY_MODE||'standalone');}else if(args.includes('--public-asset-base')){if(result.ok)console.log(env.VITE_ASSET_BASE_URL||'');}else if(args.includes('--json'))console.log(JSON.stringify(result));else for(const check of result.checks)console.log(`[${check.state}] ${check.message}`);
 if(!result.ok)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
