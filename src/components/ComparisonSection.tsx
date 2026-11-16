import React from 'react';
import { NetworkWeights, NetworkBiases, TrainingConfig, XORExample, ForwardResult } from '../types/network';
import { CheckCircle2, XCircle, ArrowRight, Download, BarChart, Check, AlertCircle } from 'lucide-react';
import { MathView } from './MathView';

interface ComparisonSectionProps {
  config: TrainingConfig;
  initialWeights: NetworkWeights;
  initialBiases: NetworkBiases;
  finalWeights: NetworkWeights;
  finalBiases: NetworkBiases;
  initialMSE: number;
  finalMSE: number;
  totalEpochs: number;
  totalIterations: number;
  initialEvaluations: { example: XORExample; forward: ForwardResult; correct: boolean }[];
  finalEvaluations: { example: XORExample; forward: ForwardResult; correct: boolean }[];
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  config,
  initialWeights,
  initialBiases,
  finalWeights,
  finalBiases,
  initialMSE,
  finalMSE,
  totalEpochs,
  totalIterations,
  initialEvaluations,
  finalEvaluations,
}) => {
  const isMSEGoalReached = finalMSE <= config.targetMSE;
  const isXORClassified = finalEvaluations.every((e) => e.correct);
  const isMaxEpochsReached = totalEpochs >= config.maxEpochs && !isMSEGoalReached;

  // Parameters diff table data
  const paramDiffs = [
    { label: 'w₁₁ (i₁→h₁)', init: initialWeights.w11, final: finalWeights.w11 },
    { label: 'w₂₁ (i₂→h₁)', init: initialWeights.w21, final: finalWeights.w21 },
    { label: 'w₁₂ (i₁→h₂)', init: initialWeights.w12, final: finalWeights.w12 },
    { label: 'w₂₂ (i₂→h₂)', init: initialWeights.w22, final: finalWeights.w22 },
    { label: 'w_h1o1 (h₁→o₁)', init: initialWeights.wh1, final: finalWeights.wh1 },
    { label: 'w_h2o1 (h₂→o₁)', init: initialWeights.wh2, final: finalWeights.wh2 },
    { label: 'b_h1 (sesgo h₁)', init: initialBiases.bh1, final: finalBiases.bh1 },
    { label: 'b_h2 (sesgo h₂)', init: initialBiases.bh2, final: finalBiases.bh2 },
    { label: 'b_o1 (sesgo o₁)', init: initialBiases.bo1, final: finalBiases.bo1 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm  space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">
            5. Comparación Rigurosa: Estado Inicial vs. Estado Final
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              isXORClassified
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}
          >
            {isXORClassified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> XOR Totalmente Aprendido (4/4)
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-700" /> Aprendizaje Parcial ({finalEvaluations.filter((e) => e.correct).length}/4)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Convergence Criteria Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px]">Criterio 1: MSE Objetivo</span>
            <span className="font-mono text-slate-800">
              Final: {finalMSE.toFixed(6)} ≤ {config.targetMSE}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isMSEGoalReached
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {isMSEGoalReached ? 'ALCANZADO ✓' : 'NO ALCANZADO'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px]">Criterio 2: Clasificación XOR</span>
            <span className="font-mono text-slate-800">
              Umbral: 0.5 (4/4 muestras)
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isXORClassified
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isXORClassified ? 'CORRECTO ✓' : 'INCOMPLETO'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px]">Criterio 3: Límite de Épocas</span>
            <span className="font-mono text-slate-800">
              {totalEpochs.toLocaleString()} / {config.maxEpochs.toLocaleString()}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isMaxEpochsReached
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isMaxEpochsReached ? 'LÍMITE ALCANZADO' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Side-by-Side Cards: Initial vs Final */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= ESTADO INICIAL ================= */}
        <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-sm font-bold text-blue-700">ESTADO INICIAL (Época 0)</span>
            <span className="font-mono text-xs text-slate-500">MSE = {initialMSE.toFixed(6)}</span>
          </div>

          {/* Matrices */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">Matriz W₁ Inicial</span>
              <div className="grid grid-cols-2 gap-1 text-center">
                <span className="text-blue-700">{initialWeights.w11.toFixed(4)}</span>
                <span className="text-blue-700">{initialWeights.w12.toFixed(4)}</span>
                <span className="text-blue-700">{initialWeights.w21.toFixed(4)}</span>
                <span className="text-blue-700">{initialWeights.w22.toFixed(4)}</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">Matriz W₂ Inicial</span>
              <div className="grid grid-cols-2 gap-1 text-center">
                <span className="text-emerald-700">{initialWeights.wh1.toFixed(4)}</span>
                <span className="text-emerald-700">{initialWeights.wh2.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-slate-50/60 rounded border border-slate-200 text-xs font-mono text-slate-700 flex justify-around">
            <span>b_h1: {initialBiases.bh1.toFixed(4)}</span>
            <span>b_h2: {initialBiases.bh2.toFixed(4)}</span>
            <span>b_o1: {initialBiases.bo1.toFixed(4)}</span>
          </div>

          {/* Initial Predictions Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-1.5 px-2">Entrada</th>
                  <th className="py-1.5 px-2 text-center">Target</th>
                  <th className="py-1.5 px-2 text-center">Salida</th>
                  <th className="py-1.5 px-2 text-center">Clasificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {initialEvaluations.map((ev) => (
                  <tr key={ev.example.id} className="hover:bg-slate-50/40">
                    <td className="py-1.5 px-2 text-slate-700">
                      ({ev.example.x1}, {ev.example.x2})
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-900">
                      {ev.example.target}
                    </td>
                    <td className="py-1.5 px-2 text-center text-blue-700">
                      {ev.forward.o1.toFixed(4)}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {ev.correct ? (
                        <span className="text-emerald-700">Correcto ✓</span>
                      ) : (
                        <span className="text-rose-600">Incorrecto ✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= ESTADO FINAL ================= */}
        <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-sm font-bold text-emerald-700">
              ESTADO FINAL (Época {totalEpochs}, Iter {totalIterations})
            </span>
            <span className="font-mono text-xs text-emerald-700 font-bold">
              MSE = {finalMSE.toFixed(6)}
            </span>
          </div>

          {/* Matrices */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">Matriz W₁ Final</span>
              <div className="grid grid-cols-2 gap-1 text-center">
                <span className="text-blue-700">{finalWeights.w11.toFixed(4)}</span>
                <span className="text-blue-700">{finalWeights.w12.toFixed(4)}</span>
                <span className="text-blue-700">{finalWeights.w21.toFixed(4)}</span>
                <span className="text-blue-700">{finalWeights.w22.toFixed(4)}</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">Matriz W₂ Final</span>
              <div className="grid grid-cols-2 gap-1 text-center">
                <span className="text-emerald-700">{finalWeights.wh1.toFixed(4)}</span>
                <span className="text-emerald-700">{finalWeights.wh2.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-slate-50/60 rounded border border-slate-200 text-xs font-mono text-slate-700 flex justify-around">
            <span>b_h1: {finalBiases.bh1.toFixed(4)}</span>
            <span>b_h2: {finalBiases.bh2.toFixed(4)}</span>
            <span>b_o1: {finalBiases.bo1.toFixed(4)}</span>
          </div>

          {/* Final Predictions Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-1.5 px-2">Entrada</th>
                  <th className="py-1.5 px-2 text-center">Target</th>
                  <th className="py-1.5 px-2 text-center">Salida</th>
                  <th className="py-1.5 px-2 text-center">Clasificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {finalEvaluations.map((ev) => (
                  <tr key={ev.example.id} className="hover:bg-slate-50/40">
                    <td className="py-1.5 px-2 text-slate-700">
                      ({ev.example.x1}, {ev.example.x2})
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-900">
                      {ev.example.target}
                    </td>
                    <td className="py-1.5 px-2 text-center text-emerald-700 font-bold">
                      {ev.forward.o1.toFixed(4)}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {ev.correct ? (
                        <span className="text-emerald-700 font-bold">Correcto ✓</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Incorrecto ✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Parameter Variation (Delta) Table */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
          Tabla de Variación Detallada de Parámetros (Δw, Δb)
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
              <tr>
                <th className="py-2 px-3">Parámetro</th>
                <th className="py-2 px-3 text-center">Valor Inicial</th>
                <th className="py-2 px-3 text-center">Valor Final</th>
                <th className="py-2 px-3 text-center">Diferencia (Δ)</th>
                <th className="py-2 px-3 text-center">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {paramDiffs.map((p) => {
                const delta = p.final - p.init;
                return (
                  <tr key={p.label} className="hover:bg-slate-50/40">
                    <td className="py-1.5 px-3 text-slate-700 font-semibold">{p.label}</td>
                    <td className="py-1.5 px-3 text-center text-slate-500">{p.init.toFixed(4)}</td>
                    <td className="py-1.5 px-3 text-center text-blue-700 font-bold">
                      {p.final.toFixed(4)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={delta >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {delta >= 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-center text-[11px] font-sans">
                      {Math.abs(delta) < 1e-4 ? (
                        <span className="text-slate-500">Sin cambio</span>
                      ) : delta > 0 ? (
                        <span className="text-emerald-700">Incrementó ↑</span>
                      ) : (
                        <span className="text-rose-600">Disminuyó ↓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

