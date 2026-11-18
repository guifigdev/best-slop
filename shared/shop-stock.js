import {ITEMS} from './catalog.js';
import {lineTeamForSeat} from './line-team-rules.js';
export function freshShopStock(guaranteed=false){return Object.fromEntries(Object.entries(ITEMS).map(([key,item])=>[key,guaranteed?Math.max(1,item.stock||0):item.stock]));}
export function stockForHero(state,hero){return state?.options?.mode==='linewars'&&state.options.lineTeams?state.teamStock?.[lineTeamForSeat(hero?.seat||0)]||{}:state?.stock||{};}
