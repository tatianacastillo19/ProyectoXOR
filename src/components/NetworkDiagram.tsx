import React, { useState, useRef } from 'react';
import {
  NetworkWeights,
  NetworkBiases,
  ForwardResult,
  BackpropResult,
  StepSubPhase,
} from '../types/network';
import { exportSvgToPng } from '../lib/export';
import { MathView } from './MathView';
import { Download, Info, Check, Eye } from 'lucide-react';

interface NetworkDiagramProps {
  weights: NetworkWeights;
  biases: NetworkBiases;
  previousWeights?: NetworkWeights | null;
  previousBiases?: NetworkBiases | null;
  forwardResult?: ForwardResult | null;
  backpropResult?: BackpropResult | null;
  subPhase?: StepSubPhase;
  learningRate: number;
  highlightChanges?: boolean;
}

type SelectedElement =
  | { type: 'connection'; id: 'w11' | 'w21' | 'w12' | 'w22' | 'wh1' | 'wh2' }
  | { type: 'neuron'; id: 'i1' | 'i2' | 'h1' | 'h2' | 'o1' }
  | null;

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  weights,
  biases,
  previousWeights,
  previousBiases,
  forwardResult,
  backpropResult,
  subPhase = 'input_selection',
  learningRate,
  highlightChanges = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<SelectedElement>(null);

  // Neuron coordinates
  const nodes = {
    i1: { x: 130, y: 150, label: 'i₁', name: 'Entrada 1' },
    i2: { x: 130, y: 350, label: 'i₂', name: 'Entrada 2' },
    h1: { x: 480, y: 150, label: 'h₁', name: 'Oculta 1' },
    h2: { x: 480, y: 350, label: 'h₂', name: 'Oculta 2' },
    o1: { x: 830, y: 250, label: 'o₁', name: 'Salida' },
  };

  const isForwardPhase = [
    'input_selection',
    'calc_h1',
    'calc_h2',
    'calc_o1',
    'calc_error',
  ].includes(subPhase);

  const isBackpropPhase = ['delta_output', 'delta_hidden', 'update_params'].includes(subPhase);

  // Check if a connection is actively highlighted in the current step
  const isConnectionActive = (connId: string) => {
    if (subPhase === 'calc_h1' && (connId === 'w11' || connId === 'w21')) return true;
    if (subPhase === 'calc_h2' && (connId === 'w12' || connId === 'w22')) return true;
    if (subPhase === 'calc_o1' && (connId === 'wh1' || connId === 'wh2')) return true;
    if (subPhase === 'delta_output' && (connId === 'wh1' || connId === 'wh2')) return true;
    if (subPhase === 'delta_hidden' && (connId === 'w11' || connId === 'w21' || connId === 'w12' || connId === 'w22')) return true;
    if (subPhase === 'update_params') return true;
    return false;
  };

  // Determine weight change details
  const getWeightChange = (key: keyof NetworkWeights) => {
    const current = weights[key];
    const prev = previousWeights ? previousWeights[key] : null;
    const changed = prev !== null && Math.abs(current - prev) > 1e-6;
    return { current, prev, changed };
  };

  const getBiasChange = (key: keyof NetworkBiases) => {
    const current = biases[key];
    const prev = previousBiases ? previousBiases[key] : null;
    const changed = prev !== null && Math.abs(current - prev) > 1e-6;
    return { current, prev, changed };
  };

  const handleDownload = () => {
    if (svgRef.current) {
      exportSvgToPng(svgRef.current, 'diagrama_red_neuronal_xor.png');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm  relative">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600  shadow-sm"></div>
          <h3 className="text-lg font-bold text-slate-900 tracking-wide">
            Diagrama Neuronal Interactivo (Arquitectura 2–2–1)
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {isForwardPhase ? 'Paso Adelante (Forward)' : isBackpropPhase ? 'Retropropagación (Backprop)' : 'Estado Estable'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Haz clic en cualquier neurona o conexión para inspeccionar fórmulas
          </span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 transition-colors border border-slate-200 hover:border-blue-300"
            title="Descargar diagrama en PNG de alta resolución"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Descargar PNG
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 960 500"
          className="w-full min-w-[760px] h-auto select-none"
          style={{ maxHeight: '520px' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="connGradientNormal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="connGradientActiveFwd" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="connGradientActiveBack" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
            </linearGradient>

            {/* Neuron Gradients */}
            <radialGradient id="neuronInputGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="70%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </radialGradient>

            <radialGradient id="neuronHiddenGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#4338ca" />
            </radialGradient>

            <radialGradient id="neuronOutputGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>

            {/* Arrowhead Markers */}
            <marker id="arrow-normal" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
            </marker>

            <marker id="arrow-fwd" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
            </marker>

            <marker id="arrow-back" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#e11d48" />
            </marker>

            <marker id="arrow-updated" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#d97706" />
            </marker>

            {/* Filter Glow */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Layer Grid lines for depth */}
          <line x1="130" y1="40" x2="130" y2="460" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
          <line x1="480" y1="40" x2="480" y2="460" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
          <line x1="830" y1="40" x2="830" y2="460" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />

          {/* Layer Headers */}
          <text x="130" y="55" textAnchor="middle" fill="#2563eb" fontSize="13" fontWeight="bold" letterSpacing="1">
            CAPA DE ENTRADA (2)
          </text>
          <text x="480" y="55" textAnchor="middle" fill="#6366f1" fontSize="13" fontWeight="bold" letterSpacing="1">
            CAPA OCULTA (2)
          </text>
          <text x="830" y="55" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="bold" letterSpacing="1">
            CAPA DE SALIDA (1)
          </text>

          {/* ================= CONNECTIONS ================= */}
          {/* Connection specs */}
          {[
            { id: 'w11' as const, from: nodes.i1, to: nodes.h1, midYOffset: -24, label: 'w₁₁' },
            { id: 'w12' as const, from: nodes.i1, to: nodes.h2, midYOffset: -16, label: 'w₁₂' },
            { id: 'w21' as const, from: nodes.i2, to: nodes.h1, midYOffset: 16, label: 'w₂₁' },
            { id: 'w22' as const, from: nodes.i2, to: nodes.h2, midYOffset: 24, label: 'w₂₂' },
            { id: 'wh1' as const, from: nodes.h1, to: nodes.o1, midYOffset: -22, label: 'w_h1o1' },
            { id: 'wh2' as const, from: nodes.h2, to: nodes.o1, midYOffset: 22, label: 'w_h2o1' },
          ].map((conn) => {
            const { id, from, to, midYOffset, label } = conn;
            const { current, prev, changed } = getWeightChange(id);
            const active = isConnectionActive(id);
            const isSelected = selected?.type === 'connection' && selected.id === id;

            // Connection coordinates
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 + midYOffset;

            // Stroke style
            let strokeColor = '#64748b';
            let strokeWidth = isSelected ? 3.5 : active ? 3 : 2;
            let marker = 'url(#arrow-normal)';
            let dashArray = 'none';

            if (changed && highlightChanges) {
              strokeColor = '#d97706'; // Amber
              marker = 'url(#arrow-updated)';
            } else if (active) {
              if (isBackpropPhase) {
                strokeColor = '#e11d48'; // Pink/Rose
                marker = 'url(#arrow-back)';
                dashArray = '6 4';
              } else {
                strokeColor = '#2563eb'; // Cyan
                marker = 'url(#arrow-fwd)';
                dashArray = '6 4';
              }
            } else if (isSelected) {
              strokeColor = '#2563eb';
            }

            return (
              <g
                key={id}
                className="cursor-pointer group"
                onClick={() => setSelected({ type: 'connection', id })}
              >
                {/* Thick invisible hit line for easy click */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Visible connection line */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  markerEnd={marker}
                  className={active ? (isBackpropPhase ? 'animate-dash' : 'animate-dash') : ''}
                  filter={isSelected || active ? 'url(#glowEffect)' : undefined}
                />

                {/* Weight badge pill */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-42"
                    y="-13"
                    width="84"
                    height="26"
                    rx="13"
                    fill={
                      changed && highlightChanges
                        ? '#fef3c7'
                        : isSelected
                        ? '#2563eb'
                        : active
                        ? '#f8fafc'
                        : '#e2e8f0'
                    }
                    stroke={
                      changed && highlightChanges
                        ? '#d97706'
                        : isSelected
                        ? '#2563eb'
                        : active
                        ? '#2563eb'
                        : '#cbd5e1'
                    }
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-200 group-hover:stroke-blue-600 group-hover:scale-105"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={changed && highlightChanges ? '#92400e' : isSelected ? '#ffffff' : '#1e293b'}
                    fontSize="11.5"
                    fontFamily="monospace"
                    fontWeight={changed || isSelected ? 'bold' : 'normal'}
                  >
                    {changed && prev !== null ? (
                      `${prev.toFixed(3)} → ${current.toFixed(3)}`
                    ) : (
                      `${label}=${current.toFixed(4)}`
                    )}
                  </text>
                </g>
              </g>
            );
          })}

          {/* ================= NEURONS ================= */}
          {/* Input Neurons: i1 & i2 */}
          {(['i1', 'i2'] as const).map((id) => {
            const node = nodes[id];
            const isSelected = selected?.type === 'neuron' && selected.id === id;
            const val = forwardResult ? (id === 'i1' ? forwardResult.x1 : forwardResult.x2) : null;

            return (
              <g
                key={id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => setSelected({ type: 'neuron', id })}
              >
                <circle
                  r="36"
                  fill="url(#neuronInputGrad)"
                  stroke={isSelected ? '#1d4ed8' : '#2563eb'}
                  strokeWidth={isSelected ? 3.5 : 2}
                  filter={isSelected ? 'url(#glowEffect)' : undefined}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="17"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
                <text
                  x="0"
                  y="16"
                  textAnchor="middle"
                  fill="#dbeafe"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {val !== null ? `x=${val}` : 'Entrada'}
                </text>
              </g>
            );
          })}

          {/* Hidden Neurons: h1 & h2 */}
          {(['h1', 'h2'] as const).map((id) => {
            const node = nodes[id];
            const isSelected = selected?.type === 'neuron' && selected.id === id;
            const biasKey = id === 'h1' ? 'bh1' : 'bh2';
            const { current: currentB, prev: prevB, changed: biasChanged } = getBiasChange(biasKey);

            const zVal = forwardResult ? (id === 'h1' ? forwardResult.zh1 : forwardResult.zh2) : null;
            const hVal = forwardResult ? (id === 'h1' ? forwardResult.h1 : forwardResult.h2) : null;
            const deltaH = backpropResult ? (id === 'h1' ? backpropResult.deltaH1 : backpropResult.deltaH2) : null;

            const isCurrentStep =
              (subPhase === 'calc_h1' && id === 'h1') ||
              (subPhase === 'calc_h2' && id === 'h2') ||
              subPhase === 'delta_hidden';

            return (
              <g
                key={id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => setSelected({ type: 'neuron', id })}
              >
                {/* Bias Badge attached above neuron */}
                <g transform="translate(0, -52)">
                  <rect
                    x="-44"
                    y="-11"
                    width="88"
                    height="22"
                    rx="11"
                    fill={biasChanged && highlightChanges ? '#fef3c7' : '#eef2ff'}
                    stroke={biasChanged && highlightChanges ? '#d97706' : '#6366f1'}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={biasChanged && highlightChanges ? '#92400e' : '#4338ca'}
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {biasChanged && prevB !== null
                      ? `b: ${prevB.toFixed(3)}→${currentB.toFixed(3)}`
                      : `b=${currentB.toFixed(4)}`}
                  </text>
                </g>

                {/* Neuron circle */}
                <circle
                  r="40"
                  fill="url(#neuronHiddenGrad)"
                  stroke={isSelected ? '#4338ca' : isCurrentStep ? '#4f46e5' : '#6366f1'}
                  strokeWidth={isSelected || isCurrentStep ? 3.5 : 2}
                  filter={isSelected || isCurrentStep ? 'url(#glowEffect)' : undefined}
                  className="transition-transform duration-200 group-hover:scale-105"
                />

                <text
                  x="0"
                  y="-10"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="17"
                  fontWeight="bold"
                >
                  {node.label}
                </text>

                <text
                  x="0"
                  y="8"
                  textAnchor="middle"
                  fill="#e0e7ff"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {zVal !== null ? `z=${zVal.toFixed(3)}` : 'σ(z)'}
                </text>

                <text
                  x="0"
                  y="23"
                  textAnchor="middle"
                  fill="#fce7f3"
                  fontSize="11.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {hVal !== null ? `a=${hVal.toFixed(4)}` : ''}
                </text>

                {/* Delta badge during backprop */}
                {deltaH !== null && isBackpropPhase && (
                  <g transform="translate(0, 54)">
                    <rect
                      x="-36"
                      y="-10"
                      width="72"
                      height="20"
                      rx="10"
                      fill="#ffe4e6"
                      stroke="#e11d48"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#9f1239"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      δ={deltaH.toFixed(4)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Output Neuron: o1 */}
          {(() => {
            const node = nodes.o1;
            const isSelected = selected?.type === 'neuron' && selected.id === 'o1';
            const { current: currentB, prev: prevB, changed: biasChanged } = getBiasChange('bo1');

            const zVal = forwardResult ? forwardResult.zo1 : null;
            const oVal = forwardResult ? forwardResult.o1 : null;
            const targetVal = forwardResult ? forwardResult.target : null;
            const errorVal = forwardResult ? forwardResult.error : null;
            const deltaO = backpropResult ? backpropResult.deltaO1 : null;

            const isCurrentStep =
              subPhase === 'calc_o1' || subPhase === 'calc_error' || subPhase === 'delta_output';

            return (
              <g
                key="o1"
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => setSelected({ type: 'neuron', id: 'o1' })}
              >
                {/* Bias Badge attached above neuron */}
                <g transform="translate(0, -56)">
                  <rect
                    x="-44"
                    y="-11"
                    width="88"
                    height="22"
                    rx="11"
                    fill={biasChanged && highlightChanges ? '#fef3c7' : '#047857'}
                    stroke={biasChanged && highlightChanges ? '#d97706' : '#10b981'}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={biasChanged && highlightChanges ? '#92400e' : '#d1fae5'}
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {biasChanged && prevB !== null
                      ? `b: ${prevB.toFixed(3)}→${currentB.toFixed(3)}`
                      : `b=${currentB.toFixed(4)}`}
                  </text>
                </g>

                {/* Neuron Circle */}
                <circle
                  r="44"
                  fill="url(#neuronOutputGrad)"
                  stroke={isSelected ? '#047857' : isCurrentStep ? '#059669' : '#10b981'}
                  strokeWidth={isSelected || isCurrentStep ? 3.5 : 2}
                  filter={isSelected || isCurrentStep ? 'url(#glowEffect)' : undefined}
                  className="transition-transform duration-200 group-hover:scale-105"
                />

                <text
                  x="0"
                  y="-12"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="18"
                  fontWeight="bold"
                >
                  {node.label}
                </text>

                <text
                  x="0"
                  y="6"
                  textAnchor="middle"
                  fill="#d1fae5"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {zVal !== null ? `z=${zVal.toFixed(3)}` : 'σ(z)'}
                </text>

                <text
                  x="0"
                  y="22"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {oVal !== null ? `y=${oVal.toFixed(4)}` : 'Salida'}
                </text>

                {/* Expected & Error badge to the right */}
                {targetVal !== null && (
                  <g transform="translate(70, -10)">
                    <rect
                      x="0"
                      y="-16"
                      width="68"
                      height="36"
                      rx="8"
                      fill="#f8fafc"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <text x="34" y="-2" textAnchor="middle" fill="#475569" fontSize="10">
                      t={targetVal}
                    </text>
                    <text
                      x="34"
                      y="13"
                      textAnchor="middle"
                      fill={errorVal !== null && Math.abs(errorVal) < 0.2 ? '#16a34a' : '#dc2626'}
                      fontSize="10.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {errorVal !== null ? `e=${errorVal.toFixed(3)}` : ''}
                    </text>
                  </g>
                )}

                {/* Delta badge during backprop */}
                {deltaO !== null && isBackpropPhase && (
                  <g transform="translate(0, 58)">
                    <rect
                      x="-38"
                      y="-10"
                      width="76"
                      height="20"
                      rx="10"
                      fill="#ffe4e6"
                      stroke="#e11d48"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#9f1239"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      δ_o1={deltaO.toFixed(4)}
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Selected Element Interactive Inspector Panel */}
      {selected && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50/80 border border-blue-200 text-sm animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-slate-800">
                {selected.type === 'connection'
                  ? `Detalle Matemático de Conexión (${selected.id.toUpperCase()})`
                  : `Detalle Matemático de Neurona (${selected.id.toUpperCase()})`}
              </h4>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-slate-500 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100"
            >
              Cerrar
            </button>
          </div>

          {selected.type === 'connection' && (() => {
            const id = selected.id;
            const currentW = weights[id];
            const prevW = previousWeights ? previousWeights[id] : currentW;
            const isOutputLayer = id === 'wh1' || id === 'wh2';

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 mb-1">
                    Fórmula de actualización de peso (Regla Delta Generalizada):
                  </p>
                  <MathView
                    math={
                      isOutputLayer
                        ? 'w_{hj \\to o1}^{nuevo} = w_{hj \\to o1}^{ant} + \\alpha \\cdot h_j \\cdot \\delta_{o1}'
                        : 'w_{xi \\to hj}^{nuevo} = w_{xi \\to hj}^{ant} + \\alpha \\cdot x_i \\cdot \\delta_{hj}'
                    }
                    block
                  />
                  <div className="mt-2 text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="text-slate-500">Peso anterior:</span>{' '}
                      <span className="font-mono text-blue-700">{prevW.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tasa de aprendizaje (α):</span>{' '}
                      <span className="font-mono text-blue-700">{learningRate}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/90 p-3 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1">Sustitución y cálculo real:</p>
                  {backpropResult ? (
                    <div className="text-xs text-slate-800 space-y-1.5 font-mono">
                      {isOutputLayer ? (
                        <>
                          <p>
                            {id === 'wh1' ? 'h₁' : 'h₂'} ={' '}
                            {(id === 'wh1' ? forwardResult?.h1 : forwardResult?.h2)?.toFixed(6)}
                          </p>
                          <p>δ_{'{o1}'} = {backpropResult.deltaO1.toFixed(6)}</p>
                          <p className="text-amber-700">
                            Δw = {learningRate} ×{' '}
                            {(id === 'wh1' ? forwardResult?.h1 : forwardResult?.h2)?.toFixed(4)} ×{' '}
                            {backpropResult.deltaO1.toFixed(4)} ={' '}
                            {(id === 'wh1' ? backpropResult.weightDeltas.wh1 : backpropResult.weightDeltas.wh2).toFixed(6)}
                          </p>
                          <p className="text-emerald-700 font-bold">
                            w_{'{nuevo}'} = {prevW.toFixed(6)} +{' '}
                            {(id === 'wh1' ? backpropResult.weightDeltas.wh1 : backpropResult.weightDeltas.wh2).toFixed(6)}{' '}
                            ={' '}
                            {(id === 'wh1' ? backpropResult.newWeights.wh1 : backpropResult.newWeights.wh2).toFixed(6)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            {id.startsWith('w1') ? 'x₁' : 'x₂'} ={' '}
                            {id.startsWith('w1') ? forwardResult?.x1 : forwardResult?.x2}
                          </p>
                          <p>
                            δ_{'{'}{id.endsWith('1') ? 'h1' : 'h2'}{'}'} ={' '}
                            {(id.endsWith('1') ? backpropResult.deltaH1 : backpropResult.deltaH2).toFixed(6)}
                          </p>
                          <p className="text-emerald-700 font-bold">
                            w_{'{nuevo}'} = {currentW.toFixed(6)}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Ejecuta el Forward Pass y la Retropropagación para ver la sustitución paso a paso.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {selected.type === 'neuron' && (() => {
            const id = selected.id;
            return (
              <div className="space-y-2 text-xs">
                {id.startsWith('i') ? (
                  <p className="text-slate-700">
                    Neurona de entrada <span className="font-mono text-blue-700">{id}</span>. Recibe directamente la señal binaria del conjunto de datos XOR sin aplicar transformación ni sesgo.
                  </p>
                ) : id.startsWith('h') ? (
                  <div>
                    <p className="text-slate-700 mb-1">
                      Cálculo de activación sigmoide en neurona oculta {id}:
                    </p>
                    <MathView
                      math={`z_{${id}} = x_1 w_{1${id[1]}} + x_2 w_{2${id[1]}} + b_{${id}}`}
                      block
                    />
                    <MathView
                      math={`${id} = \\sigma(z_{${id}}) = \\frac{1}{1 + e^{-z_{${id}}}}`}
                      block
                    />
                    {forwardResult && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-2 font-mono text-slate-800">
                        z = {(id === 'h1' ? forwardResult.zh1 : forwardResult.zh2).toFixed(6)} →{' '}
                        <span className="text-blue-700 font-bold">
                          a = {(id === 'h1' ? forwardResult.h1 : forwardResult.h2).toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-700 mb-1">
                      Cálculo de la neurona de salida o₁:
                    </p>
                    <MathView
                      math="z_{o1} = h_1 w_{h1o1} + h_2 w_{h2o1} + b_{o1}"
                      block
                    />
                    <MathView
                      math="o_1 = \sigma(z_{o1}) = \frac{1}{1 + e^{-z_{o1}}}"
                      block
                    />
                    {forwardResult && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-2 font-mono text-slate-800">
                        z_o1 = {forwardResult.zo1.toFixed(6)} →{' '}
                        <span className="text-emerald-700 font-bold">
                          o₁ = {forwardResult.o1.toFixed(6)}
                        </span>{' '}
                        | Error (t - o₁) ={' '}
                        <span className="text-amber-700">{forwardResult.error.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Real-time Parameter Matrices Display underneath diagram */}
      <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Matrix W1 */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700">Matriz W₁ (Entrada → Oculta)</span>
            <span className="text-[10px] text-slate-500">2×2</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center font-mono">
            <div className="bg-slate-50/90 py-1.5 px-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">w₁₁ (i₁→h₁)</span>
              <span className="text-blue-700 font-bold">{weights.w11.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50/90 py-1.5 px-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">w₁₂ (i₁→h₂)</span>
              <span className="text-blue-700 font-bold">{weights.w12.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50/90 py-1.5 px-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">w₂₁ (i₂→h₁)</span>
              <span className="text-blue-700 font-bold">{weights.w21.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50/90 py-1.5 px-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">w₂₂ (i₂→h₂)</span>
              <span className="text-blue-700 font-bold">{weights.w22.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Matrix W2 */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700">Matriz W₂ (Oculta → Salida)</span>
            <span className="text-[10px] text-slate-500">2×1</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center font-mono">
            <div className="bg-slate-50/90 py-2.5 px-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">w_h1o1 (h₁→o₁)</span>
              <span className="text-emerald-700 font-bold">{weights.wh1.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50/90 py-2.5 px-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">w_h2o1 (h₂→o₁)</span>
              <span className="text-emerald-700 font-bold">{weights.wh2.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Vector of Biases */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700">Vector de Sesgos (B₁, B₂)</span>
            <span className="text-[10px] text-slate-500">3 valores</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-slate-50/90 py-2.5 px-1.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">b_h1</span>
              <span className="text-indigo-700 font-bold">{biases.bh1.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50/90 py-2.5 px-1.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">b_h2</span>
              <span className="text-indigo-700 font-bold">{biases.bh2.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50/90 py-2.5 px-1.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">b_o1</span>
              <span className="text-emerald-700 font-bold">{biases.bo1.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

