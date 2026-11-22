import React, { useEffect, useRef, useState } from 'react';
import { Camera, Compass, Timer, VideoOff } from 'lucide-react';
import { CAMERA_LENSES } from '../data/edge50ProSpecs';
import {
  calculateCameraExposure,
  computeAngleDeviation,
  LensId,
  LightingCondition,
  PhotoSubject,
} from '../utils/deviceLogic';

export const CameraProSection: React.FC = () => {
  const [selectedLens, setSelectedLens] = useState<LensId>('main_50mp');
  const [lighting, setLighting] = useState<LightingCondition>('daylight');
  const [subject, setSubject] = useState<PhotoSubject>('portrait');

  const [sensorActive, setSensorActive] = useState(false);
  const [tilt, setTilt] = useState({ beta: 0.4, gamma: -0.6 });
  const [gridOverlay, setGridOverlay] = useState<'thirds' | 'golden' | 'none'>('thirds');

  const [liveCameraOn, setLiveCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [timerDelaySec, setTimerDelaySec] = useState<3 | 5 | 10>(3);
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const [shutterStatus, setShutterStatus] = useState<string | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeLensSpec = CAMERA_LENSES.find((l) => l.id === selectedLens) ?? CAMERA_LENSES[0];
  const exposure = calculateCameraExposure({ lens: selectedLens, lighting, subject });
  const levelInfo = computeAngleDeviation(tilt.beta, tilt.gamma);

  useEffect(() => {
    if (!sensorActive) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = typeof e.beta === 'number' ? e.beta - 45 : 0;
      const gamma = typeof e.gamma === 'number' ? e.gamma : 0;
      setTilt({ beta, gamma });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [sensorActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  const playCountdownBeep = (isFinalShutter: boolean) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isFinalShutter ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinalShutter ? 1320 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinalShutter ? 0.16 : 0.08));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isFinalShutter ? 0.17 : 0.09));
    } catch {
      // Ignore audio errors
    }
  };

  const toggleShutterTimer = () => {
    if (countdownLeft !== null) {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setCountdownLeft(null);
      setShutterStatus('Temporizador cancelado.');
      return;
    }

    let remaining = timerDelaySec;
    setCountdownLeft(remaining);
    setShutterStatus(
      `Cuenta atrás de ${remaining} s iniciada para toma estable (${activeLensSpec.shortName})...`
    );
    if (remaining <= 3) {
      playCountdownBeep(false);
    }

    timerIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdownLeft(remaining);
        if (remaining <= 3) {
          playCountdownBeep(false);
        }
      } else {
        if (timerIntervalRef.current !== null) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setCountdownLeft(null);
        playCountdownBeep(true);
        if ('vibrate' in navigator) {
          navigator.vibrate(40);
        }
        setShutterStatus(
          `Disparo ejecutado (${exposure.shutter} · ISO ${exposure.iso}) — Listo para siguiente toma.`
        );
      }
    }, 1000);
  };

  const toggleLiveCamera = async () => {
    if (liveCameraOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setLiveCameraOn(false);
      setCameraError(null);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no admite acceso directo a cámara desde este contexto.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveCameraOn(true);
      setCameraError(null);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraError(
        'Permiso de cámara denegado o no disponible. Puedes seguir usando la vista simulada y el nivelador.'
      );
      setLiveCameraOn(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 [text-wrap:balance]">
          Cámara Pro Pantone Validated
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Calcula parámetros manuales exactos para el sensor 50 MP f/1.4, Teleobjetivo 3x y Macro 13 MP con nivelador de horizonte.
        </p>
      </div>

      {/* Lens selector tabs */}
      <section aria-label="Selector de lente trasero">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CAMERA_LENSES.map((lens) => {
            const active = lens.id === selectedLens;
            return (
              <button
                key={lens.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedLens(lens.id)}
                className={`rounded-2xl p-5 text-left border transition-colors duration-75 ${
                  active
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg font-semibold">{lens.shortName}</span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      active ? 'text-indigo-100' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {lens.aperture} {lens.ois ? '· OIS' : ''}
                  </span>
                </div>
                <p className={`mt-1 text-sm font-medium ${active ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                  {lens.name}
                </p>
                <p className={`mt-2 text-xs leading-relaxed ${active ? 'text-indigo-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {lens.bestFor}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pro Mode Exposure Calculator */}
        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Ajustes Recomendados — Modo Pro
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {activeLensSpec.name} · Enfoque mínimo {activeLensSpec.minFocus} · FOV {activeLensSpec.fov}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Iluminación de la escena
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['daylight', 'Luz de día'],
                    ['indoor', 'Interior'],
                    ['night', 'Nocturna'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={lighting === key}
                    onClick={() => setLighting(key)}
                    className={`min-h-[44px] rounded-xl border text-xs font-medium transition-colors duration-75 ${
                      lighting === key
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Tipo de fotografía
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    ['portrait', 'Retrato'],
                    ['motion', 'Acción'],
                    ['landscape', 'Paisaje'],
                    ['macro', 'Macro'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={subject === key}
                    onClick={() => setSubject(key)}
                    className={`min-h-[44px] rounded-xl border text-xs font-medium transition-colors duration-75 ${
                      subject === key
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            data-testid="pro-exposure-readout"
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5 border-t border-zinc-100 dark:border-zinc-800"
          >
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">ISO sugerido</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {exposure.iso}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Obturación (S)</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {exposure.shutter}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Compensación EV</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {exposure.evComp}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Balance y Enfoque</p>
              <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {exposure.whiteBalance} <span aria-hidden="true">·</span> {exposure.focusMode}
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {exposure.tip}
          </p>
        </section>

        {/* Live Horizon Leveler & Framing Viewfinder */}
        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Nivelador y Encuadre
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {levelInfo.isLevel
                  ? 'Horizonte nivelado (±1.5°)'
                  : `Inclinación ${levelInfo.rollDeg}° · Cabeceo ${levelInfo.pitchDeg}°`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSensorActive((v) => !v)}
                className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  sensorActive
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>{sensorActive ? 'Giroscopio activo' : 'Usar giroscopio'}</span>
              </button>

              <button
                type="button"
                onClick={toggleLiveCamera}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-2 text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {liveCameraOn ? (
                  <>
                    <VideoOff className="w-4 h-4" aria-hidden="true" />
                    <span>Detener cámara</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" aria-hidden="true" />
                    <span>Vista previa real</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {cameraError && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2">
              {cameraError}
            </p>
          )}

          {/* Viewfinder frame */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            {liveCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />
            )}

            <span className="absolute bottom-3 left-3 z-10 rounded-lg bg-black/70 px-2.5 py-1 font-mono text-xs text-zinc-200 tabular-nums">
              {activeLensSpec.focalLengthMm} mm · {activeLensSpec.aperture}
            </span>

            {/* Grid overlay */}
            {gridOverlay === 'thirds' && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="border border-white/15" />
                ))}
              </div>
            )}

            {gridOverlay === 'golden' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-y-0 left-[38.2%] w-px bg-white/25" />
                <div className="absolute inset-y-0 left-[61.8%] w-px bg-white/25" />
                <div className="absolute inset-x-0 top-[38.2%] h-px bg-white/25" />
                <div className="absolute inset-x-0 top-[61.8%] h-px bg-white/25" />
              </div>
            )}

            {/* Horizon bar */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-36 h-0.5 transition-transform duration-75 ${
                  levelInfo.isLevel ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ transform: `rotate(${levelInfo.rollDeg}deg) translateY(${levelInfo.pitchDeg}px)` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
              {(
                [
                  ['thirds', 'Tercios'],
                  ['golden', 'Áurea'],
                  ['none', 'Sin guía'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGridOverlay(mode)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    gridOverlay === mode
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!sensorActive && (
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <label htmlFor="manual-roll" className="whitespace-nowrap">
                  Probar inclinación:
                </label>
                <input
                  id="manual-roll"
                  type="range"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={tilt.gamma}
                  onChange={(e) => setTilt((t) => ({ ...t, gamma: Number(e.target.value) }))}
                  className="w-28 accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Pro Shutter Self-Timer for Tripod / Long Exposure */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Temporizador de Obturación Pro (Trípode / Larga Exposición)
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Pitidos en los últimos 3 segundos para evitar vibración al disparar en 50 MP f/1.4.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {([3, 5, 10] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={countdownLeft !== null}
                      onClick={() => setTimerDelaySec(sec)}
                      className={`min-h-[34px] px-2.5 rounded-md font-mono text-xs font-medium transition-colors ${
                        timerDelaySec === sec
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={toggleShutterTimer}
                  className={`min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    countdownLeft !== null
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {countdownLeft !== null ? `Cancelar (${countdownLeft}s)` : `Iniciar ${timerDelaySec}s`}
                  </span>
                </button>
              </div>
            </div>

            {shutterStatus && (
              <p
                role="status"
                data-testid="shutter-timer-status"
                className="text-xs text-indigo-700 dark:text-indigo-300"
              >
                {shutterStatus}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
