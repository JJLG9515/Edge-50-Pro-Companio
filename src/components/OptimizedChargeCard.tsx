import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  OptimizedChargeMode,
  projectCellLifespan,
  simulateOptimizedCharge,
} from '../utils/deviceLogic';

interface OptimizedChargeCardProps {
  enabled: boolean;
  onToggleEnabled: (next: boolean) => void;
  mode: OptimizedChargeMode;
  onChangeMode: (mode: OptimizedChargeMode) => void;
  wakeTime: string;
  onChangeWakeTime: (time: string) => void;
  alertThresholdPct?: number;
  onSimulatedThresholdHit?: (pct: number) => void;
}

export const OptimizedChargeCard: React.FC<OptimizedChargeCardProps> = ({
  enabled,
  onToggleEnabled,
  mode,
  onChangeMode,
  wakeTime,
  onChangeWakeTime,
  alertThresholdPct = 80,
  onSimulatedThresholdHit,
}) => {
  const [requestedPct, setRequestedPct] = useState<number>(92);
  const [isSimulatingCycle, setIsSimulatingCycle] = useState<boolean>(false);
  const notifiedSimCycleRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isSimulatingCycle) return;
    const timer = window.setInterval(() => {
      setRequestedPct((prev) => {
        if (prev >= 100) {
          setIsSimulatingCycle(false);
          return 100;
        }
        return Math.min(100, prev + 4);
      });
    }, 90);
    return () => window.clearInterval(timer);
  }, [isSimulatingCycle]);

  useEffect(() => {
    if (
      isSimulatingCycle &&
      requestedPct >= alertThresholdPct &&
      !notifiedSimCycleRef.current
    ) {
      notifiedSimCycleRef.current = true;
      onSimulatedThresholdHit?.(Math.min(requestedPct, enabled ? 80 : requestedPct));
    }
  }, [alertThresholdPct, enabled, isSimulatingCycle, onSimulatedThresholdHit, requestedPct]);

  const sim = simulateOptimizedCharge({
    requestedPct,
    optimizedEnabled: enabled,
    mode,
    beforeWakeWindow: true,
  });
  const lifespan = projectCellLifespan(enabled);

  const handleStartCycle = () => {
    notifiedSimCycleRef.current = false;
    setRequestedPct(20);
    setIsSimulatingCycle(true);
  };

  return (
    <section
      aria-labelledby="optimized-charge-heading"
      className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="optimized-charge-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Simulador de Carga Optimizada (Límite 80%)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Emula la protección de Motorola que detiene el suministro al 80% para reducir el estrés de voltaje en la celda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
            {enabled ? 'Límite 80% activo' : 'Carga sin límite (100%)'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Activar límite de carga optimizada al 80%"
            onClick={() => onToggleEnabled(!enabled)}
            className={`min-w-[52px] min-h-[32px] rounded-full p-1 transition-colors shrink-0 ${
              enabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Mode controls & live simulated charge bar */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <button
                type="button"
                aria-pressed={mode === 'strict_80'}
                onClick={() => onChangeMode('strict_80')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  mode === 'strict_80'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Límite estricto 80%
              </button>
              <button
                type="button"
                aria-pressed={mode === 'overnight'}
                onClick={() => onChangeMode('overnight')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  mode === 'overnight'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Nocturna adaptativa
              </button>
            </div>

            {mode === 'overnight' && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="wake-time-input"
                  className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                >
                  Despertar:
                </label>
                <input
                  id="wake-time-input"
                  type="time"
                  value={wakeTime}
                  onChange={(e) => onChangeWakeTime(e.target.value)}
                  className="min-h-[38px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 tabular-nums"
                />
              </div>
            )}
          </div>

          {/* Visual 80% cap bar */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Nivel efectivo en batería
              </p>
              <p
                data-testid="optimized-effective-pct"
                className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums"
              >
                {sim.effectivePct}%
              </p>
            </div>

            <div className="relative h-6 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Ghost requested fill */}
              {sim.isCappedAt80 && requestedPct > 80 && (
                <div
                  className="absolute inset-y-0 left-0 bg-zinc-300/60 dark:bg-zinc-700/50 transition-all duration-100"
                  style={{ width: `${requestedPct}%` }}
                />
              )}
              {/* Effective battery fill */}
              <div
                className={`relative h-full transition-all duration-100 ${
                  sim.isCappedAt80
                    ? 'bg-emerald-500 dark:bg-emerald-500'
                    : sim.effectivePct > 85
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${sim.effectivePct}%` }}
              />
              {/* 80% threshold marker */}
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-[80%] w-0.5 bg-zinc-900/50 dark:bg-white/70"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span
                data-testid="optimized-status-label"
                className={`font-medium ${
                  sim.isCappedAt80
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {sim.statusLabel}
              </span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                {sim.cellVoltageMv} mV · Estrés {sim.stressLevel}
              </span>
            </div>
          </div>

          {/* Interactive slider + cycle simulation */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">
                <label htmlFor="sim-charger-input">Demanda simulada del cargador</label>
                <span className="font-mono tabular-nums">{requestedPct}%</span>
              </div>
              <input
                id="sim-charger-input"
                type="range"
                min={0}
                max={100}
                value={requestedPct}
                onChange={(e) => {
                  setIsSimulatingCycle(false);
                  setRequestedPct(Number(e.target.value));
                }}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleStartCycle}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Simular carga 20→100%</span>
              </button>
              <button
                type="button"
                aria-label="Reiniciar simulación al 20%"
                onClick={() => {
                  setIsSimulatingCycle(false);
                  setRequestedPct(20);
                }}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cell Lifespan Projection */}
        <div className="lg:col-span-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Impacto en la vida útil de la celda
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {enabled
                ? 'Con límite al 80% evitas el tramo de mayor desgaste químico (>4.2 V).'
                : 'Cargar diario al 100% acelera la degradación por alto voltaje sostenido.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 py-3 border-y border-zinc-200/70 dark:border-zinc-800">
            <div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">A 1 año</p>
              <p className="mt-1 font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {lifespan.retainedAt1YearPct}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">A 2 años</p>
              <p
                data-testid="lifespan-2yr-pct"
                className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                  enabled
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-900 dark:text-zinc-50'
                }`}
              >
                {lifespan.retainedAt2YearsPct}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Ciclos útiles</p>
              <p className="mt-1 font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {lifespan.estimatedFullCycles}
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {enabled
              ? `Conservas aproximadamente +${lifespan.gainVsFullPct}% más capacidad útil tras 2 años frente a cargas completas diarias.`
              : 'Activa el límite al 80% para extender la salud de la batería hasta ~1250 ciclos equivalentes.'}
          </p>
        </div>
      </div>
    </section>
  );
};
