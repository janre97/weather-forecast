import type { DaySummary, Forecast, ForecastStep } from './types';

/** Čas posunutý do místního času města (pro výpočty a formátování s timeZone UTC). */
export const toCityTime = (time: number, timezoneOffset: number): number => time + timezoneOffset * 1000;

const dayKey = (shiftedTime: number): string => new Date(shiftedTime).toISOString().slice(0, 10);

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);
const average = (values: readonly number[]): number => (values.length ? sum(values) / values.length : 0);

/** Krok nejblíže polední hodině – reprezentuje počasí daného dne. */
const middayStep = (steps: readonly ForecastStep[], timezoneOffset: number): ForecastStep =>
  steps.reduce((best, step) => {
    const distance = (s: ForecastStep) => Math.abs(new Date(toCityTime(s.time, timezoneOffset)).getUTCHours() - 12);
    return distance(step) < distance(best) ? step : best;
  });

const summarizeDay = (key: string, steps: readonly ForecastStep[], timezoneOffset: number): DaySummary => {
  const representative = middayStep(steps, timezoneOffset);
  const temps = steps.map((step) => step.temp);
  return {
    key,
    date: Date.parse(`${key}T12:00:00Z`),
    tempMin: Math.min(...temps),
    tempMax: Math.max(...temps),
    icon: representative.icon.replace(/n$/, 'd'),
    description: representative.description,
    pop: Math.max(...steps.map((step) => step.pop)),
    precipitation: sum(steps.map((step) => step.precipitation)),
    windMax: Math.max(...steps.map((step) => step.windSpeed)),
    humidity: Math.round(average(steps.map((step) => step.humidity))),
    steps,
  };
};

/** Seskupí 3hodinové kroky podle dnů v místním čase města a spočítá denní souhrny. */
export const groupByDay = ({ city, steps }: Forecast): DaySummary[] => {
  const keyOf = (step: ForecastStep) => dayKey(toCityTime(step.time, city.timezoneOffset));
  const keys = [...new Set(steps.map(keyOf))].toSorted();
  return keys.map((key) => summarizeDay(key, steps.filter((step) => keyOf(step) === key), city.timezoneOffset));
};

