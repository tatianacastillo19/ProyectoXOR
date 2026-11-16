import React, { useState } from 'react';
import {
  XORExample,
  NetworkWeights,
  NetworkBiases,
  TrainingConfig,
  TrainingOrderType,
  ForwardResult,
} from '../types/network';
import {
  XOR_DATASET,
  ORIGINAL_ORDER,
  PDF_DEMO_ORDER,
  DEFAULT_LEARNING_RATE,
  DEFAULT_TARGET_MSE,
  DEFAULT_MAX_EPOCHS,
} from '../lib/math';
import { Settings, Sliders, RefreshCw, Layers, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface ConfigurationSectionProps {
  config: TrainingConfig;
  onConfigChange: (newConfig: TrainingConfig) => void;
  weights: NetworkWeights;
  biases: NetworkBiases;
  initialWeights: NetworkWeights;
  initialBiases: NetworkBiases;
  onResetWeights: () => void;
  onUpdateInitialParams: (weights: NetworkWeights, biases: NetworkBiases) => void;
  currentExample?: XORExample | null;
  evaluations?: { example: XORExample; forward: ForwardResult; correct: boolean }[];
  isTraining: boolean;
}

type ParamDraft = {
  w11: string;
  w21: string;
  w12: string;
  w22: string;
  wh1: string;
  wh2: string;
  bh1: string;
  bh2: string;
  bo1: string;
};

const toDraft = (w: NetworkWeights, b: NetworkBiases): ParamDraft => ({
  w11: String(w.w11),
  w21: String(w.w21),
  w12: String(w.w12),
  w22: String(w.w22),
  wh1: String(w.wh1),
  wh2: String(w.wh2),
  bh1: String(b.bh1),
  bh2: String(b.bh2),
  bo1: String(b.bo1),
});

const ParamInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  accent: string;
}> = ({ label, value, onChange, accent }) => (
  <label className="block">
    <span className={`text-[10px] ${accent}`}>{label}</span>
    <input
      type="number"
      step="0.01"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-center font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  </label>
);

export const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({
  config,
  onConfigChange,
  weights,
  biases,
  initialWeights,
  initialBiases,
  onResetWeights,
  onUpdateInitialParams,
  currentExample,
  evaluations,
  isTraining,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [draft, setDraft] = useState<ParamDraft>(() => toDraft(initialWeights, initialBiases));

  const handleToggleAdvanced = () => {
    if (!showAdvanced) {
      setDraft(toDraft(initialWeights, initialBiases));
    }
    setShowAdvanced(!showAdvanced);
  };

  const handleApplyInitialParams = () => {
    const toNumber = (value: string, fallback: number) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const newWeights: NetworkWeights = {
      w11: toNumber(draft.w11, initialWeights.w11),
      w21: toNumber(draft.w21, initialWeights.w21),
      w12: toNumber(draft.w12, initialWeights.w12),
      w22: toNumber(draft.w22, initialWeights.w22),
      wh1: toNumber(draft.wh1, initialWeights.wh1),
      wh2: toNumber(draft.wh2, initialWeights.wh2),
    };
    const newBiases: NetworkBiases = {
      bh1: toNumber(draft.bh1, initialBiases.bh1),
      bh2: toNumber(draft.bh2, initialBiases.bh2),
      bo1: toNumber(draft.bo1, initialBiases.bo1),
    };

    onUpdateInitialParams(newWeights, newBiases);
    setDraft(toDraft(newWeights, newBiases));
  };

  const activeOrder = config.orderType === 'original' ? ORIGINAL_ORDER : PDF_DEMO_ORDER;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">
            1. Configuración, Dataset XOR e Hiperparámetros
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAdvanced}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors border border-slate-200"
          >
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            {showAdvanced ? 'Ocultar Parámetros Iniciales' : 'Editar Parámetros Iniciales'}
          </button>
          <button
            onClick={onResetWeights}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/60 hover:bg-blue-100/80 text-xs font-semibold text-blue-700 border border-blue-200 transition-colors disabled:opacity-50"
            title="Restaurar pesos, sesgos y tasa de aprendizaje originales del profesor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Valores del Profesor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Dataset Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">
              Conjunto de Entrenamiento XOR (Verdad Lógica)
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Orden de época:</span>
              <div className="inline-flex rounded-lg bg-slate-50 p-0.5 border border-slate-200">
                <button
                  onClick={() => onConfigChange({ ...config, orderType: 'original' })}
                  disabled={isTraining}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    config.orderType === 'original'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Original (e1→e2→e3→e4)
                </button>
              </div>
            </div>
          </div>

          {/* Visual Sequence of active order */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/70 border border-slate-200/80 text-xs">
            <span className="text-slate-500 font-medium">Secuencia de Época:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeOrder.map((ex, idx) => {
                const isCurrent = currentExample?.id === ex.id;
                return (
                  <React.Fragment key={ex.id}>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono font-semibold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-sm scale-105'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {ex.id} ({ex.x1},{ex.x2})→{ex.target}
                    </span>
                    {idx < activeOrder.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Dataset Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ejemplo</th>
                  <th className="py-2.5 px-3 text-center">i₁</th>
                  <th className="py-2.5 px-3 text-center">i₂</th>
                  <th className="py-2.5 px-3 text-center">Salida Esperada (t)</th>
                  <th className="py-2.5 px-3 text-center">Salida Red (y)</th>
                  <th className="py-2.5 px-3 text-center">Error (t - y)</th>
                  <th className="py-2.5 px-3 text-center">Clasificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-mono">
                {activeOrder.map((ex) => {
                  const evalData = evaluations?.find((e) => e.example.id === ex.id);
                  const isCurrent = currentExample?.id === ex.id;
                  const output = evalData?.forward.o1;
                  const error = evalData?.forward.error;
                  const isCorrect = evalData?.correct;

                  return (
                    <tr
                      key={ex.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 border-l-4 border-l-blue-500 font-semibold'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-800">
                        <span className="flex items-center gap-1.5">
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 "></span>
                          )}
                          <span className={isCurrent ? 'text-blue-700 font-bold' : ''}>
                            {ex.id}
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">{ex.x1}</td>
                      <td className="py-2 px-3 text-center text-slate-700">{ex.x2}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                        {ex.target}
                      </td>
                      <td className="py-2 px-3 text-center text-blue-700">
                        {output !== undefined ? output.toFixed(4) : '—'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {error !== undefined ? (
                          <span
                            className={
                              Math.abs(error) < 0.2 ? 'text-emerald-700' : 'text-rose-600'
                            }
                          >
                            {error.toFixed(4)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isCorrect !== undefined ? (
                          isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-sans">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correcto
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-sans">
                              <XCircle className="w-3.5 h-3.5" /> Incorrecto
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 font-sans">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Hyperparameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
            <span className="text-sm font-semibold text-slate-800 block">
              Parámetros de Aprendizaje
            </span>

            {/* Learning Rate */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-700">Tasa de Aprendizaje (α):</span>
                <span className="font-mono text-blue-700 font-bold">
                  {config.learningRate}
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={config.learningRate}
                disabled={isTraining}
                onChange={(e) =>
                  onConfigChange({ ...config, learningRate: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-600 bg-slate-100 rounded-lg h-2 cursor-pointer disabled:opacity-50"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Valor del profesor: 0.25
              </span>
            </div>

            {/* Target MSE */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-700">MSE Objetivo de Parada:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {config.targetMSE}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0.05, 0.01, 0.005].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onConfigChange({ ...config, targetMSE: val })}
                    disabled={isTraining}
                    className={`py-1 text-xs rounded border transition-colors ${
                      config.targetMSE === val
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Epochs */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-700">Máximo de Épocas:</span>
                <span className="font-mono text-indigo-700 font-bold">
                  {config.maxEpochs.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[10000, 50000, 100000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onConfigChange({ ...config, maxEpochs: val })}
                    disabled={isTraining}
                    className={`py-1 text-xs rounded border transition-colors ${
                      config.maxEpochs === val
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Classification Threshold Info */}
            <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
              <span>Umbral de decisión booleana:</span>
              <span className="font-mono text-slate-800 font-semibold">y ≥ 0.5 → 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Collapsible: Edit Initial Weights & Biases */}
      {showAdvanced && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-700">
                Matrices y Sesgos Iniciales
              </span>
              <p className="text-[11px] text-slate-500">
                Edita los valores y pulsa Aplicar. El entrenamiento se reiniciará con ellos.
              </p>
            </div>
            <button
              onClick={handleApplyInitialParams}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aplicar y Reiniciar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* W1 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1 text-[11px]">Matriz W₁ (2×2)</span>
              <div className="grid grid-cols-2 gap-2">
                <ParamInput
                  label="w₁₁ (i₁→h₁)"
                  value={draft.w11}
                  onChange={(v) => setDraft({ ...draft, w11: v })}
                  accent="text-blue-700"
                />
                <ParamInput
                  label="w₁₂ (i₁→h₂)"
                  value={draft.w12}
                  onChange={(v) => setDraft({ ...draft, w12: v })}
                  accent="text-blue-700"
                />
                <ParamInput
                  label="w₂₁ (i₂→h₁)"
                  value={draft.w21}
                  onChange={(v) => setDraft({ ...draft, w21: v })}
                  accent="text-blue-700"
                />
                <ParamInput
                  label="w₂₂ (i₂→h₂)"
                  value={draft.w22}
                  onChange={(v) => setDraft({ ...draft, w22: v })}
                  accent="text-blue-700"
                />
              </div>
            </div>

            {/* W2 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1 text-[11px]">Matriz W₂ (2×1)</span>
              <div className="grid grid-cols-2 gap-2">
                <ParamInput
                  label="w_h1o1 (h₁→o₁)"
                  value={draft.wh1}
                  onChange={(v) => setDraft({ ...draft, wh1: v })}
                  accent="text-emerald-700"
                />
                <ParamInput
                  label="w_h2o1 (h₂→o₁)"
                  value={draft.wh2}
                  onChange={(v) => setDraft({ ...draft, wh2: v })}
                  accent="text-emerald-700"
                />
              </div>
            </div>

            {/* Biases */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1 text-[11px]">Sesgos Iniciales</span>
              <div className="grid grid-cols-3 gap-1.5">
                <ParamInput
                  label="b_h1"
                  value={draft.bh1}
                  onChange={(v) => setDraft({ ...draft, bh1: v })}
                  accent="text-indigo-700"
                />
                <ParamInput
                  label="b_h2"
                  value={draft.bh2}
                  onChange={(v) => setDraft({ ...draft, bh2: v })}
                  accent="text-indigo-700"
                />
                <ParamInput
                  label="b_o1"
                  value={draft.bo1}
                  onChange={(v) => setDraft({ ...draft, bo1: v })}
                  accent="text-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

