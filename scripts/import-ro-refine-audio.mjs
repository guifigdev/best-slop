// Import the user's installed client sounds without running client code.
import {openRoArchive} from './ro-client-archive.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const archive=openRoArchive(process.argv[2]||'C:/Gravity/Ragnarok/data.grf');
try{
 const manifest=JSON.parse(readFileSync('src/assets/ro-audio/manifest.json','utf8'));
 manifest.refinement={strike:'effect/refine/bs_refine_1',success:'effect/bs_refinesuccess',failure:'effect/bs_refinefailed'};
 for(const key of Object.values(manifest.refinement)){
  const bytes=archive.read('data/wav/'+key+'.wav');if(!bytes)throw Error('Missing refine sound: '+key);
  const sha256=createHash('sha256').update(bytes).digest('hex'),file='original/'+sha256.slice(0,24)+'.wav';
  writeFileSync('src/assets/ro-audio/'+file,bytes);
  manifest.sounds[key]={file,sha256,bytes:bytes.length,midi:'midi/'+sha256.slice(0,24)+'.mid'};
 }
 writeFileSync('src/assets/ro-audio/manifest.json',JSON.stringify(manifest));
 console.log('Imported the native anvil, refine success and refine failure sounds.');
}finally{archive.close();}
