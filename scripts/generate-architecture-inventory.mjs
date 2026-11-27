// Textual source inventory, not a JavaScript parser or a runtime call graph.
import {readdir,readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {RO_EQUIPMENT} from '../shared/ragnarok-equipment.js';
import {RO_SKILLS,RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {BONK_RULES} from '../shared/bonk-catalog.js';
import {RAGNAROK_VOXEL_REFERENCES} from '../shared/monster-visual-references.js';
const folders=['src','shared','server','scripts','tests','deploy','drizzle','.github/workflows'];
const sourceFiles=new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean));
async function walk(dir){const rows=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='assets')continue;const p=path.posix.join(dir,e.name);if(e.isDirectory())rows.push(...await walk(p));else if(sourceFiles.has(p)&&(/\.(js|mjs|py|sh|css|html|sql|ya?ml|toml|conf)$/.test(e.name)||e.name==='Dockerfile'))rows.push(p);}return rows.sort();}
const modules=[];
for(const dir of folders)for(const file of await walk(dir)){
 const source=await readFile(file,'utf8'),imports=[...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]),localImports=[...new Set(imports.filter(p=>p.startsWith('.')).map(p=>path.posix.normalize(path.posix.join(path.posix.dirname(file),p))))].sort(),externalImports=[...new Set(imports.filter(p=>!p.startsWith('.')))].sort();
 modules.push({path:file,bytes:(await stat(file)).size,lines:source.split('\n').length,localImports,externalImports,exports:[...new Set([...source.matchAll(/\bexport\s+(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]))],budgets:[...source.matchAll(/export const (\w*BUDGET\w*)\s*=\s*Object\.freeze\((\{[^\n]*?\})\)/g)].map(m=>({name:m[1],declaration:m[2]}))});
}
for(const file of ['index.html','package.json','package-lock.json','vite.config.js','wrangler.toml']){if(!sourceFiles.has(file))continue;try{const source=await readFile(file,'utf8');modules.push({path:file,bytes:(await stat(file)).size,lines:source.split('\n').length,localImports:[],externalImports:[],exports:[],budgets:[]});}catch(error){if(error.code!=='ENOENT')throw error;}}
const counts=Object.fromEntries(folders.map(dir=>[dir,modules.filter(m=>m.path.startsWith(dir+'/')).length]));
const assetSummary={};async function countAssets(dir){for(const e of await readdir(dir,{withFileTypes:true})){const file=path.posix.join(dir,e.name);if(e.isDirectory())await countAssets(file);else if(sourceFiles.has(file)){const ext=path.extname(e.name)||'(no extension)',row=assetSummary[ext]??={files:0,bytes:0};row.files++;row.bytes+=(await stat(file)).size;}}}await countAssets('src/assets');
const inventory={schema:1,description:'Textual inventory; binary assets are summarized by extension, not indexed as modules. Excludes generated build outputs. Imports/exports are approximate, not semantic analysis.',counts,assetSummary,catalogs:{skills:Object.keys(RO_SKILLS).length,lineages:Object.keys(RO_LINEAGES).length,equipment:Object.keys(RO_EQUIPMENT).length,weapons:Object.values(RO_EQUIPMENT).filter(d=>d.slot==='weapon').length,monsterReferences:Object.keys(RAGNAROK_VOXEL_REFERENCES).length,bonkRules:BONK_RULES},modules};
await mkdir('docs/architecture',{recursive:true});await writeFile('docs/architecture/module-inventory.json',JSON.stringify(inventory,null,2)+'\n');
let markdown='# Inventário dos módulos de código\n\nGerado por `node scripts/generate-architecture-inventory.mjs`. O índice é textual: imports/exports aproximados não substituem análise semântica ou o fluxo em runtime. Exclui assets binários, `dist/`, dependências instaladas e `outputs/`. Inclui catálogos gerados em JavaScript.\n\nOs [dados estruturados](module-inventory.json) também registram imports, exports encontrados e declarações de orçamento por arquivo.\n\n## Catálogos atuais\n\n'+Object.entries(inventory.catalogs).filter(([k])=>k!=='bonkRules').map(([k,v])=>`- ${k}: ${v}`).join('\n')+'\n\n';
markdown+='## Assets em disco\n\nResumo de `src/assets/`; bytes de arquivo não equivalem a memória decodificada, VRAM ou download inicial.\n\n| Extensão | Arquivos | Bytes |\n| --- | ---: | ---: |\n'+Object.entries(assetSummary).sort(([a],[b])=>a.localeCompare(b)).map(([ext,row])=>`| ${ext} | ${row.files} | ${row.bytes} |`).join('\n')+'\n\n';
for(const dir of folders){markdown+=`## ${dir} (${counts[dir]} módulos)\n\n| Módulo | Bytes de fonte | Imports locais encontrados |\n| --- | ---: | ---: |\n`;for(const m of modules.filter(m=>m.path.startsWith(dir+'/')))markdown+=`| [${m.path}](../../${m.path}) | ${m.bytes} | ${m.localImports.length} |\n`;markdown+='\n';}
markdown+='## Entradas e configuração na raiz\n\n'+modules.filter(m=>!m.path.includes('/')).map(m=>`- [${m.path}](../../${m.path})`).join('\n')+'\n';
await writeFile('docs/architecture/MODULE_INVENTORY.md',markdown);console.log(JSON.stringify({counts,catalogs:inventory.catalogs},null,2));
