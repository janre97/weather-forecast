import type { PayloadAction } from '@reduxjs/toolkit';
import { all, call, cancelled, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { fetchForecast, type Result } from '../../api/owmApi';
import type { RootState } from '../../app/store';
import { apiLanguage } from '../../lib/format';
import { getCurrentPosition, type Coordinates } from '../../lib/geolocation';
import { queryToSearch, searchToQuery } from '../../lib/queryParams';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../lib/storage';
import { apiKeyChanged } from '../settings/settingsSlice';
import {
  forecastFailed,
  forecastLoaded,
  forecastRequested,
  geolocationFailed,
  geolocationRequested,
  geolocationSucceeded,
} from './forecastSlice';
import type { Forecast, ForecastQuery } from './types';

const saveQuery = (query: ForecastQuery): void => {
  const search = queryToSearch(query);
  writeStorage(STORAGE_KEYS.lastQuery, search);
  if (window.location.search !== search) window.history.replaceState(null, '', search + window.location.hash);
};

/**
 * Načtení předpovědi. Spouští se přes takeLatest, takže při rychlé změně města
 * se předchozí požadavek zruší (AbortController) a zobrazí se vždy poslední volba.
 */
function* loadForecast({ payload: query }: PayloadAction<ForecastQuery>) {
  const { apiKey, locale } = (yield select((state: RootState) => state.settings)) as RootState['settings'];
  const controller = new AbortController();
  try {
    const result = (yield call(fetchForecast, query, apiKey, apiLanguage(locale), controller.signal)) as Result<Forecast>;
    if (result.ok) {
      yield put(forecastLoaded(result.value));
      yield call(saveQuery, query);
    } else {
      yield put(forecastFailed(result.error));
    }
  } finally {
    if ((yield cancelled()) as boolean) controller.abort();
  }
}

function* locateUser() {
  try {
    const { lat, lon } = (yield call(getCurrentPosition)) as Coordinates;
    yield put(geolocationSucceeded());
    yield put(forecastRequested({ kind: 'coords', lat, lon }));
  } catch (error) {
    yield put(geolocationFailed(error instanceof Error ? error.message : String(error)));
  }
}

/** Po zadání nového API klíče jej uložíme a zopakujeme poslední (neúspěšný) požadavek. */
function* onApiKeyChanged({ payload }: PayloadAction<string>) {
  yield call(writeStorage, STORAGE_KEYS.apiKey, payload.trim() || null);
  const { query, status } = (yield select((state: RootState) => state.forecast)) as RootState['forecast'];
  if (payload.trim() && query && status !== 'succeeded') yield put(forecastRequested(query));
}

/** Při startu obnoví místo z URL, případně z posledního hledání. */
function* restoreLastQuery() {
  const apiKey = (yield select((state: RootState) => state.settings.apiKey)) as string;
  const query = searchToQuery(window.location.search) ?? searchToQuery(readStorage(STORAGE_KEYS.lastQuery) ?? '');
  if (apiKey && query) yield put(forecastRequested(query));
}

export function* forecastSaga() {
  yield all([
    takeLatest(forecastRequested.type, loadForecast),
    takeLatest(geolocationRequested.type, locateUser),
    takeEvery(apiKeyChanged.type, onApiKeyChanged),
    call(restoreLastQuery),
  ]);
}
