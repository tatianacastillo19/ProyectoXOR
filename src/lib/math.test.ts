import { describe, it, expect } from 'vitest';
import {
  XOR_DATASET,
  INITIAL_WEIGHTS,
  INITIAL_BIASES,
  DEFAULT_LEARNING_RATE,
  forwardPass,
  backpropagate,
  calculateGlobalMSE,
} from './math';

describe('XOR Neural Network Math Engine', () => {
  it('Validates First Iteration (e1: [0, 1] -> 1) against Professor specifications', () => {
    const e1 = XOR_DATASET.e1;
    const fwd1 = forwardPass(e1, INITIAL_WEIGHTS, INITIAL_BIASES);

    // Checks from prompt Section 7 & 16:
    // zh1 = (0 * 0.3) + (1 * 0.6) + 0.1 = 0.7
    expect(fwd1.zh1).toBeCloseTo(0.7, 4);
    // h1 = sigma(0.7) ≈ 0.6682
    expect(fwd1.h1).toBeCloseTo(0.6682, 3);

    // zh2 = (0 * 0.2) + (1 * -0.4) + 0.1 = -0.3
    expect(fwd1.zh2).toBeCloseTo(-0.3, 4);
    // h2 = sigma(-0.3) ≈ 0.4256
    expect(fwd1.h2).toBeCloseTo(0.4256, 3);

    // zo1 = (0.6682 * 0.5) + (0.4256 * 0.7) + 0.1 ≈ 0.7320
    expect(fwd1.zo1).toBeCloseTo(0.732, 3);
    // o1 = sigma(0.7320) ≈ 0.6752
    expect(fwd1.o1).toBeCloseTo(0.6752, 3);

    // Error = 1 - 0.6752 ≈ 0.3248
    expect(fwd1.error).toBeCloseTo(0.3248, 3);

    // Backprop
    const bp1 = backpropagate(fwd1, INITIAL_WEIGHTS, INITIAL_BIASES, DEFAULT_LEARNING_RATE);

    // Output delta delta_o1 ≈ 0.0712
    expect(bp1.deltaO1).toBeCloseTo(0.0712, 3);

    // New W2 weights:
    // wh1 ≈ 0.5119
    expect(bp1.newWeights.wh1).toBeCloseTo(0.5119, 3);
    // wh2 ≈ 0.7076
    expect(bp1.newWeights.wh2).toBeCloseTo(0.7076, 3);
    // bo1 ≈ 0.1178
    expect(bp1.newBiases.bo1).toBeCloseTo(0.1178, 3);

    // New W1 weights:
    // w11 = 0.3000
    expect(bp1.newWeights.w11).toBeCloseTo(0.3, 4);
    // w21 ≈ 0.6020
    expect(bp1.newWeights.w21).toBeCloseTo(0.602, 3);
    // w12 = 0.2000
    expect(bp1.newWeights.w12).toBeCloseTo(0.2, 4);
    // w22 ≈ -0.3970
    expect(bp1.newWeights.w22).toBeCloseTo(-0.397, 3);

    // New Hidden Biases:
    // bh1 ≈ 0.1020
    expect(bp1.newBiases.bh1).toBeCloseTo(0.102, 3);
    // bh2 ≈ 0.1031
    expect(bp1.newBiases.bh2).toBeCloseTo(0.1031, 3);
  });

  it('Validates Second Iteration (e3: [1, 1] -> 0) in PDF demo order', () => {
    // 1st iteration on e1
    const e1 = XOR_DATASET.e1;
    const fwd1 = forwardPass(e1, INITIAL_WEIGHTS, INITIAL_BIASES);
    const bp1 = backpropagate(fwd1, INITIAL_WEIGHTS, INITIAL_BIASES, DEFAULT_LEARNING_RATE);

    // 2nd iteration on e3 with updated weights
    const e3 = XOR_DATASET.e3;
    const fwd2 = forwardPass(e3, bp1.newWeights, bp1.newBiases);

    // Section 10 verification:
    // h1 ≈ 0.7318
    expect(fwd2.h1).toBeCloseTo(0.7318, 3);
    // h2 ≈ 0.4765
    expect(fwd2.h2).toBeCloseTo(0.4765, 3);
  });

  it('Calculates Global MSE with all 4 XOR samples consistently', () => {
    const res = calculateGlobalMSE(INITIAL_WEIGHTS, INITIAL_BIASES);
    expect(res.evaluations).toHaveLength(4);
    expect(res.mse).toBeGreaterThan(0);
    // Initial network should not classify all correctly
    expect(res.allCorrect).toBe(false);
  });

  it('Verifies error reduction and gradient descent progression', () => {
    let w = { ...INITIAL_WEIGHTS };
    let b = { ...INITIAL_BIASES };
    const examples = [XOR_DATASET.e1, XOR_DATASET.e2, XOR_DATASET.e3, XOR_DATASET.e4];

    const initialMSE = calculateGlobalMSE(w, b).mse;

    // Train for 500 epochs
    for (let epoch = 0; epoch < 500; epoch++) {
      for (const ex of examples) {
        const fwd = forwardPass(ex, w, b);
        const bp = backpropagate(fwd, w, b, DEFAULT_LEARNING_RATE);
        w = bp.newWeights;
        b = bp.newBiases;
      }
    }

    const midMSE = calculateGlobalMSE(w, b).mse;
    // Error must decrease with gradient descent
    expect(midMSE).toBeLessThan(initialMSE);
  });
});
