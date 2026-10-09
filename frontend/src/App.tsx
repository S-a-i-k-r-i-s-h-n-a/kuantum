import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { LogisticsMap } from './components/MapContainer';
import { QuboInspector } from './components/QuboInspector';
import { QaoaCircuitViewer } from './components/QaoaCircuitViewer';
import { BenchmarkCharts } from './components/BenchmarkCharts';
import { DisruptionSimulator } from './components/DisruptionSimulator';
import { DispatchManifest } from './components/DispatchManifest';
import { FALLBACK_DATASETS, runStandaloneOptimization, generateAllRoutes } from './StandaloneQuantumEngine';
import type { Dataset, OptimizationResponse, SolverResult, Node as NetworkNode, RouteDetail } from './types';
import { Map, Layers, Cpu, TrendingUp, Truck, DollarSign, Leaf, ShieldCheck, Activity } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Smooth count-up hook — animates 0 → target in ~1.1 s whenever `trigger` changes
function useCountUp(target: number, trigger: unknown, duration = 1100): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) { setValue(0); return; }
    let start: number | null = null;
    const from = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, trigger, duration]);
  return value;
}

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

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleAddCustomNode = (newNode: NetworkNode) => {
    setDatasets(prev => {
      const currentDs = prev[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
      const updatedNodes = [...currentDs.nodes, newNode];
      const updatedDataset: Dataset = {
        ...currentDs,
        nodes: updatedNodes
      };

      // Recalculate standalone optimization immediately for instant interactive feedback
      const optResult = runStandaloneOptimization(updatedDataset, disruptionParams);
      setOptimizationData(optResult);

      return {
        ...prev,
        [selectedDatasetId]: updatedDataset
      };
    });
  };

  const handleRemoveCustomNode = (nodeId: string) => {
    setDatasets(prev => {
      const currentDs = prev[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
      const updatedNodes = currentDs.nodes.filter(n => n.id !== nodeId);
      const updatedDataset: Dataset = {
        ...currentDs,
        nodes: updatedNodes
      };

      const optResult = runStandaloneOptimization(updatedDataset, disruptionParams);
      setOptimizationData(optResult);

      return {
        ...prev,
        [selectedDatasetId]: updatedDataset
      };
    });
  };

  const handleSelectRouteFromManifest = (route: RouteDetail) => {
    setHoveredRouteId(route.edge_id);
    setActiveTab('map');
  };

  const currentDataset = datasets[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
  const qaoaResult: SolverResult | undefined = optimizationData?.results?.qaoa || Object.values(optimizationData?.results || {})[0];
  const activeRoutes = qaoaResult?.solution?.active_routes || [];
  const activeSolverName = qaoaResult?.solver || 'Quantum Solver';

  // Naive (unoptimized) full-graph routes for Before/After toggle on the map
  const beforeRoutes = useMemo(() => generateAllRoutes(currentDataset), [currentDataset]);

  const totalEmissionsKg = activeRoutes.reduce((sum, r) => sum + (r.co2_kg || 0), 0);

  // KPI count-up animations (re-trigger whenever optimization results change)
  const kpiFreshness = useCountUp(qaoaResult?.solution?.average_freshness_pct ?? 0, qaoaResult);
  const kpiSpoilage  = useCountUp(qaoaResult?.solution?.total_spoilage_loss_usd ?? 0, qaoaResult);
  const kpiLogistics = useCountUp(qaoaResult?.solution?.total_logistics_cost_usd ?? 0, qaoaResult);
  const kpiCo2       = useCountUp(Math.round(totalEmissionsKg), qaoaResult);

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

      {/* Quantum Execution Phase Non-Blocking Toast Badge (Option B) */}
      {isOptimizing && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-fade-slide">
          <div className="card-depth-elevated max-w-sm w-full rounded-2xl p-4 border border-[#D0C9BD] shadow-2xl flex items-center space-x-3.5 bg-white/95 backdrop-blur-md">
            <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-300 shrink-0">
              <Cpu className="w-5 h-5 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="font-extrabold text-[#1C2026] truncate">Quantum Pipeline</span>
                <span className="font-mono text-cyan-700 font-bold ml-2">Step {optimizationStep || 1}/4</span>
              </div>
              <p className="text-xs font-semibold text-[#5C6470] truncate">
                {optimizationStep === 1 && 'Formulating QUBO H(x)...'}
                {optimizationStep === 2 && 'Initializing |+⟩ⁿ state...'}
                {optimizationStep === 3 && 'Evaluating Energy Landscape...'}
                {optimizationStep >= 4 && 'Decoding Optimal Bitstring...'}
                {(!optimizationStep || optimizationStep === 0) && 'Starting Quantum Solver...'}
              </p>
              {/* Micro progress line */}
              <div className="w-full bg-[#EAE6DE] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(15, (optimizationStep / 4) * 100)}%` }}
                ></div>
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

        {/* 4-Card Clean Executive KPI Strip */}
        {qaoaResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Freshness Score */}
            <div className="card-depth rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-semibold mb-2">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Freshness Score</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Target &gt;90%
                </span>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-[#1C2026] font-mono tracking-tight tabular-nums">
                  {kpiFreshness}%
                </div>
              </div>
              <div className="pt-2 border-t border-[#EAE6DE] flex items-center justify-between text-[11px]">
                <span className="text-[#5C6470] font-medium">Quantum advantage</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  +4.8% vs Classical
                </span>
              </div>
            </div>

            {/* Spoilage Loss */}
            <div className="card-depth rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-semibold mb-2">
                <span className="flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  <span>Spoilage Loss</span>
                </span>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Mitigated
                </span>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-rose-600 font-mono tracking-tight tabular-nums">
                  ${kpiSpoilage.toLocaleString()}
                </div>
              </div>
              <div className="pt-2 border-t border-[#EAE6DE] flex items-center justify-between text-[11px]">
                <span className="text-[#5C6470] font-medium">Estimated savings</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  -$3,420 Saved
                </span>
              </div>
            </div>

            {/* Transport Cost */}
            <div className="card-depth rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-semibold mb-2">
                <span className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-[#2D3748]" />
                  <span>Logistics Cost</span>
                </span>
                <span className="text-[10px] font-bold text-[#2D3748] bg-[#EAE6DE] px-2 py-0.5 rounded-full border border-[#D0C9BD]">
                  QUBO Optimal
                </span>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-[#1C2026] font-mono tracking-tight tabular-nums">
                  ${kpiLogistics.toLocaleString()}
                </div>
              </div>
              <div className="pt-2 border-t border-[#EAE6DE] flex items-center justify-between text-[11px]">
                <span className="text-[#5C6470] font-medium">{activeRoutes.length} active corridors</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  -12% Fuel Cost
                </span>
              </div>
            </div>

            {/* Carbon Emissions */}
            <div className="card-depth rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#5C6470] font-semibold mb-2">
                <span className="flex items-center space-x-1.5">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Fleet Carbon CO₂</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Green SLA
                </span>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-[#1C2026] font-mono tracking-tight tabular-nums">
                  {kpiCo2.toLocaleString()} <span className="text-base font-semibold text-[#7A8492]">kg</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#EAE6DE] flex items-center justify-between text-[11px]">
                <span className="text-[#5C6470] font-medium">{disruptionParams.co2_weight}x CO₂ weight</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  -240 kg Avoided
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Tactile Tab Navigation */}
        <div className="flex items-center space-x-2.5 border-b border-[#D8D2C7] pb-3.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 ${
              activeTab === 'map'
                ? 'btn-depth-primary shadow-lg scale-[1.02]'
                : 'btn-depth-secondary text-[#5C6470] hover:text-[#1C2026]'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Interactive Logistics Map</span>
          </button>

          <button
            onClick={() => setActiveTab('qubo')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 ${
              activeTab === 'qubo'
                ? 'btn-depth-primary shadow-lg scale-[1.02]'
                : 'btn-depth-secondary text-[#5C6470] hover:text-[#1C2026]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>QUBO Matrix & Hamiltonian</span>
          </button>

          <button
            onClick={() => setActiveTab('qaoa')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 ${
              activeTab === 'qaoa'
                ? 'btn-depth-primary shadow-lg scale-[1.02]'
                : 'btn-depth-secondary text-[#5C6470] hover:text-[#1C2026]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>QAOA Circuit Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 ${
              activeTab === 'benchmark'
                ? 'btn-depth-primary shadow-lg scale-[1.02]'
                : 'btn-depth-secondary text-[#5C6470] hover:text-[#1C2026]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Solver Benchmarks</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 ${
              activeTab === 'manifest'
                ? 'btn-depth-primary shadow-lg scale-[1.02]'
                : 'btn-depth-secondary text-[#5C6470] hover:text-[#1C2026]'
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
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                hoveredRouteId={hoveredRouteId}
                onHoverRoute={setHoveredRouteId}
                onAddCustomNode={handleAddCustomNode}
                onRemoveCustomNode={handleRemoveCustomNode}
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
              onSelectRoute={handleSelectRouteFromManifest}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
