export const treeUnitType=u=>u?.treeTagCharacter?'hero:'+u.treeTagCharacter:(u?.treeTagTrained||u?.treeTagWorker)?'unit:'+(u.rawId||u.workerType):null;
export const kodoUnitType=u=>u?.kodoTagCharacter?'runner':u?.kodoTagUnit&&!u.kodoTagKodo?'unit:'+u.unitKey:null;
export const constructionUnitType=u=>treeUnitType(u)||kodoUnitType(u)||(u?.castleUnit?'castle:'+u.unitKey:null);
export function ownKodoSelection(units,owner,ids){const wanted=new Set(ids);return units.filter(u=>wanted.has(u.id)&&u.owner===owner&&u.alive&&!u.kodoTagCaptured&&kodoUnitType(u)).map(u=>u.id);}
export function selectionRect(a,b){return{left:Math.min(a.x,b.x),top:Math.min(a.y,b.y),right:Math.max(a.x,b.x),bottom:Math.max(a.y,b.y)};}
export const inSelection=(p,r)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;
export function ownTreeSelection(units,owner,ids){const wanted=new Set(ids);return units.filter(u=>wanted.has(u.id)&&u.owner===owner&&u.alive&&!u.treeTagCaptured&&treeUnitType(u)).map(u=>u.id);}
