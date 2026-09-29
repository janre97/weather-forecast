import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  /** API klíč OpenWeatherMap – z .env (VITE_OWM_API_KEY), nebo zadaný uživatelem. */
  readonly apiKey: string;
  /** Kultura prohlížeče, podle které se formátují data a časy. */
  readonly locale: string;
}

export const createSettingsState = (apiKey: string, locale: string): SettingsState => ({ apiKey, locale });

const settingsSlice = createSlice({
  name: 'settings',
  initialState: createSettingsState('', 'en'),
  reducers: {
    apiKeyChanged: (state, action: PayloadAction<string>) => ({ ...state, apiKey: action.payload.trim() }),
  },
});

export const { apiKeyChanged } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
