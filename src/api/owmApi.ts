import type { Forecast, ForecastQuery, ForecastStep } from '../features/forecast/types';

const API_BASE = 'https://api.openweathermap.org/data/2.5';

/** Výsledek volání API – chyby vracíme jako hodnotu, nevyhazujeme výjimky. */
export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: ApiError };

export type ApiErrorKind = 'unauthorized' | 'notFound' | 'rateLimited' | 'network' | 'server';

export interface ApiError {
  readonly kind: ApiErrorKind;
  readonly message: string;
}

/* ---- Tvar odpovědi endpointu /forecast (jen pole, která používáme) ---- */
interface RawStep {
  readonly dt: number;
  readonly main: { temp: number; feels_like: number; humidity: number; pressure: number };
  readonly weather: readonly { description: string; icon: string }[];
  readonly clouds?: { all: number };
  readonly wind?: { speed: number; deg: number };
  readonly pop?: number;
  readonly rain?: { '3h'?: number };
  readonly snow?: { '3h'?: number };
}

interface RawForecast {
  readonly list: readonly RawStep[];
  readonly city: {
    id: number;
    name: string;
    country: string;
    coord: { lat: number; lon: number };
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

const parseStep = (raw: RawStep): ForecastStep => ({
  time: raw.dt * 1000,
  temp: raw.main.temp,
  feelsLike: raw.main.feels_like,
  humidity: raw.main.humidity,
  pressure: raw.main.pressure,
  windSpeed: raw.wind?.speed ?? 0,
  windDeg: raw.wind?.deg ?? 0,
  clouds: raw.clouds?.all ?? 0,
  pop: raw.pop ?? 0,
  precipitation: (raw.rain?.['3h'] ?? 0) + (raw.snow?.['3h'] ?? 0),
  description: raw.weather[0]?.description ?? '',
  icon: raw.weather[0]?.icon ?? '01d',
});

export const parseForecast = (raw: RawForecast): Forecast => ({
  city: {
    id: raw.city.id,
    name: raw.city.name,
    country: raw.city.country,
    coord: raw.city.coord,
    timezoneOffset: raw.city.timezone,
    sunrise: raw.city.sunrise * 1000,
    sunset: raw.city.sunset * 1000,
  },
  steps: raw.list.map(parseStep),
});

const errorFromStatus = (status: number, message: string): ApiError => {
  switch (status) {
    case 401:
      return { kind: 'unauthorized', message: 'Neplatný API klíč OpenWeatherMap (nový klíč se může aktivovat až za několik hodin).' };
    case 404:
      return { kind: 'notFound', message: 'Pro zvolené místo se nepodařilo najít předpověď.' };
    case 429:
      return { kind: 'rateLimited', message: 'Byl překročen limit požadavků na API. Zkuste to prosím za chvíli.' };
    default:
      return { kind: 'server', message: `Služba OpenWeatherMap vrátila chybu ${status}${message ? `: ${message}` : ''}.` };
  }
};

export const buildForecastUrl = (query: ForecastQuery, apiKey: string, lang: string): string => {
  const location: Record<string, string> =
    query.kind === 'city' ? { id: String(query.cityId) } : { lat: String(query.lat), lon: String(query.lon) };
  const params = new URLSearchParams({ ...location, units: 'metric', lang, appid: apiKey });
  return `${API_BASE}/forecast?${params}`;
};

/** Načte předpověď na 5 dní po 3 hodinách. */
export const fetchForecast = async (
  query: ForecastQuery,
  apiKey: string,
  lang: string,
  signal?: AbortSignal,
): Promise<Result<Forecast>> => {
  try {
    const response = await fetch(buildForecastUrl(query, apiKey, lang), { signal });
    const body = await response.json().catch(() => ({}));
    return response.ok
      ? { ok: true, value: parseForecast(body as RawForecast) }
      : { ok: false, error: errorFromStatus(response.status, String(body?.message ?? '')) };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, error: { kind: 'network', message: 'Nepodařilo se spojit se serverem. Zkontrolujte připojení k internetu.' } };
  }
};
