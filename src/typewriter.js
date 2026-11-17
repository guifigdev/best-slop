export function createTypewriter({element,onComplete=()=>{},speed=36,clock=()=>performance.now(),reducedMotion=false}){
 let text='',started=0,shown=0,complete=true;
 function reveal(){if(complete)return;shown=Array.from(text).length;element.textContent=text;complete=true;onComplete();}
 return{start(value){text=value;started=clock();shown=0;complete=false;element.textContent='';if(reducedMotion)reveal();},update(){if(complete)return;const chars=Array.from(text),count=Math.min(chars.length,Math.floor((clock()-started)/1000*speed));if(count!==shown){shown=count;element.textContent=chars.slice(0,count).join('');}if(count>=chars.length){complete=true;onComplete();}},reveal,isComplete:()=>complete};
}
