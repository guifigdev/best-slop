export const TEAM_COLORS=[0xe43b36,0x2866ec,0xf1c52e,0x14c6df,0xce36d8];
export const teamColor=team=>TEAM_COLORS[((team>=10?team-10:Math.max(0,(team||1)-1))%TEAM_COLORS.length)];
export const teamHex=team=>'#'+teamColor(team).toString(16).padStart(6,'0');
