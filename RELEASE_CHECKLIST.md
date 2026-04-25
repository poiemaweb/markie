# Release Checklist

Use this checklist before tagging any new version. Copy the relevant section into your release notes / GitHub Release description.

---

## v0.2.0 — First Public Release

This is Markie's first public-facing release. Treat it like opening night.

### A. Repository hygiene (one-time, before going public)

- [ ] Decide license (recommended: **MIT** or **Apache-2.0**) and add `LICENSE` at repo root.
- [ ] Add license badge to `README.md`.
- [ ] Confirm `.windsurfrules` (or any AI rule file) does not contain private prompts / company info before pushing public.
- [ ] Confirm no API keys, tokens, or `.env` files are tracked (`git grep -i "api[_-]key\|secret\|password"`).
- [ ] Remove `"private": true` from `package.json` only if you intend to publish to npm (otherwise leave it — it's a safety net).
- [ ] Confirm `repository` / `homepage` / `bugs` fields exist in `package.json` once the GitHub URL is known.

### B. Code & quality

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` produces a working `dist/` (open `dist/index.html` in a browser, sanity-check render).
- [ ] Manual smoke test for the golden path:
  - [ ] Paste markdown → see rendered preview.
  - [ ] Drag a `.md` file into the window → loads.
  - [ ] Export PDF → downloads with no clipping.
  - [ ] Export PNG → downloads with no clipping.
  - [ ] Export `.md` → downloads.
  - [ ] Mermaid block renders to SVG.
  - [ ] Themes toggle (Light / Dark / Sepia).
  - [ ] Font scale slider works.
  - [ ] History panel persists across reloads.
- [ ] Tauri build works locally on at least one OS: `npm run tauri:build`.

### C. Documentation

- [ ] `README.md` includes:
  - [ ] One-line tagline at top.
  - [ ] Demo GIF or screenshot (the single biggest factor for stars).
  - [ ] "Install" section with download links once releases exist.
  - [ ] "Build from source" section.
  - [ ] License section.
- [ ] `CHANGELOG.md` Unreleased section moved into a versioned section with today's date.
- [ ] Replace `OWNER/markie` placeholder in CHANGELOG compare/release links with real org.

### D. Versioning

- [ ] Bump version: `node scripts/bump-version.mjs 0.2.0`
- [ ] Commit: `git commit -am "chore: release v0.2.0"`
- [ ] Tag: `git tag -a v0.2.0 -m "v0.2.0"`
- [ ] Push: `git push && git push --tags`

### E. Release

- [ ] GitHub Actions `Release` workflow runs successfully on tag push.
- [ ] Draft release appears on GitHub with macOS / Windows / Linux artifacts attached.
- [ ] Test-download at least one artifact; verify it launches.
- [ ] Edit release notes (paste `CHANGELOG.md` v0.2.0 section).
- [ ] Publish release (un-draft).

### F. Post-release

- [ ] Announce (optional): personal blog, dev.to, Hacker News "Show HN", Product Hunt, Reddit r/productivity.
- [ ] Watch issues / discussions for the first 48 hours.
- [ ] Reset `CHANGELOG.md` Unreleased section to empty.

---

## Subsequent releases (template)

For every release after `v0.2.0`:

- [ ] All checks in **B. Code & quality** above pass.
- [ ] CHANGELOG Unreleased → versioned section with date.
- [ ] `npm run release:bump <new-version>`
- [ ] Commit, tag, push.
- [ ] Verify GitHub Actions release succeeds.
- [ ] Edit release notes → publish.
- [ ] Reset Unreleased section.

## When to bump 1.0.0

Only when **all** of these hold:

- [ ] No breaking change planned for the next 2 minor releases.
- [ ] Tauri auto-updater wired and working in production.
- [ ] CHANGELOG has at least 3 minor versions of stabilization (`0.2`, `0.3`, `0.4`+).
- [ ] At least 50 real-world rendering samples validated (diverse markdown sources).
- [ ] External usage signal (downloads, stars, issues from non-team users).

`1.0.0` is a promise of stability. Shipping it before you mean it forces an avoidable `2.0.0` later.
