export function debugModeEnabled(search=globalThis.location?.search||''){
 return [...new URLSearchParams(search)].some(([key,value])=>key.toLowerCase()==='debug'&&value.toLowerCase()==='true');
}
export const DEBUG_SHADERS=Object.freeze({off:'Padrão',toon:'Ilustração · cores em faixas',ink:'Contornos de tinta',dither:'Pixel pontilhado · dithering',retro:'Retrô · paleta reduzida',warm:'Luz quente · fantasia',silver:'Prata · tons de cinza'});
