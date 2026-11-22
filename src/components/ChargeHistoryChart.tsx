import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import {
  ChargeLogEntry,
  buildChargeHistoryChartData,
  formatChargeLogsCsv,
  summarizeChargeHabits,
} from '../utils/deviceLogic';

interface ChargeHistoryChartProps {
  chargeLogs: ChargeLogEntry[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: {
      sessionLabel: string;
      createdAt: string;
      startPct: number;
      endPct: number;
      addedPct: number;
      wattage: number;
      durationMin: number;
    };
  }>;
}

const ChargeTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
        {d.sessionLabel} <span className="font-normal text-zinc-500">· {d.createdAt}</span>
      </p>
      <p className="font-mono text-zinc-700 dark:text-zinc-300 tabular-nums">
        Inicio: <span className="font-semibold">{d.startPct}%</span> → Fin:{' '}
        <span className="font-semibold">{d.endPct}%</span> (+{d.addedPct}%)
      </p>
      <p className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
        {d.wattage} W · {d.durationMin} min
      </p>
    </div>
  );
};

export const ChargeHistoryChart: React.FC<ChargeHistoryChartProps> = ({ chargeLogs }) => {
  const data = buildChargeHistoryChartData(chargeLogs);
  const summary = summarizeChargeHabits(chargeLogs);

  const handleExportCsv = () => {
    if (chargeLogs.length === 0) return;
    const csv = formatChargeLogsCsv(chargeLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historial-cargas-edge50pro.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-labelledby="charge-habits-chart-heading"
      className="rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="charge-habits-chart-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Historial y Hábitos de Carga
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Compara el nivel inicial (startPct) y final (endPct) de cada sesión respecto al umbral óptimo del 80%.
            </p>
          </div>
        </div>

        {summary.totalSessions > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div
              data-testid="charge-habit-metrics"
              className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300 font-mono tabular-nums"
            >
              <span>Inicio medio: {summary.avgStartPct}%</span>
              <span aria-hidden="true">·</span>
              <span>Fin medio: {summary.avgEndPct}%</span>
              <span aria-hidden="true">·</span>
              <span>
                Sobre 80%: {summary.sessionsOver80Count}/{summary.totalSessions}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-indigo-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Exportar CSV</span>
            </button>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Sin datos suficientes para graficar
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Registra al menos una sesión en &quot;Registro de Cargas&quot; para visualizar tus hábitos de inicio y fin.
          </p>
        </div>
      ) : (
        <div data-testid="charge-history-chart" className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 14, right: 16, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.22)" vertical={false} />
              <XAxis
                dataKey="sessionLabel"
                tick={{ fontSize: 12, fill: '#71717A' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#71717A' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChargeTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                formatter={(value) => (value === 'startPct' ? 'Inicio (startPct)' : 'Fin (endPct)')}
              />
              <ReferenceLine
                y={80}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: 'Óptimo 80%',
                  position: 'insideTopRight',
                  fill: '#10B981',
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={20}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{
                  value: 'Mín. 20%',
                  position: 'insideBottomRight',
                  fill: '#F59E0B',
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="startPct"
                name="startPct"
                fill="#94A3B8"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="endPct"
                name="endPct"
                fill="#4F46E5"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
