/**
 * Čisté výpočty pro graf teploty – měřítka, osy a SVG cesty.
 * Nezávisí na Reactu ani DOM, takže se dají samostatně testovat.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Margins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export type Scale = (value: number) => number;

/** Lineární měřítko z domény [d0, d1] do rozsahu [r0, r1]. */
export const linearScale =
  ([d0, d1]: readonly [number, number], [r0, r1]: readonly [number, number]): Scale =>
  (value) =>
    d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);

/** „Hezké“ hodnoty osy Y pokrývající rozsah dat (krok 1, 2, 5, 10 … °C). */
export const niceTicks = (min: number, max: number, targetCount = 5): number[] => {
  const span = Math.max(max - min, 1);
  const rawStep = span / Math.max(targetCount - 1, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = ([1, 2, 5, 10].find((factor) => factor * magnitude >= rawStep) ?? 10) * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round((end - start) / step) + 1 }, (_, i) => +(start + i * step).toFixed(10));
};

export const linePath = (points: readonly Point[]): string =>
  points.map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

export const areaPath = (points: readonly Point[], baseline: number): string => {
  const first = points[0];
  const last = points[points.length - 1];
  return first && last
    ? `${linePath(points)}L${last.x.toFixed(1)},${baseline.toFixed(1)}L${first.x.toFixed(1)},${baseline.toFixed(1)}Z`
    : '';
};

/** Index bodu, jehož x je nejblíže zadané souřadnici (pro hover). */
export const nearestIndex = (points: readonly Point[], x: number): number =>
  points.reduce((best, point, i) => (Math.abs(point.x - x) < Math.abs(points[best]!.x - x) ? i : best), 0);

const DAY = 86_400_000;

/** Půlnoci (v posunutém čase města) ležící uvnitř intervalu – hranice dnů v grafu. */
export const midnightsBetween = (start: number, end: number): number[] => {
  const first = Math.ceil(start / DAY) * DAY;
  return first > end ? [] : Array.from({ length: Math.floor((end - first) / DAY) + 1 }, (_, i) => first + i * DAY);
};

export interface ChartInput {
  /** Časy už posunuté do místního času města. */
  readonly times: readonly number[];
  readonly values: readonly number[];
  readonly width: number;
  readonly height: number;
  readonly margins: Margins;
}

export interface ChartLayout {
  readonly points: readonly Point[];
  readonly x: Scale;
  readonly y: Scale;
  readonly yTicks: readonly number[];
  readonly dayStarts: readonly number[];
  readonly plot: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number };
  readonly minIndex: number;
  readonly maxIndex: number;
}

export const computeLayout = ({ times, values, width, height, margins }: ChartInput): ChartLayout => {
  const plot = {
    left: margins.left,
    right: Math.max(margins.left + 1, width - margins.right),
    top: margins.top,
    bottom: Math.max(margins.top + 1, height - margins.bottom),
  };
  const start = times[0] ?? 0;
  const end = times[times.length - 1] ?? start;
  // rezerva nad a pod daty, aby se popisky extrémů nepřekrývaly s osami
  const [minValue, maxValue] = [Math.min(...values), Math.max(...values)];
  const padding = Math.max((maxValue - minValue) * 0.15, 1);
  const yTicks = niceTicks(minValue - padding, maxValue + padding);
  const x = linearScale([start, end], [plot.left, plot.right]);
  const y = linearScale([yTicks[0]!, yTicks[yTicks.length - 1]!], [plot.bottom, plot.top]);
  const indexOf = (pick: (a: number, b: number) => boolean) =>
    values.reduce((best, value, i) => (pick(value, values[best]!) ? i : best), 0);

  return {
    points: times.map((time, i) => ({ x: x(time), y: y(values[i]!) })),
    x,
    y,
    yTicks,
    dayStarts: midnightsBetween(start, end),
    plot,
    minIndex: indexOf((a, b) => a < b),
    maxIndex: indexOf((a, b) => a > b),
  };
};
