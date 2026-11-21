// Keep the hero below the horizon without making ground attacks leave the view.
export const RO_CAMERA_DEFAULT_ELEVATION=.28;
export function roCameraAimHeight(distance=22){
 return Math.max(2.8,Math.min(4.8,(Number.isFinite(distance)?distance:22)*.12+1.5));
}
