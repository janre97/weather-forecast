/** Položka ze seznamu měst OpenWeatherMap (city.list.json). */
export interface City {
  readonly id: number;
  readonly name: string;
  readonly state?: string;
  readonly country: string;
  readonly coord: { readonly lon: number; readonly lat: number };
}

/** Město spolu s předpočítaným normalizovaným názvem pro rychlé hledání. */
export interface IndexedCity {
  readonly city: City;
  readonly key: string;
}

export type CityIndex = readonly IndexedCity[];
