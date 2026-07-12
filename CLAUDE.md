# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before every reply

1. Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login) to check the [Claude Design project](https://claude.ai/design/p/5d2ec59d-2ca6-4d5e-8a58-998b3a5ec8f9?file=%E9%A6%96%E9%A0%81.dc.html) to see how far the blog design has progressed.
2. Read `workflow.md` to confirm which stage of `部落格計畫書.md` the project is currently at.

## Project overview

This repo is `alifestone.github.io`, a GitHub Pages **user site** for a personal tech blog ("debug.log — 普通人類的觀察日記"). It is now an **Astro** static site (migrated during 階段3). Content categories: 機器人研究 (robotics — IDLab / LeRobot / SmolVLA), 資安 CTF, 強化學習 (RL), 日文學習.

Two planning documents track direction — read them before structural changes:
- `部落格計畫書.md` — full project plan (design workflow via Claude Design → Claude Code handoff, GitHub Pages/Jekyll/Astro options, CI/CD). Some of it is now history (the Astro path in §五 was chosen); parts about `blog/`, Jekyll, and CI/CD remain aspirational.
- `workflow.md` — the live stage log (階段0–3 done). Read this to see exactly what's built vs. pending.

## Current state

Astro project at the repo root. Key paths:
- `src/pages/` — routes: `index.astro` (home), `posts/index.astro` (list + client-side category/tag filter), `posts/[...slug].astro` (single post + TOC + prev/next), `about.astro`, `projects.astro` (stub), `404.astro`.
- `src/content/posts/*.md` — the content system. Schema in `src/content/config.ts` (frontmatter: `title`, `date`, `category` enum, `tags[]`, `excerpt`, optional `cover` image). **New post = new `.md` file; tags = the frontmatter `tags` array.** `hello-world.md` is the sample/template.
- `src/layouts/BaseLayout.astro` — `<html>` skeleton, Google Fonts, anti-flash theme script, Nav/Footer/Decorations.
- `src/components/` — `Slimo`, `Nav`, `Footer`, `Decorations`, `PostCard`.
- `src/styles/global.css` — the whole design system (theme tokens + every page's styles).
- `src/scripts/site.js` — client brain (see architecture below).
- `src/lib/posts.ts` — collection helpers (`getSortedPosts`, `collectTags`, `catClass`, `fmtDate`, …).
- `首頁.html` is the original single-file prototype — a **design reference only**, excluded from the build and not served. The four Claude Design page sources (`文章頁`/`文章列表`/`關於我`/`404`.dc.html) live in the Claude Design project (pull them with DesignSync when needed); a local `design-reference/` folder can cache them.

GitHub Pages for an Astro site needs the build output deployed (not the repo root). Deploy is **not yet wired** — 階段5/6 will add a GitHub Actions workflow (`withastro/action` + `actions/deploy-pages`) and the repo's Settings → Pages Source must be set to **GitHub Actions**. `astro.config.mjs` already sets `site: 'https://alifestone.github.io'` (user site, no `base`).

## Architecture (design system + Slimo)

- **Theming**: theme tokens (`--bg`, `--ink`, `--accent`, …) are defined for both `:root[data-theme='light'|'dark']` (set by an inline anti-flash script in `BaseLayout` head) **and** `.site.light`/`.site.dark` (toggled by JS). `site.js`'s `toggleTheme` keeps both in sync and persists to `localStorage`. The toggle runs a pixel-grid "wipe" transition (`#wipe` / `.wcell`) before swapping.
- **Slimo pixel art**: the mascot is `<canvas>` sprites drawn at native low res (18×12 etc.) and CSS-scaled with `image-rendering:pixelated`. `Slimo.astro` just emits `<canvas data-slime="<sprite>">`; `site.js` owns the sprite data (`SPRITES`: `slime`, `slimeLost`, `puddle`, `trail1..3`), palettes (`PAL_BLUE`/`PAL_CORAL`), and `redrawAll()` which scans `canvas[data-slime]` and repaints on theme change. **Add a sprite → add it to `SPRITES` in `site.js`**, then reference by name.
- **Crawling mascot + 404 boing**: `#crawler` is animated per-frame via `requestAnimationFrame` (perimeter loop + squash/stretch). The 404 easter egg (`slimeLost` + `puddle` + trails) squishes on hover/click via the `.boing` keyframe, wired in `initSite`.
- **Fonts**: `DotGothic16` (`.px`, pixel headings/UI), `Noto Sans TC` (body), `JetBrains Mono` (`.mono`, code/tags).
- **Utility CSS**: hand-rolled flex/spacing helpers (`.fx`, `.ac`, `.jb`, `.gap8`, …) at the top of `global.css`. Follow this convention; don't add a CSS framework.

## Working in this repo

- Verify changes by running the app: `npm run dev` (or `npm run build` + `npm run preview`), and check **both** light and dark themes. There is no lint/test tooling.
- Keep components dependency-free static HTML/CSS/JS in the existing style; don't introduce a CSS framework or heavy client libs.
- Preserve the mixed Chinese/English file naming (`首頁.html`, `部落格計畫書.md`, `workflow.md`, `文章頁.dc.html`) rather than renaming to English unless asked.
- The canonical design source lives in the Claude Design project "技術部落格首頁設計" (regular project, not a design-system project). Pull updates with the DesignSync tool / `/design-sync`; the `.dc.html` files use the Design Component format (`DCLogic`, `sc-for`/`sc-if`, props panel).
