import { useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { apiKeyChanged } from '../features/settings/settingsSlice';
import { Button } from './Button';
import styles from './ApiKeyForm.module.scss';

interface ApiKeyFormProps {
  readonly onDone?: () => void;
}

/** Zadání API klíče, pokud není nastaven v .env (VITE_OWM_API_KEY). Klíč se uloží do localStorage. */
export const ApiKeyForm = ({ onDone }: ApiKeyFormProps) => {
  const dispatch = useAppDispatch();
  const currentKey = useAppSelector((state) => state.settings.apiKey);
  const [value, setValue] = useState(currentKey);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(apiKeyChanged(value));
    onDone?.();
  };

  return (
    <form className={styles.panel} onSubmit={submit}>
      <h2>API klíč OpenWeatherMap</h2>
      <p>
        Aplikace čte předpověď z OpenWeatherMap. Klíč získáte zdarma po registraci na{' '}
        <a href="https://home.openweathermap.org/api_keys" target="_blank" rel="noreferrer">
          openweathermap.org
        </a>
        . Uloží se pouze ve vašem prohlížeči.
      </p>
      <div className={styles.row}>
        <label htmlFor="api-key" className="visually-hidden">
          API klíč
        </label>
        <input
          id="api-key"
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="např. 0123456789abcdef0123456789abcdef"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <Button type="submit" variant="primary">
          Uložit klíč
        </Button>
      </div>
    </form>
  );
};
