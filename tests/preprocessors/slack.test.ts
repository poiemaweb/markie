import { describe, expect, it } from 'vitest';
import { preprocessSlack } from '../../src/preprocessors/slack';

describe('preprocessSlack', () => {
  it('단일 별표를 이중 별표(볼드)로 변환한다', () => {
    const input = '안녕 *중요한* 메시지';
    expect(preprocessSlack(input)).toBe('안녕 **중요한** 메시지');
  });

  it('슬랙 링크 문법을 표준 링크로 변환한다', () => {
    const input = '문서는 <https://example.com/docs|여기>에 있어요';
    expect(preprocessSlack(input)).toBe('문서는 [여기](https://example.com/docs)에 있어요');
  });

  it('label 없는 bare URL도 표준화한다', () => {
    const input = '<https://example.com> 열어봐';
    expect(preprocessSlack(input)).toBe('https://example.com 열어봐');
  });

  it('물결은 취소선으로 변환한다', () => {
    const input = '~삭제됨~ 정상';
    expect(preprocessSlack(input)).toBe('~~삭제됨~~ 정상');
  });

  it('mailto 링크를 표준화한다', () => {
    const input = '연락 <mailto:a@b.com|여기>로',
      expected = '연락 [여기](mailto:a@b.com)로';
    expect(preprocessSlack(input)).toBe(expected);
  });

  it('코드블록 안 내용은 건드리지 않는다', () => {
    const input = '```\n*literal*\n<https://a|b>\n```';
    expect(preprocessSlack(input)).toBe(input);
  });

  it('인라인 코드 안 단일 별표도 건드리지 않는다', () => {
    const input = '텍스트 `*star*` 정상';
    expect(preprocessSlack(input)).toBe('텍스트 `*star*` 정상');
  });

  it('파이프 테이블에 구분선을 자동 삽입한다', () => {
    const input = '| a | b |\n| 1 | 2 |';
    const result = preprocessSlack(input);
    expect(result).toContain('---');
  });
});
