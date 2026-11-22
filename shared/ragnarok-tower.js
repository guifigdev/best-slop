import {dominantRoHabitat,habitatScene} from './ro-encounters.js';
import {roLineage,roJob} from './ragnarok-jobs.js';
import {RO_ENDLESS_FLOORS} from './ragnarok-endless-tower.js';
export const RO_TOWER_FLOORS=RO_ENDLESS_FLOORS.length;
export function roFloorRegion(floor,roster){return habitatScene(dominantRoHabitat(roster||planRoTowerFloor(floor)));}
export function roFloorInfo(floor){const n=Math.max(1,Math.min(RO_TOWER_FLOORS,Math.floor(floor)||1));return {floor:n,region:roFloorRegion(n),boss:n%5===0||n===RO_TOWER_FLOORS,final:n===RO_TOWER_FLOORS,jobTier:Math.min(3,n-1)};}
export function roFloorJob(lineage,floor){return roJob(roLineage(lineage).key,roFloorInfo(floor).jobTier);}
export function planRoTowerFloor(floor,random=()=>.5){const data=RO_ENDLESS_FLOORS[Math.max(0,Math.min(RO_TOWER_FLOORS-1,Math.floor(floor)-1))],groups=[...data.monsters];if(data.randomGroups){const {draws,pool}=data.randomGroups;for(let i=0;i<draws;i++){const roll=Math.max(0,Math.min(.999999,Number(random())||0));groups.push(...pool[Math.floor(roll*pool.length)].monsters);}}return groups.map(m=>({...m}));}
