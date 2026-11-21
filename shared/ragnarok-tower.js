import {roLineage,roJob} from './ragnarok-jobs.js';
import {RO_ENDLESS_FLOORS} from './ragnarok-endless-tower.js';
export const RO_TOWER_FLOORS=100;
const REGIONS=['grove','payon','crypt','forge','glacier','geffen'];
export function roFloorRegion(floor){return REGIONS[Math.floor((Math.max(1,floor)-1)/5)%REGIONS.length];}
export function roFloorInfo(floor){const n=Math.max(1,Math.min(100,Math.floor(floor)||1));return {floor:n,region:roFloorRegion(n),boss:n%5===0,final:n===100,jobTier:Math.min(3,n-1)};}
export function roFloorJob(lineage,floor){return roJob(roLineage(lineage).key,roFloorInfo(floor).jobTier);}
export function planRoTowerFloor(floor,random=()=>.5){const data=RO_ENDLESS_FLOORS[Math.max(0,Math.min(99,Math.floor(floor)-1))],groups=[...data.monsters];if(data.randomGroups){const {draws,pool}=data.randomGroups;for(let i=0;i<draws;i++){const roll=Math.max(0,Math.min(.999999,Number(random())||0));groups.push(...pool[Math.floor(roll*pool.length)].monsters);}}return groups.map(m=>({...m}));}
