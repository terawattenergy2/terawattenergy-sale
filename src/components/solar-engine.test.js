import { simulate } from './solar-engine';

test.each([1.5, 10, 20, 26.5, 30])('Solar %s kWp peaks at panel size times 0.8 at noon', solarKWp => {
  const result = simulate({ solarKWp, days: 1 });
  expect(Math.max(...result.series.map(row => row.pv))).toBeCloseTo(solarKWp * 0.8, 10);
  expect(result.series.find(row => row.hour === 12).pv).toBeCloseTo(solarKWp * 0.8, 10);
  expect(result.series.filter(row => row.hour <= 6 || row.hour >= 18).every(row => row.pv === 0)).toBe(true);
  expect(result.totals.pv).toBeCloseTo(solarKWp * 0.8 * 6, 10);
  for (const row of result.series) {
    expect(row.direct + row.discharge + row.grid).toBeCloseTo(row.load, 10);
    expect(row.direct + row.charge + row.export + row.curtailed).toBeCloseTo(row.pv, 10);
  }
});

test('daily yield assumption does not override the requested Solar power formula', () => {
  expect(simulate({ solarKWp: 10, yieldPerKWp: 4 }).series.map(row => row.pv))
    .toEqual(simulate({ solarKWp: 10, yieldPerKWp: 6 }).series.map(row => row.pv));
});
