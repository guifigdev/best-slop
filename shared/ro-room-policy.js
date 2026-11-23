// Skill restrictions belong to the room, never to the character checkpoint.
// Reapply after restoring a character/room and before publishing reconnects.
export function applyRoRoomPolicy(game){
 if(game?.options?.mode!=='bonk')return;
 const mode=game.options.bonkSkillMode==='class'?'class':'mixed';
 for(const unit of game.units||[])if(unit.bonkHero)unit.roSkillMode=mode;
}
