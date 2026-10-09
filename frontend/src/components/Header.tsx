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
    <header className="bg-[#F5F3EF]/95 backdrop-blur-xl border-b border-[#D8D2C7] px-6 py-3.5 sticky top-0 z-50 text-[#1C2026] flex flex-wrap items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center space-x-3.5">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#D6D0C5] p-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.8)_inset]">
            <div className="w-full h-full bg-[#FFFFFF] rounded-[13px] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5 text-[#2D3748]" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-black text-xl tracking-tight text-[#1C2026]">
              QuantAgro
            </h1>
            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#E4DFD6] to-[#ECE7DE] text-[#2D3748] border border-[#CCC5B7] shadow-sm">
              ⚛ QUBO Engine
            </span>
          </div>
          <p className="text-xs text-[#5C6470] font-medium">
            Quantum Cold-Chain & Perishable Agri-Logistics
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Unified Controls Toolbar */}
        <div className="flex items-center bg-[#FFFFFF] border border-[#D0C9BD] rounded-xl text-xs shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_0_#BCB4A4] divide-x divide-[#EAE6DE] overflow-hidden">
          {/* Dataset selector */}
          <div className="flex items-center space-x-1.5 px-3 py-2">
            <span className="text-[#7A8492] font-semibold text-[11px]">Region:</span>
            <select
              value={selectedDatasetId}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="bg-transparent text-[#1C2026] font-bold focus:outline-none cursor-pointer max-w-[150px] sm:max-w-none truncate"
            >
              {Object.values(datasets).map((ds) => (
                <option key={ds.id} value={ds.id} className="bg-[#FFFFFF] text-[#1C2026]">
                  {ds.title}
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm selector */}
          <div className="flex items-center space-x-1.5 px-3 py-2">
            <span className="text-[#7A8492] font-semibold text-[11px]">Solver:</span>
            <select
              value={activeAlgorithm}
              onChange={(e) => onSelectAlgorithm(e.target.value)}
              className="bg-transparent text-[#1C2026] font-bold focus:outline-none cursor-pointer"
            >
              <option value="benchmark_all" className="bg-[#FFFFFF] text-[#1C2026]">⚡ Benchmark All</option>
              <option value="qaoa" className="bg-[#FFFFFF] text-[#1C2026]">⚛️ QAOA (Qiskit)</option>
              <option value="sqa" className="bg-[#FFFFFF] text-[#1C2026]">🧲 SQA (Quantum Annealing)</option>
              <option value="classical_sa" className="bg-[#FFFFFF] text-[#1C2026]">💻 Classical Annealing</option>
            </select>
          </div>
        </div>

        {/* Status Pill with depth */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFFFFF] border border-[#D0C9BD] shadow-sm text-[#4A5568]">
          <span className="relative flex h-2 w-2">
            {backendOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className={backendOnline ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
            {backendOnline ? 'Backend Online' : 'JS Standalone'}
          </span>
        </div>

        {/* Primary Tactile 3D Action Button */}
        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="btn-depth-primary flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Optimizing QUBO...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current text-white" />
              <span>Execute Optimization</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
