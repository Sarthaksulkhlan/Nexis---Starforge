"""Capture the unmodified local app in its credential-free demo state.

Start npm run dev first. Requires Playwright and Chrome.
No API mocks, DOM rewrites, or fabricated service status are used.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / 'assets'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROME',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),headless=True,args=['--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':1600,'height':1000},device_scale_factor=1)
    page.goto('http://localhost:3000',wait_until='networkidle')
    page.wait_for_function("document.querySelector('h1')?.innerText.includes('Never start a conversation from zero.')")
    page.screenshot(path=str(OUT/'app-overview.jpg'),type='jpeg',quality=86)
    page.get_by_role('button',name='Start a Voice Session',exact=True).click()
    page.get_by_role('heading',name='Choose your experience').wait_for()
    page.screenshot(path=str(OUT/'app-experiences.jpg'),type='jpeg',quality=86)
    page.get_by_role('heading',name='Food Ordering',exact=True).click()
    page.get_by_text('LiveKit is disconnected. Check the server, agent, and LiveKit credentials.',exact=True).wait_for()
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT/'app-studio.jpg'),type='jpeg',quality=88)
    page.get_by_title('Finish & View Summary').click()
    page.get_by_role('heading',name='NEXIS | Session Summary').wait_for()
    page.screenshot(path=str(OUT/'app-summary.jpg'),type='jpeg',quality=86)
    browser.close()
print('Captured four real app views without provider credentials.')
