export const RO_TOWER_LAYOUT=Object.freeze({version:1,minX:-31,maxX:31,minZ:-40,maxZ:40,width:62,depth:80});
export const RO_TOWER_REFERENCES=Object.freeze({encounters:'https://github.com/rathena/rathena/blob/master/npc/instances/EndlessTower.txt',appearance:'https://ragnarokonline.gungho.jp/navi/gamedata/images/memorial-dungeon/endlesstower-ss01.jpg'});
export function roTowerHeightAt(map,x,z){
 if(!map?.tower)return 0;
 // Physics and art use the same broad, shallow treads.
 return Math.abs(x)<6.6&&z<-27?Math.min(1.8,Math.floor(Math.max(0,-27-z)/1.35)*.2):0;
}
