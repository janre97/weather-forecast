import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useAppSelector } from '../app/hooks';
import { selectFormatters } from '../app/selectors';
import { areaPath, computeLayout, linePath, nearestIndex } from '../features/chart/chartGeometry';
import { toCityTime } from '../features/forecast/forecastTransform';
import type { Forecast } from '../features/forecast/types';
import { useElementWidth } from '../hooks/useElementWidth';
import styles from './TemperatureChart.module.scss';

const HEIGHT = 220;
const MARGINS = { top: 28, right: 12, bottom: 28, left: 44 };
const TOOLTIP_WIDTH = 150;

/** Graf vývoje teploty po 3 hodinách pro celé období předpovědi (vlastní SVG, bez knihoven). */
export const TemperatureChart = ({ forecast }: { readonly forecast: Forecast }) => {
  const format = useAppSelector(selectFormatters);
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const { steps, city } = forecast;

  const times = useMemo(() => steps.map((step) => toCityTime(step.time, city.timezoneOffset)), [steps, city.timezoneOffset]);
  const layout = useMemo(
    () => computeLayout({ times, values: steps.map((step) => step.temp), width, height: HEIGHT, margins: MARGINS }),
    [times, steps, width],
  );
  const { points, plot, yTicks, y, x, dayStarts, minIndex, maxIndex } = layout;
  if (points.length < 2) return null;

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(points, event.clientX - bounds.left));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, (i: number) => number> = {
      ArrowRight: (i) => Math.min(i + 1, points.length - 1),
      ArrowLeft: (i) => Math.max(i - 1, 0),
      Home: () => 0,
      End: () => points.length - 1,
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setActive((i) => move(i ?? 0));
    }
  };

  const activeStep = active === null ? null : steps[active];
  const activePoint = active === null ? null : points[active];
  const firstTime = times[0]!;
  const lastTime = times[times.length - 1]!;
  const dayLabelPositions = [firstTime, ...dayStarts]
    .map((start, i, starts) => ({ start, end: starts[i + 1] ?? lastTime }))
    .map((segment) => ({ ...segment, space: x(segment.end) - x(segment.start) }))
    .filter(({ space }) => space > 28);
  // na úzkém displeji se vejde jen zkratka dne
  const dayLabel = (start: number, space: number) =>
    space > 80 ? `${format.shortWeekday(start)} ${format.date(start)}` : format.shortWeekday(start);

  const summary = `Teplota od ${format.temperature(steps[minIndex]!.temp)} do ${format.temperature(steps[maxIndex]!.temp)}.`;

  return (
    <section className={styles.card} aria-labelledby="chart-heading">
      <h2 id="chart-heading" className={styles.heading}>
        Vývoj teploty
      </h2>
      <p className={styles.subtitle}>Po 3 hodinách, v místním čase · {summary}</p>
      <div ref={containerRef} className={styles.chart}>
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Graf vývoje teploty. ${summary} Šipkami vlevo a vpravo lze procházet jednotlivé hodnoty.`}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((i) => i ?? 0)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          <defs>
            <linearGradient id="temperature-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line className={styles.grid} x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} />
              <text className={styles.axisLabel} x={plot.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {format.temperature(tick)}
              </text>
            </g>
          ))}

          {dayStarts.map((start) => (
            <line key={start} className={styles.dayLine} x1={x(start)} x2={x(start)} y1={plot.top - 8} y2={plot.bottom} />
          ))}
          {dayLabelPositions.map(({ start, end, space }) => (
            <text key={start} className={styles.dayLabel} x={(x(start) + x(end)) / 2} y={plot.bottom + 18} textAnchor="middle">
              {dayLabel(start, space)}
            </text>
          ))}

          <path className={styles.area} d={areaPath(points, plot.bottom)} />
          <path className={styles.line} d={linePath(points)} />

          {/* přímé popisky jen u extrémů, ne u každého bodu */}
          {[maxIndex, minIndex].map((index, i) => (
            <text
              key={`${index}-${i}`}
              className={styles.extreme}
              x={Math.min(Math.max(points[index]!.x, plot.left + 16), plot.right - 16)}
              y={points[index]!.y + (i === 0 ? -10 : 18)}
              textAnchor="middle"
            >
              {format.temperature(steps[index]!.temp)}
            </text>
          ))}

          {activePoint && (
            <g aria-hidden="true">
              <line className={styles.crosshair} x1={activePoint.x} x2={activePoint.x} y1={plot.top - 8} y2={plot.bottom} />
              <circle className={styles.marker} cx={activePoint.x} cy={activePoint.y} r={5} />
            </g>
          )}
        </svg>

        {activeStep && activePoint && (
          <div
            className={styles.tooltip}
            role="status"
            style={{
              left: Math.min(Math.max(activePoint.x - TOOLTIP_WIDTH / 2, 0), width - TOOLTIP_WIDTH),
              width: TOOLTIP_WIDTH,
            }}
          >
            <span>
              {format.shortWeekday(times[active!]!)} {format.time(times[active!]!)}
            </span>
            <strong>{format.temperature(activeStep.temp)}</strong>
            <span>
              {activeStep.description} · {format.percent(activeStep.pop)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
