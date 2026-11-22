import {sculptFenrir} from './fenrir-sculpture.js';
import {voxelTagPortrait} from './tag-character-art.js';

// Cosmetic identity only. Hero statistics, skills and summoning rules live in
// the shared simulation; this original geometry never changes those values.
export const FENRIR_ART=Object.freeze({name:'Fenrir',title:'O lobo de Gleipnir',description:'Um lobo colossal dos Nove Reinos, de ombros poderosos, pelo preto e violeta e ventre claro. Correntes partidas pendem da coleira e das patas; olhos e runas brilham em lilás.'});
let spec=null,portrait='';
const valid=value=>value==='fenrir'||value?.hero==='fenrir';
export function fenrirSpec(value='fenrir'){if(!valid(value))return null;return spec||=(Object.freeze(sculptFenrir()));}
export function buildFenrirModel(value,body,voxel){const s=fenrirSpec(value);if(!s)return null;for(const p of s.parts)voxel(body,...p);return s;}
export function fenrirPortrait(value='fenrir'){if(!valid(value))return '';if(portrait)return portrait;const s=fenrirSpec();portrait=voxelTagPortrait([...s.parts,...s.legs.flatMap(p=>p.parts?p.parts.map(q=>[q[0]+p.x,q[1]+p.y,q[2]+p.z,...q.slice(3)]):[[p.x,p.y,p.z,p.w,p.h,p.d,p.color]])],'nordic-hero-portrait fenrir-portrait');return portrait;}

// Descriptor values use the existing illustration registry's named palette
// and light/accent/bright/shade colour tokens. The caller maps semantic names
// onto its actual skill keys, keeping the drawing independent of gameplay.
export const FENRIR_SKILL_ILLUSTRATIONS=Object.freeze({
 fenrirFang:Object.freeze(['blood','<path d="m9 13 14 7 9-10 9 10 14-7-3 28-20 17-20-17z" fill="accent"/><path d="m18 28 14 5 14-5-4 15-10 10-10-10z" fill="light"/><path d="M19 27h8v5h-8zm18 0h8v5h-8z" fill="bright"/><path d="m20 38 5 2-1 10-5-7zm24 0-5 2 1 10 5-7z" fill="bright"/><path d="m26 36 6-4 6 4-6 5z" fill="shade"/>']),
 scarabSwarm:Object.freeze(['nature','<path d="m32 8 10 9 3 22-13 17-13-17 3-22z" fill="accent"/><path d="m32 12 6 9 3 18-9 11-9-11 3-18z" fill="light"/><path d="M31 23h3v26h-3z" fill="shade"/><path d="M18 24 7 19m12 15H5m14 9L9 52m37-28 11-5m-12 15h14m-14 9 10 9M26 17l-4-9m16 9 4-9" fill="none" stroke="accent" stroke-width="4"/><path d="m32 20 7 7-7 8-7-8z" fill="bright"/>']),
 packAura:Object.freeze(['nature','<ellipse cx="32" cy="46" rx="25" ry="11" fill="none" stroke="accent" stroke-width="4"/><path d="m18 23 8 4 6-8 6 8 8-4-3 17-11 10-11-10z" fill="light"/><path d="m9 10 6 3 4-6 4 6 6-3-2 13-8 7-8-7zm30 0 6 3 4-6 4 6 6-3-2 13-8 7-8-7z" fill="accent"/><path d="M24 32h5v4h-5zm11 0h5v4h-5z" fill="bright"/><path d="m27 40 5-3 5 3-5 5z" fill="shade"/>']),
 runicBarrier:Object.freeze(['gold','<path d="m32 7 22 9v22L32 58 10 38V16z" fill="accent"/><path d="m32 13 15 7v17L32 51 17 37V20z" fill="shade"/><path d="M30 18h5v28h-5zm-9 7 19 12 3-4-19-12z" fill="light"/><path d="m6 11 4 8-8-3zm49 32 7 3-7 4zM48 5l-2 10 8-6z" fill="bright"/><path d="M9 48h8v7H9zm40-21h8v7h-8z" fill="bright"/>']),
 spiritWard:Object.freeze(['arcane','<path d="M12 47V28L32 8l20 20v19L32 59z" fill="accent"/><path d="M18 43V29l14-14 14 14v14L32 52z" fill="shade"/><path d="m32 20 5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="light"/><path d="m32 27 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="bright"/><path d="M7 29v15m50-15v15M20 8l4 6m20-6-4 6" fill="none" stroke="bright" stroke-width="3"/>']),
 weakeningHowl:Object.freeze(['death','<path d="m14 49 6-17 8-5 1-16 8 6 8 17-4 10-7 6z" fill="light"/><path d="m28 29 12-6 11 6-11 10-12-1z" fill="accent"/><path d="M35 24h7v4h-7z" fill="bright"/><path d="m44 13 10-5m-6 16h12m-15 20 10 7" fill="none" stroke="accent" stroke-width="4"/><path d="m11 11 5 7-5 7-5-7zm43 19 5 7-5 7-5-7z" fill="shade"/><path d="M7 31h11v4H7zm-2 8h10v4H5z" fill="accent"/>'])
});
