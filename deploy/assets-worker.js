// A public asset gateway for an otherwise private R2 bucket. Only the game's
// compiled asset prefix is reachable; client documents/backups stay private.
export default {async fetch(request,env){
 const url=new URL(request.url),headers=new Headers({'X-Content-Type-Options':'nosniff','Vary':'Origin'}),origin=request.headers.get('Origin');
 const allowed=String(env.PUBLIC_ASSET_ORIGINS||'https://play.gfig.space,https://gfig.space').split(',').map(s=>s.trim()).filter(Boolean);
 if(origin&&!allowed.includes(origin))return new Response('Origin not allowed',{status:403,headers});
 if(origin)headers.set('Access-Control-Allow-Origin',origin);
 let key;try{key=decodeURIComponent(url.pathname).replace(/^\//,'');}catch{return new Response('Not found',{status:404,headers});}
 const prefix=String(env.PUBLIC_ASSET_PREFIX||'games').replace(/^\/+|\/+$/g,'');
 const parts=key.split('/');if(!prefix.split('/').every(p=>/^[A-Za-z0-9_-]+$/.test(p))||!key.startsWith(prefix+'/assets/')||parts.some(p=>!p||p==='.'||p==='..'||!/^[A-Za-z0-9._-]+$/.test(p)))return new Response('Not found',{status:404,headers});
 if(request.method==='OPTIONS'){headers.set('Access-Control-Allow-Methods','GET, HEAD');headers.set('Access-Control-Allow-Headers','Range, If-None-Match');headers.set('Access-Control-Max-Age','3600');return new Response(null,{status:204,headers});}
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
 if(!env.CLIENTS_BUCKET?.get)return new Response('Asset storage not configured',{status:503,headers});
 const object=await env.CLIENTS_BUCKET.get(key);if(!object)return new Response('Not found',{status:404,headers});
 object.writeHttpMetadata?.(headers);headers.set('ETag',object.httpEtag);headers.set('Cache-Control','public, max-age=31536000, immutable');headers.set('Access-Control-Expose-Headers','ETag, Content-Length');
 const validators=(request.headers.get('If-None-Match')||'').split(',').map(v=>v.trim().replace(/^W\//,''));
 if(validators.includes('*')||validators.includes(object.httpEtag)){await object.body?.cancel?.();return new Response(null,{status:304,headers});}
 if(Number.isFinite(object.size))headers.set('Content-Length',String(object.size));
 if(request.method==='HEAD'){await object.body?.cancel?.();return new Response(null,{headers});}
 return new Response(object.body,{headers});
}};
