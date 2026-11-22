import React, { useEffect, useState } from 'react';
import { BatteryCharging, Plus, Trash2 } from 'lucide-react';
import {
  ChargeLogEntry,
  ChargerWattage,
  OptimizedChargeMode,
  estimateChargingSession,
  validateChargeLogInput,
} from '../utils/deviceLogic';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { NotificationPermissionState } from '../hooks/useChargeAlertMonitor';
import { OptimizedChargeCard } from './OptimizedChargeCard';
import { ChargeHistoryChart } from './ChargeHistoryChart';
import { ChargeAlertCard } from './ChargeAlertCard';
import { BatteryAutonomyCard } from './BatteryAutonomyCard';

export interface ChargeAlertController {
  alertEnabled: boolean;
  setAlertEnabled: (next: boolean) => void;
  thresholdPct: number;
  setThresholdPct: (pct: number) => void;
  soundAndVibrate: boolean;
  setSoundAndVibrate: (next: boolean) => void;
  permission: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermissionState>;
  triggerTestAlert: (simulatedPct?: number) => void;
  lastAlertTime: string | null;
}

interface BatteryTurboSectionProps {
  chargeLogs: ChargeLogEntry[];
  onAddLog: (entry: ChargeLogEntry) => void;
  onDeleteLog: (id: string) => void;
  chargeAlert: ChargeAlertController;
}

interface LiveBatteryInfo {
  levelPct: number;
  charging: boolean;
}

const CHARGER_OPTIONS: { wattage: ChargerWattage; label: string; note: string }[] = [
  { wattage: 125, label: '125 W TurboPower', note: 'Cable incluido' },
  { wattage: 68, label: '68 W TurboPower', note: 'USB-C PD' },
  { wattage: 50, label: '50 W Inalámbrico', note: 'Base inalámbrica' },
  { wattage: 18, label: '18 W Estándar', note: 'Cable estándar' },
];

export const BatteryTurboSection: React.FC<BatteryTurboSectionProps> = ({
  chargeLogs,
  onAddLog,
  onDeleteLog,
  chargeAlert,
}) => {
  const [liveBattery, setLiveBattery] = useState<LiveBatteryInfo | null>(null);
  const [currentPct, setCurrentPct] = useState<number>(15);
  const [targetPct, setTargetPct] = useState<number>(100);
  const [wattage, setWattage] = useState<ChargerWattage>(125);
  const [thermalProtection, setThermalProtection] = useState<boolean>(false);
  const [optimizedEnabled, setOptimizedEnabled] = useLocalStorageState<boolean>(
    'edge50pro:opt-charge-enabled',
    true
  );
  const [optimizedMode, setOptimizedMode] = useLocalStorageState<OptimizedChargeMode>(
    'edge50pro:opt-charge-mode',
    'strict_80'
  );
  const [wakeTime, setWakeTime] = useLocalStorageState<string>(
    'edge50pro:opt-wake-time',
    '07:00'
  );

  // Charge log form state
  const [logStart, setLogStart] = useState<string>('15');
  const [logEnd, setLogEnd] = useState<string>('100');
  const [logWattage, setLogWattage] = useState<ChargerWattage>(125);
  const [logDuration, setLogDuration] = useState<string>('18');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      }>;
    };

    if (!nav.getBattery) return;

    let batteryObj: Awaited<ReturnType<NonNullable<typeof nav.getBattery>>> | null = null;
    let initialApplied = false;
    const sync = () => {
      if (!batteryObj) return;
      const pct = Math.round(batteryObj.level * 100);
      setLiveBattery({ levelPct: pct, charging: batteryObj.charging });
      if (!initialApplied && pct < 95) {
        setCurrentPct(pct);
      }
      initialApplied = true;
    };

    nav
      .getBattery()
      .then((b) => {
        batteryObj = b;
        sync();
        b.addEventListener('levelchange', sync);
        b.addEventListener('chargingchange', sync);
      })
      .catch(() => {
        // Ignore if browser blocks Battery API
      });

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', sync);
        batteryObj.removeEventListener('chargingchange', sync);
      }
    };
  }, []);

  const effectiveTargetPct = optimizedEnabled ? Math.min(targetPct, 80) : targetPct;
  const effectiveCurrentPct = Math.min(currentPct, effectiveTargetPct);
  const estimate = estimateChargingSession(
    effectiveCurrentPct,
    effectiveTargetPct,
    wattage,
    thermalProtection
  );

  const handleToggleOptimized = (next: boolean) => {
    setOptimizedEnabled(next);
    if (next && targetPct > 80) {
      setTargetPct(80);
    } else if (!next && targetPct === 80) {
      setTargetPct(100);
    }
  };

  const handleAddChargeLog = (e: React.FormEvent) => {
    e.preventDefault();
    const startNum = Number(logStart);
    const endNum = Number(logEnd);
    const durationNum = Number(logDuration);

    const validation = validateChargeLogInput({
      startPct: startNum,
      endPct: endNum,
      durationMin: durationNum,
    });

    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    setFormError(null);
    onAddLog({
      id: `chg-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      startPct: Math.round(startNum),
      endPct: Math.round(endNum),
      wattage: logWattage,
      durationMin: Math.round(durationNum),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 [text-wrap:balance]">
            Batería y Carga 125W TurboPower
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Simula la curva real de carga de 4500 mAh, calcula tiempos exactos y lleva un registro de salud de ciclos.
          </p>
        </div>

        {liveBattery && (
          <div className="text-sm text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
            Batería detectada: {liveBattery.levelPct}% ·{' '}
            {liveBattery.charging ? 'Cargando' : 'En uso'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Charging Estimator */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Calculadora de Tiempo TurboPower
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Batería dual-cell de 4500 mAh (17.46 Wh) con reducción térmica sobre el 80%.
              </p>
            </div>
            <BatteryCharging className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <label htmlFor="battery-current">Nivel inicial</label>
                <span className="font-mono tabular-nums">{effectiveCurrentPct}%</span>
              </div>
              <input
                id="battery-current"
                type="range"
                min={0}
                max={optimizedEnabled ? 75 : 95}
                value={effectiveCurrentPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentPct(val);
                  if (val >= effectiveTargetPct) {
                    setTargetPct(Math.min(optimizedEnabled ? 80 : 100, val + 5));
                  }
                }}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <label htmlFor="battery-target">
                  Objetivo {optimizedEnabled ? '(límite 80%)' : 'de carga'}
                </label>
                <span className="font-mono tabular-nums">{effectiveTargetPct}%</span>
              </div>
              <input
                id="battery-target"
                type="range"
                min={5}
                max={optimizedEnabled ? 80 : 100}
                value={effectiveTargetPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetPct(Math.max(val, effectiveCurrentPct));
                }}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CHARGER_OPTIONS.map((opt) => (
              <button
                key={opt.wattage}
                type="button"
                onClick={() => setWattage(opt.wattage)}
                className={`min-h-[56px] rounded-xl border p-3 text-left transition-colors ${
                  wattage === opt.wattage
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <p className="font-mono text-sm font-semibold tabular-nums">{opt.wattage} W</p>
                <p className="text-[11px] opacity-80 truncate">{opt.note}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 py-3 border-y border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Protección térmica / Carga optimizada
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Reduce corriente máxima para prolongar la vida útil por encima de 800 ciclos.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={thermalProtection}
              aria-label="Activar protección térmica"
              onClick={() => setThermalProtection((v) => !v)}
              className={`min-w-[52px] min-h-[32px] rounded-full p-1 transition-colors shrink-0 ${
                thermalProtection ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  thermalProtection ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div
            data-testid="charging-estimate-output"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tiempo estimado</p>
              <p className="mt-1 font-display text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {estimate.estimatedMinutes} min
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Energía añadida</p>
              <p className="mt-1 font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {estimate.energyAddedWh} Wh
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Fase rápida / 80+</p>
              <p className="mt-1 font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
                {estimate.fastPhaseMinutes}m / {estimate.taperPhaseMinutes}m
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Perfil térmico</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {estimate.peakTempLabel}
              </p>
            </div>
          </div>
        </section>

        {/* Charge Session Logger */}
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Registro de Cargas
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Guarda tus tiempos reales con el cargador de 125 W o base inalámbrica.
            </p>
          </div>

          <form onSubmit={handleAddChargeLog} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="log-start"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Inicio (%)
                </label>
                <input
                  id="log-start"
                  type="number"
                  value={logStart}
                  onChange={(e) => setLogStart(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 tabular-nums"
                />
              </div>
              <div>
                <label
                  htmlFor="log-end"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Fin (%)
                </label>
                <input
                  id="log-end"
                  type="number"
                  value={logEnd}
                  onChange={(e) => setLogEnd(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 tabular-nums"
                />
              </div>
              <div>
                <label
                  htmlFor="log-wattage"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Cargador
                </label>
                <select
                  id="log-wattage"
                  value={logWattage}
                  onChange={(e) => setLogWattage(Number(e.target.value) as ChargerWattage)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value={125}>125 W TurboPower</option>
                  <option value={68}>68 W USB-C PD</option>
                  <option value={50}>50 W Inalámbrico</option>
                  <option value={18}>18 W Estándar</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="log-duration"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Duración (min)
                </label>
                <input
                  id="log-duration"
                  type="number"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 tabular-nums"
                />
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="text-xs font-medium text-red-600 dark:text-red-400"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Registrar sesión de carga</span>
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {chargeLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
                Aún no hay sesiones guardadas. Registra tu primera carga TurboPower.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
                {chargeLogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {entry.startPct}% → {entry.endPct}% · {entry.durationMin} min
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {entry.wattage} W <span aria-hidden="true">·</span> {entry.createdAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteLog(entry.id)}
                      aria-label={`Eliminar sesión ${entry.startPct}% a ${entry.endPct}%`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Local Unplug Notification Configurator & Tester */}
      <ChargeAlertCard
        alertEnabled={chargeAlert.alertEnabled}
        onToggleAlertEnabled={chargeAlert.setAlertEnabled}
        thresholdPct={chargeAlert.thresholdPct}
        onChangeThresholdPct={chargeAlert.setThresholdPct}
        soundAndVibrate={chargeAlert.soundAndVibrate}
        onToggleSoundAndVibrate={chargeAlert.setSoundAndVibrate}
        permission={chargeAlert.permission}
        onRequestPermission={chargeAlert.requestPermission}
        onTriggerTestAlert={() => chargeAlert.triggerTestAlert()}
        lastAlertTime={chargeAlert.lastAlertTime}
      />

      {/* Charge History Recharts Visualization */}
      <ChargeHistoryChart chargeLogs={chargeLogs} />

      {/* Screen-on-Time & Autonomy Simulator */}
      <BatteryAutonomyCard />

      {/* Optimized Charging 80% Limit Simulator */}
      <OptimizedChargeCard
        enabled={optimizedEnabled}
        onToggleEnabled={handleToggleOptimized}
        mode={optimizedMode}
        onChangeMode={setOptimizedMode}
        wakeTime={wakeTime}
        onChangeWakeTime={setWakeTime}
        alertThresholdPct={chargeAlert.thresholdPct}
        onSimulatedThresholdHit={(pct) => {
          if (chargeAlert.alertEnabled) {
            chargeAlert.triggerTestAlert(pct);
          }
        }}
      />
    </div>
  );
};
