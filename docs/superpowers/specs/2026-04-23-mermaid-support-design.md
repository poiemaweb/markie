# Mermaid.js Diagram Support — Design Spec

**Date:** 2026-04-23  
**Status:** Approved  
**Scope:** Add `\`\`\`mermaid` fenced code block rendering as SVG diagrams

---

## Problem

ASCII art system diagrams with Korean text render misaligned because CJK characters are double-width but treated as single-width in monospace fonts. The fix is to support proper diagram syntax that renders as clean SVG graphics.

---

## Goal

Users write standard Mermaid diagram syntax in fenced code blocks (`\`\`\`mermaid`). The app renders them as vector SVG diagrams — proper rectangular boxes, clean arrows, no font-width issues.

---

## Architecture

### Data Flow

```
markdown-it fence renderer
  └─ lang === "mermaid"
       ↓
<div class="mermaid-pending">raw diagram code</div>
       ↓ dangerouslySetInnerHTML (existing path, unchanged)
DOM placeholder in previewRef
       ↓ useEffect([html]) in App.tsx
mermaid.render(uniqueId, code) → SVG string
       ↓
node.innerHTML = svg  (in-place replacement)
node.className = "mermaid-diagram"
```

### Key Design Decisions

- **`renderMarkdown()` stays synchronous** — no API surface change. All existing callers (App.tsx `useMemo`, tests) unaffected.
- **Lazy import of mermaid** — `import('mermaid')` inside `useEffect` keeps it out of the initial bundle.
- **`mermaid.render()` not `mermaid.run()`** — returns SVG string directly, no global DOM scan, no class-name dependency.
- **One `useEffect`, one dependency: `html`** — fires only when content changes. Theme-aware re-render is deferred to v2.

---

## File Changes

### 1. `package.json`
Add runtime dependency:
```json
"mermaid": "^10.x"
```

### 2. `src/renderer-core/markdown.ts`
Override the `fence` renderer rule inside `createRenderer()`:

```ts
const defaultFence = md.renderer.rules.fence ?? 
  ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const lang = token.info.trim().toLowerCase();
  if (lang === 'mermaid') {
    const escaped = token.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="mermaid-pending">${escaped}</div>\n`;
  }
  return defaultFence(tokens, idx, options, env, self);
};
```

### 3. `src/App.tsx`
Add one `useEffect` after the existing `html` memo, before the JSX return:

```tsx
useEffect(() => {
  if (!previewRef.current) return;
  const nodes = Array.from(
    previewRef.current.querySelectorAll<HTMLDivElement>('.mermaid-pending')
  );
  if (!nodes.length) return;

  let cancelled = false;

  import('mermaid').then(({ default: mermaid }) => {
    if (cancelled) return;
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

    nodes.forEach(async (node, i) => {
      const code = node.textContent ?? '';
      try {
        const id = `mermaid-${Date.now()}-${i}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          node.innerHTML = svg;
          node.className = 'mermaid-diagram';
        }
      } catch (err) {
        if (!cancelled) {
          node.textContent = `[Mermaid 오류: ${err instanceof Error ? err.message : err}]`;
          node.className = 'mermaid-error';
        }
      }
    });
  });

  return () => { cancelled = true; };
}, [html]);
```

### 4. `src/styles/markdown.css`
Append at end of file:

```css
/* Mermaid diagrams */
.mermaid-pending {
  margin: 1.2em 0;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--fg-muted);
  font-size: 0.8em;
  opacity: 0.5;
}

.mermaid-diagram {
  margin: 1.2em 0;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.mermaid-diagram svg {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.mermaid-error {
  margin: 1.2em 0;
  padding: 12px 16px;
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--fg-muted);
  font-family: var(--font-mono);
  font-size: 0.85em;
}
```

---

## Error Handling

- Invalid mermaid syntax → node shows `[Mermaid 오류: <message>]` with `.mermaid-error` class
- `cancelled` flag prevents async mutations after component unmount or rapid re-renders
- The rest of the markdown renders normally even if mermaid blocks fail

---

## Out of Scope (v1)

- Theme-synchronized mermaid colors (dark/light/sepia) — mermaid uses its default theme
- Re-render diagrams when only the theme changes (requires `[html, settings.theme]` + storing original code)
- Export-time mermaid re-rendering — SVGs are already in DOM at export time, so PNG/PDF export works automatically

---

## Testing

Manual verification:
1. Paste a `\`\`\`mermaid` block — diagram renders as SVG
2. Paste invalid mermaid syntax — error message shown inline, rest of content unaffected
3. Export PNG/PDF with a diagram — SVG appears correctly in the export
4. Clear content and re-paste — diagram re-renders cleanly
