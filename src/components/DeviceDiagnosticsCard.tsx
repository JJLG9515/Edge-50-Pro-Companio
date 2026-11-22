import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Lock, Unlock } from 'lucide-react';

interface HardwareSnapshot {
  screenSize: string;
  dpr: string;
  cores: string;
  memoryGb: string;
  network: string;
  storageInfo: string;
}

export const DeviceDiagnosticsCard: React.FC = () => {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockMessage, setWakeLockMessage] = useState<string | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const [snapshot, setSnapshot] = useState<HardwareSnapshot>({
    screenSize: '—',
    dpr: '—',
    cores: '—',
    memoryGb: '—',
    network: '—',
    storageInfo: '—',
  });

  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { effectiveType?: string; downlink?: number };
    };

    const cores = nav.hardwareConcurrency ? `${nav.hardwareConcurrency} hilos` : 'No expuesto';
    const memoryGb = nav.deviceMemory ? `${nav.deviceMemory} GB aprox.` : 'No expuesto';
    const screenSize = `${window.screen.width} × ${window.screen.height}`;
    const dpr = `${window.devicePixelRatio.toFixed(2)}x`;
    const netType = nav.connection?.effectiveType?.toUpperCase();
    const downlink = nav.connection?.downlink;
    const network = netType
      ? `${netType}${downlink ? ` · ${downlink} Mbps` : ''}`
      : navigator.onLine
      ? 'En línea'
      : 'Sin conexión';

    setSnapshot((prev) => ({
      ...prev,
      screenSize,
      dpr,
      cores,
      memoryGb,
      network,
    }));

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then((est) => {
          const usedMb = ((est.usage ?? 0) / (1024 * 1024)).toFixed(1);
          const quotaGb = ((est.quota ?? 0) / (1024 * 1024 * 1024)).toFixed(1);
          setSnapshot((prev) => ({
            ...prev,
            storageInfo: `${usedMb} MB usados / ${quotaGb} GB disp.`,
          }));
        })
        .catch(() => {
          setSnapshot((prev) => ({ ...prev, storageInfo: 'No disponible' }));
        });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        void wakeLockRef.current.release();
      }
    };
  }, []);

  const toggleWakeLock = async () => {
    if (wakeLockActive && wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore release error
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
      setWakeLockMessage('Bloqueo de pantalla restaurado al ajuste del teléfono.');
      return;
    }

    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (type: 'screen') => Promise<{
          release: () => Promise<void>;
          addEventListener?: (type: string, cb: () => void) => void;
        }>;
      };
    };

    if (!nav.wakeLock) {
      setWakeLockMessage('Wake Lock API no disponible en este navegador.');
      return;
    }

    try {
      const sentinel = await nav.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setWakeLockActive(true);
      setWakeLockMessage('Pantalla activa mientras esta app permanezca abierta.');
      sentinel.addEventListener?.('release', () => {
        setWakeLockActive(false);
      });
    } catch {
      setWakeLockMessage('El navegador restringió Wake Lock en esta vista o marco.');
    }
  };

  return (
    <section
      aria-labelledby="device-diag-heading"
      className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="device-diag-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Telemetría Real del Navegador y Pantalla Activa
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Datos leídos en vivo desde las APIs de tu dispositivo y control para evitar que la pantalla se apague.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-pressed={wakeLockActive}
          onClick={() => void toggleWakeLock()}
          className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            wakeLockActive
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-indigo-500'
          }`}
        >
          {wakeLockActive ? (
            <>
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Pantalla siempre encendida</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" aria-hidden="true" />
              <span>Mantener pantalla encendida</span>
            </>
          )}
        </button>
      </div>

      {wakeLockMessage && (
        <p role="status" className="text-xs text-indigo-700 dark:text-indigo-300">
          {wakeLockMessage}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Resolución lógica</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {snapshot.screenSize}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Escala (DPR)</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {snapshot.dpr}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Núcleos CPU</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {snapshot.cores}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Memoria RAM</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {snapshot.memoryGb}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Conectividad</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {snapshot.network}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Almacenamiento web</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {snapshot.storageInfo}
          </p>
        </div>
      </div>
    </section>
  );
};
