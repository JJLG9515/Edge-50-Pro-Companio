import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateChargeThresholdAlert } from '../utils/deviceLogic';
import { useLocalStorageState } from './useLocalStorageState';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ActiveChargeAlert {
  id: string;
  pct: number;
  thresholdPct: number;
  title: string;
  body: string;
  timestamp: string;
  deliveryChannel: 'system-and-banner' | 'banner-only';
}

function playGentleChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880.0, now + 0.14); // A5
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.48);
  } catch {
    // Ignore Web Audio restrictions when user hasn't interacted yet
  }
}

export function useChargeAlertMonitor() {
  const [alertEnabled, setAlertEnabled] = useLocalStorageState<boolean>(
    'edge50pro:alert-enabled',
    true
  );
  const [thresholdPct, setThresholdPct] = useLocalStorageState<number>(
    'edge50pro:alert-threshold',
    80
  );
  const [soundAndVibrate, setSoundAndVibrate] = useLocalStorageState<boolean>(
    'edge50pro:alert-sound',
    true
  );
  const [lastAlertTime, setLastAlertTime] = useLocalStorageState<string | null>(
    'edge50pro:alert-last',
    null
  );

  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const [activeAlert, setActiveAlert] = useState<ActiveChargeAlert | null>(null);
  const [liveBattery, setLiveBattery] = useState<{ levelPct: number; charging: boolean } | null>(
    null
  );

  const notifiedCycleRef = useRef<boolean>(false);

  const deliverNotification = useCallback(
    async (currentPct: number, targetThreshold: number, source: 'live' | 'simulation' | 'test') => {
      const title = `Batería al ${currentPct}% — Desconecta el cargador`;
      const body =
        source === 'live'
          ? `Tu Motorola Edge 50 Pro alcanzó el umbral de ${targetThreshold}%. Desenchufa el cargador para preservar la celda.`
          : `Aviso de prueba (${targetThreshold}%): así recibirás la alerta al alcanzar ${currentPct}% de carga.`;

      const timeStr = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });

      let systemSent = false;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              await reg.showNotification(title, {
                body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: 'edge50pro-charge-80',
              });
              systemSent = true;
            }
          }
          if (!systemSent) {
            new Notification(title, {
              body,
              icon: '/pwa-192x192.png',
              tag: 'edge50pro-charge-80',
            });
            systemSent = true;
          }
        } catch {
          systemSent = false;
        }
      }

      if (soundAndVibrate) {
        playGentleChime();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([120, 70, 140]);
        }
      }

      setLastAlertTime(timeStr);
      setActiveAlert({
        id: `alert-${Date.now()}`,
        pct: currentPct,
        thresholdPct: targetThreshold,
        title,
        body,
        timestamp: timeStr,
        deliveryChannel: systemSent ? 'system-and-banner' : 'banner-only',
      });
    },
    [setLastAlertTime, soundAndVibrate]
  );

  // Monitor real device battery via Battery Status API when available
  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      }>;
    };

    if (!nav.getBattery) return;

    let batteryObj: Awaited<ReturnType<NonNullable<typeof nav.getBattery>>> | null = null;
    const handleBatteryChange = () => {
      if (!batteryObj) return;
      const pct = Math.round(batteryObj.level * 100);
      const charging = batteryObj.charging;
      setLiveBattery({ levelPct: pct, charging });

      // Skip auto-firing on desktop browsers that perpetually report 100% AC power unless user tests
      const isDesktopFullAc = pct === 100 && !notifiedCycleRef.current;
      if (isDesktopFullAc) {
        return;
      }

      const evaluation = evaluateChargeThresholdAlert({
        enabled: alertEnabled,
        thresholdPct,
        currentPct: pct,
        isCharging: charging,
        alreadyNotifiedForCycle: notifiedCycleRef.current,
      });

      notifiedCycleRef.current = evaluation.nextNotifiedForCycle;
      if (evaluation.shouldNotify) {
        void deliverNotification(pct, thresholdPct, 'live');
      }
    };

    nav
      .getBattery()
      .then((b) => {
        batteryObj = b;
        handleBatteryChange();
        b.addEventListener('levelchange', handleBatteryChange);
        b.addEventListener('chargingchange', handleBatteryChange);
      })
      .catch(() => {
        // Ignore unsupported Battery API
      });

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', handleBatteryChange);
        batteryObj.removeEventListener('chargingchange', handleBatteryChange);
      }
    };
  }, [alertEnabled, deliverNotification, thresholdPct]);

  const requestPermission = async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch {
      return permission;
    }
  };

  const triggerTestAlert = (simulatedPct?: number) => {
    const pctToReport = simulatedPct ?? thresholdPct;
    void deliverNotification(pctToReport, thresholdPct, simulatedPct ? 'simulation' : 'test');
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    alertEnabled,
    setAlertEnabled,
    thresholdPct,
    setThresholdPct,
    soundAndVibrate,
    setSoundAndVibrate,
    permission,
    requestPermission,
    activeAlert,
    dismissAlert,
    triggerTestAlert,
    lastAlertTime,
    liveBattery,
  };
}
