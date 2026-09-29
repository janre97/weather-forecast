import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { all, fork } from 'redux-saga/effects';
import { citiesSaga } from '../features/cities/citiesSaga';
import { citiesReducer } from '../features/cities/citiesSlice';
import { forecastSaga } from '../features/forecast/forecastSaga';
import { forecastReducer } from '../features/forecast/forecastSlice';
import { createSettingsState, settingsReducer } from '../features/settings/settingsSlice';
import { browserLocale } from '../lib/format';
import { readStorage, STORAGE_KEYS } from '../lib/storage';

const rootReducer = combineReducers({
  settings: settingsReducer,
  cities: citiesReducer,
  forecast: forecastReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

function* rootSaga() {
  yield all([fork(citiesSaga), fork(forecastSaga)]);
}

export const createAppStore = (preloadedSettings = createSettingsState(
  import.meta.env.VITE_OWM_API_KEY || readStorage(STORAGE_KEYS.apiKey) || '',
  browserLocale(),
)) => {
  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { settings: preloadedSettings },
    middleware: (getDefault) => getDefault({ thunk: false }).concat(sagaMiddleware),
  });
  sagaMiddleware.run(rootSaga);
  return store;
};

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
