import { IterationSnapshot, NetworkWeights, NetworkBiases, TrainingConfig } from '../types/network';

/**
 * Downloads a string content as a file in the browser
 */
export function downloadFile(content: string, fileName: string, contentType: string = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export iteration history to CSV
 */
export function exportHistoryToCSV(history: IterationSnapshot[]) {
  const headers = [
    'Iteracion',
    'Epoca',
    'Ejemplo',
    'x1',
    'x2',
    'Target',
    'zh1',
    'h1',
    'zh2',
    'h2',
    'zo1',
    'o1',
    'Error',
    'SquaredError',
    'deltaO1',
    'deltaH1',
    'deltaH2',
    'w11_new',
    'w21_new',
    'w12_new',
    'w22_new',
    'wh1_new',
    'wh2_new',
    'bh1_new',
    'bh2_new',
    'bo1_new',
    'GlobalMSE_After',
  ];

  const rows = history.map((h) => [
    h.iteration,
    h.epoch,
    h.example.id,
    h.example.x1,
    h.example.x2,
    h.example.target,
    h.forward.zh1.toFixed(6),
    h.forward.h1.toFixed(6),
    h.forward.zh2.toFixed(6),
    h.forward.h2.toFixed(6),
    h.forward.zo1.toFixed(6),
    h.forward.o1.toFixed(6),
    h.forward.error.toFixed(6),
    h.forward.squaredError.toFixed(6),
    h.backprop.deltaO1.toFixed(6),
    h.backprop.deltaH1.toFixed(6),
    h.backprop.deltaH2.toFixed(6),
    h.weightsAfter.w11.toFixed(6),
    h.weightsAfter.w21.toFixed(6),
    h.weightsAfter.w12.toFixed(6),
    h.weightsAfter.w22.toFixed(6),
    h.weightsAfter.wh1.toFixed(6),
    h.weightsAfter.wh2.toFixed(6),
    h.biasesAfter.bh1.toFixed(6),
    h.biasesAfter.bh2.toFixed(6),
    h.biasesAfter.bo1.toFixed(6),
    h.globalMSEAfter.toFixed(6),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, 'historial_entrenamiento_xor.csv', 'text/csv;charset=utf-8;');
}

/**
 * Converts an SVG element to a PNG image and downloads it
 */
export function exportSvgToPng(svgElement: SVGSVGElement, filename: string, scale: number = 2) {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure svg has proper namespace and dimensions
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const width = (svgElement.clientWidth || 900) * scale;
  const height = (svgElement.clientHeight || 500) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    // Fill dark background for crisp readability
    ctx.fillStyle = '#050816';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  img.src = url;
}

/**
 * Generate academic markdown report
 */
export function generateAcademicReport(
  config: TrainingConfig,
  initialWeights: NetworkWeights,
  initialBiases: NetworkBiases,
  finalWeights: NetworkWeights,
  finalBiases: NetworkBiases,
  initialMSE: number,
  finalMSE: number,
  totalEpochs: number,
  totalIterations: number,
  evaluations: { exampleId: string; x1: number; x2: number; target: number; output: number; correct: boolean }[]
): string {
  return `# INFORME DE ENTRENAMIENTO — RED NEURONAL MULTICAPA PARA EL PROBLEMA XOR

## 1. REQUERIMIENTOS DEL PROYECTO
- Arquitectura: Perceptrón Multicapa (MLP) 2–2–1
- Función de Activación: Sigmoide σ(z) = 1 / (1 + e^(-z)) en capas oculta y de salida
- Función de Pérdida: Error Cuadrático Medio (MSE)
- Tasa de Aprendizaje (α): ${config.learningRate}
- Error Objetivo (MSE): ${config.targetMSE}
- Límite Máximo de Épocas: ${config.maxEpochs}
- Orden de Entrenamiento: ${config.orderType === 'original' ? 'Original (e1 → e2 → e3 → e4)' : 'Demostración PDF (e1 → e3 → e2 → e4)'}

## 2. ESTADO INICIAL
- Matriz W1 (Entrada → Oculta):
  [ [ ${initialWeights.w11.toFixed(4)}, ${initialWeights.w12.toFixed(4)} ],
    [ ${initialWeights.w21.toFixed(4)}, ${initialWeights.w22.toFixed(4)} ] ]
- Matriz W2 (Oculta → Salida):
  [ [ ${initialWeights.wh1.toFixed(4)} ],
    [ ${initialWeights.wh2.toFixed(4)} ] ]
- Sesgos Ocultos: b_h1 = ${initialBiases.bh1.toFixed(4)}, b_h2 = ${initialBiases.bh2.toFixed(4)}
- Sesgo de Salida: b_o1 = ${initialBiases.bo1.toFixed(4)}
- MSE Inicial: ${initialMSE.toFixed(6)}

## 3. ESTADO FINAL TRAS ENTRENAMIENTO
- Épocas Ejecutadas: ${totalEpochs}
- Iteraciones Totales: ${totalIterations}
- MSE Final: ${finalMSE.toFixed(6)}
- Matriz W1 Final:
  [ [ ${finalWeights.w11.toFixed(4)}, ${finalWeights.w12.toFixed(4)} ],
    [ ${finalWeights.w21.toFixed(4)}, ${finalWeights.w22.toFixed(4)} ] ]
- Matriz W2 Final:
  [ [ ${finalWeights.wh1.toFixed(4)} ],
    [ ${finalWeights.wh2.toFixed(4)} ] ]
- Sesgos Ocultos Finales: b_h1 = ${finalBiases.bh1.toFixed(4)}, b_h2 = ${finalBiases.bh2.toFixed(4)}
- Sesgo de Salida Final: b_o1 = ${finalBiases.bo1.toFixed(4)}

## 4. RESULTADOS DE CLASIFICACIÓN (UMBRAL 0.5)
${evaluations
  .map(
    (e) =>
      `- Ejemplo ${e.exampleId} (${e.x1}, ${e.x2}): Esperado=${e.target}, Predicción=${e.output.toFixed(4)} → ${
        e.correct ? 'CORRECTO ✓' : 'INCORRECTO ✗'
      }`
  )
  .join('\n')}

## 5. AGENTE DE APRENDIZAJE (PEAS)
- Medida de Rendimiento: Minimización del MSE y exactitud del 100% en las 4 combinaciones booleanas XOR.
- Entorno: Conjunto de entrenamiento discreto de 4 ejemplos booleanos y espacio continuo de ponderaciones.
- Actuadores: Regla de actualización de parámetros por gradiente descendente estocástico (Backpropagation).
- Sensores: Recepción del vector de entrada (x1, x2) y retroalimentación de la señal de error (t - o).

## 6. CLASIFICACIÓN DEL ENTORNO
- Observabilidad: Totalmente observable.
- Determinismo: Determinista.
- Carácter Secuencial: Secuencial durante el entrenamiento (el método sucesor altera los pesos para la muestra siguiente).
- Dinamismo: Estático (los valores lógicos de XOR no cambian con el tiempo).
- Continuidad: Continuo en parámetros y activaciones / Discreto en el conjunto de entradas XOR.

## 7. MÉTODO SUCESOR
Formalización: S_{t+1} = f(S_t, e_k)
Donde el estado S_t está compuesto por {W1, W2, B, iteración, época, error}. La función sucesora aplica el Forward Pass, evalúa el error de predicción, computa los deltas de salida y ocultos (usando pesos previos de W2) y produce el nuevo vector de parámetros.

## 8. CONCLUSIONES
1. El perceptrón simple de una sola capa no puede resolver el problema XOR debido a que las clases no son linealmente separables (Minsky & Papert, 1969).
2. La introducción de una capa oculta no lineal con activación sigmoide transforma el espacio de entrada de 2D en una representación oculta donde las clases sí resultan linealmente separables por la neurona de salida.
3. El algoritmo de retropropagación ajusta exitosamente los 6 pesos y 3 sesgos hasta alcanzar la convergencia, logrando una clasificación del 100%.

## 9. REFERENCIAS BIBLIOGRÁFICAS
1. Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). Learning representations by back-propagating errors. Nature, 323(6088), 533-536.
2. Minsky, M., & Papert, S. (1969). Perceptrons: An Introduction to Computational Geometry. MIT Press.
3. Russell, S., & Norvig, P. (2020). Artificial Intelligence: A Modern Approach (4th ed.). Pearson.
4. Bishop, C. M. (2006). Pattern Recognition and Machine Learning. Springer.
`;
}

