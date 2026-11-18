export const MAX_VOXEL_MAP_SIZE=64;
export const DEFAULT_VOXEL_PALETTE=Object.freeze([
 {id:'water',name:'Água',color:'#6396b7',height:-.25,walkable:0,obstacleHeight:.2},
 {id:'grass',name:'Relva',color:'#94ac72',height:0,walkable:1},
 {id:'forest',name:'Bosque',color:'#3e6b4a',height:.15,walkable:0,obstacleHeight:2},
 {id:'road',name:'Caminho',color:'#c1b18c',height:.04,walkable:1},
 {id:'stone',name:'Pedra',color:'#a5a5a0',height:.12,walkable:1},
 {id:'cliff',name:'Penhasco',color:'#625d69',height:1.5,walkable:0,obstacleHeight:1.5},
 {id:'lava',name:'Lava',color:'#d66d39',height:-.1,walkable:1},
 {id:'snow',name:'Neve',color:'#dce7e7',height:.2,walkable:1}
].map(entry=>Object.freeze(entry)));
export const DEFAULT_MAP_PALETTE=DEFAULT_VOXEL_PALETTE;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const rounded=value=>Number(value.toFixed(6));
const isArray=value=>Array.isArray(value)||ArrayBuffer.isView(value)&&!(value instanceof DataView);
const finite=(value,name,min,max)=>{if(!Number.isFinite(value)||value<min||value>max)throw Error(`${name}: valor inválido.`);return value;};
const dimension=(value,name,max=MAX_VOXEL_MAP_SIZE)=>{finite(value,name,1,max);if(!Number.isInteger(value))throw Error(`${name}: use um inteiro.`);return value;};
function colorHex(value){
 if(Number.isInteger(value)&&value>=0&&value<=0xffffff)return '#'+value.toString(16).padStart(6,'0');
 if(typeof value==='string'&&/^#[0-9a-f]{3}$/i.test(value))return '#'+value.slice(1).split('').map(c=>c+c).join('').toLowerCase();
 if(typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))return value.toLowerCase();
 throw Error('Paleta: use uma cor hexadecimal #rrggbb.');
}
function rgb(color){const hex=colorHex(color);return[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255);}
function hsv([r,g,b]){const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=0;if(delta){if(max===r)h=((g-b)/delta)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h=(h/6+1)%1;}return[h,max?delta/max:0,max];}
function hsvDistance(a,b){const delta=Math.abs(a[0]-b[0]),h=Math.min(delta,1-delta)*2,s=a[1]-b[1],v=a[2]-b[2];return 4*h*h*Math.min(a[1],b[1])**2+s*s+.8*v*v;}
function normalizePalette(input=DEFAULT_VOXEL_PALETTE){
 if(!Array.isArray(input)||!input.length||input.length>32)throw Error('Paleta: forneça entre 1 e 32 biomas.');const ids=new Set();
 return input.map((entry,index)=>{if(!entry||typeof entry.id!=='string'||!/^[a-z][a-z0-9_-]{0,31}$/.test(entry.id)||ids.has(entry.id))throw Error('Paleta: ids inválidos ou repetidos.');ids.add(entry.id);const walkable=entry.walkable??1;if(walkable!==0&&walkable!==1)throw Error('Paleta: walkable deve ser 0 ou 1.');const result={id:entry.id,name:String(entry.name||entry.id).slice(0,60),color:colorHex(entry.color),height:finite(entry.height??0,`Altura do bioma ${index}`,-32,64),walkable};if(entry.obstacleHeight!==undefined)result.obstacleHeight=finite(entry.obstacleHeight,'Altura do obstáculo',.01,32);return result;});
}
function pointInside(map,point){return Number.isFinite(point?.x)&&Number.isFinite(point?.z)&&point.x>=map.origin.x&&point.z>=map.origin.z&&point.x<map.origin.x+map.width*map.tileSize&&point.z<map.origin.z+map.height*map.tileSize;}
function normalizeMarkers(input={},map){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Marcadores inválidos.');
 const point=(entry,label)=>{if(entry===null||entry===undefined)return null;if(!pointInside(map,entry))throw Error(`Marcador ${label} está fora do mapa.`);const result={x:rounded(entry.x),z:rounded(entry.z)};for(const key of ['id','name','unitKey'])if(entry[key]!==undefined)result[key]=String(entry[key]).slice(0,80);return result;};
 const list=(key,max)=>{const value=input[key]??[];if(!Array.isArray(value)||value.length>max)throw Error(`Lista ${key} inválida.`);return value.map((entry,i)=>{const result=point(entry,`${key}[${i}]`);if(!result)throw Error(`Marcador ${key}[${i}] vazio.`);return result;});};
 return{spawn:point(input.spawn,'spawn'),portal:point(input.portal,'portal'),fountain:point(input.fountain,'fountain'),heroSpawn:point(input.heroSpawn,'heroSpawn'),shops:list('shops',64),buildings:list('buildings',128),path:list('path',4096)};
}
function sourceCopy(input){if(input===undefined)return undefined;let text;try{text=JSON.stringify(input);}catch{throw Error('Origem do mapa inválida.');}if(!text||text.length>12000)throw Error('Metadados de origem muito grandes.');return JSON.parse(text);}

export function normalizeVoxelMap(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Mapa inválido.');if(input.version!==1)throw Error('Versão de mapa não suportada.');
 const width=dimension(input.width,'Largura'),height=dimension(input.height,'Altura'),tileSize=finite(input.tileSize??1,'Tamanho do tile',.125,4),palette=normalizePalette(input.palette),length=width*height;
 if(!isArray(input.biomes)||input.biomes.length!==length)throw Error('A matriz de biomas precisa ter width × height entradas.');
 const biomes=Array.from(input.biomes,(value,index)=>{if(!Number.isInteger(value)||value<0||value>=palette.length)throw Error(`Bioma inválido no tile ${index}.`);return value;});
 const heights=input.heights??biomes.map(value=>palette[value].height),walkable=input.walkable??biomes.map(value=>palette[value].walkable);
 if(!isArray(heights)||heights.length!==length||!isArray(walkable)||walkable.length!==length)throw Error('Matrizes de altura/passagem com tamanho inválido.');
 const origin=input.origin??{x:-width*tileSize/2,z:-height*tileSize/2};
 const map={version:1,width,height,tileSize,origin:{x:finite(origin.x,'Origem X',-1e6,1e6),z:finite(origin.z,'Origem Z',-1e6,1e6)},biomes,heights:Array.from(heights,(value,index)=>finite(value,`Altura do tile ${index}`,-32,64)),walkable:Array.from(walkable,(value,index)=>{if(value!==0&&value!==1)throw Error(`Passagem inválida no tile ${index}; use 0 ou 1.`);return value;}),palette};
 map.markers=normalizeMarkers(input.markers,map);for(const key of ['id','name','heightSource'])if(input[key]!==undefined)map[key]=String(input[key]).slice(0,180);if(input.seed!==undefined)map.seed=finite(input.seed,'Seed',0,0xffffffff)>>>0;const source=sourceCopy(input.source);if(source!==undefined)map.source=source;return map;
}

function imageInput(input,label){
 if(!input||typeof input!=='object')throw Error(`${label}: imagem inválida.`);const width=dimension(input.width,`${label}: largura`,8192),height=dimension(input.height,`${label}: altura`,8192);if(width*height>16777216||!isArray(input.data)||input.data.length!==width*height*4)throw Error(`${label}: pixels RGBA inválidos ou imagem muito grande.`);return{width,height,data:input.data};
}
function blockSample(image,col,row,width,height,grayscale=false){
 const x0=Math.floor(col*image.width/width),x1=Math.max(x0+1,Math.floor((col+1)*image.width/width)),y0=Math.floor(row*image.height/height),y1=Math.max(y0+1,Math.floor((row+1)*image.height/height));let r=0,g=0,b=0,total=0;
 for(let y=y0;y<Math.min(y1,image.height);y++)for(let x=x0;x<Math.min(x1,image.width);x++){const i=(y*image.width+x)*4,red=image.data[i],green=image.data[i+1],blue=image.data[i+2],alpha=image.data[i+3];for(const value of [red,green,blue,alpha])if(!Number.isFinite(value)||value<0||value>255)throw Error('Pixels RGBA devem estar entre 0 e 255.');if(grayscale&&(red!==green||red!==blue))throw Error('O mapa de altura precisa estar em tons de cinza.');const a=alpha/255;r+=red*a;g+=green*a;b+=blue*a;total+=a;}
 return total?[r/total/255,g/total/255,b/total/255]:null;
}

export function convertMapPixels(input,options={}){
 const image=imageInput(input,'Imagem'),scale=Math.min(1,MAX_VOXEL_MAP_SIZE/Math.max(image.width,image.height));let width=options.width??Math.max(1,Math.round(image.width*scale)),height=options.height??Math.max(1,Math.round(image.height*scale));
 if(options.width!==undefined&&options.height===undefined)height=Math.max(1,Math.round(options.width*image.height/image.width));else if(options.height!==undefined&&options.width===undefined)width=Math.max(1,Math.round(options.height*image.width/image.height));
 dimension(width,'Largura da matriz');dimension(height,'Altura da matriz');const palette=normalizePalette(options.palette),paletteColors=palette.map(entry=>hsv(rgb(entry.color))),heightMap=options.heightMap?imageInput(options.heightMap,'Mapa de altura'):null;
 const heightMin=finite(options.heightMin??options.minHeight??0,'Altura mínima',-32,64),heightMax=finite(options.heightMax??options.maxHeight??4,'Altura máxima',-32,64);if(heightMax<heightMin)throw Error('A altura máxima precisa ser maior ou igual à mínima.');const transparentBiome=Number.isInteger(options.transparentBiome)?options.transparentBiome:0;if(transparentBiome<0||transparentBiome>=palette.length)throw Error('Bioma transparente inválido.');
 const biomes=[],heights=[],walkable=[];for(let row=0;row<height;row++)for(let col=0;col<width;col++){const sample=blockSample(image,col,row,width,height);let best=transparentBiome;if(sample){const color=hsv(sample);let score=Infinity;for(let i=0;i<paletteColors.length;i++){const next=hsvDistance(color,paletteColors[i]);if(next<score){score=next;best=i;}}}biomes.push(best);walkable.push(palette[best].walkable);const gray=heightMap?blockSample(heightMap,col,row,width,height,true):null;heights.push(heightMap?rounded(heightMin+(gray?.[0]??0)*(heightMax-heightMin)):palette[best].height);}
 return normalizeVoxelMap({version:1,width,height,tileSize:options.tileSize??1,origin:options.origin,palette,biomes,heights,walkable,markers:options.markers,name:options.name||'Mapa importado',heightSource:heightMap?'grayscale-heightmap':'biome-estimate',source:{kind:'image',exactHeights:!!heightMap,note:heightMap?'Altura relativa linear do mapa de cinza fornecido.':'Altura estimada por bioma; as cores do minimapa não codificam relevo exato.'}});
}

export function mapTileAt(map,x,z){
 if(!pointInside(map,{x,z}))return null;const col=Math.floor((x-map.origin.x)/map.tileSize),row=Math.floor((z-map.origin.z)/map.tileSize),index=row*map.width+col,biome=map.biomes[index];return{index,col,row,x:map.origin.x+(col+.5)*map.tileSize,z:map.origin.z+(row+.5)*map.tileSize,biome,palette:map.palette[biome],height:map.heights[index],walkable:map.walkable[index]};
}

export function mapObstacles(input,offset={x:0,z:0}){
 const map=normalizeVoxelMap(input),dx=finite(offset.x??0,'Deslocamento X',-1e6,1e6),dz=finite(offset.z??0,'Deslocamento Z',-1e6,1e6),used=new Uint8Array(map.width*map.height),obstacles=[];
 const same=(index,biome,band)=>index>=0&&index<used.length&&!used[index]&&!map.walkable[index]&&map.biomes[index]===biome&&Math.round(map.heights[index]*4)===band;
 for(let row=0;row<map.height;row++)for(let col=0;col<map.width;col++){const index=row*map.width+col;if(used[index]||map.walkable[index])continue;const biome=map.biomes[index],band=Math.round(map.heights[index]*4);let w=1,d=1;while(col+w<map.width&&same(index+w,biome,band))w++;outer:while(row+d<map.height){for(let x=0;x<w;x++)if(!same((row+d)*map.width+col+x,biome,band))break outer;d++;}for(let z=0;z<d;z++)for(let x=0;x<w;x++)used[(row+z)*map.width+col+x]=1;const entry=map.palette[biome];obstacles.push({id:`map-${col}-${row}`,type:entry.id,map:true,x:rounded(dx+map.origin.x+(col+w/2)*map.tileSize),z:rounded(dz+map.origin.z+(row+d/2)*map.tileSize),w:rounded(w*map.tileSize),d:rounded(d*map.tileSize),h:entry.obstacleHeight??Math.max(.25,Math.abs(map.heights[index])),height:map.heights[index],biome});}
 return obstacles;
}

export function validateMapPath(input){
 const map=normalizeVoxelMap(input),errors=[],markers=map.markers;
 if(!markers.spawn||!markers.portal)return{valid:false,errors:['Marque a entrada e o portal.'],path:[]};
 const tile=point=>mapTileAt(map,point.x,point.z),center=index=>({x:map.origin.x+(index%map.width+.5)*map.tileSize,z:map.origin.z+(Math.floor(index/map.width)+.5)*map.tileSize});
 const route=(from,to)=>{const a=tile(from),b=tile(to);if(!a?.walkable||!b?.walkable)return null;const parents=new Int32Array(map.width*map.height).fill(-1),queue=[a.index];parents[a.index]=a.index;for(let p=0;p<queue.length&&parents[b.index]===-1;p++){const current=queue[p],x=current%map.width,z=Math.floor(current/map.width);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,next=nz*map.width+nx;if(nx<0||nz<0||nx>=map.width||nz>=map.height||!map.walkable[next]||parents[next]!==-1)continue;parents[next]=current;queue.push(next);}}if(parents[b.index]===-1)return null;const result=[];let p=b.index;while(p!==a.index){result.push(center(p));p=parents[p];}result.push(center(a.index));return result.reverse();};
 const points=[markers.spawn,...markers.path,markers.portal],path=[];for(let i=1;i<points.length;i++){const segment=route(points[i-1],points[i]);if(!segment){errors.push(`Trecho ${i} do caminho está bloqueado.`);break;}path.push(...segment.slice(path.length?1:0));if(path.length>4096){errors.push('O caminho excede 4096 passos.');break;}}
 for(const [label,point]of [['fonte',markers.fountain],['herói',markers.heroSpawn],...markers.shops.map(p=>[p.id||'loja',p])])if(point&&!route(markers.spawn,point))errors.push(`O marcador ${label} não é alcançável.`);
 return{valid:errors.length===0,errors,path:errors.length?[]:path};
}
