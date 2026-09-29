import { useAppDispatch, useAppSelector } from '../app/hooks';
import { forecastRequested } from '../features/forecast/forecastSlice';
import { Button } from './Button';
import { CurrentConditions } from './CurrentConditions';
import { ForecastTable } from './ForecastTable';
import { TemperatureChart } from './TemperatureChart';
import styles from './App.module.scss';

interface ForecastViewProps {
  readonly onChangeApiKey: () => void;
}

/** Hlavní obsah – podle stavu načítání zobrazí výzvu, spinner, chybu nebo předpověď. */
export const ForecastView = ({ onChangeApiKey }: ForecastViewProps) => {
  const dispatch = useAppDispatch();
  const { status, data, error, query } = useAppSelector((state) => state.forecast);

  if (status === 'failed' && error) {
    return (
      <div className={`${styles.message} ${styles.error}`} role="alert">
        <h2>Předpověď se nepodařilo načíst</h2>
        <p>{error.message}</p>
        {error.kind === 'unauthorized' ? (
          <Button onClick={onChangeApiKey}>Změnit API klíč</Button>
        ) : (
          query && <Button onClick={() => dispatch(forecastRequested(query))}>Zkusit znovu</Button>
        )}
      </div>
    );
  }

  if (!data) {
    return status === 'loading' ? (
      <div className={styles.message} role="status">
        <div className={styles.spinner} aria-hidden="true" />
        <p>Načítám předpověď…</p>
      </div>
    ) : (
      <div className={styles.message}>
        <h2>Pro které město chcete předpověď?</h2>
        <p>Začněte psát název města do vyhledávání, nebo použijte svou aktuální polohu.</p>
      </div>
    );
  }

  // Při změně města necháme starou předpověď zobrazenou (ztlumenou), dokud nedorazí nová.
  return (
    <div className={`${styles.main} ${status === 'loading' ? styles.loading : ''}`} aria-busy={status === 'loading'}>
      <CurrentConditions forecast={data} />
      <TemperatureChart forecast={data} />
      <ForecastTable timezoneOffset={data.city.timezoneOffset} />
    </div>
  );
};
