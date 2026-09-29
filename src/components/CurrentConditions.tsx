import { useAppSelector } from '../app/hooks';
import { selectFormatters } from '../app/selectors';
import { countryFlag } from '../features/cities/citySearch';
import { toCityTime } from '../features/forecast/forecastTransform';
import type { Forecast } from '../features/forecast/types';
import { WeatherIcon } from './WeatherIcon';
import styles from './CurrentConditions.module.scss';

/** Hlavička předpovědi – místo a nejbližší 3hodinový krok. */
export const CurrentConditions = ({ forecast }: { readonly forecast: Forecast }) => {
  const format = useAppSelector(selectFormatters);
  const { city, steps } = forecast;
  const [now] = steps;
  if (!now) return null;
  const local = (time: number) => toCityTime(time, city.timezoneOffset);

  const stats: readonly [string, string][] = [
    ['Pocitově', format.temperature(now.feelsLike)],
    ['Vítr', format.speed(now.windSpeed)],
    ['Vlhkost', format.percent(now.humidity / 100)],
    ['Tlak', format.pressure(now.pressure)],
    ['Východ slunce', format.time(local(city.sunrise))],
    ['Západ slunce', format.time(local(city.sunset))],
  ];

  return (
    <section className={styles.current} aria-labelledby="current-heading">
      <div className={styles.place}>
        <h2 id="current-heading">
          {city.name} <span aria-hidden="true">{countryFlag(city.country)}</span>
        </h2>
        <p className={styles.subtitle}>
          {[city.country && format.country(city.country), `${format.longDate(local(now.time))} ${format.time(local(now.time))}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className={styles.now}>
          <WeatherIcon icon={now.icon} description={now.description} size={72} />
          <span className={styles.temp}>{format.temperature(now.temp)}</span>
          <span className={styles.description}>{now.description}</span>
        </div>
      </div>
      <dl className={styles.stats}>
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
