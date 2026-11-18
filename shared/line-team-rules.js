export const isLineTeams=state=>state?.options?.mode==='linewars'&&state.options.lineTeams===true;
export const lineTeamForSeat=seat=>1+Math.floor(seat/2);
export function lineOwnerTeam(state,owner){const lane=state?.lineWars?.lanes?.find(l=>l.owner===owner);if(Number.isInteger(lane?.team))return lane.team;const hero=state?.units?.find(u=>u.id===state.players?.[owner]);return hero?lineTeamForSeat(hero.seat):null;}
export function lineAllies(state,a,b){return a===b||isLineTeams(state)&&lineOwnerTeam(state,a)!==null&&lineOwnerTeam(state,a)===lineOwnerTeam(state,b);}
export function canRecruitAgainst(state,owner,target){if(!target||owner===target||lineAllies(state,owner,target))return false;const lane=state?.lineWars?.lanes?.find(l=>l.owner===target);return !!lane?.alive;}
export function lineTeamLabel(team){return team===1?'Equipe Azul':'Equipe Vermelha';}
export function lineTeamColor(team){return team===1?'#75b7eb':'#ef8a7b';}
