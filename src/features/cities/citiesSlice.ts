import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { City } from './types';

export type CitiesStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface CitiesState {
  readonly status: CitiesStatus;
  readonly error: string | null;
  /** Počet měst v seznamu (samotný seznam kvůli velikosti drží sága, ne store). */
  readonly count: number;
  readonly query: string;
  readonly suggestions: readonly City[];
}

const initialState: CitiesState = { status: 'idle', error: null, count: 0, query: '', suggestions: [] };

const citiesSlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    citiesLoadStarted: (state) => ({ ...state, status: 'loading' as const, error: null }),
    citiesLoaded: (state, action: PayloadAction<number>) => ({ ...state, status: 'ready' as const, count: action.payload }),
    citiesLoadFailed: (state, action: PayloadAction<string>) => ({ ...state, status: 'failed' as const, error: action.payload }),
    citiesRetryRequested: (state) => state,
    queryChanged: (state, action: PayloadAction<string>) => ({
      ...state,
      query: action.payload,
      suggestions: action.payload.trim().length < 2 ? [] : state.suggestions,
    }),
    suggestionsFound: (state, action: PayloadAction<readonly City[]>) => ({ ...state, suggestions: action.payload }),
    suggestionsCleared: (state) => ({ ...state, suggestions: [] }),
  },
});

export const {
  citiesLoadStarted,
  citiesLoaded,
  citiesLoadFailed,
  citiesRetryRequested,
  queryChanged,
  suggestionsFound,
  suggestionsCleared,
} = citiesSlice.actions;
export const citiesReducer = citiesSlice.reducer;
