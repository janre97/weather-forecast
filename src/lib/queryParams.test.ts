import { queryToSearch, searchToQuery } from './queryParams';

describe('queryParams', () => {
  it('převede dotaz na URL a zpět', () => {
    expect(queryToSearch({ kind: 'city', cityId: 3067696 })).toBe('?city=3067696');
    expect(searchToQuery('?city=3067696')).toEqual({ kind: 'city', cityId: 3067696 });
    expect(queryToSearch({ kind: 'coords', lat: 50.08804, lon: 14.42076 })).toBe('?lat=50.0880&lon=14.4208');
    expect(searchToQuery('?lat=50.088&lon=14.4208')).toEqual({ kind: 'coords', lat: 50.088, lon: 14.4208 });
  });

  it('ignoruje neplatné hodnoty', () => {
    expect(searchToQuery('')).toBeNull();
    expect(searchToQuery('?city=abc')).toBeNull();
    expect(searchToQuery('?city=')).toBeNull();
    expect(searchToQuery('?lat=100&lon=10')).toBeNull();
    expect(searchToQuery('?lat=10')).toBeNull();
  });
});
