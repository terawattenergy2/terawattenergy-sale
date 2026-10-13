import { mountSolarPage } from './solar-page-controller';
import { simulate } from './solar-engine';

test('Solar outline and fill share a curve and scale with selected panel kWp', () => {
  const root = document.createElement('div');
  const values = {
    solarKWp: 9, bill: 7000, batteryKWh: 0, batteryChoice: 0,
    rate: 4.5, fixed: 0, days: 30, yieldPerKWp: 4, chargeKW: 5,
    dischargeKW: 5, exportRate: 2.2, daytimeShare: 20,
    chargeEfficiency: 99, dischargeEfficiency: 99, minSOC: 0, maxSOC: 99,
    monthlyKWh: '',
  };
  root.innerHTML = Object.entries(values).map(([id, value]) =>
    `<input id="${id}" value="${value}">`).join('') +
    ['dayStart', 'dayEnd', 'formulaTime', 'viewDay'].map(id => `<select id="${id}"></select>`).join('') +
    '<select id="phases"><option value="1">1</option></select>' +
    '<select id="exportAllowed"><option value="true">true</option></select>' +
    '<canvas id="chart"></canvas>';
  document.body.appendChild(root);
  const canvas = root.querySelector('canvas');
  Object.defineProperties(canvas, { clientWidth: { value: 600 }, clientHeight: { value: 400 } });
  let curve = [];
  const drawings = [];
  const context = {
    scale: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), closePath: jest.fn(),
    setLineDash: jest.fn(), fillText: jest.fn(), save: jest.fn(), restore: jest.fn(),
    clip: jest.fn(), arc: jest.fn(), clearRect: jest.fn(),
    beginPath: () => { curve = []; },
    bezierCurveTo: (...args) => { curve.push(args); },
    fill() { drawings.push({ kind: 'fill', color: this.fillStyle, curve: [...curve] }); },
    stroke() { drawings.push({ kind: 'stroke', color: this.strokeStyle, curve: [...curve] }); },
  };
  canvas.getContext = () => context;
  const calculation = jest.fn();
  const cleanup = mountSolarPage(root, { onCalculation: calculation });
  try {
    const solarLine = drawings.find(d => d.kind === 'stroke' && d.color === '#ea580c' && d.curve.length);
    const directFill = drawings.find(d => d.kind === 'fill' && d.color === '#f59e0b' && d.curve.length);
    expect(solarLine.curve).toEqual(directFill.curve);
    expect(solarLine.curve.length).toBeGreaterThan(90);
    const input = root.querySelector('#solarKWp');
    input.value = 10;
    input.dispatchEvent(new Event('input'));
    const first = calculation.mock.calls.at(-1)[0];
    input.value = 20;
    input.dispatchEvent(new Event('input'));
    const second = calculation.mock.calls.at(-1)[0];
    expect(first.solarKWp).toBe(10);
    expect(second.solarKWp).toBe(20);
    const small = simulate({ solarKWp: first.solarKWp }).series.slice(0, 96);
    const large = simulate({ solarKWp: second.solarKWp }).series.slice(0, 96);
    expect(Math.max(...large.map(row => row.pv))).toBeCloseTo(2 * Math.max(...small.map(row => row.pv)));

  } finally { cleanup(); root.remove(); }
});
