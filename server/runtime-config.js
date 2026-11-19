const integer=(value,fallback,min,max)=>{const n=Number(value);return Number.isInteger(n)?Math.max(min,Math.min(max,n)):fallback;};
export function runtimeConfig(env=process.env){
 const production=env.NODE_ENV==='production';
 const publicOrigin=String(env.PUBLIC_ORIGIN||'').replace(/\/$/,'');
 const allowedOrigins=new Set([publicOrigin,...String(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim())].filter(Boolean));
 return{production,host:env.HOST||'0.0.0.0',port:integer(env.PORT,2567,0,65535),publicOrigin,allowedOrigins,
  dataDir:env.DATA_DIR||(production?'./data':null),clientDir:env.CLIENT_DIR||'dist/client',
  roomLimit:integer(env.ROOM_LIMIT,32,1,256),maxClients:integer(env.MAX_CLIENTS,256,1,4096),
  idleSeconds:integer(env.ROOM_IDLE_SECONDS,1800,30,86400),resumeSeconds:integer(env.ROOM_RESUME_SECONDS,120,10,86400),
  snapshotHz:integer(env.ROOM_SNAPSHOT_HZ,10,1,30),simulationHz:integer(env.SIMULATION_HZ,30,10,60),
  drainSeconds:integer(env.DRAIN_TIMEOUT_SECONDS,120,0,600),trustProxy:env.TRUST_PROXY==='1',
  version:env.APP_VERSION||'development',r2PublicUrl:env.R2_PUBLIC_URL||'',steamAppId:env.STEAM_APP_ID||'',androidAppId:env.ANDROID_APP_ID||''};
}
export function originAllowed(origin,host,config){
 if(!origin)return true; // Native clients still authenticate their room capability.
 if(config.allowedOrigins.has(origin))return true;
 if(config.publicOrigin)return false;
 try{const u=new URL(origin);return ['http:','https:'].includes(u.protocol)&&u.host===host||!config.production&&['localhost','127.0.0.1','[::1]'].includes(u.hostname);}catch{return false;}
}
export function publicRuntimeConfig(config,{persistent=false,draining=false}={}){
 return{version:config.version,hosting:'vps',configured:true,draining,
  websocketPath:'/ws',websocketUrl:config.publicOrigin?config.publicOrigin.replace(/^http/,'ws')+'/ws':null,
  phaseApiBase:config.publicOrigin||'',features:{online:{status:draining?'maintenance':'ready',guide:'online'},
  phase:{status:'ready',guide:'online'},checkpoints:{status:persistent?'ready':'optional',guide:'vps'},r2:{status:config.r2PublicUrl?'configured':'optional',guide:'r2'},
  workers:{status:'optional',guide:'workers'},steam:{status:'external',guide:'steam'},android:{status:'external',guide:'android'},payments:{status:'not-implemented',guide:'monetization'},ci:{status:'external',guide:'ci'}},
  limits:{rooms:config.roomLimit,clients:config.maxClients,snapshotHz:config.snapshotHz,resumeSeconds:config.resumeSeconds},
  integrations:{r2PublicUrl:config.r2PublicUrl,steamAppId:config.steamAppId,androidAppId:config.androidAppId}};
}
