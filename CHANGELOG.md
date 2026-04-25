# Changelog

All notable changes to **Markie** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While Markie is in `0.x`, minor releases (`0.x.0`) may include breaking changes.
The contract becomes stable at `1.0.0`.

## [Unreleased]

_No changes yet._

## [0.2.0] - 2026-04-25

First public alpha. Project renamed from "Markdown Preview Companion" to **Markie**, with full release tooling (signed bundles via GitHub Actions, MIT license, CI, changelog, recording guide).

### Added
- LICENSE — MIT.
- CHANGELOG (Keep a Changelog 1.1.0).
- RELEASE_CHECKLIST.md — release procedure and `1.0.0` promotion criteria.
- `scripts/bump-version.mjs` — keeps `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` in sync.
- CI workflow (`.github/workflows/ci.yml`) — typecheck + build on push and PR.
- Release workflow (`.github/workflows/release.yml`) — Tauri bundles for macOS, Linux, Windows on `v*` tag push, drafted on GitHub Releases.
- Demo GIF (`docs/markie-demo.gif`) — paste → render → export, embedded in README.
- Demo GIF recording guide (`docs/DEMO_GUIDE.md`).
- README badges, install section, roadmap, contributing section.

### Changed
- **PDF export** now splits tall content across standard A4 pages (`595×842pt`) instead of producing a single oversized custom-format page. Page boundaries fall at fixed A4 heights, so very long lines or code blocks may split mid-content; revisit with print-CSS pagination later if needed.
- All repository URLs updated from `poiemaweb/markdown-viewer` to `poiemaweb/markie` after the rename.

## [0.1.0] - 2026-04-25

Initial release of **Markie** — a lightweight desktop/web companion for instantly rendering markdown text.

### Added
- Markdown rendering core (markdown-it + GFM + highlight.js).
- Mermaid diagram rendering with `mermaid-pending` / `mermaid-diagram` / `mermaid-error` states.
- Export pipeline: PDF, PNG, and `.md` download with a unified dropdown menu.
- Themes: Light, Dark, Sepia. Font scale 80–160%.
- Two-pane editor: source (left) ↔ preview (right) with synchronized scroll.
- Drag & drop for `.md` files (Tauri-native event bridge).
- History panel (50 entries via localStorage).
- Settings panel.
- Custom Markie brand mark and app icons.
- Internationalization (i18n) scaffolding — Korean strings extracted to translation system.
- Tauri 2 desktop scaffold: tray icon, global shortcut, clipboard bridge.
- Keyboard shortcuts:
  - `Cmd/Ctrl` + `Enter` — load from clipboard
  - `Cmd/Ctrl` + `P` — export as PDF
  - `Cmd/Ctrl` + `Shift` + `P` — export as PNG
  - `Cmd/Ctrl` + `S` — save preprocessed markdown (with success notification)
  - `Cmd/Ctrl` + `H` — toggle history
  - `Cmd/Ctrl` + `,` — toggle settings
  - `Esc` — close panels
- Imported text normalization: strip common prefix, preserve nested lists/trees, auto-fence tree blocks.

### Fixed
- Mermaid: trim code input, remove dead `list_item_open` rule, error visual handling.
- Mermaid `useEffect`: initialize once, use `Promise.allSettled`, monotonic IDs.
- Mermaid fence: robust language detection and complete HTML escaping.
- PDF/PNG export: clipping, padding, white-space artifacts, and broken text rendering across multiple iterations.
- localStorage migration from legacy `mdpreview` keys to `markie` with validation.

### Changed
- Project renamed from "Markdown Preview Companion" to **Markie**.
- README translated to English; preprocessor references removed.
- Removed platform-detection auto-hint from preview pane.
- Default platform set to Raw Markdown; platform selector UI removed.

[Unreleased]: https://github.com/poiemaweb/markie/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/poiemaweb/markie/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/poiemaweb/markie/releases/tag/v0.1.0
