"""Build README artwork and GIF frames offline; no scripts execute in GitHub.

Requires Pillow and Playwright. Uses installed Chrome (or PLAYWRIGHT_CHROME).
Run from any directory: python docs/design/build_assets.py
"""
from pathlib import Path
from html import escape
import io
import base64
import math
import os
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets'
BG, PANEL, BORDER = '#070b14', '#0e1523', '#243349'
WHITE, MUTED, BLUE, CYAN, VIOLET = '#edf3ff', '#a4b3cb', '#7baaff', '#89deed', '#c4adff'


def text(x, y, value, size=18, color=WHITE, weight=400, extra=''):
    return f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" {extra}>{escape(value)}</text>'


def rect(x, y, w, h, fill=PANEL, stroke=BORDER, radius=16):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>'


def line(x1, y1, x2, y2, color=BLUE, both=False):
    start = 'marker-start="url(#back)"' if both else ''
    return f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="{color}" stroke-width="1.8" marker-end="url(#arrow)" {start}/>'


def box(x, y, w, title, sub, color=BLUE, h=84):
    return rect(x, y, w, h) + f'<rect x="{x+1}" y="{y+18}" width="3" height="{h-36}" rx="1" fill="{color}"/>' + text(x+20,y+33,title,20,WHITE,600) + text(x+20,y+59,sub,14,MUTED)


def svg(name, title, desc, body, height):
    content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{height}" viewBox="0 0 1200 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="{BLUE}" stroke-width="1.5"/></marker><marker id="back" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="{BLUE}" stroke-width="1.5"/></marker></defs>
<rect width="1200" height="{height}" rx="20" fill="{BG}"/>
<g font-family="Segoe UI, Arial, sans-serif">{body}</g></svg>'''
    (OUT/name).write_text(content,encoding='utf-8')


def diagrams():
    b = text(40,44,'THE SYSTEM / TWO CONVERSATION PATHS',13,CYAN,600, 'letter-spacing="2"')
    b += text(40,88,'One interface. Two execution paths.',32,WHITE,600)
    b += text(40,119,'Express handles typed requests. A separate Python worker handles live voice.',18,MUTED)
    b += rect(28,148,1144,230,'#0a101c')
    b += text(48,178,'01   TEXT · HTTP',13,BLUE,600,'letter-spacing="1.5"')
    b += box(48,208,210,'React browser','Typed message + history')
    b += box(316,208,220,'Express API','Chat + TTS endpoints')
    b += line(258,250,312,250,both=True)
    for y,title,sub in [(194,'Qdrant','Retrieve + selected writes'),(250,'Gemini','Generate short responses'),(306,'Rime','Speech via /api/tts')]:
        b += rect(790,y,345,48,radius=10)+text(808,y+29,title,17,WHITE,600)+text(895,y+29,sub,14,MUTED)
        b += f'<path d="M536 250 H650 V{y+24} H785" stroke="{BLUE}" fill="none" stroke-width="1.4" marker-end="url(#arrow)"/>'
    b += text(48,344,'Vite in development · built frontend served by Express in production',15,MUTED)
    b += rect(28,398,1144,270,'#0a101c')
    b += text(48,428,'02   VOICE · LIVEKIT ROOM',13,VIOLET,600,'letter-spacing="1.5"')
    b += box(48,458,210,'React browser','Microphone + transcripts',VIOLET)
    b += box(302,458,180,'LiveKit','Audio + RPC',VIOLET)
    b += box(526,458,215,'Python worker','AgentSession',VIOLET)
    b += line(258,500,297,500,both=True)+line(482,500,521,500,both=True)
    b += line(741,500,788,500)
    b += rect(794,446,341,194)
    for i,(title,sub) in enumerate([('STT','LiveKit Inference / Deepgram'),('Qdrant','Seed + retrieve context'),('Gemini','Generate response'),('Rime','Stream synthesized speech')]):
        b += text(814,480+i*43,title,17,WHITE,600)+text(890,480+i*43,sub,14,MUTED)
    b += text(48,588,'SETUP',12,CYAN,600,'letter-spacing="2"')
    b += text(48,614,'Express issues the room token and dispatches matrix-core-agent.',16,MUTED)
    b += text(48,642,'Worker audio returns through LiveKit; state and transcript events update the browser.',15,MUTED)
    b += text(40,704,'Memory is filtered by user_id + workflow. The demo browser uses a shared demo-user identity.',15,MUTED)
    svg('architecture.svg','NEXIS architecture','Text requests go through Express to Qdrant, Gemini and Rime. Voice uses a LiveKit room and Python worker with STT, Qdrant, Gemini and Rime. Express creates tokens and dispatches the worker.',b,736)

    b = text(40,44,'FROM MICROPHONE TO RESPONSE',13,CYAN,600,'letter-spacing="2"') + text(40,87,'A voice turn, step by step.',32,WHITE,600)
    cards=[('01','Connect','Token + agent dispatch','Join the LiveKit room.'),('02','Speak','start_turn RPC','Interrupt, clear, enable audio.'),('03','Commit','end_turn RPC','Disable audio; commit turn.'),('04','Retrieve','Qdrant context','Filter by user and workflow.'),('05','Respond','Gemini → Rime','Generate text, then speech.'),('06','Continue','Audio + transcript','Return through LiveKit.')]
    for i,(num,title,code,sub) in enumerate(cards):
        col,row=i%3,i//3
        x,y=40+col*384,122+row*190
        b += rect(x,y,352,164)+text(x+22,y+31,num,14,CYAN,600)+text(x+22,y+66,title,27,WHITE,600)+text(x+22,y+102,code,17,VIOLET,600)+text(x+22,y+133,sub,16,MUTED)
        if col<2: b += line(x+354,y+80,x+378,y+80)
    b += f'<path d="M984 286 V299 H216 V309" fill="none" stroke="{BLUE}" stroke-width="1.4" marker-end="url(#arrow)"/>'
    b += text(40,527,'NEXT TURN',12,CYAN,600,'letter-spacing="2"')+text(170,527,'Click the microphone again to interrupt and start speaking.',17,MUTED)
    b += text(40,560,'cancel_turn clears an aborted input. Illustration describes code flow, not measured timing.',15,MUTED)
    svg('voice-workflow.svg','AURA voice workflow','Connect, start a voice turn, commit it, retrieve memory, generate and synthesize a response, then continue. Starting a new turn interrupts speech.',b,596)

    b = text(40,44,'THREE EXPERIENCES / SHARED VOICE STACK',13,CYAN,600,'letter-spacing="2"')
    cards=[('01','Food ordering','Preference → suggestion',['Dietary preferences','Previous order context','Conversational order changes'],BLUE),('02','Healthcare','Request → guidance',['Appointment-related help','General information','Non-diagnostic instructions'],VIOLET),('03','Home cooking','Recipe → next step',['Recipe context','Ingredient substitutions','Short spoken instructions'],CYAN)]
    for i,(num,title,sub,items,color) in enumerate(cards):
        x=40+i*384
        b += rect(x,78,352,290)+text(x+24,114,num,14,color,600)
        # Small original line symbols: plate, pulse, cooking steam.
        if i==0: b+=f'<circle cx="{x+295}" cy="113" r="18" fill="none" stroke="{color}" stroke-width="1.6"/><circle cx="{x+295}" cy="113" r="10" fill="none" stroke="{color}"/>'
        if i==1: b+=f'<path d="M{x+270} 113 h12 l7 -15 10 29 7 -14 h18" fill="none" stroke="{color}" stroke-width="2"/>'
        if i==2: b+=f'<path d="M{x+275} 118 q20 26 40 0 Z M{x+285} 108 q-8 -8 0 -16 M{x+298} 108 q-8 -8 0 -16 M{x+310} 108 q-8 -8 0 -16" fill="none" stroke="{color}" stroke-width="1.8"/>'
        b += text(x+24,165,title,27,WHITE,600)+text(x+24,199,sub,17,color)
        b += f'<path d="M{x+24} 224 H{x+328}" stroke="{BORDER}"/>'
        for j,item in enumerate(items): b+=text(x+24,257+j*32,item,17,MUTED)
    b+=text(40,406,'Conversational demos: no checkout, booking backend, diagnosis, or prescription integration.',16,MUTED)
    svg('experiences.svg','Three implemented experiences','Food ordering uses dietary and order context. Healthcare provides administrative and general information. Cooking provides recipe steps and substitutions. These are conversational demos.',b,440)


def hero(browser):
    page=browser.new_page(viewport={'width':1200,'height':610},device_scale_factor=1)
    image_uri='data:image/png;base64,'+base64.b64encode((OUT/'core-illustration.png').read_bytes()).decode('ascii')
    # Browser composition keeps the AI illustration intact; GIF motion is an
    # original explanatory overlay, never an invented screenshot of the product.
    page.set_content(f'''<html><head><style>
    *{{box-sizing:border-box}} body{{margin:0;background:{BG};color:{WHITE};font-family:'Segoe UI',Arial,sans-serif}}
    .frame{{width:1200px;height:610px;position:relative;overflow:hidden;border-radius:20px;border:1px solid {BORDER}}}
    .art{{position:absolute;right:-45px;top:-5px;width:790px;height:500px;object-fit:cover;opacity:.92}}
    .shade{{position:absolute;inset:0;background:linear-gradient(90deg,{BG} 0%,{BG} 28%,transparent 60%),linear-gradient(0deg,{BG} 22%,transparent 45%)}}
    .copy{{position:absolute;left:48px;top:40px}} .eyebrow{{font:600 12px 'Segoe UI';letter-spacing:3px;color:{CYAN}}}
    h1{{margin:33px 0 0;font-size:76px;letter-spacing:-4px;font-weight:650;line-height:1}}
    .subbrand{{font-size:17px;letter-spacing:7px;color:{BLUE};margin:12px 0 28px}}
    h2{{font-size:30px;line-height:1.22;letter-spacing:-.8px;margin:0 0 17px;font-weight:500}}
    .desc{{font-size:16px;line-height:1.65;color:{MUTED}}}
    .tag{{margin-top:26px;font:12px Consolas,monospace;letter-spacing:1px;color:{VIOLET}}}
    </style></head><body><div class="frame"><img class="art" src="{image_uri}"><div class="shade"></div>
    <div class="copy"><div class="eyebrow">AURA / ADAPTIVE VOICE AGENT</div><h1>NEXIS</h1><div class="subbrand">STARFORGE</div>
    <h2>A conversation.<br>With context.</h2><div class="desc">Workflow-aware responses.<br>Retrieved memory. Spoken aloud.</div><div class="tag">FOOD · HEALTHCARE · COOKING</div></div>
    <svg id="motion" xmlns="http://www.w3.org/2000/svg" width="1200" height="610" style="position:absolute;inset:0"></svg>
    </div></body></html>''')
    page.wait_for_function('document.images[0].complete && document.images[0].naturalWidth > 0')
    frames=[]
    nodes=[('MICROPHONE','Audio input'),('LIVEKIT','Room transport'),('STT','Speech to text'),('QDRANT','Turn context'),('GEMINI','Response text'),('RIME','Speech output')]
    base=text(48,441,'VOICE PATH',12,CYAN,600,'letter-spacing="2"')+text(192,441,'Python worker orchestrates each turn · audio returns through LiveKit',13,MUTED)
    for i,(title,sub) in enumerate(nodes):
        x=48+i*187
        base+=rect(x,464,168,84,'#0d1525')+text(x+16,495,title,13,WHITE,600,'letter-spacing="1"')+text(x+16,523,sub,12,MUTED)
        if i<5: base+=f'<path d="M{x+168} 506 H{x+187}" stroke="#385277" stroke-width="2"/>'
    base+=text(48,582,'ILLUSTRATED FLOW / NOT A LATENCY BENCHMARK',10,MUTED,400,'letter-spacing="1.5"')
    for f in range(100):
        t=f/100
        dynamic=''
        for i in range(5):
            x=216+i*187+19*((t*2+i*.15)%1)
            dynamic+=f'<circle cx="{x}" cy="506" r="3" fill="{CYAN}"/>'
        # Periodic orbit motion and input waveform, matching the existing core motif.
        for j in range(3):
            a=math.tau*(t+j/3)
            x,y=889+183*math.cos(a),239+183*math.sin(a)
            dynamic+=f'<circle cx="{x:.2f}" cy="{y:.2f}" r="3" fill="{CYAN}" opacity=".8"/>'
        for j in range(28):
            h=3+12*(.5+.5*math.sin(math.tau*t*2+j*.55))
            dynamic+=f'<path d="M{760+j*9} {390-h:.1f} V{390+h:.1f}" stroke="{BLUE}" stroke-width="2" stroke-linecap="round" opacity=".75"/>'
        page.eval_on_selector('#motion','(el,markup)=>el.innerHTML=markup',f'<g font-family="Segoe UI,Arial,sans-serif">{base}{dynamic}</g>')
        raw=page.screenshot()
        frame=Image.open(io.BytesIO(raw)).convert('RGB')
        frames.append(frame)
        if f==0: frame.save(OUT/'hero-poster.png',optimize=True)
    palette=frames[0].quantize(colors=192)
    indexed=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    indexed[0].save(OUT/'hero.gif',save_all=True,append_images=indexed[1:],duration=60,loop=0,optimize=True,disposal=1)
    page.close()


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    diagrams()
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROME',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),headless=True)
        hero(browser)
        page=browser.new_page(viewport={'width':1200,'height':736})
        for name in ['architecture','voice-workflow','experiences']:
            page.goto((OUT/f'{name}.svg').as_uri())
            # Render previews outside the tracked assets; SVG stays authoritative.
            page.locator('svg').screenshot(path=str(Path(os.environ.get('TEMP','.'))/f'nexis-{name}.png'))
        browser.close()
    for file in OUT.iterdir():
        print(f'{file.name}: {file.stat().st_size/1024:.1f} KiB')


if __name__=='__main__':
    main()
