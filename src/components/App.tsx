import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { geolocationRequested } from '../features/forecast/forecastSlice';
import { ApiKeyForm } from './ApiKeyForm';
import { Button } from './Button';
import { CitySearch } from './CitySearch';
import { ForecastView } from './ForecastView';
import styles from './App.module.scss';

export const App = () => {
  const dispatch = useAppDispatch();
  const apiKey = useAppSelector((state) => state.settings.apiKey);
  const geolocation = useAppSelector((state) => state.forecast.geolocation);
  const [editingKey, setEditingKey] = useState(false);
  const showKeyForm = !apiKey || editingKey;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span aria-hidden="true">⛅</span> Předpověď počasí
        </h1>
        <div className={styles.controls}>
          <CitySearch />
          <Button
            onClick={() => dispatch(geolocationRequested())}
            disabled={geolocation.status === 'locating'}
            title="Předpověď pro vaši aktuální polohu"
          >
            <span aria-hidden="true">📍</span>
            <span className={styles.buttonLabel}>
              {geolocation.status === 'locating' ? 'Zjišťuji polohu…' : 'Moje poloha'}
            </span>
          </Button>
        </div>
      </header>

      {geolocation.error && (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          {geolocation.error}
        </p>
      )}

      <main>
        {showKeyForm ? <ApiKeyForm onDone={() => setEditingKey(false)} /> : <ForecastView onChangeApiKey={() => setEditingKey(true)} />}
      </main>

      <footer className={styles.footer}>
        Data:{' '}
        <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
          OpenWeatherMap
        </a>
        {apiKey && !showKeyForm && (
          <>
            {' · '}
            <button type="button" className="link-button" onClick={() => setEditingKey(true)}>
              Změnit API klíč
            </button>
          </>
        )}
      </footer>
    </div>
  );
};
