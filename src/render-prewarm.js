export const RENDER_PREWARM_BUDGET=Object.freeze({modelsPerWorld:16,pendingJobs:1});
// Production assets also live in dist/client/assets on the game origin. Workers
// must start there even when Vite's public asset base points at the CDN.
export function resolvePrewarmWorkerURL(asset,page){const url=new URL(asset,page),origin=new URL(page);if(url.origin===origin.origin)return url.href;const file=url.pathname.match(/\/assets\/([^/]+\.js)$/);if(!file)throw Error('Worker asset has no same-origin mirror');return new URL('/assets/'+file[1],origin).href;}
export function createRenderPrewarm({createWorker,cache,accept,compile}={}){
 let worker=null,enabled=true,world='',queue=[],current=null,serial=0,generation=0,completed=0,total=0,status='idle',failed=false,disposed=false,compiling=false,compileWanted=false;
 const known=new Set();
 function start(){if(disposed||!enabled||failed||current)return;while(queue.length&&cache.has(queue[0].key)){queue.shift();completed++;}if(!queue.length)return;try{worker||=createWorker();if(!worker)throw Error('worker unavailable');worker.onmessage=receive;worker.onerror=()=>{failed=true;current=null;queue=[];status='unavailable';worker?.terminate();worker=null;};current=queue.shift();status='preparing';worker.postMessage({id:++serial,key:current.key,parts:current.parts});}catch{failed=true;current=null;queue=[];status='unavailable';worker?.terminate();worker=null;}}
 function receive({data}){if(disposed||!current||data.id!==serial)return;const job=current;current=null;if(!data.error&&enabled){if(!cache.has(job.key))accept(job.key,data);if(job.generation===generation)completed++;compileWanted=true;}else if(data.error)status='partial';start();if(!current&&!queue.length&&status!=='partial')status='ready';}
 return{
  configure(value){value=!!value;if(value===enabled)return;enabled=value;generation++;world='';completed=total=0;queue=[];known.clear();if(!enabled){current=null;worker?.terminate();worker=null;status='disabled';compileWanted=false;}else{failed=false;status='idle';}},
  prepare(key,models){if(disposed||!enabled)return;if(key!==world){world=key;generation++;queue=[];completed=0;total=0;known.clear();compileWanted=true;}
   for(const model of models){if(total>=RENDER_PREWARM_BUDGET.modelsPerWorld)break;if(known.has(model.key))continue;known.add(model.key);total++;if(cache.has(model.key)){completed++;continue;}queue.push({...model,generation});}
   start();
  },
  tick({safe=true}={}){if(!enabled||disposed||!safe||compiling||!compileWanted)return;compileWanted=false;compiling=true;Promise.resolve().then(()=>compile()).catch(()=>{}).finally(()=>{compiling=false;});},
  stats:()=>({enabled,status,completed,total,pending:queue.length+Number(!!current),compiling,worker:!!worker}),
  dispose(){disposed=true;queue=[];current=null;worker?.terminate();worker=null;}
 };
}
