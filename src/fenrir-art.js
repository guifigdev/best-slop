import {voxelTagPortrait} from './tag-character-art.js';

// Cosmetic identity only. Hero statistics, skills and summoning rules live in
// the shared simulation; this original geometry never changes those values.
export const FENRIR_ART=Object.freeze({name:'Fenrir',title:'O lobo de Gleipnir',description:'Um lobo colossal dos Nove Reinos, de juba cinzenta, presas de marfim e olhos de gelo. Runas douradas marcam as algemas que ele desafia.'});
let spec=null,portrait='';
const valid=value=>value==='fenrir'||value?.hero==='fenrir';
export function fenrirSpec(value='fenrir'){
 if(!valid(value))return null;if(spec)return spec;
 const parts=[],legs=[],wings=[],b=(...p)=>parts.push(p),fur=0x6b7784,shadow=0x485967,light=0x99a8ae,ivory=0xe6dfc5,gold=0xc2ac70,deep=0x2c414b,ice=0xbfe5dc;
 // Broad shoulders, tapered waist, lifted neck and a long squared muzzle keep
 // the silhouette distinctly wolf-like even at the orthographic game scale.
 b(0,1.08,-.2,1.23,1.12,1.88,fur);b(0,1.29,.56,1.4,1.28,1.01,shadow);b(0,1.48,.65,1.19,1.11,.94,fur);b(0,1.89,.94,1.03,.85,.99,fur);b(0,1.65,1.55,.89,.46,.81,light);b(0,1.53,1.58,.69,.22,.75,ivory);b(0,1.82,1.91,.7,.26,.25,deep);b(0,1.95,2.03,.4,.07,.06,0x87999a);
 // Open jaw, two large fangs and bright narrow eyes; the restrained palette
 // distinguishes the character without relying on a permanent glow shader.
 b(0,1.53,1.89,.65,.09,.25,deep);b(0,1.36,1.65,.69,.17,.63,shadow);b(0,1.37,1.99,.5,.11,.12,light);
 for(const side of [-1,1]){
  b(side*.36,1.48,1.74,.12,.37,.16,ivory);b(side*.38,1.3,1.82,.13,.13,.21,0xf0e7cb);b(side*.34,2.02,1.47,.2,.12,.06,ice);b(side*.33,2.01,1.51,.06,.09,.025,0xf0f1cf);b(side*.35,2.15,1.41,.39,.16,.18,shadow);
  b(side*.39,2.41,.77,.34,.64,.39,fur);b(side*.39,2.5,.94,.17,.35,.08,0x344e5a);b(side*.41,2.75,.76,.25,.12,.28,light);
  // Stepped mane flares backwards rather than rounded cartoon ears or cheeks.
  b(side*.65,1.6,.42,.4,.53,.65,light);b(side*.75,1.28,.25,.31,.38,.58,fur);b(side*.65,1.84,.1,.35,.39,.53,fur);b(side*.5,1.88,-.25,.3,.23,.64,light);b(side*.62,1.02,-.14,.27,.42,.54,shadow);
  // Gleipnir neck loops are angular voxel bands, not texture decals.
  b(side*.68,1.34,.72,.12,.57,.6,gold);b(side*.63,1.67,.75,.17,.13,.64,0xd9c58a);
 }
 b(0,1.36,1.05,1.2,.13,.12,gold);b(0,1.12,1.08,.43,.39,.13,0x8e9c94);b(0,1.12,1.16,.24,.25,.06,gold);b(0,1.12,1.21,.06,.18,.025,ivory);b(0,1.12,1.22,.17,.045,.025,ivory);
 // Spinal tufts, pale chest and a raised thick tail are visible from above.
 b(0,1.54,-.52,.72,.34,1.1,shadow);b(0,1.79,-.58,.38,.22,.79,light);b(0,.88,.82,.6,.65,.26,light);b(0,.64,.94,.39,.24,.2,ivory);b(0,.75,-1.24,.44,.43,.76,shadow);b(0,1.02,-1.69,.45,.46,.6,fur);b(0,1.3,-1.96,.43,.5,.4,fur);b(0,1.49,-2.13,.35,.35,.34,light);b(0,1.55,-2.31,.25,.23,.2,ivory);
 for(const side of [-1,1])for(const z of [-.8,.66]){
  const x=side*.43,front=z>0,h=front?.72:.66;
  legs.push({x,y:h/2+.04,z,w:.35,h,d:.46,color:shadow});
  // Paws remain on the moving leg descriptors so both the model and avatar
  // include all four feet and no humanoid model can leak into this skin.
  b(x,.16,z+.12,.43,.23,.62,light);for(const toe of [-.12,.12])b(x+toe,.1,z+.45,.08,.1,.15,ivory);
  if(front){b(x,.47,z,.46,.16,.55,gold);b(x+side*.25,.47,z,.11,.17,.25,0x8a9b97);}
 }
 const height=Math.max(...parts.map(p=>p[1]+p[4]/2));spec=Object.freeze({key:'fenrir',theme:'nordic-hero',parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs.map(Object.freeze)),wings:Object.freeze(wings),fur,muzzle:light,height,eyeLine:2.02,motion:'quadruped'});return spec;
}
export function buildFenrirModel(value,body,voxel){const data=fenrirSpec(value);if(!data)return null;for(const p of data.parts)voxel(body,...p);return data;}
export function fenrirPortrait(value='fenrir'){if(!valid(value))return '';if(portrait)return portrait;const s=fenrirSpec();portrait=voxelTagPortrait([...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],'nordic-hero-portrait fenrir-portrait');return portrait;}

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
