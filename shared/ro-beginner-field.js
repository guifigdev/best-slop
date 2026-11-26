// Native LATAM entry-monster values, checked 2026-11-26. The field keeps these
// requirements fixed; levelling, gear and elapsed time do not buff its monsters.
export const RO_BEGINNER_MONSTERS=Object.freeze({
 poring:Object.freeze({hp:55,damage:7.5,level:1,speed:2.5,source:'https://latamro.com/monstro/1002/'}),
 lunatic:Object.freeze({hp:48,damage:13.5,level:3,speed:5,source:'https://latamro.com/monstro/1063/'}),
 fabre:Object.freeze({hp:59,damage:18.5,level:6,speed:2.5,source:'https://latamro.com/monstro/1007/'})
});
export function roBeginnerMonster(key,{regionKey,activity,boss,guardian,elite}={}){return regionKey==='prontera'&&activity!=='tower'&&!boss&&!guardian&&!elite?RO_BEGINNER_MONSTERS[key]||null:null;}
