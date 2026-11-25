"""Generate Renewal job/weapon ASPD facts; --fetch refreshes the pinned cache."""
import json,sys,urllib.request,yaml
from pathlib import Path
root=Path(__file__).resolve().parent.parent
pin='d4b8e7b8f16061cc2496d377ac8f777ce72a4f39'
cache=root/'outputs/rathena-job-aspd.yml'
if '--fetch' in sys.argv:
 cache.parent.mkdir(exist_ok=True)
 cache.write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/rathena/rathena/'+pin+'/db/re/job_aspd.yml',timeout=30).read())
facts={job.lower().replace('_',''):row['BaseASPD'] for row in yaml.safe_load(cache.read_text(encoding='utf8'))['Body'] for job in row['Jobs']}
facts['swordsman']=facts['swordman']
(root/'shared/ro-aspd-data.js').write_text('// Renewal weapon/job ASPD facts from rAthena '+pin+' db/re/job_aspd.yml.\nexport const RO_JOB_ASPD=Object.freeze('+json.dumps(facts,separators=(',',':'))+');\n',encoding='utf8')
