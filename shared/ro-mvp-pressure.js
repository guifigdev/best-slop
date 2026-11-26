import {MONSTER_HABITATS} from './ragnarok-habitats.js';

// Fixed boss requirements; equipment, player DPS and party level never enter
// this profile. Native roles keep fast flyers distinct from heavy melee MVPs.
const profile=values=>Object.freeze(values);
export const RO_MVP_PRESSURE=Object.freeze({
 heavy:profile({hp:1.18,damage:1.20,speed:1.20,attackInterval:1.0,specialInterval:4.8}),
 flyer:profile({hp:1.10,damage:1.12,speed:1.35,attackInterval:.9,specialInterval:4.4}),
 caster:profile({hp:1.12,damage:1.16,speed:1.22,attackInterval:1.05,specialInterval:4.2}),
 default:profile({hp:1.15,damage:1.16,speed:1.25,attackInterval:1.0,specialInterval:4.6}),
});
const recordsById=new Map(Object.values(MONSTER_HABITATS).map(record=>[record.sourceId,record]));
export function roMvpPressure(boss){
 const key=typeof boss==='string'?boss:boss?.ragnarokMvp||boss?.dungeonSpecies;
 const role=(MONSTER_HABITATS[key]||recordsById.get(boss?.roSourceId))?.role;
 return RO_MVP_PRESSURE[role]||RO_MVP_PRESSURE.default;
}
