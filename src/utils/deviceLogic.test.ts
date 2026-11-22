import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateChargingSession,
  validateChargeLogInput,
  calculateCameraExposure,
  classifyRefreshRate,
  computeSetupProgress,
  computeAngleDeviation,
  simulateOptimizedCharge,
  projectCellLifespan,
  buildChargeHistoryChartData,
  summarizeChargeHabits,
  evaluateChargeThresholdAlert,
  estimateRemainingAutonomy,
  formatChargeLogsCsv,
} from './deviceLogic';

test('estimateChargingSession computes realistic 125W TurboPower 0-100% curve (~18 min)', () => {
  const full = estimateChargingSession(0, 100, 125, false);
  assert.equal(full.estimatedMinutes, 18);
  assert.equal(full.fastPhaseMinutes, 12);
  assert.equal(full.taperPhaseMinutes, 6);
  assert.equal(full.energyAddedWh, 17.46);
  assert.equal(full.peakTempLabel, 'Moderada');

  const protectedCharge = estimateChargingSession(20, 80, 125, true);
  assert.equal(protectedCharge.peakTempLabel, 'Protegida');
  assert.ok(protectedCharge.estimatedMinutes > 9);
});

test('estimateChargingSession returns zero when current >= target', () => {
  const zero = estimateChargingSession(85, 85, 125, false);
  assert.equal(zero.estimatedMinutes, 0);
  assert.equal(zero.energyAddedWh, 0);
});

test('validateChargeLogInput rejects invalid ranges and accepts valid sessions', () => {
  const badRange = validateChargeLogInput({ startPct: 80, endPct: 50, durationMin: 15 });
  assert.equal(badRange.valid, false);

  const badDuration = validateChargeLogInput({ startPct: 10, endPct: 90, durationMin: 0 });
  assert.equal(badDuration.valid, false);

  const good = validateChargeLogInput({ startPct: 15, endPct: 100, durationMin: 17 });
  assert.deepEqual(good, { valid: true });
});

test('calculateCameraExposure recommends f/1.4 night settings and macro guidance', () => {
  const nightMain = calculateCameraExposure({
    lens: 'main_50mp',
    lighting: 'night',
    subject: 'portrait',
  });
  assert.equal(nightMain.shutter, '1/15 s');
  assert.equal(nightMain.evComp, '-0.3 EV');
  assert.match(nightMain.tip, /f\/1\.4/);

  const macro = calculateCameraExposure({
    lens: 'uw_macro_13mp',
    lighting: 'daylight',
    subject: 'macro',
  });
  assert.match(macro.focusMode, /Macro Vision/);
});

test('classifyRefreshRate maps Edge 50 Pro 144Hz and 60Hz tiers accurately', () => {
  const tier144 = classifyRefreshRate(143.6);
  assert.equal(tier144.tierHz, 144);
  assert.equal(tier144.frameBudgetMs, 6.94);

  const tier60 = classifyRefreshRate(59.9);
  assert.equal(tier60.tierHz, 60);
  assert.equal(tier60.frameBudgetMs, 16.67);
});

test('computeSetupProgress deduplicates IDs and clamps counts', () => {
  const p = computeSetupProgress(['hz-144', 'hz-144', 'edge-lights'], 7);
  assert.equal(p.completed, 2);
  assert.equal(p.total, 7);
  assert.equal(p.percent, 29);
});

test('computeAngleDeviation marks level within ±1.5 deg', () => {
  assert.equal(computeAngleDeviation(0.8, -1.2).isLevel, true);
  assert.equal(computeAngleDeviation(4.5, 0.0).isLevel, false);
});

test('simulateOptimizedCharge caps effective level at 80% when enabled', () => {
  const capped = simulateOptimizedCharge({
    requestedPct: 96,
    optimizedEnabled: true,
    mode: 'strict_80',
  });
  assert.equal(capped.effectivePct, 80);
  assert.equal(capped.isCappedAt80, true);
  assert.equal(capped.cellVoltageMv, 4180);

  const uncapped = simulateOptimizedCharge({
    requestedPct: 96,
    optimizedEnabled: false,
    mode: 'strict_80',
  });
  assert.equal(uncapped.effectivePct, 96);
  assert.equal(uncapped.isCappedAt80, false);
  assert.equal(uncapped.stressLevel, 'Alto');
});

test('projectCellLifespan shows higher retention with 80% cap', () => {
  const opt = projectCellLifespan(true);
  const full = projectCellLifespan(false);
  assert.ok(opt.retainedAt2YearsPct > full.retainedAt2YearsPct);
  assert.ok(opt.estimatedFullCycles > full.estimatedFullCycles);
});

test('buildChargeHistoryChartData reverses newest-first logs chronologically and computes addedPct', () => {
  const data = buildChargeHistoryChartData([
    { id: '2', createdAt: 'Hoy', startPct: 30, endPct: 80, wattage: 125, durationMin: 8 },
    { id: '1', createdAt: 'Ayer', startPct: 15, endPct: 100, wattage: 125, durationMin: 18 },
  ]);
  assert.equal(data.length, 2);
  assert.equal(data[0].id, '1');
  assert.equal(data[0].sessionLabel, 'Sesión 1');
  assert.equal(data[0].addedPct, 85);
  assert.equal(data[1].id, '2');
  assert.equal(data[1].addedPct, 50);
});

test('summarizeChargeHabits computes averages and counts sessions above 80%', () => {
  const empty = summarizeChargeHabits([]);
  assert.equal(empty.totalSessions, 0);

  const stats = summarizeChargeHabits([
    { id: '2', createdAt: 'Hoy', startPct: 20, endPct: 80, wattage: 125, durationMin: 10 },
    { id: '1', createdAt: 'Ayer', startPct: 40, endPct: 100, wattage: 68, durationMin: 24 },
  ]);
  assert.equal(stats.totalSessions, 2);
  assert.equal(stats.avgStartPct, 30);
  assert.equal(stats.avgEndPct, 90);
  assert.equal(stats.avgGainPct, 60);
  assert.equal(stats.sessionsOver80Count, 1);
});

test('evaluateChargeThresholdAlert triggers once at 80% while charging and resets after unplug or drop', () => {
  const hit = evaluateChargeThresholdAlert({
    enabled: true,
    thresholdPct: 80,
    currentPct: 80,
    isCharging: true,
    alreadyNotifiedForCycle: false,
  });
  assert.deepEqual(hit, { shouldNotify: true, nextNotifiedForCycle: true });

  const repeat = evaluateChargeThresholdAlert({
    enabled: true,
    thresholdPct: 80,
    currentPct: 81,
    isCharging: true,
    alreadyNotifiedForCycle: true,
  });
  assert.deepEqual(repeat, { shouldNotify: false, nextNotifiedForCycle: true });

  const unplugged = evaluateChargeThresholdAlert({
    enabled: true,
    thresholdPct: 80,
    currentPct: 81,
    isCharging: false,
    alreadyNotifiedForCycle: true,
  });
  assert.deepEqual(unplugged, { shouldNotify: false, nextNotifiedForCycle: false });
});

test('estimateRemainingAutonomy handles 0% and calculates 60Hz+Wi-Fi battery savings vs 144Hz+5G', () => {
  const empty = estimateRemainingAutonomy({
    currentPct: 0,
    refreshHz: 144,
    networkMode: '5g',
    brightness: 'high',
  });
  assert.deepEqual(empty, {
    screenOnHours: 0,
    screenOnMinutesRemainder: 0,
    standbyHours: 0,
    potentialMinutesSaved: 0,
  });

  const heavy = estimateRemainingAutonomy({
    currentPct: 80,
    refreshHz: 144,
    networkMode: '5g',
    brightness: 'medium',
  });
  const eco = estimateRemainingAutonomy({
    currentPct: 80,
    refreshHz: 60,
    networkMode: 'wifi',
    brightness: 'medium',
  });

  assert.ok(heavy.potentialMinutesSaved > 0);
  assert.equal(eco.potentialMinutesSaved, 0);
  const heavyMins = heavy.screenOnHours * 60 + heavy.screenOnMinutesRemainder;
  const ecoMins = eco.screenOnHours * 60 + eco.screenOnMinutesRemainder;
  assert.equal(ecoMins - heavyMins, heavy.potentialMinutesSaved);
});

test('formatChargeLogsCsv exports chronological CSV rows with sanitized commas', () => {
  const csv = formatChargeLogsCsv([
    { id: '2', createdAt: '12 nov, 20:15', startPct: 30, endPct: 80, wattage: 125, durationMin: 8 },
    { id: '1', createdAt: '11 nov, 08:00', startPct: 15, endPct: 100, wattage: 68, durationMin: 35 },
  ]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], 'Fecha,Inicio_%,Fin_%,Ganancia_%,Cargador_W,Duracion_min');
  assert.equal(lines[1], '11 nov  08:00,15,100,85,68,35');
  assert.equal(lines[2], '12 nov  20:15,30,80,50,125,8');
});
