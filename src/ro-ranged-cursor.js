import {roEquippedWeaponModel} from '../shared/ro-equipped-weapon.js';

// Native cursor stays at the actual mouse aim point in both camera modes.
export const RO_RANGED_RETICLE_SVG='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke-linecap="round"><path d="M16 3v7m0 12v7M3 16h7m12 0h7" stroke="#15251f" stroke-width="4"/><circle cx="16" cy="16" r="5" stroke="#15251f" stroke-width="3"/><path d="M16 3v7m0 12v7M3 16h7m12 0h7" stroke="#fff2cb" stroke-width="2"/><circle cx="16" cy="16" r="5" stroke="#fff2cb" stroke-width="1"/></g><circle cx="16" cy="16" r="1.5" fill="#fff2cb"/></svg>';
export const RO_RANGED_CURSOR=`url("data:image/svg+xml,${encodeURIComponent(RO_RANGED_RETICLE_SVG)}") 16 16, crosshair`;
export function roHasRangedWeapon(unit,basic){const model=roEquippedWeaponModel(unit);return model?['bow','cannon','staff','rod','crossstaff','book','lute','instrument','flask'].includes(model):basic?.kind==='projectile';}
