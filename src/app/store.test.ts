import { queryChanged } from '../features/cities/citiesSlice';
import { forecastRequested } from '../features/forecast/forecastSlice';
import { createSettingsState } from '../features/settings/settingsSlice';
import { createAppStore } from './store';

const CITIES = [
  { id: 1, name: 'Praha', country: 'CZ', coord: { lat: 50, lon: 14 } },
  { id: 2, name: 'Brno', country: 'CZ', coord: { lat: 49, lon: 16 } },
];

const forecastBody = (id: number, name: string) => ({
  city: { id, name, country: 'CZ', coord: { lat: 0, lon: 0 }, timezone: 3600, sunrise: 0, sunset: 0 },
  list: [{ dt: 1_800_000_000, main: { temp: 20, feels_like: 19, humidity: 40, pressure: 1010 }, weather: [{ description: 'jasno', icon: '01d' }] }],
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('store + ságy', () => {
  afterEach(() => vi.unstubAllGlobals());

  const setup = (delays: Record<string, number> = {}) => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('city.list')) return json(CITIES);
      const id = Number(new URL(url).searchParams.get('id'));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delays[id] ?? 0);
        init?.signal?.addEventListener('abort', () => (clearTimeout(timer), reject(new DOMException('aborted', 'AbortError'))));
      });
      return id === 404 ? json({ message: 'city not found' }, 404) : json(forecastBody(id, CITIES.find((c) => c.id === id)!.name));
    });
    vi.stubGlobal('fetch', fetchMock);
    return { store: createAppStore(createSettingsState('test-key', 'cs-CZ')), fetchMock };
  };

  it('načte seznam měst a našeptává', async () => {
    const { store } = setup();
    store.dispatch(queryChanged('br'));
    await tick(200);
    expect(store.getState().cities).toMatchObject({ status: 'ready', count: 2 });
    expect(store.getState().cities.suggestions.map((c) => c.name)).toEqual(['Brno']);
  });

  it('při rychlé změně města zobrazí předpověď posledního zvoleného', async () => {
    const { store, fetchMock } = setup({ 1: 50, 2: 5 });
    store.dispatch(forecastRequested({ kind: 'city', cityId: 1 }));
    store.dispatch(forecastRequested({ kind: 'city', cityId: 2 }));
    await tick(100);
    expect(store.getState().forecast.status).toBe('succeeded');
    expect(store.getState().forecast.data?.city.name).toBe('Brno');
    const forecastCall = fetchMock.mock.calls.find(([url]) => String(url).includes('id=2'));
    expect(String(forecastCall?.[0])).toContain('lang=cz');
    expect(window.location.search).toBe('?city=2');
  });

  it('chybu API uloží do stavu', async () => {
    const { store } = setup();
    store.dispatch(forecastRequested({ kind: 'city', cityId: 404 }));
    await tick(20);
    expect(store.getState().forecast).toMatchObject({ status: 'failed', error: { kind: 'notFound' } });
  });
});
