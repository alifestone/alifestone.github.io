# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **deploy-only** GitHub Pages repository. It contains only the pre-built static output from a Hexo 7.3.0 blog — there are no source Markdown posts, no `_config.yml`, no `package.json`, and no build tooling. The source files and build process live in a separate (private) repository.

## Architecture

- **Static Site Generator**: Hexo 7.3.0 (output only — not runnable here)
- **Theme**: Shoka (custom Hexo theme)
- **Frontend**: jQuery 3.6.4, with CDN-loaded assets via jsDelivr
- **Math**: KaTeX; **Diagrams**: Mermaid; **Images**: FancyBox lightbox
- **Comments**: Valine / MiniValine (configured but disabled — no appId/appKey set)
- **Search**: Algolia (configured but not enabled)
- **Feeds**: `atom.xml`, `rss.xml`, `feed.json`

## Key Files

| File | Role |
|------|------|
| `js/app.js` | Main app logic; contains the embedded `CONFIG` object with site settings (CDN URLs, audio playlists, feature flags, Valine/Algolia config) |
| `css/app.css` | Primary stylesheet (111 KB, compiled from theme source) |
| `index.html` | Homepage |
| `images/avatar.jpg` | Author profile photo |

## Working in This Repo

Because there is no build step here, changes are made directly to the compiled HTML/CSS/JS files. When editing:

- **Site-wide config** (feature flags, playlists, CDN overrides): edit the `CONFIG` object in `js/app.js`
- **Styles**: edit `css/app.css` or `css/style.css`
- **Content**: edit the relevant `index.html` files under `2024/`, `archives/`, `categories/`, `tags/`, etc.
- **Static assets**: drop files into `images/` or the root directory

After making changes, commit and push to the `main` branch — GitHub Pages deploys automatically on push.
