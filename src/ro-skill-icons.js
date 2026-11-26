import {roOriginalSkillIcon} from './ro-skill-icon-assets.js';
import {icon} from './art.js';
// Missing client icons are explicit pixel drawings, identified by their action.
const custom={
 yggwisps:['wisps','#aaf5cd',0],payonpetals:['flower','#f4a9ce',0],lunardew:['drop','#a2e4fc',0],
 dk_dragonic_breath:['dragon','#ff904e',0],mt_spark_blaster:['cannon','#ffcc53',0],mt_triple_laser:['laser','#80f8ff',3],mightySmash:['hammer','#f9ca78',0],bo_explosive_powder:['powder','#ffad6d',0],mayhemicthorns:['thorns','#cc8bf1',0],dk_dragonic_pierce:['spear','#ff974d',1],ig_radiant_spear:['spear','#fff1a1',0],ig_imperial_cross:['cross','#ffdb70',0],ig_imperial_pressure:['cross','#d9bdff',1],mt_rush_strike:['hammer','#ffa86b',1],mt_powerful_swing:['axe','#ffcb78',0],mt_energy_cannonade:['cannon','#a0e7ff',2],bo_mystery_powder:['powder','#c3a2ff',1],bo_dust_explosion:['powder','#f2cf95',2],shc_cross_slash:['blades','#df96f6',0],abc_hit_and_sliding:['blades','#86d7f2',1],abc_chasing_break:['blades','#ffbb6e',2],abc_chasing_shot:['arrow','#d6a5ff',0],abc_abyss_flame:['flame','#b886ed',0],ag_energy_conversion:['drop','#c6b3ff',1],em_psychic_stream:['wisps','#baa9ff',1],cd_divinus_flos:['flower','#fff0a9',1],iq_blazing_flame_blast:['flame','#ff9b65',1],wh_wild_walk:['tracks','#b6e1a3',0],tr_rhythmical_wave:['music','#99e8e1',0]
};
const drawings={
 wisps:'M7 12h5v2h2v5h-2v3H7v-3H5v-5h2z M20 6h5v2h2v5h-2v3h-5v-3h-2V8h2z M18 23h4v2h2v4h-6z',
 flower:'M13 5h6v7h7v6h-7v8h-6v-8H6v-6h7z M8 7h4v4H8z M21 20h4v4h-4z',
 drop:'M14 4h4v5h3v4h3v10h-3v4H11v-3H8V14h3v-5h3z',
 dragon:'M5 5h5v4h10V6h5v11h-6v3h7v3h-8v4h-6v-6H8v-6H5z M23 24h5v4h-5z',
 cannon:'M4 14h7v-4h13v3h4v9H11v-3H4z M10 23h5v5h-5z',
 laser:'M4 6h7v3H4z M12 8h16v2H12z M4 15h7v3H4z M12 17h16v2H12z M4 24h7v3H4z M12 26h16v2H12z',
 hammer:'M10 5h16v10H10z M16 15h4v13h-4z M3 19h3v3H3z M25 22h3v4h-3z',
 powder:'M11 12h11v14H11z M13 9h7v3h-7z M6 4h3v3H6z M23 5h4v4h-4z M4 16h3v3H4z M25 18h3v3h-3z',
 thorns:'M5 25v-9h3v4h4V9h3v7h3V5h3v11h5v-5h3v16H5z',
 spear:'M19 4h8v8h-3v3h-3v3h-4v4h-4v4H9v3H5v-4h3v-4h4v-4h4v-4h3z',
 cross:'M13 5h6v8h8v6h-8v9h-6v-9H5v-6h8z',
 axe:'M17 5h5v6h6v11h-8v-5h-3v12h-5V14H7V7h10z',
 blades:'M5 4h5v6h4v4h4v4h4v4h6v6h-6v-4h-4v-4h-4v-4h-4v-4H5z M23 4h5v7h-5v4h-4v-4h4z M5 23h5v-4h4v4h-4v5H5z',
 arrow:'M20 5h8v8h-4v-3h-3v5h-4v4h-4v4H9v5H5v-7h4v-4h4v-4h4V9h3z',
 flame:'M17 3h3v10h5v-4h3v15h-4v4H10v-3H6V15h4v5h3V9h4z',
 tracks:'M7 5h5v4h3v7h-4v4H7z M20 15h5v4h3v7h-4v4h-4z',
 music:'M10 5h17v17h-3v4h-6v-6h5V10H14v15h-3v4H5v-6h5z'
};
export const RO_CUSTOM_SKILL_ICONS=Object.freeze(custom);
export function roSkillIcon(entry){
 const key=typeof entry==='string'?entry:entry?.key,original=roOriginalSkillIcon(key);
 if(original)return `<img class="technique-illustration ro-pixel-skill-icon" data-ro-skill-icon="${key}" src="${original}" alt="" draggable="false" decoding="async">`;
 const authored=custom[key];
 if(!authored)return icon(typeof entry==='object'?entry?.skill||'cleave':'cleave');
 const [shape,tint,variant]=authored,accent=variant?`<path d="${variant===1?'M3 25h7v2H3z M22 2h7v2h-7z':variant===2?'M3 5h3v5H3z M26 24h3v5h-3z':'M3 4h3v3H3z'}" fill="#fff5ce"/>`:'';
 return `<svg class="technique-illustration ro-pixel-skill-icon" data-ro-skill-icon="${key}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><path fill="#111e2c" d="M0 0h32v32H0z"/><path fill="${tint}" opacity=".15" d="M2 2h28v28H2z"/><path fill="#070e18" d="${drawings[shape]}" transform="translate(1 1)"/><path fill="${tint}" d="${drawings[shape]}"/><path fill="#fff3cc" d="M14 14h4v4h-4z"/>${accent}<path fill="${tint}" opacity=".5" d="M0 0h32v1H0z M0 1h1v31H0z M31 1h1v31h-1z M1 31h30v1H1z"/></svg>`;
}
