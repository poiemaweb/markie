import { describe, expect, it } from 'vitest';
import { detectPlatform } from '../../src/preprocessors/detect';
import { preprocessAuto } from '../../src/preprocessors';

describe('detectPlatform', () => {
  it('Slack 링크 문법이 있으면 slack으로 감지', () => {
    const input = '문서 <https://a.com|링크> 보기';
    expect(detectPlatform(input).platform).toBe('slack');
  });

  it('스포일러가 있으면 discord로 감지', () => {
    const input = '정답은 ||비밀|| 이에요';
    expect(detectPlatform(input).platform).toBe('discord');
  });

  it('Telegram 이스케이프가 많으면 telegram으로 감지', () => {
    const input = '안녕\\. 오늘은 \\*특별\\*한 \\_하루\\_ 입니다\\.';
    expect(detectPlatform(input).platform).toBe('telegram');
  });

  it('평범한 마크다운은 raw로 감지', () => {
    const input = '# 제목\n\n본문 **볼드** 끝';
    const result = preprocessAuto(input);
    expect(result.platform).toBe('raw');
  });
});
