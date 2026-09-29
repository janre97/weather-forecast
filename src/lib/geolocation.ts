export interface Coordinates {
  readonly lat: number;
  readonly lon: number;
}

const errorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Přístup k poloze byl zamítnut. Povolte jej v nastavení prohlížeče.';
    case error.POSITION_UNAVAILABLE:
      return 'Polohu se nepodařilo zjistit.';
    case error.TIMEOUT:
      return 'Zjišťování polohy trvalo příliš dlouho.';
    default:
      return 'Polohu se nepodařilo zjistit.';
  }
};

/** Promise obálka nad Geolocation API; při chybě vrací srozumitelnou zprávu. */
export const getCurrentPosition = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Prohlížeč nepodporuje zjištění polohy.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      (error) => reject(new Error(errorMessage(error))),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60_000 },
    );
  });
