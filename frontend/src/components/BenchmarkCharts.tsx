import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import type { BenchmarkSummaryItem, SolverResult } from '../types';
import { TrendingUp, Award } from 'lucide-react';

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
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Quantum vs Classical Optimization Performance Benchmark
            </h3>
            <p className="text-xs text-slate-400">
              Comparative Analysis of Logistics Cost, Spoilage Loss, Freshness Score & Energy Convergence
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 font-semibold">
            Quantum QUBO Saved <strong className="text-white font-extrabold">${costSavings.toFixed(2)}</strong> & +{freshnessGain.toFixed(1)}% Freshness
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item) => (
          <div
            key={item.key}
            className={`p-4 rounded-xl border transition-all ${
              item.key === 'qaoa'
                ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                : item.key === 'sqa'
                ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-300 truncate">{item.algorithm.split('(')[0]}</span>
              {item.key === 'qaoa' && (
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950">
                  Best QAOA
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Logistics Cost:</span>
                <span className="font-bold text-white font-mono">${item.logistics_cost_usd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spoilage Loss:</span>
                <span className="font-semibold text-rose-400 font-mono">${item.spoilage_loss_usd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Freshness Score:</span>
                <span className="font-bold text-emerald-400 font-mono">{item.freshness_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CO₂ Footprint:</span>
                <span className="font-mono text-cyan-300">{item.co2_kg} kg</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-500">Execution Time:</span>
                <span className="font-mono text-amber-300">{item.execution_time_sec}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Energy Convergence (Hamiltonian Cost vs Iterations)</span>
            <span className="text-[11px] text-slate-500">Lower is better</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergenceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="iteration" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="qaoa" name="Qiskit QAOA" stroke="#06b6d4" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="sqa" name="Simulated Quantum Annealing" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="classical" name="Classical Annealing" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Cost & Spoilage Loss Breakdown ($ USD)</span>
            <span className="text-[11px] text-slate-500">Quantum vs Classical</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="key" stroke="#64748b" fontSize={11} tickFormatter={(val) => val === 'qaoa' ? 'QAOA' : val === 'sqa' ? 'SQA' : 'Classical'} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="transport_cost_usd" name="Transport Cost ($)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spoilage_loss_usd" name="Spoilage Loss ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
