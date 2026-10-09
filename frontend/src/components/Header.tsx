import React from 'react';
import { Cpu, Zap, RefreshCw } from 'lucide-react';
import type { Dataset } from '../types';

interface HeaderProps {
  datasets: Record<string, Dataset>;
  selectedDatasetId: string;
  onSelectDataset: (id: string) => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
  backendOnline: boolean;
  activeAlgorithm: string;
  onSelectAlgorithm: (algo: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onRunOptimization,
  isOptimizing,
  backendOnline,
  activeAlgorithm,
  onSelectAlgorithm
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-cyan-900/40 px-6 py-3 sticky top-0 z-50 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">
              QuantAgro
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              v1.0 QUBO Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Quantum Optimization & Cold-Chain Farm-to-Market Logistics
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-slate-400 font-medium">Dataset:</span>
          <select
            value={selectedDatasetId}
            onChange={(e) => onSelectDataset(e.target.value)}
            className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
          >
            {Object.values(datasets).map((ds) => (
              <option key={ds.id} value={ds.id} className="bg-slate-900 text-slate-200">
                {ds.title} ({ds.region})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-slate-400 font-medium">Solver:</span>
          <select
            value={activeAlgorithm}
            onChange={(e) => onSelectAlgorithm(e.target.value)}
            className="bg-transparent text-emerald-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="benchmark_all" className="bg-slate-900 text-slate-200">⚡ Benchmark All Solvers</option>
            <option value="qaoa" className="bg-slate-900 text-slate-200">⚛️ Qiskit QAOA Simulator</option>
            <option value="sqa" className="bg-slate-900 text-slate-200">🧲 Simulated Quantum Annealing</option>
            <option value="classical_sa" className="bg-slate-900 text-slate-200">💻 Classical Simulated Annealing</option>
          </select>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-slate-800/80">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
          <span className={backendOnline ? 'text-emerald-400' : 'text-amber-300'}>
            {backendOnline ? 'Qiskit Backend Active' : 'Standalone JS Engine'}
          </span>
        </div>

        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Solving QUBO...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current text-slate-950" />
              <span>Execute Quantum Optimization</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
