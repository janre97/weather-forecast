import { buildIndex, countryFlag, describeCity, normalize, searchCities } from './citySearch';
import type { City } from './types';

const city = (id: number, name: string, country = 'CZ', state?: string): City => ({
  id,
  name,
  country,
  ...(state ? { state } : {}),
  coord: { lat: 0, lon: 0 },
});

const cities = [
  city(1, 'Praha', 'CZ'),
  city(2, 'Prague', 'US', 'OK'),
  city(3, 'Prachatice'),
  city(4, 'Ústí nad Labem'),
  city(5, 'Nová Paka'),
  city(6, 'Opava'),
  city(7, 'Prague', 'CZ'),
  city(8, 'Praha', 'CZ'),
];
const index = buildIndex(cities);
const ids = (result: City[]) => result.map((c) => c.id);

describe('normalize', () => {
  it('odstraní diakritiku, velikost písmen a nadbytečné mezery', () => {
    expect(normalize('  Ústí   nad Labem ')).toBe('usti nad labem');
    expect(normalize('Ḩeşār-e Sefīd')).toBe('hesar-e sefid');
  });
});

describe('searchCities', () => {
  it('pro krátký dotaz nevrací nic', () => {
    expect(searchCities(index, 'p')).toEqual([]);
  });

  it('hledá bez ohledu na diakritiku a řadí přesné shody a prefixy dopředu', () => {
    expect(ids(searchCities(index, 'praha'))).toEqual([1]);
    expect(ids(searchCities(index, 'usti'))).toEqual([4]);
    expect(ids(searchCities(index, 'pra'))).toEqual([1, 2, 7, 3]);
  });

  it('najde shodu na začátku dalšího slova, ale ne uprostřed slova', () => {
    expect(ids(searchCities(index, 'pak'))).toEqual([5]);
    expect(ids(searchCities(index, 'pava'))).toEqual([]);
  });

  it('vynechá duplicitní města', () => {
    expect(ids(searchCities(index, 'praha'))).toEqual([1]);
  });

  it('upřednostní preferovanou zemi a respektuje limit', () => {
    expect(ids(searchCities(index, 'prague', { preferredCountry: 'cz' }))).toEqual([7, 2]);
    expect(ids(searchCities(index, 'pra', { preferredCountry: 'CZ' }))).toEqual([1, 7, 3, 2]);
    expect(searchCities(index, 'pra', { limit: 2 })).toHaveLength(2);
  });
});

describe('countryFlag / describeCity', () => {
  it('sestaví emoji vlajku a popis města', () => {
    expect(countryFlag('cz')).toBe('🇨🇿');
    expect(countryFlag('')).toBe('');
    expect(describeCity(cities[1])).toBe('Prague, OK, US');
    expect(describeCity(cities[0])).toBe('Praha, CZ');
  });
});
