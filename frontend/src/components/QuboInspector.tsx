import React, { useState } from 'react';
import type { QuboData } from '../types';
import { Database, Layers, Info } from 'lucide-react';

interface QuboInspectorProps {
  qubo: QuboData | null;
}

export const QuboInspector: React.FC<QuboInspectorProps> = ({ qubo }) => {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number; val: number } | null>(null);

  if (!qubo || !qubo.matrix || qubo.matrix.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <Database className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
        <p className="text-sm">Execute optimization to construct QUBO Hamiltonian Matrix.</p>
      </div>
    );
  }

  const matrix = qubo.matrix;
  const size = matrix.length;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl text-white space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              QUBO Matrix & Hamiltonian Inspector
            </h3>
            <p className="text-xs text-slate-400">
              Formulated {size} binary decision variables (x_i &isin; &#123;0, 1&#125;) representing candidate logistics routes.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-400">
          H(x) = xᵀ Q x + cᵀ x
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Route Coupling Matrix Q<sub>i,j</sub></span>
            <span>Hover cell to inspect energy weights</span>
          </div>

          <div className="overflow-x-auto p-2 bg-slate-950 rounded-xl border border-slate-800/80">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(28px, 1fr))` }}
            >
              {matrix.map((row, i) =>
                row.map((val, j) => {
                  const isDiagonal = i === j;
                  
                  let cellStyle = 'bg-slate-900 text-slate-500';
                  if (isDiagonal) {
                    cellStyle = val > 0 
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40';
                  } else if (val > 0) {
                    cellStyle = 'bg-rose-950/70 text-rose-300 border border-rose-800/30';
                  }

                  return (
                    <div
                      key={`${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ i, j, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-8 rounded flex items-center justify-center font-mono text-[10px] font-semibold cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg hover:shadow-cyan-500/20 ${cellStyle}`}
                    >
                      {val !== 0 ? val.toFixed(1) : '0'}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-cyan-900 border border-cyan-500/50"></span>
                <span>Diagonal Costs (c_i)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-rose-900 border border-rose-500/50"></span>
                <span>Conflict Penalty Q<sub>i,j</sub></span>
              </div>
            </div>
            <span className="font-mono text-slate-500">Variables N = {size}</span>
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Variable Energy Inspector</span>
            </h4>

            {hoveredCell ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                  <div className="font-bold text-cyan-300 mb-1">
                    {hoveredCell.i === hoveredCell.j 
                      ? `Diagonal Variable x_${hoveredCell.i}` 
                      : `Coupling Term x_${hoveredCell.i} · x_${hoveredCell.j}`}
                  </div>
                  <p className="text-slate-300 font-mono">
                    Edge Pair: <span className="text-emerald-400">{qubo.variable_names[hoveredCell.i]}</span>
                    {hoveredCell.i !== hoveredCell.j && <> ↔ <span className="text-indigo-400">{qubo.variable_names[hoveredCell.j]}</span></>}
                  </p>
                  <p className="text-amber-300 font-mono mt-1 font-bold">
                    Q({hoveredCell.i}, {hoveredCell.j}) Weight = {hoveredCell.val.toFixed(3)}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  {hoveredCell.i === hoveredCell.j ? (
                    <p>Includes transport cost, produce spoilage decay rate, and carbon emissions penalty.</p>
                  ) : (
                    <p>Quadratically penalizes multi-hub capacity overflow or conflicting redundant route selections.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                Hover over matrix cells to inspect individual QUBO cost coefficients & quadratic route penalties.
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
            <div className="font-bold text-slate-300">Objective Terms:</div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Transport Cost Factor:</span>
                <span className="text-slate-200 font-mono">1.0x</span>
              </div>
              <div className="flex justify-between">
                <span>Spoilage Penalty Weight:</span>
                <span className="text-emerald-400 font-mono">2.5x</span>
              </div>
              <div className="flex justify-between">
                <span>CO₂ Emissions Weight:</span>
                <span className="text-cyan-400 font-mono">1.5x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
