import React from 'react';
import {
  NetworkWeights,
  NetworkBiases,
  TrainingConfig,
  XORExample,
  ForwardResult,
  IterationSnapshot,
} from '../types/network';
import {
  generateAcademicReport,
  downloadFile,
  exportHistoryToCSV,
} from '../lib/export';
import {
  FileText,
  Download,
  BookOpen,
  Award,
  Layers,
  Database,
  Cpu,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { MathView } from './MathView';

interface ReportSectionProps {
  config: TrainingConfig;
  initialWeights: NetworkWeights;
  initialBiases: NetworkBiases;
  finalWeights: NetworkWeights;
  finalBiases: NetworkBiases;
  initialMSE: number;
  finalMSE: number;
  totalEpochs: number;
  totalIterations: number;
  evaluations: { example: XORExample; forward: ForwardResult; correct: boolean }[];
  history: IterationSnapshot[];
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  config,
  initialWeights,
  initialBiases,
  finalWeights,
  finalBiases,
  initialMSE,
  finalMSE,
  totalEpochs,
  totalIterations,
  evaluations,
  history,
}) => {
  const handleDownloadReport = () => {
    const reportText = generateAcademicReport(
      config,
      initialWeights,
      initialBiases,
      finalWeights,
      finalBiases,
      initialMSE,
      finalMSE,
      totalEpochs,
      totalIterations,
      evaluations.map((e) => ({
        exampleId: e.example.id,
        x1: e.example.x1,
        x2: e.example.x2,
        target: e.example.target,
        output: e.forward.o1,
        correct: e.correct,
      }))
    );
    downloadFile(reportText, 'informe_academico_red_neuronal_xor.md', 'text/markdown;charset=utf-8;');
  };

  const handleExportCSV = () => {
    exportHistoryToCSV(history);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm  space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">
            Resultados para el Informe Universitario
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-200 transition-colors disabled:opacity-40"
            title="Exportar todas las iteraciones en archivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Descargar CSV ({history.length} iter)
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors shadow-sm"
            title="Descargar documento completo estructurado en Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Informe (.MD)
          </button>
        </div>
      </div>

      {/* Grid of 9 Academic Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* 1. Requerimientos */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-blue-600 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Requerimientos del Sistema</span>
          </div>
          <ul className="text-slate-700 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
            <li>Arquitectura: Perceptrón Multicapa (MLP) 2–2–1.</li>
            <li>Función Sigmoide en capas oculta y salida.</li>
            <li>Entrenamiento por muestra (online/estocástico).</li>
            <li>Tasa de aprendizaje fija: α = {config.learningRate}.</li>
            <li>Criterio de convergencia: MSE ≤ {config.targetMSE}.</li>
            <li>Límite de épocas: {config.maxEpochs.toLocaleString()}.</li>
          </ul>
        </div>

        {/* 2 & 3. Estado Inicial y Final */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
              2-3
            </span>
            <span>Estados Inicial y Final</span>
          </div>
          <div className="text-slate-700 space-y-1.5 text-[11px] font-mono">
            <div>
              <span className="text-slate-500">MSE Inicial:</span>{' '}
              <span className="text-rose-600">{initialMSE.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-slate-500">MSE Final:</span>{' '}
              <span className="text-emerald-700 font-bold">{finalMSE.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-slate-500">Épocas ejecutadas:</span>{' '}
              <span className="text-blue-700">{totalEpochs}</span>
            </div>
            <div>
              <span className="text-slate-500">Iteraciones totales:</span>{' '}
              <span className="text-blue-700">{totalIterations}</span>
            </div>
          </div>
        </div>

        {/* 4. Agente de Aprendizaje (PEAS) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
              4
            </span>
            <span>Agente de Aprendizaje (PEAS)</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            La red neuronal actúa como el núcleo adaptativo de un agente resolutor de metas:
          </p>
          <div className="text-[10px] space-y-0.5 text-slate-500 font-mono">
            <p><strong className="text-slate-800">P (Rendimiento):</strong> Minimizar MSE y 100% acierto.</p>
            <p><strong className="text-slate-800">E (Entorno):</strong> Espacio booleano XOR 2D.</p>
            <p><strong className="text-slate-800">A (Actuadores):</strong> Ajuste sináptico (ΔW, ΔB).</p>
            <p><strong className="text-slate-800">S (Sensores):</strong> Lectura de (x₁, x₂) y señal de error.</p>
          </div>
        </div>

        {/* 5. Tipo de Entorno */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-blue-600 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
              5
            </span>
            <span>Clasificación del Entorno</span>
          </div>
          <table className="w-full text-[10px] text-left text-slate-700">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-1 text-slate-500">Observabilidad:</td>
                <td className="py-1 font-semibold text-emerald-700">Totalmente observable</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">Determinismo:</td>
                <td className="py-1 font-semibold text-emerald-700">Determinista</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">Naturaleza:</td>
                <td className="py-1 font-semibold text-amber-700">Secuencial en aprendizaje</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">Dinamismo:</td>
                <td className="py-1 font-semibold text-blue-700">Estático</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">Continuidad:</td>
                <td className="py-1 font-semibold text-indigo-700">Mixto (Continuo/Discreto)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. Método Sucesor */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
              6
            </span>
            <span>Método Sucesor Formal</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            Mapeo formal del espacio de estados de pesos y sesgos:
          </p>
          <div className="p-1.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-center">
            <MathView math="S_{t+1} = f(S_t, e_k)" block />
          </div>
          <p className="text-[10px] text-slate-500">
            Cada iteración toma el vector de parámetros actual, procesa el ejemplo XOR k-ésimo mediante Forward Pass, retropropaga el gradiente de error y produce el nuevo vector sucesor.
          </p>
        </div>

        {/* 7. Estrategia de Entrenamiento */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
              7
            </span>
            <span>Estrategia de Entrenamiento</span>
          </div>
          <ul className="text-slate-700 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
            <li>Propagación hacia adelante (Forward Pass).</li>
            <li>Cálculo del error individual eMSE global.</li>
            <li>Gradiente descendente con regla delta generalizada.</li>
            <li>Uso estricto de pesos anteriores para deltas ocultos.</li>
            <li>Actualización estocástica muestra por muestra.</li>
          </ul>
        </div>

        {/* 8. Conclusiones */}
        <div className="md:col-span-2 bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-700 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">
              8
            </span>
            <span>Conclusiones Académicas Reales</span>
          </div>
          <div className="text-slate-700 space-y-1.5 text-[11px] leading-relaxed">
            <p>
              1. <strong>Superación de la No-Separabilidad Lineal:</strong> Mientras que el perceptrón simple no puede resolver XOR, la arquitectura 2–2–1 con activaciones no lineales proyecta el espacio de entrada a un espacio oculto separable.
            </p>
            <p>
              2. <strong>Estabilidad y Convergencia:</strong> Con tasa α=0.25 y pesos iniciales de clase, la red converge progresivamente hacia MSE &lt; 0.01, alcanzando un acierto del 100% en las 4 combinaciones.
            </p>
            <p>
              3. <strong>Sensibilidad de Deltas:</strong> Mantener los pesos de salida previos a la actualización es matemáticamente mandatorio para el cálculo exacto de la derivada parcial de la capa oculta.
            </p>
          </div>
        </div>

        {/* 9. Referencias Bibliográficas */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-blue-600 font-bold border-b border-slate-200/80 pb-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
              9
            </span>
            <span>Referencias Académicas</span>
          </div>
          <ol className="text-slate-500 space-y-1 list-decimal list-inside text-[10px] leading-relaxed font-sans">
            <li>
              Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). <em>Learning representations by back-propagating errors</em>. Nature, 323(6088), 533-536.
            </li>
            <li>
              Minsky, M., & Papert, S. (1969). <em>Perceptrons: An Introduction to Computational Geometry</em>. MIT Press.
            </li>
            <li>
              Russell, S., & Norvig, P. (2020). <em>Artificial Intelligence: A Modern Approach</em> (4th ed.). Pearson.
            </li>
            <li>
              Bishop, C. M. (2006). <em>Pattern Recognition and Machine Learning</em>. Springer.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

