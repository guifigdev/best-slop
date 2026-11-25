// Eight authored pose holds study the official ready/combat sprite silhouettes.
// They are a short anticipation -> thrust/cross-cut -> recovery, not an ACT rip.
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const phases=['ready','anticipation','launch','strike','strike','recoil','recover','settle'];
const frame=(index,body,right,left)=>({frame:index,phase:phases[index],active:true,body:{x:body[0],y:body[1],z:body[2]},arms:{right:{x:right[0],y:right[1]||0,z:right[2]||0,push:right[3]||0},left:{x:left[0],y:left[1]||0,z:left[2]||0,push:left[3]||0}}});
const THIEF=freeze([
 frame(0,[.04,-.015,0],[.05,0,0],[0,0,0]),
 frame(1,[.15,-.075,-.035],[.25,-.10,.08],[-.16,0,.04]),
 frame(2,[.20,-.06,.04],[-.55,-.18,-.05,.02],[-.35,.1,.12]),
 frame(3,[.27,-.045,.12],[-1.08,.13,-.24,.035],[-.50,.10,.18]),
 frame(4,[.20,-.03,.08],[-.85,.20,-.10,.02],[-.30,.05,.12]),
 frame(5,[.10,-.02,.035],[-.38,.07,-.03],[-.15,0,.06]),
 frame(6,[.02,0,0],[-.08,0,0],[0,0,0]),
 frame(7,[0,0,0],[0,0,0],[0,0,0])
]);
const ASSASSIN=freeze([
 frame(0,[.08,-.02,0],[.12,0,-.04],[.05,0,.04]),
 frame(1,[.18,-.10,-.025],[.33,-.1,-.10],[.18,.10,.1]),
 frame(2,[.23,-.075,.04],[-.68,-.15,-.16,.02],[-.30,.12,.12]),
 frame(3,[.25,-.055,.105],[-1,.12,-.24,.03],[-.50,-.08,.16,.01]),
 frame(4,[.23,-.045,.085],[-.50,.16,-.12,.01],[-1.04,-.12,.24,.03]),
 frame(5,[.15,-.03,.04],[-.25,.07,-.08],[-.60,-.06,.1,.01]),
 frame(6,[.04,-.01,.01],[-.06,0,-.02],[-.18,0,.02]),
 frame(7,[0,0,0],[0,0,0],[0,0,0])
]);
const IDLE=freeze({frame:-1,phase:'idle',active:false,body:{x:0,y:0,z:0},arms:{right:{x:0,y:0,z:0,push:0},left:{x:0,y:0,z:0,push:0}}});
export const RO_THIEF_COMBAT_FRAMES=freeze({thief:THIEF,assassin:ASSASSIN});
export function roThiefCombatPose(age,duration=.48,job='thief'){
 if(!Number.isFinite(age)||!Number.isFinite(duration)||duration<=0||age<0||age>=duration)return IDLE;
 const frames=RO_THIEF_COMBAT_FRAMES[job]||THIEF;return frames[Math.min(7,Math.floor(age/duration*8))];
}

// Studied against the installed client's Assassin male ATTACK3 ACT (11 * 8
// directions; dagger uses ATTACK2). Reinterpreted in shoulder-space geometry:
// low ready -> right cut -> left follow-through -> raised guard -> recovery.
// Reference routing: roBrowserLegacy src/DB/Jobs/WeaponAction.js.
const KATAR=freeze([
 frame(0,[.08,-.02,0],[.12,0,-.10],[.05,0,.10]),
 frame(1,[.16,-.07,-.015],[.25,-.28,-.16],[.12,.20,.18]),
 frame(2,[.24,-.055,.08],[-.94,.42,-.35,.04],[-.20,-.10,.18]),
 frame(3,[.25,-.05,.11],[-1.06,.52,-.48,.055],[-.48,-.32,.24,.02]),
 frame(4,[.22,-.045,.085],[-.42,.12,-.13,.01],[-1.12,-.48,.42,.05]),
 frame(5,[.14,-.025,.04],[-.16,0,-.06],[-.72,-.24,.24,.02]),
 frame(6,[.04,-.01,.01],[-.04,0,0],[-1.65,.08,.12]),
 frame(7,[0,0,0],[0,0,0],[0,0,0])
]);
export const RO_KATAR_COMBAT_FRAMES=KATAR;
export function roKatarCombatPose(age,duration=.48){
 if(!Number.isFinite(age)||!Number.isFinite(duration)||duration<=0||age<0||age>=duration)return IDLE;
 return KATAR[Math.min(7,Math.floor(age/duration*8))];
}
