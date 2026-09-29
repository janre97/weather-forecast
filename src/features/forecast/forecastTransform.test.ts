import { parseForecast } from '../../api/owmApi';
import { groupByDay, toCityTime } from './forecastTransform';

// Praha v létě: UTC+2. Kroky od 2026-07-01 00:00 UTC po 3 hodinách.
const START = Date.parse('2026-07-01T00:00:00Z') / 1000;
const raw = {
  city: { id: 3067696, name: 'Prague', country: 'CZ', coord: { lat: 50.08, lon: 14.42 }, timezone: 7200, sunrise: 0, sunset: 0 },
  list: Array.from({ length: 16 }, (_, i) => ({
    dt: START + i * 3 * 3600,
    main: { temp: 10 + i, feels_like: 9 + i, humidity: 50, pressure: 1015 },
    weather: [{ description: i === 3 ? 'jasno' : 'oblačno', icon: i === 3 ? '01d' : '04n' }],
    wind: { speed: i, deg: 90 },
    pop: i / 20,
    ...(i === 3 ? { rain: { '3h': 1.2 }, snow: { '3h': 0.3 } } : {}),
  })),
};

describe('parseForecast', () => {
  it('převede odpověď API na doménový tvar', () => {
    const forecast = parseForecast(raw);
    expect(forecast.city).toMatchObject({ name: 'Prague', timezoneOffset: 7200 });
    expect(forecast.steps[0]).toMatchObject({ time: START * 1000, temp: 10, windSpeed: 0, precipitation: 0 });
    expect(forecast.steps[3].precipitation).toBeCloseTo(1.5);
  });
});

describe('groupByDay', () => {
  const days = groupByDay(parseForecast(raw));

  it('seskupí kroky podle dne v místním čase města', () => {
    // 00:00 UTC = 02:00 místního času → první den má kroky 02:00 … 23:00 (8 kroků)
    expect(days.map((day) => day.key)).toEqual(['2026-07-01', '2026-07-02']);
    expect(days.map((day) => day.steps.length)).toEqual([8, 8]);
  });

  it('spočítá denní souhrn', () => {
    const [first] = days;
    expect(first).toMatchObject({ tempMin: 10, tempMax: 17, windMax: 7, pop: 0.35, humidity: 50 });
    expect(first.precipitation).toBeCloseTo(1.5);
    // krok v 11:00 místního času (index 3) je nejblíže poledni
    expect(first).toMatchObject({ description: 'jasno', icon: '01d' });
  });

  it('ikona dne je vždy denní varianta', () => {
    expect(days[1].icon).toBe('04d');
  });
});

describe('toCityTime', () => {
  it('posune čas o časové pásmo města', () => {
    expect(toCityTime(0, 3600)).toBe(3_600_000);
  });
});
