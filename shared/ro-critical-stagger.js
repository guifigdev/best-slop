import {roRecordHitReaction} from './ro-contact-combat.js';
export const RO_CRITICAL_STAGGER=Object.freeze({duration:.14,interval:.5});
export function roCriticalStagger(enemy,source,elapsed,time=elapsed){
 if(!enemy?.alive||enemy.hp<=0||!enemy.bonkEnemy||elapsed<(enemy.roCritStaggerReadyAt||0))return false;
 enemy.roCritStaggerUntil=elapsed+RO_CRITICAL_STAGGER.duration;
 enemy.roCritStaggerReadyAt=elapsed+RO_CRITICAL_STAGGER.interval;
 roRecordHitReaction(enemy,source,time);return true;
}
