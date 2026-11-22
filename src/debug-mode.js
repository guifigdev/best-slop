export function debugModeEnabled(search=globalThis.location?.search||''){
 return [...new URLSearchParams(search)].some(([key,value])=>key.toLowerCase()==='debug'&&value.toLowerCase()==='true');
}
// The debug panel inspects the same visual styles as the normal menu. No
// second stack of experimental overlays is left on top of the selected style.
export const DEBUG_SHADERS=Object.freeze({off:'Estilo selecionado no menu Visual'});
