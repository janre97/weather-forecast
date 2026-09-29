import { useEffect, useRef, useState } from 'react';

/** Šířka elementu sledovaná přes ResizeObserver (graf se překresluje podle dostupného místa). */
export const useElementWidth = <T extends HTMLElement>(fallback = 800) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth || fallback);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback]);

  return [ref, width] as const;
};
