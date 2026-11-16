import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TrainingConfig,
  TrainingOrderType,
  NetworkWeights,
  NetworkBiases,
  StepSubPhase,
  IterationSnapshot,
  EpochRecord,
  ForwardResult,
  BackpropResult,
  XORExample,
} from './types/network';
import {
  XOR_DATASET,
  ORIGINAL_ORDER,
  PDF_DEMO_ORDER,
  INITIAL_WEIGHTS,
  INITIAL_BIASES,
  DEFAULT_LEARNING_RATE,
  DEFAULT_TARGET_MSE,
  DEFAULT_MAX_EPOCHS,
  forwardPass,
  backpropagate,
  calculateGlobalMSE,
  cloneWeights,
  cloneBiases,
} from './lib/math';
import { NetworkDiagram } from './components/NetworkDiagram';
import { ConfigurationSection } from './components/ConfigurationSection';
import { StepTrainingSection } from './components/StepTrainingSection';
import { ChartsSection } from './components/ChartsSection';
import { ComparisonSection } from './components/ComparisonSection';
import { ReportSection } from './components/ReportSection';
import {
  Activity,
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  Sliders,
  BarChart2,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  // Configuration
  const [config, setConfig] = useState<TrainingConfig>({
    learningRate: DEFAULT_LEARNING_RATE,
    targetMSE: DEFAULT_TARGET_MSE,
    maxEpochs: DEFAULT_MAX_EPOCHS,
    orderType: 'original',
    classificationThreshold: 0.5,
  });

  // Current Parameters
  const [weights, setWeights] = useState<NetworkWeights>(cloneWeights(INITIAL_WEIGHTS));
  const [biases, setBiases] = useState<NetworkBiases>(cloneBiases(INITIAL_BIASES));

  // Previous Parameters (for visual delta comparison)
  const [prevWeights, setPrevWeights] = useState<NetworkWeights | null>(null);
  const [prevBiases, setPrevBiases] = useState<NetworkBiases | null>(null);

  // Initial State Snapshot
  const [initialWeights, setInitialWeights] = useState<NetworkWeights>(cloneWeights(INITIAL_WEIGHTS));
  const [initialBiases, setInitialBiases] = useState<NetworkBiases>(cloneBiases(INITIAL_BIASES));

  // Training state counters
  const [iteration, setIteration] = useState<number>(1);
  const [epoch, setEpoch] = useState<number>(1);
  const [exampleIndex, setExampleIndex] = useState<number>(0);
  const [subPhase, setSubPhase] = useState<StepSubPhase>('input_selection');

  // Histories
  const [history, setHistory] = useState<IterationSnapshot[]>([]);
  const [epochHistory, setEpochHistory] = useState<EpochRecord[]>([]);

  // Auto-training loop state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingSpeed, setTrainingSpeed] = useState<'slow' | 'medium' | 'fast' | 'ultra'>('fast');
  const animationFrameRef = useRef<number | null>(null);

  // Active training order
  const activeOrder = useMemo(() => {
    return config.orderType === 'original' ? ORIGINAL_ORDER : PDF_DEMO_ORDER;
  }, [config.orderType]);

  const currentExample: XORExample = activeOrder[exampleIndex % activeOrder.length];

  // Current Forward Pass computation
  const forwardResult: ForwardResult = useMemo(() => {
    return forwardPass(currentExample, weights, biases);
  }, [currentExample, weights, biases]);

  // Current Backpropagation computation
  const backpropResult: BackpropResult = useMemo(() => {
    return backpropagate(forwardResult, weights, biases, config.learningRate);
  }, [forwardResult, weights, biases, config.learningRate]);

  // Global evaluations with current weights
  const currentGlobalEval = useMemo(() => {
    return calculateGlobalMSE(weights, biases);
  }, [weights, biases]);

  // Initial global evaluations
  const initialGlobalEval = useMemo(() => {
    return calculateGlobalMSE(initialWeights, initialBiases);
  }, [initialWeights, initialBiases]);

  // Record initial epoch 0 in epochHistory if empty
  useEffect(() => {
    if (epochHistory.length === 0) {
      setEpochHistory([
        {
          epoch: 0,
          mse: initialGlobalEval.mse,
          weights: cloneWeights(initialWeights),
          biases: cloneBiases(initialBiases),
          allOutputs: initialGlobalEval.evaluations.map((e) => ({
            exampleId: e.example.id,
            target: e.example.target,
            output: e.forward.o1,
            correct: e.correct,
          })),
          allCorrect: initialGlobalEval.allCorrect,
        },
      ]);
    }
  }, [epochHistory.length, initialGlobalEval, initialWeights, initialBiases]);

  // ================= STEP-BY-STEP CONTROLS =================

  const advanceMicroStep = useCallback(() => {
    const phases: StepSubPhase[] = [
      'input_selection',
      'calc_h1',
      'calc_h2',
      'calc_o1',
      'calc_error',
      'delta_output',
      'delta_hidden',
      'update_params',
      'new_state',
    ];
    const currentIndex = phases.indexOf(subPhase);

    if (currentIndex < phases.length - 1) {
      // Advance to next micro step within this example
      setSubPhase(phases[currentIndex + 1]);
    } else {
      // Completed 'new_state' -> commit snapshot and proceed to next example
      completeCurrentIteration();
    }
  }, [subPhase]);

  const completeCurrentIteration = useCallback(() => {
    // Save previous parameters
    setPrevWeights(cloneWeights(weights));
    setPrevBiases(cloneBiases(biases));

    // Update to new parameters
    const updatedWeights = cloneWeights(backpropResult.newWeights);
    const updatedBiases = cloneBiases(backpropResult.newBiases);

    setWeights(updatedWeights);
    setBiases(updatedBiases);

    // Calculate new global MSE after update
    const mseAfter = calculateGlobalMSE(updatedWeights, updatedBiases);

    // Save snapshot to iteration history
    const snapshot: IterationSnapshot = {
      iteration,
      epoch,
      example: currentExample,
      weightsBefore: cloneWeights(weights),
      biasesBefore: cloneBiases(biases),
      forward: forwardResult,
      backprop: backpropResult,
      weightsAfter: updatedWeights,
      biasesAfter: updatedBiases,
      globalMSEBefore: currentGlobalEval.mse,
      globalMSEAfter: mseAfter.mse,
    };

    setHistory((prev) => [...prev, snapshot]);

    // Check if epoch completed (every 4 iterations)
    const nextExampleIndex = (exampleIndex + 1) % activeOrder.length;
    const isEpochCompleted = nextExampleIndex === 0;
    const nextEpoch = isEpochCompleted ? epoch + 1 : epoch;

    if (isEpochCompleted) {
      setEpochHistory((prev) => [
        ...prev,
        {
          epoch: nextEpoch - 1,
          mse: mseAfter.mse,
          weights: updatedWeights,
          biases: updatedBiases,
          allOutputs: mseAfter.evaluations.map((e) => ({
            exampleId: e.example.id,
            target: e.example.target,
            output: e.forward.o1,
            correct: e.correct,
          })),
          allCorrect: mseAfter.allCorrect,
        },
      ]);
    }

    setIteration((i) => i + 1);
    setEpoch(nextEpoch);
    setExampleIndex(nextExampleIndex);
    setSubPhase('input_selection');
  }, [
    weights,
    biases,
    backpropResult,
    iteration,
    epoch,
    currentExample,
    forwardResult,
    currentGlobalEval.mse,
    exampleIndex,
    activeOrder.length,
  ]);

  const stepBack = useCallback(() => {
    const phases: StepSubPhase[] = [
      'input_selection',
      'calc_h1',
      'calc_h2',
      'calc_o1',
      'calc_error',
      'delta_output',
      'delta_hidden',
      'update_params',
      'new_state',
    ];
    const currentIndex = phases.indexOf(subPhase);

    if (currentIndex > 0) {
      setSubPhase(phases[currentIndex - 1]);
    } else if (history.length > 0) {
      // Revert to previous iteration state
      const lastSnapshot = history[history.length - 1];
      setWeights(cloneWeights(lastSnapshot.weightsBefore));
      setBiases(cloneBiases(lastSnapshot.biasesBefore));
      setIteration(lastSnapshot.iteration);
      setEpoch(lastSnapshot.epoch);
      const exIdx = activeOrder.findIndex((ex) => ex.id === lastSnapshot.example.id);
      setExampleIndex(exIdx >= 0 ? exIdx : 0);
      setSubPhase('update_params');
      setHistory((prev) => prev.slice(0, -1));
    }
  }, [subPhase, history, activeOrder]);

  // ================= AUTOMATIC TRAINING LOOP =================

  useEffect(() => {
    if (!isTraining) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    const runTrainingStep = () => {
      if (isCancelled) return;

      // Check stopping criteria
      const currentEval = calculateGlobalMSE(weights, biases);
      if (currentEval.mse <= config.targetMSE || epoch >= config.maxEpochs) {
        setIsTraining(false);
        return;
      }

      if (trainingSpeed === 'slow') {
        // Step-by-step advance with visible interval
        setTimeout(() => {
          if (!isCancelled) advanceMicroStep();
        }, 500);
      } else if (trainingSpeed === 'medium') {
        // 1 iteration per ~60ms
        setTimeout(() => {
          if (!isCancelled) completeCurrentIteration();
        }, 60);
      } else if (trainingSpeed === 'fast') {
        // Complete full epoch per animation frame
        let curW = cloneWeights(weights);
        let curB = cloneBiases(biases);
        let curIter = iteration;
        let curEp = epoch;

        for (let i = 0; i < activeOrder.length; i++) {
          const ex = activeOrder[i];
          const fwd = forwardPass(ex, curW, curB);
          const bp = backpropagate(fwd, curW, curB, config.learningRate);
          curW = bp.newWeights;
          curB = bp.newBiases;
          curIter++;
        }
        curEp++;

        const newEval = calculateGlobalMSE(curW, curB);

        setWeights(curW);
        setBiases(curB);
        setIteration(curIter);
        setEpoch(curEp);
        setExampleIndex(0);
        setSubPhase('input_selection');

        setEpochHistory((prev) => [
          ...prev,
          {
            epoch: curEp,
            mse: newEval.mse,
            weights: curW,
            biases: curB,
            allOutputs: newEval.evaluations.map((e) => ({
              exampleId: e.example.id,
              target: e.example.target,
              output: e.forward.o1,
              correct: e.correct,
            })),
            allCorrect: newEval.allCorrect,
          },
        ]);

        if (newEval.mse <= config.targetMSE || curEp >= config.maxEpochs) {
          setIsTraining(false);
        } else {
          animationFrameRef.current = requestAnimationFrame(runTrainingStep);
        }
      } else {
        // 'ultra' speed: batch of 50 epochs per animation frame
        let curW = cloneWeights(weights);
        let curB = cloneBiases(biases);
        let curIter = iteration;
        let curEp = epoch;
        const batchEpochs = 50;

        for (let b = 0; b < batchEpochs; b++) {
          for (let i = 0; i < activeOrder.length; i++) {
            const ex = activeOrder[i];
            const fwd = forwardPass(ex, curW, curB);
            const bp = backpropagate(fwd, curW, curB, config.learningRate);
            curW = bp.newWeights;
            curB = bp.newBiases;
            curIter++;
          }
          curEp++;

          // Check if converged inside batch
          const checkEval = calculateGlobalMSE(curW, curB);
          if (checkEval.mse <= config.targetMSE || curEp >= config.maxEpochs) {
            break;
          }
        }

        const newEval = calculateGlobalMSE(curW, curB);

        setWeights(curW);
        setBiases(curB);
        setIteration(curIter);
        setEpoch(curEp);
        setExampleIndex(0);
        setSubPhase('input_selection');

        setEpochHistory((prev) => [
          ...prev,
          {
            epoch: curEp,
            mse: newEval.mse,
            weights: curW,
            biases: curB,
            allOutputs: newEval.evaluations.map((e) => ({
              exampleId: e.example.id,
              target: e.example.target,
              output: e.forward.o1,
              correct: e.correct,
            })),
            allCorrect: newEval.allCorrect,
          },
        ]);

        if (newEval.mse <= config.targetMSE || curEp >= config.maxEpochs) {
          setIsTraining(false);
        } else {
          animationFrameRef.current = requestAnimationFrame(runTrainingStep);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(runTrainingStep);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isTraining,
    weights,
    biases,
    iteration,
    epoch,
    config.targetMSE,
    config.maxEpochs,
    config.learningRate,
    trainingSpeed,
    activeOrder,
    advanceMicroStep,
    completeCurrentIteration,
  ]);

  // Apply new initial parameters and restart training from them
  const applyInitialParams = useCallback((nextWeights: NetworkWeights, nextBiases: NetworkBiases) => {
    const w = cloneWeights(nextWeights);
    const b = cloneBiases(nextBiases);

    setIsTraining(false);
    setInitialWeights(w);
    setInitialBiases(b);
    setWeights(cloneWeights(w));
    setBiases(cloneBiases(b));
    setPrevWeights(null);
    setPrevBiases(null);
    setIteration(1);
    setEpoch(1);
    setExampleIndex(0);
    setSubPhase('input_selection');
    setHistory([]);

    const eval0 = calculateGlobalMSE(w, b);
    setEpochHistory([
      {
        epoch: 0,
        mse: eval0.mse,
        weights: cloneWeights(w),
        biases: cloneBiases(b),
        allOutputs: eval0.evaluations.map((e) => ({
          exampleId: e.example.id,
          target: e.example.target,
          output: e.forward.o1,
          correct: e.correct,
        })),
        allCorrect: eval0.allCorrect,
      },
    ]);
  }, []);

  // Reset to initial professor parameters
  const handleReset = () => {
    applyInitialParams(INITIAL_WEIGHTS, INITIAL_BIASES);
  };

  // Inspect past snapshot in the diagram
  const handleSelectHistoricalState = (snapshot: IterationSnapshot) => {
    setWeights(cloneWeights(snapshot.weightsAfter));
    setBiases(cloneBiases(snapshot.biasesAfter));
    setPrevWeights(cloneWeights(snapshot.weightsBefore));
    setPrevBiases(cloneBiases(snapshot.biasesBefore));
    setSubPhase('new_state');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-wide flex items-center gap-2">
                XOR Neural Lab
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Simulador Educativo Universitario de Redes Neuronales con Retropropagación y Método Sucesor
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Autores: Tatiana Castillo, Nicolas Lagos y Madi Colina
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-mono">
            <div className="bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">ÉPOCA</span>
              <span className="text-indigo-700 font-bold">{epoch}</span>
            </div>
            <div className="bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">ITER</span>
              <span className="text-blue-700 font-bold">{iteration}</span>
            </div>
            <div className="bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">MSE GLOBAL</span>
              <span className="text-emerald-700 font-bold">
                {currentGlobalEval.mse.toFixed(6)}
              </span>
            </div>
            <div className="bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">XOR (ACIERTO)</span>
              <span
                className={`font-bold ${
                  currentGlobalEval.allCorrect ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {currentGlobalEval.evaluations.filter((e) => e.correct).length}/4
              </span>
            </div>
          </div>

          {/* Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs">
            <a
              href="#config"
              className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Configuración
            </a>
            <a
              href="#diagram"
              className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Red Neuronal
            </a>
            <a
              href="#training"
              className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Paso a Paso
            </a>
            <a
              href="#charts"
              className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Gráficas
            </a>
            <a
              href="#comparison"
              className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Comparación
            </a>
            <a
              href="#report"
              className="px-2.5 py-1 rounded-lg bg-blue-50/60 text-blue-700 border border-blue-200 hover:bg-blue-100/80 transition-colors"
            >
              Informe
            </a>
          </nav>
        </div>
      </header>

      {/* Main Single-Screen Content with Vertical Smooth Flow */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 flex-1">
        {/* Section 1: Configuration & Dataset */}
        <section id="config" className="scroll-mt-20">
          <ConfigurationSection
            config={config}
            onConfigChange={setConfig}
            weights={weights}
            biases={biases}
            initialWeights={initialWeights}
            initialBiases={initialBiases}
            onResetWeights={handleReset}
            onUpdateInitialParams={applyInitialParams}
            currentExample={currentExample}
            evaluations={currentGlobalEval.evaluations}
            isTraining={isTraining}
          />
        </section>

        {/* Section 2: Interactive Neural Network Diagram */}
        <section id="diagram" className="scroll-mt-20">
          <NetworkDiagram
            weights={weights}
            biases={biases}
            previousWeights={prevWeights}
            previousBiases={prevBiases}
            forwardResult={forwardResult}
            backpropResult={backpropResult}
            subPhase={subPhase}
            learningRate={config.learningRate}
          />
        </section>

        {/* Section 3: Step-by-Step Training & Formulas */}
        <section id="training" className="scroll-mt-20">
          <StepTrainingSection
            currentIteration={iteration}
            currentEpoch={epoch}
            currentExample={currentExample}
            subPhase={subPhase}
            weights={weights}
            biases={biases}
            forwardResult={forwardResult}
            backpropResult={backpropResult}
            learningRate={config.learningRate}
            history={history}
            isTraining={isTraining}
            trainingSpeed={trainingSpeed}
            onSpeedChange={setTrainingSpeed}
            onNextStep={advanceMicroStep}
            onPrevStep={stepBack}
            onNextIteration={completeCurrentIteration}
            onStartAutoTraining={() => setIsTraining(true)}
            onPauseAutoTraining={() => setIsTraining(false)}
            onReset={handleReset}
            onSelectHistoricalState={handleSelectHistoricalState}
          />
        </section>

        {/* Section 4: Charts and 2D XOR Decision Boundary */}
        <section id="charts" className="scroll-mt-20">
          <ChartsSection
            epochHistory={epochHistory}
            iterationHistory={history}
            targetMSE={config.targetMSE}
          />
        </section>

        {/* Section 5: Initial vs Final Comparison */}
        <section id="comparison" className="scroll-mt-20">
          <ComparisonSection
            config={config}
            initialWeights={initialWeights}
            initialBiases={initialBiases}
            finalWeights={weights}
            finalBiases={biases}
            initialMSE={initialGlobalEval.mse}
            finalMSE={currentGlobalEval.mse}
            totalEpochs={epoch}
            totalIterations={iteration}
            initialEvaluations={initialGlobalEval.evaluations}
            finalEvaluations={currentGlobalEval.evaluations}
          />
        </section>

        {/* Section 6: Results for University Report */}
        <section id="report" className="scroll-mt-20">
          <ReportSection
            config={config}
            initialWeights={initialWeights}
            initialBiases={initialBiases}
            finalWeights={weights}
            finalBiases={biases}
            initialMSE={initialGlobalEval.mse}
            finalMSE={currentGlobalEval.mse}
            totalEpochs={epoch}
            totalIterations={iteration}
            evaluations={currentGlobalEval.evaluations}
            history={history}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto">
          <p>
            XOR Neural Lab — Perceptrón Multicapa para inteligencia artificial. 2026-2. Ingeniería en Multimedia
          </p>
        </div>
      </footer>
    </div>
  );
}

