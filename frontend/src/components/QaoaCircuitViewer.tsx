import React from 'react';
import type { SolverResult } from '../types';
import { Cpu } from 'lucide-react';

interface QaoaCircuitViewerProps {
  qaoaResult: SolverResult | null;
}

export const QaoaCircuitViewer: React.FC<QaoaCircuitViewerProps> = ({ qaoaResult }) => {
  if (!qaoaResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
        <p className="text-sm">Run QAOA Quantum Solver to view gate circuit and measurement probabilities.</p>
      </div>
    );
  }

  const pLayers = qaoaResult.p_layers || 2;
  const gammas = qaoaResult.optimal_gammas || [0.42, 0.31];
  const betas = qaoaResult.optimal_betas || [0.28, 0.15];
  const stateProbs = qaoaResult.top_state_probabilities || [];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base bg-gradient-to-r from-cyan-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
              QAOA Quantum Circuit & Measurement Inspector
            </h3>
            <p className="text-xs text-slate-400">
              Qiskit Parametric Quantum Circuit with depth p = {pLayers} variational layers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold">
            Execution Time: {qaoaResult.execution_time_sec}s
          </span>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold text-cyan-400">Quantum Circuit Gate Pipeline</span>
          <span className="font-mono text-slate-500">State: |ψ(γ, β)⟩ = ∏ U(B, β_i) U(C, γ_i) |+⟩^N</span>
        </div>

        <div className="flex items-center space-x-3 py-3 px-2 min-w-[600px] border border-slate-800/80 rounded-lg bg-slate-900/60 font-mono text-xs">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] text-slate-400">State Prep</span>
            <div className="w-12 h-10 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 shadow">
              |+⟩ⁿ
            </div>
          </div>

          <div className="text-slate-600 font-bold">→</div>

          {Array.from({ length: pLayers }).map((_, layerIdx) => (
            <React.Fragment key={layerIdx}>
              <div className="flex flex-col items-center space-y-1 flex-1">
                <span className="text-[10px] text-indigo-400 font-sans">Layer {layerIdx + 1}: U(C, γ_{layerIdx + 1})</span>
                <div className="w-full h-10 rounded bg-indigo-950 border border-indigo-500/40 flex items-center justify-center px-3 space-x-2 text-indigo-200 font-bold shadow">
                  <span>R_z(2γQ)</span>
                  <span className="text-[10px] text-indigo-400">γ = {gammas[layerIdx] ?? '0.4'}</span>
                </div>
              </div>

              <div className="text-slate-600 font-bold">→</div>

              <div className="flex flex-col items-center space-y-1 flex-1">
                <span className="text-[10px] text-emerald-400 font-sans">Layer {layerIdx + 1}: U(B, β_{layerIdx + 1})</span>
                <div className="w-full h-10 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center px-3 space-x-2 text-emerald-200 font-bold shadow">
                  <span>R_x(2β)</span>
                  <span className="text-[10px] text-emerald-400">β = {betas[layerIdx] ?? '0.2'}</span>
                </div>
              </div>

              {layerIdx < pLayers - 1 && <div className="text-slate-600 font-bold">→</div>}
            </React.Fragment>
          ))}

          <div className="text-slate-600 font-bold">→</div>

          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] text-amber-400">Measure</span>
            <div className="w-14 h-10 rounded bg-amber-950 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 shadow">
              M(1024)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {gammas.map((g, idx) => (
            <div key={`g-${idx}`} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div className="text-slate-400 text-[10px]">Gamma Angle γ_{idx + 1}</div>
              <div className="text-cyan-400 font-mono font-bold text-sm">{g} rad</div>
            </div>
          ))}
          {betas.map((b, idx) => (
            <div key={`b-${idx}`} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div className="text-slate-400 text-[10px]">Beta Angle β_{idx + 1}</div>
              <div className="text-emerald-400 font-mono font-bold text-sm">{b} rad</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Top Sampled Quantum State Bitstrings</span>
          <span>Optimal State: <strong className="text-emerald-400 font-mono">{qaoaResult.bitstring}</strong></span>
        </div>

        <div className="space-y-2">
          {stateProbs.map((sp, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-300">State |{sp.state}⟩</span>
                <span className="text-slate-400 font-bold">{(sp.probability * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, sp.probability * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
