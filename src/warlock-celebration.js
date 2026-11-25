export function warlockCelebrationPose(unit,state,time,visualTime=time){
 if(state?.options?.mode!=='warlock'||!unit?.warlockCharacter)return null;
 const w=state.warlock,final=w?.phase==='finished',won=final?state.winningOwners?.includes(unit.owner):w?.lastResult?.winner?.owner===unit.owner&&time<(w.resultUntil||0);
 if(!won)return null;const age=final?visualTime:time-w.lastResult.at;
 return {y:.16+Math.abs(Math.sin(age*5))*.48,tilt:Math.sin(age*5)*.12,turn:Math.sin(age*2.4)*.45};
}
