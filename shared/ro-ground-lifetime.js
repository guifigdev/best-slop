// Simulation time only: pausing a run never consumes the loot window.
export const RO_GROUND_LIFETIME=Object.freeze({equipment:180,recipe:180,consumable:90,gold:60,xp:60});
export const roGroundLifetime=pickup=>RO_GROUND_LIFETIME[pickup?.type]??Infinity;
export const roGroundRemaining=pickup=>Math.max(0,roGroundLifetime(pickup)-Math.max(0,Number(pickup?.age)||0));
export const roGroundExpired=pickup=>roGroundRemaining(pickup)<=0;
export function roGroundFade(pickup){const remaining=roGroundRemaining(pickup);return remaining>=15?1:Math.max(0,remaining/15)*(.72+.28*Math.sin(remaining*5)**2);}
