export const RO_MOUNT_SKILLS=Object.freeze({kn_riding:'peco',rk_dragontraining:'dragon',ra_wugrider:'worg'});
export const roIsMount=key=>typeof key==='string'&&Object.hasOwn(RO_MOUNT_SKILLS,key);
export const roMountedKind=u=>u?.alive!==false&&roIsMount(u?.roMountSkill)&&u?.bonkBuild?.weapons?.[u.roMountSkill]>0?RO_MOUNT_SKILLS[u.roMountSkill]:null;
export function syncRoMount(u){
 const learned=Object.keys(RO_MOUNT_SKILLS).filter(k=>u.bonkBuild?.weapons?.[k]>0),known=u.roMountKnown;
 if(!Array.isArray(known)){if(u.roMountSkill===undefined)u.roMountSkill=learned.at(-1)||null;}
 else{const fresh=learned.filter(k=>!known.includes(k));if(fresh.length)u.roMountSkill=fresh.at(-1);}
 const fresh=Array.isArray(known)?learned.filter(k=>!known.includes(k)):learned;if(Array.isArray(u.bonkSkillSlots)){const slots=Array.from({length:13},(_,i)=>u.bonkSkillSlots[i]??null);for(const key of fresh){if(slots.includes(key))continue;const empty=slots.findIndex((k,i)=>i>0&&!k);if(empty>0)slots[empty]=key;}u.bonkSkillSlots=slots;}
 if(u.roMountSkill&&!learned.includes(u.roMountSkill))u.roMountSkill=null;
 u.roMountKnown=learned;return roMountedKind(u);
}
export function toggleRoMount(u,key){if(!roIsMount(key)||!u.alive||!u.bonkBuild?.weapons?.[key])return false;syncRoMount(u);u.roMountSkill=u.roMountSkill===key?null:key;return true;}
