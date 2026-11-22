export type TabId = 'overview' | 'display' | 'camera' | 'battery' | 'gestures';

export interface SetupTask {
  id: string;
  title: string;
  detail: string;
  targetTab: TabId;
  category: string;
}

export interface CameraLensSpec {
  id: 'main_50mp' | 'tele_10mp_3x' | 'uw_macro_13mp';
  name: string;
  shortName: string;
  megapixels: string;
  focalLengthMm: number;
  aperture: string;
  ois: boolean;
  fov: string;
  minFocus: string;
  bestFor: string;
}

export interface MotoGestureItem {
  id: string;
  name: string;
  trigger: string;
  action: string;
  vibrationPattern: number[];
  hint: string;
}

export interface SmartConnectMode {
  id: string;
  title: string;
  requirement: string;
  summary: string;
  steps: string[];
}

export const HERO_IMAGE_PATH = '/src/assets/images/edge_hero_device_1795368874148.jpg';

export const HARDWARE_METRICS = [
  {
    label: 'Pantalla pOLED',
    value: '6.7" · 144 Hz',
    sub: '2712 × 1220 · Pantone Validated',
  },
  {
    label: 'Carga TurboPower',
    value: '125 W / 50 W',
    sub: '4500 mAh · 0–100% en ~18 min',
  },
  {
    label: 'Cámara Principal',
    value: '50 MP f/1.4',
    sub: 'OIS + Tele 3x + Macro 13 MP',
  },
  {
    label: 'Procesador y RAM',
    value: 'SD 7 Gen 3',
    sub: '12 GB LPDDR4X · IP68 · Dolby Atmos',
  },
];

export const INITIAL_SETUP_TASKS: SetupTask[] = [
  {
    id: 'hz-144',
    title: 'Configurar frecuencia de actualización en 144 Hz o Automático',
    detail: 'Ajustes > Pantalla > Frecuencia de actualización de pantalla.',
    targetTab: 'display',
    category: 'Pantalla',
  },
  {
    id: 'pantone-color',
    title: 'Calibrar perfil de color Pantone Natural',
    detail: 'Ajustes > Pantalla > Colores > Natural para fidelidad Pantone SkinTone.',
    targetTab: 'display',
    category: 'Pantalla',
  },
  {
    id: 'edge-lights',
    title: 'Personalizar Luces de Borde (Edge Lights)',
    detail: 'App Moto > Pantalla > Luces de borde para llamadas y notificaciones.',
    targetTab: 'display',
    category: 'Pantalla',
  },
  {
    id: 'charge-protect',
    title: 'Activar Protección de carga y Carga optimizada',
    detail: 'Ajustes > Batería > Limita al 80% durante ciclos prolongados nocturnos.',
    targetTab: 'battery',
    category: 'Batería',
  },
  {
    id: 'camera-raw',
    title: 'Habilitar cuadrícula y nivelador en Modo Pro',
    detail: 'Cámara > Configuración > Cuadrícula de asistencia y Nivelador.',
    targetTab: 'camera',
    category: 'Cámara',
  },
  {
    id: 'moto-gestures',
    title: 'Verificar Gestos Moto (Linterna y Cámara rápida)',
    detail: 'App Moto > Gestos > Activar Linterna rápida y Captura rápida.',
    targetTab: 'gestures',
    category: 'Gestos',
  },
  {
    id: 'smart-connect',
    title: 'Emparejar Smart Connect con PC o televisor',
    detail: 'Centro de control > Smart Connect mediante Wi-Fi o cable USB-C 3.1.',
    targetTab: 'gestures',
    category: 'Conectividad',
  },
];

export const CAMERA_LENSES: CameraLensSpec[] = [
  {
    id: 'main_50mp',
    name: '50 MP Sensor Principal',
    shortName: '1x · 24 mm',
    megapixels: '50 MP',
    focalLengthMm: 24,
    aperture: 'f/1.4',
    ois: true,
    fov: '84°',
    minFocus: '12 cm',
    bestFor: 'Baja luz extrema, bokeh óptico natural y video 4K estabilizado.',
  },
  {
    id: 'tele_10mp_3x',
    name: '10 MP Teleobjetivo 3x',
    shortName: '3x · 73 mm',
    megapixels: '10 MP',
    focalLengthMm: 73,
    aperture: 'f/2.0',
    ois: true,
    fov: '33°',
    minFocus: '35 cm',
    bestFor: 'Retratos sin distorsión facial y detalle arquitectónico a distancia.',
  },
  {
    id: 'uw_macro_13mp',
    name: '13 MP Ultra Gran Angular + Macro',
    shortName: '0.5x · 13 mm',
    megapixels: '13 MP',
    focalLengthMm: 13,
    aperture: 'f/2.2',
    ois: false,
    fov: '120°',
    minFocus: '3 cm',
    bestFor: 'Paisajes amplios, interiores y fotografía Macro Vision a 3 cm.',
  },
];

export const MOTO_GESTURES: MotoGestureItem[] = [
  {
    id: 'fast-flashlight',
    name: 'Linterna rápida',
    trigger: 'Agitar dos veces hacia abajo',
    action: 'Enciende o apaga el flash LED trasero al instante sin desbloquear.',
    vibrationPattern: [45, 55, 45],
    hint: 'Movimiento firme tipo golpe de muñeca hacia abajo dos veces seguidas.',
  },
  {
    id: 'quick-capture',
    name: 'Cámara rápida',
    trigger: 'Girar la muñeca dos veces',
    action: 'Abre la cámara principal al instante; gira de nuevo para alternar a selfie 50 MP.',
    vibrationPattern: [35, 45, 70],
    hint: 'Rota la muñeca rápidamente de izquierda a derecha dos veces.',
  },
  {
    id: 'three-finger-shot',
    name: 'Captura con tres dedos',
    trigger: 'Mantener tres dedos en pantalla',
    action: 'Guarda captura de pantalla instantánea con opción de captura extendida.',
    vibrationPattern: [50],
    hint: 'Toca la pantalla simultáneamente con tres yemas durante medio segundo.',
  },
  {
    id: 'flip-dnd',
    name: 'Voltear para No Molestar',
    trigger: 'Colocar pantalla hacia abajo',
    action: 'Silencia notificaciones y llamadas entrantes automáticamente en reuniones.',
    vibrationPattern: [30, 80, 30],
    hint: 'Apoya el panel pOLED sobre una superficie plana.',
  },
];

export const SMART_CONNECT_MODES: SmartConnectMode[] = [
  {
    id: 'mobile-desktop',
    title: 'Escritorio Móvil en Monitor o TV',
    requirement: 'Cable USB-C 3.1 (DisplayPort) o Miracast Wi-Fi',
    summary: 'Convierte tu Edge 50 Pro en un entorno multiventana completo con barra de tareas.',
    steps: [
      'Conecta el cable USB-C a HDMI/DisplayPort o pulsa Smart Connect en ajustes rápidos.',
      'Elige Modo Escritorio para abrir aplicaciones Android en ventanas redimensionables.',
      'Usa la pantalla del teléfono como panel táctil o vincula teclado y ratón Bluetooth.',
    ],
  },
  {
    id: 'webcam-fhd',
    title: 'Cámara Web Pro 50 MP en PC',
    requirement: 'App Smart Connect en Windows 10/11 + misma red Wi-Fi',
    summary: 'Aprovecha la apertura f/1.4 y el seguimiento de sujeto para videollamadas nítidas.',
    steps: [
      'Abre Smart Connect en Windows y selecciona Cámara Web.',
      'Elige lente Principal 50 MP o Ultra Gran Angular y activa seguimiento de rostro.',
      'Selecciona "Motorola Camera" dentro de Meet, Zoom o Teams.',
    ],
  },
  {
    id: 'cross-control',
    title: 'Control Cruzado y Portapapeles',
    requirement: 'Emparejamiento QR único entre móvil y PC/Tablet',
    summary: 'Copia texto o arrastra fotos de 50 MP directo al escritorio sin cables.',
    steps: [
      'Escanea el código QR desde la app Smart Connect del Edge 50 Pro.',
      'Activa "Portapapeles compartido" en preferencias de sincronización.',
      'Arrastra archivos desde la galería o copia enlaces directamente al PC.',
    ],
  },
];
