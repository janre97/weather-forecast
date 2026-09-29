// Stáhne oficiální seznam měst z OpenWeatherMap a uloží jej jako minifikovaný
// JSON do public/data. Schéma položek zůstává stejné jako v originále
// ({ id, name, state, country, coord: { lon, lat } }), pouze se odstraní
// prázdná pole `state` a souřadnice se zaokrouhlí na 4 desetinná místa (~11 m).
//
// Použití: npm run cities
import { writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const SOURCE_URL = 'https://bulk.openweathermap.org/sample/city.list.json.gz';
const TARGET = new URL('../public/data/city.list.min.json', import.meta.url);

const round = (value) => Math.round(value * 1e4) / 1e4;

const compact = ({ id, name, state, country, coord }) => ({
  id,
  name,
  ...(state ? { state } : {}),
  country,
  coord: { lon: round(coord.lon), lat: round(coord.lat) },
});

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Stažení selhalo: HTTP ${response.status}`);

const cities = JSON.parse(gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8'));
const output = JSON.stringify(cities.filter((city) => city.name).map(compact));

await mkdir(new URL('.', TARGET), { recursive: true });
await writeFile(TARGET, output);
console.log(`Uloženo ${cities.length} měst (${(output.length / 1e6).toFixed(1)} MB) do ${TARGET.pathname}`);
