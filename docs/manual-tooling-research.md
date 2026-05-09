# Tooling Research: Building a User Manual for LX Notes

Date: 2026-05-09
Branch: `claude/research-lx-notes-tools-9fgE1`

LX Notes is a theatrical production-notes web app (Cue / Work / Production
modules, dark-first UI, Lightwright CSV import). A "manual" for it spans three
audience surfaces:

1. **Standalone documentation site** — searchable how-tos, reference, troubleshooting.
2. **In-app help / guided tours** — contextual onboarding the first time a
   designer or stage manager opens a module.
3. **Captured visuals** — screenshots, annotated walkthroughs, short clips.

The survey below prioritizes **open source / source-available** options. Hosted
SaaS competitors are noted only where they help calibrate the OSS picks.

---

## 1. Static documentation site generators

These are the leading OSS frameworks for a `docs.lxnotes.app`-style site. Each
is Markdown/MDX-driven, ships search, and deploys as a static bundle (Vercel,
Cloudflare Pages, GitHub Pages).

| Tool | Stack | License | Strengths | Friction for LX Notes |
|---|---|---|---|---|
| [**Docusaurus**](https://docusaurus.io/) | React / MDX | MIT | Largest plugin ecosystem, mature versioning, i18n, blog plugin baked in. Used by Meta projects. | Heavier React runtime; default theme looks generic without customization. |
| [**Starlight (Astro)**](https://starlight.astro.build/) | Astro / MDX | MIT | Faster cold loads (zero-JS by default), cleaner default theme, easy to drop React/Vue islands when needed. Distr publicly migrated from Docusaurus → Starlight in 2026. | Younger ecosystem; fewer prebuilt plugins than Docusaurus. |
| [**MkDocs + Material**](https://squidfunk.github.io/mkdocs-material/) | Python | MIT | Rock-solid Markdown-only workflow, instant search, polished default theme. Pairs with `mike` for versioning. | Python toolchain is alien to a Next.js/Turborepo monorepo; harder to share components with the app. |
| [**VitePress**](https://vitepress.dev/) | Vue / Vite | MIT | Extremely fast dev server, minimal default theme, low overhead. | Vue-centric — adding React components for live LX Notes demos requires extra setup. |
| [**Nextra**](https://nextra.site/) | Next.js / MDX | MIT | Same Next.js stack the app already uses; could live in the same monorepo, share Tailwind tokens, and even import live components. | Smaller ecosystem than Docusaurus; theming less mature than Starlight. |
| [**Sphinx + MyST**](https://www.sphinx-doc.org/) | Python / RST or MD | BSD | Best-in-class for deeply technical reference (Python, scientific). | Overkill for a product manual; RST roots show through. |

**Recommendation for LX Notes:** **Nextra** if the goal is to colocate the
manual inside the existing Turborepo (`apps/docs`) and reuse Tailwind theme
tokens / live `<NoteCard>` previews. Otherwise **Starlight** for a separate,
fast-loading marketing-adjacent docs site.

Sources:
- [Top 12 Open Source Documentation Tools — JekyllPad](https://www.jekyllpad.com/blog/open-source-documentation-tools)
- [Starlight vs Docusaurus — LogRocket](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/)
- [Distr: migrated from Docusaurus to Starlight](https://distr.sh/blog/distr-docs/)
- [Best software documentation tools — GitBook blog](https://www.gitbook.com/blog/best-software-documentation-tools)

---

## 2. In-app help, tours, and contextual onboarding

LX Notes has module-specific UIs (Cue Notes wants script-page workflows; Work
Notes wants Lightwright CSV nuance). A guided first-run tour avoids dumping
designers into an empty dashboard.

| Library | License | Bundle | Notes |
|---|---|---|---|
| [**Driver.js**](https://driverjs.com/) | MIT | ~5 KB gzip, zero deps | TypeScript-native, smallest serious option. Best fit for a Next.js 15 app where bundle size matters. |
| [**Shepherd.js**](https://shepherdjs.dev/) | MIT (since 14.x; previously LGPL) | Heavier, depends on Floating UI | Most flexible API: modal overlays, keyboard nav, complex multi-step flows. Recently relicensed permissive — verify version. |
| [**Intro.js**](https://introjs.com/) | AGPL or commercial | Medium | Mature, widely used, but **AGPL** — incompatible with closed-source SaaS unless you buy a commercial license. |
| [**React Joyride**](https://react-joyride.com/) | MIT | React-only | Idiomatic for a React app; good for component-aware tours with portals. |
| [**Reactour (`@reactour/tour`)**](https://github.com/elrumordelaluz/reactour) | MIT | React-only | Lighter than Joyride, popover-first design. |
| [**Onborda**](https://www.onborda.dev/) | MIT | Next.js/React | Newer, Next.js-first, framer-motion based; nice if you want animated highlights. |

**Recommendation for LX Notes:** **Driver.js** for a generic, framework-free
tour (works with any module without tying tours to React lifecycle), or
**React Joyride** if tours need to react to Zustand state changes mid-tour.
**Avoid Intro.js** unless a commercial license is purchased — AGPL leakage
risk for a hosted SaaS.

Sources:
- [Best Open-Source Product Tour Libraries — Userorbit](https://userorbit.com/blog/best-open-source-product-tour-libraries)
- [Driver.js vs Intro.js vs Shepherd.js vs Reactour — Inline Manual](https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour/)
- [5 Best React Onboarding Libraries 2026 — OnboardJS](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared)
- [7 best product tour JS libraries — LogRocket](https://blog.logrocket.com/best-product-tour-js-libraries-frontend-apps/)

---

## 3. Screenshots, annotated walkthroughs, and short clips

A theatre-facing manual benefits heavily from visuals (e.g. "this is the
priority dot", "this is where Lightwright LWIDs appear"). Open-source picks:

| Tool | Platform | License | Use case |
|---|---|---|---|
| [**Flameshot**](https://flameshot.org/) | Linux / macOS / Windows | GPL-3.0 | Region capture + on-the-fly annotations (arrows, blur, text). Good for quick docs screenshots. |
| [**ShareX**](https://getsharex.com/) | Windows | GPL-3.0 | Most powerful free capture: scrolling capture, OCR, custom workflows, auto-upload. Windows-only. |
| [**Greenshot**](https://getgreenshot.org/) | Windows / macOS | GPL | Lightweight, region capture, basic annotations. |
| [**ksnip**](https://github.com/ksnip/ksnip) | Cross-platform (Qt) | GPL-3.0 | Great cross-OS annotation parity; Linux teams often prefer it over Flameshot. |
| [**OBS Studio**](https://obsproject.com/) | All | GPL-2.0 | For short MP4/WebM walkthroughs of multi-step flows (e.g. importing a Lightwright CSV). |
| [**Asciinema**](https://asciinema.org/) | All | Apache-2.0 | Only relevant for CLI-flavored docs; ignore for a stage-manager manual. |

For the "Tango / Supademo" interactive-walkthrough genre, there is no
mature OSS equivalent yet — the closest is rolling your own with Driver.js +
recorded GIFs. Consider this a known gap.

Sources:
- [Top 7 Open-Source Screenshot Tools — Zight](https://zight.com/blog/top-7-open-source-screenshot-tools-2025/)
- [13 Top Open-source Free Screen Capture Tools — Medevel](https://medevel.com/13-screen-capture-tool/)
- [Open Source Snipping Tool alternatives — AlternativeTo](https://alternativeto.net/software/snipping-tool/?license=opensource)

---

## 4. Reference manuals from the theatre tooling LX Notes lives next to

Worth reading these to calibrate tone, terminology, and structure. None are
open source as products, but their docs are public and shape user expectations.

- [**Lightwright Knowledge Base**](https://www.lightwright.com/kb) — the
  vocabulary LX Notes inherits (LWID, channel, address, focus charts). Match
  this terminology in the manual to reduce friction on import flows.
- [**ETC Eos Family Manuals**](https://www.etcconnect.com/Support/Consoles/Eos-Family/Documentation.aspx)
  — exhaustive console reference. Use as a structural anti-pattern: too dense
  for stage managers; LX Notes manual should be task-oriented instead.
- [**Vectorworks Spotlight Help**](https://app-help.vectorworks.net/2025/eng/VW2025_Guide/)
  — clean information architecture (Setup / Workflow / Reference). Worth
  borrowing the IA split.
- [**Propared Help Center**](https://help.propared.com/) — closest
  competitor in audience. Good model for short, video-led articles aimed at
  arts administrators rather than developers.
- [**ProductionPro Resources**](https://production.pro/ppro-stage-management-resources)
  and free SM templates — useful as inbound-content patterns; LX Notes could
  ship a similar "templates and presets" library.

Sources:
- [Lightwright Knowledge Base](https://www.lightwright.com/kb)
- [Lightwright Features](https://www.lightwright.com/features)
- [Vectorworks Spotlight Lightwright pane](https://app-help.vectorworks.net/2022/eng/VW2022_Guide/Setup/Spotlight_preferences_Lightwright_pane.htm)
- [Propared](https://www.propared.com/)
- [Propared training video](https://help.propared.com/article/vdm951ag2t-part-9-crew-management-and-labor-booking-training-video-4-05)
- [ProductionPro free SM templates](https://production.pro/ppro-free-sm-templates)
- [60+ Technical Theatre Apps — captitles](https://www.captitles.com/apps-for-technical-theatre)

---

## 5. Adjacent open-source theatre projects (terminology + UX precedent)

These OSS projects don't cover production notes directly, but their docs and
UI conventions inform LX Notes vocabulary and competitor framing.

- [**QLC+**](https://www.qlcplus.org/) — the canonical OSS lighting controller
  ([github.com/mcallegari/qlcplus](https://github.com/mcallegari/qlcplus)).
  Manual lives in-tree as a wiki + PDF; useful precedent for shipping a
  searchable HTML manual + downloadable PDF.
- [**Linux Show Player (LiSP)**](https://github.com/FrancescoCeruti/linux-show-player)
  — sound cue player, MIT/GPL stack. Docs live on a GitHub wiki.
- [**Ontime**](https://www.getontime.no/) ([github](https://github.com/cpvalente/ontime))
  — OSS rundown / event timer with a polished docs site at
  [docs.getontime.no](https://docs.getontime.no/) built with VitePress. Closest
  living example of a theatre-adjacent OSS product with a quality manual.
- [**ShowQ**](https://github.com/evandelisle/showq), [**Soundclip**](https://github.com/soundclip/soundclip),
  [**Cue Masher**](https://github.com/silentfuzzle/Cue-Masher),
  [**Peer-to-Peer Cue System**](https://github.com/jmcker/Peer-to-Peer-Cue-System)
  — small OSS cue tools; mostly README-only docs. Useful as a *cautionary*
  baseline: the bar to beat is low, so a real manual is a differentiator.

Sources:
- [QLC+](https://www.qlcplus.org/)
- [Open source theater lighting — opensource.com](https://opensource.com/article/17/5/open-source-lighting)
- [Ontime](https://www.getontime.no/)
- [Awesome audiovisual list](https://github.com/stingalleman/awesome-audiovisual)
- [GitHub: ShowQ](https://github.com/evandelisle/showq)
- [GitHub: Soundclip](https://github.com/soundclip/soundclip)
- [GitHub: Cue Masher](https://github.com/silentfuzzle/Cue-Masher)
- [GitHub: Peer-to-Peer Cue System](https://github.com/jmcker/Peer-to-Peer-Cue-System)

---

## 6. Recommended stack for the LX Notes manual

Given LX Notes is a Next.js 15 / Turborepo / Tailwind / TypeScript codebase
with a dark-first UI and three colour-coded modules:

1. **Docs site:** **Nextra** in a new `apps/docs` workspace.
   - Reuses the existing Tailwind config and module-colour tokens (purple /
     blue / cyan).
   - Lets writers embed live `<CueNoteRow>` / `<WorkNoteRow>` previews instead
     of static screenshots that drift from reality.
   - Versioning is light (the app moves fast); start with one channel and add
     versioned trees only when paid customers pin to releases.
2. **In-app tours:** **Driver.js** wired to `data-testid` attributes (the
   project already standardizes `[module]-[element]-[action]` testids — same
   selectors double as tour anchors with zero new markup).
3. **Visuals:** **Flameshot** (devs on Linux/macOS) + **ShareX** (devs on
   Windows) for stills, **OBS Studio** for the 30–60s clips that show
   Lightwright CSV import and PDF export end-to-end.
4. **Search:** Nextra ships with FlexSearch out of the box; upgrade to
   Algolia DocSearch (free for OSS, paid for SaaS) once the corpus is large
   enough that local search ranking gets noisy.
5. **PDF export of the manual:** Use Nextra's print stylesheet plus
   [pagedjs](https://pagedjs.org/) — gives stage managers a printable book they
   can keep at the tech table without paywalling them on the web app.

### Open questions to resolve before committing

- Should the manual be **versioned per release** (Docusaurus/Mike model) or
  **rolling latest only**? Rolling is cheaper; versioned matters once paid
  tenants pin behaviour.
- Is the manual **public** (SEO + sales-led growth) or **gated to logged-in
  users** (less surface area, but no inbound search traffic)?
- Will writers be the same engineers shipping features, or a separate docs
  contributor? Affects whether MDX with React imports is a feature or a
  burden.
