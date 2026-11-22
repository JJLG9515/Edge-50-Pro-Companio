import React, { useEffect, useRef, useState } from 'react';
import { Droplets, Square, Volume2 } from 'lucide-react';

type AudioChannel = 'left' | 'right' | 'both';

export const SpeakerWaterCard: React.FC = () => {
  const [playingMode, setPlayingMode] = useState<'none' | 'stereo-left' | 'stereo-right' | 'stereo-both' | 'water-eject'>('none');
  const [ejectSecondsLeft, setEjectSecondsLeft] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopAudio = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {
        // Ignore already stopped oscillator
      }
      oscRef.current = null;
    }
    setPlayingMode('none');
    setEjectSecondsLeft(0);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  const getContext = () => {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playStereoTest = (channel: AudioChannel) => {
    stopAudio();
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(channel === 'left' ? 440 : channel === 'right' ? 523.25 : 480, ctx.currentTime);
    panner.pan.setValueAtTime(channel === 'left' ? -1 : channel === 'right' ? 1 : 0, ctx.currentTime);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start();
    oscRef.current = osc;
    setPlayingMode(
      channel === 'left' ? 'stereo-left' : channel === 'right' ? 'stereo-right' : 'stereo-both'
    );

    timerRef.current = window.setTimeout(() => {
      stopAudio();
    }, 1800) as unknown as number;
  };

  const startWaterEject = () => {
    if (playingMode === 'water-eject') {
      stopAudio();
      return;
    }
    stopAudio();
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, ctx.currentTime);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    oscRef.current = osc;
    setPlayingMode('water-eject');
    setEjectSecondsLeft(15);

    let remaining = 15;
    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setEjectSecondsLeft(remaining);
      if (remaining <= 0) {
        stopAudio();
      }
    }, 1000);
  };

  return (
    <section
      aria-labelledby="speaker-water-heading"
      className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="speaker-water-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Audio Estéreo Dolby Atmos y Drenaje IP68
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Comprueba ambos altavoces de tu Edge 50 Pro o emite una onda acústica de 165 Hz tras exposición al agua.
            </p>
          </div>
        </div>

        {playingMode !== 'none' && (
          <button
            type="button"
            onClick={stopAudio}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Detener audio</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Balance de Altavoces Estéreo
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Verifica por separado el auricular superior y el altavoz inferior.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => playStereoTest('left')}
              className={`min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                playingMode === 'stereo-left'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              Izquierdo
            </button>
            <button
              type="button"
              onClick={() => playStereoTest('both')}
              className={`min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                playingMode === 'stereo-both'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => playStereoTest('right')}
              className={`min-h-[44px] rounded-xl border text-xs font-medium transition-colors ${
                playingMode === 'stereo-right'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              Derecho
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-5 flex flex-col justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Expulsor de Agua IP68 (165 Hz)
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Sube el volumen al máximo y coloca el teléfono inclinado hacia abajo durante 15 s.
            </p>
          </div>

          <button
            type="button"
            onClick={startWaterEject}
            className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              playingMode === 'water-eject'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Droplets className="w-4 h-4" aria-hidden="true" />
            <span>
              {playingMode === 'water-eject'
                ? `Emitiendo 165 Hz (${ejectSecondsLeft} s)`
                : 'Iniciar pulso de drenaje 15 s'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
