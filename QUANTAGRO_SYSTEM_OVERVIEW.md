# QuantAgro: Project Architecture, Mechanism & UI Improvement Roadmap

---

## 1. Executive Summary & Purpose

**QuantAgro** is a quantum-assisted logistics decision-support platform designed for perishable agricultural cold-chain distribution (Farms $\rightarrow$ Cold Hubs $\rightarrow$ Urban Markets).

### The Core Problem
Perishable commodities (berries, tomatoes, milk, leafy greens) suffer exponential biological decay over transit time and ambient temperature. Logistics operators face three competing objectives:
1. **Minimizing Transport Expenses**: Fuel costs and driver hours.
2. **Minimizing Produce Spoilage**: Financial losses when produce freshness drops below commercial thresholds.
3. **Minimizing Environmental Footprint**: Fleet greenhouse gas ($\text{CO}_2$) emissions and carbon taxes.

Under hard capacity bounds (cold hub refrigerated storage limits, truck payload ceilings, and delivery delivery windows), this problem is an NP-hard combinatorial optimization challenge. QuantAgro reformulates this logistics topology into a **QUBO (Quadratic Unconstrained Binary Optimization)** matrix and solves it via quantum algorithms (QAOA, SQA) alongside classical baselines.

---

## 2. Mathematical Formulation & Architecture

```mermaid
graph TD
    A[Regional Farm & Hub Dataset] --> B[Haversine Distance & Perishability Decay Engine]
    B --> C[QUBO Matrix Construction H(x) = xᵀ Q x + cᵀ x]
    C --> D{Solver Selection}
    D -->|Parametric Circuit| E[Qiskit QAOA Simulator]
    D -->|Quantum Tunneling TFIM| F[Simulated Quantum Annealing - SQA]
    D -->|Metropolis Heuristic| G[Classical Simulated Annealing - SA]
    D -->|Client-Side Fallback| H[JavaScript Standalone Engine]
    E --> I[Optimal Binary Bitstring x*]
    F --> I
    G --> I
    H --> I
    I --> J[Decoded Logistics Routes, KPI Scores, Map & Manifest]
```

### The QUBO Hamiltonian
The total system energy is defined as:
$$H(x) = \sum_{i} c_i x_i + \sum_{i < j} Q_{ij} x_i x_j$$

Where:
- $x_i \in \{0, 1\}$ represents whether route $i$ is dispatched ($1$) or dormant ($0$).
- **Linear Vector $c_i$**:
  $$c_i = w_{\text{cost}} \cdot \text{Cost}_i + w_{\text{spoilage}} \cdot \text{SpoilageLoss}_i + w_{\text{co2}} \cdot \text{Emissions}_i$$
- **Quadratic Matrix $Q_{ij}$**: Penalizes constraint violations using quadratic Lagrange multipliers (e.g., assigning more tons to a hub than its cooling infrastructure can physically store, or assigning redundant routes from a single farm).

---

## 3. Honest Reality Check: What is Computed vs. Simulated

| Component | Status | Technical Details |
| :--- | :---: | :--- |
| **QUBO Formulation** | **100% Real** | Genuine haversine distance calculation, perishability equations, and quadratic penalty matrix construction in NumPy. |
| **FastAPI REST Endpoints** | **100% Real** | Active REST service accepting dynamic parameters and delivering JSON payloads. |
| **Simulated Quantum Annealing (SQA)** | **100% Real Algorithm** | Path-Integral Monte Carlo using the Transverse-Field Ising Model (TFIM) across Trotter slices. |
| **Classical Simulated Annealing** | **100% Real Algorithm** | Authentic Metropolis-Hastings temperature-decay algorithm for baseline benchmarking. |
| **Qiskit QAOA Execution** | **Real Simulation** | Simulates quantum statevectors mathematically on your local CPU via Qiskit Aer. Does **not** connect to physical IBM quantum dilution cryostats. |
| **In-Browser Fallback Engine** | **Real Heuristic** | Pure TypeScript simulated annealing runner that guarantees the UI remains interactive if the Python server is offline. |
| **GIS Map Rendering** | **100% Real** | Leaflet + CARTO Raster Voyager tiles with authenticated API keys and real-world coordinates. |
| **Disruption Injection** | **100% Real** | Sliders alter mathematical weights and dynamically trigger recalculation of QUBO matrices. |
| **QAOA Gate Circuit Viewer** | **Visual Inspector** | Renders quantum logic gates corresponding to the optimized variational angles ($\gamma^*, \beta^*$). |

---

## 4. How to Run & Operate the System

### 1. Terminal 1: Backend
```powershell
cd "k:\Studies\sem 5\QC\Cap-Project\kuantum\backend"
python -m uvicorn app:app --reload --port 8000
```

### 2. Terminal 2: Frontend
```powershell
cd "k:\Studies\sem 5\QC\Cap-Project\kuantum\frontend"
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Comprehensive UI & Overall Improvements Roadmap

While the foundation is solid and the `#E2DED6` warm sand theme with tactile depth is applied, here are the most impactful improvements to elevate the project to production-grade standard:

### A. UI Improvements (High Priority)

#### 1. Unified Design System & Typography Tokens
- **Current State**: Mix of custom hex values and Tailwind utilities across components.
- **Improvement**: Standardize all font hierarchies:
  - Display numbers: Tabular figures (`font-mono tracking-tight font-black`) for financial figures ($), percentages (%), and weight metrics (tons).
  - Surface elevations: Create clear semantic CSS classes (`surface-ground`, `surface-card`, `surface-popover`) rather than hardcoding hex codes.

#### 2. Interactive Map UX Upgrades
- **Animated Truck Position Markers**: Render animated delivery truck icons that physically traverse the polylines between farms and cold hubs to bring the map to life.
- **Route Selection Linking**: Hovering over a route in the map should highlight the corresponding row in the Dispatch Manifest table and vice versa.
- **Interactive Node Creation**: Allow users to click directly on the map to drop custom farm or hub nodes and immediately test custom network topologies.

#### 3. Interactive QUBO Matrix Enhancements
- **Zoom & Pan Heatmap**: For large node topologies ($N > 25$), the QUBO matrix cells become small. Add an interactive SVG canvas with zoom and pan.
- **Color Threshold Filtering**: Add a toggle to hide all zero-weight cells ($Q_{ij} = 0$) to focus exclusively on conflicting route penalties.

#### 4. QAOA Circuit Interactivity
- **Gate-by-Gate State Evolution**: Allow users to scrub through layers $p = 1, 2, \dots$ to visualize how quantum interference amplitudes collapse toward the ground state bitstring.
- **Bloch Sphere Widget**: Render a 3D Three.js Bloch Sphere depicting single-qubit rotations under the mixer Hamiltonian $U(B, \beta)$.

#### 5. Benchmark Comparison Tooling
- **Statistical Error Bars**: Run multiple shots (e.g., 10 runs per solver) and display standard deviation error bars in Recharts for scientific credibility.
- **Time-to-Solution (TTS) Metric**: Add a wall-clock vs. energy convergence tradeoff chart.

---

### B. Functional & Algorithmic Improvements

#### 1. Hardware Integration (IBM Quantum Runtime)
- Connect to actual cloud QPUs (e.g., `ibm_brisbane`, `ibm_kyoto`) via an IBM Quantum API token using `qiskit-ibm-runtime` with Qiskit Sampler primitives.

#### 2. Quantum Noise Modeling
- Introduce simulated depolarizing noise, thermal relaxation ($T_1, T_2$), and readout errors using `qiskit_aer.noise` to show how current NISQ hardware behaves compared to ideal simulations.

#### 3. Real-Time Weather API Integration
- Connect the Disruption Simulator to an OpenWeather API endpoint to automatically adjust the spoilage weight $w_{\text{spoilage}}$ based on live regional ambient temperatures.
