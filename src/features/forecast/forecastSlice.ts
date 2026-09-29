import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ApiError } from '../../api/owmApi';
import type { Forecast, ForecastQuery } from './types';

export type ForecastStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type GeolocationStatus = 'idle' | 'locating' | 'failed';

export interface ForecastState {
  readonly status: ForecastStatus;
  readonly query: ForecastQuery | null;
  readonly data: Forecast | null;
  readonly error: ApiError | null;
  /** Den rozbalený v tabulce (klíč YYYY-MM-DD), null = žádný. */
  readonly expandedDay: string | null;
  readonly geolocation: { readonly status: GeolocationStatus; readonly error: string | null };
}

const initialState: ForecastState = {
  status: 'idle',
  query: null,
  data: null,
  error: null,
  expandedDay: null,
  geolocation: { status: 'idle', error: null },
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    forecastRequested: (state, action: PayloadAction<ForecastQuery>) => ({
      ...state,
      status: 'loading' as const,
      query: action.payload,
      error: null,
    }),
    forecastLoaded: (state, action: PayloadAction<Forecast>) => ({
      ...state,
      status: 'succeeded' as const,
      data: action.payload,
      expandedDay: state.data?.city.id === action.payload.city.id ? state.expandedDay : null,
    }),
    forecastFailed: (state, action: PayloadAction<ApiError>) => ({ ...state, status: 'failed' as const, error: action.payload }),
    dayToggled: (state, action: PayloadAction<string>) => ({
      ...state,
      expandedDay: state.expandedDay === action.payload ? null : action.payload,
    }),
    geolocationRequested: (state) => ({ ...state, geolocation: { status: 'locating' as const, error: null } }),
    geolocationSucceeded: (state) => ({ ...state, geolocation: { status: 'idle' as const, error: null } }),
    geolocationFailed: (state, action: PayloadAction<string>) => ({
      ...state,
      geolocation: { status: 'failed' as const, error: action.payload },
    }),
  },
});

export const {
  forecastRequested,
  forecastLoaded,
  forecastFailed,
  dayToggled,
  geolocationRequested,
  geolocationSucceeded,
  geolocationFailed,
} = forecastSlice.actions;
export const forecastReducer = forecastSlice.reducer;
