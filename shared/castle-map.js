export const CASTLE_MAP=Object.freeze({width:104,depth:56,minX:-52,maxX:52,minZ:-28,maxZ:28,grid:.5,castleHp:5000,castleArmor:8,castleArmorType:'fortified',tower:{x:0,z:0,radius:4},buildZones:[{team:1,minX:-50,maxX:-24,minZ:-24,maxZ:24},{team:2,minX:24,maxX:50,minZ:-24,maxZ:24}],castles:[{team:1,x:-43,z:0,w:3,d:5},{team:2,x:43,z:0,w:3,d:5}]});
export function castleMap(laneCount=2){const map=structuredClone(CASTLE_MAP),lanes=laneCount===1?[0]:[-9,9];map.lanes=lanes.map((z,id)=>({id,z,left:{x:-23,z},right:{x:23,z}}));map.laneCount=lanes.length;map.terrain=castleTerrain(map);return map;}
export function castlePoint(map,point){return Number.isFinite(point?.x)&&Number.isFinite(point?.z)?{x:Math.max(map.minX+.6,Math.min(map.maxX-.6,point.x)),z:Math.max(map.minZ+.6,Math.min(map.maxZ-.6,point.z))}:null;}
export const castleFootprint=(point,footprint={w:3,d:3})=>({x:point.x,z:point.z,w:footprint.w,d:footprint.d});
export function castleOverlap(a,b,margin=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+margin&&Math.abs(a.z-b.z)<(a.d+b.d)/2+margin;}
export function castleBuildPlacement(map,team,point,footprint,buildings=[]){
 const denied=(code,reason)=>({allowed:false,code,reason,point:null});
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z)||!Number.isFinite(footprint?.w)||!Number.isFinite(footprint?.d)||footprint.w<=0||footprint.d<=0)return denied('point','Escolha um ponto válido no terreno.');
 const grid=map.grid,p={x:Math.round(point.x/grid)*grid,z:Math.round(point.z/grid)*grid},zone=map.buildZones.find(area=>area.team===team),box=castleFootprint(p,footprint);
 if(!zone||p.x-box.w/2<zone.minX||p.x+box.w/2>zone.maxX||p.z-box.d/2<zone.minZ||p.z+box.d/2>zone.maxZ)return denied('territory','Construa inteiramente na área verde da sua equipe.');
 if(map.castles.some(castle=>castleOverlap(box,castle,.25)))return denied('castle','Deixe espaço livre ao redor do castelo.');
 const occupied=buildings.find(building=>building.alive!==false&&castleOverlap(box,building,.25));
 if(occupied)return denied('occupied',occupied.scenery?'Há uma árvore ou pedra neste espaço.':'Este espaço já está ocupado por uma construção.');
 return {allowed:true,code:'ready',reason:'Espaço livre · clique para construir.',point:p};
}
export function castleBuildPosition(...args){const result=castleBuildPlacement(...args);return result.allowed?result.point:null;}
import {CASTLE_LAYOUT} from './castle-catalog.js';
import {normalizeVoxelMap} from './voxel-map.js';

export const CASTLE_TERRAIN_PALETTE=Object.freeze([
 ['zdtr','Terra clara','#b6a27a'],['adrt','Terra de Ashenvale','#9b825e'],['agrs','Relva','#8ba96c'],['arck','Rocha','#929789'],['agrd','Relva escura','#68825c'],['avin','Vegetação rasteira','#73845e'],['adrg','Terra irregular','#a38b68'],['alvd','Folhas caídas','#8c8c57'],['vstp','Caminho de pedra','#b4af97']
].map(([id,name,color])=>({id,name,color,height:0,walkable:1})));
export const castleExpandX=x=>Math.sign(x)*(Math.abs(x)<=6?Math.abs(x)*4:24+(Math.abs(x)-6)*28/18);
const originalX=x=>Math.sign(x)*(Math.abs(x)<=24?Math.abs(x)/4:6+(Math.abs(x)-24)*18/28);
export function castleTerrain(map=CASTLE_MAP){
 const t=CASTLE_LAYOUT.terrain,width=52,height=28,tileSize=2,biomes=[],heights=[],walkable=[],lanes=map.lanes||[{z:-9},{z:9}];
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const x=-52+(col+.5)*2,z=-28+(row+.5)*2,c=Math.max(0,Math.min(t.width-1,Math.floor((originalX(x)-t.origin.x)/t.tileSize))),r=Math.max(0,Math.min(t.height-1,Math.floor((z/1.75-t.origin.z)/t.tileSize))),i=r*t.width+c,base=map.buildZones.some(b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ),road=Math.abs(x)<=24&&lanes.some(l=>Math.abs(z-l.z)<=3.2),tower=Math.hypot(x,z)<4;
  biomes.push(base?2:road||tower?8:t.biomes[i]);heights.push(base||road||tower?0:t.heights[i]);walkable.push(1);
 }
 return normalizeVoxelMap({version:1,id:'castle-fight-114b-expanded',name:'Castle Fight · Ashenvale ampliado',seed:114,width,height,tileSize,origin:{x:-52,z:-28},palette:CASTLE_TERRAIN_PALETTE,biomes,heights,walkable,markers:{},source:{kind:'adapted-extracted-terrain',reference:'Castle Fight v1.14b',originalWidth:t.width,originalHeight:t.height,note:'Biomas W3E reamostrados para104×56; bases verdes e planas, corredores alongados e vegetação afastada das rotas.'}});
}
export function castleReferenceScenery(map){return CASTLE_LAYOUT.doodads.filter(d=>['tree','rock'].includes(d.kind)).map((d,i)=>({id:`castle-native-scenery-${i}`,kind:d.kind==='rock'?'boulder':d.rawId==='ATtc'?'pine':'birch',x:castleExpandX(d.x),z:d.z*1.75,scale:Math.max(.35,Math.min(1.3,(d.scale?.[0]||1)*.8)),rotation:d.angle||0,nativeRawId:d.rawId,nativeX:d.x,nativeZ:d.z,nativeHeight:d.height})).filter(d=>Math.hypot(d.x,d.z)>4.5&&d.x>map.minX+1&&d.x<map.maxX-1&&d.z>map.minZ+1&&d.z<map.maxZ-1&&!map.buildZones.some(b=>d.x>b.minX-1.5&&d.x<b.maxX+1.5&&d.z>b.minZ-1.5&&d.z<b.maxZ+1.5)&&!map.lanes.some(l=>Math.abs(d.z-l.z)<4.6&&Math.abs(d.x)<25));}
