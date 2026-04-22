import { describe, expect, it } from 'vitest';
import { preprocessTelegram } from '../../src/preprocessors/telegram';

describe('preprocessTelegram', () => {
  it('MarkdownV2 이스케이프를 복원한다', () => {
    const input = '안녕\\. 이건 \\*별표\\*와 \\_언더스코어\\_';
    expect(preprocessTelegram(input)).toBe('안녕. 이건 *별표*와 _언더스코어_');
  });

  it('이중 언더스코어를 볼드로 변환한다', () => {
    const input = '여기 __중요__한 문장';
    expect(preprocessTelegram(input)).toBe('여기 **중요**한 문장');
  });

  it('코드블록 내부는 이스케이프를 유지한다', () => {
    const input = '```\n\\*code\\*\n```';
    expect(preprocessTelegram(input)).toBe(input);
  });

  it('괄호·대괄호 이스케이프를 해제한다', () => {
    const input = '참고\\[1\\]';
    expect(preprocessTelegram(input)).toBe('참고[1]');
  });

  it('파이프 테이블 감지 후 구분선 삽입', () => {
    const input = '| 옵션 | 값 |\n| A | 1 |';
    expect(preprocessTelegram(input)).toContain('---');
  });
});
