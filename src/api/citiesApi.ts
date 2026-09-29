import type { City } from '../features/cities/types';
import type { Result } from './owmApi';

/** Seznam měst leží v aplikaci jako samostatný statický JSON a načítá se až za běhu. */
export const CITIES_URL = `${import.meta.env.BASE_URL}data/city.list.min.json`;

export const fetchCities = async (): Promise<Result<City[]>> => {
  try {
    const response = await fetch(CITIES_URL);
    return response.ok
      ? { ok: true, value: (await response.json()) as City[] }
      : { ok: false, error: { kind: 'server', message: `Seznam měst se nepodařilo načíst (HTTP ${response.status}).` } };
  } catch {
    return { ok: false, error: { kind: 'network', message: 'Seznam měst se nepodařilo načíst. Zkontrolujte připojení.' } };
  }
};
