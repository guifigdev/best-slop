// Small standard-MIDI reader/player data model. Tempo changes, running status,
// note-off pairing and GM drum channel are retained; no third-party synthesizer.
export function parseRoMidi(input){
 const bytes=new Uint8Array(input),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let at=0;const text=n=>{const s=String.fromCharCode(...bytes.subarray(at,at+n));at+=n;return s;},u16=()=>{const n=v.getUint16(at);at+=2;return n;},u32=()=>{const n=v.getUint32(at);at+=4;return n;},variable=()=>{let n=0;for(let i=0;i<4;i++){const b=bytes[at++];n=(n<<7)|(b&127);if(!(b&128))return n;}throw Error('Invalid MIDI variable integer');};
 if(text(4)!=='MThd')throw Error('Invalid MIDI header');const header=u32(),format=u16(),tracks=u16(),division=u16();if(header<6||format>1||tracks>64||division&0x8000||!division)throw Error('Unsupported MIDI');at+=header-6;const raw=[],tempos=[{tick:0,tempo:500000}];
 for(let track=0;track<tracks;track++){if(text(4)!=='MTrk')throw Error('Invalid MIDI track');const end=at+4+u32();let tick=0,running=0;
  while(at<end){tick+=variable();let status=bytes[at++];if(status<128){at--;status=running;}else if(status<240)running=status;
   if(status===255){const type=bytes[at++],n=variable();if(type===81&&n===3)tempos.push({tick,tempo:(bytes[at]<<16)|(bytes[at+1]<<8)|bytes[at+2]});at+=n;continue;}if(status===240||status===247){at+=variable();continue;}
   const kind=status&240,channel=status&15;if(kind<128||kind>224)throw Error('Invalid MIDI status');const a=bytes[at++],b=kind===192||kind===208?0:bytes[at++];if(kind===128||kind===144)raw.push({tick,channel,key:a,velocity:b,on:kind===144&&b>0});
  }at=end;
 }
 tempos.sort((a,b)=>a.tick-b.tick);const seconds=tick=>{let total=0,previous=0,tempo=500000;for(const change of tempos){if(change.tick>tick)break;total+=(change.tick-previous)*tempo/(division*1e6);previous=change.tick;tempo=change.tempo;}return total+(tick-previous)*tempo/(division*1e6);},active=new Map(),notes=[];raw.sort((a,b)=>a.tick-b.tick||Number(a.on)-Number(b.on));
 for(const e of raw){const key=e.channel+':'+e.key;if(e.on){const old=active.get(key);if(old)notes.push({...old,duration:Math.max(.01,seconds(e.tick)-old.at)});active.set(key,{at:seconds(e.tick),key:e.key,velocity:e.velocity/127,channel:e.channel});}else{const start=active.get(key);if(start){notes.push({...start,duration:Math.max(.01,seconds(e.tick)-start.at)});active.delete(key);}}}
 notes.sort((a,b)=>a.at-b.at);return {notes,duration:Math.max(.05,...notes.map(n=>n.at+n.duration))};
}
