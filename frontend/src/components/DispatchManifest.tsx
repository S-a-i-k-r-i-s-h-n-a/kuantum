import React from 'react';
import type { RouteDetail } from '../types';
import { Truck, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DispatchManifestProps {
  routes: RouteDetail[];
  solverName: string;
}

export const DispatchManifest: React.FC<DispatchManifestProps> = ({ routes, solverName }) => {
  const exportCSV = () => {
    if (!routes || routes.length === 0) return;
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    const headers = ['Route_ID', 'Source', 'Target', 'Stage', 'Produce', 'Tons', 'Distance_KM', 'Hours', 'Freshness_PCT', 'Spoilage_USD', 'Transport_USD', 'CO2_KG'];
    const csvRows = [
      headers.join(','),
      ...routes.map(r => [
        r.edge_id,
        r.source,
        r.target,
        r.stage,
        `"${r.produce}"`,
        r.tons,
        r.distance_km,
        r.travel_hours,
        r.freshness_score,
        r.spoilage_loss_usd,
        r.transport_cost_usd,
        r.co2_kg
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `QuantAgro_Dispatch_Schedule_${Date.now()}.csv`);
    a.click();
  };

  if (!routes || routes.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
        <p className="text-sm">No active dispatches. Run optimization to generate logistics schedules.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Quantum Optimized Dispatch Manifest & Route Schedule
            </h3>
            <p className="text-xs text-slate-400">
              Active Fleet Assignments calculated by {solverName}
            </p>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 text-xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Manifest</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Route Path</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Produce</th>
              <th className="p-3">Cargo Load</th>
              <th className="p-3">Distance & Time</th>
              <th className="p-3">Freshness</th>
              <th className="p-3">Spoilage Loss</th>
              <th className="p-3">Transport Cost</th>
              <th className="p-3">CO₂ Footprint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {routes.map((route, idx) => (
              <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 font-bold text-cyan-300">
                  {route.source} → {route.target}
                </td>
                <td className="p-3 text-slate-300 capitalize font-sans">
                  {route.stage.replace(/_/g, ' ')}
                </td>
                <td className="p-3 text-slate-200 font-sans">
                  <span className="mr-1">{route.produce_icon}</span>
                  <span>{route.produce}</span>
                </td>
                <td className="p-3 text-slate-300 font-bold">{route.tons} Tons</td>
                <td className="p-3 text-slate-400">
                  {route.distance_km} km ({route.travel_hours} hrs)
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    route.freshness_score >= 90 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}>
                    {route.freshness_score}%
                  </span>
                </td>
                <td className="p-3 text-rose-400 font-bold">${route.spoilage_loss_usd}</td>
                <td className="p-3 text-slate-300">${route.transport_cost_usd}</td>
                <td className="p-3 text-cyan-400">{route.co2_kg} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
