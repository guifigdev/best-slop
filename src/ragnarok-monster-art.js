import {RAGNAROK_VOXEL_REFERENCES,monsterVisualReference} from '../shared/monster-visual-references.js';
import {ragnarokCaveSpec} from './ragnarok-cave-art.js';
import {ragnarokElementSpec} from './ragnarok-element-art.js';
export function ragnarokMonsterKey(value){
 if(value?.hero||value?.castleUnit||value?.castleBuilderKey)return null;
 if(typeof value==='string')return Object.hasOwn(RAGNAROK_VOXEL_REFERENCES,value)?value:monsterVisualReference(value);
 return Object.hasOwn(RAGNAROK_VOXEL_REFERENCES,value?.ragnarokVisual)?value.ragnarokVisual:monsterVisualReference(value?.dungeonSpecies,value?.dungeonBiome||value?.bonkBiome);
}
export function ragnarokMonsterSpec(value){const key=ragnarokMonsterKey(value);return key?(ragnarokCaveSpec(key)||ragnarokElementSpec(key)):null;}
