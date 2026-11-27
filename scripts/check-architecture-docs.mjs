import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
const root='docs/architecture',failures=[];let links=0;
for(const name of await readdir(root))if(name.endsWith('.md')){
 const file=path.join(root,name),text=await readFile(file,'utf8');
 if(text.includes('\ufffd'))failures.push(file+': replacement character');
 for(const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  const target=m[1].split('#')[0];if(!target||/^(?:https?:|mailto:)/.test(target))continue;
  links++;try{await access(path.resolve(path.dirname(file),decodeURIComponent(target)));}catch{failures.push(file+': missing '+target);}
 }
}
const inventory=JSON.parse(await readFile(path.join(root,'module-inventory.json'),'utf8'));
for(const m of inventory.modules){try{await access(m.path);}catch{failures.push('Inventory source missing: '+m.path);}}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(`Architecture docs: ${links} local links and ${inventory.modules.length} source paths resolved.`);
