interface WeatherIconProps {
  readonly icon: string;
  readonly description: string;
  readonly size?: number;
}

/** Ikona počasí z OpenWeatherMap (kód např. "10d"). */
export const WeatherIcon = ({ icon, description, size = 50 }: WeatherIconProps) => (
  <img
    src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
    alt={description}
    title={description}
    width={size}
    height={size}
    loading="lazy"
    decoding="async"
  />
);
