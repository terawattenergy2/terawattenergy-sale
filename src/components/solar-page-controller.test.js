import { mountSolarPage } from './solar-page-controller';

test('daytime bounds and battery selection follow available solar surplus', () => {
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
    '<div id="batteryRuntime"></div><div id="batteryRecommendation"></div><div id="batteryCapacityMeter"></div><div id="batteryCapacityFill"></div>';
  root.querySelector('#solarKWp').type = 'range';
  root.querySelector('#solarKWp').min = '0';
  root.querySelector('#solarKWp').max = '30';
  root.querySelector('#solarKWp').step = '0.5';
  const increase = document.createElement('button');
  increase.dataset.adjustInput = 'solarKWp';
  increase.dataset.adjustDirection = '1';
  root.appendChild(increase);
  document.body.appendChild(root);
  const onCalculation = jest.fn();
  const cleanup = mountSolarPage(root, { onCalculation });
  const get = id => root.querySelector('#' + id);
  try {
    expect([...get('dayStart').options].every(o => +o.value >= 6 && +o.value < 18)).toBe(true);
    expect([...get('dayEnd').options].every(o => +o.value > 6 && +o.value <= 18)).toBe(true);
    expect(+get('batteryCapacityMeter').getAttribute('aria-valuenow')).toBeGreaterThanOrEqual(6);
    expect(get('batteryRuntime').textContent).toMatch(/ถึงประมาณ|เหลือถึง/);
    expect([...get('dayStart').options].slice(0, 4).map(o => o.text)).toEqual(['06:00', '06:30', '07:00', '07:30']);
    for (const id of ['dayStart', 'dayEnd']) {
      const hours = [...get(id).options].map(o => +o.value);
      expect(hours.slice(1).every((h, i) => h - hours[i] === 0.5)).toBe(true);
    }
    increase.click();
    expect(+get('solarKWp').value).toBe(9.5);
    const maximumRuntime = get('batteryRuntime').textContent;
    get('batteryChoice').value = get('batteryChoice').max;
    get('batteryChoice').dispatchEvent(new Event('input'));
    expect(onCalculation.mock.calls.at(-1)[0].batteryKWh).toBeGreaterThanOrEqual(6);
    expect(get('batteryRuntime').textContent).toBe(maximumRuntime);
    get('solarKWp').value = 0;
    get('solarKWp').dispatchEvent(new Event('input'));
    expect(onCalculation.mock.calls.at(-1)[0].batteryKWh).toBe(0);
    expect(get('batteryChoice').disabled).toBe(true);
    expect(get('batteryRuntime').textContent).toContain('ยังไม่มีพลังงานส่วนเกิน');
    expect(get('batteryRecommendation').textContent).toContain('กรุณาเพิ่มขนาด Solar');
    expect(get('batteryCapacityMeter').getAttribute('aria-valuenow')).toBe('0');
  } finally {
    cleanup();
    root.remove();
  }
});
