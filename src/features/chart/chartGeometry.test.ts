import { areaPath, computeLayout, linearScale, linePath, midnightsBetween, nearestIndex, niceTicks } from './chartGeometry';

describe('chartGeometry', () => {
  it('linearScale mapuje doménu na rozsah', () => {
    const scale = linearScale([0, 10], [100, 0]);
    expect(scale(0)).toBe(100);
    expect(scale(5)).toBe(50);
    expect(linearScale([3, 3], [0, 10])(3)).toBe(5);
  });

  it('niceTicks vrací zaokrouhlené hodnoty pokrývající data', () => {
    expect(niceTicks(3.2, 21.7)).toEqual([0, 5, 10, 15, 20, 25]);
    expect(niceTicks(-4.5, 2.1)).toEqual([-6, -4, -2, 0, 2, 4]);
    expect(niceTicks(10, 10)).toEqual([10]);
  });

  it('sestaví SVG cesty', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 5, y: 2.25 },
    ];
    expect(linePath(points)).toBe('M0.0,10.0L5.0,2.3');
    expect(areaPath(points, 20)).toBe('M0.0,10.0L5.0,2.3L5.0,20.0L0.0,20.0Z');
    expect(areaPath([], 20)).toBe('');
  });

  it('najde nejbližší bod a hranice dnů', () => {
    expect(nearestIndex([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }], 13)).toBe(1);
    const day = 86_400_000;
    expect(midnightsBetween(day / 2, day * 2.5)).toEqual([day, 2 * day]);
    expect(midnightsBetween(day / 2, day * 0.8)).toEqual([]);
  });

  it('computeLayout umístí body do plochy grafu', () => {
    const layout = computeLayout({
      times: [0, 1, 2],
      values: [5, 15, 10],
      width: 120,
      height: 100,
      margins: { top: 10, right: 10, bottom: 20, left: 10 },
    });
    expect(layout.points.map((p) => p.x)).toEqual([10, 60, 110]);
    expect(layout.yTicks).toEqual([0, 5, 10, 15, 20]);
    expect(layout.points.map((p) => p.y)).toEqual([62.5, 27.5, 45]);
    expect([layout.minIndex, layout.maxIndex]).toEqual([0, 1]);
  });
});
