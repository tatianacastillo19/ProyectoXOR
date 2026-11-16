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
  NetworkWeights,
  NetworkBiases,
  EpochRecord,
  IterationSnapshot,
} from '../types/network';
import { generateDecisionGrid } from '../lib/math';
import { BarChart2, Activity, Grid, Info, Download, Layers } from 'lucide-react';

interface ChartsSectionProps {
  epochHistory: EpochRecord[];
  iterationHistory: IterationSnapshot[];
  weights: NetworkWeights;
  biases: NetworkBiases;
  targetMSE: number;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  epochHistory,
  iterationHistory,
  weights,
  biases,
  targetMSE,
}) => {
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [resolution, setResolution] = useState<number>(35);

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

  // Real 2D Decision Grid calculated strictly from current network parameters
  const decisionGrid = useMemo(() => {
    return generateDecisionGrid(weights, biases, resolution);
  }, [weights, biases, resolution]);

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

        {/* ================= CHART D: XOR DECISION BOUNDARY ================= */}
        <div className="lg:col-span-2 bg-slate-50/80 rounded-xl p-5 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Gráfica D: Separación de XOR y Frontera de Decisión Real
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Plano cartesiano en espacio continuo [0, 1] × [0, 1] evaluado punto a punto por la red neuronal
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Resolución:</span>
              <div className="inline-flex rounded-lg bg-slate-50 p-0.5 border border-slate-200">
                {[25, 35, 50].map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      resolution === res
                        ? 'bg-blue-100 text-blue-700 font-bold border border-blue-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {res}×{res}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: 2D Plane Visualization (7 cols) */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div className="relative p-2 bg-slate-50/90 rounded-2xl border border-slate-200 shadow-sm">
                <svg
                  viewBox="-30 -30 380 380"
                  className="w-full max-w-[360px] h-auto select-none"
                >
                  <defs>
                    <radialGradient id="xorPointGrad0" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </radialGradient>
                    <radialGradient id="xorPointGrad1" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#16a34a" />
                      <stop offset="100%" stopColor="#166534" />
                    </radialGradient>
                  </defs>

                  {/* Axes */}
                  <line x1="0" y1="300" x2="310" y2="300" stroke="#64748b" strokeWidth="1.5" />
                  <line x1="0" y1="300" x2="0" y2="-10" stroke="#64748b" strokeWidth="1.5" />

                  {/* Grid of predictions */}
                  {(() => {
                    const cellSize = 300 / resolution;
                    return decisionGrid.map((pt, i) => {
                      const px = pt.x1 * 300;
                      // Invert Y for SVG coordinates
                      const py = 300 - pt.x2 * 300;

                      // Color based on continuous sigmoid output (red -> yellow -> green/cyan)
                      // Output is between 0 and 1
                      const val = pt.output;
                      const isClass1 = val >= 0.5;

                      // Color interpolation
                      const r = Math.round((1 - val) * 220);
                      const g = Math.round(val * 200);
                      const b = Math.round(val * 180 + (1 - val) * 40);

                      return (
                        <rect
                          key={i}
                          x={px - cellSize / 2}
                          y={py - cellSize / 2}
                          width={cellSize + 0.5}
                          height={cellSize + 0.5}
                          fill={`rgba(${r}, ${g}, ${b}, 0.55)`}
                        />
                      );
                    });
                  })()}

                  {/* Axis labels */}
                  <text x="315" y="304" fill="#475569" fontSize="11" fontWeight="bold">
                    x₁
                  </text>
                  <text x="-5" y="-15" fill="#475569" fontSize="11" fontWeight="bold">
                    x₂
                  </text>

                  {/* Axis tick labels */}
                  <text x="0" y="318" fill="#64748b" fontSize="10" textAnchor="middle">
                    0
                  </text>
                  <text x="300" y="318" fill="#64748b" fontSize="10" textAnchor="middle">
                    1
                  </text>
                  <text x="-12" y="304" fill="#64748b" fontSize="10" textAnchor="end">
                    0
                  </text>
                  <text x="-12" y="4" fill="#64748b" fontSize="10" textAnchor="end">
                    1
                  </text>

                  {/* 4 XOR Truth Points */}
                  {[
                    { x1: 0, x2: 0, target: 0, label: '(0,0) → 0', px: 0, py: 300 },
                    { x1: 0, x2: 1, target: 1, label: '(0,1) → 1', px: 0, py: 0 },
                    { x1: 1, x2: 0, target: 1, label: '(1,0) → 1', px: 300, py: 300 },
                    { x1: 1, x2: 1, target: 0, label: '(1,1) → 0', px: 300, py: 0 },
                  ].map((pt) => {
                    const is1 = pt.target === 1;
                    return (
                      <g key={pt.label} transform={`translate(${pt.px}, ${pt.py})`}>
                        <circle
                          r="11"
                          fill={is1 ? 'url(#xorPointGrad1)' : 'url(#xorPointGrad0)'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="drop-shadow-sm"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {pt.target}
                        </text>
                        {/* Label tag */}
                        <rect
                          x={pt.px > 150 ? -64 : 14}
                          y={pt.py > 150 ? -24 : 10}
                          width="52"
                          height="18"
                          rx="4"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                        <text
                          x={pt.px > 150 ? -38 : 40}
                          y={pt.py > 150 ? -11 : 23}
                          textAnchor="middle"
                          fill="#0f172a"
                          fontSize="9.5"
                          fontFamily="monospace"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Color legend */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white"></span>
                  <span className="text-slate-700">Clase 0 (y &lt; 0.5)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white"></span>
                  <span className="text-slate-700">Clase 1 (y ≥ 0.5)</span>
                </div>
              </div>
            </div>

            {/* Right: Academic Theory Explanation (5 cols) */}
            <div className="md:col-span-5 space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-slate-200 pb-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>¿Por qué XOR no es linealmente separable?</span>
              </div>
              <p>
                En 1969, <strong>Marvin Minsky y Seymour Papert</strong> demostraron que un perceptrón simple de una sola capa solo es capaz de trazar <em>una única línea recta</em> como hiperplano de decisión.
              </p>
              <p>
                Como se observa en el plano cartesiano, los puntos de la Clase 1: <span className="font-mono text-emerald-700">(0,1)</span> y <span className="font-mono text-emerald-700">(1,0)</span> están ubicados diagonalmente opuestos a los puntos de la Clase 0: <span className="font-mono text-rose-600">(0,0)</span> y <span className="font-mono text-rose-600">(1,1)</span>. No existe ninguna línea recta capaz de aislarlos sin error.
              </p>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                <p className="font-semibold text-indigo-700">Solución con Perceptrón Multicapa (MLP):</p>
                <p className="text-slate-500">
                  Las 2 neuronas de la capa oculta (<span className="font-mono text-blue-700">h₁</span> y <span className="font-mono text-blue-700">h₂</span>) aprenden dos hiperplanos independientes (análogos a las funciones OR y NAND). La neurona de salida (<span className="font-mono text-emerald-700">o₁</span>) combina linealmente esas representaciones intermedias, produciendo la frontera no lineal mostrada arriba.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

