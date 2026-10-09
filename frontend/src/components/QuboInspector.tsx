import React, { useState } from 'react';
import type { QuboData } from '../types';
import { Database, Layers, Info, Filter, Eye } from 'lucide-react';

interface QuboInspectorProps {
  qubo: QuboData | null;
}

export const QuboInspector: React.FC<QuboInspectorProps> = ({ qubo }) => {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number; val: number } | null>(null);
  const [conflictsOnly, setConflictsOnly] = useState<boolean>(false);

  if (!qubo || !qubo.matrix || qubo.matrix.length === 0) {
    return (
      <div className="card-depth-elevated rounded-3xl p-8 text-center text-[#5C6470] border border-[#D0C9BD]">
        <Database className="w-10 h-10 mx-auto mb-3 text-[#7A8492] animate-pulse" />
        <p className="text-sm font-semibold">Execute optimization to construct QUBO Hamiltonian Matrix.</p>
      </div>
    );
  }

  const matrix = qubo.matrix;
  const size = matrix.length;

  return (
    <div className="card-depth-elevated rounded-3xl p-6 sm:p-7 text-[#1C2026] space-y-5">
      <div className="flex flex-wrap items-center justify-between border-b border-[#D8D2C7] pb-4 gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#1C2026] tracking-tight">
              QUBO Matrix & Hamiltonian Inspector
            </h3>
            <p className="text-xs text-[#5C6470] font-medium">
              Formulated {size} binary decision variables (x_i &isin; &#123;0, 1&#125;) representing candidate logistics routes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="text-[11px] font-mono panel-inset px-3 py-1.5 rounded-xl text-indigo-900 font-bold">
            Variables: {size} | Terms: {size * size}
          </div>

          <button
            onClick={() => setConflictsOnly(!conflictsOnly)}
            className={`btn-depth-secondary flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              conflictsOnly ? 'bg-amber-100 text-amber-900 border-amber-300' : ''
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>{conflictsOnly ? 'All Cells' : 'Coupled Only'}</span>
          </button>

          <div className="text-xs font-mono panel-inset px-3 py-1.5 rounded-xl text-[#1C2026] font-bold">
            H(x) = xᵀ Q x + cᵀ x
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5C6470] font-medium mb-1">
            <span className="font-bold text-[#1C2026]">Route Coupling Matrix Q<sub>i,j</sub></span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hover cell to inspect energy weights</span>
            </span>
          </div>

          <div className="overflow-x-auto p-3 panel-inset rounded-2xl">
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(32px, 1fr))` }}
            >
              {matrix.map((row, i) =>
                row.map((val, j) => {
                  const isDiagonal = i === j;
                  const isZero = val === 0;

                  if (conflictsOnly && isZero) {
                    return (
                      <div
                        key={`${i}-${j}`}
                        className="h-9 rounded-lg flex items-center justify-center font-mono text-[10px] text-[#C4BEB2] bg-white/40 border border-transparent"
                      >
                        ·
                      </div>
                    );
                  }
                  
                  let cellStyle = 'bg-white text-[#7A8492] border border-[#D8D2C7]';
                  if (isDiagonal) {
                    cellStyle = val > 0 
                      ? 'bg-blue-100 text-blue-900 border border-blue-300 font-bold' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold';
                  } else if (val > 0) {
                    cellStyle = 'bg-rose-100 text-rose-900 border border-rose-300 font-bold shadow-sm';
                  }

                  return (
                    <div
                      key={`${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ i, j, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-9 rounded-lg flex items-center justify-center font-mono text-[10px] font-semibold cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-md ${cellStyle}`}
                    >
                      {val !== 0 ? val.toFixed(1) : '0'}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#5C6470] pt-1">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></span>
                <span>Diagonal Costs (c_i)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-400"></span>
                <span>Conflict Penalty Q<sub>i,j</sub></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-white border border-[#D8D2C7]"></span>
                <span>Neutral (0)</span>
              </div>
            </div>
            <span className="font-mono text-[#7A8492] font-semibold">Variables N = {size}</span>
          </div>
        </div>

        <div className="card-depth rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-[#D0C9BD]">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#7A8492] mb-3 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Variable Energy Inspector</span>
            </h4>

            {hoveredCell ? (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl panel-inset">
                  <div className="font-bold text-[#1C2026] mb-1">
                    {hoveredCell.i === hoveredCell.j 
                      ? `Diagonal Variable x_${hoveredCell.i}` 
                      : `Coupling Term x_${hoveredCell.i} · x_${hoveredCell.j}`}
                  </div>
                  <p className="text-[#5C6470] font-mono text-[11px]">
                    Edge: <span className="text-emerald-700 font-bold">{qubo.variable_names[hoveredCell.i]}</span>
                    {hoveredCell.i !== hoveredCell.j && <> ↔ <span className="text-indigo-700 font-bold">{qubo.variable_names[hoveredCell.j]}</span></>}
                  </p>
                  <p className="text-amber-800 font-mono mt-1 font-bold">
                    Q({hoveredCell.i}, {hoveredCell.j}) Weight = {hoveredCell.val.toFixed(3)}
                  </p>
                </div>

                <div className="text-[11px] text-[#5C6470] space-y-1 font-medium">
                  {hoveredCell.i === hoveredCell.j ? (
                    <p>Includes transport cost, produce spoilage decay rate, and carbon emissions penalty.</p>
                  ) : (
                    <p>Quadratically penalizes multi-hub capacity overflow or conflicting redundant route selections.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#7A8492] text-xs italic font-medium">
                Hover over matrix cells to inspect individual QUBO cost coefficients & quadratic route penalties.
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl panel-inset text-xs space-y-1.5">
            <div className="font-bold text-[#1C2026]">Objective Weights:</div>
            <div className="text-[11px] text-[#5C6470] space-y-1 font-medium">
              <div className="flex justify-between">
                <span>Transport Cost Factor:</span>
                <span className="text-[#1C2026] font-mono font-bold">1.0x</span>
              </div>
              <div className="flex justify-between">
                <span>Spoilage Penalty Weight:</span>
                <span className="text-emerald-700 font-mono font-bold">2.5x</span>
              </div>
              <div className="flex justify-between">
                <span>CO₂ Emissions Weight:</span>
                <span className="text-blue-700 font-mono font-bold">1.5x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
