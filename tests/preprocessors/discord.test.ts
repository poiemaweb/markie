import { describe, expect, it } from 'vitest';
import { preprocessDiscord } from '../../src/preprocessors/discord';

describe('preprocessDiscord', () => {
  it('스포일러를 span.spoiler로 변환한다', () => {
    const input = '답은 ||42|| 입니다';
    expect(preprocessDiscord(input)).toBe('답은 <span class="spoiler" data-spoiler="1">42</span> 입니다');
  });

  it('subtext 문법을 small 태그로 변환한다', () => {
    const input = '-# 이건 작은 글씨';
    expect(preprocessDiscord(input)).toBe('<small class="subtext">이건 작은 글씨</small>');
  });

  it('이스케이프된 구두점을 정리한다', () => {
    const input = 'escaped \\* and \\_ and \\~';
    expect(preprocessDiscord(input)).toBe('escaped * and _ and ~');
  });

  it('코드블록 내부는 건드리지 않는다', () => {
    const input = '```\n||not spoiler||\n```';
    expect(preprocessDiscord(input)).toBe(input);
  });
});
