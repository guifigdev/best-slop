import {ragnarokMonsterSpec} from './ragnarok-monster-art.js';
import {voxelTagPortrait} from './tag-character-art.js';
import {NORDIC_MONSTER_KINDS,nordicMonsterPortrait} from './nordic-monster-art.js';
import {scarabPortrait} from './scarab-art.js';
// Original voxel-animal previews. They describe the troop, not its Warcraft
// reference role. Pure SVG strings keep the barracks UI independent of Three.
const eye=(x,y,color='#30483e')=>`<path d="M${x} ${y}h5v7h-5z" fill="${color}"/>`;
const wings=(main='#d9dfcd',dark='#9cafaa')=>`<path d="m8 29 21 9 9 19-23-7-9-10zm80 0-21 9-9 19 23-7 9-10z" fill="${main}"/><path d="m12 42 21 7 5 8-23-7zm72 0-21 7-5 8 23-7z" fill="${dark}"/>`;
const feet=(color='#a08c63')=>`<path d="M31 62h12v10H29V62zm23 0h12v10H53V62z" fill="${color}"/>`;
const muzzle=(color='#d7c49b')=>`<path d="M32 49h32v16H32z" fill="${color}"/><path d="M45 50h8v5h-8z" fill="#5b5c4b"/>`;
const face=(fur='#b59a72')=>`<path d="M27 27h42v33H27z" fill="${fur}"/>${eye(34,38)}${eye(57,38)}`;
const shapes={
 goblin:`<path d="M31 29h33v34H31z" fill="#e6e3c8"/><path d="M40 13h16v15H40zM36 19h7v9h-7z" fill="#be785d"/>${face('#f0e9cf')}<path d="M41 48h16v9H41z" fill="#dab368"/><path d="M68 40h16v24H68z" fill="#6d8d89"/><path d="M74 43h4v17h-4z" fill="#d5ba7e"/>${feet('#bd9b5d')}`,
 hedgehog:`<path d="m17 29 7-11 8 8 8-14 8 12 9-13 8 15 10-8 7 17-9 26H28z" fill="#817258"/><path d="M28 34h39v29H28z" fill="#b5a182"/><path d="M33 45h30v19H33z" fill="#e1cfab"/>${eye(34,37)}${eye(56,37)}<path d="M45 52h9v5h-9z" fill="#58614d"/>${feet('#8b7d60')}`,
 rhino:`<path d="M22 31h54v34H22z" fill="#8c9c94"/>${face('#a7b4a7')}<path d="M29 45h39v20H29z" fill="#bdc4b3"/><path d="m43 45 3-24 9-12 2 36z" fill="#eee2ba"/><path d="m46 21 9-12-2 36h-10z" fill="#c7c4ac"/>${eye(30,37)}${eye(63,37)}${feet('#7e9188')}`,
 griffin:`${wings()}<path d="M29 45h38v21H29z" fill="#cfb175"/><path d="M32 23h32v35H32z" fill="#e9e5cd"/><path d="M42 13h12v12H42z" fill="#d5decc"/>${eye(35,34)}${eye(56,34)}<path d="M41 45h20v10H41zM48 55h9v8h-9z" fill="#ddb85f"/>${feet('#bba16a')}`,
 brute:`<path d="M23 27h51v38H23z" fill="#8f7d69"/>${face('#aa947b')}<path d="M31 45h35v19H31z" fill="#c0ab8a"/><path d="M37 50h6v6h-6zm18 0h6v6h-6z" fill="#6c6856"/><path d="M26 47h7v14h-7zm39 0h7v14h-7z" fill="#e9dfba"/><path d="M25 18h11v13H25zm37 0h11v13H62z" fill="#8f7d69"/>${feet('#736d59')}`,
 frog:`<path d="M23 32h52v33H23z" fill="#8bb57a"/><path d="M27 18h18v24H27zm27 0h18v24H54z" fill="#b8cf91"/>${eye(33,25)}${eye(60,25)}<path d="M28 47h42v14H28z" fill="#d6dfad"/><path d="M33 53h31v3H33z" fill="#719367"/>${feet('#75a269')}`,
 ram:`<path d="M21 28h56v37H21z" fill="#d1d5bd"/><path d="M29 22h39v37H29z" fill="#b7bca5"/><path d="M16 20h14v10H15v17h10v8H9V27h7zm52 0h14v7h6v28H73v-8h9V30H68z" fill="#cbb58a"/>${eye(34,35)}${eye(58,35)}${muzzle('#e3dfbd')}${feet('#a4ad94')}`,
 lion:`<path d="m22 21 16-8h23l15 12 1 31-16 14H35L19 55z" fill="#997041"/><path d="M25 25h45v34H25z" fill="#bd8d48"/>${face('#d6b16f')}<path d="M32 49h32v15H32z" fill="#ecd7a5"/><path d="M44 49h10v6H44z" fill="#6a593f"/>${feet('#b78f56')}`,
 hare:`<path d="M28 29h41v35H28z" fill="#e5dfcf"/><path d="M29 4h13v30H29zm26 0h13v30H55z" fill="#e5dfcf"/><path d="M33 8h5v21h-5zm26 0h5v21h-5z" fill="#cdb3a5"/>${eye(34,39)}${eye(58,39)}${muzzle('#f2ebd9')}<path d="M45 50h9v5h-9z" fill="#bf9c96"/>${feet('#d7d6c4')}`,
 basilisk:`<path d="M19 35h56v28H19z" fill="#8faf66"/><path d="M32 26h39v34H32z" fill="#9dbc74"/><path d="M28 46h45v15H28z" fill="#c1d38b"/><path d="m14 35 7-12 7 12 7-17 8 14 7-20 7 17 8-15 7 14" fill="#c8d583"/>${eye(37,37)}${eye(61,37)}<path d="M19 56 8 61l-6-6 6 13 19-4z" fill="#709453"/><path d="M48 60h3v10h-3zm-4 8h4v4h-4zm7 0h4v4h-4z" fill="#ba8793"/>${feet('#7c9c59')}`,
 chimera:`${wings('#a58d9d','#79657f')}<path d="M23 43h51v22H23z" fill="#9f8079"/><path d="M33 20h30v37H33z" fill="#c29b70"/>${eye(37,31)}${eye(55,31)}<path d="M39 45h19v14H39z" fill="#e1c9a1"/><path d="M12 30h23v28H12z" fill="#b9bfaa"/><path d="M12 22h5v12h-5zm18 0h5v12h-5z" fill="#d8c697"/>${eye(16,39)}${eye(27,39)}<path d="M64 29h23v28H64z" fill="#8eb18d"/>${eye(68,37)}${eye(79,37)}<path d="M67 49h20v7H67z" fill="#ccdaa8"/>${feet('#876f6b')}`,
 wolf:`<path d="M28 28h40v36H28z" fill="#9baea4"/><path d="m27 30-4-19 18 16zm42 0 4-19-18 16z" fill="#c8d4be"/><path d="M32 43h32v21H32z" fill="#dce2cb"/>${eye(33,34,'#b79f60')}${eye(58,34,'#b79f60')}<path d="M44 47h10v7H44z" fill="#3e5a53"/><path d="M17 56 8 45l4 18 17 3z" fill="#91a59b"/>${feet('#82978c')}`,
 tortoise:`<path d="m17 36 13-14h34l16 17-7 22H23z" fill="#658968"/><path d="M28 28h39v24H28z" fill="#9cb384"/><path d="M35 25h24v7H35zm-11 8h15v12H24zm35 0h15v12H59z" fill="#b7c69a"/><path d="M32 45h32v21H32z" fill="#a9c08a"/>${eye(35,52)}${eye(56,52)}<path d="M40 61h16v3H40z" fill="#658468"/>${feet('#8ba571')}`,
 frostwyrm:`${wings('#b8e2e9','#89b9cf')}<path d="M35 25h27v34H35z" fill="#b1d9de"/><path d="M29 20h40v25H29z" fill="#d2e9df"/><path d="M35 9h7v14h-7zm22 0h7v14h-7z" fill="#e8f3e6"/>${eye(34,28,'#5c88a1')}${eye(59,28,'#5c88a1')}<path d="M39 42h29v9H39z" fill="#c2e2df"/><path d="m36 53-7 9-18-6 13 15h25l12-13-4-7-12 10z" fill="#83b4cb"/>`,
 lynx:`<path d="M27 29h42v34H27z" fill="#ba9f76"/><path d="m27 30-3-20 14 13zm42 0 3-20-14 13z" fill="#dac8a2"/><path d="M23 6h5v11h-5zm45 0h5v11h-5z" fill="#5c6450"/>${eye(34,37,'#567b69')}${eye(58,37,'#567b69')}${muzzle('#e5d5af')}${feet('#a18963')}`
};
export const ARMY_PORTRAIT_KINDS=Object.freeze([...new Set([...Object.keys(shapes),...NORDIC_MONSTER_KINDS,'scarab'])]);
const cache=new Map();
export function armyPortrait(kind){
 const scarab=scarabPortrait(kind);if(scarab)return scarab;
 const ref=ragnarokMonsterSpec(kind);if(ref){const key='ragnarok:'+ref.key;if(!cache.has(key))cache.set(key,voxelTagPortrait([...ref.parts,...ref.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...ref.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))],'shared-creature-portrait'));return cache.get(key);}

 const nordic=nordicMonsterPortrait(kind);if(nordic)return nordic;
 if(cache.has(kind))return cache.get(kind);
 const shape=shapes[kind]||'<path d="M29 30h38v29H29zM35 20h10v10H35zm19 0h10v10H54z" fill="#9ab2aa"/><path d="M42 41h13v9H42z" fill="#d4d7b7"/>';
 const svg=`<svg viewBox="0 0 96 80" class="army-portrait" aria-hidden="true"><path d="m5 65 43-12 43 12-43 13z" fill="#b5c1a0" opacity=".34"/><path d="m12 65 36-8 36 8-36 8z" fill="#8da298" opacity=".22"/>${shape}</svg>`;
 cache.set(kind,svg);return svg;
}
