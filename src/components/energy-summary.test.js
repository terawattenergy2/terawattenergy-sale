import { calculateEnergySummary } from "./energy-summary";
test("Micro uses the same production formula with zero battery benefits", () => {
  expect(calculateEnergySummary({microSize:"3 kWh (Single Phase)"}, true)).toEqual({production:12,productionValue:54,savings:0,airconHours:0});
  expect(calculateEnergySummary({microSize:"15 kWh (Three Phase)"}, true).productionValue).toBe(270);
});
test("Hybrid battery estimates remain consistent", () => {
  expect(calculateEnergySummary({1:"Sigen Hybrid 5.0 SP2",2:"BAT 10.0 (9.04kWh)",3:"3"}, false)).toEqual({production:20,productionValue:90,savings:9.04*3*4.5,airconHours:9.04*3});
});
