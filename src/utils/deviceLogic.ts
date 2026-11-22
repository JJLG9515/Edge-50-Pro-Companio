export type ChargerWattage = 125 | 68 | 50 | 18;
export type LightingCondition = 'daylight' | 'indoor' | 'night';
export type PhotoSubject = 'portrait' | 'motion' | 'landscape' | 'macro';
export type LensId = 'main_50mp' | 'tele_10mp_3x' | 'uw_macro_13mp';

export interface ChargingEstimate {
  estimatedMinutes: number;
  energyAddedWh: number;
  peakTempLabel: 'Óptima' | 'Moderada' | 'Protegida';
  fastPhaseMinutes: number;
  taperPhaseMinutes: number;
}

export interface ChargeLogEntry {
  id: string;
  createdAt: string;
  startPct: number;
  endPct: number;
  wattage: ChargerWattage;
  durationMin: number;
}

export interface ExposureRecommendation {
  iso: string;
  shutter: string;
  whiteBalance: string;
  focusMode: string;
  evComp: string;
  tip: string;
}

export interface RefreshClassification {
  tierHz: 60 | 90 | 120 | 144;
  frameBudgetMs: number;
  label: string;
}

const BATTERY_CAPACITY_WH = 17.46; // 4500 mAh @ 3.88V nominal

/**
 * Estimates charging time for the Motorola Edge 50 Pro 4500 mAh dual-cell battery.
 * Accounts for CC fast-charge phase (<=80%) and CV taper phase (>80%).
 */
export function estimateChargingSession(
  currentPct: number,
  targetPct: number,
  wattage: ChargerWattage,
  thermalProtection: boolean
): ChargingEstimate {
  const start = Math.max(0, Math.min(100, Math.round(currentPct)));
  const end = Math.max(start, Math.min(100, Math.round(targetPct)));

  if (end === start) {
    return {
      estimatedMinutes: 0,
      energyAddedWh: 0,
      peakTempLabel: 'Óptima',
      fastPhaseMinutes: 0,
      taperPhaseMinutes: 0,
    };
  }

  // Real-world calibrated full 0-100% minutes for Edge 50 Pro 4500 mAh
  const base0to80Minutes: Record<ChargerWattage, number> = {
    125: 12,
    68: 24,
    50: 34,
    18: 68,
  };

  const base80to100Minutes: Record<ChargerWattage, number> = {
    125: 6,
    68: 12,
    50: 15,
    18: 28,
  };

  const thermalMultiplier = thermalProtection ? 1.18 : 1.0;

  const fastStart = Math.min(start, 80);
  const fastEnd = Math.min(end, 80);
  const fastSpan = Math.max(0, fastEnd - fastStart);

  const taperStart = Math.max(start, 80);
  const taperEnd = Math.max(end, 80);
  const taperSpan = Math.max(0, taperEnd - taperStart);

  const fastPhaseMinutes = Number(
    ((fastSpan / 80) * base0to80Minutes[wattage] * thermalMultiplier).toFixed(1)
  );
  const taperPhaseMinutes = Number(
    ((taperSpan / 20) * base80to100Minutes[wattage] * thermalMultiplier).toFixed(1)
  );

  const estimatedMinutes = Math.max(1, Math.round(fastPhaseMinutes + taperPhaseMinutes));
  const energyAddedWh = Number((((end - start) / 100) * BATTERY_CAPACITY_WH).toFixed(2));

  let peakTempLabel: ChargingEstimate['peakTempLabel'] = 'Óptima';
  if (thermalProtection) {
    peakTempLabel = 'Protegida';
  } else if (wattage === 125 || wattage === 50) {
    peakTempLabel = end - start >= 50 ? 'Moderada' : 'Óptima';
  }

  return {
    estimatedMinutes,
    energyAddedWh,
    peakTempLabel,
    fastPhaseMinutes,
    taperPhaseMinutes,
  };
}

export function validateChargeLogInput(input: {
  startPct: number;
  endPct: number;
  durationMin: number;
}): { valid: true } | { valid: false; error: string } {
  const { startPct, endPct, durationMin } = input;
  if (!Number.isFinite(startPct) || !Number.isFinite(endPct) || !Number.isFinite(durationMin)) {
    return { valid: false, error: 'Introduce valores numéricos válidos.' };
  }
  if (startPct < 0 || startPct > 99) {
    return { valid: false, error: 'El porcentaje inicial debe estar entre 0% y 99%.' };
  }
  if (endPct <= startPct || endPct > 100) {
    return { valid: false, error: 'El porcentaje final debe ser mayor que el inicial y hasta 100%.' };
  }
  if (durationMin < 1 || durationMin > 600) {
    return { valid: false, error: 'La duración debe estar entre 1 y 600 minutos.' };
  }
  return { valid: true };
}

export function calculateCameraExposure(params: {
  lens: LensId;
  lighting: LightingCondition;
  subject: PhotoSubject;
}): ExposureRecommendation {
  const { lens, lighting, subject } = params;

  if (subject === 'macro') {
    return {
      iso: lighting === 'daylight' ? '100 – 200' : '400 – 800',
      shutter: lighting === 'daylight' ? '1/500 s' : '1/125 s',
      whiteBalance: lighting === 'indoor' ? '4400 K' : '5500 K',
      focusMode: 'Manual · 3–5 cm (Macro Vision)',
      evComp: '0.0 EV',
      tip:
        lens === 'uw_macro_13mp'
          ? 'Acércate entre 3 y 5 cm usando la lente 13 MP UGA con buena luz lateral.'
          : 'Cambia al lente 13 MP Ultra Gran Angular para activar Macro Vision real.',
    };
  }

  if (lighting === 'night') {
    const fastShutter = subject === 'motion' ? '1/125 s' : '1/15 s';
    const iso =
      lens === 'main_50mp'
        ? subject === 'motion'
          ? '1600'
          : '400 – 800'
        : subject === 'motion'
          ? '3200'
          : '1250';
    return {
      iso,
      shutter: fastShutter,
      whiteBalance: '4200 K (Neutro nocturno)',
      focusMode: 'AF con seguimiento + OIS',
      evComp: '-0.3 EV',
      tip:
        lens === 'main_50mp'
          ? 'La apertura f/1.4 con OIS capta un 64% más de luz; mantén -0.3 EV para evitar luces quemadas.'
          : 'Sostén firme 1 segundo para aprovechar OIS o cambia al sensor 50 MP f/1.4 si hay poca luz.',
    };
  }

  if (lighting === 'indoor') {
    return {
      iso: lens === 'main_50mp' ? '200 – 400' : '400 – 800',
      shutter: subject === 'motion' ? '1/250 s' : '1/60 s',
      whiteBalance: '4600 K',
      focusMode: subject === 'portrait' ? 'Detección ocular AF' : 'AF continuo',
      evComp: '0.0 EV',
      tip:
        subject === 'portrait' && lens === 'tele_10mp_3x'
          ? 'El 73 mm 3x comprime el fondo de forma natural; busca luz suave de ventana.'
          : 'Evita velocidades menores a 1/60 s para congelar expresiones en interiores.',
    };
  }

  // Daylight
  return {
    iso: '100',
    shutter: subject === 'motion' ? '1/1000 s' : '1/500 s',
    whiteBalance: '5600 K (Luz día Pantone)',
    focusMode: subject === 'landscape' ? 'Infinito (Manual)' : 'AF puntual',
    evComp: subject === 'landscape' ? '-0.3 EV' : '0.0 EV',
    tip:
      lens === 'tele_10mp_3x'
        ? 'Excelente nitidez óptica en 3x con ISO 100 base y perfil Pantone Validated.'
        : 'Usa ISO 100 nativo para máximo rango dinámico en cielos y tonos de piel.',
  };
}

export function classifyRefreshRate(measuredFps: number): RefreshClassification {
  if (measuredFps >= 132) {
    return { tierHz: 144, frameBudgetMs: 6.94, label: 'Ultra Fluido 144 Hz activo' };
  }
  if (measuredFps >= 105) {
    return { tierHz: 120, frameBudgetMs: 8.33, label: 'Modo Adaptativo 120 Hz' };
  }
  if (measuredFps >= 78) {
    return { tierHz: 90, frameBudgetMs: 11.11, label: 'Modo Intermedio 90 Hz' };
  }
  return { tierHz: 60, frameBudgetMs: 16.67, label: 'Modo Estándar 60 Hz' };
}

export function computeSetupProgress(completedIds: string[], totalCount: number): {
  completed: number;
  total: number;
  percent: number;
} {
  const safeTotal = Math.max(1, totalCount);
  const uniqueCompleted = new Set(completedIds).size;
  const clampedCompleted = Math.min(safeTotal, Math.max(0, uniqueCompleted));
  return {
    completed: clampedCompleted,
    total: safeTotal,
    percent: Math.round((clampedCompleted / safeTotal) * 100),
  };
}

export function computeAngleDeviation(beta: number, gamma: number): {
  pitchDeg: number;
  rollDeg: number;
  isLevel: boolean;
} {
  const pitchDeg = Number(Math.max(-45, Math.min(45, beta)).toFixed(1));
  const rollDeg = Number(Math.max(-45, Math.min(45, gamma)).toFixed(1));
  const isLevel = Math.abs(pitchDeg) <= 1.5 && Math.abs(rollDeg) <= 1.5;
  return { pitchDeg, rollDeg, isLevel };
}

export type OptimizedChargeMode = 'strict_80' | 'overnight';

export interface OptimizedChargeSimulation {
  effectivePct: number;
  isCappedAt80: boolean;
  cellVoltageMv: number;
  stressLevel: 'Bajo' | 'Moderado' | 'Alto';
  statusLabel: string;
}

/**
 * Simulates Motorola Optimized Charging behavior that holds or caps charge at 80%
 * to reduce high-voltage (>4.2V) lithium-ion cathode degradation.
 */
export function simulateOptimizedCharge(params: {
  requestedPct: number;
  optimizedEnabled: boolean;
  mode: OptimizedChargeMode;
  beforeWakeWindow?: boolean;
}): OptimizedChargeSimulation {
  const clampedReq = Math.max(0, Math.min(100, Math.round(params.requestedPct)));
  const holdAt80 =
    params.optimizedEnabled &&
    (params.mode === 'strict_80' || params.beforeWakeWindow !== false);

  const isCappedAt80 = holdAt80 && clampedReq >= 80;
  const effectivePct = isCappedAt80 ? 80 : clampedReq;

  // Approximate Li-ion cell voltage curve (3550 mV @ 0% -> 4180 mV @ 80% -> 4450 mV @ 100%)
  const cellVoltageMv =
    effectivePct <= 80
      ? Math.round(3550 + (effectivePct / 80) * (4180 - 3550))
      : Math.round(4180 + ((effectivePct - 80) / 20) * (4450 - 4180));

  let stressLevel: OptimizedChargeSimulation['stressLevel'] = 'Bajo';
  if (effectivePct > 85) {
    stressLevel = 'Alto';
  } else if (effectivePct > 75) {
    stressLevel = 'Moderado';
  }

  let statusLabel = 'Cargando normalmente';
  if (isCappedAt80) {
    statusLabel =
      params.mode === 'strict_80'
        ? 'Carga detenida al 80% · Protección de celda activa'
        : 'En espera al 80% hasta 30 min antes de despertar';
  } else if (effectivePct === 100) {
    statusLabel = 'Carga completa al 100% · Voltaje máximo';
  }

  return {
    effectivePct,
    isCappedAt80,
    cellVoltageMv,
    stressLevel,
    statusLabel,
  };
}

export interface CellLifespanProjection {
  retainedAt1YearPct: number;
  retainedAt2YearsPct: number;
  estimatedFullCycles: number;
  gainVsFullPct: number;
}

export function projectCellLifespan(optimizedEnabled: boolean): CellLifespanProjection {
  if (optimizedEnabled) {
    return {
      retainedAt1YearPct: 96,
      retainedAt2YearsPct: 93,
      estimatedFullCycles: 1250,
      gainVsFullPct: 11,
    };
  }
  return {
    retainedAt1YearPct: 90,
    retainedAt2YearsPct: 82,
    estimatedFullCycles: 800,
    gainVsFullPct: 0,
  };
}

export interface ChargeHistoryPoint {
  id: string;
  sessionLabel: string;
  createdAt: string;
  startPct: number;
  endPct: number;
  addedPct: number;
  wattage: ChargerWattage;
  durationMin: number;
}

export interface ChargeHabitSummary {
  totalSessions: number;
  avgStartPct: number;
  avgEndPct: number;
  avgGainPct: number;
  sessionsOver80Count: number;
}

/**
 * Converts newest-first charge logs into chronological chart points for Recharts.
 */
export function buildChargeHistoryChartData(logs: ChargeLogEntry[]): ChargeHistoryPoint[] {
  const chronological = [...logs].reverse();
  return chronological.map((entry, idx) => ({
    id: entry.id,
    sessionLabel: `Sesión ${idx + 1}`,
    createdAt: entry.createdAt,
    startPct: entry.startPct,
    endPct: entry.endPct,
    addedPct: Math.max(0, entry.endPct - entry.startPct),
    wattage: entry.wattage,
    durationMin: entry.durationMin,
  }));
}

export function summarizeChargeHabits(logs: ChargeLogEntry[]): ChargeHabitSummary {
  if (logs.length === 0) {
    return {
      totalSessions: 0,
      avgStartPct: 0,
      avgEndPct: 0,
      avgGainPct: 0,
      sessionsOver80Count: 0,
    };
  }

  const total = logs.length;
  const sumStart = logs.reduce((acc, item) => acc + item.startPct, 0);
  const sumEnd = logs.reduce((acc, item) => acc + item.endPct, 0);
  const sessionsOver80Count = logs.filter((item) => item.endPct > 80).length;

  const avgStartPct = Math.round(sumStart / total);
  const avgEndPct = Math.round(sumEnd / total);

  return {
    totalSessions: total,
    avgStartPct,
    avgEndPct,
    avgGainPct: Math.max(0, avgEndPct - avgStartPct),
    sessionsOver80Count,
  };
}

export interface ChargeAlertEvaluation {
  shouldNotify: boolean;
  nextNotifiedForCycle: boolean;
}

/**
 * Determines whether a local unplug notification should fire when reaching thresholdPct,
 * and applies 2% hysteresis / unplug reset so alerts do not repeat on minor fluctuations.
 */
export function evaluateChargeThresholdAlert(params: {
  enabled: boolean;
  thresholdPct: number;
  currentPct: number;
  isCharging: boolean;
  alreadyNotifiedForCycle: boolean;
}): ChargeAlertEvaluation {
  const { enabled, thresholdPct, currentPct, isCharging, alreadyNotifiedForCycle } = params;

  if (!isCharging || currentPct <= thresholdPct - 2) {
    return { shouldNotify: false, nextNotifiedForCycle: false };
  }

  if (!enabled) {
    return { shouldNotify: false, nextNotifiedForCycle: alreadyNotifiedForCycle };
  }

  if (currentPct >= thresholdPct && !alreadyNotifiedForCycle) {
    return { shouldNotify: true, nextNotifiedForCycle: true };
  }

  return { shouldNotify: false, nextNotifiedForCycle: alreadyNotifiedForCycle };
}

export interface AutonomyInput {
  currentPct: number;
  refreshHz: 60 | 120 | 144;
  networkMode: 'wifi' | '5g';
  brightness: 'low' | 'medium' | 'high';
}

export interface AutonomyEstimate {
  screenOnHours: number;
  screenOnMinutesRemainder: number;
  standbyHours: number;
  potentialMinutesSaved: number;
}

/**
 * Estimates remaining Screen-on-Time (SoT) for the Edge 50 Pro (4500 mAh / SD 7 Gen 3).
 */
export function estimateRemainingAutonomy(input: AutonomyInput): AutonomyEstimate {
  const pct = Math.max(0, Math.min(100, input.currentPct));
  if (pct === 0) {
    return {
      screenOnHours: 0,
      screenOnMinutesRemainder: 0,
      standbyHours: 0,
      potentialMinutesSaved: 0,
    };
  }

  // Baseline full-charge SoT ~8.2h on Wi-Fi + 60Hz + medium brightness
  const baseMinutesAt100 = 492;
  const hzFactor = input.refreshHz === 144 ? 0.84 : input.refreshHz === 120 ? 0.91 : 1.0;
  const netFactor = input.networkMode === '5g' ? 0.85 : 1.0;
  const brightFactor =
    input.brightness === 'high' ? 0.82 : input.brightness === 'low' ? 1.12 : 1.0;

  const totalMinutes = Math.round(
    (pct / 100) * baseMinutesAt100 * hzFactor * netFactor * brightFactor
  );
  const optimalMinutes = Math.round((pct / 100) * baseMinutesAt100 * 1.0 * 1.0 * brightFactor);

  return {
    screenOnHours: Math.floor(totalMinutes / 60),
    screenOnMinutesRemainder: totalMinutes % 60,
    standbyHours: Math.round((pct / 100) * 34 * netFactor),
    potentialMinutesSaved: Math.max(0, optimalMinutes - totalMinutes),
  };
}

export function formatChargeLogsCsv(logs: ChargeLogEntry[]): string {
  const header = 'Fecha,Inicio_%,Fin_%,Ganancia_%,Cargador_W,Duracion_min';
  const rows = [...logs].reverse().map((item) => {
    const safeDate = item.createdAt.replace(/,/g, ' ');
    const gain = Math.max(0, item.endPct - item.startPct);
    return `${safeDate},${item.startPct},${item.endPct},${gain},${item.wattage},${item.durationMin}`;
  });
  return [header, ...rows].join('\n');
}




