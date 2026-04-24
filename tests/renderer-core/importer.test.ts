import { describe, expect, it } from 'vitest';
import { normalizeImportedText } from '../../src/renderer-core/importer';

describe('normalizeImportedText', () => {
  it('이미 flush-left 인 경우 그대로 유지', () => {
    const input = '# Title\n\nhello';
    expect(normalizeImportedText(input)).toBe(input);
  });

  it('일반 텍스트의 leading 공백은 모두 제거한다', () => {
    const input = '    # Title\n    \n    hello\n      world';
    expect(normalizeImportedText(input)).toBe('# Title\n\nhello\nworld');
  });

  it('불균일 들여쓰기도 모두 flush-left 로 정리', () => {
    const input = '  첫줄 2칸\n\n    둘째줄 4칸\n      셋째줄 6칸';
    expect(normalizeImportedText(input)).toBe('첫줄 2칸\n\n둘째줄 4칸\n셋째줄 6칸');
  });

  it('중첩 리스트는 상대 들여쓰기를 보존', () => {
    const input = '- item\n  - nested\n    - deeper\n- item 2';
    expect(normalizeImportedText(input)).toBe(input);
  });

  it('균일 래핑된 중첩 리스트는 wrap 만 벗기고 내부 구조 유지', () => {
    const input = '    - item\n      - nested\n    - item 2';
    expect(normalizeImportedText(input)).toBe('- item\n  - nested\n- item 2');
  });

  it('ASCII 트리 블록은 자동으로 fenced 코드 블록으로 래핑되고 루트 제목은 함께 포함', () => {
    const input = [
      '  📌 내 대시보드',
      '  ├── 안내 문구',
      '  │',
      '  └── 📋 작업 및 일정',
      '      ├── 주간 팀 미팅',
      '      └── 장보기',
    ].join('\n');
    expect(normalizeImportedText(input)).toBe(
      [
        '```',
        '📌 내 대시보드',
        '├── 안내 문구',
        '│',
        '└── 📋 작업 및 일정',
        '    ├── 주간 팀 미팅',
        '    └── 장보기',
        '```',
      ].join('\n'),
    );
  });

  it('직전 줄이 "제목:" 처럼 콜론으로 끝나면 트리 fence 밖에 유지', () => {
    const input = ['생성된 구조:', '', '├── A', '└── B'].join('\n');
    expect(normalizeImportedText(input)).toBe(
      ['생성된 구조:', '', '```', '├── A', '└── B', '```'].join('\n'),
    );
  });

  it('펜스 코드 블록 내부는 원본 그대로 보존', () => {
    const input = '```ts\n  const x = 1;\n    return x;\n```';
    expect(normalizeImportedText(input)).toBe(input);
  });

  it('들여쓰기된 펜스 래퍼는 벗겨내되 내부 상대 구조는 유지', () => {
    const input = '    ```ts\n    const x = 1;\n      const y = 2;\n    ```';
    expect(normalizeImportedText(input)).toBe('```ts\nconst x = 1;\n  const y = 2;\n```');
  });

  it('CRLF/CR → LF 정규화', () => {
    expect(normalizeImportedText('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('앞뒤의 완전 공백 줄 제거', () => {
    expect(normalizeImportedText('\n\n  hello  \n\n')).toBe('hello  ');
  });

  it('완전 공백만 있으면 빈 문자열', () => {
    expect(normalizeImportedText('   \n\t\n  ')).toBe('');
  });
});
