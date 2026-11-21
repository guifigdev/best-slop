import {Raycaster,Plane,Vector2,Vector3} from 'three';

// Grab a point on the ground, then move the camera so that point follows the finger.
export function groundDragDelta(camera,rect,from,to){
 if(!(rect.width>0&&rect.height>0))return{x:0,z:0};
 const ray=new Raycaster(),plane=new Plane(new Vector3(0,1,0),-.2);
 const at=p=>{ray.setFromCamera(new Vector2((p.x-rect.left)/rect.width*2-1,-(p.y-rect.top)/rect.height*2+1),camera);return ray.ray.intersectPlane(plane,new Vector3());};
 const a=at(from),b=at(to);return a&&b?{x:a.x-b.x,z:a.z-b.z}:{x:0,z:0};
}

export function createCameraGestures({getMode=()=> 'pan',isCharacterOrbit=()=>false,onPan=()=>{},onRotate=()=>{},onZoom=()=>{},onTap=()=>{}}={}){
 const pointers=new Map();let moved=false,mode='pan',orbit=false;
 const pos=e=>({x:e.clientX,y:e.clientY});
 const pair=()=>{const [a,b]=[...pointers.values()].map(p=>p.last);return{center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.hypot(a.x-b.x,a.y-b.y)};};
 const reset=()=>{pointers.clear();moved=false;orbit=false;};
 return{
  get active(){return pointers.size>0;},
  down(e){if(e.pointerType!=='touch'&&e.button!==0&&e.button!==1)return false;if(!pointers.size){moved=false;orbit=isCharacterOrbit();mode=orbit||e.pointerType!=='touch'&&e.button===1?'rotate':getMode();}const p=pos(e);pointers.set(e.pointerId,{start:p,last:p,button:e.button,touch:e.pointerType==='touch'});if(pointers.size>1)moved=true;return true;},
  move(e){const p=pointers.get(e.pointerId);if(!p)return false;const next=pos(e);if(pointers.size>=2){const before=pair();p.last=next;const after=pair();if(orbit)onRotate(after.center.x-before.center.x,after.center.y-before.center.y);else onPan(before.center,after.center);if(before.distance>2&&after.distance>2)onZoom(before.distance/after.distance);return true;}
   const crossed=Math.hypot(next.x-p.start.x,next.y-p.start.y)>5;if(!moved&&!crossed){p.last=next;return true;}const previous=moved?p.last:p.start;moved=true;p.last=next;if(mode==='rotate')onRotate(next.x-previous.x,next.y-previous.y);else onPan(previous,next);return true;},
  up(e){const p=pointers.get(e.pointerId);if(!p)return false;this.move(e);pointers.delete(e.pointerId);const tap=!moved&&(mode==='pan'||orbit)&&(p.touch||p.button===0)&&!pointers.size;if(!pointers.size)moved=false;else for(const remaining of pointers.values())remaining.start={...remaining.last};if(tap)onTap(e);return true;},
  cancel(id){if(!pointers.has(id))return;pointers.delete(id);moved=pointers.size>0;for(const remaining of pointers.values())remaining.start={...remaining.last};},
  reset
 };
}
