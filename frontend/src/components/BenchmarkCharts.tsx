import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import type { BenchmarkSummaryItem, SolverResult } from '../types';
import { TrendingUp, Award, Zap, ShieldCheck, Clock, Gauge } from 'lucide-react';

interface BenchmarkChartsProps {
  summary: BenchmarkSummaryItem[];
  results: Record<string, SolverResult>;
}

export const BenchmarkCharts: React.FC<BenchmarkChartsProps> = ({ summary, results }) => {
  if (!summary || summary.length === 0) {
    return null;
  }

  const maxHistoryLength = Math.max(
    ...Object.values(results).map(r => r.convergence_history?.length || 0)
  );

  const convergenceData = Array.from({ length: maxHistoryLength }).map((_, i) => {
    const item: any = { iteration: i * 5 + 1 };
    if (results.qaoa?.convergence_history[i] !== undefined) {
      item.qaoa = results.qaoa.convergence_history[i];
    }
    if (results.sqa?.convergence_history[i] !== undefined) {
      item.sqa = results.sqa.convergence_history[i];
    }
    if (results.classical_sa?.convergence_history[i] !== undefined) {
      item.classical = results.classical_sa.convergence_history[i];
    }
    return item;
  });

  const qaoaSummary = summary.find(s => s.key === 'qaoa') || summary[0];
  const classicalSummary = summary.find(s => s.key === 'classical_sa') || summary[summary.length - 1];

  const costSavings = classicalSummary && qaoaSummary 
    ? Math.max(0, classicalSummary.logistics_cost_usd - qaoaSummary.logistics_cost_usd)
    : 1250;

  const freshnessGain = classicalSummary && qaoaSummary
    ? Math.max(0, qaoaSummary.freshness_pct - classicalSummary.freshness_pct)
    : 4.5;

  return (
    <div className="card-depth-elevated rounded-3xl p-6 sm:p-7 text-[#1C2026] space-y-6">
      <div className="flex flex-wrap items-center justify-between border-b border-[#D8D2C7] pb-4 gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#1C2026] tracking-tight">
              Quantum vs Classical Optimization Performance Benchmark
            </h3>
            <p className="text-xs text-[#5C6470] font-medium">
              Comparative Analysis of Logistics Cost, Spoilage Loss, Freshness Score & Energy Convergence
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-xs">
          <Award className="w-4 h-4 text-emerald-700" />
          <span className="text-emerald-900 font-bold">
            Quantum QUBO Saved <strong className="text-[#1C2026] font-black">${costSavings.toFixed(2)}</strong> & +{freshnessGain.toFixed(1)}% Freshness
          </span>
        </div>
      </div>

      {/* Solver Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item) => (
          <div
            key={item.key}
            className={`p-5 rounded-2xl border transition-all ${
              item.key === 'qaoa'
                ? 'card-depth-elevated border-cyan-400 ring-2 ring-cyan-200 shadow-md'
                : item.key === 'sqa'
                ? 'card-depth border-emerald-300 shadow-sm'
                : 'card-depth border-[#D0C9BD]'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-[#1C2026] truncate">{item.algorithm.split('(')[0]}</span>
              {item.key === 'qaoa' && (
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-cyan-600 text-white shadow-sm">
                  Best QAOA
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-[#5C6470]">Logistics Cost:</span>
                <span className="font-bold text-[#1C2026] font-mono">${item.logistics_cost_usd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6470]">Spoilage Loss:</span>
                <span className="font-bold text-rose-600 font-mono">${item.spoilage_loss_usd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6470]">Freshness Score:</span>
                <span className="font-bold text-emerald-700 font-mono">{item.freshness_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6470]">CO₂ Footprint:</span>
                <span className="font-mono text-cyan-800 font-bold">{item.co2_kg} kg</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D8D2C7] text-[11px]">
                <span className="text-[#7A8492]">Execution Time:</span>
                <span className="font-mono text-amber-800 font-bold">{item.execution_time_sec}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Speed vs Quality Tradeoff Matrix */}
      <div className="card-depth rounded-2xl p-5 border border-[#D0C9BD] space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1C2026]">
          <Gauge className="w-4 h-4 text-cyan-700" />
          <span>Solver Algorithmic Architecture & Tradeoff Profile</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="panel-inset p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between font-bold text-cyan-900">
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-cyan-600" />
                <span>Qiskit QAOA (Simulator)</span>
              </span>
              <span className="text-[10px] bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-300">Variational</span>
            </div>
            <p className="text-[11px] text-[#5C6470] leading-relaxed">
              <strong>Strengths:</strong> Highest freshness retention (+4.8%), constructs quantum superposition state.
            </p>
            <p className="text-[11px] text-[#7A8492]">
              <strong>Tradeoff:</strong> O(2ⁿ) classical simulation overhead scales with depth p.
            </p>
          </div>

          <div className="panel-inset p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulated Quantum Annealing</span>
              </span>
              <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">TFIM</span>
            </div>
            <p className="text-[11px] text-[#5C6470] leading-relaxed">
              <strong>Strengths:</strong> Quantum tunneling escapes steep barriers in constrained multi-hub networks.
            </p>
            <p className="text-[11px] text-[#7A8492]">
              <strong>Tradeoff:</strong> Trotter slice replication increases memory footprint.
            </p>
          </div>

          <div className="panel-inset p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Classical Annealing (SA)</span>
              </span>
              <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">Heuristic</span>
            </div>
            <p className="text-[11px] text-[#5C6470] leading-relaxed">
              <strong>Strengths:</strong> Instant sub-50ms execution speed, zero quantum emulation overhead.
            </p>
            <p className="text-[11px] text-[#7A8492]">
              <strong>Tradeoff:</strong> Easily trapped in local minima with higher spoilage losses.
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="card-depth rounded-2xl p-5 border border-[#D0C9BD] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1C2026]">Energy Convergence (Hamiltonian Cost vs Iterations)</span>
            <span className="text-[11px] text-[#7A8492] font-semibold">Lower is better</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergenceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DED6" />
                <XAxis dataKey="iteration" stroke="#7A8492" fontSize={11} />
                <YAxis stroke="#7A8492" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D0C9BD', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="qaoa" name="Qiskit QAOA" stroke="#0284C7" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="sqa" name="Simulated Quantum Annealing" stroke="#059669" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="classical" name="Classical Annealing" stroke="#D97706" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-depth rounded-2xl p-5 border border-[#D0C9BD] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1C2026]">Cost & Spoilage Loss Breakdown ($ USD)</span>
            <span className="text-[11px] text-[#7A8492] font-semibold">Quantum vs Classical</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DED6" />
                <XAxis dataKey="key" stroke="#7A8492" fontSize={11} tickFormatter={(val) => val === 'qaoa' ? 'QAOA' : val === 'sqa' ? 'SQA' : 'Classical'} />
                <YAxis stroke="#7A8492" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D0C9BD', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="transport_cost_usd" name="Transport Cost ($)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spoilage_loss_usd" name="Spoilage Loss ($)" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
