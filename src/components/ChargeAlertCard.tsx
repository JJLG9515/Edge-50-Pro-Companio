import React from 'react';
import { Bell, BellRing, Volume2 } from 'lucide-react';
import { NotificationPermissionState } from '../hooks/useChargeAlertMonitor';

interface ChargeAlertCardProps {
  alertEnabled: boolean;
  onToggleAlertEnabled: (next: boolean) => void;
  thresholdPct: number;
  onChangeThresholdPct: (pct: number) => void;
  soundAndVibrate: boolean;
  onToggleSoundAndVibrate: (next: boolean) => void;
  permission: NotificationPermissionState;
  onRequestPermission: () => Promise<NotificationPermissionState>;
  onTriggerTestAlert: () => void;
  lastAlertTime: string | null;
}

const THRESHOLD_OPTIONS = [75, 80, 85, 90];

export const ChargeAlertCard: React.FC<ChargeAlertCardProps> = ({
  alertEnabled,
  onToggleAlertEnabled,
  thresholdPct,
  onChangeThresholdPct,
  soundAndVibrate,
  onToggleSoundAndVibrate,
  permission,
  onRequestPermission,
  onTriggerTestAlert,
  lastAlertTime,
}) => {
  const permissionText =
    permission === 'granted'
      ? 'Notificaciones del sistema activadas'
      : permission === 'denied'
      ? 'Permiso bloqueado en el navegador (se usará aviso en pantalla y sonido)'
      : permission === 'unsupported'
      ? 'Navegador sin API de notificaciones (se usará aviso en pantalla)'
      : 'Permiso del navegador pendiente de autorizar';

  return (
    <section
      aria-labelledby="charge-alert-heading"
      className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="charge-alert-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Alerta Local para Desconectar Cargador
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Envía una notificación local en tu Edge 50 Pro y un aviso sonoro cuando la carga alcance el umbral elegido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
            {alertEnabled ? `Alerta al ${thresholdPct}% activa` : 'Alerta desactivada'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={alertEnabled}
            aria-label="Activar alerta local de desconexión de cargador"
            onClick={() => onToggleAlertEnabled(!alertEnabled)}
            className={`min-w-[52px] min-h-[32px] rounded-full p-1 transition-colors shrink-0 ${
              alertEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                alertEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Umbral de notificación
            </p>
            <div className="grid grid-cols-4 gap-2">
              {THRESHOLD_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  aria-pressed={thresholdPct === pct}
                  onClick={() => onChangeThresholdPct(pct)}
                  className={`min-h-[44px] rounded-xl border font-mono text-sm font-semibold tabular-nums transition-colors ${
                    thresholdPct === pct
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">
                Aviso sonoro y vibración háptica
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundAndVibrate}
              aria-label="Activar aviso sonoro y vibración"
              onClick={() => onToggleSoundAndVibrate(!soundAndVibrate)}
              className={`min-w-[52px] min-h-[32px] rounded-full p-1 transition-colors shrink-0 ${
                soundAndVibrate ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  soundAndVibrate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Estado de entrega local
            </p>
            <p
              data-testid="notification-permission-status"
              className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed"
            >
              {permissionText}
            </p>
            {lastAlertTime && (
              <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                Último aviso enviado: {lastAlertTime}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {permission === 'default' && (
              <button
                type="button"
                onClick={() => void onRequestPermission()}
                className="min-h-[44px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                Autorizar notificaciones
              </button>
            )}

            <button
              type="button"
              onClick={onTriggerTestAlert}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <BellRing className="w-4 h-4" aria-hidden="true" />
              <span>Probar alerta del {thresholdPct}%</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
