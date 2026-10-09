import React from 'react';
import { Thermometer, ShieldAlert, Fuel, Sliders, RefreshCw, AlertTriangle, Flame, Wind } from 'lucide-react';

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
  const applyPreset = (preset: 'normal' | 'heatwave' | 'blockade' | 'fuel_crisis') => {
    if (preset === 'normal') {
      onChangeParams({
        spoilage_weight: 2.0,
        cost_weight: 1.0,
        co2_weight: 1.2,
        disruption_factor: 1.0
      });
    } else if (preset === 'heatwave') {
      onChangeParams({
        spoilage_weight: 4.8,
        cost_weight: 1.2,
        co2_weight: 1.5,
        disruption_factor: 1.15
      });
    } else if (preset === 'blockade') {
      onChangeParams({
        spoilage_weight: 3.2,
        cost_weight: 1.6,
        co2_weight: 2.0,
        disruption_factor: 1.75
      });
    } else if (preset === 'fuel_crisis') {
      onChangeParams({
        spoilage_weight: 2.5,
        cost_weight: 2.5,
        co2_weight: 2.8,
        disruption_factor: 1.2
      });
    }
  };

  return (
    <div className="card-depth-elevated rounded-3xl p-6 sm:p-7 text-[#1C2026] space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8D2C7] pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-700 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#1C2026] tracking-tight">
              Supply Chain Disruption Simulator
            </h3>
            <p className="text-xs text-[#5C6470] mt-0.5 font-medium">
              Inject heatwaves, traffic blockades, and fuel surges to test Quantum QUBO robustness.
            </p>
          </div>
        </div>

        {/* Quick crisis presets */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] font-bold text-[#7A8492] mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('normal')}
            className="btn-depth-secondary flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Wind className="w-3.5 h-3.5 text-cyan-600" />
            <span>Optimal</span>
          </button>
          <button
            onClick={() => applyPreset('heatwave')}
            className="btn-depth-secondary flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Heatwave</span>
          </button>
          <button
            onClick={() => applyPreset('blockade')}
            className="btn-depth-secondary flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Detours</span>
          </button>
          <button
            onClick={() => applyPreset('fuel_crisis')}
            className="btn-depth-secondary flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Fuel className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fuel Spike</span>
          </button>

          <button
            onClick={onReOptimize}
            disabled={isOptimizing}
            className="btn-depth-primary flex items-center space-x-2 px-4 py-2 rounded-xl text-xs cursor-pointer disabled:opacity-50 ml-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''} text-white`} />
            <span>Re-Solve</span>
          </button>
        </div>
      </div>

      {/* Sliders Grid with Inset Wells */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heatwave / Perishability Slider */}
        <div className="panel-inset p-4 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1C2026] flex items-center space-x-1.5">
              <Thermometer className="w-4 h-4 text-rose-600" />
              <span>Spoilage Penalty</span>
            </span>
            <span className="font-mono text-rose-700 font-extrabold bg-white px-2 py-0.5 rounded border border-[#CCC5B7]">
              {params.spoilage_weight.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={params.spoilage_weight}
            onChange={(e) => onChangeParams({ ...params, spoilage_weight: parseFloat(e.target.value) })}
            className="w-full accent-[#2D3748] cursor-pointer h-1.5 bg-[#CCC5B7] rounded-lg"
          />
          <div className="text-[10px] text-[#5C6470] flex justify-between font-semibold">
            <span>Normal Shelf-life</span>
            <span className="text-rose-700">Heatwave Decay</span>
          </div>
        </div>

        {/* Road Disruption Factor */}
        <div className="panel-inset p-4 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1C2026] flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Route Traffic / Detours</span>
            </span>
            <span className="font-mono text-amber-800 font-extrabold bg-white px-2 py-0.5 rounded border border-[#CCC5B7]">
              +{((params.disruption_factor - 1.0) * 100).toFixed(0)}% Dist
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={params.disruption_factor}
            onChange={(e) => onChangeParams({ ...params, disruption_factor: parseFloat(e.target.value) })}
            className="w-full accent-[#2D3748] cursor-pointer h-1.5 bg-[#CCC5B7] rounded-lg"
          />
          <div className="text-[10px] text-[#5C6470] flex justify-between font-semibold">
            <span>Clear Highways</span>
            <span className="text-amber-800">Severe Detours</span>
          </div>
        </div>

        {/* CO2 Emissions Weight */}
        <div className="panel-inset p-4 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1C2026] flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Carbon Tax Weight</span>
            </span>
            <span className="font-mono text-blue-700 font-extrabold bg-white px-2 py-0.5 rounded border border-[#CCC5B7]">
              {params.co2_weight.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={params.co2_weight}
            onChange={(e) => onChangeParams({ ...params, co2_weight: parseFloat(e.target.value) })}
            className="w-full accent-[#2D3748] cursor-pointer h-1.5 bg-[#CCC5B7] rounded-lg"
          />
          <div className="text-[10px] text-[#5C6470] flex justify-between font-semibold">
            <span>Low Tax</span>
            <span className="text-blue-700">Strict Zero-CO₂</span>
          </div>
        </div>

        {/* Fuel Cost Weight */}
        <div className="panel-inset p-4 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#1C2026] flex items-center space-x-1.5">
              <Fuel className="w-4 h-4 text-emerald-600" />
              <span>Fuel Price Multiplier</span>
            </span>
            <span className="font-mono text-emerald-700 font-extrabold bg-white px-2 py-0.5 rounded border border-[#CCC5B7]">
              {params.cost_weight.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={params.cost_weight}
            onChange={(e) => onChangeParams({ ...params, cost_weight: parseFloat(e.target.value) })}
            className="w-full accent-[#2D3748] cursor-pointer h-1.5 bg-[#CCC5B7] rounded-lg"
          />
          <div className="text-[10px] text-[#5C6470] flex justify-between font-semibold">
            <span>Baseline Fuel</span>
            <span className="text-emerald-700">Severe Surge</span>
          </div>
        </div>
      </div>
    </div>
  );
};
