import React, { useState } from 'react';
import { ArrowRight, Check, Download, Smartphone } from 'lucide-react';
import {
  HARDWARE_METRICS,
  HERO_IMAGE_PATH,
  INITIAL_SETUP_TASKS,
  TabId,
} from '../data/edge50ProSpecs';
import { computeSetupProgress } from '../utils/deviceLogic';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DeviceDiagnosticsCard } from './DeviceDiagnosticsCard';

interface OverviewSectionProps {
  completedTaskIds: string[];
  onToggleTask: (id: string) => void;
  onNavigateTab: (tab: TabId) => void;
  deviceNickname: string;
  onChangeNickname: (name: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  completedTaskIds,
  onToggleTask,
  onNavigateTab,
  deviceNickname,
  onChangeNickname,
}) => {
  const [imgError, setImgError] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(deviceNickname);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const progress = computeSetupProgress(completedTaskIds, INITIAL_SETUP_TASKS.length);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftName.trim();
    if (cleaned) {
      onChangeNickname(cleaned);
    }
    setEditingName(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero Split: 2-column stretch on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-5 sm:p-8">
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Motorola Mobility</span>
              <span aria-hidden="true">·</span>
              <span>Edición Pantone Validated</span>
              <span aria-hidden="true">·</span>
              <span>Android 14 / Hello UI</span>
            </div>

            {editingName ? (
              <form onSubmit={handleSaveName} className="flex flex-wrap items-center gap-2">
                <label htmlFor="device-nickname" className="sr-only">
                  Nombre de tu teléfono
                </label>
                <input
                  id="device-nickname"
                  type="text"
                  maxLength={32}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-base font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(deviceNickname);
                    setEditingName(false);
                  }}
                  className="min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 [text-wrap:balance]">
                  {deviceNickname}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(deviceNickname);
                    setEditingName(true);
                  }}
                  className="min-h-[44px] px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Cambiar nombre
                </button>
              </div>
            )}

            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-2xl">
              Centro de utilidades diseñado específicamente para las capacidades de tu Motorola Edge 50 Pro:
              mide la fluidez real de 144 Hz, calibra la pantalla pOLED, calcula cargas TurboPower de 125 W y
              ajusta la cámara de 50 MP f/1.4 antes de disparar.
            </p>
          </div>

          <div className="mt-5 sm:mt-8 pt-5 sm:pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('display')}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Medir 144 Hz en vivo</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('camera')}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Asistente Cámara Pro</span>
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  if (isInstallable) {
                    void install();
                  } else {
                    setShowInstallGuide((prev) => !prev);
                  }
                }}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{isInstallable ? 'Instalar en Edge 50 Pro' : 'Agregar a inicio'}</span>
              </button>
            )}
          </div>

          {showInstallGuide && !isInstalled && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-300">
              {isIOS
                ? 'Pulsa Compartir en Safari y selecciona "Añadir a pantalla de inicio".'
                : 'En Chrome para Android sobre tu Motorola Edge 50 Pro, abre el menú (⋮) y selecciona "Instalar aplicación" o "Añadir a pantalla de inicio" para usarla sin conexión.'}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 min-h-[260px]">
          {!imgError ? (
            <img
              src={HERO_IMAGE_PATH}
              alt="Motorola Edge 50 Pro en acabado lavanda mate sobre piedra travertino"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 text-zinc-100">
              <Smartphone className="w-12 h-12 text-indigo-400 mb-3" aria-hidden="true" />
              <p className="font-display text-lg font-semibold">Motorola Edge 50 Pro</p>
              <p className="text-xs text-zinc-400 mt-1">6.7&quot; pOLED · 144 Hz · 125 W TurboPower</p>
            </div>
          )}
        </div>
      </section>

      {/* 4-column hardware summary strip */}
      <section aria-label="Especificaciones clave del hardware">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HARDWARE_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-5"
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{metric.label}</p>
              <p className="mt-1.5 font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{metric.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Browser Telemetry & Wake Lock */}
      <DeviceDiagnosticsCard />

      {/* Setup Checklist */}
      <section
        aria-labelledby="setup-checklist-heading"
        className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2
              id="setup-checklist-heading"
              className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Puesta a punto recomendada
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Marca los ajustes que ya activaste en tu Edge 50 Pro. Tu progreso se guarda en el dispositivo.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p
                data-testid="setup-progress-text"
                className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                {progress.completed} / {progress.total} completados ({progress.percent}%)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-200"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {INITIAL_SETUP_TASKS.map((task) => {
            const checked = completedTaskIds.includes(task.id);
            return (
              <li
                key={task.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${checked ? 'Desmarcar' : 'Marcar'} ${task.title}`}
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 min-w-[44px] min-h-[44px] sm:min-w-[28px] sm:min-h-[28px] w-7 h-7 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      checked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-transparent hover:border-indigo-500'
                    }`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        checked
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {task.category} <span aria-hidden="true">·</span> {task.detail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab(task.targetTab)}
                  className="self-start sm:self-center min-h-[44px] px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Abrir herramienta
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
