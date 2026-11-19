import {PHASE_KILLER_MAP as MAP} from './phase-killer-catalog.js';
import {phaseKillerForestObstacles} from './phase-killer-world.js';

// Native forest contains ~1,000 solids per dimension. Keep one navigation
// object per game/realm so castle-navigation can reuse its geometry/hash cache.
// Transient navigation state never enters an authoritative room snapshot.
const games=new WeakMap();
export function phaseKillerNavigation(game,unit){
 const dimension=typeof unit==='string'?unit:unit?.pkDimension||'normal';
 let realms=games.get(game);if(!realms){realms=new Map();games.set(game,realms);}
 let nav=realms.get(dimension);if(!nav){nav={map:MAP[dimension]||MAP.normal,buildings:[],obstacles:phaseKillerForestObstacles(dimension),units:[],elapsed:-1};realms.set(dimension,nav);}
 const state=game.phaseKiller,fields=state?.fields||[],buildings=state?.buildings||[];
 if(nav.elapsed!==game.time||nav._state!==state||nav._fields!==fields||nav._fieldLength!==fields.length||nav._buildings!==buildings||nav._buildingLength!==buildings.length||nav._unitLength!==game.units.length){
  nav.buildings=[...buildings.filter(b=>b.alive&&b.dimension===dimension),...fields.filter(b=>b.alive!==false&&b.solid&&b.until>game.time&&b.dimension===dimension)];
  nav.units=game.units.filter(u=>u.alive&&u.pkDimension===dimension);nav.elapsed=game.time;nav._state=state;nav._fields=fields;nav._fieldLength=fields.length;nav._buildings=buildings;nav._buildingLength=buildings.length;nav._unitLength=game.units.length;
 }
 return nav;
}
