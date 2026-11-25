"""Import numerical LATAM wiki skill facts from a cached MediaWiki response.
Fetch cache with --fetch; no upstream source code is executed or embedded.
"""
import ast,html,json,re,unicodedata,urllib.request,urllib.parse,concurrent.futures,sys,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'outputs/ro-latam-skill-wiki.json'
if '--fetch' in sys.argv:
 def api(params):
  url='https://wiki.latamro.com/api.php?'+urllib.parse.urlencode({'format':'json','formatversion':2,**params})
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'CustomHeroSourceImporter/1.0'}),timeout=60) as response:return json.load(response)
 titles=set(json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{RO_SKILLS}from'./shared/ragnarok-jobs.js';console.log(JSON.stringify(Object.values(RO_SKILLS).map(s=>s.name)))"],cwd=ROOT,text=True)))
 continuation={}
 while True:
  result=api({'action':'query','list':'categorymembers','cmtitle':'Categoria:Ofensiva','cmlimit':500,'cmnamespace':0,**continuation})
  titles.update(p['title'] for p in result.get('query',{}).get('categorymembers',[]))
  if 'continue' not in result:break
  continuation=result['continue']
 old=json.loads(CACHE.read_text(encoding='utf-8')) if CACHE.exists() else [];by_title={p['title']:p for p in old};titles=sorted(titles)
 for i in range(0,len(titles),30):
  result=api({'action':'query','prop':'revisions','rvprop':'ids|timestamp|content','rvslots':'main','redirects':1,'titles':'|'.join(titles[i:i+30])})
  for page in result.get('query',{}).get('pages',[]):
   for rev in page.get('revisions',[]):
    slot=rev.get('slots',{}).get('main',{});slot['*']=slot.get('content',slot.get('*',''))
   by_title[page['title']]=page
 CACHE.parent.mkdir(exist_ok=True);CACHE.write_text(json.dumps(list(by_title.values()),ensure_ascii=False),encoding='utf-8')

def plain(s):
 s=re.sub(r'\[\[(?:[^]|]*\|)?([^]]+)\]\]',r'\1',s)
 return html.unescape(re.sub('<[^>]+>','',s)).strip()
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',plain(s).lower()) if unicodedata.category(c)!='Mn')
def table_ratios(s):
 for table in re.findall(r'\{\|.*?\|\}',s,re.S):
  header=norm(re.split(r'!\s*\d+\s*\n',table,maxsplit=1)[0])
  if not re.search(r'\batq[m]?\b|dano',header):continue
  values={}
  for row in table.split('|-'):
   m=re.search(r'^\s*!\s*(\d{1,2})\s*(?:\n|\|\|)',row,re.M)
   if not m:continue
   cells=row[m.end():];p=re.search(r'(?<![\d+])([\d.]+(?:,\d+)?)\s*%',cells)
   if p:values[int(m[1])]=float(p[1].replace('.','').replace(',','.'))
  if len(values)>1 and 1 in values:return [values.get(i,values[max(k for k in values if k<=i)]) for i in range(1,max(values)+1)]
 return None
REPLACE=[(r'nv\.?\s*(?:de\s*)?base(?:\s*do usuario)?','baseLevel'),(r'nv\.?\s*de classe(?:\s*do usuario)?','jobLevel'),(r'nv\.?\s*da\s*(?:habilidade|habil\.?|hab\.?)','level'),(r'dano base|atq base','baseRatio'),(r'int(?:\s*base|\s*do usuario)?','int'),(r'for(?:\s*base|\s*do usuario)?','str'),(r'des(?:\s*base|\s*do usuario)?','dex'),(r'agi(?:\s*base|\s*do usuario)?','agi'),(r'vit(?:\s*base|\s*do usuario)?','vit'),(r'sor(?:\s*base)?','luk'),(r'pod','pow'),(r'fei','spl'),(r'con','con'),(r'crt','crt')]
def expression(code):
 s=norm(code);s=re.sub(r'nv\. da hab\.', 'nv. da habilidade',s);s=s.split('=',1)[-1].strip().rstrip('% ')
 s=s.replace('×','*').replace('÷','/').replace(' x ',' * ').replace('0,9 ~ 1,1','1').replace('0,9~1,1','1')
 s=re.sub(r'(?<=\d),(?=\d)', '.',s)
 # Explicit learned support levels, never inferred from the offensive rank.
 deps={'pericia com armadilha':'RA_RESEARCHTRAP','garras de aco':'HT_STEELCROW','pesquisa de pocoes':'AM_LEARNINGPOTION','dominio musical':'WM_LESSON','encantar com terremoto':'SA_SEISMICWEAPON','encantar com geada':'SA_FROSTWEAPON','golpe fulminante':'SM_BASH','pericia com escudo':'CR_SHIELDMASTERY','presenca de palco':'TR_STAGE_MANNER'}
 for label,key in deps.items():s=re.sub(r'nv\.?\s*de\s*'+label, 'skill_'+key,s)
 for pattern,value in REPLACE:s=re.sub(r'\b(?:'+pattern+r')\b',value,s)
 s=s.replace('atq basico','100').replace('atqm','magicAttack').replace('atq','physicalAttack')
 s=s.translate(str.maketrans({'[':'(',']':')','{':'(','}':')'}))
 # Wiki equations contain several unmatched cosmetic square brackets.
 out='';depth=0
 for c in s:
  if c=='(':depth+=1
  if c==')':
   if depth==0:continue
   depth-=1
  out+=c
 s=out+')'*depth
 try:
  tree=ast.parse(s,mode='eval')
  for node in ast.walk(tree):
   if not isinstance(node,(ast.Expression,ast.BinOp,ast.UnaryOp,ast.Add,ast.Sub,ast.Mult,ast.Div,ast.Pow,ast.USub,ast.UAdd,ast.Constant,ast.Name,ast.Load)):return None
   if isinstance(node,ast.Name) and node.id not in {'level','baseLevel','jobLevel','baseRatio','str','agi','vit','int','dex','luk','pow','spl','con','crt','physicalAttack','magicAttack'} and not node.id.startswith('skill_'):return None
  return s
 except (SyntaxError,ValueError):return None
pages=json.loads(CACHE.read_text(encoding='utf-8'));rows={};unsupported=[]
for p in pages:
 if 'revisions' not in p:continue
 rev=p['revisions'][0];s=rev['slots']['main']['*'];m=re.search(r'\|\s*Sdbname\s*=\s*(\w+)',s)
 if not m or norm(re.search(r'\|\s*tipo\s*=([^\n]+)',s)[1] if re.search(r'\|\s*tipo\s*=([^\n]+)',s) else '')!='ofensiva':continue
 key=m[1];ratios=table_ratios(s);codes=[plain(c) for c in re.findall('<code>(.*?)</code>',s,re.S) if re.match(r'(?:ATQ|Dano)',plain(c),re.I)];code=codes[0] if codes else None;expr=expression(code) if code else None
 before=s.split('== Notas')[0];magic=bool(re.search(r'dano\s+magico',norm(before))) or bool(code and code.startswith('ATQM')) or bool(ratios and '[[ATQM]]' in before)
 if expr and 'baseRatio' in expr and not ratios:expr=None
 if not ratios and not expr:unsupported.append({'aegis':key,'title':p['title'],'reason':'no supported numerical damage equation/table'});continue
 if code and not expr:
  unsupported.append({'aegis':key,'title':p['title'],'reason':'complex equation needs explicit implementation','formula':code})
  # Do not silently replace stat-dependent formulas by their base table.
  continue
 row={'title':p['title'],'source':'https://wiki.latamro.com/wiki/'+urllib.parse.quote(p['title'].replace(' ','_')),'revision':rev.get('revid'),'magic':magic}
 if ratios:row['ratios']=ratios
 if expr:row['expression']=expr;row['formula']=code
 if expr and (('physicalAttack' in expr or 'magicAttack' in expr) and '%' not in code or key in ['HT_LANDMINE','HT_BLASTMINE','HT_CLAYMORETRAP','HT_FREEZINGTRAP','HT_BLITZBEAT']):row['unit']='flat'
 row['baseLevelScaling']=bool(expr and 'baseLevel' in expr)
 rows[key]=row
# Exact fixed-per-hit classic bolts have no percentage table.
for key in ['MG_FIREBOLT','MG_COLDBOLT','MG_LIGHTNINGBOLT','WZ_EARTHSPIKE','WZ_HEAVENDRIVE']:
 if key not in rows:rows[key]={'title':key,'source':'https://wiki.latamro.com/wiki/'+{'MG_FIREBOLT':'Lan%C3%A7as_de_Fogo','MG_COLDBOLT':'Lan%C3%A7as_de_Gelo','MG_LIGHTNINGBOLT':'Rel%C3%A2mpago','WZ_EARTHSPIKE':'Estacas','WZ_HEAVENDRIVE':'Coluna_de_Pedra'}[key],'magic':True,'expression':'100 * level'}
rows['WZ_METEOR']={'title':'Chuva de Meteoros','source':'https://wiki.latamro.com/wiki/Chuva_de_Meteoros','magic':True,'expression':'125'}
text='// Numerical damage facts from LATAM wiki revisions. Generated by scripts/import-ro-latam-combat.py.\nexport const RO_LATAM_DAMAGE_DATA=Object.freeze('+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+');\n'
(ROOT/'shared/ro-latam-damage-data.js').write_text(text,encoding='utf-8')
(ROOT/'outputs/ro-latam-formula-audit.json').write_text(json.dumps({'supported':len(rows),'unsupported':unsupported},ensure_ascii=False,indent=2),encoding='utf-8')
print('Supported equations/tables',len(rows),'complex/missing',len(unsupported))
