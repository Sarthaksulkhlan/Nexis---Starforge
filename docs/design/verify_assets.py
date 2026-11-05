"""Validate the documentation's local references and encoded image assets."""
from pathlib import Path
from html import unescape
import hashlib
import re
import xml.etree.ElementTree as ET
from PIL import Image, ImageChops, ImageStat

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'docs/assets'
for doc in [ROOT/'README.md', ROOT/'docs/design/README.md']:
    source=doc.read_text(encoding='utf-8-sig')
    refs=re.findall(r'(?:src|href)="([^"]+)"',source)+re.findall(r'\]\(([^)]+)\)',source)
    headings=re.findall(r'^#{1,6} (.+)$',source,re.M)
    anchors={re.sub(r'[^\w\- ]','',h.lower()).replace(' ','-') for h in headings}
    for ref in refs:
        ref=unescape(ref)
        if ref.startswith(('https://','http://')):
            continue
        if ref.startswith('#'):
            assert ref[1:] in anchors, f'Missing anchor: {ref}'
        else:
            assert (doc.parent/ref.split('#')[0]).is_file(), f'Missing local path: {ref}'
    for tag in re.findall(r'<img\b[^>]*>',source):
        assert re.search(r'alt="[^"]+"',tag),f'Missing image alternative text: {tag}'
    print(f'{doc.relative_to(ROOT)}: {len(refs)} references checked')

for asset in ASSETS.iterdir():
    if asset.suffix=='.svg':
        root=ET.parse(asset).getroot()
        assert root.get('viewBox') and root.get('width') and root.get('height')
        assert root.find('{http://www.w3.org/2000/svg}title') is not None
        assert root.find('{http://www.w3.org/2000/svg}desc') is not None
        forbidden={'script','foreignObject','animate','animateTransform','set','image','style'}
        for node in root.iter():
            assert node.tag.split('}')[-1] not in forbidden,asset
            assert not any(k.startswith('on') for k in node.attrib),asset
        assert asset.stat().st_size < 10_000
    elif asset.suffix in {'.png','.jpg','.gif'}:
        with Image.open(asset) as im:
            im.verify()

with Image.open(ASSETS/'hero.gif') as im:
    assert im.size==(1200,610)
    assert im.n_frames==100
    assert im.info.get('loop')==0
    frames=[]
    durations=[]
    for i in range(im.n_frames):
        im.seek(i)
        durations.append(im.info['duration'])
        frames.append(im.convert('RGB'))
    assert sum(durations)==6000 and set(durations)=={60}
    assert len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames})==100
    changes=[sum(ImageStat.Stat(ImageChops.difference(frames[i],frames[(i+1)%100])).mean) for i in range(100)]
    assert max(changes)>0
    assert changes[-1] < 2*sum(changes)/len(changes),'Visible discontinuity at loop boundary'
    assert (ASSETS/'hero.gif').stat().st_size < 600_000
    print(f'GIF: {im.n_frames} distinct frames, 6 seconds, infinite loop; wrap difference {changes[-1]:.4f}, mean {sum(changes)/len(changes):.4f}')
print('SVG structure and all raster assets verified.')
print(f'Total committed asset size: {sum(a.stat().st_size for a in ASSETS.iterdir())/1024:.1f} KiB')
