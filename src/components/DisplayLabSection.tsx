import React, { useEffect, useRef, useState } from 'react';
import { MonitorCheck, Play, Sparkles, X } from 'lucide-react';
import { classifyRefreshRate } from '../utils/deviceLogic';

type FullscreenTestMode =
  | null
  | 'oled-black'
  | 'gray-5'
  | 'peak-white'
  | 'pantone-swatches'
  | 'touch-curves';

type EdgeLightPreset = {
  id: string;
  name: string;
  gradient: string;
  ringColor: string;
};

const EDGE_LIGHT_PRESETS: EdgeLightPreset[] = [
  {
    id: 'lavender',
    name: 'Luxe Lavender',
    gradient: 'from-indigo-500 via-violet-500 to-indigo-400',
    ringColor: 'rgba(129, 140, 248, 0.85)',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Azul',
    gradient: 'from-blue-500 via-cyan-400 to-blue-600',
    ringColor: 'rgba(59, 130, 246, 0.85)',
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    ringColor: 'rgba(16, 185, 129, 0.85)',
  },
  {
    id: 'amber',
    name: 'Ámbar Solar',
    gradient: 'from-amber-400 via-orange-500 to-amber-500',
    ringColor: 'rgba(245, 158, 11, 0.85)',
  },
];

const PANTONE_SWATCHES = [
  { name: 'SkinTone Light', hex: '#F3D2C1' },
  { name: 'SkinTone Medium', hex: '#C68B66' },
  { name: 'SkinTone Deep', hex: '#6E4230' },
  { name: 'Pantone Iris', hex: '#5B4FE9' },
  { name: 'Rojo Puro', hex: '#EF4444' },
  { name: 'Verde Puro', hex: '#22C55E' },
  { name: 'Azul Puro', hex: '#3B82F6' },
  { name: 'Negro OLED', hex: '#000000' },
];

export const DisplayLabSection: React.FC = () => {
  const [measuring, setMeasuring] = useState(false);
  const [measuredFps, setMeasuredFps] = useState<number | null>(null);
  const [fullscreenTest, setFullscreenTest] = useState<FullscreenTestMode>(null);
  const [edgeColor, setEdgeColor] = useState<EdgeLightPreset>(EDGE_LIGHT_PRESETS[0]);
  const [edgePulseActive, setEdgePulseActive] = useState(false);
  const [trackSpeedMode, setTrackSpeedMode] = useState<'60' | '144'>('144');
  const [touchPoints, setTouchPoints] = useState<{ x: number; y: number }[]>([]);
  const rafRef = useRef<number | null>(null);

  const runRefreshTest = () => {
    if (measuring) return;
    setMeasuring(true);
    setMeasuredFps(null);
    let frames = 0;
    let startTime = 0;

    const step = (now: number) => {
      if (startTime === 0) {
        startTime = now;
      }
      frames += 1;
      const elapsed = now - startTime;
      if (elapsed >= 1600) {
        const fps = Math.round(((frames - 1) / elapsed) * 1000);
        setMeasuredFps(fps);
        setMeasuring(false);
        return;
      }
      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenTest) {
        setFullscreenTest(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenTest]);

  const triggerEdgeLightPreview = () => {
    setEdgePulseActive(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
    window.setTimeout(() => setEdgePulseActive(false), 1800);
  };

  const classification = measuredFps !== null ? classifyRefreshRate(measuredFps) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 [text-wrap:balance]">
          Laboratorio de Pantalla pOLED 144 Hz
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Comprueba la frecuencia real de tu panel Super HD (2712 × 1220), verifica negros pOLED y previsualiza las Luces de Borde.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 144Hz Refresh Rate Tester */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Medidor de Hercios en Vivo
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mide el ritmo real de cuadros por segundo del navegador en tu Edge 50 Pro.
              </p>
            </div>
            <button
              type="button"
              onClick={runRefreshTest}
              disabled={measuring}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>{measuring ? 'Midiendo...' : 'Medir pantalla ahora'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Medición actual</p>
              <p
                data-testid="measured-fps-value"
                className="mt-1 font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums"
              >
                {measuring ? '...' : measuredFps !== null ? `${measuredFps} FPS` : 'Sin medir'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Perfil detectado</p>
              <p className="mt-1 font-display text-lg font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {classification ? `${classification.tierHz} Hz` : 'Hasta 144 Hz'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tiempo por cuadro</p>
              <p className="mt-1 font-mono text-lg font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
                {classification ? `${classification.frameBudgetMs} ms` : '6.94 ms @ 144Hz'}
              </p>
            </div>
          </div>

          {/* Interactive 60Hz vs 144Hz smoothness comparison */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Comparativa visual de desplazamiento
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setTrackSpeedMode('60')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    trackSpeedMode === '60'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Simular 60 Hz
                </button>
                <button
                  type="button"
                  onClick={() => setTrackSpeedMode('144')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    trackSpeedMode === '144'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Fluidez 144 Hz
                </button>
              </div>
            </div>

            <SmoothnessTrack mode={trackSpeedMode} />

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {classification
                ? `${classification.label}. Si ves 60 FPS en tu Edge 50 Pro, activa "144 Hz" en Ajustes > Pantalla > Frecuencia de actualización.`
                : 'Nota: En modo Automático el sistema baja a 60 Hz cuando no tocas la pantalla y sube a 120/144 Hz al desplazarte.'}
            </p>
          </div>
        </section>

        {/* Edge Lights Simulator */}
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Simulador de Luces de Borde
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Previsualiza los destellos laterales para pantalla curva Endless Edge boca abajo.
              </p>
            </div>

            <div
              className="relative mx-auto w-44 h-64 rounded-[28px] bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-4 overflow-hidden transition-shadow duration-300"
              style={{
                boxShadow: edgePulseActive
                  ? `inset 0 0 28px ${edgeColor.ringColor}, 0 0 24px ${edgeColor.ringColor}`
                  : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div
                className={`absolute inset-y-3 left-0 w-1.5 rounded-r-full bg-gradient-to-b ${edgeColor.gradient} transition-opacity duration-300 ${
                  edgePulseActive ? 'opacity-100' : 'opacity-25'
                }`}
              />
              <div
                className={`absolute inset-y-3 right-0 w-1.5 rounded-l-full bg-gradient-to-b ${edgeColor.gradient} transition-opacity duration-300 ${
                  edgePulseActive ? 'opacity-100' : 'opacity-25'
                }`}
              />
              <p className="font-mono text-2xl font-semibold text-zinc-100 tabular-nums">09:42</p>
              <p className="text-[11px] text-zinc-400 mt-1 text-center">
                {edgePulseActive ? 'Notificación entrante' : edgeColor.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EDGE_LIGHT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setEdgeColor(preset)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors ${
                    edgeColor.id === preset.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={triggerEdgeLightPreview}
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span>Probar destello y vibración</span>
          </button>
        </section>
      </div>

      {/* pOLED Panel & Pantone Inspection Tools */}
      <section className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Pruebas a Pantalla Completa (pOLED y Bordes Curvos)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Inspecciona píxeles, uniformidad de grises oscuros, calibración Pantone SkinTone y respuesta táctil lateral.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => setFullscreenTest('oled-black')}
            className="min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left hover:border-indigo-500 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Negro Puro OLED</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">#000000 píxeles apagados</p>
          </button>

          <button
            type="button"
            onClick={() => setFullscreenTest('gray-5')}
            className="min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left hover:border-indigo-500 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Uniformidad Gris 5%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Detectar tinte o banding</p>
          </button>

          <button
            type="button"
            onClick={() => setFullscreenTest('peak-white')}
            className="min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left hover:border-indigo-500 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Blanco Brillante</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Buscar píxeles muertos</p>
          </button>

          <button
            type="button"
            onClick={() => setFullscreenTest('pantone-swatches')}
            className="min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left hover:border-indigo-500 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Muestras Pantone</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Validación SkinTone y RGB</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setTouchPoints([]);
              setFullscreenTest('touch-curves');
            }}
            className="min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left hover:border-indigo-500 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Táctil en Curvas</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Traza los bordes laterales</p>
          </button>
        </div>
      </section>

      {/* Fullscreen test overlay */}
      {fullscreenTest && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Prueba de pantalla completa"
          className={`fixed inset-0 z-50 flex flex-col justify-between p-6 select-none ${
            fullscreenTest === 'oled-black'
              ? 'bg-black text-zinc-300'
              : fullscreenTest === 'gray-5'
              ? 'bg-[#0d0d0f] text-zinc-300'
              : fullscreenTest === 'peak-white'
              ? 'bg-white text-zinc-900'
              : 'bg-zinc-950 text-zinc-100'
          }`}
          onPointerMove={(e) => {
            if (fullscreenTest === 'touch-curves' && e.buttons > 0) {
              setTouchPoints((prev) => [...prev.slice(-120), { x: e.clientX, y: e.clientY }]);
            }
          }}
          onPointerDown={(e) => {
            if (fullscreenTest === 'touch-curves') {
              setTouchPoints((prev) => [...prev.slice(-120), { x: e.clientX, y: e.clientY }]);
            }
          }}
        >
          <div className="flex items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-2 text-xs font-medium opacity-80">
              <MonitorCheck className="w-4 h-4" aria-hidden="true" />
              <span>
                {fullscreenTest === 'oled-black' && 'Prueba Negro Puro pOLED (#000000)'}
                {fullscreenTest === 'gray-5' && 'Uniformidad Gris 5%'}
                {fullscreenTest === 'peak-white' && 'Inspección Blanco Máximo'}
                {fullscreenTest === 'pantone-swatches' && 'Carta de Color Pantone y SkinTone'}
                {fullscreenTest === 'touch-curves' && 'Desliza el dedo por toda la pantalla y los bordes curvos'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFullscreenTest(null)}
              className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 rounded-xl bg-zinc-800/80 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>Salir</span>
            </button>
          </div>

          {fullscreenTest === 'pantone-swatches' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full mx-auto my-auto">
              {PANTONE_SWATCHES.map((swatch) => (
                <div
                  key={swatch.name}
                  className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900"
                >
                  <div className="h-28 w-full" style={{ backgroundColor: swatch.hex }} />
                  <div className="p-3">
                    <p className="text-xs font-medium text-zinc-100">{swatch.name}</p>
                    <p className="font-mono text-[11px] text-zinc-400">{swatch.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fullscreenTest === 'touch-curves' && (
            <svg className="fixed inset-0 w-full h-full pointer-events-none">
              {touchPoints.map((pt, idx) => (
                <circle key={idx} cx={pt.x} cy={pt.y} r={8} fill="rgba(129, 140, 248, 0.7)" />
              ))}
            </svg>
          )}

          <p className="text-center text-xs opacity-60 z-10">
            Pulsa Salir o la tecla Esc para volver al laboratorio.
          </p>
        </div>
      )}
    </div>
  );
};

const SmoothnessTrack: React.FC<{ mode: '60' | '144' }> = ({ mode }) => {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastRender = 0;
    const minInterval = mode === '60' ? 1000 / 24 : 0; // exaggerate stutter on 60Hz comparison track visually so user sees frame cadence difference even on 60Hz screens

    const tick = (now: number) => {
      if (now - lastRender >= minInterval) {
        lastRender = now;
        const pct = ((now * 0.045) % 200);
        setPos(pct <= 100 ? pct : 200 - pct);
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [mode]);

  return (
    <div className="relative h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden px-4 flex items-center">
      <div
        className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-400 will-change-transform"
        style={{ transform: `translateX(${pos * 2.2}px)` }}
      />
      <span className="ml-auto font-mono text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
        {mode === '144' ? 'Sin límite de fotogramas' : 'Cadencia reducida'}
      </span>
    </div>
  );
};
