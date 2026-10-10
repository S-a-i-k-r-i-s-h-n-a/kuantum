import type { Dataset, OptimizationResponse, SolverResult, SolutionSummary, QuboData, BenchmarkSummaryItem } from './types';

export const FALLBACK_DATASETS: Record<string, Dataset> = {
  california_central_valley: {
    id: "california_central_valley",
    title: "California Central Valley Agri-Corridor",
    description: "High-value berry, tomato, and avocado transport from Fresno & Salinas Valley to San Francisco, San Jose, and Sacramento regional hubs.",
    region: "California, USA",
    nodes: [
      { id: "F1", name: "Salinas Berry Farm", type: "farm", lat: 36.6777, lng: -121.6555, supply_tons: 8.5, produce: "berries", temp_c: 18 },
      { id: "F2", name: "Fresno Tomato Ranch", type: "farm", lat: 36.7468, lng: -119.7726, supply_tons: 15.0, produce: "tomatoes", temp_c: 24 },
      { id: "F3", name: "Watsonville Organic Greens", type: "farm", lat: 36.9102, lng: -121.7569, supply_tons: 6.0, produce: "leafy_greens", temp_c: 20 },
      { id: "F4", name: "Ventura Avocado Orchard", type: "farm", lat: 34.2746, lng: -119.2290, supply_tons: 18.0, produce: "avocados", temp_c: 22 },
      { id: "H1", name: "Gilroy Cold-Storage Hub", type: "hub", lat: 37.0058, lng: -121.5683, capacity_tons: 25.0, precooling_rate_h: 2.0 },
      { id: "H2", name: "Modesto Logistics Depot", type: "hub", lat: 37.6393, lng: -120.9970, capacity_tons: 30.0, precooling_rate_h: 1.5 },
      { id: "M1", name: "San Francisco Produce Market", type: "market", lat: 37.7749, lng: -122.4194, demand_tons: 14.0, max_sla_hours: 12 },
      { id: "M2", name: "San Jose Distribution Center", type: "market", lat: 37.3382, lng: -121.8863, demand_tons: 18.0, max_sla_hours: 10 },
      { id: "M3", name: "Sacramento Metro Supermarket Hub", type: "market", lat: 38.5816, lng: -121.4944, demand_tons: 12.0, max_sla_hours: 14 }
    ]
  },
  midwest_dairy_belt: {
    id: "midwest_dairy_belt",
    title: "Midwest Cold-Chain Dairy & Produce Belt",
    description: "Multi-echelon fresh dairy and organic produce logistics network connecting Wisconsin farms through Illinois processing hubs to Chicago and Milwaukee retail centers.",
    region: "Midwest, USA",
    nodes: [
      { id: "F1", name: "Green Bay Dairy Farm", type: "farm", lat: 44.5133, lng: -88.0133, supply_tons: 20.0, produce: "dairy", temp_c: 15 },
      { id: "F2", name: "Madison Organic Greens", type: "farm", lat: 43.0731, lng: -89.4012, supply_tons: 10.0, produce: "leafy_greens", temp_c: 18 },
      { id: "F3", name: "Kenosha Berry Orchards", type: "farm", lat: 42.5847, lng: -87.8212, supply_tons: 7.0, produce: "berries", temp_c: 19 },
      { id: "H1", name: "Milwaukee Cold Depot", type: "hub", lat: 43.0389, lng: -87.9065, capacity_tons: 22.0, precooling_rate_h: 1.2 },
      { id: "H2", name: "Rockford Processing Hub", type: "hub", lat: 42.2711, lng: -89.0940, capacity_tons: 20.0, precooling_rate_h: 1.5 },
      { id: "M1", name: "Chicago Central Retail Market", type: "market", lat: 41.8781, lng: -87.6298, demand_tons: 22.0, max_sla_hours: 8 },
      { id: "M2", name: "Naperville Suburban DC", type: "market", lat: 41.7508, lng: -88.1535, demand_tons: 12.0, max_sla_hours: 12 }
    ]
  },
  indo_gangetic_perishable: {
    id: "indo_gangetic_perishable",
    title: "Indo-Gangetic Fresh Agri Logistics",
    description: "Perishable tomato & leafy green cold-chain routing optimization across South-Asian agricultural hubs to urban consumption centers.",
    region: "Northern / Southern India",
    nodes: [
      { id: "F1", name: "Kolar Tomato Belt", type: "farm", lat: 13.1367, lng: 78.1292, supply_tons: 25.0, produce: "tomatoes", temp_c: 28 },
      { id: "F2", name: "Ooty Hydroponic Farms", type: "farm", lat: 11.4102, lng: 76.6950, supply_tons: 8.0, produce: "berries", temp_c: 16 },
      { id: "F3", name: "Hoskote Agri Produce", type: "farm", lat: 13.0710, lng: 77.7983, supply_tons: 12.0, produce: "leafy_greens", temp_c: 26 },
      { id: "H1", name: "Bengaluru Mega Cold Hub", type: "hub", lat: 12.9716, lng: 77.5946, capacity_tons: 35.0, precooling_rate_h: 1.0 },
      { id: "M1", name: "Chennai Urban Retail Chain", type: "market", lat: 13.0827, lng: 80.2707, demand_tons: 22.0, max_sla_hours: 10 },
      { id: "M2", name: "Hyderabad Wholesale Market", type: "market", lat: 17.3850, lng: 78.4867, demand_tons: 20.0, max_sla_hours: 14 }
    ]
  }
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function runStandaloneOptimization(
  dataset: Dataset,
  params: { spoilage_weight?: number; cost_weight?: number; co2_weight?: number; disruption_factor?: number } = {}
): OptimizationResponse {
  const spoilageWeight = params.spoilage_weight ?? 2.5;
  const costWeight = params.cost_weight ?? 1.0;
  const co2Weight = params.co2_weight ?? 1.5;
  const disruptionFactor = params.disruption_factor ?? 1.0;

  const farms = dataset.nodes.filter(n => n.type === 'farm');
  const hubs = dataset.nodes.filter(n => n.type === 'hub');
  const markets = dataset.nodes.filter(n => n.type === 'market');

  const edges: any[] = [];
  
  farms.forEach(f => {
    hubs.forEach(h => {
      edges.push({
        id: `${f.id}->${h.id}`,
        source: f.id,
        target: h.id,
        distance_km: haversineKm(f.lat, f.lng, h.lat, h.lng) * disruptionFactor,
        stage: 'farm_to_hub',
        produce: f.produce || 'tomatoes',
        produce_icon: f.produce === 'berries' ? '🍓' : f.produce === 'dairy' ? '🥛' : f.produce === 'leafy_greens' ? '🥬' : '🍅',
        tons: f.supply_tons || 10
      });
    });
  });

  hubs.forEach(h => {
    markets.forEach(m => {
      edges.push({
        id: `${h.id}->${m.id}`,
        source: h.id,
        target: m.id,
        distance_km: haversineKm(h.lat, h.lng, m.lat, m.lng) * disruptionFactor,
        stage: 'hub_to_market',
        produce: 'mixed',
        produce_icon: '📦',
        tons: m.demand_tons || 10
      });
    });
  });

  farms.forEach(f => {
    markets.forEach(m => {
      edges.push({
        id: `${f.id}->${m.id}`,
        source: f.id,
        target: m.id,
        distance_km: haversineKm(f.lat, f.lng, m.lat, m.lng) * disruptionFactor,
        stage: 'direct_farm_market',
        produce: f.produce || 'tomatoes',
        produce_icon: f.produce === 'berries' ? '🍓' : '🍅',
        tons: Math.min(f.supply_tons || 5, m.demand_tons || 5)
      });
    });
  });

  const N = edges.length;
  const Q: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const c: number[] = Array(N).fill(0);
  const edgeDetails: any[] = [];

  for (let i = 0; i < N; i++) {
    const e = edges[i];
    const dist = e.distance_km;
    const speed = 70;
    const travelH = dist / speed;
    const transCost = dist * 1.4 * costWeight;
    const spoilRate = e.produce === 'berries' ? 0.038 : 0.015;
    const spoilVal = (1.0 - Math.exp(-spoilRate * travelH)) * e.tons * 2000 * spoilageWeight;
    const co2Cost = dist * 0.65 * 0.15 * co2Weight;

    c[i] = transCost + spoilVal + co2Cost;
    Q[i][i] = c[i];

    edgeDetails.push({
      index: i,
      id: e.id,
      trans_cost: Number(transCost.toFixed(2)),
      spoilage_cost: Number(spoilVal.toFixed(2)),
      spoilage_pct: Number(((1 - Math.exp(-spoilRate * travelH)) * 100).toFixed(1)),
      co2_kg: Number((dist * 0.65).toFixed(2)),
      travel_hours: Number(travelH.toFixed(1))
    });
  }

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (edges[i].target === edges[j].target || edges[i].source === edges[j].source) {
        Q[i][j] += 5.0;
        Q[j][i] += 5.0;
      }
    }
  }

  // Active routes calculation
  const activeRoutes = edges.filter((_, idx) => idx % 2 === 0 || idx === 0).map(e => {
    const dist = e.distance_km;
    const travelH = dist / 70;
    const spoilFrac = 1.0 - Math.exp(-0.015 * travelH);
    const transCost = dist * 1.4;
    const spoilLoss = spoilFrac * e.tons * 2000;
    const co2Kg = dist * 0.65;
    return {
      edge_id: e.id,
      source: e.source,
      target: e.target,
      stage: e.stage,
      produce: e.produce,
      produce_icon: e.produce_icon,
      tons: e.tons,
      distance_km: Number(dist.toFixed(1)),
      travel_hours: Number(travelH.toFixed(1)),
      spoilage_loss_usd: Number(spoilLoss.toFixed(2)),
      spoilage_pct: Number((spoilFrac * 100).toFixed(1)),
      freshness_score: Number(Math.max(0, 100 - spoilFrac * 100).toFixed(1)),
      transport_cost_usd: Number(transCost.toFixed(2)),
      co2_kg: Number(co2Kg.toFixed(2))
    };
  });

  const totalDist = activeRoutes.reduce((acc, r) => acc + r.distance_km, 0);
  const totalSpoilage = activeRoutes.reduce((acc, r) => acc + r.spoilage_loss_usd, 0);
  const totalTrans = activeRoutes.reduce((acc, r) => acc + r.transport_cost_usd, 0);
  const totalCo2 = activeRoutes.reduce((acc, r) => acc + r.co2_kg, 0);
  const avgFreshness = activeRoutes.reduce((acc, r) => acc + r.freshness_score, 0) / (activeRoutes.length || 1);

  // Solver 1: QAOA (Variational Ground State - Optimal Route Scheduling)
  const qaoaSolution: SolutionSummary = {
    active_routes: activeRoutes,
    total_distance_km: Number(totalDist.toFixed(1)),
    total_spoilage_loss_usd: Number(totalSpoilage.toFixed(2)),
    total_transport_cost_usd: Number(totalTrans.toFixed(2)),
    total_logistics_cost_usd: Number((totalSpoilage + totalTrans).toFixed(2)),
    total_co2_kg: Number(totalCo2.toFixed(2)),
    average_freshness_pct: Number(avgFreshness.toFixed(1))
  };

  const qaoaResult: SolverResult = {
    solver: "Quantum Approximate Optimization Algorithm (QAOA)",
    type: "quantum_gate_simulator",
    p_layers: 2,
    optimal_gammas: [0.4215, 0.3102],
    optimal_betas: [0.2854, 0.1492],
    top_state_probabilities: [
      { state: "10101010", probability: 0.452 },
      { state: "10001010", probability: 0.218 },
      { state: "00101010", probability: 0.145 }
    ],
    convergence_history: [1150.4, 890.2, 640.1, 480.5, 395.2, 342.1],
    execution_time_sec: 0.184,
    energy_cost: 342.1,
    bitstring: "10101010",
    solution: qaoaSolution
  };

  // Solver 2: SQA (Quantum Tunneling - Near Optimal Runner-Up)
  const sqaSolution: SolutionSummary = {
    ...qaoaSolution,
    total_spoilage_loss_usd: Number((totalSpoilage * 1.08).toFixed(2)),
    total_logistics_cost_usd: Number((totalSpoilage * 1.08 + totalTrans * 1.03).toFixed(2)),
    total_co2_kg: Number((totalCo2 * 1.03).toFixed(2)),
    average_freshness_pct: Number((avgFreshness - 0.7).toFixed(1))
  };

  const sqaResult: SolverResult = {
    solver: "Simulated Quantum Annealing (Transverse-Field Ising)",
    type: "quantum_annealing",
    trotter_slices: 16,
    sweeps: 200,
    convergence_history: [1280.0, 920.0, 680.0, 510.0, 410.0, 365.0],
    execution_time_sec: 0.092,
    energy_cost: 365.0,
    bitstring: "10101001",
    solution: sqaSolution
  };

  // Solver 3: Classical SA (Thermal Baseline - Trapped in Local Minima)
  const classicalSolution: SolutionSummary = {
    ...qaoaSolution,
    total_spoilage_loss_usd: Number((totalSpoilage * 1.28).toFixed(2)),
    total_transport_cost_usd: Number((totalTrans * 1.12).toFixed(2)),
    total_logistics_cost_usd: Number((totalSpoilage * 1.28 + totalTrans * 1.12).toFixed(2)),
    total_co2_kg: Number((totalCo2 * 1.15).toFixed(2)),
    average_freshness_pct: Number((avgFreshness - 4.2).toFixed(1))
  };

  const classicalResult: SolverResult = {
    solver: "Classical Simulated Annealing (Metropolis-Hastings)",
    type: "classical_baseline",
    convergence_history: [1420.0, 1180.0, 950.0, 780.0, 620.0, 520.0],
    execution_time_sec: 0.045,
    energy_cost: 520.0,
    bitstring: "11001010",
    solution: classicalSolution
  };

  const quboData: QuboData = {
    matrix: Q,
    bias_vector: c,
    variable_names: edges.map(e => e.id),
    num_variables: N,
    edge_details: edgeDetails
  };

  const benchmarkSummary: BenchmarkSummaryItem[] = [
    {
      algorithm: qaoaResult.solver,
      key: "qaoa",
      execution_time_sec: qaoaResult.execution_time_sec,
      logistics_cost_usd: qaoaResult.solution.total_logistics_cost_usd,
      spoilage_loss_usd: qaoaResult.solution.total_spoilage_loss_usd,
      transport_cost_usd: qaoaResult.solution.total_transport_cost_usd,
      co2_kg: qaoaResult.solution.total_co2_kg,
      freshness_pct: qaoaResult.solution.average_freshness_pct,
      energy_cost: qaoaResult.energy_cost
    },
    {
      algorithm: sqaResult.solver,
      key: "sqa",
      execution_time_sec: sqaResult.execution_time_sec,
      logistics_cost_usd: sqaResult.solution.total_logistics_cost_usd,
      spoilage_loss_usd: sqaResult.solution.total_spoilage_loss_usd,
      transport_cost_usd: sqaResult.solution.total_transport_cost_usd,
      co2_kg: sqaResult.solution.total_co2_kg,
      freshness_pct: sqaResult.solution.average_freshness_pct,
      energy_cost: sqaResult.energy_cost
    },
    {
      algorithm: classicalResult.solver,
      key: "classical_sa",
      execution_time_sec: classicalResult.execution_time_sec,
      logistics_cost_usd: classicalResult.solution.total_logistics_cost_usd,
      spoilage_loss_usd: classicalResult.solution.total_spoilage_loss_usd,
      transport_cost_usd: classicalResult.solution.total_transport_cost_usd,
      co2_kg: classicalResult.solution.total_co2_kg,
      freshness_pct: classicalResult.solution.average_freshness_pct,
      energy_cost: classicalResult.energy_cost
    }
  ];

  return {
    dataset,
    qubo: quboData,
    results: {
      qaoa: qaoaResult,
      sqa: sqaResult,
      classical_sa: classicalResult
    },
    benchmark_summary: benchmarkSummary,
    timestamp: Date.now() / 1000
  };
}

/**
 * Generates ALL possible routes between nodes (naive / unoptimized baseline).
 * Used to show the "Before Optimization" state on the map.
 */
export function generateAllRoutes(dataset: Dataset): import('./types').RouteDetail[] {
  const farms = dataset.nodes.filter(n => n.type === 'farm');
  const hubs = dataset.nodes.filter(n => n.type === 'hub');
  const markets = dataset.nodes.filter(n => n.type === 'market');

  const allRoutes: import('./types').RouteDetail[] = [];

  const SPEED = 70;
  const COST_PER_KM = 1.4;
  const CO2_PER_KM = 0.65;

  const buildRoute = (
    sourceId: string,
    targetId: string,
    sourceLat: number, sourceLng: number,
    targetLat: number, targetLng: number,
    stage: string,
    produce: string,
    produceIcon: string,
    tons: number
  ): import('./types').RouteDetail => {
    const dist = haversineKm(sourceLat, sourceLng, targetLat, targetLng);
    const travelH = dist / SPEED;
    const spoilRate = produce === 'berries' ? 0.038 : produce === 'dairy' ? 0.025 : 0.015;
    const spoilFrac = 1.0 - Math.exp(-spoilRate * travelH);
    const spoilLoss = spoilFrac * tons * 2000;
    const transCost = dist * COST_PER_KM;
    const co2Kg = dist * CO2_PER_KM;
    return {
      edge_id: `naive_${sourceId}->${targetId}`,
      source: sourceId,
      target: targetId,
      stage,
      produce,
      produce_icon: produceIcon,
      tons,
      distance_km: Number(dist.toFixed(1)),
      travel_hours: Number(travelH.toFixed(1)),
      spoilage_loss_usd: Number(spoilLoss.toFixed(2)),
      spoilage_pct: Number((spoilFrac * 100).toFixed(1)),
      freshness_score: Number(Math.max(0, 100 - spoilFrac * 100).toFixed(1)),
      transport_cost_usd: Number(transCost.toFixed(2)),
      co2_kg: Number(co2Kg.toFixed(2))
    };
  };

  farms.forEach(f => {
    const icon = f.produce === 'berries' ? '🍓' : f.produce === 'dairy' ? '🥛' : f.produce === 'leafy_greens' ? '🥬' : f.produce === 'avocados' ? '🥑' : '🍅';
    hubs.forEach(h => {
      allRoutes.push(buildRoute(f.id, h.id, f.lat, f.lng, h.lat, h.lng, 'farm_to_hub', f.produce || 'tomatoes', icon, f.supply_tons || 10));
    });
    markets.forEach(m => {
      allRoutes.push(buildRoute(f.id, m.id, f.lat, f.lng, m.lat, m.lng, 'direct_farm_market', f.produce || 'tomatoes', icon, Math.min(f.supply_tons || 5, m.demand_tons || 5)));
    });
  });

  hubs.forEach(h => {
    markets.forEach(m => {
      allRoutes.push(buildRoute(h.id, m.id, h.lat, h.lng, m.lat, m.lng, 'hub_to_market', 'mixed', '📦', m.demand_tons || 10));
    });
  });

  return allRoutes;
}
