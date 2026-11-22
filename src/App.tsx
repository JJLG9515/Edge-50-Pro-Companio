import React, { useEffect } from 'react';
import {
  BatteryCharging,
  BellRing,
  Camera,
  Hand,
  Monitor,
  Moon,
  Smartphone,
  Sun,
  WifiOff,
  X,
} from 'lucide-react';
import { TabId } from './data/edge50ProSpecs';
import { ChargeLogEntry } from './utils/deviceLogic';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { useChargeAlertMonitor } from './hooks/useChargeAlertMonitor';
import { OverviewSection } from './components/OverviewSection';
import { DisplayLabSection } from './components/DisplayLabSection';
import { CameraProSection } from './components/CameraProSection';
import { BatteryTurboSection } from './components/BatteryTurboSection';
import { GesturesConnectSection } from './components/GesturesConnectSection';

const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Resumen', icon: Smartphone },
  { id: 'display', label: 'Pantalla', icon: Monitor },
  { id: 'camera', label: 'Cámara', icon: Camera },
  { id: 'battery', label: 'Batería', icon: BatteryCharging },
  { id: 'gestures', label: 'Gestos', icon: Hand },
];

const INITIAL_LOGS: ChargeLogEntry[] = [
  {
    id: 'seed-3',
    createdAt: 'Ejemplo 3',
    startPct: 24,
    endPct: 80,
    wattage: 125,
    durationMin: 9,
  },
  {
    id: 'seed-2',
    createdAt: 'Ejemplo 2',
    startPct: 31,
    endPct: 85,
    wattage: 50,
    durationMin: 21,
  },
  {
    id: 'seed-1',
    createdAt: 'Ejemplo 1',
    startPct: 14,
    endPct: 100,
    wattage: 125,
    durationMin: 17,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorageState<TabId>('edge50pro:tab', 'overview');
  const [oledDarkMode, setOledDarkMode] = useLocalStorageState<boolean>('edge50pro:dark', false);
  const [deviceNickname, setDeviceNickname] = useLocalStorageState<string>(
    'edge50pro:nickname',
    'Mi Motorola Edge 50 Pro'
  );
  const [completedTaskIds, setCompletedTaskIds] = useLocalStorageState<string[]>(
    'edge50pro:tasks',
    ['hz-144']
  );
  const [chargeLogs, setChargeLogs] = useLocalStorageState<ChargeLogEntry[]>(
    'edge50pro:chargelogs',
    INITIAL_LOGS
  );
  const isOnline = useOnlineStatus();
  const chargeAlert = useChargeAlertMonitor();

  useEffect(() => {
    const root = document.documentElement;
    if (oledDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [oledDarkMode]);

  const handleToggleTask = (id: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddLog = (entry: ChargeLogEntry) => {
    setChargeLogs((prev) => [entry, ...prev]);
  };

  const handleDeleteLog = (id: string) => {
    setChargeLogs((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F8] text-zinc-900 dark:bg-black dark:text-zinc-100 transition-colors">
      {/* Desktop Top Bar: strict 3-zone contract (Wordmark — 5 nav links — 1 primary button) */}
      <header className="sticky top-0 z-30 bg-[#F6F5F8]/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 md:h-16 flex items-center justify-between gap-8">
          <a
            href="#resumen"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap shrink-0"
          >
            Edge 50 Pro
          </a>

          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[44px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    active
                      ? 'border-indigo-600 dark:border-indigo-400 text-zinc-900 dark:text-zinc-50'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOledDarkMode((prev) => !prev)}
            aria-label={oledDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo negro OLED'}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            {oledDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Modo OLED</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-12">
        {chargeAlert.activeAlert && (
          <div
            role="alert"
            data-testid="charge-alert-banner"
            className="mb-6 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3.5 flex items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <BellRing
                className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                  {chargeAlert.activeAlert.title}
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {chargeAlert.activeAlert.body} · {chargeAlert.activeAlert.timestamp}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={chargeAlert.dismissAlert}
              aria-label="Descartar aviso de carga"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewSection
            completedTaskIds={completedTaskIds}
            onToggleTask={handleToggleTask}
            onNavigateTab={setActiveTab}
            deviceNickname={deviceNickname}
            onChangeNickname={setDeviceNickname}
          />
        )}
        {activeTab === 'display' && <DisplayLabSection />}
        {activeTab === 'camera' && <CameraProSection />}
        {activeTab === 'battery' && (
          <BatteryTurboSection
            chargeLogs={chargeLogs}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            chargeAlert={chargeAlert}
          />
        )}
        {activeTab === 'gestures' && <GesturesConnectSection />}
      </main>

      {/* Quiet desktop footer */}
      <footer className="hidden md:block border-t border-zinc-200 dark:border-zinc-900 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Edge 50 Pro Companion · Utilidades locales sin conexión</span>
          <span>6.7&quot; pOLED 144 Hz · 125 W TurboPower · 50 MP f/1.4</span>
        </div>
      </footer>

      {/* Offline banner when disconnected */}
      {!isOnline && (
        <div
          role="status"
          className="fixed bottom-16 md:bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white shadow-lg"
        >
          <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Modo sin conexión — Datos guardados en el dispositivo</span>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (56px height, total mobile sticky 48+56=104px < 15% of 844px) */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe"
      >
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] font-medium tracking-tight leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
