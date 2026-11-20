import {ragnarokNatureExpansionSpec} from './ragnarok-nature-expansion-art.js';
import {ragnarokDarkExpansionSpec} from './ragnarok-dark-expansion-art.js';
import {ragnarokMvpSpec} from './ragnarok-mvp-art.js';
import {ragnarokForestSpec} from './ragnarok-forest-art.js';
import {ragnarokCavernSpec} from './ragnarok-cavern-art.js';
import {ragnarokCryptIceSpec} from './ragnarok-crypt-ice-art.js';
import {RAGNAROK_VOXEL_REFERENCES,monsterVisualReference} from '../shared/monster-visual-references.js';
import {ragnarokCaveSpec} from './ragnarok-cave-art.js';
import {ragnarokElementSpec} from './ragnarok-element-art.js';
export function ragnarokMonsterKey(value){
 if(value?.hero||value?.castleBuilderKey||(value?.summon&&!value?.ragnarokVisual))return null;
 if(typeof value==='string')return Object.hasOwn(RAGNAROK_VOXEL_REFERENCES,value)?value:monsterVisualReference(value);
 return Object.hasOwn(RAGNAROK_VOXEL_REFERENCES,value?.ragnarokVisual)?value.ragnarokVisual:monsterVisualReference(value?.dungeonSpecies||value?.kind,value?.dungeonBiome||value?.bonkBiome);
}
export function ragnarokMonsterSpec(value){const key=ragnarokMonsterKey(value);return key?(ragnarokCaveSpec(key)||ragnarokElementSpec(key)||ragnarokForestSpec(key)||ragnarokCavernSpec(key)||ragnarokCryptIceSpec(key)||ragnarokNatureExpansionSpec(key)||ragnarokDarkExpansionSpec(key)||ragnarokMvpSpec(key)):null;}

export function ragnarokMonsterModelKey(unit){const key=!unit?.castleUnit&&ragnarokMonsterKey(unit);return key?'ragnarok:'+key:null;}
