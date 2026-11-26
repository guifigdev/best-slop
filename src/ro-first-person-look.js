export function roMouseLook(yaw,pitch,dx,dy,sensitivity=.0025){return{yaw:yaw-(Number.isFinite(dx)?dx:0)*sensitivity,pitch:Math.max(-1.35,Math.min(1.35,pitch-(Number.isFinite(dy)?dy:0)*sensitivity))};}
// The browser requires a user gesture to capture the mouse. After capture,
// movement rotates the camera without a held mouse button or screen edges.
export function createRoFirstPersonLook({canvas,onMove=()=>{},onChange=()=>{}}){
 const doc=canvas.ownerDocument;let enabled=false,pending=false,disposed=false;
 const locked=()=>!disposed&&enabled&&doc?.pointerLockElement===canvas;
 function release(){if(doc?.pointerLockElement===canvas)doc.exitPointerLock?.();}
 function changed(){pending=false;onChange(locked());}
 function move(e){if(locked())onMove(e.movementX||0,e.movementY||0);}
 function escape(e){if(e.key==='Escape'&&locked()){release();e.preventDefault();e.stopImmediatePropagation();}}
 function blur(){release();}
 doc?.addEventListener('pointerlockchange',changed);doc?.addEventListener('pointerlockerror',changed);doc?.addEventListener('mousemove',move);doc?.addEventListener('keydown',escape,true);doc?.defaultView?.addEventListener('blur',blur);
 return{locked,setEnabled(value){enabled=!!value;if(!enabled)release();},capture(){if(disposed||!enabled||pending||locked()||typeof canvas.requestPointerLock!=='function')return false;pending=true;try{const request=canvas.requestPointerLock();request?.catch?.(()=>{pending=false;onChange(false);});return true;}catch{pending=false;onChange(false);return false;}},release,dispose(){if(disposed)return;release();disposed=true;doc?.removeEventListener('pointerlockchange',changed);doc?.removeEventListener('pointerlockerror',changed);doc?.removeEventListener('mousemove',move);doc?.removeEventListener('keydown',escape,true);doc?.defaultView?.removeEventListener('blur',blur);}};
}
