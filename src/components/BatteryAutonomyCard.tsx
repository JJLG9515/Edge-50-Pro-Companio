import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { estimateRemainingAutonomy } from '../utils/deviceLogic';

export const BatteryAutonomyCard: React.FC = () => {
  const [batteryPct, setBatteryPct] = useState<number>(65);
  const [refreshHz, setRefreshHz] = useState<60 | 120 | 144>(144);
  const [networkMode, setNetworkMode] = useState<'wifi' | '5g'>('5g');
  const [brightness, setBrightness] = useState<'low' | 'medium' | 'high'>('medium');

  const estimate = estimateRemainingAutonomy({
    currentPct: batteryPct,
    refreshHz,
    networkMode,
    brightness,
  });

  return (
    <section
      aria-labelledby="battery-autonomy-heading"
      className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="battery-autonomy-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Estimador de Autonomía Restante (SoT)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Calcula horas de pantalla activa según la tasa de refresco, red 5G/Wi-Fi y brillo del Edge 50 Pro.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <label htmlFor="autonomy-pct">Carga actual para simular</label>
              <span className="font-mono tabular-nums">{batteryPct}%</span>
            </div>
            <input
              id="autonomy-pct"
              type="range"
              min={5}
              max={100}
              value={batteryPct}
              onChange={(e) => setBatteryPct(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">Pantalla</p>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                {([60, 120, 144] as const).map((hz) => (
                  <button
                    key={hz}
                    type="button"
                    aria-pressed={refreshHz === hz}
                    onClick={() => setRefreshHz(hz)}
                    className={`min-h-[38px] rounded-lg font-mono text-xs font-medium transition-colors ${
                      refreshHz === hz
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {hz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">Conectividad</p>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                {(
                  [
                    ['wifi', 'Wi-Fi'],
                    ['5g', '5G'],
                  ] as const
                ).map(([net, label]) => (
                  <button
                    key={net}
                    type="button"
                    aria-pressed={networkMode === net}
                    onClick={() => setNetworkMode(net)}
                    className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors ${
                      networkMode === net
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">Brillo pOLED</p>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                {(
                  [
                    ['low', 'Bajo'],
                    ['medium', 'Medio'],
                    ['high', 'Alto'],
                  ] as const
                ).map(([lvl, label]) => (
                  <button
                    key={lvl}
                    type="button"
                    aria-pressed={brightness === lvl}
                    onClick={() => setBrightness(lvl)}
                    className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors ${
                      brightness === lvl
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          data-testid="autonomy-output"
          className="lg:col-span-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 p-5 grid grid-cols-2 gap-4"
        >
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pantalla activa (SoT)</p>
            <p className="mt-1 font-display text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {estimate.screenOnHours}h {String(estimate.screenOnMinutesRemainder).padStart(2, '0')}m
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">En espera máx.</p>
            <p className="mt-1 font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
              ~{estimate.standbyHours} h
            </p>
          </div>
          <div className="col-span-2 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
            {estimate.potentialMinutesSaved > 0
              ? `Ganarías aprox. +${estimate.potentialMinutesSaved} min extra cambiando a 60 Hz y Wi-Fi.`
              : 'Perfil optimizado al máximo para extender la duración de los 4500 mAh.'}
          </div>
        </div>
      </div>
    </section>
  );
};
