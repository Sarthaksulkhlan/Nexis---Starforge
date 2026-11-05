# README visual system

The README uses the application's midnight, blue, cyan, and violet palette. All embedded assets are committed files; GitHub does not need to execute JavaScript, CSS animation, React, or a hosted application to display them.

## Assets and provenance

| Asset | Origin and purpose |
| --- | --- |
| [hero.gif](../assets/hero.gif) | Original browser-composed banner with moving signals, an audio waveform, and orbit particles. 100 frames at 60 ms each; six-second infinite loop. It illustrates the voice path, not latency or live telemetry. |
| [hero-poster.png](../assets/hero-poster.png) | Still version of the hero for readers who prefer no motion. |
| [core-illustration.png](../assets/core-illustration.png) | Original AI-generated conceptual illustration inspired by the existing Three.js core. Generated with the built-in imagegen tool; no reference-repository assets were used. It is not a screenshot. |
| [experiences.svg](../assets/experiences.svg) | Original vector composition of the three implemented conversational experiences. |
| [architecture.svg](../assets/architecture.svg) | Text and voice execution paths, their runtime boundaries, and provider responsibilities. Arrows express calls/transport, not deployment guarantees. |
| [voice-workflow.svg](../assets/voice-workflow.svg) | Connect, start input, commit, retrieve context, generate/synthesize, and continue. |
| [app-overview.jpg](../assets/app-overview.jpg), [app-experiences.jpg](../assets/app-experiences.jpg), [app-studio.jpg](../assets/app-studio.jpg), [app-summary.jpg](../assets/app-summary.jpg) | Browser screenshots of the unchanged application at 1600 × 1000, without provider credentials. No mocked responses, altered DOM, or hidden connection errors. |

The GIF uses a shared 192-color palette, frame-difference optimization, and infinite looping (`loop=0`). Motion is periodic so the last-to-first transition has the same cadence as the other frames. JPEG screenshots use quality 86–88. Static SVGs contain no external images, fonts, scripts, foreign objects, or animations. Each SVG has a title, description, explicit dimensions, and viewBox.

The original illustration is retained for reproducibility but is not loaded separately by the main README. The initial hero download is approximately 401 KiB. Text outside the images repeats the essential technical information, and all README images have descriptive alternative text.

## Source of truth

| Claim or visual | Implementation |
| --- | --- |
| Three active views and summary-local memory edits | [`src/App.tsx`](../../src/App.tsx), [`SessionSummaryView.tsx`](../../src/components/SessionSummaryView.tsx) |
| Three experiences and seeded studio context | [`experienceData.ts`](../../src/data/experienceData.ts), [`ActiveSessionStudio.tsx`](../../src/components/ActiveSessionStudio.tsx) |
| Token creation, agent dispatch, chat, HTTP TTS, configuration flags | [`server.ts`](../../server.ts) |
| Text-path retrieval and selected keyword-based memory writes | `retrieveMemories` and `saveUsefulMemory` in [`server.ts`](../../server.ts) |
| Worker retrieval before response, STT, Gemini, Rime, RPC input controls | [`agent/agent.py`](../../agent/agent.py) |
| Orb and orbital-ring visual motif | [`ThreeMatrixCore.tsx`](../../src/components/ThreeMatrixCore.tsx), [`ThreeOrb.tsx`](../../src/components/ThreeOrb.tsx) |
| Dependencies and commands | [`package.json`](../../package.json), [`agent/pyproject.toml`](../../agent/pyproject.toml) |

The studio's right-hand context cards use `currentExpConfig.memories`, not the live retrieval result. The sidebar's “Qdrant connected,” header latency, and initial model/latency labels are static demo values. Screenshots retain those labels and are explicitly captioned accordingly. Unconnected archive/vault components are not presented as available product features.

## Reproduce

Documentation-only tooling, separate from application dependencies:

```powershell
python -m pip install Pillow playwright
python docs/design/build_assets.py
```

The builder uses Chrome at its standard Windows installation path. Set `PLAYWRIGHT_CHROME` to a compatible Chrome/Chromium executable on other systems. It uses the committed core illustration and generates the GIF, still poster, and SVGs. Temporary SVG raster previews are written outside the repository.

For screenshots, run `npm run dev` without service credentials, then:

```powershell
python docs/design/capture_app.py
```

The capture script expects the credential-free LiveKit error, so it will not silently present an authenticated or mocked session. Run `python docs/design/verify_assets.py` to validate README paths, SVG structure, GIF properties, and raster decoding.

## Original image prompt

Built-in imagegen was used with this prompt:

> Create an original premium software-product editorial illustration for NEXIS Starforge, a real demo of AURA adaptive voice agent. Wide landscape 1536x1024. Subject: a single luminous blue-violet wireframe spherical core, inspired by a Three.js icosahedron orb, with precise concentric orbital rings and three restrained streams of cyan light converging into it, representing spoken input, retrieved context, and response synthesis. Dark near-black navy background #05070a, icy blue #89ceff, periwinkle #4d8eff and restrained violet #d0bcff. Sophisticated optical glass, fine engineered linework, generous dark negative space, exceptionally clean high-end industrial visualization, subtle radiance without blown highlights. Core centered slightly right. This is a conceptual illustration of the existing voice core, not an interface or architecture diagram. No text, no logos, no numbers, no dashboards, no panels, no people, no robot, no brain, no random icons, no stars or planets. Carefully controlled lighting and precise geometry.

## Verification boundaries

The application was installed with `npm ci`; `npm run lint` and `npm run build` passed. The build emits its existing large-JavaScript-chunk warning. Screenshot capture exercised the landing page, experience selector, studio, and summary without modifying application files.

The README was rendered through GitHub's Markdown API, then inspected in Chrome at desktop and 390-pixel mobile widths. All 12 embedded images loaded, including GitHub-proxied badges; the page had no horizontal overflow at the mobile width. Two browser captures confirmed that the GIF visibly changes. The asset validator checked 49 documentation references, parsed all three SVGs, decoded the raster files, and verified 100 distinct GIF frames, a six-second duration, infinite looping, and a smooth wrap transition.

No live provider session was tested: no Gemini, Qdrant, LiveKit, or Rime credentials were supplied. Diagrams describe the implemented calls, not a successful end-to-end provider test. The README uses ordinary GitHub-supported images and collapsible details; animation is encoded in the GIF itself. There are no Mermaid blocks or animated SVG dependencies.
