import type { City, CityIndex, IndexedCity } from './types';

/** Odstraní diakritiku, sjednotí velikost písmen a mezery ("  Ústí nad Labem" → "usti nad labem"). */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const buildIndex = (cities: readonly City[]): CityIndex =>
  cities.map((city) => ({ city, key: normalize(city.name) }));

/**
 * Relevance shody: 0 = celý název, 1 = začátek názvu, 2 = začátek slova v názvu.
 * Shoda uprostřed slova se nepočítá (vracíme null).
 */
const matchRank = (key: string, query: string): number | null => {
  if (key === query) return 0;
  if (key.startsWith(query)) return 1;
  if (key.includes(` ${query}`) || key.includes(`-${query}`)) return 2;
  return null;
};

interface RankedCity {
  readonly entry: IndexedCity;
  readonly rank: number;
}

const compareRanked =
  (preferredCountry: string | undefined) =>
  (a: RankedCity, b: RankedCity): number =>
    a.rank - b.rank ||
    Number(b.entry.city.country === preferredCountry) - Number(a.entry.city.country === preferredCountry) ||
    a.entry.key.length - b.entry.key.length ||
    a.entry.key.localeCompare(b.entry.key);

export interface SearchOptions {
  readonly limit?: number;
  /** ISO kód země, jejíž města se mají řadit dříve (odvozený z jazyka prohlížeče). */
  readonly preferredCountry?: string;
}

/** Vrátí nejrelevantnější města pro zadaný text našeptávače. */
export const searchCities = (index: CityIndex, query: string, options: SearchOptions = {}): City[] => {
  const { limit = 10, preferredCountry } = options;
  const needle = normalize(query);
  if (needle.length < 2) return [];

  return index
    .flatMap((entry): RankedCity[] => {
      const rank = matchRank(entry.key, needle);
      return rank === null ? [] : [{ entry, rank }];
    })
    .toSorted(compareRanked(preferredCountry?.toUpperCase()))
    .slice(0, limit)
    .map(({ entry }) => entry.city);
};

/** Vlajka jako emoji z dvoupísmenného ISO kódu země ("CZ" → 🇨🇿). */
export const countryFlag = (countryCode: string): string =>
  /^[A-Za-z]{2}$/.test(countryCode)
    ? String.fromCodePoint(...[...countryCode.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65))
    : '';

/** Čitelný popis města pro našeptávač, rozlišující stejnojmenná města. */
export const describeCity = (city: City): string =>
  [city.name, city.state, city.country].filter(Boolean).join(', ');
