import {
  XORExample,
  NetworkWeights,
  NetworkBiases,
  ForwardResult,
  BackpropResult,
  TrainingOrderType,
} from '../types/network';

export const XOR_DATASET: Record<'e1' | 'e2' | 'e3' | 'e4', XORExample> = {
  e1: { id: 'e1', x1: 0, x2: 1, target: 1, label: 'e1: (0, 1) -> 1' },
  e2: { id: 'e2', x1: 1, x2: 0, target: 1, label: 'e2: (1, 0) -> 1' },
  e3: { id: 'e3', x1: 1, x2: 1, target: 0, label: 'e3: (1, 1) -> 0' },
  e4: { id: 'e4', x1: 0, x2: 0, target: 0, label: 'e4: (0, 0) -> 0' },
};

export const ORIGINAL_ORDER: XORExample[] = [
  XOR_DATASET.e1,
  XOR_DATASET.e2,
  XOR_DATASET.e3,
  XOR_DATASET.e4,
];

export const PDF_DEMO_ORDER: XORExample[] = [
  XOR_DATASET.e1,
  XOR_DATASET.e3,
  XOR_DATASET.e2,
  XOR_DATASET.e4,
];

export const INITIAL_WEIGHTS: NetworkWeights = {
  w11: 0.3,
  w21: 0.6,
  w12: 0.2,
  w22: -0.4,
  wh1: 0.5,
  wh2: 0.7,
};

export const INITIAL_BIASES: NetworkBiases = {
  bh1: 0.1,
  bh2: 0.1,
  bo1: 0.1,
};

export const DEFAULT_LEARNING_RATE = 0.25;
export const DEFAULT_TARGET_MSE = 0.01;
export const DEFAULT_MAX_EPOCHS = 100000;

/**
 * Standard Sigmoid Activation Function
 * sigma(z) = 1 / (1 + exp(-z))
 */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Derivative of the Sigmoid function
 * sigma'(z) = sigma(z) * (1 - sigma(z))
 */
export function sigmoidDerivative(output: number): number {
  return output * (1 - output);
}

/**
 * Forward Pass for a single input example
 */
export function forwardPass(
  example: XORExample,
  weights: NetworkWeights,
  biases: NetworkBiases
): ForwardResult {
  const { x1, x2, target } = example;

  // Hidden Layer
  const zh1 = x1 * weights.w11 + x2 * weights.w21 + biases.bh1;
  const h1 = sigmoid(zh1);

  const zh2 = x1 * weights.w12 + x2 * weights.w22 + biases.bh2;
  const h2 = sigmoid(zh2);

  // Output Layer
  const zo1 = h1 * weights.wh1 + h2 * weights.wh2 + biases.bo1;
  const o1 = sigmoid(zo1);

  const error = target - o1;
  const squaredError = error * error;

  return {
    x1,
    x2,
    target,
    zh1,
    h1,
    zh2,
    h2,
    zo1,
    o1,
    error,
    squaredError,
  };
}

/**
 * Calculate Global MSE over the entire XOR dataset using a static snapshot of weights and biases
 */
export function calculateGlobalMSE(
  weights: NetworkWeights,
  biases: NetworkBiases
): {
  mse: number;
  evaluations: { example: XORExample; forward: ForwardResult; correct: boolean }[];
  allCorrect: boolean;
} {
  const examples = ORIGINAL_ORDER;
  let totalSquaredError = 0;
  const evaluations = examples.map((ex) => {
    const forward = forwardPass(ex, weights, biases);
    totalSquaredError += forward.squaredError;
    const predictedClass = forward.o1 >= 0.5 ? 1 : 0;
    const correct = predictedClass === ex.target;
    return { example: ex, forward, correct };
  });

  const mse = totalSquaredError / examples.length;
  const allCorrect = evaluations.every((e) => e.correct);

  return {
    mse,
    evaluations,
    allCorrect,
  };
}

/**
 * Backpropagation execution for a single example
 * CRITICAL RULE: Hidden deltas MUST use output weights from BEFORE the update.
 */
export function backpropagate(
  forward: ForwardResult,
  weights: NetworkWeights,
  biases: NetworkBiases,
  learningRate: number
): BackpropResult {
  const { x1, x2, target, h1, h2, o1 } = forward;

  // 1. Output Delta
  // delta_o1 = o1 * (1 - o1) * (target - o1)
  const deltaO1 = o1 * (1 - o1) * (target - o1);

  // Keep old weights for hidden layer deltas
  const oldWh1 = weights.wh1;
  const oldWh2 = weights.wh2;

  // 2. Output Layer Updates
  const deltaWh1 = learningRate * h1 * deltaO1;
  const deltaWh2 = learningRate * h2 * deltaO1;
  const deltaBo1 = learningRate * deltaO1;

  const newWh1 = oldWh1 + deltaWh1;
  const newWh2 = oldWh2 + deltaWh2;
  const newBo1 = biases.bo1 + deltaBo1;

  // 3. Hidden Layer Deltas using OLD weights
  // delta_hj = hj * (1 - hj) * (old_wj * delta_o1)
  const deltaH1 = h1 * (1 - h1) * (oldWh1 * deltaO1);
  const deltaH2 = h2 * (1 - h2) * (oldWh2 * deltaO1);

  // 4. Hidden Layer Updates
  const deltaW11 = learningRate * x1 * deltaH1;
  const deltaW21 = learningRate * x2 * deltaH1;
  const deltaW12 = learningRate * x1 * deltaH2;
  const deltaW22 = learningRate * x2 * deltaH2;

  const deltaBh1 = learningRate * deltaH1;
  const deltaBh2 = learningRate * deltaH2;

  const newWeights: NetworkWeights = {
    w11: weights.w11 + deltaW11,
    w21: weights.w21 + deltaW21,
    w12: weights.w12 + deltaW12,
    w22: weights.w22 + deltaW22,
    wh1: newWh1,
    wh2: newWh2,
  };

  const newBiases: NetworkBiases = {
    bh1: biases.bh1 + deltaBh1,
    bh2: biases.bh2 + deltaBh2,
    bo1: newBo1,
  };

  const weightDeltas: NetworkWeights = {
    w11: deltaW11,
    w21: deltaW21,
    w12: deltaW12,
    w22: deltaW22,
    wh1: deltaWh1,
    wh2: deltaWh2,
  };

  const biasDeltas: NetworkBiases = {
    bh1: deltaBh1,
    bh2: deltaBh2,
    bo1: deltaBo1,
  };

  return {
    forward,
    deltaO1,
    oldWh1,
    oldWh2,
    deltaH1,
    deltaH2,
    newWeights,
    newBiases,
    weightDeltas,
    biasDeltas,
  };
}

/**
 * Generate 2D decision boundary grid predictions for the XOR plane
 * Evaluates points in [0, 1] x [0, 1] with the given weights and biases
 */
export function generateDecisionGrid(
  weights: NetworkWeights,
  biases: NetworkBiases,
  resolution: number = 30
): { x1: number; x2: number; output: number; classVal: number }[] {
  const points: { x1: number; x2: number; output: number; classVal: number }[] = [];
  const step = 1 / (resolution - 1);

  for (let i = 0; i < resolution; i++) {
    const x2 = 1 - i * step; // Y-axis inverted for standard chart coords
    for (let j = 0; j < resolution; j++) {
      const x1 = j * step;
      const fwd = forwardPass({ id: 'e1', x1, x2, target: 0, label: '' }, weights, biases);
      points.push({
        x1,
        x2,
        output: fwd.o1,
        classVal: fwd.o1 >= 0.5 ? 1 : 0,
      });
    }
  }

  return points;
}

/**
 * Clone weights helper
 */
export function cloneWeights(w: NetworkWeights): NetworkWeights {
  return { ...w };
}

/**
 * Clone biases helper
 */
export function cloneBiases(b: NetworkBiases): NetworkBiases {
  return { ...b };
}

