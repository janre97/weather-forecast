import { call, debounce, put, select, take } from 'redux-saga/effects';
import { fetchCities } from '../../api/citiesApi';
import type { Result } from '../../api/owmApi';
import { localeCountry } from '../../lib/format';
import type { RootState } from '../../app/store';
import {
  citiesLoaded,
  citiesLoadFailed,
  citiesLoadStarted,
  citiesRetryRequested,
  queryChanged,
  suggestionsFound,
} from './citiesSlice';
import { buildIndex, searchCities } from './citySearch';
import type { City, CityIndex } from './types';

const SEARCH_DEBOUNCE_MS = 150;

/** Načítá seznam měst, dokud se to nepodaří (po chybě čeká na akci „zkusit znovu“). */
function* loadCityIndex(): Generator<unknown, CityIndex> {
  for (;;) {
    yield put(citiesLoadStarted());
    const result = (yield call(fetchCities)) as Result<City[]>;
    if (result.ok) {
      const index = buildIndex(result.value);
      yield put(citiesLoaded(index.length));
      return index;
    }
    yield put(citiesLoadFailed(result.error.message));
    yield take(citiesRetryRequested.type);
  }
}

function* searchWorker(index: CityIndex, preferredCountry: string | undefined) {
  const query = (yield select((state: RootState) => state.cities.query)) as string;
  yield put(suggestionsFound({ query, cities: searchCities(index, query, { limit: 8, preferredCountry }) }));
}

/**
 * Seznam měst (~200 tisíc položek) se kvůli velikosti neukládá do Redux store –
 * index žije jen jako argument předávaný workerům této ságy.
 */
export function* citiesSaga() {
  const index = (yield* loadCityIndex()) as CityIndex;
  const locale = (yield select((state: RootState) => state.settings.locale)) as string;
  const preferredCountry = localeCountry(locale);

  // dotaz napsaný ještě během načítání seznamu vyhodnotíme hned
  yield call(searchWorker, index, preferredCountry);
  yield debounce(SEARCH_DEBOUNCE_MS, queryChanged.type, searchWorker, index, preferredCountry);
}
