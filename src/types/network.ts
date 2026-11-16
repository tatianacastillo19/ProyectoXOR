export interface XORExample {
  id: 'e1' | 'e2' | 'e3' | 'e4';
  x1: number;
  x2: number;
  target: number;
  label: string;
}

export type TrainingOrderType = 'original' | 'pdf_demo';

export interface NetworkWeights {
  // Layer 1 (Input -> Hidden)
  w11: number; // i1 -> h1
  w21: number; // i2 -> h1
  w12: number; // i1 -> h2
  w22: number; // i2 -> h2

  // Layer 2 (Hidden -> Output)
  wh1: number; // h1 -> o1
  wh2: number; // h2 -> o1
}

export interface NetworkBiases {
  bh1: number; // bias h1
  bh2: number; // bias h2
  bo1: number; // bias o1
}

export interface ForwardResult {
  x1: number;
  x2: number;
  target: number;

  // Hidden 1
  zh1: number;
  h1: number;

  // Hidden 2
  zh2: number;
  h2: number;

  // Output
  zo1: number;
  o1: number;

  // Error
  error: number; // target - o1
  squaredError: number; // (target - o1)^2
}

export interface BackpropResult {
  forward: ForwardResult;

  // Output delta
  deltaO1: number;

  // Old weights used for hidden deltas (critical academic requirement)
  oldWh1: number;
  oldWh2: number;

  // Hidden deltas
  deltaH1: number;
  deltaH2: number;

  // New parameters
  newWeights: NetworkWeights;
  newBiases: NetworkBiases;

  // Delta changes
  weightDeltas: NetworkWeights;
  biasDeltas: NetworkBiases;
}

export type StepSubPhase =
  | 'input_selection'
  | 'calc_h1'
  | 'calc_h2'
  | 'calc_o1'
  | 'calc_error'
  | 'delta_output'
  | 'delta_hidden'
  | 'update_params'
  | 'new_state';

export interface IterationSnapshot {
  iteration: number;
  epoch: number;
  example: XORExample;
  weightsBefore: NetworkWeights;
  biasesBefore: NetworkBiases;
  forward: ForwardResult;
  backprop: BackpropResult;
  weightsAfter: NetworkWeights;
  biasesAfter: NetworkBiases;
  globalMSEBefore: number;
  globalMSEAfter: number;
}

export interface EpochRecord {
  epoch: number;
  mse: number;
  weights: NetworkWeights;
  biases: NetworkBiases;
  allOutputs: { exampleId: string; target: number; output: number; correct: boolean }[];
  allCorrect: boolean;
}

export interface TrainingConfig {
  learningRate: number; // alpha (default 0.25)
  targetMSE: number; // (default 0.01)
  maxEpochs: number; // (default 100000)
  orderType: TrainingOrderType;
  classificationThreshold: number; // 0.5
}

