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
  /** Dotaz, pro který byly naposledy spočítány návrhy (odlišuje „hledám“ od „nic nenalezeno“). */
  readonly searchedQuery: string;
}

const initialState: CitiesState = { status: 'idle', error: null, count: 0, query: '', suggestions: [], searchedQuery: '' };

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
    suggestionsFound: (state, action: PayloadAction<{ query: string; cities: readonly City[] }>) => ({
      ...state,
      suggestions: action.payload.cities,
      searchedQuery: action.payload.query,
    }),
    suggestionsCleared: (state) => ({ ...state, suggestions: [], searchedQuery: '' }),
    /** Vybrané město – vyplní pole jeho názvem, ale nespouští nové hledání. */
    citySelected: (state, action: PayloadAction<string>) => ({
      ...state,
      query: action.payload,
      suggestions: [],
      searchedQuery: '',
    }),
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
  citySelected,
} = citiesSlice.actions;
export const citiesReducer = citiesSlice.reducer;
