import { useId, useState, type KeyboardEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectFormatters } from '../app/selectors';
import { citiesRetryRequested, citySelected, queryChanged } from '../features/cities/citiesSlice';
import { countryFlag, describeCity } from '../features/cities/citySearch';
import type { City } from '../features/cities/types';
import { forecastRequested } from '../features/forecast/forecastSlice';
import { Button } from './Button';
import styles from './CitySearch.module.scss';

/** Našeptávač měst – WAI-ARIA combobox ovladatelný myší i klávesnicí. */
export const CitySearch = () => {
  const dispatch = useAppDispatch();
  const { status, error, query, suggestions, searchedQuery } = useAppSelector((state) => state.cities);
  const format = useAppSelector(selectFormatters);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const hintId = useId();

  const expanded = open && suggestions.length > 0;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const select = (city: City) => {
    dispatch(forecastRequested({ kind: 'city', cityId: city.id }));
    dispatch(citySelected(describeCity(city)));
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const move = (delta: number) => {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (suggestions.length ? (index + delta + suggestions.length) % suggestions.length : -1));
    };
    switch (event.key) {
      case 'ArrowDown':
        return move(1);
      case 'ArrowUp':
        return move(-1);
      case 'Enter': {
        const city = suggestions[activeIndex] ?? suggestions[0];
        if (expanded && city) {
          event.preventDefault();
          select(city);
        }
        return;
      }
      case 'Escape':
        if (expanded) {
          event.preventDefault();
          setOpen(false);
        } else {
          dispatch(queryChanged(''));
        }
        return;
    }
  };

  const hint = (() => {
    const trimmed = query.trim();
    if (status === 'loading' || status === 'idle') return 'Načítám seznam měst…';
    if (trimmed.length === 1) return 'Pište dál – hledám od dvou znaků.';
    if (trimmed.length >= 2 && searchedQuery === query && suggestions.length === 0) return 'Žádné město neodpovídá hledání.';
    return '';
  })();

  return (
    <div className={styles.search}>
      <label htmlFor={`${listId}-input`} className="visually-hidden">
        Město
      </label>
      <div className={styles.field}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={`${listId}-input`}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder="Hledat město…"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-describedby={hintId}
          value={query}
          onChange={(event) => {
            dispatch(queryChanged(event.target.value));
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={(event) => {
            event.target.select();
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>

      <ul id={listId} role="listbox" aria-label="Nalezená města" className={styles.listbox} hidden={!expanded}>
        {suggestions.map((city, index) => (
          <li
            key={city.id}
            id={optionId(index)}
            role="option"
            aria-selected={index === activeIndex}
            className={styles.option}
            // mousedown místo click, aby výběr proběhl dřív než blur inputu
            onMouseDown={(event) => {
              event.preventDefault();
              select(city);
            }}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <span className={styles.flag} aria-hidden="true">
              {countryFlag(city.country)}
            </span>
            <span className={styles.name}>{city.name}</span>
            <span className={styles.meta}>
              {[city.state, format.country(city.country)].filter(Boolean).join(', ')} · {city.coord.lat.toFixed(2)}°,{' '}
              {city.coord.lon.toFixed(2)}°
            </span>
          </li>
        ))}
      </ul>

      <p id={hintId} className={styles.hint} aria-live="polite">
        {status === 'failed' ? (
          <span className={styles.error}>
            {error}{' '}
            <Button variant="link" onClick={() => dispatch(citiesRetryRequested())}>
              Zkusit znovu
            </Button>
          </span>
        ) : (
          hint
        )}
      </p>
    </div>
  );
};
