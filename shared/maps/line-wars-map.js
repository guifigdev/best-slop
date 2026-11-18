import preset from './line-wars-map.json' with {type:'json'};
import {normalizeVoxelMap} from '../voxel-map.js';
export const LINE_WARS_MAP_PRESET=preset;
export function defaultLineWarsMap(){return normalizeVoxelMap(preset);}
