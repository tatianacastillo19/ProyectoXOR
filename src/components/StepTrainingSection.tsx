import React, { useState } from 'react';
import {
  XORExample,
  StepSubPhase,
  IterationSnapshot,
  NetworkWeights,
  NetworkBiases,
  ForwardResult,
  BackpropResult,
} from '../types/network';
import { MathView } from './MathView';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FastForward,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sigma,
  Layers,
  History,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface StepTrainingSectionProps {
  currentIteration: number;
  currentEpoch: number;
  currentExample: XORExample;
  subPhase: StepSubPhase;
  weights: NetworkWeights;
  biases: NetworkBiases;
  forwardResult: ForwardResult;
  backpropResult: BackpropResult;
  learningRate: number;
  history: IterationSnapshot[];
  isTraining: boolean;
  trainingSpeed: 'slow' | 'medium' | 'fast' | 'ultra';
  onSpeedChange: (speed: 'slow' | 'medium' | 'fast' | 'ultra') => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onNextIteration: () => void;
  onStartAutoTraining: () => void;
  onPauseAutoTraining: () => void;
  onReset: () => void;
  onSelectHistoricalState?: (snapshot: IterationSnapshot) => void;
}

const STEP_PHASES: { id: StepSubPhase; label: string; short: string }[] = [
  { id: 'input_selection', label: '1. Entrada', short: 'Entrada' },
  { id: 'calc_h1', label: '2. Capa Oculta h₁', short: 'h₁' },
  { id: 'calc_h2', label: '3. Capa Oculta h₂', short: 'h₂' },
  { id: 'calc_o1', label: '4. Capa Salida o₁', short: 'o₁' },
  { id: 'calc_error', label: '5. Cálculo Error', short: 'Error' },
  { id: 'delta_output', label: '6. Delta Salida δ_o1', short: 'δ_o1' },
  { id: 'delta_hidden', label: '7. Deltas Ocultos δ_h', short: 'δ_h' },
  { id: 'update_params', label: '8. Actualización', short: 'Actualizar' },
  { id: 'new_state', label: '9. Estado Sucesor', short: 'Sucesor' },
];

export const StepTrainingSection: React.FC<StepTrainingSectionProps> = ({
  currentIteration,
  currentEpoch,
  currentExample,
  subPhase,
  weights,
  biases,
  forwardResult,
  backpropResult,
  learningRate,
  history,
  isTraining,
  trainingSpeed,
  onSpeedChange,
  onNextStep,
  onPrevStep,
  onNextIteration,
  onStartAutoTraining,
  onPauseAutoTraining,
  onReset,
  onSelectHistoricalState,
}) => {
  const [showMatrixView, setShowMatrixView] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  const currentPhaseIndex = STEP_PHASES.findIndex((p) => p.id === subPhase);

  // Pagination for history table
  const itemsPerPage = 8;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentHistorySlice = history
    .slice()
    .reverse()
    .slice(historyPage * itemsPerPage, (historyPage + 1) * itemsPerPage);

  const { x1, x2, target, zh1, h1, zh2, h2, zo1, o1, error, squaredError } = forwardResult;
  const { deltaO1, deltaH1, deltaH2, oldWh1, oldWh2, weightDeltas, biasDeltas } = backpropResult;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm  space-y-5">
      {/* Header and Master Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">
              3. Entrenamiento Paso a Paso y Procedimiento Matemático
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Iteración: <span className="font-mono text-blue-700 font-bold">{currentIteration}</span> | Época:{' '}
            <span className="font-mono text-indigo-700 font-bold">{currentEpoch}</span> | Ejemplo actual:{' '}
            <span className="font-mono text-emerald-700 font-bold">
              {currentExample.id} ({x1}, {x2}) → {target}
            </span>
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Previous Step */}
          <button
            onClick={onPrevStep}
            disabled={isTraining || (currentIteration === 1 && currentPhaseIndex === 0)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-200 disabled:opacity-40 transition-colors"
            title="Volver al micro-paso anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
            Anterior
          </button>

          {/* Next Step */}
          <button
            onClick={onNextStep}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors shadow-sm disabled:opacity-40"
            title="Avanzar al siguiente cálculo matemático"
          >
            <StepForward className="w-4 h-4" />
            Siguiente Paso
          </button>

          {/* Next Iteration */}
          <button
            onClick={onNextIteration}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors border border-indigo-300 disabled:opacity-40"
            title="Procesar completamente este ejemplo y avanzar al siguiente"
          >
            <FastForward className="w-4 h-4" />
            Siguiente Iteración
          </button>

          {/* Auto Train / Pause */}
          {isTraining ? (
            <button
              onClick={onPauseAutoTraining}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors shadow-sm "
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
          ) : (
            <button
              onClick={onStartAutoTraining}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              Entrenar Automáticamente
            </button>
          )}

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-rose-600 border border-slate-200 transition-colors disabled:opacity-40"
            title="Reiniciar entrenamiento e historial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 text-[11px] mr-1">Velocidad:</span>
            {(['slow', 'medium', 'fast', 'ultra'] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  trainingSpeed === spd
                    ? 'bg-blue-100 text-blue-700 font-bold border border-blue-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {spd === 'slow' ? '1x' : spd === 'medium' ? '5x' : spd === 'fast' ? '20x' : 'Max'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Micro-Step Progress Stepper (1 to 9) */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center justify-between min-w-[700px] gap-1">
          {STEP_PHASES.map((phase, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;

            return (
              <div key={phase.id} className="flex-1 flex items-center">
                <div
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs transition-all border ${
                    isCurrent
                      ? 'bg-blue-100 text-blue-700 border-blue-500 font-bold shadow-sm scale-102'
                      : isCompleted
                      ? 'bg-slate-50/80 text-slate-700 border-slate-200/60'
                      : 'bg-slate-50/40 text-slate-500 border-slate-200/40'
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-normal">
                    Paso {idx + 1}
                  </span>
                  <span className="truncate block font-mono">{phase.short}</span>
                </div>
                {idx < STEP_PHASES.length - 1 && (
                  <div
                    className={`w-2 h-0.5 mx-0.5 ${
                      idx < currentPhaseIndex ? 'bg-blue-600' : 'bg-slate-100'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mathematical Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Math Detail Panel (8 cols) */}
        <div className="lg:col-span-8 bg-slate-50/80 rounded-xl p-5 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sigma className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Operaciones Matemáticas: {STEP_PHASES[currentPhaseIndex].label}
              </h3>
            </div>
            <button
              onClick={() => setShowMatrixView(!showMatrixView)}
              className="text-xs px-2.5 py-1 rounded bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              {showMatrixView ? 'Ver Fórmulas Escalares' : 'Ver Notación Matricial'}
            </button>
          </div>

          {/* Matrix view toggle */}
          {showMatrixView ? (
            <div className="space-y-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs font-mono">
              <span className="text-slate-500 font-bold block mb-1">
                Formulación Matricial Compacta del Forward Pass:
              </span>
              <MathView
                math="H = \sigma(X \cdot W_1 + B_1) = \sigma\left(\begin{bmatrix} x_1 & x_2 \end{bmatrix} \begin{bmatrix} w_{11} & w_{12} \\ w_{21} & w_{22} \end{bmatrix} + \begin{bmatrix} b_{h1} & b_{h2} \end{bmatrix}\right)"
                block
              />
              <MathView
                math="O = \sigma(H \cdot W_2 + B_2) = \sigma\left(\begin{bmatrix} h_1 & h_2 \end{bmatrix} \begin{bmatrix} w_{h1o1} \\ w_{h2o1} \end{bmatrix} + \begin{bmatrix} b_{o1} \end{bmatrix}\right)"
                block
              />
              <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-2 space-y-1">
                <p className="text-slate-700">
                  <span className="text-slate-500">Vector de entrada X:</span> [{x1}, {x2}]
                </p>
                <p className="text-slate-700">
                  <span className="text-slate-500">Vector oculto H:</span> [{h1.toFixed(4)},{' '}
                  {h2.toFixed(4)}]
                </p>
                <p className="text-slate-700">
                  <span className="text-slate-500">Vector de salida O:</span> [{o1.toFixed(4)}]
                </p>
              </div>
            </div>
          ) : (
            /* Scalar detailed view according to subPhase */
            <div className="space-y-4 text-xs">
              {/* STEP 1: Input Selection */}
              {subPhase === 'input_selection' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    Se presenta a la red el ejemplo <span className="font-bold text-blue-700">{currentExample.id}</span> del conjunto de entrenamiento XOR:
                  </p>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200 font-mono text-center">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Entrada i₁ (x₁)</span>
                      <span className="text-xl font-bold text-blue-700">{x1}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Entrada i₂ (x₂)</span>
                      <span className="text-xl font-bold text-blue-700">{x2}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Salida Deseada (t)</span>
                      <span className="text-xl font-bold text-emerald-700">{target}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Presiona <strong>Siguiente Paso</strong> para calcular la suma ponderada y la activación de la primera neurona oculta (h₁).
                  </p>
                </div>
              )}

              {/* STEP 2: Calculate h1 */}
              {subPhase === 'calc_h1' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Neurona Oculta h₁:</strong> Suma ponderada de las entradas más el sesgo, seguida de la función sigmoide:
                  </p>
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                    <MathView math="z_{h1} = (x_1 \cdot w_{11}) + (x_2 \cdot w_{21}) + b_{h1}" block />
                    <MathView
                      math={`z_{h1} = (${x1} \\times ${weights.w11.toFixed(4)}) + (${x2} \\times ${weights.w21.toFixed(4)}) + ${biases.bh1.toFixed(4)} = ${zh1.toFixed(6)}`}
                      block
                    />
                    <MathView
                      math={`h_1 = \\sigma(z_{h1}) = \\frac{1}{1 + e^{-(${zh1.toFixed(4)})}} = ${h1.toFixed(6)}`}
                      block
                    />
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50/40 border border-blue-200/40 rounded-lg text-blue-700">
                    <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Activación h₁ obtenida: <strong>{h1.toFixed(4)}</strong></span>
                  </div>
                </div>
              )}

              {/* STEP 3: Calculate h2 */}
              {subPhase === 'calc_h2' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Neurona Oculta h₂:</strong> Suma ponderada de las entradas más el sesgo, seguida de la función sigmoide:
                  </p>
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                    <MathView math="z_{h2} = (x_1 \cdot w_{12}) + (x_2 \cdot w_{22}) + b_{h2}" block />
                    <MathView
                      math={`z_{h2} = (${x1} \\times ${weights.w12.toFixed(4)}) + (${x2} \\times ${weights.w22.toFixed(4)}) + ${biases.bh2.toFixed(4)} = ${zh2.toFixed(6)}`}
                      block
                    />
                    <MathView
                      math={`h_2 = \\sigma(z_{h2}) = \\frac{1}{1 + e^{-(${zh2.toFixed(4)})}} = ${h2.toFixed(6)}`}
                      block
                    />
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-indigo-50/40 border border-indigo-200/40 rounded-lg text-indigo-700">
                    <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>Activación h₂ obtenida: <strong>{h2.toFixed(4)}</strong></span>
                  </div>
                </div>
              )}

              {/* STEP 4: Calculate o1 */}
              {subPhase === 'calc_o1' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Neurona de Salida o₁:</strong> Ponderación de las activaciones ocultas con la matriz W₂ y sesgo de salida:
                  </p>
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                    <MathView math="z_{o1} = (h_1 \cdot w_{h1o1}) + (h_2 \cdot w_{h2o1}) + b_{o1}" block />
                    <MathView
                      math={`z_{o1} = (${h1.toFixed(4)} \\times ${weights.wh1.toFixed(4)}) + (${h2.toFixed(4)} \\times ${weights.wh2.toFixed(4)}) + ${biases.bo1.toFixed(4)} = ${zo1.toFixed(6)}`}
                      block
                    />
                    <MathView
                      math={`o_1 = \\sigma(z_{o1}) = \\frac{1}{1 + e^{-(${zo1.toFixed(4)})}} = ${o1.toFixed(6)}`}
                      block
                    />
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-emerald-50/40 border border-emerald-200/40 rounded-lg text-emerald-700">
                    <Zap className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>Predicción actual de la red: <strong>{o1.toFixed(4)}</strong></span>
                  </div>
                </div>
              )}

              {/* STEP 5: Calculate Error */}
              {subPhase === 'calc_error' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Determinación del Error:</strong> Comparación directa entre la salida esperada (t) y la salida calculada (o₁):
                  </p>
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                    <MathView math="Error = t - o_1" block />
                    <MathView math={`Error = ${target} - ${o1.toFixed(6)} = ${error.toFixed(6)}`} block />
                    <MathView
                      math={`Error^2 = (${error.toFixed(6)})^2 = ${squaredError.toFixed(6)}`}
                      block
                    />
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    El gradiente de error guiará ahora la retropropagación en reversa.
                  </div>
                </div>
              )}

              {/* STEP 6: Delta Output */}
              {subPhase === 'delta_output' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Paso 1 de Retropropagación — Delta de la neurona de salida (δ_o1):</strong>
                  </p>
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                    <MathView
                      math="\delta_{o1} = \sigma'(z_{o1}) \cdot (t - o_1) = o_1 \cdot (1 - o_1) \cdot (t - o_1)"
                      block
                    />
                    <MathView
                      math={`\\delta_{o1} = ${o1.toFixed(6)} \\times (1 - ${o1.toFixed(6)}) \\times ${error.toFixed(6)}`}
                      block
                    />
                    <MathView math={`\\delta_{o1} = ${deltaO1.toFixed(6)}`} block />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Este delta mide la sensibilidad del error total respecto a la entrada neta de la neurona de salida.
                  </p>
                </div>
              )}

              {/* STEP 7: Delta Hidden */}
              {subPhase === 'delta_hidden' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Paso 2 de Retropropagación — Deltas de la capa oculta (δ_h1, δ_h2):</strong>
                  </p>

                  {/* Critical academic notice */}
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50/40 border border-amber-300/40 rounded-lg text-amber-700 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>REGLA OBLIGATORIA:</strong> Para calcular los deltas ocultos se deben utilizar los pesos de salida <em>anteriores</em> a la actualización (w_h1={oldWh1.toFixed(4)}, w_h2={oldWh2.toFixed(4)}).
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                    <MathView
                      math="\delta_{h1} = h_1 \cdot (1 - h_1) \cdot (w_{h1o1}^{ant} \cdot \delta_{o1})"
                      block
                    />
                    <MathView
                      math={`\\delta_{h1} = ${h1.toFixed(4)} \\times (1 - ${h1.toFixed(4)}) \\times (${oldWh1.toFixed(4)} \\times ${deltaO1.toFixed(4)}) = ${deltaH1.toFixed(6)}`}
                      block
                    />
                    <div className="my-2 border-t border-slate-200" />
                    <MathView
                      math="\delta_{h2} = h_2 \cdot (1 - h_2) \cdot (w_{h2o1}^{ant} \cdot \delta_{o1})"
                      block
                    />
                    <MathView
                      math={`\\delta_{h2} = ${h2.toFixed(4)} \\times (1 - ${h2.toFixed(4)}) \\times (${oldWh2.toFixed(4)} \\times ${deltaO1.toFixed(4)}) = ${deltaH2.toFixed(6)}`}
                      block
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: Parameter Updates */}
              {subPhase === 'update_params' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Paso 3 de Retropropagación — Actualización de pesos y sesgos:</strong>
                  </p>
                  <MathView math="w_{nuevo} = w_{anterior} + \alpha \cdot \text{activación} \cdot \delta" block />
                  <MathView math="b_{nuevo} = b_{anterior} + \alpha \cdot \delta" block />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {/* W2 updates */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-blue-700 font-bold block mb-1">Capa de Salida (W₂, b_o1)</span>
                      <p>
                        w_h1o1: {oldWh1.toFixed(4)} + ({learningRate} × {h1.toFixed(4)} × {deltaO1.toFixed(4)}) ={' '}
                        <span className="text-emerald-700 font-bold">{(oldWh1 + weightDeltas.wh1).toFixed(6)}</span>
                      </p>
                      <p>
                        w_h2o1: {oldWh2.toFixed(4)} + ({learningRate} × {h2.toFixed(4)} × {deltaO1.toFixed(4)}) ={' '}
                        <span className="text-emerald-700 font-bold">{(oldWh2 + weightDeltas.wh2).toFixed(6)}</span>
                      </p>
                      <p>
                        b_o1: {biases.bo1.toFixed(4)} + ({learningRate} × {deltaO1.toFixed(4)}) ={' '}
                        <span className="text-emerald-700 font-bold">{(biases.bo1 + biasDeltas.bo1).toFixed(6)}</span>
                      </p>
                    </div>

                    {/* W1 updates */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-blue-700 font-bold block mb-1">Capa Oculta (W₁, b_h)</span>
                      <p>
                        w₁₁: {weights.w11.toFixed(4)} + ({learningRate} × {x1} × {deltaH1.toFixed(4)}) ={' '}
                        <span className="text-indigo-700 font-bold">{(weights.w11 + weightDeltas.w11).toFixed(6)}</span>
                      </p>
                      <p>
                        w₂₁: {weights.w21.toFixed(4)} + ({learningRate} × {x2} × {deltaH1.toFixed(4)}) ={' '}
                        <span className="text-indigo-700 font-bold">{(weights.w21 + weightDeltas.w21).toFixed(6)}</span>
                      </p>
                      <p>
                        w₁₂: {weights.w12.toFixed(4)} + ({learningRate} × {x1} × {deltaH2.toFixed(4)}) ={' '}
                        <span className="text-indigo-700 font-bold">{(weights.w12 + weightDeltas.w12).toFixed(6)}</span>
                      </p>
                      <p>
                        w₂₂: {weights.w22.toFixed(4)} + ({learningRate} × {x2} × {deltaH2.toFixed(4)}) ={' '}
                        <span className="text-indigo-700 font-bold">{(weights.w22 + weightDeltas.w22).toFixed(6)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 9: Successor State */}
              {subPhase === 'new_state' && (
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <strong>Estado Sucesor Consolidado:</strong> Los nuevos parámetros han sido fijados en la red neuronal. El sistema está listo para procesar el siguiente ejemplo de entrenamiento.
                  </p>
                  <div className="p-3 bg-emerald-50/40 border border-emerald-300/50 rounded-xl space-y-2 text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Sigma className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold">Iteración {currentIteration} Completada</span>
                    </div>
                    <p className="text-xs">
                      La red completó el ciclo perceptrón. Presiona <strong>Siguiente Iteración</strong> o <strong>Siguiente Paso</strong> para cargar el próximo ejemplo según el orden seleccionado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Successor Method Concept Card (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50/80 rounded-xl p-5 border border-slate-200/90 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Método Sucesor
            </h3>
          </div>

          <div className="text-xs text-slate-700 space-y-2.5">
            <p>
              En la teoría de agentes inteligentes, el <strong>Método Sucesor</strong> define la función de transición que mapea el estado actual al siguiente:
            </p>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-center">
              <MathView math="S_{t+1} = \text{Transición}(S_t, e_k)" block />
            </div>
            <div className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
              <p>
                <strong>Estado S_t:</strong> {'{'}W₁, W₂, B, iteración t, época{'}'}
              </p>
              <p>
                <strong>Acción:</strong> Aplicar Forward Pass → Calcular Error → Backpropagation → Actualizar
              </p>
              <p>
                <strong>Estado S_{'{t+1}'}:</strong> {'{'}W₁^{'{nuevo}'}, W₂^{'{nuevo}'}, B^{'{nuevo}'}, t+1{'}'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Successor Table */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Historial de Transiciones de Estado (Método Sucesor)
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                Pág {historyPage + 1} de {totalPages}
              </span>
              <button
                disabled={historyPage === 0}
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
              >
                ‹
              </button>
              <button
                disabled={historyPage >= totalPages - 1}
                onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
              >
                ›
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Iter</th>
                <th className="py-2 px-3 text-center">Época</th>
                <th className="py-2 px-3">Ejemplo</th>
                <th className="py-2 px-3 text-center">Target</th>
                <th className="py-2 px-3 text-center">Salida Red</th>
                <th className="py-2 px-3 text-center">Error</th>
                <th className="py-2 px-3 text-center">MSE Global</th>
                <th className="py-2 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
              {currentHistorySlice.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    Aún no hay iteraciones completadas. Presiona "Siguiente Iteración" o "Siguiente Paso" para comenzar.
                  </td>
                </tr>
              ) : (
                currentHistorySlice.map((h) => (
                  <tr key={h.iteration} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-1.5 px-3 text-blue-700 font-bold">#{h.iteration}</td>
                    <td className="py-1.5 px-3 text-center text-indigo-700">{h.epoch}</td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {h.example.id} ({h.example.x1},{h.example.x2})
                    </td>
                    <td className="py-1.5 px-3 text-center font-bold text-slate-900">
                      {h.example.target}
                    </td>
                    <td className="py-1.5 px-3 text-center text-slate-700">
                      {h.forward.o1.toFixed(4)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span
                        className={
                          Math.abs(h.forward.error) < 0.2 ? 'text-emerald-700' : 'text-rose-600'
                        }
                      >
                        {h.forward.error.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-center text-amber-700">
                      {h.globalMSEAfter.toFixed(6)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {onSelectHistoricalState && (
                        <button
                          onClick={() => onSelectHistoricalState(h)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100/60 text-blue-700 font-sans text-[10px] border border-slate-200 hover:border-blue-300 transition-colors"
                        >
                          Ver Estado
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

