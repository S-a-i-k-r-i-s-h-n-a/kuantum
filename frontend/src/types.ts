export interface Node {
  id: string;
  name: string;
  type: 'farm' | 'hub' | 'market';
  lat: number;
  lng: number;
  supply_tons?: number;
  demand_tons?: number;
  capacity_tons?: number;
  produce?: string;
  temp_c?: number;
  precooling_rate_h?: number;
  max_sla_hours?: number;
}

export interface Dataset {
  id: string;
  title: string;
  description: string;
  region: string;
  nodes: Node[];
}

export interface ProduceType {
  name: string;
  category: string;
  shelf_life_hours: number;
  optimal_temp_c: number;
  spoilage_rate_per_hour: number;
  value_per_ton: number;
  icon: string;
}

export interface VehicleType {
  name: string;
  capacity_tons: number;
  speed_kmh: number;
  cost_per_km: number;
  co2_per_km_kg: number;
  cooling_loss_factor: number;
}

export interface RouteDetail {
  edge_id: string;
  source: string;
  target: string;
  stage: string;
  produce: string;
  produce_icon: string;
  tons: number;
  distance_km: number;
  travel_hours: number;
  spoilage_loss_usd: number;
  spoilage_pct: number;
  freshness_score: number;
  transport_cost_usd: number;
  co2_kg: number;
}

export interface SolutionSummary {
  active_routes: RouteDetail[];
  total_distance_km: number;
  total_spoilage_loss_usd: number;
  total_transport_cost_usd: number;
  total_logistics_cost_usd: number;
  total_co2_kg: number;
  average_freshness_pct: number;
}

export interface SolverResult {
  solver: string;
  type: string;
  p_layers?: number;
  trotter_slices?: number;
  sweeps?: number;
  optimal_gammas?: number[];
  optimal_betas?: number[];
  top_state_probabilities?: { state: string; probability: number }[];
  convergence_history: number[];
  execution_time_sec: number;
  energy_cost: number;
  bitstring: string;
  solution: SolutionSummary;
}

export interface QuboData {
  matrix: number[][];
  bias_vector: number[];
  variable_names: string[];
  num_variables: number;
  edge_details: any[];
}

export interface BenchmarkSummaryItem {
  algorithm: string;
  key: string;
  execution_time_sec: number;
  logistics_cost_usd: number;
  spoilage_loss_usd: number;
  transport_cost_usd: number;
  co2_kg: number;
  freshness_pct: number;
  energy_cost: number;
}

export interface OptimizationResponse {
  dataset: Dataset;
  qubo: QuboData;
  results: Record<string, SolverResult>;
  benchmark_summary: BenchmarkSummaryItem[];
  timestamp: number;
}
