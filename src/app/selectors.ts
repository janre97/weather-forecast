import { createSelector } from '@reduxjs/toolkit';
import { groupByDay, toCityTime } from '../features/forecast/forecastTransform';
import { createFormatters } from '../lib/format';
import type { RootState } from './store';

export const selectForecast = (state: RootState) => state.forecast.data;

export const selectDays = createSelector([selectForecast], (forecast) => (forecast ? groupByDay(forecast) : []));

/** Dnešní den (YYYY-MM-DD) v místním čase zvoleného města. */
export const selectTodayKey = createSelector([selectForecast], (forecast) =>
  new Date(toCityTime(Date.now(), forecast?.city.timezoneOffset ?? 0)).toISOString().slice(0, 10),
);

export const selectFormatters = createSelector([(state: RootState) => state.settings.locale], createFormatters);
