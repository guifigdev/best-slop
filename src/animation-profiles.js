const heavy=new Set(['turtle','tortoise','rhino','brute','golem','mammoth','minotaur','champion']);
export function locomotionFrame(unit,time){
 const weight=heavy.has(unit.hero||unit.kind)||unit.size>=1.5?.32:1;
 const cadence=Math.max(.65,Math.min(1.3,Math.sqrt(Math.max(.1,unit.speed||3)/3)));
 return {pose:Math.floor(Math.floor(time*8)*cadence+(unit.id||0)*3)%8,weight};
}
export function constructionFrame(time){
 const i=Math.floor(time*8)%8;
 return {y:[0,.02,.05,.08,.04,0,0,0][i],tilt:[-.12,-.25,-.36,.15,.08,0,-.05,-.08][i],push:[0,-.02,-.04,.16,.1,.03,0,0][i]};
}
