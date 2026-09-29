import { Fragment } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectDays, selectFormatters, selectTodayKey } from '../app/selectors';
import { dayToggled } from '../features/forecast/forecastSlice';
import { toCityTime } from '../features/forecast/forecastTransform';
import type { DaySummary, ForecastStep } from '../features/forecast/types';
import type { Formatters } from '../lib/format';
import { WeatherIcon } from './WeatherIcon';
import styles from './ForecastTable.module.scss';

const Chevron = () => (
  <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/** Šipka ukazuje, kam vítr fouká (meteorologický směr je odkud fouká). */
const WindArrow = ({ deg }: { readonly deg: number }) => (
  <span className={styles.arrow} style={{ transform: `rotate(${deg + 180}deg)` }} aria-hidden="true">
    ↑
  </span>
);

const Precipitation = ({ pop, amount, format }: { pop: number; amount: number; format: Formatters }) => (
  <>
    <span className={styles.pop}>{format.percent(pop)}</span>
    {amount > 0 && <span className={`${styles.muted} ${styles.hideSm}`}> · {format.millimeters(amount)}</span>}
  </>
);

interface DetailProps {
  readonly steps: readonly ForecastStep[];
  readonly timezoneOffset: number;
  readonly format: Formatters;
}

const StepsDetail = ({ steps, timezoneOffset, format }: DetailProps) => (
  <table className={styles.detail}>
    <thead className="visually-hidden">
      <tr>
        <th scope="col">Čas</th>
        <th scope="col">Počasí</th>
        <th scope="col">Teplota</th>
        <th scope="col">Pocitově</th>
        <th scope="col">Srážky</th>
        <th scope="col">Vítr</th>
        <th scope="col">Vlhkost</th>
      </tr>
    </thead>
    <tbody>
      {steps.map((step) => (
        <tr key={step.time}>
          <th scope="row">{format.time(toCityTime(step.time, timezoneOffset))}</th>
          <td>
            <div className={styles.weather}>
              <WeatherIcon icon={step.icon} description={step.description} size={36} />
              <span className={styles.hideSm}>{step.description}</span>
            </div>
          </td>
          <td className={styles.num}>
            <strong>{format.temperature(step.temp)}</strong>
          </td>
          <td className={`${styles.num} ${styles.muted} ${styles.hideMd}`}>{format.temperature(step.feelsLike)}</td>
          <td className={styles.num}>
            <Precipitation pop={step.pop} amount={step.precipitation} format={format} />
          </td>
          <td className={`${styles.num} ${styles.hideSm}`}>
            <WindArrow deg={step.windDeg} />
            {format.speed(step.windSpeed)}
          </td>
          <td className={`${styles.num} ${styles.hideMd}`}>{format.percent(step.humidity / 100)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

interface RangeProps {
  readonly day: DaySummary;
  readonly bounds: { readonly min: number; readonly max: number };
  readonly format: Formatters;
}

/** Rozsah teplot dne na společné škále celé předpovědi. */
const TemperatureRange = ({ day, bounds, format }: RangeProps) => {
  const span = bounds.max - bounds.min || 1;
  const left = ((day.tempMin - bounds.min) / span) * 100;
  const width = ((day.tempMax - day.tempMin) / span) * 100;
  return (
    <div className={styles.range}>
      <span className={styles.min}>{format.temperature(day.tempMin)}</span>
      <div className={styles.bar} aria-hidden="true">
        <span style={{ left: `${left}%`, width: `max(${width}%, 6px)` }} />
      </div>
      <span className={styles.max}>{format.temperature(day.tempMax)}</span>
    </div>
  );
};

/** Předpověď po dnech; řádek dne lze rozbalit na 3hodinové kroky. */
export const ForecastTable = ({ timezoneOffset }: { readonly timezoneOffset: number }) => {
  const dispatch = useAppDispatch();
  const days = useAppSelector(selectDays);
  const todayKey = useAppSelector(selectTodayKey);
  const expandedDay = useAppSelector((state) => state.forecast.expandedDay);
  const format = useAppSelector(selectFormatters);

  const bounds = {
    min: Math.min(...days.map((day) => day.tempMin)),
    max: Math.max(...days.map((day) => day.tempMax)),
  };

  return (
    <section className={styles.wrapper} aria-labelledby="days-heading">
      <h2 id="days-heading" className={styles.heading}>
        Předpověď na 5 dní
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Den</th>
            <th scope="col">Počasí</th>
            <th scope="col">Min / max</th>
            <th scope="col" className={styles.num}>
              Srážky
            </th>
            <th scope="col" className={`${styles.num} ${styles.hideSm}`}>
              Vítr
            </th>
            <th scope="col" className={`${styles.num} ${styles.hideMd}`}>
              Vlhkost
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const expanded = expandedDay === day.key;
            const detailId = `day-detail-${day.key}`;
            return (
              <Fragment key={day.key}>
                <tr className={styles.dayRow} onClick={() => dispatch(dayToggled(day.key))}>
                  <th scope="row">
                    <button
                      className={styles.dayButton}
                      aria-expanded={expanded}
                      aria-controls={detailId}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch(dayToggled(day.key));
                      }}
                    >
                      <Chevron />
                      <span>
                        <span className={styles.dayName}>{format.dayName(day.date, todayKey)}</span>
                        <span className={styles.dayDate}>{format.date(day.date)}</span>
                      </span>
                    </button>
                  </th>
                  <td className={styles.iconCell}>
                    <div className={styles.weather}>
                      <WeatherIcon icon={day.icon} description={day.description} />
                      <span className={styles.hideSm}>{day.description}</span>
                    </div>
                  </td>
                  <td>
                    <TemperatureRange day={day} bounds={bounds} format={format} />
                  </td>
                  <td className={styles.num}>
                    <Precipitation pop={day.pop} amount={day.precipitation} format={format} />
                  </td>
                  <td className={`${styles.num} ${styles.hideSm}`}>{format.speed(day.windMax)}</td>
                  <td className={`${styles.num} ${styles.hideMd}`}>{format.percent(day.humidity / 100)}</td>
                </tr>
                <tr id={detailId} className={styles.detailRow} hidden={!expanded}>
                  <td colSpan={6}>
                    {expanded && <StepsDetail steps={day.steps} timezoneOffset={timezoneOffset} format={format} />}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};
