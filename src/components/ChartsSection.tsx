import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  EpochRecord,
  IterationSnapshot,
} from '../types/network';
import { BarChart2 } from 'lucide-react';

interface ChartsSectionProps {
  epochHistory: EpochRecord[];
  iterationHistory: IterationSnapshot[];
  targetMSE: number;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  epochHistory,
  iterationHistory,
  targetMSE,
}) => {
  const [selectedWeight, setSelectedWeight] = useState<string>('all');

  // Format data for MSE chart (sample down if too many epochs to maintain high performance)
  const mseChartData = useMemo(() => {
    if (epochHistory.length === 0) return [];

    const maxPoints = 250;
    if (epochHistory.length <= maxPoints) {
      return epochHistory.map((e) => ({
        epoch: e.epoch,
        mse: parseFloat(e.mse.toFixed(6)),
      }));
    }

    const step = Math.ceil(epochHistory.length / maxPoints);
    const sampled = [];
    for (let i = 0; i < epochHistory.length; i += step) {
      sampled.push({
        epoch: epochHistory[i].epoch,
        mse: parseFloat(epochHistory[i].mse.toFixed(6)),
      });
    }
    // ensure last is included
    const last = epochHistory[epochHistory.length - 1];
    if (sampled[sampled.length - 1].epoch !== last.epoch) {
      sampled.push({ epoch: last.epoch, mse: parseFloat(last.mse.toFixed(6)) });
    }
    return sampled;
  }, [epochHistory]);

  // Format data for weights evolution chart
  const weightsChartData = useMemo(() => {
    if (epochHistory.length === 0) {
      // If only iterations completed so far, use iteration history
      if (iterationHistory.length === 0) return [];
      return iterationHistory.map((h) => ({
        step: h.iteration,
        w11: parseFloat(h.weightsAfter.w11.toFixed(4)),
        w21: parseFloat(h.weightsAfter.w21.toFixed(4)),
        w12: parseFloat(h.weightsAfter.w12.toFixed(4)),
        w22: parseFloat(h.weightsAfter.w22.toFixed(4)),
        wh1: parseFloat(h.weightsAfter.wh1.toFixed(4)),
        wh2: parseFloat(h.weightsAfter.wh2.toFixed(4)),
      }));
    }

    const maxPoints = 250;
    const step = Math.max(1, Math.floor(epochHistory.length / maxPoints));
    const sampled = [];

    for (let i = 0; i < epochHistory.length; i += step) {
      const e = epochHistory[i];
      sampled.push({
        step: e.epoch,
        w11: parseFloat(e.weights.w11.toFixed(4)),
        w21: parseFloat(e.weights.w21.toFixed(4)),
        w12: parseFloat(e.weights.w12.toFixed(4)),
        w22: parseFloat(e.weights.w22.toFixed(4)),
        wh1: parseFloat(e.weights.wh1.toFixed(4)),
        wh2: parseFloat(e.weights.wh2.toFixed(4)),
      });
    }

    const last = epochHistory[epochHistory.length - 1];
    if (sampled.length > 0 && sampled[sampled.length - 1].step !== last.epoch) {
      sampled.push({
        step: last.epoch,
        w11: parseFloat(last.weights.w11.toFixed(4)),
        w21: parseFloat(last.weights.w21.toFixed(4)),
        w12: parseFloat(last.weights.w12.toFixed(4)),
        w22: parseFloat(last.weights.w22.toFixed(4)),
        wh1: parseFloat(last.weights.wh1.toFixed(4)),
        wh2: parseFloat(last.weights.wh2.toFixed(4)),
      });
    }

    return sampled;
  }, [epochHistory, iterationHistory]);

  const initialMSE = epochHistory.length > 0 ? epochHistory[0].mse : iterationHistory.length > 0 ? iterationHistory[0].globalMSEBefore : 0;
  const currentMSE = epochHistory.length > 0 ? epochHistory[epochHistory.length - 1].mse : iterationHistory.length > 0 ? iterationHistory[iterationHistory.length - 1].globalMSEAfter : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm  space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">
            4. Gráficas y Visualizaciones de Aprendizaje
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            MSE Inicial: <strong className="font-mono text-slate-800">{initialMSE.toFixed(6)}</strong>
          </span>
          <span className="text-slate-500">
            MSE Actual: <strong className="font-mono text-emerald-700">{currentMSE.toFixed(6)}</strong>
          </span>
        </div>
      </div>

      {/* Grid of Charts: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= CHART B: MSE EVOLUTION ================= */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Gráfica B: Evolución del Error Cuadrático Medio (MSE)
              </h3>
              <p className="text-[11px] text-slate-500">
                Convergencia de la función de coste por épocas hacia el umbral ({targetMSE})
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
              {epochHistory.length} Épocas
            </span>
          </div>

          <div className="h-64 w-full">
            {mseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mseChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="epoch"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `${val}`}
                  />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                    labelStyle={{ color: '#475569' }}
                  />
                  <ReferenceLine
                    y={targetMSE}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Meta: ${targetMSE}`,
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mse"
                    name="MSE Global"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Inicia el entrenamiento para visualizar la curva del MSE por época.
              </div>
            )}
          </div>
        </div>

        {/* ================= CHART C: WEIGHTS EVOLUTION ================= */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Gráfica C: Evolución de los Pesos Sinápticos
              </h3>
              <p className="text-[11px] text-slate-500">
                Trayectoria de los 6 pesos de la red durante el aprendizaje
              </p>
            </div>
            {/* Filter pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'w11', 'w21', 'w12', 'w22', 'wh1', 'wh2'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedWeight(key)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    selectedWeight === key
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200'
                  }`}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            {weightsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightsChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="step" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

                  {(selectedWeight === 'all' || selectedWeight === 'w11') && (
                    <Line type="monotone" dataKey="w11" name="w₁₁" stroke="#2563eb" strokeWidth={1.8} dot={false} />
                  )}
                  {(selectedWeight === 'all' || selectedWeight === 'w21') && (
                    <Line type="monotone" dataKey="w21" name="w₂₁" stroke="#4f46e5" strokeWidth={1.8} dot={false} />
                  )}
                  {(selectedWeight === 'all' || selectedWeight === 'w12') && (
                    <Line type="monotone" dataKey="w12" name="w₁₂" stroke="#7c3aed" strokeWidth={1.8} dot={false} />
                  )}
                  {(selectedWeight === 'all' || selectedWeight === 'w22') && (
                    <Line type="monotone" dataKey="w22" name="w₂₂" stroke="#db2777" strokeWidth={1.8} dot={false} />
                  )}
                  {(selectedWeight === 'all' || selectedWeight === 'wh1') && (
                    <Line type="monotone" dataKey="wh1" name="w_h1o1" stroke="#10b981" strokeWidth={2.2} dot={false} />
                  )}
                  {(selectedWeight === 'all' || selectedWeight === 'wh2') && (
                    <Line type="monotone" dataKey="wh2" name="w_h2o1" stroke="#d97706" strokeWidth={2.2} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Inicia el entrenamiento para observar cómo cambian los pesos.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
