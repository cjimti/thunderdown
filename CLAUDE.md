# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thunderdown is a Thunderbird extension (WebExtension Manifest v3) that converts Markdown to email-safe, inline-styled HTML in the compose window. It targets Thunderbird/Firefox 128.0+.

## Build & Run

There is no build system. The extension is a plain directory of JS/HTML/CSS files.

```bash
# Package the extension
cd /path/to/repo && zip -r thunderdown.xpi thunderdown/

# Install: Add-ons Manager (Ctrl+Shift+A) → gear icon → Install Add-on From File → select .xpi
```

## Architecture

Three-tier event-driven design inside `thunderdown/`:

- **`background.js`** — Entry point. Handles toolbar button clicks and keyboard shortcut (Ctrl+Shift+M). Calls renderer to convert Markdown, uses Thunderbird `messenger.compose` API to read/write the compose body. Toggles between Markdown source and rendered HTML.
- **`lib/renderer.js`** — Markdown-to-HTML engine using `marked.js` + `highlight.js`. All CSS is inlined (no `<style>` blocks) because email clients strip them. Exports `renderMarkdown()` on `globalThis.Thunderdown`.
- **`lib/state.js`** — Per-tab state tracker (in-memory Map). Stores original Markdown so the toggle can restore it. Exports `ThunderdownState` on `globalThis`.
- **`popup/`** — Status indicator UI showing current render state and shortcut hint.

## Key Conventions

- **No npm/bundler** — modules load via `importScripts()` and export on `globalThis`
- **Email safety** — all styles must be inlined; never use `<style>` blocks or CSS classes for visual styling
- **Vendor libs** are in `vendor/` with versions documented in `vendor/VENDOR.md` (marked v15.0.12, highlight.js v11.11.1)
- **Naming**: camelCase for functions/variables, UPPER_CASE for constants, underscore prefix for private (`_tabState`)
- **Thunderbird API**: uses `messenger.*` namespace (Thunderbird's name for the WebExtension API)

## Extension Manifest

- ID: `thunderdown@cjimti.com`
- Permission: `compose` (Thunderbird-specific)
- Compose action button in main toolbar
