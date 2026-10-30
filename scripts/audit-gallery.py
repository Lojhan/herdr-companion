"""Build review sheets and a linked gallery from actual browser audit captures."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
from html import escape
root=Path('artifacts/ui-audit/after')
out=Path('artifacts/ui-audit/review');out.mkdir(parents=True,exist_ok=True)
html=['<!doctype html><meta name="viewport" content="width=device-width"><title>Herdr UI audit captures</title><style>body{background:#17191d;color:#eee;font:14px system-ui;margin:24px}section{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;width:260px}img{width:100%;max-height:430px;object-fit:contain;object-position:top;background:#101114}a{color:#ddd}h2{width:100%}</style><h1>Actual UI audit captures</h1>']
for engine in ['chromium','webkit']:
 profiles=sorted((root/engine).glob('*'))
 for state in ['workspace-graphite','terminal-graphite','empty-tab','settings-paper','settings-details','machines-paper','tasks-paper','search-empty-paper','terminal-paper']:
  files=[p/(state+'.png') for p in profiles if (p/(state+'.png')).exists()]
  if not files: continue
  sheet=Image.new('RGB',(1500,((len(files)+4)//5)*470),'#33363b');draw=ImageDraw.Draw(sheet)
  html.append(f'<h2>{engine} · {state}</h2><section>')
  for i,file in enumerate(files):
   im=Image.open(file).convert('RGB');im.thumbnail((290,440));x=(i%5)*300;y=(i//5)*470;sheet.paste(im,(x,y+25));draw.text((x+4,y+5),file.parent.name,fill='white')
   link='../after/'+str(file.relative_to(root));html.append(f'<figure><a href="{escape(link)}"><img loading="lazy" src="{escape(link)}">{escape(file.parent.name)}</a></figure>')
  sheet.save(out/f'{engine}-{state}.jpg',quality=88);html.append('</section>')
(out/'index.html').write_text(''.join(html))
print('Audit review sheets and linked gallery:',out)
