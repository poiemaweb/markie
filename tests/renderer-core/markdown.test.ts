import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/renderer-core/markdown';

describe('renderMarkdown — mermaid fence', () => {
  it('mermaid 블록을 mermaid-pending div로 변환한다', () => {
    const input = '```mermaid\ngraph TD\n  A --> B\n```';
    const html = renderMarkdown(input);
    expect(html).toContain('class="mermaid-pending"');
    expect(html).not.toContain('<pre class="hljs">');
  });

  it('mermaid 코드 내 특수문자를 HTML 이스케이프한다', () => {
    const input = '```mermaid\ngraph TD\n  A["<클라이언트>"] --> B\n```';
    const html = renderMarkdown(input);
    expect(html).toContain('&lt;클라이언트&gt;');
  });

  it('textContent로 읽으면 원본 코드가 복원된다', () => {
    // vitest env is jsdom — `document` is available globally
    const input = '```mermaid\ngraph TD\n  A --> B\n```';
    const html = renderMarkdown(input);
    const container = document.createElement('div');
    container.innerHTML = html;
    const node = container.querySelector('.mermaid-pending');
    expect(node).not.toBeNull();
    expect(node!.textContent).toContain('graph TD');
    expect(node!.textContent).toContain('A --> B');
  });

  it('다른 언어 코드 블록은 영향받지 않는다', () => {
    const input = '```ts\nconst x = 1;\n```';
    const html = renderMarkdown(input);
    expect(html).toContain('<pre class="hljs">');
    expect(html).not.toContain('mermaid-pending');
  });
});
