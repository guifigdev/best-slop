import {cameraDestination} from './camera-navigation.js';

// Switch once at a round transition; inspecting or dragging the map stays free.
export function createBloodyCamera({getState,getOwner,view={}}){
 let stageKey=null,zone='base';
 function focus(next){zone=next;const state=getState();if(state)view.focusPoint?.(cameraDestination(state,getOwner(),next));return zone;}
 function update(){const state=getState();if(state?.options?.mode!=='bloody'){stageKey=null;return;}const round=state.bloodyTournament,stage=round?.stage||'preparation',key=(round?.round||0)+':'+stage;if(key===stageKey)return;stageKey=key;focus(stage==='preparation'?'base':'battle');}
 return{update,focus,get zone(){return zone;},reset(){stageKey=null;zone='base';}};
}
