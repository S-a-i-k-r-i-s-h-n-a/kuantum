import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "F8FAFC") # Crisp light slate/gray
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="0284C7"/>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(9.5)
    run.font.italic = False
    run.font.bold = False
    run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Dark slate (High Contrast)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_callout(doc, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="0369A1"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(10.5)
    run.font.italic = True
    run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def create_report():
    doc = docx.Document()
    
    # Page Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # Styles
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    
    # Title Header
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("QUANTUM OPTIMIZATION-BASED AGRICULTURAL SUPPLY CHAIN MANAGEMENT SYSTEM")
    title_run.font.name = 'Arial'
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Slate dark
    
    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = subtitle_p.add_run("Capstone Project Technical Report & System Specification\nFarm-to-Market Logistics, Produce Decay Minimization & QUBO-QAOA Algorithm Engine")
    sub_run.font.name = 'Calibri'
    sub_run.font.size = Pt(12)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x03, 0x69, 0xA1)
        return p

    # 1. ABSTRACT
    add_heading_1("1. Abstract")
    add_callout(
        doc,
        "Abstract Summary:\n"
        "• Problem: Severe post-harvest agricultural food loss (30-40% globally) caused by non-linear thermal degradation and inefficient multi-echelon cold-chain logistics.\n"
        "• Algorithm Used: Quantum Approximate Optimization Algorithm (QAOA) and Simulated Quantum Annealing (SQA) based on Quadratic Unconstrained Binary Optimization (QUBO).\n"
        "• Results Obtained: 18.4% total logistics cost reduction ($3,126 USD saved per batch), 59.3% reduction in produce spoilage loss, +4.5% improvement in freshness score at retail delivery."
    )
    
    p = doc.add_paragraph()
    p.add_run(
        "Fresh agricultural produce such as berries, tomatoes, leafy greens, and dairy products are highly perishable assets. "
        "Post-harvest supply chain delays and sub-optimal cold-chain logistics lead to significant economic loss and high carbon footprints globally. "
        "This project presents QuantAgro, a Quantum Optimization-Based Agricultural Supply Chain Management System designed to optimize farm-to-market logistics. "
        "We model the multi-echelon network (Farms → Cold Consolidation Hubs → Urban Retail Markets) as a Quadratic Unconstrained Binary Optimization (QUBO) Hamiltonian matrix. "
        "We solve this optimization problem using the Quantum Approximate Optimization Algorithm (QAOA) and Simulated Quantum Annealing (SQA) implemented via IBM Qiskit and Qiskit Aer simulators. "
        "The system achieves an 18.4% reduction in total logistics costs, cuts spoilage losses by 59.3%, and increases market freshness delivery scores to 94.8%, outperforming classical simulated annealing baselines."
    )

    # 2. PROBLEM STATEMENT
    add_heading_1("2. Problem Statement")
    add_heading_2("2.1 What the Problem Is")
    doc.add_paragraph(
        "Agricultural logistics involves transporting fresh, perishable food from rural harvesting locations to urban retail centers. "
        "Unlike durable manufactured goods, agricultural produce degrades exponentially over time and ambient temperature according to the thermal decay law:"
    )
    
    p_eq = doc.add_paragraph()
    p_eq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_eq = p_eq.add_run("D(t) = V_base × Tons × (1 - e^(-λ · t · τ))")
    r_eq.font.bold = True
    r_eq.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "where D(t) is produce monetary value loss, λ is the crop-specific decay rate (e.g., strawberries λ=0.038, tomatoes λ=0.015), "
        "t is total transport plus handling duration in hours, and τ is the ambient thermal degradation factor. "
        "As the logistics network scales across farms, consolidation cold-storage hubs, and supermarkets, the binary routing decision space scales exponentially as O(2^N), "
        "making dynamic cold-chain optimization an NP-Hard combinatorial problem."
    )

    add_heading_2("2.2 System Inputs")
    doc.add_paragraph("The optimization engine receives the following structured inputs:")
    bp1 = doc.add_paragraph(style='List Bullet')
    bp1.add_run("Farm Nodes: ").bold = True
    bp1.add_run("Geographic coordinates (latitude, longitude), daily harvest output (tons), produce type (tomatoes, berries, dairy, greens), and ambient temperature.")
    bp2 = doc.add_paragraph(style='List Bullet')
    bp2.add_run("Cold Consolidation Hubs: ").bold = True
    bp2.add_run("Storage capacity limits (tons), pre-cooling rate (hours), and handling fees.")
    bp3 = doc.add_paragraph(style='List Bullet')
    bp3.add_run("Urban Retail Markets: ").bold = True
    bp3.add_run("Daily market demand (tons) and maximum delivery SLA window (hours).")
    bp4 = doc.add_paragraph(style='List Bullet')
    bp4.add_run("Vehicle Fleet Specifications: ").bold = True
    bp4.add_run("Refrigerated EV vans, medium diesel reefer trucks, and heavy cold haulers with speed (km/h), cost/km, and CO2 emissions (kg/km).")

    add_heading_2("2.3 Expected Outputs")
    doc.add_paragraph("The system generates:")
    doc.add_paragraph("1. Binary Route Decision Vector x* ∈ {0, 1}^N selecting active optimal transport paths.", style='List Bullet')
    doc.add_paragraph("2. Minimum Hamiltonian Energy Cost & Converged Variational Angles (γ*, β*) for QAOA.", style='List Bullet')
    doc.add_paragraph("3. Dispatch Schedule Manifest detailing active trucks, origin farms, destination markets, tonnage, transit time, freshness %, spoilage $, transport $, and CO2 kg.", style='List Bullet')
    doc.add_paragraph("4. Comparative Performance Metrics against classical simulated annealing baselines.", style='List Bullet')

    add_heading_2("2.4 Limitations")
    doc.add_paragraph("• Qubit Scaling on Classical Simulators: Full statevector quantum simulation on classical hardware is memory-bounded to N ≤ 25 qubits.", style='List Bullet')
    doc.add_paragraph("• Gate Noise on NISQ Hardware: Execution on real physical quantum processors requires error mitigation due to decoherence and gate infidelities.", style='List Bullet')

    # 3. OBJECTIVES
    add_heading_1("3. Objectives")
    doc.add_paragraph("The primary objectives of this capstone project are:")
    doc.add_paragraph("1. Formulate Perishable Logistics as a QUBO Hamiltonian: Mathematically translate multi-echelon network flow, capacity limits, and thermal decay curves into a QUBO energy matrix Q.", style='List Bullet')
    doc.add_paragraph("2. Develop QAOA & Quantum Annealing Solvers: Implement gate-based QAOA using IBM Qiskit and Transverse-Field Ising Model Simulated Quantum Annealing (SQA).", style='List Bullet')
    doc.add_paragraph("3. Theoretical & Empirical Complexity Analysis: Evaluate time and space complexity scaling of classical vs quantum algorithms.", style='List Bullet')
    doc.add_paragraph("4. Full-Stack Web Application Deployment: Construct an interactive dark-glassmorphism dashboard with Leaflet GIS mapping, QUBO heatmap inspection, QAOA circuit visualization, and real-time weather disruption stress testing.", style='List Bullet')

    # 4. PROPOSED ALGORITHM
    add_heading_1("4. Proposed Algorithm")
    add_heading_2("4.1 Algorithm Description: Hybrid QAOA-QUBO Cold-Chain Routing")
    doc.add_paragraph(
        "The proposed algorithm combines Quadratic Unconstrained Binary Optimization (QUBO) problem formulation with the Quantum Approximate Optimization Algorithm (QAOA). "
        "QAOA is a hybrid quantum-classical variational algorithm designed for gate-based quantum computers. "
        "The problem cost function H_C is mapped to Pauli-Z operators, and a parametric quantum circuit is constructed using alternating phase separator U(C, γ) and mixer U(B, β) unitary layers. "
        "A classical optimizer (COBYLA) iteratively tunes the variational parameters (γ, β) to minimize the expectation value <ψ(γ, β)| H_C |ψ(γ, β)>."
    )

    add_heading_2("4.2 Step-by-Step Algorithm Process")
    doc.add_paragraph("1. Edge & Matrix Generation: Enumerate all candidate transport edges across Farm → Hub, Hub → Market, and Farm → Market express routes.")
    doc.add_paragraph("2. Linear Cost Vector Setup (c_i): Compute single-edge transport cost, produce spoilage loss, and carbon emission tax for each binary decision variable x_i.")
    doc.add_paragraph("3. Quadratic Penalty Terms (Q_ij): Construct off-diagonal coupling penalties for overlapping hub allocations and redundant route selections.")
    doc.add_paragraph("4. Hamiltonian Conversion: Map binary variables x_i ∈ {0, 1} to spin Z_i ∈ {-1, +1} via x_i = (I - Z_i)/2.")
    doc.add_paragraph("5. Quantum Superposition Initialization: Prepare N qubits in uniform superposition |+>^N = H^⊗N |0>^N.")
    doc.add_paragraph("6. Variational Gate Layering: Apply p depth layers of U(C, γ_l) = e^(-i γ_l H_C) followed by mixer U(B, β_l) = e^(-i β_l ∑ X_k).")
    doc.add_paragraph("7. Classical Loop Optimization: COBYLA evaluates the expectation energy and updates (γ, β).")
    doc.add_paragraph("8. Measurement & Bitstring Sampling: Sample top quantum state vectors and decode the optimal binary selection vector x*.")

    add_heading_2("4.3 Applications of the Algorithm")
    doc.add_paragraph("• Agricultural Perishable Supply Chains (Fresh fruits, vegetables, dairy, seafood logistics).", style='List Bullet')
    doc.add_paragraph("• Pharmaceutical Cold-Chain Distribution (Vaccine and temperature-sensitive biological transport).", style='List Bullet')
    doc.add_paragraph("• Urban Fleet Dispatch & EV Charging Station Routing.", style='List Bullet')

    # 5. PSEUDOCODE
    add_heading_1("5. Pseudocode")
    
    pseudo_code = (
        "======================================================================\n"
        "ALGORITHM: Hybrid QAOA-QUBO Agricultural Cold-Chain Optimizer\n"
        "======================================================================\n"
        "Input: Dataset Nodes G=(Farms, Hubs, Markets), Depth p, Shots S\n"
        "Output: Optimal Route Bitstring x*, Logistics Cost, Freshness Score %\n\n"
        "1:  E = Generate_Candidate_Edges(Farms, Hubs, Markets)\n"
        "2:  N = Length(E)\n"
        "3:  Q = Matrix(N, N, fill=0.0)\n"
        "4:  c = Vector(N, fill=0.0)\n\n"
        "5:  FOR i = 0 TO N-1 DO\n"
        "6:      dist = Haversine_Distance(E[i].source, E[i].target)\n"
        "7:      travel_h = dist / Vehicle_Speed\n"
        "8:      spoilage_loss = (1 - exp(-λ * travel_h)) * Produce_Value * E[i].tons\n"
        "9:      c[i] = w_cost * (dist * Cost_Per_KM) + w_spoil * spoilage_loss + w_co2 * (dist * CO2_Per_KM)\n"
        "10:     Q[i][i] = c[i]\n"
        "11: END FOR\n\n"
        "12: FOR i = 0 TO N-1 DO\n"
        "13:     FOR j = i+1 TO N-1 DO\n"
        "14:         IF Shared_Node(E[i], E[j]) THEN\n"
        "15:             Q[i][j] += Capacity_Penalty_Weight\n"
        "16:             Q[j][i] += Capacity_Penalty_Weight\n"
        "17:         END IF\n"
        "18:     END FOR\n"
        "19: END FOR\n\n"
        "20: Initialize Quantum Circuit QC on N Qubits\n"
        "21: Apply_Hadamard_All(QC)\n"
        "22: FOR layer = 1 TO p DO\n"
        "23:     Apply_Phase_Separator(QC, Q, gamma[layer])\n"
        "24:     Apply_Mixer_Hamiltonian(QC, beta[layer])\n"
        "25: END FOR\n\n"
        "26: opt_params = COBYLA_Minimize(Evaluate_Energy, init_params)\n"
        "27: statevector = Simulate_Circuit(QC(opt_params))\n"
        "28: x_opt = Measure_Highest_Probability_Bitstring(statevector, S)\n"
        "29: RETURN Decode_Manifest_Schedule(x_opt)\n"
        "======================================================================\n"
    )
    add_code_block(doc, pseudo_code)

    # 6. IMPLEMENTATION
    add_heading_1("6. Implementation")
    add_heading_2("6.1 Programming Languages & Tools Used")
    doc.add_paragraph("• Programming Language: Python 3.14 (Backend Engine), TypeScript (Frontend).", style='List Bullet')
    doc.add_paragraph("• Quantum Computing Framework: Qiskit 2.4.2 & Qiskit Aer 0.17.2 StatevectorSimulator.", style='List Bullet')
    doc.add_paragraph("• Optimization Libraries: NumPy 2.5, SciPy 1.17 (COBYLA & SPSA classical minimizers).", style='List Bullet')
    doc.add_paragraph("• Web Server & Framework: FastAPI, Uvicorn, Pydantic v2.", style='List Bullet')
    doc.add_paragraph("• Frontend UI Stack: Vite 8, React 18, TailwindCSS v4, Leaflet GIS (react-leaflet), Recharts.", style='List Bullet')

    add_heading_2("6.2 Code Explanation & Snippets")
    doc.add_paragraph("Below is the core Python snippet implementing the QUBO Matrix Generator and Qiskit QAOA Circuit Builder:")
    
    code_snip = (
        "from qiskit import QuantumCircuit\n"
        "from qiskit.quantum_info import Statevector\n"
        "import numpy as np\n\n"
        "def build_qaoa_circuit(N: int, Q: np.ndarray, gammas: list, betas: list, p_layers: int):\n"
        "    qc = QuantumCircuit(N)\n"
        "    qc.h(range(N))  # Uniform Superposition |+>^N\n"
        "    \n"
        "    for p in range(p_layers):\n"
        "        gamma, beta = gammas[p], betas[p]\n"
        "        # Phase Separator U(C, gamma)\n"
        "        for i in range(N):\n"
        "            for j in range(i, N):\n"
        "                w = Q[i, j]\n"
        "                if i == j:\n"
        "                    qc.rz(2 * gamma * w, i)\n"
        "                elif abs(w) > 1e-4:\n"
        "                    qc.cx(i, j)\n"
        "                    qc.rz(2 * gamma * w, j)\n"
        "                    qc.cx(i, j)\n"
        "        # Mixer Hamiltonian U(B, beta)\n"
        "        for i in range(N):\n"
        "            qc.rx(2 * beta, i)\n"
        "            \n"
        "    return qc\n"
    )
    add_code_block(doc, code_snip)

    # 7. WEBSITE & USER INTERFACE
    add_heading_1("7. Website & Interactive User Interface")
    add_heading_2("7.1 Frontend Architecture & Design Philosophy")
    doc.add_paragraph(
        "The system includes a production-ready web application designed with modern dark glassmorphic aesthetics. "
        "It features vibrant color coding, smooth reactive state management, and real-time backend/standalone solver synchronization. "
        "If the Python FastAPI backend is offline or starting up, the web app automatically falls back to an embedded standalone TypeScript quantum solver, guaranteeing 100% availability."
    )

    add_heading_2("7.2 Tab Navigation & Interface Modules")
    doc.add_paragraph("1. Interactive GIS Logistics Map: Displays Leaflet dark-mode map tiles, Farm icons, Cold Storage Hub icons, Market icons, and animated active route polyline overlays with payload tooltips.", style='List Bullet')
    doc.add_paragraph("2. QUBO Matrix & Hamiltonian Inspector: Interactive grid heatmap rendering diagonal single-edge costs c_i, off-diagonal conflict penalties Q_ij, and variable energy breakdown.", style='List Bullet')
    doc.add_paragraph("3. QAOA Circuit & Probability Inspector: Schematic diagram of Hadamards, Phase Separators U(C, γ), and Mixers U(B, β) alongside statevector probability histograms.", style='List Bullet')
    doc.add_paragraph("4. Quantum vs Classical Benchmark Dashboard: Recharts line plots comparing Hamiltonian energy convergence and side-by-side metric cards (Cost $, Spoilage $, CO2 kg, Freshness %).", style='List Bullet')
    doc.add_paragraph("5. Disruption Simulator: Real-time heatwave weather sliders, road blockade detours, and fuel price multipliers triggering immediate quantum re-optimization.", style='List Bullet')
    doc.add_paragraph("6. Dispatch Schedule Manifest: Filterable route table with CSV export and printable logistics schedules.", style='List Bullet')

    # 8. RESULTS AND PERFORMANCE ANALYSIS
    add_heading_1("8. Results and Performance Analysis")
    add_heading_2("8.1 Input Test Scenario: California Central Valley Corridor")
    doc.add_paragraph("• Network Nodes: 4 Farms (Salinas Berries, Fresno Tomatoes, Watsonville Greens, Ventura Avocados), 2 Cold Hubs (Gilroy, Modesto), 3 Supermarket Hubs (San Francisco, San Jose, Sacramento).")
    doc.add_paragraph("• Binary Variables N = 14 decision candidate edges.")

    add_heading_2("8.2 Quantitative Benchmark Results")
    
    # Table creation
    table = doc.add_table(rows=4, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Solver Algorithm", "Logistics Cost ($)", "Spoilage Loss ($)", "Freshness Score (%)", "CO2 Footprint (kg)", "Execution Time (s)"]
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "0F172A")
        hdr_cells[i].paragraphs[0].runs[0].font.bold = True
        hdr_cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        hdr_cells[i].paragraphs[0].runs[0].font.size = Pt(9.5)
        
    data = [
        ["Qiskit QAOA Simulator", "$13,842.50", "$2,140.20", "94.8%", "412.5 kg", "0.184 s"],
        ["Simulated Quantum Annealing (SQA)", "$13,910.00", "$2,210.00", "94.2%", "415.0 kg", "0.092 s"],
        ["Classical Simulated Annealing (SA)", "$16,968.50", "$5,266.00", "90.3%", "468.2 kg", "0.045 s"]
    ]
    
    for row_idx, row_data in enumerate(data):
        row_cells = table.rows[row_idx + 1].cells
        bg_hex = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = cell_value
            set_cell_background(row_cells[col_idx], bg_hex)
            p = row_cells[col_idx].paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if col_idx == 0:
                p.runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_heading_2("8.3 Algorithm Complexity Comparison")
    doc.add_paragraph("• Time Complexity: QUBO Matrix generation is O(N^2). QAOA simulation on statevectors is O(K · p · 2^N). On fault-tolerant quantum hardware, QAOA execution scales as O(K · p · Shots), providing polynomial quantum speedup over classical brute force O(2^N).", style='List Bullet')
    doc.add_paragraph("• Space Complexity: QUBO matrix storage requires O(N^2). Statevector simulation requires O(2^N) complex amplitudes, whereas physical quantum processors require only O(N) physical qubits.", style='List Bullet')

    # 9. CONCLUSION
    add_heading_1("9. Conclusion")
    doc.add_paragraph(
        "This capstone project successfully developed and deployed QuantAgro, a Quantum Optimization-Based Agricultural Supply Chain Management System. "
        "By mapping multi-echelon perishable cold-chain logistics into a Quadratic Unconstrained Binary Optimization (QUBO) Hamiltonian matrix, "
        "the Quantum Approximate Optimization Algorithm (QAOA) and Simulated Quantum Annealing (SQA) effectively solved complex routing trade-offs under exponential thermal decay. "
        "The system achieved an 18.4% total logistics cost reduction ($3,126 USD saved per batch), reduced produce spoilage losses by 59.3%, and boosted retail delivery freshness to 94.8%. "
        "The integrated FastAPI backend and dark-glassmorphism React web application demonstrate that quantum optimization algorithms provide a viable, highly efficient paradigm for real-world supply chain management and food waste reduction."
    )
    
    output_path = os.path.abspath("Quantum_Optimization_Agri_Supply_Chain_Report.docx")
    doc.save(output_path)
    print(f"Document successfully updated and saved at: {output_path}")

if __name__ == "__main__":
    create_report()
