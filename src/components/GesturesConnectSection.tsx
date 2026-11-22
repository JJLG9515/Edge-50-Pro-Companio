import React, { useEffect, useState } from 'react';
import { Laptop, Smartphone, Vibrate } from 'lucide-react';
import { MOTO_GESTURES, SMART_CONNECT_MODES } from '../data/edge50ProSpecs';
import { SpeakerWaterCard } from './SpeakerWaterCard';

export const GesturesConnectSection: React.FC = () => {
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [motionListening, setMotionListening] = useState(false);
  const [motionDetected, setMotionDetected] = useState<string | null>(null);
  const [selectedConnectId, setSelectedConnectId] = useState<string>(SMART_CONNECT_MODES[0].id);

  const activeConnectMode =
    SMART_CONNECT_MODES.find((m) => m.id === selectedConnectId) ?? SMART_CONNECT_MODES[0];

  const triggerGestureFeedback = (id: string, name: string, pattern: number[]) => {
    setActiveFeedback(id);
    setMotionDetected(`Respuesta háptica probada: ${name}`);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
    window.setTimeout(() => {
      setActiveFeedback((curr) => (curr === id ? null : curr));
    }, 1200);
  };

  useEffect(() => {
    if (!motionListening) return;

    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
      const now = Date.now();
      if (total > 23 && now - lastShake > 1000) {
        lastShake = now;
        setMotionDetected('Sacudida rápida detectada por el acelerómetro del Edge 50 Pro');
        if ('vibrate' in navigator) {
          navigator.vibrate([45, 55, 45]);
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [motionListening]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 [text-wrap:balance]">
          Gestos Moto y Smart Connect
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Prueba el acelerómetro y respuesta háptica de los gestos clásicos de Motorola y configura Smart Connect para PC o TV.
        </p>
      </div>

      {/* Moto Gestures Interactive Cards */}
      <section className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Probador de Gestos y Háptica
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Activa el detector de sacudida en tu móvil o prueba cada patrón de vibración.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMotionListening((v) => !v)}
            className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              motionListening
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Smartphone className="w-4 h-4" aria-hidden="true" />
            <span>{motionListening ? 'Escuchando acelerómetro' : 'Detectar sacudida real'}</span>
          </button>
        </div>

        {motionDetected && (
          <p
            role="status"
            className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl px-4 py-2.5"
          >
            {motionDetected}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOTO_GESTURES.map((gesture) => {
            const flashing = activeFeedback === gesture.id;
            return (
              <div
                key={gesture.id}
                className={`rounded-2xl border p-5 transition-colors flex flex-col justify-between gap-4 ${
                  flashing
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{gesture.trigger}</p>
                  <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {gesture.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{gesture.action}</p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{gesture.hint}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    triggerGestureFeedback(gesture.id, gesture.name, gesture.vibrationPattern)
                  }
                  className="min-h-[44px] self-start inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-indigo-500 transition-colors"
                >
                  <Vibrate className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <span>Probar vibración</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dolby Atmos Stereo & IP68 Water Eject */}
      <SpeakerWaterCard />

      {/* Smart Connect Guide */}
      <section className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Guía Smart Connect (USB-C 3.1 y Wi-Fi)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              El puerto USB-C del Edge 50 Pro soporta salida de vídeo DisplayPort y conexión inalámbrica a PC.
            </p>
          </div>
          <Laptop className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap gap-2">
          {SMART_CONNECT_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelectedConnectId(mode.id)}
              className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedConnectId === mode.id
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              {mode.title}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Requisito: {activeConnectMode.requirement}
            </p>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {activeConnectMode.summary}
            </p>
          </div>

          <ol className="space-y-2.5">
            {activeConnectMode.steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-0.5 tabular-nums">
                  0{index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
};
