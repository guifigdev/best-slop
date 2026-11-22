import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';

export function roomPassword(value='') {
 if(typeof value!=='string'||value.length>64)throw Error('A senha deve ter até 64 caracteres.');
 return value;
}
export function lockRoom(value) {
 const password=roomPassword(value);if(!password)return null;
 const salt=randomBytes(16).toString('hex');
 return {salt,hash:scryptSync(password,salt,32).toString('hex')};
}
export function canEnterRoom(lock,value) {
 const password=roomPassword(value);if(!lock)return true;
 const actual=scryptSync(password,lock.salt,32),expected=Buffer.from(lock.hash,'hex');
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
