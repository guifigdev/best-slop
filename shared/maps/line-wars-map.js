import preset from './line-wars-map.json' with {type:'json'};
import {normalizeVoxelMap} from '../voxel-map.js';
import {fjordPortalsMap} from './fjord-portals-map.js';
export const HISTORICAL_LINE_WARS_MAP_PRESET=preset;
export const LINE_WARS_MAP_PRESET=fjordPortalsMap();
export function historicalLineWarsMap(){return normalizeVoxelMap(preset);}
export function defaultLineWarsMap(){return normalizeVoxelMap(LINE_WARS_MAP_PRESET);}
