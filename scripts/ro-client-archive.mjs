// Read-only GRF 2/3 container reader. The GRF-specific DES primitive is supplied
// by grf-loader (MIT); no client executable or Lua code is ever run.
import {openSync,readSync,closeSync,statSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createRequire} from 'node:module';
const {GrfNode}=createRequire(import.meta.url)('grf-loader');
export function openRoArchive(filename){
 const fd=openSync(filename,'r'),size=statSync(filename).size,read=(offset,length)=>{if(!Number.isSafeInteger(offset)||length<0||offset+length>size)throw Error('GRF read outside archive');const b=Buffer.alloc(length);if(readSync(fd,b,0,length,offset)!==length)throw Error('Truncated GRF');return b;};
 try{
  const h=read(0,46),version=h.readUInt32LE(42);if(![0x200,0x300].includes(version)||!['Master of Magic','Event Horizon'].some(s=>h.subarray(0,s.length).toString()===s))throw Error('Unsupported GRF');
  const offset=(version===0x300?Number(h.readBigUInt64LE(30)):h.readUInt32LE(30))+46,head=read(offset,version===0x300?12:8),packed=head.readUInt32LE(version===0x300?4:0),raw=head.readUInt32LE(version===0x300?8:4);if(raw>100*1024*1024)throw Error('GRF table exceeds import budget');
  const table=inflateSync(read(offset+head.length,packed),{maxOutputLength:raw});if(table.length!==raw)throw Error('GRF table length mismatch');
  const decoder=new TextDecoder('euc-kr'),entries=new Map(),codec=new GrfNode(fd);let i=0;
  while(i<table.length){const end=table.indexOf(0,i);if(end<0||end-i>1024)throw Error('Invalid GRF filename');const name=decoder.decode(table.subarray(i,end)).replaceAll('\\','/').toLowerCase();i=end+1;const entry={name,compressedSize:table.readUInt32LE(i),lengthAligned:table.readUInt32LE(i+4),realSize:table.readUInt32LE(i+8),type:table[i+12],offset:(version===0x300?Number(table.readBigUInt64LE(i+13)):table.readUInt32LE(i+13))+46};i+=version===0x300?21:17;if(entry.type&1)entries.set(name,entry);}
  return {entries,version,read(name){const e=entries.get(name.toLowerCase().replaceAll('\\','/'));if(!e)return null;if(e.realSize>32*1024*1024)throw Error('GRF member exceeds import budget');const value=Buffer.from(codec.decodeEntry(read(e.offset,e.lengthAligned),e));if(value.length!==e.realSize)throw Error('GRF member length mismatch');return value;},close(){closeSync(fd);}};
 }catch(error){closeSync(fd);throw error;}
}
