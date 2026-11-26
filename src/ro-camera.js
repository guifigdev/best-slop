// Keep the hero below the horizon without making ground attacks leave the view.
export const RO_CAMERA_DEFAULT_ELEVATION=.28;
export function roCameraAimHeight(distance=22){
 return Math.max(2.8,Math.min(4.8,(Number.isFinite(distance)?distance:22)*.12+1.5));
}

export const RO_CAMERA_PLAY_DISTANCE=18;
export function roCameraDistance(distance,{debug=false,freeZoom=false}={}){return debug&&freeZoom?Math.max(6,Math.min(120,Number.isFinite(distance)?distance:RO_CAMERA_PLAY_DISTANCE)):RO_CAMERA_PLAY_DISTANCE;}

export function roLeftDragCamera(weapons=[],manualSkill=false){const active=weapons.filter(w=>w&&!w.mount&&w.kind!=='passive');return !manualSkill&&active.length>0&&active.every(w=>w.auto!==false);}
export function roCameraDamp(current,wanted,dt,rate=18){return current+(wanted-current)*(1-Math.exp(-rate*Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0))));}
export function roFirstPersonPose({x=0,z=0,ground=0,eyeHeight=1.65,yaw=0,pitch=0}={}){const y=ground+Math.max(.7,eyeHeight);return{position:{x,y,z},look:{x:x-Math.sin(yaw)*Math.cos(pitch)*18,y:y+Math.sin(pitch)*18,z:z-Math.cos(yaw)*Math.cos(pitch)*18}};}
