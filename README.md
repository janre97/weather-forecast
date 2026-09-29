# Předpověď počasí

Jednoduchá webová aplikace (SPA), která zobrazuje předpověď počasí na následujících pět dní
pro zvolené město. Data čte z REST API [OpenWeatherMap](https://openweathermap.org/api) a
běží čistě na straně klienta, bez vlastního serveru.

## Funkce

- **Našeptávač měst.** Hledá od 2 znaků, bez ohledu na diakritiku a velikost písmen, a lze ho
  ovládat myší i klávesnicí (↑ ↓ Enter Esc). Města ze země uživatele (odvozené z jazyka
  prohlížeče) se řadí dřív.
- **Předpověď v tabulce po dnech.** Pro každý den ukazuje min./max. teplotu, počasí,
  pravděpodobnost a úhrn srážek, vítr a vlhkost. Kliknutím na den se rozbalí podrobnosti
  po 3 hodinách.
- **Aktuální stav.** Teplota, pocitová teplota, vítr, vlhkost, tlak a východ a západ slunce.
- **Graf vývoje teploty.** Vlastní SVG bez knihoven, s tooltipem při najetí myší i při
  ovládání šipkami.
- **Předpověď pro aktuální polohu** přes Geolocation API.
- **Reakce na změnu města.** Novou předpověď načte okamžitě. Při rychlém přepínání se starší
  požadavky zruší, takže se vždy zobrazí naposledy zvolené město.
- **Formátování podle kultury prohlížeče.** Data, časy a jednotky formátuje přes `Intl`
  podle `navigator.language`, například `úterý 29. září 14:00` / `Tuesday, September 29 2:00 PM`.
  Popisy počasí z API přicházejí ve stejném jazyce.
  Časy předpovědi se zobrazují v místním čase zvoleného města.
- **Sdílitelný odkaz.** Zvolené místo se ukládá do URL (`?city=3067696` nebo `?lat=…&lon=…`)
  a do `localStorage`, takže po obnovení stránky zůstane zobrazené.
- Světlý i tmavý režim podle nastavení systému, responzivní rozvržení a přístupnost
  (ARIA, ovládání klávesnicí).

## Spuštění

Potřebujete [Node.js](https://nodejs.org/) ve verzi 20.19 nebo novější.

```bash
npm install
npm run dev        # vývojový server na http://localhost:5173
```

### API klíč OpenWeatherMap

Aplikace potřebuje bezplatný API klíč. Získáte ho po registraci na
[openweathermap.org](https://home.openweathermap.org/users/sign_up) v sekci
[API keys](https://home.openweathermap.org/api_keys). Nový klíč se může aktivovat až za
několik hodin, do té doby API vrací chybu 401.

Klíč lze zadat dvěma způsoby:

1. **Přímo v aplikaci.** Po spuštění se zobrazí formulář a klíč se uloží do `localStorage`
   prohlížeče.
2. **Přes proměnnou prostředí** při sestavení:
   ```bash
   cp .env.example .env
   # doplňte VITE_OWM_API_KEY=<váš klíč>
   ```

> Aplikace nemá backend, takže klíč sestavený přes `.env` je vidět ve výsledném JavaScriptu.
> Pro veřejné nasazení proto doporučuji zadávat klíč v aplikaci.

### Další příkazy

| Příkaz              | Popis                                                      |
| ------------------- | ---------------------------------------------------------- |
| `npm run build`     | typová kontrola a produkční sestavení do `dist/`           |
| `npm run preview`   | lokální náhled produkčního sestavení                       |
| `npm test`          | unit a integrační testy (Vitest)                           |
| `npm run typecheck` | typová kontrola TypeScriptem                               |
| `npm run cities`    | znovu stáhne a připraví seznam měst z OpenWeatherMap       |

Obsah složky `dist/` je statický web (jedna `index.html` + JS, CSS a JSON), který lze
nasadit na libovolný statický hosting.

## Podporované prohlížeče

Poslední verze **Google Chrome**, **Microsoft Edge** a **Mozilla Firefox**, na desktopu i
v mobilu. Aplikace byla ověřena v Chrome. Minimální verze jsou dané použitými funkcemi
(ES2023, `Intl.NumberFormat` s `signDisplay: 'negative'`): Chrome/Edge 110+, Firefox 115+
a Safari 16.4+.

## Technologie

- **React 19** + **TypeScript** (strict)
- **Redux Toolkit** (stav) a **redux-saga** (vedlejší efekty: API, geolokace, ukládání)
- **SCSS** (CSS moduly), **Vite** (build), **Vitest** (testy)
- Žádné knihovny UI komponent ani grafů: našeptávač, tabulka i graf jsou vlastní.

## Programovací přístup

Celý kód je psaný **funkcionálně**:

- žádné třídy, pouze funkce a neměnná data (`readonly` typy, reducery vrací nové objekty);
- doménová logika jsou **čisté funkce** bez vedlejších efektů (vyhledávání měst, seskupení
  předpovědi po dnech, formátování, geometrie grafu) a jsou pokryté testy;
- vedlejší efekty (HTTP, `localStorage`, URL, geolokace) jsou izolované v **ságách** a
  v tenké vrstvě `api/` a `lib/`;
- chyby API se vrací jako hodnota (`Result<T>`), nevyhazují se jako výjimky;
- odvozená data (dny, formátery) se počítají memoizovanými selektory.

## Struktura projektu

```
public/data/city.list.min.json   seznam měst z OpenWeatherMap (samostatný JSON, načítá se za běhu)
scripts/prepare-cities.mjs       stažení a minifikace seznamu měst

src/
├── main.tsx                     vstupní bod – vytvoří store a vykreslí <App />
├── api/                         komunikace se světem (fetch), vrací Result<T>
│   ├── owmApi.ts                  REST API OpenWeatherMap – /forecast, převod odpovědi
│   └── citiesApi.ts               načtení JSON se seznamem měst
├── app/                         skládání aplikace
│   ├── store.ts                   Redux store, saga middleware, root sága
│   ├── selectors.ts               memoizované selektory (dny předpovědi, formátery)
│   └── hooks.ts                   typované useAppSelector / useAppDispatch
├── features/                    doménové moduly (stav + logika)
│   ├── cities/                    seznam měst a našeptávač
│   │   ├── citySearch.ts            čisté funkce: normalizace, index, řazení výsledků
│   │   ├── citiesSlice.ts           stav našeptávače
│   │   └── citiesSaga.ts            načtení seznamu, hledání s debounce
│   ├── forecast/                  předpověď
│   │   ├── forecastTransform.ts     seskupení 3h kroků po dnech a denní souhrny
│   │   ├── forecastSlice.ts         stav předpovědi a geolokace
│   │   └── forecastSaga.ts          načítání (takeLatest + zrušení), geolokace, URL
│   ├── chart/chartGeometry.ts     čisté výpočty grafu (měřítka, osy, SVG cesty)
│   └── settings/settingsSlice.ts  API klíč a kultura prohlížeče
├── components/                  prezentační React komponenty + jejich SCSS moduly
│   ├── App.tsx                    rozvržení stránky a hlavička
│   ├── CitySearch.tsx             našeptávač (WAI-ARIA combobox)
│   ├── ForecastView.tsx           přepínání stavů: výzva / načítání / chyba / předpověď
│   ├── CurrentConditions.tsx      aktuální počasí
│   ├── TemperatureChart.tsx       graf teploty
│   ├── ForecastTable.tsx          tabulka po dnech s rozbalením na 3h kroky
│   └── ApiKeyForm.tsx, Button.tsx, WeatherIcon.tsx
├── hooks/useElementWidth.ts     šířka elementu pro responzivní graf
├── lib/                         obecné pomocné funkce
│   ├── format.ts                  formátování přes Intl podle kultury prohlížeče
│   ├── queryParams.ts             převod zvoleného místa do/z URL
│   ├── geolocation.ts             Promise obálka nad Geolocation API
│   └── storage.ts                 bezpečný přístup k localStorage
└── styles/                      globální styly, barevné tokeny (světlý/tmavý režim), mixiny
```

### Tok dat

```
uživatel píše do našeptávače
  → akce queryChanged → citiesSaga (debounce 150 ms) → searchCities() → suggestionsFound
uživatel vybere město
  → akce forecastRequested → forecastSaga (takeLatest, zruší předchozí požadavek)
  → fetchForecast() → forecastLoaded / forecastFailed → selektory → komponenty
```

Seznam měst má přibližně 210 tisíc položek, proto se neukládá do Redux store. Index pro
vyhledávání drží sága a ve store je jen stav načítání a aktuální návrhy.

## Seznam měst

Zdrojem pro našeptávač je oficiální
[`city.list.json.gz`](https://bulk.openweathermap.org/sample/city.list.json.gz) od
OpenWeatherMap. Skript `npm run cities` z něj připraví `public/data/city.list.min.json`:
zachová schéma položek (`id`, `name`, `state`, `country`, `coord`), vynechá prázdná pole
a zaokrouhlí souřadnice. Soubor tak zmenší ze 42 MB na 19 MB (přenášeno gzipem přibližně
3,5 MB). Aplikace ho stahuje až za běhu (`fetch`), takže není součástí JS bundlu.

Názvy měst jsou v datech OWM převážně anglicky nebo v místní podobě bez aliasů. Praha je
tedy uvedená jako *Prague* a *Hlavní město Praha* (najde se obojí), Plzeň jen jako *Pilsen*.

## Splnění zadání

| Požadavek                                          | Řešení                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| předpověď na 5 dní formou seznamu/tabulky          | `ForecastTable` – dny + rozbalení po 3 hodinách          |
| minimálně předpověď teploty                        | teplota, pocitová teplota, srážky, vítr, vlhkost, tlak   |
| volba města pomocí našeptávače                     | `CitySearch` + `citySearch.ts`                           |
| reakce na změnu města                              | `forecastSaga` – `takeLatest` se zrušením požadavku      |
| formátování podle kultury prohlížeče               | `lib/format.ts` – `Intl.*` s `navigator.language`        |
| jedna HTML stránka + JS + statické zdroje          | `index.html`, build do `dist/`                           |
| objektový nebo funkcionální přístup                | funkcionální, viz výše                                   |
| bez knihoven třetích stran (mimo React, Redux, …)  | vlastní komponenty i graf                                |
| Git historie                                       | vývoj po jednotlivých krocích v commitech                |
| README                                             | tento soubor                                             |
| města z JSON OWM jako samostatný soubor            | `public/data/city.list.min.json`                         |
| data z REST API OpenWeatherMap                     | `api/owmApi.ts` – endpoint `/data/2.5/forecast`          |
| *bonus:* graf teploty                              | `TemperatureChart` (vlastní SVG)                         |
| *bonus:* geolokace                                 | tlačítko „Moje poloha“                                   |
| *bonus:* JSON měst načítán online                  | `fetch` za běhu, mimo bundle                             |
| *bonus:* HTML5, CSS3, SASS                         | sémantické HTML, CSS proměnné, grid, SCSS moduly         |
| *bonus:* React, TypeScript, Redux, redux-saga      | ano                                                      |
