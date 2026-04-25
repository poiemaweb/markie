# Markie

An ultra-lightweight companion that renders markdown text beautifully in real-time.
This repository is currently in the **Web MVP (v0.1)** phase, with plans to wrap it in Tauri or Electron in future stages to extend it into a tray-resident app with global shortcuts.

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

## Next Milestones

- **M3 (Scaffold Complete)**: `src-tauri/` Rust backend — tray, global shortcuts, clipboard IPC
  - `tauri-bridge.ts` auto-branches between web/desktop based on `window.__TAURI__` presence
  - Actual execution requires Node 18+ · Rust 1.77+ environment via `npm run tauri:dev`
- **M5**: KaTeX · Mermaid · SQLite history migration

---

## License

Internal project. License to be determined upon public release.
