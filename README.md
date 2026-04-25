# Markie

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/poiemaweb/markdown-viewer?include_prereleases&sort=semver)](https://github.com/poiemaweb/markdown-viewer/releases)

An ultra-lightweight companion that renders markdown text beautifully — paste, drag, or import, and see the result instantly. Ships as a web app and a tray-resident desktop app (macOS / Windows / Linux) via Tauri 2.

> **Status:** `0.1.x` — early preview. APIs, shortcuts, and storage formats may change before `1.0`. See [CHANGELOG.md](./CHANGELOG.md).

---

## Demo

<!-- TODO: replace with a real GIF before v0.2.0 release -->
<!-- ![Markie demo](docs/demo.gif) -->
_A short demo GIF will appear here in `v0.2.0`. See [`docs/DEMO_GUIDE.md`](./docs/DEMO_GUIDE.md) for the recording recipe._

---

## Install

Pre-built desktop bundles are attached to each [GitHub Release](https://github.com/poiemaweb/markdown-viewer/releases):

| Platform | Asset |
| --- | --- |
| macOS  | `Markie_x.y.z_universal.dmg` |
| Windows | `Markie_x.y.z_x64-setup.msi` |
| Linux  | `markie_x.y.z_amd64.AppImage` / `.deb` |

For the web build, open the latest [`gh-pages`](https://poiemaweb.github.io/markdown-viewer/) deployment (planned for `v0.2.0`).

> First public release (`v0.2.0`) is not yet tagged — until then, build from source as shown in **Quick Start**.

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Static bundle (dist/)

# Desktop app (Node 18+ / Rust 1.77+ required)
npm run tauri:dev    # Tray resident + global shortcuts
npm run tauri:build  # .dmg / .msi / .AppImage bundles
```

> The web renderer is pinned to Node 16 + vite 4 for compatibility. Building the Tauri wrapper requires Node 18+ · Rust 1.77+ · OS-specific WebView toolchains.

---

## What's Inside

- **Renderer Core** (`src/renderer-core/`)
  - `markdown.ts` · markdown-it(GFM) + highlight.js
  - `exporter.ts` · PNG(html-to-image), PDF(jsPDF), .md download
  - `importer.ts` · Text normalization, clipboard and file import
- **UI** (`src/components/`)
  - Light/Dark/Sepia themes, font scale 80~160%
  - Split pane: source on left, rendered on right
  - History 50 entries (localStorage) + settings panel + shortcuts (Cmd/Ctrl+Enter, etc.)

---

## Keyboard Shortcuts (Web MVP)

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl` + `Enter` | Import from clipboard and render |
| `Cmd/Ctrl` + `P` | Export PDF |
| `Cmd/Ctrl` + `Shift` + `P` | Export PNG |
| `Cmd/Ctrl` + `S` | Save as Markdown file |
| `Cmd/Ctrl` + `H` | Toggle history panel |
| `Cmd/Ctrl` + `,` | Toggle settings panel |
| `Esc` | Close open panels |

The desktop wrapper (next phase) will extend this with a **global** `Cmd/Ctrl+Shift+V` shortcut that works even when the window is not focused.

---

## Architecture Notes

```
markie/
├── package.json
├── tsconfig.json · tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js · postcss.config.js
├── index.html · README.md
├── public/
│   └── vite.svg
├── src-tauri/                    # Rust backend (Tauri 2 scaffold)
│   ├── Cargo.toml · build.rs · tauri.conf.json
│   ├── capabilities/default.json
│   └── src/
│       ├── main.rs               # App entry point + window lifecycle
│       ├── clipboard.rs          # read/write_clipboard_text IPC
│       ├── shortcut.rs           # Cmd/Ctrl+Shift+V global shortcut
│       └── tray.rs               # Tray icon + context menu
└── src/                          # React frontend
    ├── main.tsx · App.tsx
    ├── types.ts                  # Settings, HistoryEntry shared types
    ├── tauri-bridge.ts           # Tauri IPC adapter (with web fallback)
    ├── components/               # Toolbar, HistoryPanel, SettingsPanel, EmptyState, DownloadFlyout
    ├── renderer-core/
    │   ├── markdown.ts           # markdown-it + highlight.js
    │   ├── exporter.ts           # PNG / PDF / .md export
    │   └── importer.ts           # Text normalization, clipboard/file import
    ├── store/
    │   └── history.ts · settings.ts
    └── styles/                   # global + markdown + highlight.css
```

---

## Roadmap

- **0.2.0** — First public release. Demo GIF, GitHub Pages web build, signed desktop bundles via Tauri Action.
- **0.3.0** — KaTeX math rendering, larger sample corpus.
- **0.4.0** — SQLite-backed history (replacing localStorage), Tauri auto-updater.
- **1.0.0** — Stable contract (storage, shortcuts, public API). See `RELEASE_CHECKLIST.md` for the promotion criteria.

For per-release detail, see [CHANGELOG.md](./CHANGELOG.md).

---

## Releasing

Maintainers: see [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md). Short version:

```bash
node scripts/bump-version.mjs 0.2.0     # syncs package.json + tauri.conf.json + Cargo.toml
git commit -am "chore: release v0.2.0"
git tag -a v0.2.0 -m "v0.2.0"
git push && git push --tags             # GitHub Actions builds + drafts the release
```

---

## Contributing

Issues and pull requests are welcome. Before submitting:

- Run `npm run typecheck` and `npm run build` locally.
- Reference the section of `CHANGELOG.md` your change belongs in (`Added` / `Changed` / `Fixed` / `Removed`).
- For breaking changes during `0.x`, call it out explicitly in the PR description.

---

## License

[MIT](./LICENSE) © 2026 elounge
