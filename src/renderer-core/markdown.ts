import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

let cachedInstance: MarkdownIt | null = null;

function createRenderer(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    xhtmlOut: false,
    breaks: true,
    linkify: true,
    typographer: false,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const result = hljs.highlight(code, { language: lang, ignoreIllegals: true });
          return `<pre class="hljs"><code class="language-${escapeAttr(lang)}">${result.value}</code></pre>`;
        } catch {
          /* fall through to auto */
        }
      }
      const auto = hljs.highlightAuto(code);
      return `<pre class="hljs"><code class="language-${escapeAttr(auto.language ?? 'plaintext')}">${auto.value}</code></pre>`;
    },
  });

  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const existingTarget = token.attrIndex('target');
    if (existingTarget < 0) {
      token.attrPush(['target', '_blank']);
    } else {
      token.attrs![existingTarget][1] = '_blank';
    }
    const existingRel = token.attrIndex('rel');
    if (existingRel < 0) {
      token.attrPush(['rel', 'noopener noreferrer']);
    } else {
      token.attrs![existingRel][1] = 'noopener noreferrer';
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  // Mermaid: intercept fence blocks with lang="mermaid"
  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = token.info.trim().split(/\s+/)[0].toLowerCase();
    if (lang === 'mermaid') {
      const escaped = token.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `<div class="mermaid-pending">${escaped}</div>\n`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };

  return md;
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
  );
}

export function renderMarkdown(input: string): string {
  if (!cachedInstance) {
    cachedInstance = createRenderer();
  }
  return cachedInstance.render(input);
}

export function renderInline(input: string): string {
  if (!cachedInstance) {
    cachedInstance = createRenderer();
  }
  return cachedInstance.renderInline(input);
}
