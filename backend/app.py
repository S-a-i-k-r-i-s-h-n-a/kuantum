"""
FastAPI Server for Quantum Optimization Agricultural Supply Chain Management System
Exposes RESTful endpoints for QUBO matrix inspection, QAOA circuit execution,
Simulated Quantum Annealing, and real-time logistics route optimization.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import numpy as np
import time

from scenarios import DATASETS, PRODUCE_TYPES, VEHICLE_TYPES
from quantum_engine import AgriculturalQuantumOptimizer, QISKIT_AVAILABLE

app = FastAPI(
    title="QuantAgro Optimization API",
    description="Quantum-assisted Agricultural Supply Chain & Cold-Chain Logistics Engine",
    version="1.0.0"
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizeRequest(BaseModel):
    dataset_id: str = "california_central_valley"
    algorithm: str = "benchmark_all" # "qaoa", "sqa", "classical_sa", "benchmark_all"
    custom_nodes: Optional[List[Dict[str, Any]]] = None
    params: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "spoilage_weight": 2.5,
            "cost_weight": 1.0,
            "co2_weight": 1.5,
            "capacity_penalty": 10.0,
            "disruption_factor": 1.0,
            "p_layers": 2,
            "trotter_slices": 16
        }
    )

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "service": "QuantAgro Quantum Optimization Server",
        "qiskit_available": QISKIT_AVAILABLE,
        "quantum_backends": ["Qiskit Aer StatevectorSimulator", "Simulated Quantum Annealing (TFIM)", "NumPy QUBO Matrix Solver"],
        "timestamp": time.time()
    }

@app.get("/api/datasets")
def get_datasets():
    return {
        "datasets": DATASETS,
        "produce_types": PRODUCE_TYPES,
        "vehicle_types": VEHICLE_TYPES
    }

@app.post("/api/optimize")
def run_optimization(req: OptimizeRequest):
    # Select dataset
    if req.custom_nodes:
        dataset = {
            "id": "custom",
            "title": "Custom Agricultural Logistics Topology",
            "description": "User defined farm-to-market network",
            "region": "Custom Network",
            "nodes": req.custom_nodes
        }
    elif req.dataset_id in DATASETS:
        dataset = DATASETS[req.dataset_id]
    else:
        raise HTTPException(status_code=404, detail=f"Dataset {req.dataset_id} not found")

    optimizer = AgriculturalQuantumOptimizer(
        dataset=dataset,
        produce_types=PRODUCE_TYPES,
        vehicle_types=VEHICLE_TYPES,
        params=req.params or {}
    )

    Q, c, qubo_meta = optimizer.generate_qubo_matrix()

    results = {}
    algo = req.algorithm.lower()
    p_layers = req.params.get("p_layers", 2)
    trotter_slices = req.params.get("trotter_slices", 16)

    if algo == "qaoa" or algo == "benchmark_all":
        results["qaoa"] = optimizer.solve_qaoa(p_layers=p_layers)

    if algo == "sqa" or algo == "benchmark_all":
        results["sqa"] = optimizer.solve_sqa(trotter_slices=trotter_slices)

    if algo == "classical_sa" or algo == "benchmark_all":
        results["classical_sa"] = optimizer.solve_classical_sa()

    # Formulate QUBO matrix representation for visualization
    qubo_visualization = {
        "matrix": Q.tolist(),
        "bias_vector": c.tolist(),
        "variable_names": qubo_meta["variable_names"],
        "num_variables": qubo_meta["num_variables"],
        "edge_details": qubo_meta["edge_details"]
    }

    # Summary analytics comparing quantum vs classical
    benchmark_summary = []
    for k, v in results.items():
        sol = v["solution"]
        benchmark_summary.append({
            "algorithm": v["solver"],
            "key": k,
            "execution_time_sec": v["execution_time_sec"],
            "logistics_cost_usd": sol["total_logistics_cost_usd"],
            "spoilage_loss_usd": sol["total_spoilage_loss_usd"],
            "transport_cost_usd": sol["total_transport_cost_usd"],
            "co2_kg": sol["total_co2_kg"],
            "freshness_pct": sol["average_freshness_pct"],
            "energy_cost": v["energy_cost"]
        })

    return {
        "dataset": dataset,
        "qubo": qubo_visualization,
        "results": results,
        "benchmark_summary": benchmark_summary,
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
