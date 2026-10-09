import React from 'react';
import { Thermometer, ShieldAlert, Fuel, Sliders, RefreshCw, AlertTriangle } from 'lucide-react';

interface DisruptionSimulatorProps {
  params: {
    spoilage_weight: number;
    cost_weight: number;
    co2_weight: number;
    disruption_factor: number;
  };
  onChangeParams: (newParams: any) => void;
  onReOptimize: () => void;
  isOptimizing: boolean;
}

export const DisruptionSimulator: React.FC<DisruptionSimulatorProps> = ({
  params,
  onChangeParams,
  onReOptimize,
  isOptimizing
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
              Supply Chain Disruption & Scenario Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Inject real-time extreme weather, traffic blockades, and fuel price surges to test Quantum QUBO resilience.
            </p>
          </div>
        </div>

        <button
          onClick={onReOptimize}
          disabled={isOptimizing}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>Re-Run Quantum Solver</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heatwave / Perishability Slider */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-rose-300 flex items-center space-x-1">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Spoilage Penalty Weight</span>
            </span>
            <span className="font-mono text-rose-400 font-bold">{params.spoilage_weight.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={params.spoilage_weight}
            onChange={(e) => onChangeParams({ ...params, spoilage_weight: parseFloat(e.target.value) })}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Normal Decay</span>
            <span className="text-rose-400">Heatwave Surge</span>
          </div>
        </div>

        {/* Road Disruption Factor */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-amber-300 flex items-center space-x-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Route Traffic / Detours</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{((params.disruption_factor - 1.0) * 100).toFixed(0)}% Extra</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={params.disruption_factor}
            onChange={(e) => onChangeParams({ ...params, disruption_factor: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Clear Highways</span>
            <span className="text-amber-400">Severe Blockade</span>
          </div>
        </div>

        {/* CO2 Emissions Weight */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-cyan-300 flex items-center space-x-1">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Carbon Tax / CO₂ Penalty</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">{params.co2_weight.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={params.co2_weight}
            onChange={(e) => onChangeParams({ ...params, co2_weight: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Low Tax</span>
            <span className="text-cyan-400">Strict Green SLA</span>
          </div>
        </div>

        {/* Fuel Cost Weight */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-emerald-300 flex items-center space-x-1">
              <Fuel className="w-4 h-4 text-emerald-400" />
              <span>Transport Fuel Multiplier</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{params.cost_weight.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={params.cost_weight}
            onChange={(e) => onChangeParams({ ...params, cost_weight: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Standard Rate</span>
            <span className="text-emerald-400">Fuel Spike</span>
          </div>
        </div>
      </div>
    </div>
  );
};
