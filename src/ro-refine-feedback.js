export const RO_REFINE_REVEAL_MS=1650;
export function createRoRefineFeedback({now=()=>performance.now(),onSound=()=>{}}={}){
 let attempt=null,serial=0;
 return{begin(item,before){if(attempt&&!attempt.finished)return false;attempt={id:++serial,key:item.key,itemId:item.id,itemSnapshot:structuredClone(item),name:item.name,from:item.refine||0,before,at:now(),strikes:0,finished:false,result:null};return true;},
 update(result){if(!attempt)return null;const elapsed=Math.max(0,now()-attempt.at);if(result&&result.id!==attempt.before)attempt.result=result;
  for(const at of [120,620,1120])if(elapsed>=at&&attempt.strikes<([120,620,1120].indexOf(at)+1)){attempt.strikes++;onSound('strike');}
  if(!attempt.finished&&elapsed>=RO_REFINE_REVEAL_MS&&attempt.result){attempt.finished=true;onSound(attempt.result.outcome==='success'?'success':'failure');}
  return{...attempt,elapsed,busy:!attempt.finished,stage:attempt.finished?attempt.result.outcome:'forging'};
 },cancel(){attempt=null;},get busy(){return !!attempt&&!attempt.finished;}};
}
