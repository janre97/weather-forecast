/** Bezpečný přístup k localStorage (v anonymním režimu nebo při zakázaných cookies může vyhodit výjimku). */
export const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string | null): void => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* ukládání je jen pohodlí navíc – aplikace funguje i bez něj */
  }
};

export const STORAGE_KEYS = {
  apiKey: 'weather.apiKey',
  lastQuery: 'weather.lastQuery',
} as const;
