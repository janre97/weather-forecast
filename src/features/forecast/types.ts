/** Jeden 3hodinový krok předpovědi. Časy jsou v ms od epochy (UTC). */
export interface ForecastStep {
  readonly time: number;
  readonly temp: number;
  readonly feelsLike: number;
  readonly humidity: number;
  readonly pressure: number;
  readonly windSpeed: number;
  readonly windDeg: number;
  readonly clouds: number;
  /** Pravděpodobnost srážek 0–1. */
  readonly pop: number;
  /** Úhrn srážek (déšť + sníh) za 3 h v mm. */
  readonly precipitation: number;
  readonly description: string;
  readonly icon: string;
}

export interface ForecastCity {
  readonly id: number;
  readonly name: string;
  readonly country: string;
  readonly coord: { readonly lat: number; readonly lon: number };
  /** Posun místního času města vůči UTC v sekundách. */
  readonly timezoneOffset: number;
  readonly sunrise: number;
  readonly sunset: number;
}

export interface Forecast {
  readonly city: ForecastCity;
  readonly steps: readonly ForecastStep[];
}

/** Souhrn jednoho dne (v místním čase města). */
export interface DaySummary {
  /** Klíč dne ve tvaru YYYY-MM-DD v místním čase města. */
  readonly key: string;
  /** Poledne daného dne v "posunutém" čase – pro formátování s timeZone UTC. */
  readonly date: number;
  readonly tempMin: number;
  readonly tempMax: number;
  readonly icon: string;
  readonly description: string;
  readonly pop: number;
  readonly precipitation: number;
  readonly windMax: number;
  readonly humidity: number;
  readonly steps: readonly ForecastStep[];
}

/** Co se má načíst: konkrétní město ze seznamu, nebo souřadnice (geolokace). */
export type ForecastQuery =
  | { readonly kind: 'city'; readonly cityId: number }
  | { readonly kind: 'coords'; readonly lat: number; readonly lon: number };
