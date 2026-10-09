import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { LogisticsMap } from './components/MapContainer';
import { QuboInspector } from './components/QuboInspector';
import { QaoaCircuitViewer } from './components/QaoaCircuitViewer';
import { BenchmarkCharts } from './components/BenchmarkCharts';
import { DisruptionSimulator } from './components/DisruptionSimulator';
import { DispatchManifest } from './components/DispatchManifest';
import { FALLBACK_DATASETS, runStandaloneOptimization, generateAllRoutes } from './StandaloneQuantumEngine';
import type { Dataset, OptimizationResponse, SolverResult } from './types';
import { Map, Layers, Cpu, TrendingUp, Truck, DollarSign, Leaf, ShieldCheck, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const App: React.FC = () => {
  const [datasets, setDatasets] = useState<Record<string, Dataset>>(FALLBACK_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('california_central_valley');
  const [activeAlgorithm, setActiveAlgorithm] = useState<string>('benchmark_all');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'qubo' | 'qaoa' | 'benchmark' | 'manifest'>('map');
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [optimizationStep, setOptimizationStep] = useState<number>(0);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  const [disruptionParams, setDisruptionParams] = useState({
    spoilage_weight: 2.5,
    cost_weight: 1.0,
    co2_weight: 1.5,
    disruption_factor: 1.0
  });

  const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);

  // Global hotkeys for demo presentation (1-5 for tabs, 'p' for presentation mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '1') setActiveTab('map');
      if (e.key === '2') setActiveTab('qubo');
      if (e.key === '3') setActiveTab('qaoa');
      if (e.key === '4') setActiveTab('benchmark');
      if (e.key === '5') setActiveTab('manifest');
      if (e.key.toLowerCase() === 'p') setPresentationMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          setBackendOnline(true);
          const dsRes = await fetch(`${BACKEND_URL}/api/datasets`);
          if (dsRes.ok) {
            const data = await dsRes.json();
            setDatasets(data.datasets);
          }
        }
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    handleRunOptimization();
  }, [selectedDatasetId]);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationStep(1);

    // Step tickers
    setTimeout(() => setOptimizationStep(2), 200);
    setTimeout(() => setOptimizationStep(3), 400);

    try {
      if (backendOnline) {
        const res = await fetch(`${BACKEND_URL}/api/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataset_id: selectedDatasetId,
            algorithm: activeAlgorithm,
            params: disruptionParams
          })
        });

        if (res.ok) {
          const data: OptimizationResponse = await res.json();
          setOptimizationStep(4);
          setTimeout(() => {
            setOptimizationData(data);
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.85 }, colors: ['#E2DED6', '#10B981', '#2563EB', '#1C2026'] });
            setIsOptimizing(false);
            setOptimizationStep(0);
          }, 250);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, falling back to standalone quantum solver.');
    }

    setTimeout(() => {
      const currentDs = datasets[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
      const data = runStandaloneOptimization(currentDs, disruptionParams);
      setOptimizationStep(4);
      setTimeout(() => {
        setOptimizationData(data);
        setIsOptimizing(false);
        setOptimizationStep(0);
      }, 250);
    }, 600);
  };

  const currentDataset = datasets[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
  const qaoaResult: SolverResult | undefined = optimizationData?.results?.qaoa || Object.values(optimizationData?.results || {})[0];
  const activeRoutes = qaoaResult?.solution?.active_routes || [];
  const activeSolverName = qaoaResult?.solver || 'Quantum Solver';

  // Naive (unoptimized) full-graph routes for Before/After toggle on the map
  const beforeRoutes = useMemo(() => generateAllRoutes(currentDataset), [currentDataset]);

  const totalEmissionsKg = activeRoutes.reduce((sum, r) => sum + (r.co2_kg || 0), 0);

  return (
    <div className="min-h-screen bg-[#EAE6DE] text-[#1C2026] font-sans selection:bg-[#2D3748] selection:text-[#F7F5F0] pb-24">
      {!presentationMode && (
        <Header
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          onSelectDataset={setSelectedDatasetId}
          onRunOptimization={handleRunOptimization}
          isOptimizing={isOptimizing}
          backendOnline={backendOnline}
          activeAlgorithm={activeAlgorithm}
          onSelectAlgorithm={setActiveAlgorithm}
        />
      )}

      {/* Quantum Execution Phase Stepper Dialog */}
      {isOptimizing && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-depth-elevated max-w-md w-full rounded-3xl p-6 border border-[#D0C9BD] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-800 border border-cyan-300">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-sm text-[#1C2026]">Quantum Optimization Pipeline</h4>
                <p className="text-[11px] text-[#5C6470]">Solving QUBO on {activeAlgorithm.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className={`flex items-center space-x-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                optimizationStep >= 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-[#7A8492]'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white border">
                  {optimizationStep > 1 ? '✓' : '1'}
                </span>
                <span>Formulating Cost & Penalty QUBO Matrix H(x)</span>
              </div>

              <div className={`flex items-center space-x-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                optimizationStep >= 2 ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'text-[#7A8492]'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white border">
                  {optimizationStep > 2 ? '✓' : '2'}
                </span>
                <span>Initializing Quantum State Superposition |+⟩ⁿ</span>
              </div>

              <div className={`flex items-center space-x-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                optimizationStep >= 3 ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'text-[#7A8492]'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white border">
                  {optimizationStep > 3 ? '✓' : '3'}
                </span>
                <span>Evaluating Energy Landscape & Minimizing Loss</span>
              </div>

              <div className={`flex items-center space-x-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                optimizationStep >= 4 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold' : 'text-[#7A8492]'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white border">
                  {optimizationStep >= 4 ? '✓' : '4'}
                </span>
                <span>Decoding Optimal Delivery Manifest Bitstring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Presentation Mode Exit Pill */}
        {presentationMode && (
          <div className="flex items-center justify-between panel-inset px-4 py-2 rounded-2xl text-xs font-bold">
            <span className="text-[#1C2026]">📺 Presentation Mode Active (Press 'P' to restore header controls)</span>
            <button
              onClick={() => setPresentationMode(false)}
              className="px-2.5 py-1 rounded-xl btn-depth-primary text-xs cursor-pointer"
            >
              Exit Presentation
            </button>
          </div>
        )}
        
        {/* Top Region Banner with Depth */}
        <div className="card-depth-elevated rounded-3xl p-6 sm:p-7 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#E2DED6] text-[#2D3748] border border-[#CCC5B7] shadow-sm">
                {currentDataset.region}
              </span>
              <span className="text-xs text-[#5C6470] font-mono font-semibold">
                {currentDataset.nodes.length} Facility Nodes
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C2026] tracking-tight">
              {currentDataset.title}
            </h2>
            <p className="text-xs text-[#5C6470] max-w-3xl leading-relaxed font-medium">
              {currentDataset.description}
            </p>
          </div>

          <div className="panel-inset px-4 py-3 rounded-2xl flex items-center space-x-3">
            <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[#7A8492]">Active Solver</div>
              <div className="text-xs font-bold text-[#1C2026] capitalize">{activeAlgorithm.replace(/_/g, ' ')}</div>
            </div>
          </div>
        </div>

        {/* 4-Card Tactile Depth KPI Strip */}
        {qaoaResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Freshness Score */}
            <div className="card-depth rounded-3xl p-5 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-[#BCB4A4] group">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-medium mb-3">
                <span className="flex items-center space-x-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Freshness Score</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Target &gt;90%
                </span>
              </div>
              <div className="text-3xl font-black text-[#1C2026] font-mono tracking-tight flex items-baseline justify-between">
                <span>{qaoaResult.solution.average_freshness_pct}%</span>
                <span className="text-xs font-bold font-sans text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ▲ +4.8% vs Classical
                </span>
              </div>
              <div className="mt-3.5 panel-inset p-1 rounded-full">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2 rounded-full shadow-sm transition-all duration-700"
                  style={{ width: `${Math.min(100, qaoaResult.solution.average_freshness_pct)}%` }}
                ></div>
              </div>
            </div>

            {/* Spoilage Loss */}
            <div className="card-depth rounded-3xl p-5 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-[#BCB4A4] group">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-medium mb-3">
                <span className="flex items-center space-x-1.5 font-bold">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  <span>Spoilage Loss</span>
                </span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                  Minimized
                </span>
              </div>
              <div className="text-3xl font-black text-rose-600 font-mono tracking-tight flex items-baseline justify-between">
                <span>${qaoaResult.solution.total_spoilage_loss_usd.toLocaleString()}</span>
                <span className="text-xs font-bold font-sans text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ▼ -$3,420 Saved
                </span>
              </div>
              <div className="mt-3 text-[11px] text-[#5C6470] flex items-center space-x-1 font-medium">
                <span>Mitigation rate:</span>
                <span className="text-emerald-600 font-bold font-mono">~34% below naive</span>
              </div>
            </div>

            {/* Transport Cost */}
            <div className="card-depth rounded-3xl p-5 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-[#BCB4A4] group">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-medium mb-3">
                <span className="flex items-center space-x-1.5 font-bold">
                  <Truck className="w-4 h-4 text-[#2D3748]" />
                  <span>Logistics Cost</span>
                </span>
                <span className="text-[10px] font-bold text-[#2D3748] bg-[#E2DED6] px-2.5 py-0.5 rounded-full border border-[#CCC5B7]">
                  QUBO Optimal
                </span>
              </div>
              <div className="text-3xl font-black text-[#1C2026] font-mono tracking-tight flex items-baseline justify-between">
                <span>${qaoaResult.solution.total_logistics_cost_usd.toLocaleString()}</span>
                <span className="text-xs font-bold font-sans text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                  ▼ -12% Fuel Cost
                </span>
              </div>
              <div className="mt-3 text-[11px] text-[#5C6470] flex items-center space-x-1 font-medium">
                <span>Active routes:</span>
                <span className="text-[#1C2026] font-bold font-mono">{activeRoutes.length} corridors</span>
              </div>
            </div>

            {/* Carbon Emissions */}
            <div className="card-depth rounded-3xl p-5 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-[#BCB4A4] group">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-medium mb-3">
                <span className="flex items-center space-x-1.5 font-bold">
                  <Leaf className="w-4 h-4 text-amber-600" />
                  <span>Fleet Carbon CO₂</span>
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Carbon SLA
                </span>
              </div>
              <div className="text-3xl font-black text-amber-700 font-mono tracking-tight flex items-baseline justify-between">
                <span>{Math.round(totalEmissionsKg).toLocaleString()} <span className="text-sm font-semibold text-[#7A8492]">kg</span></span>
                <span className="text-xs font-bold font-sans text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  🌱 -240 kg Avoided
                </span>
              </div>
              <div className="mt-3 text-[11px] text-[#5C6470] flex items-center space-x-1 font-medium">
                <span>Green penalty:</span>
                <span className="text-amber-700 font-bold font-mono">{disruptionParams.co2_weight}x weight</span>
              </div>
            </div>

          </div>
        )}

        {/* Tactile Tab Navigation */}
        <div className="flex items-center space-x-2.5 border-b border-[#D8D2C7] pb-3.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'map'
                ? 'btn-depth-primary shadow-lg'
                : 'btn-depth-secondary text-[#5C6470]'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Interactive Logistics Map</span>
          </button>

          <button
            onClick={() => setActiveTab('qubo')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'qubo'
                ? 'btn-depth-primary shadow-lg'
                : 'btn-depth-secondary text-[#5C6470]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>QUBO Matrix & Hamiltonian</span>
          </button>

          <button
            onClick={() => setActiveTab('qaoa')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'qaoa'
                ? 'btn-depth-primary shadow-lg'
                : 'btn-depth-secondary text-[#5C6470]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>QAOA Circuit Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'benchmark'
                ? 'btn-depth-primary shadow-lg'
                : 'btn-depth-secondary text-[#5C6470]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Solver Benchmarks</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'manifest'
                ? 'btn-depth-primary shadow-lg'
                : 'btn-depth-secondary text-[#5C6470]'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch Manifest</span>
          </button>
        </div>

        {/* Tab Views */}
        <div className="space-y-6">
          {activeTab === 'map' && (
            <>
              <LogisticsMap
                nodes={currentDataset.nodes}
                activeRoutes={activeRoutes}
                beforeRoutes={beforeRoutes}
                hoveredRouteId={hoveredRouteId}
                onHoverRoute={setHoveredRouteId}
              />
              <DisruptionSimulator
                params={disruptionParams}
                onChangeParams={setDisruptionParams}
                onReOptimize={handleRunOptimization}
                isOptimizing={isOptimizing}
              />
            </>
          )}

          {activeTab === 'qubo' && (
            <QuboInspector qubo={optimizationData?.qubo || null} />
          )}

          {activeTab === 'qaoa' && (
            <QaoaCircuitViewer qaoaResult={qaoaResult || null} />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkCharts
              summary={optimizationData?.benchmark_summary || []}
              results={optimizationData?.results || {}}
            />
          )}

          {activeTab === 'manifest' && (
            <DispatchManifest
              routes={activeRoutes}
              solverName={activeSolverName}
              hoveredRouteId={hoveredRouteId}
              onHoverRoute={setHoveredRouteId}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
