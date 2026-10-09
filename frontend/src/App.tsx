import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LogisticsMap } from './components/MapContainer';
import { QuboInspector } from './components/QuboInspector';
import { QaoaCircuitViewer } from './components/QaoaCircuitViewer';
import { BenchmarkCharts } from './components/BenchmarkCharts';
import { DisruptionSimulator } from './components/DisruptionSimulator';
import { DispatchManifest } from './components/DispatchManifest';
import { FALLBACK_DATASETS, runStandaloneOptimization } from './StandaloneQuantumEngine';
import type { Dataset, OptimizationResponse, SolverResult } from './types';
import { Map, Layers, Cpu, TrendingUp, Truck } from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const App: React.FC = () => {
  const [datasets, setDatasets] = useState<Record<string, Dataset>>(FALLBACK_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('california_central_valley');
  const [activeAlgorithm, setActiveAlgorithm] = useState<string>('benchmark_all');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'qubo' | 'qaoa' | 'benchmark' | 'manifest'>('map');

  const [disruptionParams, setDisruptionParams] = useState({
    spoilage_weight: 2.5,
    cost_weight: 1.0,
    co2_weight: 1.5,
    disruption_factor: 1.0
  });

  const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);

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
          setOptimizationData(data);
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.9 } });
          setIsOptimizing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, falling back to standalone quantum solver.');
    }

    setTimeout(() => {
      const currentDs = datasets[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
      const data = runStandaloneOptimization(currentDs, disruptionParams);
      setOptimizationData(data);
      setIsOptimizing(false);
    }, 400);
  };

  const currentDataset = datasets[selectedDatasetId] || FALLBACK_DATASETS.california_central_valley;
  const qaoaResult: SolverResult | undefined = optimizationData?.results?.qaoa || Object.values(optimizationData?.results || {})[0];
  const activeRoutes = qaoaResult?.solution?.active_routes || [];
  const activeSolverName = qaoaResult?.solver || 'Quantum Solver';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-16">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                {currentDataset.region}
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {currentDataset.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {currentDataset.description}
            </p>
          </div>

          {qaoaResult && (
            <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="text-slate-400 font-medium">Freshness Score</div>
                <div className="text-emerald-400 font-extrabold font-mono text-sm">
                  {qaoaResult.solution.average_freshness_pct}%
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div>
                <div className="text-slate-400 font-medium">Spoilage Loss</div>
                <div className="text-rose-400 font-extrabold font-mono text-sm">
                  ${qaoaResult.solution.total_spoilage_loss_usd}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div>
                <div className="text-slate-400 font-medium">Total Logistics Cost</div>
                <div className="text-cyan-300 font-extrabold font-mono text-sm">
                  ${qaoaResult.solution.total_logistics_cost_usd}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Interactive Logistics Map</span>
          </button>

          <button
            onClick={() => setActiveTab('qubo')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qubo'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>QUBO Matrix & Hamiltonian</span>
          </button>

          <button
            onClick={() => setActiveTab('qaoa')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qaoa'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>QAOA Circuit & Probability</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Quantum vs Classical Benchmark</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manifest'
                ? 'bg-slate-100 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch Manifest Schedule</span>
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'map' && (
            <>
              <LogisticsMap
                nodes={currentDataset.nodes}
                activeRoutes={activeRoutes}
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
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
