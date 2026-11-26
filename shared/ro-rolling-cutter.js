// GC_ROLLINGCUTTER SplashArea by rank, in the same world units as other melee
// skills. Source: rAthena db/re/skill_db.yml, skill 2036.
export const RO_ROLLING_CUTTER_DURATION=.44;
export const roRollingCutterRadius=(level=1)=>[1,1,2,2,3][Math.max(0,Math.min(4,Math.floor(level)-1))];
export const roRollingCutterHandles=e=>['rollingcutter','axetornado'].includes(e?.skillKey)&&['roAttack','abilityPulse','roSkillImpact'].includes(e.type);
export function roRollingCutterPose(unit,effects,time){
 if(!unit?.bonkHero||!unit.alive||unit.roFrozenVisualUntil>time||unit.frozenUntil>time)return null;
 let event=null;for(const e of effects||[])if(e.source===unit.id&&['rollingcutter','axetornado'].includes(e.skillKey)&&e.type==='roAttack'&&e.time<=time&&time<e.time+(e.skillKey==='axetornado'?1.05:RO_ROLLING_CUTTER_DURATION)&&(!event||e.time>event.time))event=e;
 if(!event)return null;
 const axe=event.skillKey==='axetornado',duration=axe?1.05:RO_ROLLING_CUTTER_DURATION,age=time-event.time,start=Number.isFinite(event.spinStart)?Math.min(event.time,event.spinStart):event.time;
 let turn=(time-start)*Math.PI*2/.36;if(age>duration-.12){const from=(event.time-start+duration-.12)*Math.PI*2/.36,p=(age-duration+.12)/.12,ease=p*p*(3-2*p);turn=from+(Math.ceil(from/(Math.PI*2))*Math.PI*2-from)*ease;}
 return{active:true,spinKind:axe?'axe':'blades',turn,age,radius:event.radius||event.range||1,alpha:Math.min(1,(time-start)/.025,(duration-age)/.1),body:{x:.08,y:-.045,z:0},arms:axe?{right:{x:-1.35,y:.15,z:-.4,push:.03},left:{x:-.5,y:0,z:.3,push:0}}:{right:{x:-.08,y:1.05,z:.6,push:.04},left:{x:-.08,y:-1.05,z:-.6,push:.04}}};
}
