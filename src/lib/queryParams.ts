import type { ForecastQuery } from '../features/forecast/types';

/**
 * Převod dotazu na předpověď do/z parametrů URL, aby šlo odkaz sdílet
 * a po obnovení stránky se zobrazilo stejné místo (?city=3067696 nebo ?lat=…&lon=…).
 */
export const queryToSearch = (query: ForecastQuery): string =>
  `?${new URLSearchParams(
    query.kind === 'city'
      ? { city: String(query.cityId) }
      : { lat: query.lat.toFixed(4), lon: query.lon.toFixed(4) },
  )}`;

const toNumber = (value: string | null): number | null =>
  value !== null && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

export const searchToQuery = (search: string): ForecastQuery | null => {
  const params = new URLSearchParams(search);
  const cityId = toNumber(params.get('city'));
  const lat = toNumber(params.get('lat'));
  const lon = toNumber(params.get('lon'));
  if (cityId !== null && Number.isInteger(cityId) && cityId > 0) return { kind: 'city', cityId };
  if (lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { kind: 'coords', lat, lon };
  return null;
};
