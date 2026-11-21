import assets from '../outputs/phase-site-assets.js';
import {handlerPhaseRequest} from './phase-rooms.js';
import {handlerRagnarokRequest} from './ro-accounts.js';
import publicConfig from '../outputs/game-public-config.js';

export default {async fetch(request,env){
 if(new URL(request.url).pathname==='/api/config')return Response.json({...publicConfig,hosting:'sites',configured:!!publicConfig.websocketUrl,features:{online:{status:publicConfig.websocketUrl?'configured':'external',guide:'online'},phase:{status:env?.DB?'ready':'external',guide:'workers'},r2:{status:publicConfig.assetBase?'configured':'optional',guide:'r2'},steam:{status:'external',guide:'steam'},android:{status:'external',guide:'android'},payments:{status:'not-implemented',guide:'monetization'}}},{headers:{'Cache-Control':'no-store'}});
 const accountApi=await handlerRagnarokRequest(request,env);if(accountApi)return accountApi;
 const api=await handlerPhaseRequest(request,env);if(api)return api;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 const pathname=new URL(request.url).pathname;
 const asset=assets[pathname==='/'?'/index.html':pathname]||(!pathname.split('/').pop().includes('.')?assets['/index.html']:null);
 if(!asset)return new Response('Not found',{status:404});
 const headers={'Content-Type':asset.type,'ETag':asset.etag,'Cache-Control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff'};
 if(request.headers.get('If-None-Match')===asset.etag)return new Response(null,{status:304,headers});
 const body=request.method==='HEAD'?null:Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
 return new Response(body,{headers});
}};
