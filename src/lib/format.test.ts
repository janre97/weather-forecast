import { apiLanguage, createFormatters, localeCountry } from './format';

// 2026-07-01 14:30 v "posunutém" čase města
const T = Date.parse('2026-07-01T14:30:00Z');

describe('createFormatters', () => {
  it('formátuje podle české kultury', () => {
    const f = createFormatters('cs-CZ');
    expect(f.time(T)).toBe('14:30');
    expect(f.date(T)).toBe('1. 7.');
    expect(f.weekday(T)).toBe('středa');
    expect(f.temperature(21.6)).toBe('22 °C');
    expect(f.temperature(-0.3)).toBe('0 °C');
    expect(f.percent(0.35)).toBe('35\u00a0%');
  });

  it('formátuje podle americké kultury', () => {
    const f = createFormatters('en-US');
    expect(f.time(T)).toBe('2:30 PM');
    expect(f.date(T)).toBe('7/1');
    expect(f.weekday(T)).toBe('Wednesday');
  });

  it('pojmenuje dnešek a zítřek relativně', () => {
    const f = createFormatters('cs');
    expect(f.dayName(T, '2026-07-01')).toBe('dnes');
    expect(f.dayName(T, '2026-06-30')).toBe('zítra');
    expect(f.dayName(T, '2026-06-28')).toBe('středa');
  });
});

describe('apiLanguage / localeCountry', () => {
  it('odvodí jazyk pro API a zemi z locale', () => {
    expect(apiLanguage('cs-CZ')).toBe('cs');
    expect(apiLanguage('zh-TW')).toBe('zh_tw');
    expect(localeCountry('cs-CZ')).toBe('CZ');
    expect(localeCountry('cs')).toBe('CZ');
  });
});
