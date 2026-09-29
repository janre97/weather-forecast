/**
 * Formátování čísel, dat a časů podle kultury (jazyka) prohlížeče.
 * Všechny formátery dostávají locale jako parametr, takže jsou čisté a testovatelné.
 *
 * Časy předpovědi zobrazujeme v místním čase zvoleného města: timestamp je předem
 * posunutý o časové pásmo města (viz toCityTime) a formátuje se v timeZone UTC.
 */

export const browserLocale = (): string =>
  (typeof navigator !== 'undefined' && (navigator.languages?.[0] ?? navigator.language)) || 'en';

/** OWM používá u některých jazyků vlastní kódy místo ISO 639-1 (např. čeština je "cz", ne "cs"). */
const OWM_LANGUAGE_CODES: Readonly<Record<string, string>> = { cs: 'cz', ko: 'kr', lv: 'la' };

/** Kód jazyka pro parametr `lang` OpenWeatherMap API ("cs-CZ" → "cz", "zh-TW" → "zh_tw"). */
export const apiLanguage = (locale: string): string => {
  const [language = 'en', region = ''] = locale.toLowerCase().split('-');
  const withRegion = ['zh_cn', 'zh_tw', 'pt_br'];
  return withRegion.includes(`${language}_${region}`)
    ? `${language}_${region}`
    : (OWM_LANGUAGE_CODES[language] ?? language);
};

/** Země z locale ("cs-CZ" → "CZ"), případně odhad z jazyka. */
export const localeCountry = (locale: string): string | undefined => {
  try {
    return new Intl.Locale(locale).maximize().region;
  } catch {
    return undefined;
  }
};

const cityTime = (locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });

export const createFormatters = (locale: string) => {
  const weekday = cityTime(locale, { weekday: 'long' });
  const shortWeekday = cityTime(locale, { weekday: 'short' });
  const date = cityTime(locale, { day: 'numeric', month: 'numeric' });
  const longDate = cityTime(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = cityTime(locale, { hour: 'numeric', minute: '2-digit' });
  const hour = cityTime(locale, { hour: 'numeric' });
  const temperature = new Intl.NumberFormat(locale, { style: 'unit', unit: 'celsius', maximumFractionDigits: 0, signDisplay: 'negative' });
  const speed = new Intl.NumberFormat(locale, { style: 'unit', unit: 'meter-per-second', maximumFractionDigits: 1 });
  const millimeters = new Intl.NumberFormat(locale, { style: 'unit', unit: 'millimeter', maximumFractionDigits: 1 });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const relativeDay = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const region = (() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return undefined;
    }
  })();

  return {
    locale,
    weekday: (t: number) => weekday.format(t),
    shortWeekday: (t: number) => shortWeekday.format(t),
    date: (t: number) => date.format(t),
    longDate: (t: number) => longDate.format(t),
    time: (t: number) => time.format(t),
    hour: (t: number) => hour.format(t),
    /** "dnes" / "zítra" pro nejbližší dny, jinak název dne v týdnu. */
    dayName: (t: number, todayKey: string) => {
      const diff = Math.round((t - Date.parse(`${todayKey}T12:00:00Z`)) / 86_400_000);
      return diff >= 0 && diff <= 1 ? relativeDay.format(diff, 'day') : weekday.format(t);
    },
    temperature: (value: number) => temperature.format(value),
    speed: (value: number) => speed.format(value),
    millimeters: (value: number) => millimeters.format(value),
    percent: (value: number) => percent.format(value),
    pressure: (value: number) => `${integer.format(value)} hPa`,
    country: (code: string) => region?.of(code) ?? code,
  };
};

export type Formatters = ReturnType<typeof createFormatters>;
