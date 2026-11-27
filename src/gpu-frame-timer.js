// Asynchronous GPU elapsed time. Never gl.finish(), readPixels(), or a busy wait.
export function createGPUFrameTimer(gl,{stride=6,maxPending=4}={}){
 let enabled=false,extension=null,attempted=false,active=null,pending=[],frame=0,lastMs=null,lastAt=0,waitingSince=null,status='disabled';
 const remove=query=>{try{gl.deleteQuery(query);}catch{}};
 function clear(){if(active){try{gl.endQuery(extension.TIME_ELAPSED_EXT);}catch{}remove(active);active=null;}for(const row of pending)remove(row.query);pending=[];lastMs=null;lastAt=0;waitingSince=null;}
 function supported(){if(!attempted){attempted=true;try{extension=gl?.getExtension('EXT_disjoint_timer_query_webgl2');}catch{}}return !!extension&&typeof gl?.createQuery==='function';}
 return{
  setEnabled(value){value=!!value;if(value===enabled)return;enabled=value;clear();frame=0;status=!value?'disabled':supported()?'sampling':'unsupported';},
  poll(now){if(!enabled||!supported())return;if(waitingSince===null)waitingSince=now;if(gl.isContextLost?.()){clear();status='context-lost';return;}try{
   if(gl.getParameter(extension.GPU_DISJOINT_EXT)){clear();status='disjoint';return;}
   while(pending.length&&gl.getQueryParameter(pending[0].query,gl.QUERY_RESULT_AVAILABLE)){const row=pending.shift(),ns=gl.getQueryParameter(row.query,gl.QUERY_RESULT);remove(row.query);if(Number.isFinite(ns)&&ns>=0){lastMs=ns/1e6;lastAt=now;status='available';}}
  }catch{clear();status='unsupported';extension=null;}},
  begin(){if(!enabled||!supported()||active||++frame%stride||pending.length>=maxPending||gl.isContextLost?.())return false;try{if(gl.getQuery?.(extension.TIME_ELAPSED_EXT,gl.CURRENT_QUERY))return false;active=gl.createQuery();if(!active)return false;gl.beginQuery(extension.TIME_ELAPSED_EXT,active);return true;}catch{if(active)remove(active);active=null;return false;}},
  end(){if(!active)return;const query=active;active=null;try{gl.endQuery(extension.TIME_ELAPSED_EXT);pending.push({query});}catch{remove(query);}},
  reset(){clear();if(enabled)status=supported()?'sampling':'unsupported';},
  snapshot(now){const stale=status==='available'&&now-lastAt>2000,timeout=(stale&&now-lastAt>5000)||(status==='sampling'&&waitingSince!==null&&now-waitingSince>5000);return{enabled,status:timeout?'timeout':stale?'sampling':status,ms:status==='available'&&!stale?lastMs:null,pending:pending.length};},
  dispose(){clear();enabled=false;status='disabled';}
 };
}
