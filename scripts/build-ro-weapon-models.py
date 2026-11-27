"""Sculpt solid, stepped voxel volumes from the existing item silhouettes.

The result contains coloured boxes, never texture planes. Three depth layers
form a bevelled cross section; each item keeps its own silhouette and palette.
"""
import json
import math
import subprocess
from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
items=json.loads(subprocess.check_output(['node','--input-type=module','-e',
 "import{RO_EQUIPMENT as E}from'./shared/ragnarok-equipment.js';console.log(JSON.stringify(Object.values(E).filter(w=>w.slot==='weapon').map(({key,sourceId,weaponType,hands})=>({key,sourceId,weaponType,hands}))))"],cwd=ROOT,text=True))
models={}
for item in items:
    path=ROOT/'src/assets/ro-equipment-icons'/f"{item['sourceId']}.png"
    if not path.exists():
        continue  # Authored solid family fallback covers the six modern items.
    im=Image.open(path).convert('RGBA');pixels=[]
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=im.getpixel((x,y))
            if a>=160:
                pixels.append((x,-y,r,g,b))
    # Painted black outlines belong to the icon, not a physical object. Replace
    # them with a shaded neighboring material before sculpting the bevel.
    painted={(p[0],p[1]):p[2:] for p in pixels}
    clean=[]
    for x,y,r,g,b in pixels:
        if max(r,g,b)<65:
            neighbors=[color for (xx,yy),color in painted.items() if abs(xx-x)<=2 and abs(yy-y)<=2 and max(color)>85]
            if neighbors:
                r,g,b=[round(sum(c[i] for c in neighbors)/len(neighbors)*.72) for i in range(3)]
            else:r,g,b=72,66,56
        clean.append((x,y,r,g,b))
    pixels=clean
    xy=np.array([p[:2] for p in pixels],dtype=float);center=xy.mean(axis=0)
    _,axes=np.linalg.eigh(np.cov((xy-center).T));up=axes[:,-1]
    if up[1]<0: up=-up
    right=np.array([up[1],-up[0]]);coords=np.stack(((xy-center)@right,(xy-center)@up),axis=1)
    kind=item['weaponType'];length={'dagger':.73,'sword':1.42 if item.get('hands')==2 else 1.18,'spear':1.9,'axe':1.25,'mace':1.05,'staff':1.6,'bow':1.3,'katar':.68,'book':.7,'knuckle':.48,'instrument':1.08}.get(kind,1)
    scale=length/(coords[:,1].max()-coords[:,1].min()+1)
    grip=coords[:,1].min()+length/scale*({'spear':.42,'bow':.5,'book':.5,'knuckle':.5,'katar':.25}.get(kind,.16))
    maxdepth={'mace':.22,'axe':.15,'staff':.15,'book':.15,'bow':.085,'knuckle':.18}.get(kind,.095)
    mask={(p[0],p[1]) for p in pixels};parts=[]
    for i,(x,y,r,g,b) in enumerate(pixels):
        # Broad metal faces taper into a thin edge; wooden shafts stay solid.
        inset=all((x+dx,y+dy) in mask for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
        depth=maxdepth*(1 if inset else .55)
        c=(int(r)<<16)|(int(g)<<8)|int(b)
        px,py=coords[i];parts.append([round(px*scale,5),round((py-grip)*scale,5),0,round(scale*1.08,5),round(scale*1.08,5),round(depth,5),c])
        if inset:
            for side in [-1,1]:
                shade=.72 if side<0 else 1.12
                color=sum(min(255,round(v*shade))<<shift for v,shift in [(r,16),(g,8),(b,0)])
                parts.append([round(px*scale,5),round((py-grip)*scale,5),round(side*depth*.48,5),round(scale*.86,5),round(scale*.86,5),round(maxdepth*.22,5),color])
    models[item['key']]={'sourceId':item['sourceId'],'kind':kind,'parts':parts}
(ROOT/'src/ro-weapon-model-data.js').write_text('// Generated solid voxel sculptures from the existing equipment silhouettes.\nexport const RO_WEAPON_MODEL_DATA='+json.dumps(models,separators=(',',':'))+';\n',encoding='utf8')
print(json.dumps({'sculptures':len(models),'familyFallbacks':len(items)-len(models),'maxParts':max(len(m['parts']) for m in models.values())}))
